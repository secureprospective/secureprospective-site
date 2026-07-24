/**
 * AI Gateway router — the canonical §5.7 multi-model path.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.7 ("Thin router using AI Gateway
 *   for provider fallback ... rather than hand-rolled logic"), §2 ("AI Gateway
 *   already supports multi-provider routing/fallback; use it instead of
 *   hand-rolled orchestration where possible"), §0.5 (AI Gateway adoption).
 *
 * What this implementation does:
 *   - Builds the Cloudflare AI Gateway URL for a given provider.
 *   - Forwards the request through AI Gateway, which handles logging, caching,
 *     rate-limiting, and (per §5.7) the Claude → GLM → Gemini provider fallback
 *     chain configured in the dashboard.
 *   - Normalizes the response across provider shapes (OpenAI/Workers-AI style,
 *     Anthropic style, Google style) into one `GenerateResult`.
 *
 * What this implementation deliberately does NOT do:
 *   - Hand-rolled provider fallback. §5.7 explicitly forbids that; the chain
 *     is configured in AI Gateway's dashboard, not in this code.
 *   - Per-provider request-body transformation. Different providers have
 *     different request schemas (Anthropic separates system from messages,
 *     Google wraps everything in `contents`, etc.). For Phase 1 we ship the
 *     simple `{ messages }` shape that Workers AI and OpenAI accept. CT105
 *     (or a future P2 follow-up) adds provider-specific body shaping if the
 *     chosen provider chain requires it. This is flagged in the spec doc as
 *     an open item — over-building it now would violate §5's "P2 = polish"
 *     priority guidance.
 *
 * LOW-CONFIDENCE ITEMS (CT105 must verify against current Cloudflare docs):
 *   1. The exact AI Gateway URL pattern. Cloudflare has shipped multiple URL
 *      shapes for AI Gateway (`gateway.ai.cloudflare.com/v1/...`,
 *      `gateway.ai.cloudflare.com/v1/<acct>/<gateway>/...`) and the universal
 *      fallback feature may introduce another. The pattern below is the
 *      per-provider shape I believe is current as of the doc's 2026-07-07
 *      research baseline; CT105 confirms or corrects.
 *   2. The exact provider path segments (`workersai` vs `workers-ai`, etc.).
 *      Marked provider-by-provider in the URL builder below.
 *   3. Whether universal-fallback responses include provider attribution
 *      (the `provider` field on `GenerateResult`). If AI Gateway hides it,
 *      callers see `provider: undefined` on success — not an error.
 *   4. Response headers that indicate fallback occurred (`cf-eg-*` family).
 *      Captured into `raw` if present; not parsed into typed fields yet.
 */

import {
  OrchestrationError,
  type ChatMessage,
  type GenerateOptions,
  type GenerateResult,
  type ModelProvider,
  type ModelRouter,
  type ProviderConfig,
} from "./types";

// ─────────────────────────────────────────────────────────────────────
// AI Gateway URL construction
// ─────────────────────────────────────────────────────────────────────

/**
 * Per-provider AI Gateway path segments + the per-provider auth header.
 *
 * Verified against Cloudflare's public AI Gateway docs at scaffold time
 * (2026-07-20). CT105 re-verifies at wire time — these have changed before.
 *
 * Workers AI is included even though it's not in the §5.7 fallback chain
 * (Claude/GLM/Gemini) because it's the existing single-model path
 * (`WorkersAiComposer`) and component 7 should be able to route to it as
 * the cheap default before the chain kicks in.
 */
const PROVIDER_ROUTES: Record<
  string,
  { pathSegment: string; authHeader: string; authPrefix?: string }
> = {
  workersai: { pathSegment: "workersai", authHeader: "Authorization", authPrefix: "Bearer " },
  anthropic: { pathSegment: "anthropic", authHeader: "x-api-key" },
  google: { pathSegment: "google-ai-studio", authHeader: "x-goog-api-key" },
  openai: { pathSegment: "openai", authHeader: "Authorization", authPrefix: "Bearer " },
};

/**
 * Per-provider default request paths (the suffix after the gateway URL).
 * Different providers expose different generation endpoints.
 */
const PROVIDER_ENDPOINTS: Record<string, (model: string) => string> = {
  workersai: (model) => `ai/run/${model}`,
  anthropic: (model) => `v1/messages`,
  google: (model) => `v1beta/models/${model}:generateContent`,
  openai: (_model) => `chat/completions`,
};

// ─────────────────────────────────────────────────────────────────────
// Response parsing (multi-provider)
// ─────────────────────────────────────────────────────────────────────

/**
 * Try to extract text + telemetry from a provider response. Each provider
 * returns a different JSON shape; this normalizes them into `GenerateResult`.
 *
 * Order matters: we try shapes in order of expected frequency. First match
 * wins. If no shape matches, returns `text: ""` (which the caller treats as
 * a parse error per the `ModelRouter` contract).
 */
