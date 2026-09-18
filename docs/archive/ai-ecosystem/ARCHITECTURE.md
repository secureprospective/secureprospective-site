# AI-First Business Ecosystem — Architecture & Scaffold Brief

**Status:** Pre-build spec, written 2026-07-07. Nothing below is deployed. This is the brief GLM 5.2 (on bird) works from to build code scaffolds. Claude (CT105) reviews and merges when Christopher is back from the road.

**Origin:** Adapted from a planning blueprint (`docs/from-hermes/CT105/`) originally written for a self-hosted Python/Neo4j/Docker stack. That stack doesn't match how SP or TFM actually run (both are Astro + Cloudflare Pages/Workers, serverless, no always-on servers). Everything here is the same 10-component idea, re-architected onto Cloudflare primitives.

---

## 0. The Product Framing (read this first)

This is not a one-off feature for secureprospective.com. It is a **wireframe** — a business-agnostic AI-native layer that any business can plug its own data into. The design goal for every component: **core logic knows nothing about SP or TFM specifically; a thin per-business config/data layer is the only thing that changes.**

- **Test case 1: secureprospective.com** — proves the wireframe works, generates the first real usage data (citation rate, AI-mediated conversions, etc.).
- **Test case 2: techfreedomministries.org** — proves the wireframe transfers to a second, differently-shaped business (ministry vs. consulting) without a rebuild.
- **Eventual product:** SP sells "make your business AI-native" as a service. The pitch is backed by SP's own real-world numbers, not a hypothetical.

**Rule for every scaffold below:** if you find yourself hardcoding "SecureProspective" or "insurance" or "consulting" into core logic, stop — that value belongs in a per-business config object (JSON/D1 row), not in code. The existing SP chatbot (`functions/api/ask.ts`) already does this half-right (business content lives in R2, not code) — extend that pattern, don't break it.

---

## 0.5. Competitive/Landscape Research (2026-07-07) — What Changed and What Didn't

Before scaffolding, 7 research passes checked this plan against the current market — this is a first-mover project, and first-movers still need to know who else is on the trail. Findings that survived scrutiny are already folded into the sections below; this is the receipt.

**Adopted:**
- **Cloudflare's own Agents SDK** ships a built-in MCP handler (`createMcpHandler`/`addMcpServer()`) with JSON-RPC routing already solved — we are not hand-writing that layer. Verified against `developers.cloudflare.com/agents/` docs directly, not marketing copy.
- **Auth via `workers-oauth-provider` + Cloudflare Access JWT validation**, not a hand-rolled shared-secret header. A 2026 security scan of ~7,000 public MCP servers found 41% require no auth at all and a third are SSRF-vulnerable — a public MCP endpoint with a home-rolled auth scheme is exactly the failure mode to avoid.
- **Cheap GEO floor** (schema.org JSON-LD on the public Astro pages, extraction-friendly FAQ formatting) — free, doesn't compete with the MCP work, and gives us an actual way to measure "AI citation rate" later: a fixed 30–100 query benchmark set, logged periodically against ChatGPT/Perplexity/Gemini/Claude.
- **Register the MCP server in the public MCP registry** (`registry.modelcontextprotocol.io`) once live — pure discoverability, no cost.

