# Component 7 — Multi-Model Orchestration

**Status:** Implemented (P2 — first component past the §8 P0 slice, per §5 priority order. Routing polish on top of a working agent, not a blocker to having one).
**Last updated:** 2026-07-20.
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5.7 ("Multi-Model Orchestration"), §2 ("Multi-model orchestration" storage-mapping row: "AI Gateway already supports multi-provider routing/fallback; use it instead of hand-rolled orchestration where possible"), §0.5 (AI Gateway adopted as the multi-model mechanism).

## What this component is

A thin model-routing layer for the ecosystem's own AI calls. Per §5.7:

> Thin router using AI Gateway for provider fallback (Claude → GLM → Gemini, matching existing fleet roles) rather than hand-rolled logic. This is about model routing for the ecosystem's own AI calls (agent, transcription) — not the human Ornith/GLM/Claude/Gemini weekly-cycle process from the original doc, which is a workflow, not code.

Two pieces:

1. **`ModelRouter` interface + `AiGatewayRouter`** — the canonical path. One normalized `generate(messages, opts)` call hits Cloudflare AI Gateway; the provider fallback chain (Claude → GLM → Gemini per §5.7 fleet roles) is configured in the AI Gateway dashboard, NOT hand-rolled in this code. This is the §5.7 mandate.
2. **`OrchestratedComposer`** — the integration point with the existing agent (component 5). Wraps any `ModelRouter` to satisfy the existing `AnswerComposer` seam, so the agent can use multi-model routing as a drop-in replacement for `TemplatedComposer` or `WorkersAiComposer`.

## What's implemented

| File | Role |
| ── | ── |
| `src/lib/ecosystem/orchestration/types.ts` | `ChatMessage`, `ModelProvider`, `ProviderConfig`, `GenerateOptions`, `GenerateResult`, `ModelRouter` interface, `OrchestrationError` |
| `src/lib/ecosystem/orchestration/gateway.ts` | `AiGatewayRouter` — canonical AI Gateway path; per-provider URL/auth rules; multi-provider response normalization |
| `src/lib/ecosystem/orchestration/composer.ts` | `OrchestratedComposer` — wraps any `ModelRouter` to satisfy the existing `AnswerComposer` seam from component 5 |
| `src/lib/ecosystem/orchestration/index.ts` | Barrel re-export |

### Public API

```ts
// The routing seam
interface ModelRouter {
  generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<GenerateResult>;
}

// Canonical §5.7 implementation
class AiGatewayRouter implements ModelRouter {
  constructor(opts: {
    accountId: string;
    gatewayId: string;
    providers: ProviderConfig[];   // first entry is the default
    fetchImpl?: typeof fetch;      // inject for testing
  })
}

// Integration with the agent (component 5)
class OrchestratedComposer implements AnswerComposer {
  constructor(opts: {
    router: ModelRouter;
    generateOpts?: GenerateOptions;
    buildSystemPrompt?: (business: BusinessConfig) => string;
  })
}
```

## Design decisions

