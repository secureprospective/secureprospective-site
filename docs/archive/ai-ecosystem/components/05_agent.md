# Component 5 — AI Agent

**Status:** Implemented (P0, fifth and final component per §5 priority order — completes the §8 end-product thread).
**Last updated:** 2026-07-20.
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5 (component 5), §1 (end product), §2 ("Workers AI + AI Gateway, no LangChain"), §3 ("Existing chatbot" deployment row — agent must be proven independently before ask.ts refactors onto it), §8 (handoff — "catalog → graph → vector search → MCP tool call → agent answer, end to end, on fake data").

## What this component is

The capstone of the P0 slice — the piece that ties components 1, 2, 8, and 9 together into the thing that actually answers a user question. Given a natural-language question, the agent:

1. **Routes** — decides which MCP tool(s) to call (component 2).
2. **Invokes** — calls each selected tool with the shared context (business + graph + vector).
3. **Composes** — synthesizes a natural-language answer from the tool results, respecting business voice.

When this lands, the §8 architecture-doc verification target is met: a working P0 thread on fake data, not 10 isolated stubs.

Per §1 end-product item 1 + §3 deployment map "Existing chatbot" row: `functions/api/ask.ts` will eventually become a thin SP-specific wrapper around this agent core — but ONLY after the agent is proven independently (this component) AND after CT105's review (next session). The live chatbot is not touched here; no regression risk.

## What's implemented

| File | Role |
| ── | ── |
| `src/lib/ecosystem/agent/types.ts` | `AgentRequest`, `AgentResponse`, `ToolRouter`, `AnswerComposer` interfaces |
| `src/lib/ecosystem/agent/router.ts` | `defaultHeuristicRouter` — deterministic, keyword-based tool selection |
| `src/lib/ecosystem/agent/composer.ts` | `TemplatedComposer` (working default) + `WorkersAiComposer` (real impl shape for CT105 wiring) |
| `src/lib/ecosystem/agent/agent.ts` | `Agent` class — orchestrates router → invoke → compose; carries tool-call trace |
| `src/lib/ecosystem/agent/index.ts` | Barrel re-export |

### Public API

```ts
class Agent {
  constructor(mcpServer: McpServer, ctx: McpToolContext, opts?: {
    router?: ToolRouter       // default: defaultHeuristicRouter
    composer?: AnswerComposer // default: TemplatedComposer
  })
  answer(request: AgentRequest | string): Promise<AgentResponse>
}

interface AgentResponse {
  answer: string            // final natural-language answer
  toolCalls: McpToolCall[]  // what the router picked, in invocation order
  toolResults: McpToolResult[]  // raw tool outputs, parallel to toolCalls
  noContext: boolean        // true when all tools errored or returned empty
}
```

Both `router` and `composer` are constructor-injected — swapping either for a real LLM-backed implementation changes one argument, nothing else.

## Design decisions

1. **Heuristic router for Phase 1, not LLM function-calling.** §5.5 says "decide which MCP tool(s) to call" — it doesn't specify HOW. A keyword-based heuristic is:
   - Deterministic → fully testable without an LLM binding.
   - Zero-cost → no Workers AI call per question just to route.
   - Consistent with §2 ("No LangChain — unnecessary overhead for tool-call-based flows").

   The `ToolRouter` contract is pluggable — a future LLM-backed router (Workers AI function calling) drops in with no other code changes. Documented as an open item.

2. **Two composers ship; `TemplatedComposer` is the default.** A template-based composer that forwards tool result text framed by business voice is not a substitute for an LLM in production — it doesn't synthesize or rephrase. But it IS a working answer when no LLM binding exists, and it satisfies §8's requirement that the P0 slice produce a real answer end-to-end. `WorkersAiComposer` provides the real impl shape (mirrors `ask.ts` lines 99-115 — same REST pattern, same message structure, business.voice in the system prompt). CT105 wires the binding; the class is here so the contract is unambiguous.

3. **`noContext` flag reflects "all tools errored or returned empty," not "graph had no matches."** Subtle but important: when the graph legitimately has no matches for a query, the tools return "No X found for ..." as **success text** (not errors). The composer forwards that as a real answer — correct behavior, because "no matches" IS a valid response. The true `noContext = true` case is when every tool either threw OR returned empty content — that's the "we have genuinely no information, escalate / refuse" signal. Matches the spirit of `ask.ts`'s REFUSAL gate (lines 16, 93-95) without coupling to its specific wording.

4. **`answer()` never throws for runtime failures.** Tool errors → `isError` tool result → composer refusal → `noContext: true` response. Only programmer errors (empty/null question) throw `AgentError`. This makes the agent safe to drop into an HTTP handler without wrapping try/catch — auth/transport errors stay one layer up.

5. **Single-turn for Phase 1.** Multi-turn conversation state (history, context carry-over, follow-up handling) is intentionally NOT modeled. The chatbot widget (`src/components/ChatWidget.astro`) handles the conversational UI layer today; the agent core is the Q&A engine underneath. Multi-turn is a P1+ follow-up, flagged in open items.