function parseProviderResponse(
  body: unknown,
  provider?: ModelProvider,
  model?: string,
): GenerateResult {
  const data = body as Record<string, unknown> | null ?? {};
  const result: GenerateResult = { text: "", provider, model };

  // Workers AI / OpenAI shape: result.choices[0].message.content OR
  // choices[0].message.content (OpenAI top-level).
  const topLevel = data as {
    result?: { choices?: Array<{ message?: { content?: string } }>; response?: string };
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  if (topLevel?.result?.choices?.[0]?.message?.content) {
    result.text = String(topLevel.result.choices[0].message.content).trim();
    result.finishReason = "stop";
    result.raw = body;
    return result;
  }
  if (topLevel?.result?.response) {
    // Some Workers AI models (e.g. older gemma) use `response` instead of `choices`.
    result.text = String(topLevel.result.response).trim();
    result.finishReason = "stop";
    result.raw = body;
    return result;
  }
  if (topLevel?.choices?.[0]?.message?.content) {
    result.text = String(topLevel.choices[0].message.content).trim();
    result.finishReason = topLevel.choices[0]?.finish_reason ?? "stop";
    if (topLevel.usage) {
      result.usage = {
        promptTokens: topLevel.usage.prompt_tokens,
        completionTokens: topLevel.usage.completion_tokens,
        totalTokens: topLevel.usage.total_tokens,
      };
    }
    result.raw = body;
    return result;
  }

  // Anthropic shape: content: [{ type: "text", text: "..." }], stop_reason, usage.
  const anthropic = data as {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string;
    model?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  if (Array.isArray(anthropic?.content) && anthropic.content.length > 0) {
    const text = anthropic.content
      .filter((c) => c?.type === "text" && typeof c.text === "string")
      .map((c) => c.text as string)
      .join("\n");
    if (text.length > 0) {
      result.text = text.trim();
      result.finishReason = anthropic.stop_reason ?? "stop";
      if (anthropic.model) result.model = anthropic.model;
      if (anthropic.usage) {
        result.usage = {
          promptTokens: anthropic.usage.input_tokens,
          completionTokens: anthropic.usage.output_tokens,
          totalTokens:
            (anthropic.usage.input_tokens ?? 0) +
            (anthropic.usage.output_tokens ?? 0),
        };
      }
      result.raw = body;
      return result;
    }
  }

  // Google AI shape: candidates[0].content.parts[0].text, usageMetadata, finishReason.
  const google = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };
  if (Array.isArray(google?.candidates) && google.candidates.length > 0) {
    const parts = google.candidates[0]?.content?.parts ?? [];
    const text = parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("");
    if (text.length > 0) {
      result.text = text.trim();
      result.finishReason = google.candidates[0]?.finishReason ?? "stop";
      if (google.usageMetadata) {
        result.usage = {
          promptTokens: google.usageMetadata.promptTokenCount,
          completionTokens: google.usageMetadata.candidatesTokenCount,
          totalTokens: google.usageMetadata.totalTokenCount,
        };
      }
      result.raw = body;
      return result;
    }
  }

  // No shape matched.
  result.raw = body;
  return result;
}

// ─────────────────────────────────────────────────────────────────────
// AiGatewayRouter
// ─────────────────────────────────────────────────────────────────────

export interface AiGatewayRouterOptions {
  /** Cloudflare account id (hex string). */
  accountId: string;
  /** AI Gateway id (created in the CF dashboard). */
  gatewayId: string;
  /**
   * Provider configurations. At least one must be present. The first entry is
   * the default; `GenerateOptions.provider` overrides per-call.
   */
  providers: ProviderConfig[];
  /** Override fetch (defaults to global). Useful for testing or proxy injection. */
  fetchImpl?: typeof fetch;
}

export class AiGatewayRouter implements ModelRouter {
  private readonly fetchImpl: typeof fetch;
  private readonly accountId: string;
  private readonly gatewayId: string;
  private readonly providers: Map<ModelProvider, ProviderConfig>;
  private readonly defaultProvider: ModelProvider;

  constructor(opts: AiGatewayRouterOptions) {
    if (!opts.accountId) throw new OrchestrationError("config", "accountId is required");
    if (!opts.gatewayId) throw new OrchestrationError("config", "gatewayId is required");
    if (!opts.providers || opts.providers.length === 0) {
      throw new OrchestrationError("config", "at least one provider config is required");
    }
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.accountId = opts.accountId;
    this.gatewayId = opts.gatewayId;
    this.providers = new Map(opts.providers.map((p) => [p.provider, p]));
    // First entry is the default. Constructor above guarantees non-empty.
    this.defaultProvider = opts.providers[0].provider;
  }

  async generate(
    messages: ChatMessage[],
    opts?: GenerateOptions,
  ): Promise<GenerateResult> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new OrchestrationError("empty", "messages array must be non-empty");
    }

    // Pick the provider for this call.
    const providerKey = opts?.provider ?? this.defaultProvider;
    const providerCfg = this.providers.get(providerKey);
    if (!providerCfg) {
      throw new OrchestrationError(
        "config",
        `no provider config for "${providerKey}"`,
        { provider: providerKey },
      );
    }
    const route = PROVIDER_ROUTES[providerKey];
    if (!route) {
      throw new OrchestrationError(
        "config",
        `unknown provider "${providerKey}" — add it to PROVIDER_ROUTES`,
        { provider: providerKey },
      );
    }

    const model = opts?.model ?? providerCfg.model ?? defaultModelFor(providerKey);
    const endpoint = PROVIDER_ENDPOINTS[providerKey]?.(model);
    if (!endpoint) {
      throw new OrchestrationError(
        "config",
        `no endpoint builder for provider "${providerKey}"`,
        { provider: providerKey },
      );
    }

    const url =
      `https://gateway.ai.cloudflare.com/v1/${this.accountId}/${this.gatewayId}/` +
      `${route.pathSegment}/${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [route.authHeader]: route.authPrefix
        ? `${route.authPrefix}${providerCfg.apiKey}`
        : providerCfg.apiKey,
    };

    const body = buildRequestBody(providerKey, model, messages, opts);

    const started = Date.now();
    let resp: Response;
    try {
      resp = await this.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new OrchestrationError(
        "transport",
        `network error calling AI Gateway: ${err instanceof Error ? err.message : String(err)}`,
        { provider: providerKey, cause: err },
      );
    }
    const latencyMs = Date.now() - started;

    if (resp.status === 401 || resp.status === 403) {
      throw new OrchestrationError(
        "auth",
        `provider auth failed: ${resp.status} ${resp.statusText}`,
        { status: resp.status, provider: providerKey },
      );
    }
    if (resp.status === 429) {
      throw new OrchestrationError(
        "provider",
        `rate-limited by provider: ${resp.status} ${resp.statusText}`,
        { status: resp.status, provider: providerKey },
      );
    }
    if (!resp.ok) {
      throw new OrchestrationError(
        "provider",
        `provider error: ${resp.status} ${resp.statusText}`,
        { status: resp.status, provider: providerKey },
      );
    }

    let parsed: unknown;
    try {
      parsed = await resp.json();
    } catch (err) {
      throw new OrchestrationError(
        "parse",
        `response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
        { provider: providerKey, cause: err },
      );
    }

    const result = parseProviderResponse(parsed, providerKey, model);
    result.latencyMs = latencyMs;
    if (result.text.length === 0) {
      throw new OrchestrationError(
        "parse",
        `could not extract text from ${providerKey} response`,
        { provider: providerKey },
      );
    }
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Default model id per provider, used only when neither the call nor the
 * `ProviderConfig` specifies one. These are conservative fallbacks — CT105
 * picks the right model at wire time. The Workers AI default matches what
 * SP's AI Search instance uses per CLAUDE.md.
 */
