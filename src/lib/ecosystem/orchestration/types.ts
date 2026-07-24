/**
 * Multi-Model Orchestration types.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.7 ("Multi-Model Orchestration"),
 *   §2 ("Multi-model orchestration" storage-mapping row: "AI Gateway already
 *   supports multi-provider routing/fallback; use it instead of hand-rolled
 *   orchestration where possible"), §0.5 (AI Gateway is the adopted mechanism).
 *
 * What this component is: a thin model-routing seam for the ecosystem's own AI
 * calls (the agent's composer, future transcription). One interface, two
 * implementations:
 *
 *   - `AiGatewayRouter` — canonical path. Hits Cloudflare AI Gateway; the
 *     provider fallback chain (Claude → GLM → Gemini per §5.7 fleet roles) is
 *     configured in the AI Gateway dashboard, NOT hand-rolled in code. This is
 *     the §5.7mandate: "using AI Gateway for provider fallback ... rather than
 *     hand-rolled logic." See `gateway.ts`.
 *
 *   - `OrchestratedComposer` — the integration point. Wraps any `ModelRouter`
 *     to satisfy the existing `AnswerComposer` seam from `agent/types.ts`, so
 *     the agent can use orchestrated multi-model generation as a drop-in.
 *     See `composer.ts`.
 *
 * What this component is NOT:
 *   - Not a hand-rolled multi-provider retry loop. §5.7 explicitly forbids that.
 *   - Not the human Ornith/GLM/Claude/Gemini weekly-cycle process from the
 *     original Hermes blueprint. Per §5.7 that is a workflow, not code.
 *   - Not a replacement for `WorkersAiComposer`. That composer is the proven
 *     single-model path and stays untouched. This component adds a parallel
 *     pluggable option, mirroring how component 8 ships two backends.
 */

// ─────────────────────────────────────────────────────────────────────
// Chat message + provider primitives
// ─────────────────────────────────────────────────────────────────────

/**
 * A single chat message. The lowest-common-denominator shape that Workers AI,
 * Anthropic, OpenAI, and Google AI all accept in some form.
 *
 * The agent composer's existing `WorkersAiComposer` already builds this shape
 * inline; pulling it up here as a shared type lets the orchestration layer
 * reason about messages without redefining them.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Provider identifier — the names §5.7 uses for the fallback fleet. Maps to
 * Cloudflare AI Gateway's per-provider URL segments. CT105 verifies the exact
 * path strings against current Cloudflare docs at wire time (AI Gateway URL
 * shapes have changed before; this union is the stable identifier layer).
 */
export type ModelProvider =
  | "workersai" // Cloudflare Workers AI (single-model default, e.g. @cf/google/gemma-4-26b-a4b-it)
  | "anthropic" // Claude family
  | "google" // Gemini family (Google AI Studio / Vertex)
  | "openai" // OpenAI family (reserved — not in current fleet, kept open for future)
  | (string & {}); // open union — future providers land without a type break

/**
 * Per-provider configuration. Different providers take different auth schemes
 * on AI Gateway — Anthropic uses `x-api-key`, Google uses `x-goog-api-key`,
 * Workers AI uses `Authorization: Bearer`, etc. The orchestration layer accepts
 * these as a map so CT105 can wire whichever subset of providers the business
 * actually uses.
 */
export interface ProviderConfig {
  /** Provider identifier from the `ModelProvider` union. */
  provider: ModelProvider;
  /** API key/secret for this provider. Passed in the provider-specific header. */
  apiKey: string;
  /**
   * Default model id for this provider. Examples:
   *   - workersai: "@cf/google/gemma-4-26b-a4b-it" (matches SP's AI Search instance)
   *   - anthropic: "claude-sonnet-4-5" or similar (CT105 picks current id)
   *   - google:    "gemini-2.0-flash" or similar (CT105 picks current id)
   * CT105 must verify current model ids at wire time — these rotate.
   */
  model?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Generate call shapes
// ─────────────────────────────────────────────────────────────────────

/**
 * Options accepted by `ModelRouter.generate()`. All optional — sensible
 * defaults are applied by implementations.
 */
export interface GenerateOptions {
  /** Override the provider's default model for this call only. */
  model?: string;
  /** Sampling temperature. Provider-default if omitted. Range typically [0, 2]. */
  temperature?: number;
  /** Cap on generated tokens. Provider-default if omitted. */
  maxTokens?: number;
  /**
   * Provider hint. AI Gateway ultimately decides routing/fallback per its
   * dashboard config; this hint selects which provider endpoint to hit when
   * the caller has a preference (e.g. transcription always wants Workers AI).
   */
  provider?: ModelProvider;
}

/**
 * Normalized generation result. Hides provider-specific response shapes behind
 * one contract — the agent composer only needs the text plus basic telemetry.
 */
export interface GenerateResult {
  /** The generated text, trimmed. Empty string on parse failure. */
  text: string;
  /** Provider that produced this result, if known (universal-fallback gateways may hide it). */
  provider?: ModelProvider;
  /** Model id that produced this result, if known. */
  model?: string;
  /** Round-trip latency in milliseconds, if measured. */
  latencyMs?: number;
  /** Why generation stopped: "stop", "length", "content-filtered", etc. Provider-specific. */
  finishReason?: string;
  /** Approximate token accounting, if the provider returned one. */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** Raw parsed JSON response, for advanced consumers. Implementations should pass through. */
  raw?: unknown;
}

// ─────────────────────────────────────────────────────────────────────
// The router interface
// ─────────────────────────────────────────────────────────────────────

/**
 * Model router — the orchestration seam.
 *
 * Contract:
 *   - `messages` is non-empty and contains at least one non-system message.
 *   - Returns a normalized `GenerateResult` on success.
 *   - Throws `OrchestrationError` on transport failure, auth failure, or
 *     empty/unparseable response. Callers (composers) decide whether to
 *     fall back to a deterministic answer or surface the error.
 *
 * Why an interface and not a class: the §5.7 mandate is "AI Gateway, not
 * hand-rolled logic," but the contract needs to stay provider-agnostic so
 * future swaps (different gateway, direct Workers AI, local model) don't
 * ripple into the composer. Same pluggable-seam tradeoff as `AnswerComposer`,
 * `ToolRouter`, `VectorSearchBackend`, and `Embedder`.
 */
export interface ModelRouter {
  generate(
    messages: ChatMessage[],
    opts?: GenerateOptions,
  ): Promise<GenerateResult>;
}

// ─────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────

/**
 * Orchestration-layer error. Mirrors the shape of `AgentError` and
 * `VectorSearchError` for consistency. `kind` lets callers branch without
 * regex-matching the message.
 */
export type OrchestrationErrorKind =
  | "auth" // 4xx from provider (bad key, forbidden)
  | "transport" // network failure, DNS, timeout
  | "provider" // provider returned an error response (5xx, rate-limit)
  | "parse" // response received but couldn't extract text
  | "config" // missing required config (gateway id, providers map empty)
  | "empty"; // messages array was empty or all-empty content

export class OrchestrationError extends Error {
  readonly kind: OrchestrationErrorKind;
  readonly status?: number;
  readonly provider?: ModelProvider;

  constructor(
    kind: OrchestrationErrorKind,
    message: string,
    opts?: { status?: number; provider?: ModelProvider; cause?: unknown },
  ) {
    super(message, opts?.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "OrchestrationError";
    this.kind = kind;
    this.status = opts?.status;
    this.provider = opts?.provider;
  }
}