1. **No hand-rolled provider fallback chain.** §5.7 explicitly forbids this — "using AI Gateway for provider fallback ... rather than hand-rolled logic." The Claude → GLM → Gemini ordering is configured in the AI Gateway dashboard, not in code. This is the most important decision in the component; it shapes everything else. The trade-off: bird cannot fully exercise the fallback behavior in tests (it'd need a real AI Gateway), but that's CT105's wiring lane anyway. The contract is here; the dashboard config is the runtime.

2. **Two composers coexist; `WorkersAiComposer` is untouched.** Component 5 already ships `TemplatedComposer` (deterministic default) + `WorkersAiComposer` (single-model direct REST). This component adds `OrchestratedComposer` as a third option that delegates the LLM call to an injected `ModelRouter`. CT105 picks the right composer at construction time per deployment. Mirrors how component 8 ships two backends (`VectorizeBackend` + `AISearchBackend`) behind one interface — multiple impls, caller picks at deploy.

3. **Multi-provider response parsing in one router, not per-provider routers.** Workers AI, OpenAI, Anthropic, and Google all return different JSON shapes. Rather than shipping one router per provider (4 classes), `AiGatewayRouter` parses all four shapes in one `parseProviderResponse()` function. Trade-off: the function is shape-matcher soup, but the alternative (4 routers + a dispatch layer) would be 4× the code for the same external contract. Marked as a refactor candidate if provider-specific quirks accumulate.

4. **Per-provider URL + auth rules.** Each AI Gateway provider has its own path segment (`workersai`, `anthropic`, `google-ai-studio`, `openai`) and its own auth header (`Authorization: Bearer`, `x-api-key`, `x-goog-api-key`). Both are data-modeled in `PROVIDER_ROUTES` so adding a provider is a one-row change. New providers land without touching the routing logic.

5. **`OrchestratedComposer` mirrors `WorkersAiComposer` line-for-line on the no-context + system-prompt paths.** Same refusal string, same prompt construction, same extractText helper. The only difference is *who makes the LLM call*. This means CT105 can swap `WorkersAiComposer` → `OrchestratedComposer` at construction time without any other code change, and the agent's observable behavior stays identical modulo which provider answered.

6. **Phase 1 ships unified `{ messages }` request body.** Different providers accept different request schemas (Anthropic separates system from messages, Google wraps in `contents`, etc.). For Phase 1 we ship the simple `{ model, messages, ...opts }` shape that Workers AI and OpenAI both accept. AI Gateway's documented normalization layer handles provider differences for the others. CT105 adds provider-specific body shaping here if the chosen chain requires it — over-building it now would violate §5's "P2 = polish" priority guidance.

## LOW-CONFIDENCE ITEMS (CT105 must verify against current Cloudflare docs)

These are the four places where I built against my understanding of AI Gateway's behavior but couldn't verify against live docs. AI Gateway evolves fast; Christopher/CT105 confirms or corrects at wire time.

1. **AI Gateway URL pattern.** I used `https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/{provider}/{endpoint}` — the per-provider shape I believe is current as of the 2026-07-07 research baseline in ARCHITECTURE.md §0.5. Cloudflare has shipped multiple URL shapes for AI Gateway; the universal fallback feature may introduce another. Verify against `developers.cloudflare.com/ai-gateway/` at wire time.

2. **Exact provider path segments.** I used `workersai`, `anthropic`, `google-ai-studio`, `openai`. The Workers AI segment in particular has shifted between `workersai` / `workers-ai` / `cf-workers-ai` in past revisions of the docs. Verify each before relying on it.

3. **Universal-fallback provider attribution.** When AI Gateway's fallback chain kicks in (e.g. Claude 429s → routes to GLM), does the response include which provider actually answered? I assumed it might not, so `GenerateResult.provider` is optional. If AI Gateway returns provider attribution in headers (cf-mitigated, cf-eg-*), capture them and populate the field. Currently the raw response is captured into `raw` regardless.

4. **AI Gateway's request-body normalization.** I assumed AI Gateway accepts the OpenAI-style `{ messages }` shape for all providers it fronts. This is a documented feature ("drop-in replacement for OpenAI-compatible endpoints"), but the exact compatibility surface per provider should be verified for the specific chain CT105 configures. If a provider rejects the unified shape, the fix is provider-specific body transformation in `buildRequestBody()` (gateway.ts) — not a new router class.

## How downstream consumes it

- **`functions/api/ask.ts` (eventual refactor, NOT in this pass):** per §3 "Existing chatbot" row, ask.ts becomes a thin wrapper around the agent. If CT105 chooses multi-model routing for the production chatbot, the construction looks like:
  ```ts
  import { Agent } from "../../src/lib/ecosystem/agent";
  import { AiGatewayRouter, OrchestratedComposer } from "../../src/lib/ecosystem/orchestration";
  import { McpServer, STANDARD_TOOLS } from "../../src/lib/ecosystem/mcp";

  const router = new AiGatewayRouter({
    accountId: env.CF_ACCOUNT_ID,
    gatewayId: env.AI_GATEWAY_ID,
    providers: [
      { provider: "anthropic", apiKey: env.ANTHROPIC_API_KEY, model: "claude-sonnet-4-5" },
      { provider: "google",    apiKey: env.GOOGLE_API_KEY,    model: "gemini-2.0-flash" },
      { provider: "workersai", apiKey: env.CF_API_TOKEN,      model: "@cf/google/gemma-4-26b-a4b-it" },
    ],
  });
  const agent = new Agent(server, ctx, { composer: new OrchestratedComposer({ router }) });
  ```
  No other code changes — the agent, tools, MCP server, graph, vector search are all already constructed against the right contracts. The fallback order above is set in code as the providers list order, BUT the actual cross-provider fallback (Claude 429s → GLM answers) is configured in the AI Gateway dashboard.

- **Component 3 (transcription):** when it goes live with Workers AI Whisper, it can either use `WorkersAiComposer` (single-model, simpler) or an `AiGatewayRouter` configured with Whisper as the model. Multi-model routing is overkill for transcription (Whisper IS the right model for the audio we have); single-model is fine here. Component 3 stays a dark stub for now per §5 priority.

- **Component 10 (testing/monitoring):** the `toolCalls` + `toolResults` arrays in `AgentResponse` already carry the reasoning trace; adding `GenerateResult.provider` + `GenerateResult.latencyMs` to the trace when an `OrchestratedComposer` is used gives component 10 a free per-question cost/latency signal. Future P1 work.

## Verification

- `npm run build` — passes.
- `tsc --noEmit` (via tsconfig) — zero new errors (only pre-existing `functions/api/{ask,lead}.ts` errors from LEAD #3).
- **Integration smoke test (`/tmp/opencode/smoke-orchestration.mjs`, 83 checks)** covers:
  - **Layer 1 — OrchestratedComposer (8 checks):** real answer composition, refusal on empty/all-error/whitespace-only context, error-result skipping, generateOpts forwarding, custom buildSystemPrompt override, constructor validation, multi-result concatenation.
  - **Layer 2a — URL + auth construction (16 checks):** per-provider URL paths (workersai, anthropic, google, openai) + per-provider auth headers (Authorization Bearer vs x-api-key vs x-goog-api-key).
  - **Layer 2b — Request body (9 checks):** model/messages/options shape, opts.model override, opts.provider override, default-provider selection.
  - **Layer 2c — Multi-provider response parsing (16 checks):** Workers AI choices shape + alt `result.response` shape, OpenAI shape with usage, Anthropic multi-text-parts shape, Google candidates/parts shape.
  - **Layer 2d — Error handling (12 checks):** 401/403 → auth, 429/500 → provider, network failure → transport, unparseable → parse, empty messages → empty, unknown provider → config, constructor validation, error provider/status attribution.
  - **Layer 3 — Agent integration (2 checks):** `OrchestratedComposer` satisfies the existing `AnswerComposer` contract.
- **Regression check:** all 5 prior P0 smoke suites (266 checks total) still pass unchanged — adding this component did not break the §8 thread.

## Open items / TODOs

- **Per-provider request-body shaping.** Phase 1 ships unified `{ messages }` only. If a chosen provider rejects it (likely Anthropic and Google without AI Gateway normalization), add per-provider body builders in `buildRequestBody()` (gateway.ts). Flagged in LOW-CONFIDENCE item #4.
- **Streaming.** `ModelRouter.generate()` returns a single `Promise<GenerateResult>` — no streaming. Workers AI, Anthropic, and OpenAI all support SSE streaming for text generation; if the chatbot widget ever needs streaming UX, the `ModelRouter` interface gains a `generateStream()` method returning `AsyncIterable<string>`. P2+ follow-up, not Phase 1.
- **Cost ledgering.** `GenerateResult.usage` captures per-call token counts; a future `CostLedger` could aggregate these for cost monitoring. Belongs in component 10 (testing/monitoring), not here.
- **AI Gateway caching.** AI Gateway supports response caching by request hash. This router doesn't set cache headers explicitly; CT105 can enable caching at the gateway level if deterministic Q&A patterns emerge.
- **Confidence scoring.** `GenerateResult` doesn't carry a self-confidence signal (logprobs, refusal-classifier score). Useful for "low confidence → offer human handoff." P1+ pattern, belongs in the agent not the router.

## Hand-off to CT105

Two things to wire, both isolated:

### 1. AI Gateway instance + provider keys

Create a Cloudflare AI Gateway in the account; note the `gatewayId`. Configure the provider fallback chain in the dashboard (Claude → GLM → Gemini order per §5.7 fleet roles, with Workers AI as the cheap first attempt if appropriate).

Set Cloudflare Pages secrets:
- `CF_ACCOUNT_ID`
- `AI_GATEWAY_ID`
- `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `CF_API_TOKEN` (already exists for the chatbot) — whichever subset of providers the chain uses.

### 2. Composer swap in the future ask.ts refactor

Per §3 "Existing chatbot" row, the refactor happens only after:
1. Christopher reviews this branch.
2. CT105 wires real bindings (D1 db, Vectorize/AI Search, Agents SDK, AI Gateway + provider keys).
3. The agent is exercised against REAL SP data in a preview deploy.
4. The existing adversarial-refusal test (chatbot refuses even on tangential chunks) is re-run — must still pass.

If CT105 picks multi-model routing for the production chatbot, swap `WorkersAiComposer` → `OrchestratedComposer({ router: new AiGatewayRouter({...}) })` at construction time. Nothing else changes. If single-model Workers AI is sufficient, leave `WorkersAiComposer` in place — this component ships in parallel, not as a replacement.