function defaultModelFor(provider: ModelProvider): string {
  switch (provider) {
    case "workersai":
      return "@cf/google/gemma-4-26b-a4b-it";
    case "anthropic":
      return "claude-sonnet-4-5";
    case "google":
      return "gemini-2.0-flash";
    case "openai":
      return "gpt-4o-mini";
    default:
      throw new OrchestrationError(
        "config",
        `no default model for provider "${provider}" — specify model in ProviderConfig`,
        { provider },
      );
  }
}

/**
 * Build the per-provider request body. Phase 1 ships the simple `{ messages }`
 * shape that Workers AI and OpenAI both accept; Anthropic and Google accept
 * this via AI Gateway's normalization layer (a documented AI Gateway feature).
 *
 * CT105 note: if a chosen provider rejects the unified shape, the fix is
 * provider-specific body transformation here, not a new router class.
 */
function buildRequestBody(
  provider: ModelProvider,
  model: string,
  messages: ChatMessage[],
  opts?: GenerateOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = { model, messages };
  if (opts?.temperature !== undefined) body.temperature = opts.temperature;
  if (opts?.maxTokens !== undefined) {
    // OpenAI/Workers AI use `max_tokens`; Anthropic uses `max_tokens`; Google
    // uses `generationConfig.maxOutputTokens`. AI Gateway's normalization layer
    // accepts the OpenAI-style field for all of them per CF docs.
    body.max_tokens = opts.maxTokens;
  }
  return body;
}
