# Component 8 — Vector Search & Retrieval

**Status:** Implemented (P0, third component per §5 priority order — after component 9 catalog + component 1 knowledge graph).
**Last updated:** 2026-07-20.
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5 (component 8), §2 (storage mapping), §3 (deployment map).
**Provenance:** Generalizes the retrieval step already in production in `functions/api/ask.ts` (lines 73-90) — same REST call shape, lifted into a reusable backend.

## What this component is

Business-scoped semantic search over a pluggable backend. Two backend shapes ship behind one interface:

- **Vectorize** (Cloudflare's vector DB) — the canonical wireframe path. Caller provides embeddings; the index returns top-K similar vectors.
- **AI Search** (Cloudflare's managed RAG) — the "if simpler" path from §5.8, and what SP's chatbot already uses successfully in production. The service handles embedding+retrieval internally.

A business picks its backend at deploy time (each business has its own Cloudflare binding). The core `VectorSearch.search()` API is identical either way. This split is the literal mechanism behind §0's wireframe rule: core logic knows nothing about which managed service a specific business happens to use.

## What's implemented

| File | Role |
|---|---|
| `src/lib/ecosystem/vector-search/types.ts` | `SearchResult`, `SearchOptions`, `VectorSearchBackend`, `Embedder`, minimal local `VectorizeIndex` + `AiSearchClient` interfaces |
| `src/lib/ecosystem/vector-search/search.ts` | `VectorSearch` class — business-scoped entry point; binds business at construction |
| `src/lib/ecosystem/vector-search/vectorize.ts` | `VectorizeBackend` — calls Vectorize via injected index + embedder |
| `src/lib/ecosystem/vector-search/aisearch.ts` | `AISearchBackend` + `RestClientAiSearchClient` — generalizes `functions/api/ask.ts`'s retrieval |
| `src/lib/ecosystem/vector-search/index.ts` | Barrel re-export |

### Public API

```ts
class VectorSearch {
  constructor(backend: VectorSearchBackend, business: BusinessConfig)
  search(query: string, topK?: number, opts?: { filter?, namespace? }): Promise<SearchResult[]>
}

interface SearchResult {
  id: string;        // backend-specific (Vectorize vector id, AI Search chunk id, or synthetic)
  score: number;     // higher = better, normalized across backends
  text: string;      // the matched passage
  metadata: Record<string, unknown>;  // backend-specific (entity_id, source, namespace, ...)
}
```

### Backend contract

```ts
interface VectorSearchBackend {
  search(query: string, opts: SearchOptions): Promise<SearchResult[]>
}
```

Both `VectorizeBackend` and `AISearchBackend` implement this. `VectorSearch` adds business-scoping (namespace default = `business.id`) and query validation (empty → `[]`) on top.

## Design decisions

1. **Business bound at construction, not per-call.** §5.8's literal signature is `search(query, businessId, topK)`. This implementation binds `businessId` at construction instead, matching the established `KnowledgeGraph` pattern at `src/lib/ecosystem/knowledge-graph/graph.ts:81`. Rationale is identical to graph scoping (see `01_knowledge_graph.md` decision 3): callers can't accidentally query across business boundaries, and a wrong-business call returns `[]` not a leak.

2. **Two backends, one interface.** §5.8 says "Vectorize OR AI Search binding if simpler." Both ship. SP's live chatbot already proves AI Search works for the consulting corpus; Vectorize is the canonical wireframe path. A future business with no AI Search instance can deploy Vectorize with zero core code changes. The interface makes the choice a deploy-time concern, not a code concern.

3. **Embedder as an injected seam (VectorizeBackend only).** Vectorize stores vectors, not text — somebody has to embed the query. Keeping `Embedder` as an interface (not a hardcoded Workers AI call) lets the real model be wired by CT105 and lets the smoke test use a deterministic fake. Real implementation will likely wrap `@cf/qwen/qwen3-embedding-0.6b` (the model already in SP's AI Search instance per CLAUDE.md) or `@cf/baai/bge-base-en-v1.5` — CT105's call at binding time.

4. **AI Search ignores `namespace` and `filter`.** AI Search instances are already per-business at deploy time (SP's is `ccwork-resume`), so per-call business scoping is redundant. Vectorize supports both — that's where the options take effect. Documented per-backend; the shared `SearchOptions` type carries both fields.

5. **Local minimal Cloudflare type stubs** (`VectorizeIndex`, `AiSearchClient`). Same tradeoff as `knowledge-graph/types.ts` → `D1Database` (decision 4 in `01_knowledge_graph.md`): keeps this component dep-free and the diff small. Installing `@cloudflare/workers-types` later would (a) supply full types here AND (b) fix the pre-existing tsc errors in `functions/api/{ask,lead}.ts`. CT105's call to bless the devDep.

6. **`RestClientAiSearchClient` uses REST, not the AI Search binding.** Matches the proven path `ask.ts` already takes — its comment at line 6 explicitly says "Uses the Cloudflare REST API (proven path) rather than the AI Search binding." If CT105 later wants to swap to the binding, write a one-class wrapper that satisfies `AiSearchClient` — `AISearchBackend` doesn't care about transport.

7. **No live Vectorize or AI Search binding on bird.** Per §3 deployment map ("Vectors" row and "Existing chatbot" row), bird never runs `wrangler` or hits real Cloudflare bindings. Verification here uses injected fakes — `FakeVectorizeIndex`, `FakeEmbedder`, `FakeAiSearchClient`, and a `fetchImpl` override on the REST client. CT105 wires real bindings at deploy time.

## How downstream consumes it

- **Component 2 (MCP server):** `question_search`, `faq_search` tools can call `vectorSearch.search()` for semantic matches when keyword/graph traversal isn't enough.
- **Component 5 (agent):** the retrieve step of the retrieve→generate flow currently hardcoded in `ask.ts` becomes `vectorSearch.search()` once the agent core lands. `ask.ts` itself isn't refactored here (per §3 "Existing chatbot" row — only after the agent is independently proven, to avoid live-chatbot regression).
- **Component 1 (knowledge graph):** complementary, not redundant. Graph holds structured facts (entity CRUD, typed relationships); vector search holds unstructured semantic similarity over the same corpus' text. A real query often hits both: vector search finds candidate passages, graph traversal pulls structured context.

## Verification

- `npm run build` — passes.
- `tsc --noEmit` — no errors in `src/lib/ecosystem/vector-search/*`.
- Smoke test (`/tmp/opencode/smoke-vector.mjs`) — exercises:
  - `VectorSearch.search()` — empty/whitespace query → `[]`; business scoping (namespace = `business.id` passed through to backend); explicit namespace override; explicit filter override.
  - `VectorizeBackend` — fake index returns fake matches; embedder called with the query; `topK` clamping (undefined → 5, 0 → 1, 1000 → 100, 3.7 → 3); `returnMetadata: "all"` passed; metadata-to-text fallback (`text` → `content` → `""`); array-text metadata joined.
  - `AISearchBackend` — fake client returns canned chunks; `text`/`content`/array-`text` mapping; missing `score` defaults to 0; missing `id` synthesized as `chunk-<idx>`; topK slicing after the fact.
  - `RestClientAiSearchClient` — `fetchImpl` override returns canned JSON parsed correctly; non-ok response throws with status; URL/headers built correctly from constructor args.
  - Backend-agnostic shape — the same `VectorSearch` instance works with either backend; `SearchResult` shape identical across both.

## Open items / TODOs

- **Real Workers AI embedder** — `RestClientEmbedder` (wrapping `/accounts/{id}/ai/run/@cf/...`) or a binding-backed `BindingEmbedder`. Bird cannot test against real Workers AI; left as a CT105 wiring task. The `Embedder` interface is the contract.
- **Vectorize index creation** — CT105 creates the index, sets dimensions to match the chosen embed model, binds it, and backfills from real SP content (per §3 "Vectors" row: reuse the `ccwork-resume` corpus pattern where possible instead of standing up a parallel one).
- **AI Search binding alternative** — if CT105 decides the AI Search binding is preferable to REST for production (e.g. for binding-level observability), write a `BindingAiSearchClient` satisfying the `AiSearchClient` interface. `AISearchBackend` is transport-agnostic.
- **`@cloudflare/workers-types` devDep decision** — see LEADS in session report. Affects how `VectorizeIndex` gets typed (local stub now → official type after).
- **Score normalization across backends** — both backends return `score: number` with "higher = better," but Vectorize scores are cosine similarity (0..1) while AI Search scores are an internal relevance signal that may not be 0..1. If downstream ever needs calibrated scores (e.g. threshold-based filtering), add a backend-specific normalizer. Not needed for Phase 1 retrieval-augmented generation.

## Hand-off to CT105

- **No new migration.** This component has no D1 footprint — Vectorize is the storage layer, and AI Search instances are managed separately. Nothing to `wrangler d1 migrations apply`.
- **No `wrangler.toml` changes from bird.** Binding name suggestions:
  - Vectorize: `ECOSYSTEM_VECTORS` (or per-business: `SP_VECTORS`, `TFM_VECTORS`).
  - AI Search: no binding needed for the REST path (uses `CF_API_TOKEN` already in production). If switching to the binding, name suggestion `ECOSYSTEM_AI_SEARCH`.
- **Existing chatbot is untouched.** `ask.ts` and `lead.ts` are not modified. This component is library-only until component 5 (agent) wires HTTP entry points, and `ask.ts` only refactors onto the new core after the agent is independently proven.
