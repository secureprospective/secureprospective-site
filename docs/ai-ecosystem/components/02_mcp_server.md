# Component 2 — MCP Server

**Status:** Implemented (P0, fourth component per §5 priority order — after component 9 catalog + component 1 knowledge graph + component 8 vector search).
**Last updated:** 2026-07-20.
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5 (component 2), §0.5 (security research — load-bearing for the auth design), §2 (storage mapping), §3 (deployment map).
**Source blueprint:** `docs/from-hermes/CT105/COMPONENTS/02_MODEL_CONTEXT_PROTOCOL.md` (Python `mcp-sdk` → Cloudflare Agents SDK adaptation).

## What this component is

Public-facing MCP (Model Context Protocol) server exposing this business's structured knowledge to external AI agents. MCP is JSON-RPC 2.0; a server advertises "tools" (named functions with JSON Schema inputs) that calling agents discover via `tools/list` and invoke via `tools/call`. This is the literal mechanism behind §1's "AI-mediated bookings / AI citation" success metrics — other AIs (ChatGPT, Perplexity, a customer's own agent) query SP's knowledge directly instead of scraping HTML.

The 5 tools §5.2 names for Phase 1 are all backed by the knowledge graph (component 1) and/or vector search (component 8):

| Tool | Backed by | Purpose |
|---|---|---|
| `faq_search` | graph + vector | Search frequently asked questions |
| `pricing_lookup` | graph (traversal) | Look up pricing for a service, or list all |
| `service_catalog` | graph (listing) | Enumerate services |
| `question_search` | graph | Search recorded customer questions |
| `knowledge_query` | graph + vector | Catch-all semantic+graph query |

## What's implemented

| File | Role |
|---|---|
| `src/lib/ecosystem/mcp/types.ts` | `McpTool`, `McpToolDefinition`, `McpToolCall`, `McpToolResult`, `McpToolContext`, `McpContentItem`, local minimal `AgentsSdkHandler` interface |
| `src/lib/ecosystem/mcp/auth.ts` | `AccessClaims`, `AccessJwtValidator` interface (contract only — real signature verification is CT105's wiring job), `McpAuthError`, `readAccessJwt(request)` |
| `src/lib/ecosystem/mcp/server.ts` | `McpServer` class — implements `AgentsSdkHandler` directly; tool registry + dispatch + name→handler routing |
| `src/lib/ecosystem/mcp/tools.ts` | The 5 standard tools (`faqSearchTool`, `pricingLookupTool`, `serviceCatalogTool`, `questionSearchTool`, `knowledgeQueryTool`) + `STANDARD_TOOLS` barrel |
| `src/lib/ecosystem/mcp/index.ts` | Barrel re-export |

### Public API

```ts
class McpServer implements AgentsSdkHandler {
  registerTool(tool: McpTool): void              // throws on duplicate name
  listTools(): McpToolDefinition[]               // → tools/list response
  dispatch(call: McpToolCall, ctx: McpToolContext): Promise<McpToolResult>  // → tools/call handler
}

interface McpToolContext {
  business: BusinessConfig
  graph: KnowledgeGraph
  vectorSearch: VectorSearch
}
```

`McpToolContext` is constructed once at server startup (after Cloudflare bindings are wired) and passed to every `dispatch` call. This is the seam where the MCP layer meets components 1 + 8 — handlers stay thin and delegate.

### Tool call flow

```
client → JSON-RPC tools/call → Agents SDK (CT105 wiring) → McpServer.dispatch({name, arguments}, ctx)
  → name → handler lookup
  → handler(arguments, ctx) → McpToolResult
  → SDK wraps result as JSON-RPC response → client
```

The SDK owns JSON-RPC parsing, transport, and auth integration. `McpServer` owns tool registration + dispatch + result formatting.

## Design decisions

1. **Local minimal `AgentsSdkHandler` interface (dep-free).** Per Christopher's ruling on LEAD #5, bird does NOT install the `agents` runtime dep. `McpServer` implements the dispatch surface directly so tool registration + name→handler routing is fully testable without the SDK. CT105's HTTP-layer wiring adapts `listTools()` / `dispatch()` to the real `createMcpHandler()` / `addMcpServer()` API. Same pattern as `D1Database` (component 1), `VectorizeIndex` + `Embedder` (component 8) — see decision 4 in `01_knowledge_graph.md` and decision 5 in `08_vector_search.md`.

2. **Five tools bundled as `STANDARD_TOOLS`.** §5.2 names them; bird ships them all. `McpServer` is constructed empty (no opinion on which tools a specific deployment wants), then populated from `STANDARD_TOOLS` — a future business that only wants a subset gets it by registering selectively.

3. **`dispatch` never throws — returns `isError` results.** Handled failures (unknown tool name, handler exception, missing required param) become `{ isError: true, content: [{type:"text", text:"..."}] }`. This matches the MCP protocol's tool-result shape and lets the calling agent reason about the failure rather than seeing a transport error. Auth/transport failures (which become JSON-RPC errors) are NOT handled here — they're the SDK's job.

4. **Auth is a contract, not an implementation.** §0.5 is explicit: 41% of public MCP servers have zero auth, and this endpoint WILL be public. `AccessJwtValidator` defines the interface (`validate(jwt): Promise<AccessClaims>`); the real implementation MUST verify the JWT signature against the Cloudflare Access JWKS. Bird ships only `readAccessJwt(request)` (header extraction — safe, no crypto) and `McpAuthError`. A `FakeValidator` exists ONLY in the smoke test, never in the library. CT105's wiring job: implement `AccessJwtValidator` against `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` and reject unvalidated JWTs at the HTTP layer before dispatch.

5. **Tool handlers do their own param narrowing, not Ajv.** Per LEAD #4 in the task-state file, strict JSON-Schema validation lands with the test runner in component 10. Each handler uses small helpers (`asString`, `asInt`) to coerce + clamp inputs. This catches the common authoring mistakes without a dependency bump.

6. **Combined graph + vector retrieval in `faq_search` + `knowledge_query`.** Graph keyword search returns structured entities (Q&A pairs, typed relationships); vector search catches semantic matches the keyword search misses. The pattern: graph primary, vector supplement, dedupe by entity id. `knowledge_query` adds one-hop `getRelated()` traversal so the calling agent sees context around each entity, not just the entity alone.

7. **No live Agents SDK binding on bird.** Per §3 deployment map ("HTTP surface" row), bird never writes `functions/api/ecosystem/mcp/router.ts` — that's CT105's job after Christopher reviews this branch. Verification here uses `McpServer` directly (no HTTP, no SDK).

## How downstream consumes it

- **Component 5 (agent):** the agent decides which MCP tool to call based on user intent, then composes the tool's text result into a natural-language answer. Component 2 is the agent's tool surface; component 5 is the orchestration layer on top.
- **External AI agents:** once CT105 wires `router.ts` + auth, ChatGPT / Perplexity / customer agents can hit `https://secureprospective.com/api/ecosystem/mcp/router` (or wherever the route lands) and call these tools directly. This is the §1 end-product item 3.
- **Public MCP registry** (§5.2 stretch): once live, register at `registry.modelcontextprotocol.io` for discoverability. Out of scope for this scaffold pass.

## Verification

- `npm run build` — passes.
- `tsc --noEmit` — only pre-existing `functions/api/{ask,lead}.ts` errors (LEAD #3); zero new errors in `src/lib/ecosystem/mcp/*`.
- **Integration smoke test (`/tmp/opencode/smoke-mcp.mjs`, 78 checks)** — exercises the full §8 P0 slice end-to-end on fake data:
  - Real `BusinessConfig` (catalog component 9) → real `KnowledgeGraph` against MockD1 (component 1) → real `VectorSearch` with `AISearchBackend` + fake client (component 8) → `McpServer` with all 5 standard tools (this component).
  - Seeds SP-like entities (services, FAQs, pricing, questions) + relationships via `entityId()` / `relId()` helpers.
  - Calls each of the 5 tools via `dispatch()` and verifies real results (not stubs): FAQ Q&A pairs surface correctly, pricing_lookup walks `priced_by` edges and returns `$5,000` from the seeded pricing entity, service_catalog lists all seeded services, question_search returns occurrence_count + source metadata, knowledge_query combines graph entities + one-hop relations + semantic matches.
  - Edge cases: unknown tool name → `isError` result listing available tools; missing required param → `isError`; handler throw → caught and surfaced as `isError`; duplicate registration throws `McpServerError`; `readAccessJwt` extracts/whitespace-trims correctly; `McpAuthError` exists with correct name; all tool names snake_case per MCP convention.

## Open items / TODOs

- **Cloudflare Agents SDK runtime dep** (`agents` package) — LEAD #5. Local stub now; CT105 wires the real SDK at HTTP time. See "Hand-off to CT105" below for the exact adapter shape.
- **Real `AccessJwtValidator` implementation** — fetches Cloudflare Access JWKS, verifies JWT signature. CRITICAL security gate — endpoint MUST NOT ship without this. Bird ships only the contract.
- **HTTP entry point** (`functions/api/ecosystem/mcp/router.ts`) — CT105's wiring job, NOT bird's lane per §3 deployment map.
- **Ajv strict input validation** — deferred to component 10 (testing) per LEAD #4.
- **Tool result formatting** is currently text-only. For richer structured outputs (e.g. returning JSON for programmatic callers), add `{type:"json", json:...}` content items — `McpContentItem` already supports it. Not needed for Phase 1; the calling agent reads text fine.
- **Rate limiting / abuse protection** — once public, this endpoint is a target. Cloudflare's built-in WAF + rate-limiting rules are the right first line; flagged here, not implemented (CT105's infra lane).

## Hand-off to CT105

Three seams for CT105 to wire at deploy time. Each is a single focused file.

### 1. Real `AccessJwtValidator` implementation (security-critical)

```ts
// src/lib/ecosystem/mcp/access-jwt-validator.ts (CT105 writes)
export class CloudflareAccessValidator implements AccessJwtValidator {
  constructor(private readonly teamDomain: string, private readonly audience: string) {}
  async validate(jwt: string): Promise<AccessClaims> {
    // 1. Fetch JWKS from `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`
    // 2. Verify JWT signature (use jose or @cf-wph-edge/jwt-verifier)
    // 3. Check exp, iat, aud
    // 4. Return parsed claims; throw McpAuthError on any failure
  }
}
```

Reference: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

### 2. HTTP entry point + Agents SDK wiring

```ts
// functions/api/ecosystem/mcp/router.ts (CT105 writes)
import { createMcpHandler } from "agents";  // LEAD #5 dep
import { McpServer, STANDARD_TOOLS } from "../../../../src/lib/ecosystem/mcp";
import { loadBusinessConfig } from "../../../../src/lib/ecosystem/catalog";
import { KnowledgeGraph } from "../../../../src/lib/ecosystem/knowledge-graph";
import { VectorSearch, AISearchBackend, RestClientAiSearchClient } from "../../../../src/lib/ecosystem/vector-search";
import { CloudflareAccessValidator } from "../../../../src/lib/ecosystem/mcp/access-jwt-validator";
import { readAccessJwt } from "../../../../src/lib/ecosystem/mcp/auth";

const business = loadBusinessConfig("secureprospective");
const validator = new CloudflareAccessValidator("secureprospective", "<aud-tag>");

export const onRequestPost = createMcpHandler({
  // SDK options — binding, auth integration, etc.
}, async (request, env) => {
  // 1. Validate auth
  const jwt = readAccessJwt(request);
  if (!jwt) return new Response("Unauthorized", { status: 401 });
  await validator.validate(jwt);  // throws McpAuthError → 401

  // 2. Construct context with real bindings
  const ctx = {
    business,
    graph: new KnowledgeGraph(env.ECOSYSTEM_DB, business),
    vectorSearch: new VectorSearch(
      new AISearchBackend(new RestClientAiSearchClient({
        accountId: env.CF_ACCOUNT_ID, apiToken: env.CF_API_TOKEN, instanceName: "ccwork-resume",
      })),
      business,
    ),
  };

  // 3. Construct server + wire to SDK
  const server = new McpServer();
  for (const tool of STANDARD_TOOLS) server.registerTool(tool);

  // SDK owns JSON-RPC routing — forward to McpServer
  // (Exact adapter shape depends on the `agents` API; CT105 reads the docs.)
  return server;  // or however the SDK expects the handler
});
```

The exact `createMcpHandler` / `addMcpServer` API shape is what CT105 reads against the docs at wiring time. Bird's `McpServer.listTools()` and `McpServer.dispatch(call, ctx)` are the contract — those don't change.

### 3. `agents` package dependency (LEAD #5)

Christopher blesses adding `agents` to `dependencies` in `package.json`. Then `npm install` and the import works. No code change in bird's library files needed.