6. **Sequential tool invocation.** Phase 1 invokes tools in order; `Promise.all` parallelism is an optimization that doesn't change semantics. The router rarely returns >1 tool today anyway.

## How downstream consumes it

- **`functions/api/ask.ts` (eventual refactor, NOT in this pass):** per §3 "Existing chatbot" row, ask.ts becomes a thin wrapper that constructs an `Agent` with real bindings and forwards the question. The refactor is CT105's job after Christopher reviews this branch and the agent is independently proven (here). Gate: chatbot still answers correctly in the browser + the existing adversarial-refusal test still passes.
- **Component 6 (CRM/booking):** the agent's `booking_initiation` capability (§5.5) stubs out to component 6's `NullAdapter` — when booking is added, the router learns a new `create_booking` tool call and the composer hands off. Out of scope for Phase 1.
- **Component 10 (testing/monitoring):** the `toolCalls` + `toolResults` arrays in `AgentResponse` are observability gold — every agent answer carries its full reasoning trace. Structured logging of these is a component-10 addition.

## Verification

- `npm run build` — passes.
- `tsc --noEmit` — zero new errors (only pre-existing `functions/api/{ask,lead}.ts` errors from LEAD #3).
- **Integration smoke test (`/tmp/opencode/smoke-agent.mjs`, 44 checks)** — exercises the **full §8 P0 thread end-to-end**:
  - Real catalog (`loadBusinessConfig`) → real KnowledgeGraph against MockD1 with SP-like seed data → real VectorSearch with `AISearchBackend` + fake client → real McpServer with 5 standard tools → **real Agent producing a real natural-language answer**.
  - Routing: 8 question patterns routed to the correct tool (pricing extraction, service catalog intent, FAQ intent, common-questions intent, knowledge_query fallback).
  - End-to-end on a pricing question: agent answer contains the seeded price (`$5,000`) and the business name — the full chain works.
  - No-context path: forced via erroring tool, agent returns deterministic refusal mentioning business + "don't have information."
  - Input validation: empty/whitespace/null questions throw `AgentError`.
  - Pluggability: custom composer + custom router both override defaults cleanly.
  - Observability: `toolCalls` and `toolResults` arrays present, parallel, well-formed.

## Open items / TODOs

- **LLM-backed router** — replace `defaultHeuristicRouter` with a Workers AI function-calling router when binding is available. Same `ToolRouter` contract; no other code changes.
- **LLM-backed composer wiring** — CT105 instantiates `WorkersAiComposer` with real `accountId` + `apiToken` from Cloudflare Pages secrets. Optional: route through AI Gateway for multi-model fallback per §2 "Multi-model orchestration" row.
- **Multi-turn conversation state** — P1+ follow-up. Add `ConversationHistory` type, carry last N turns into the composer's context, handle follow-up pronouns ("it", "that service"). Not Phase 1.
- **Booking handoff** — when component 6 lands a real CRM adapter, teach the router to recognize booking intent ("book", "schedule", "appointment") and dispatch a `create_booking` tool call.
- **Cost/latency budget** — once real LLM composer is wired, instrument actual per-question Workers AI cost. Phase 1 heuristic router keeps routing free; only composition costs.
- **Confidence scoring** — `AgentResponse` could carry a confidence signal (tool result count, semantic similarity scores, composer self-assessment). Useful for "low confidence → offer human handoff." P1+ pattern.

## Hand-off to CT105

Two seams, both already-shaped:

### 1. Swap `TemplatedComposer` → `WorkersAiComposer` at construction time

```ts
// In the future ask.ts refactor (CT105's job):
import { Agent, WorkersAiComposer } from "../../src/lib/ecosystem/agent";
import { McpServer, STANDARD_TOOLS } from "../../src/lib/ecosystem/mcp";
// ... (ctx construction with real bindings — see component 2 hand-off) ...

const server = new McpServer();
for (const t of STANDARD_TOOLS) server.registerTool(t);

const agent = new Agent(server, ctx, {
  composer: new WorkersAiComposer({
    accountId: env.CF_ACCOUNT_ID,
    apiToken: env.CF_API_TOKEN,
    // model defaults to "@cf/google/gemma-4-26b-a4b-it" (matches SP's AI Search instance per CLAUDE.md)
  }),
});

const { answer } = await agent.answer(question);
return json({ answer });
```

No other code changes — the agent, tools, MCP server, graph, and vector search are all already constructed against the right contracts.

### 2. ask.ts refactor gate (per §3 "Existing chatbot" row)

The live chatbot (`functions/api/ask.ts`) is NOT touched in this pass. The refactor happens only after:
1. Christopher reviews the 28 untracked files in this branch.
2. CT105 wires real bindings (D1 db, Vectorize index or AI Search instance, `agents` SDK, `WorkersAiComposer` model + secrets).
3. The agent is exercised against REAL SP data (not seed fixtures) in a preview deploy.
4. The existing adversarial-refusal test (chatbot refuses even on tangential chunks) is re-run against the agent — it must still pass.

Only then does ask.ts become a one-line wrapper around `new Agent(...)`. Until then, the live chatbot keeps using its proven inline retrieve→generate.