**Investigated and rejected — do not re-litigate these without new evidence:**
- **llms.txt** — no production AI system reads it for citation purposes (confirmed: Google's own John Mueller on the record, an Ahrefs study of 1,885 pages showing zero citation lift). It only helps IDE coding agents (Cursor, Claude Code) parsing docs sites — irrelevant to a consulting/ministry site's public visitors. Skip.
- **ACP (OpenAI/Stripe) and UCP (Google)** — real, scaling, and adopted by real retailers (Etsy, Walmart, Coach) — but both are checkout/SKU-shaped protocols with zero booking or professional-services primitives. Forcing SP/TFM onto them would solve a problem neither business has. **Component 6 (direct MCP tool-calling for booking) is confirmed as the correct near-term answer, not a fallback.** Revisit only if ACP/UCP publish a services/booking vertical.
- **A2A protocol** — confirmed as agent-to-agent internal coordination (supply chain, IT ops), not a customer-facing commerce channel. Staying dormant in component 4 was the right call already.
- **Scrunch AI's "Agent Experience Platform"** (serves a parallel machine-readable site to bot traffic at the CDN edge) — a real, live pattern worth knowing about, but it's complementary to an MCP server, not a rival architecture. Not adopting now; worth a look if AI-visibility ever becomes its own initiative.
- **Cloudflare AI Search as a full RAG replacement** — tempting (it's managed, zero-plumbing), but it's opinionated toward website/R2 document indexing and doesn't do graph-shaped entity/relationship queries. The hand-rolled D1 knowledge graph stays.

**Market read:** public MCP servers for real small/medium consumer-facing businesses (not dev tools, not SaaS-for-developers) don't appear to exist yet in the wild — the closest matches (Amplemarket, Apollo, HubSpot) are B2B sales tooling exposing MCP to *their own customers'* sales reps, not a business exposing itself to the open agent ecosystem. That gap is the first-mover opportunity this project is actually betting on.

---

## 1. The End Product (what "live" looks like)

Before scaffolding, here's the concrete thing that exists once this ships — working backward from this is what keeps the 10 components from becoming 10 disconnected folders.

**On secureprospective.com, post-launch:**
1. A visitor (human or AI agent) asks a question anywhere the existing chat widget lives. The request now routes through the **shared agent core** (`src/lib/ecosystem/agent/`), not `ask.ts`'s current ad hoc logic — `ask.ts` becomes a thin SP-specific wrapper around it.
2. The agent calls **MCP tools** (`faq_search`, `pricing_lookup`, `service_catalog`, etc.) backed by the **knowledge graph** (D1) and **vector search** (Vectorize), instead of the current one-shot AI-Search retrieve→generate call.
3. A **public MCP endpoint** (`functions/api/ecosystem/mcp/router.ts`) is reachable by *external* AI agents too — not just SP's own chat widget. This is the literal mechanism behind "AI citation rate" / "AI-mediated bookings" in the original blueprint's success metrics: other AIs (ChatGPT, Perplexity, a customer's own agent) can query SP's structured knowledge directly instead of scraping the HTML.
4. There's a way to **populate the knowledge graph** — an ingestion path (admin script or simple form) that turns SP's real FAQs/services/pricing into D1 rows, so this isn't a demo running on fake data.
5. **CRM/booking, transcription, A2A** stay dark (no live dependency) until real credentials/inputs exist — their scaffold's job is to not block the four items above, not to be live day one.

**On techfreedomministries.org, second wave:** the same four live pieces, pointed at `config/businesses/techfreedomministries.json` and TFM's own D1/Vectorize data — zero core code changes, per the wireframe framing in section 0.

**Definition of done for *this* scaffold pass (bird/GLM):** items 1–4 above exist as real, locally-testable code (even against seed/fake data) — not just typed interfaces. Items under "explicitly not in scope" (section 6) can be interface-only stubs.

---

## 2. Cloudflare-Native Architecture Map

The original blueprint assumed always-on servers. SP/TFM have none — everything is Pages + Workers (Functions) + Cloudflare's managed data services. Substitutions:

| Blueprint concept | Original (blueprint) | Cloudflare-native replacement |
|---|---|---|
| Knowledge Graph | Neo4j (Docker, always-on) | **D1** (SQLite at the edge) for entities/relationships. No native graph traversal — model as adjacency tables (`entities`, `relationships` with `from_id`/`to_id`/`type`) and traverse in application code. |
| Vector Search | Pinecone / Weaviate / Supabase | **Vectorize** (Cloudflare's native vector DB) — same role the SP chatbot's AI Search already fills; extend rather than duplicate. |
| MCP Server | Python `mcp-sdk`, FastAPI, always-on process | **Cloudflare Agents SDK** (`createMcpHandler`/`addMcpServer()`) inside a Workers Function — routing is provided, don't hand-write JSON-RPC. Auth via `workers-oauth-provider` + Cloudflare Access JWT validation, not a hand-rolled secret header. |
| AI Agent framework | LangChain, always-on Python process | **Workers AI + AI Gateway** direct calls, orchestrated in TypeScript. No LangChain — Cloudflare has no runtime to host it, and it's unnecessary overhead for tool-call-based flows. |
| Call Transcription | AssemblyAI (external paid API) | Defer. **Workers AI Whisper model** (`@cf/openai/whisper`) can transcribe if/when there's a real call-audio input; until then this component is a stub with no live dependency. |
| Task Queue | Celery + Redis | **Cloudflare Queues** (if async fan-out is ever needed) or just synchronous Worker calls — most of these flows don't need a queue at Phase 1 scale. |
| CRM/Booking | Custom Python integration | **Workers Function** calling the business's actual CRM REST API (Jobber, etc.) — per-business, config-driven, no core logic changes. |
| Monitoring | Prometheus + Sentry + structlog | **Cloudflare Analytics/Logs** (built into Workers) + optional Sentry Workers SDK. Keep it thin — no new infra to run. |
| Multi-model orchestration | Custom Python router across Ornith/GLM/Claude/Gemini | **AI Gateway** already supports multi-provider routing/fallback; use it instead of hand-rolled orchestration where possible. |
| Hosting/deploy | Docker Compose, Kubernetes | Cloudflare Pages (existing pipeline) — `npm run build` / `dist` / auto-deploy from `main`. No new deploy mechanism. |

**No new servers. No Docker. No Python.** Everything is TypeScript inside the existing Astro + Cloudflare Pages Functions repo, deployed exactly the way the site deploys today.

---

## 3. Scaffold → Deployment Map

What has to be true at each layer for the section 1 end product to actually go live — this is what I (Claude/CT105) check for when the branch comes back, so bird should leave clean seams at each arrow:

| Layer | Scaffold artifact | What CT105 does to make it live | How Christopher verifies |
|---|---|---|---|
| Data | `migrations/000X_ecosystem.sql` (D1 schema) | `wrangler d1 migrations apply` against a **new** D1 database (don't reuse an existing one blind) + bind it in the Pages project settings | `wrangler d1 execute` a row count query |
| Vectors | `src/lib/ecosystem/vector-search/` | Create a Vectorize index, bind it, backfill from real SP content (reuse the existing `ccwork-resume` AI Search corpus pattern where possible instead of standing up a parallel one) | A test query returns a real SP fact, not a stub |
| Core logic | `src/lib/ecosystem/*` | Code review only — no infra change, just merge | `npm run build` passes |
| HTTP surface | `functions/api/ecosystem/*.ts` | Deploy is automatic once merged to `main` (existing Pages pipeline) | Hit the endpoint directly (`curl`) post-deploy |
| Config | `config/businesses/*.json` | None — static file, ships with the build | Confirm SP's config loads and TFM's doesn't leak into SP's responses |
| Secrets (MCP key, any future CRM key) | `.env.example`-style placeholder in scaffold docs | CT105 sets real Cloudflare Pages secrets — bird/GLM never sees real keys | Secret exists in dashboard, not in git history |
| Existing chatbot | `functions/api/ask.ts` | Refactor to call the new shared agent core instead of its current inline logic — **only after** the agent core is proven independently, so the live chatbot never regresses during the transition | Chatbot still answers correctly in the browser, adversarial-refusal test still passes (existing gate) |

**The one hard rule this map enforces:** nothing bird builds touches real secrets or real deploys. Every arrow in the "CT105 does" column is mine to execute after review — that's what "bird = code only" means in practice, not just in the abstract.

---

## 4. Repo Placement

Folded directly into `secureprospective-site` (per Christopher's decision — not a separate monorepo). Proposed layout:

```
secureprospective/
├── functions/
│   └── api/
│       ├── ask.ts                    (existing — chatbot, leave as-is)
│       ├── lead.ts                   (existing — leave as-is)
│       └── ecosystem/                (NEW — all 10 components' HTTP entry points)
│           ├── knowledge-graph.ts
│           ├── mcp/
│           │   ├── router.ts
│           │   └── tools/            (one file per MCP tool)
│           ├── transcription.ts
│           ├── a2a.ts
│           ├── agent.ts
│           ├── crm-booking.ts
│           ├── orchestration.ts
│           ├── vector-search.ts
│           ├── catalog.ts
│           └── monitoring.ts
├── src/
│   └── lib/
│       └── ecosystem/                (NEW — core logic, business-agnostic, imported by functions/)
│           ├── knowledge-graph/
│           ├── mcp/
│           ├── transcription/
│           ├── a2a/
│           ├── agent/
│           ├── crm-booking/
│           ├── orchestration/
│           ├── vector-search/
│           ├── catalog/
│           └── monitoring/
├── config/
│   └── businesses/                   (NEW — per-business plug-in config, this is the wireframe's "data store")
│       ├── secureprospective.json
│       └── techfreedomministries.json
└── docs/ai-ecosystem/
    ├── ARCHITECTURE.md               (this file)
    └── components/                   (NEW — one spec file per component, written by GLM as it scaffolds)
```

`src/lib/ecosystem/*` = the reusable wireframe (business-agnostic). `functions/api/ecosystem/*` = thin HTTP wrappers. `config/businesses/*.json` = the only thing that changes per business. This split is the whole point — it's what makes the wireframe portable to a 3rd, 4th, 5th client later.

---

## 5. The 10 Components — Scaffold Specs

Only components 1–2 had real build docs in the original blueprint; the rest were named only. Scaffold **all 10** per Christopher's call — give each a working skeleton (types, one real happy-path implementation, TODOs for the rest), not just an empty folder. Every component's core logic takes a `BusinessConfig` object as input (loaded from `config/businesses/*.json`) — that's how the same code serves SP and TFM both.

**Priority order (build in this sequence — 1-4 are the section 1 "end product," 5-10 are dark stubs that must not block them):**

| Priority | Component | Why this order |
|---|---|---|
| P0 | 9. Knowledge Catalog (`BusinessConfig`) | Everything else takes this as input — build it first or nothing else typechecks meaningfully. |
| P0 | 1. Knowledge Graph | Backs both MCP tools and the agent's factual answers. |
| P0 | 8. Vector Search | Backs retrieval the same way `ask.ts` already needs it. |
| P0 | 2. MCP Server | The public surface that makes "AI-mediated" real — depends on 1+8. |
| P0 | 5. AI Agent | Ties 1+2+8 together into the thing that actually answers a question; this is what eventually replaces `ask.ts`'s inline logic. |
| P1 | 10. Testing & Monitoring | Needed to trust P0 output, but scaffold alongside rather than after — don't let it become an afterthought pass. |
| P2 | 7. Multi-Model Orchestration | Nice-to-have routing polish on top of a working agent, not a blocker to having one. |
| P3 (dark stub) | 3. Call Transcription | No live input exists — types + one Workers-AI-backed function, no wiring beyond that. |
| P3 (dark stub) | 6. CRM/Booking | No credentials exist — `NullAdapter` only. |
| P3 (dark stub) | 4. A2A Protocol | Explicitly Year-2 in the original plan — types only. |

### 1. Knowledge Graph (`src/lib/ecosystem/knowledge-graph/`)
- D1 schema: `entities(id, business_id, type, name, data JSON)`, `relationships(id, business_id, from_id, to_id, type, data JSON)`.
- Entity types to start: `service`, `faq`, `question`, `pricing`, `staff`, `case_study` (matches the original Neo4j schema's node labels).
- CRUD functions + a simple traversal helper (`getRelated(entityId, relationType)`).
- Migration file under a new `migrations/` dir (Wrangler D1 convention).

### 2. MCP Server (`src/lib/ecosystem/mcp/` + `functions/api/ecosystem/mcp/`)
- Build on **Cloudflare's Agents SDK** (`createMcpHandler`/`addMcpServer()`, package `agents`) — it provides JSON-RPC tool-call routing; do not hand-write a router from scratch (see §0.5 research findings).
- Ship the 5 tools the blueprint names for Phase 1: `faq_search`, `pricing_lookup`, `service_catalog`, `question_search`, `knowledge_query` — each backed by the knowledge graph above.
- Auth: **`workers-oauth-provider`** (OAuth 2.1) or, simpler for a first pass, **Cloudflare Access JWT validation** against the `Cf-Access-Jwt-Assertion` header — not a hand-rolled shared-secret string. This endpoint is public/internet-facing; the 2026 security-scan stat (41% of public MCP servers have zero auth) is exactly the failure mode to not repeat.
- Stretch goal once live: register in the public MCP registry (`registry.modelcontextprotocol.io`) for discoverability.

### 3. Call Transcription (`src/lib/ecosystem/transcription/`)
- Stub only — no live call-audio source exists yet for SP or TFM.
- Interface: `transcribe(audioUrl: string): Promise<{ text: string; speakers?: string[] }>` implemented via Workers AI Whisper.
- Downstream stub: `extractQuestions(transcript: string): Question[]` — leave as a TODO calling the agent component.

### 4. Agent-to-Agent Protocol (`src/lib/ecosystem/a2a/`)
- Stub types only (`AgentCard`, `Task`, `Message`, `Artifact` per the A2A spec) — this is explicitly Year-2 scope in the original blueprint, not Phase 1. Don't over-build; a clean types file + a one-paragraph README explaining it's intentionally dormant is enough.

### 5. AI Agent (`src/lib/ecosystem/agent/`)
- Core conversational agent: given a user question + `BusinessConfig`, decide which MCP tool(s) to call, then compose an answer.
- This should reuse/generalize the existing `functions/api/ask.ts` retrieve→generate pattern rather than duplicating it — `ask.ts` becomes SP's specific wiring on top of this shared agent core.
- Capabilities to scaffold: FAQ answering, pricing inquiry, service recommendation. Booking initiation stubs out to component 6.

### 6. CRM/Booking Integration (`src/lib/ecosystem/crm-booking/`)
- Interface-first: `CRMAdapter` with `createBooking()`, `syncCustomer()`. No real adapter yet (no CRM credentials exist for SP or TFM) — ship a `NullAdapter` that logs instead of calling out, and one real adapter stub for Jobber (matches the blueprint's env var) marked TODO.
- **Confirmed approach (§0.5 research):** direct MCP tool-calling (an agent invoking `createBooking()` through this component) is the correct near-term mechanism for "AI books on the customer's behalf" — retail-shaped protocols like ACP/UCP don't have service/booking primitives yet. Don't wait on them; this component *is* the answer.

### 7. Multi-Model Orchestration (`src/lib/ecosystem/orchestration/`)
- Thin router using **AI Gateway** for provider fallback (Claude → GLM → Gemini, matching existing fleet roles) rather than hand-rolled logic.
- This is about model routing for the ecosystem's own AI calls (agent, transcription) — not the human Ornith/GLM/Claude/Gemini weekly-cycle process from the original doc, which is a workflow, not code.

### 8. Vector Search & Retrieval (`src/lib/ecosystem/vector-search/`)
- Wrap Cloudflare Vectorize (or the existing AI Search binding if simpler) behind a business-agnostic `search(query, businessId, topK)` interface.
- This generalizes what `ask.ts` already does ad hoc for SP — pull that logic up into this shared module.

### 9. Knowledge Catalog Architecture (`src/lib/ecosystem/catalog/`)
- Defines the `BusinessConfig` schema itself (name, category, service area, brand voice constraints, contact info) — this is the "load the business-specific data store" piece Christopher described.
- One JSON Schema + TypeScript type + a loader (`loadBusinessConfig(businessId)`).

### 10. Testing & Monitoring (`src/lib/ecosystem/monitoring/`)
- Structured logging helper (thin wrapper, no new infra) + a couple of Vitest/unit test scaffolds per component above, following whatever test runner the repo standard picks (none currently configured in `package.json` — GLM should pick one, e.g. Vitest, and wire `npm test`).
- **AI citation-rate measurement (§0.5 research):** no automated tool does this for a business our size. Scaffold a simple fixture — a checked-in list of 30-100 realistic customer questions — and a manual/scriptable runner that queries ChatGPT/Perplexity/Gemini/Claude with them and logs whether/how SP or TFM gets mentioned. This is the actual measurement mechanism behind the "AI citation rate" metric in the original blueprint's success criteria, which otherwise has no way to be tracked.

---

## 6. Business Config Example (the "plug-in" data store)

```json
// config/businesses/secureprospective.json
{
  "id": "secureprospective",
  "name": "SecureProspective",
  "category": "technical_consulting",
  "voice": "no fear/surveillance framing; confident, direct, ledger/vault mood",
  "serviceAreaRadius": null,
  "contact": { "email": "secureprospective@gmail.com" }
}
```

TFM gets its own file with its own voice constraints (positive/hopeful/scripture-forward, per existing TFM brand doctrine) and zero code changes elsewhere.

---

## 7. What's Explicitly NOT in Scope for This Scaffold Pass

- No real CRM integration (no credentials exist).
- No real call transcription pipeline (no audio source exists).
- No A2A protocol beyond types (Year 2 in the original plan).
- No Pinecone/Neo4j/Docker/Python — fully superseded by section 1's mapping.
- No deploys from bird — bird produces code + passes local build/test only. CT105 (Claude) reviews the branch and handles `wrangler`/Pages deploy after Christopher is back and has done the visual/functional gate, per standing SP workflow.

---

## 8. Handoff Notes for GLM 5.2

- Read `docs/from-hermes/CT105/` first for full original context (especially `COMPONENTS/01_KNOWLEDGE_GRAPH_DATABASE.md` and `02_MODEL_CONTEXT_PROTOCOL.md` — those two have real schemas/tool specs worth mining even though the storage layer changes from Neo4j to D1).
- Read this file in full before writing code — **especially section 1 (end product) and section 5's priority order.** The goal of this pass is a working P0 slice (catalog → knowledge graph → vector search → MCP → agent) against seed/fake data, not 10 equally-thin folders. P3 dark stubs should take a fraction of the effort P0 gets.
- Work on a branch (`session/ai-ecosystem-scaffold` or similar) — bird never touches `main` directly per existing SP workflow.
- Do not invent new external paid-service dependencies. If a component seems to need one, stub it and flag it in `docs/ai-ecosystem/components/<name>.md` rather than wiring it in.
- Do not touch real secrets, Cloudflare bindings, or `wrangler` deploy commands — section 3's deployment map shows exactly which arrows are CT105's job, not bird's. Seed data / local fixtures only for testing the P0 slice.
- One spec file per component under `docs/ai-ecosystem/components/` as you build, capturing what's actually implemented vs. stubbed — this becomes the reference for finishing components after the scaffold pass.
- Before handing back: confirm `npm run build` passes and the P0 slice is exercised by at least one test/fixture showing catalog → graph → vector search → MCP tool call → agent answer, end to end, on fake data. That single working thread is worth more than 10 isolated stubs.
