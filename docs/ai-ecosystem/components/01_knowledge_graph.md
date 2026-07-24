# Component 1 — Knowledge Graph

**Status:** Implemented (P0, second component per §5 priority order — after component 9 catalog).
**Last updated:** 2026-07-20.
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5 (component 1), §2 (storage mapping).
**Source blueprint:** `docs/from-hermes/CT105/COMPONENTS/01_KNOWLEDGE_GRAPH_DATABASE.md` (Neo4j → D1 adaptation; entity types preserved, relationship patterns adopted).

## What this component is

Business-scoped knowledge graph over Cloudflare D1. Stores entities (services, FAQs, customer questions, pricing, staff, case studies) and directed relationships between them. Every query is scoped to one `BusinessConfig` — the same code serves SP and TFM with no per-business branches.

This is the foundation component: MCP tools (component 2) and the agent (component 5) both read from it.

## What's implemented

| File | Role |
|---|---|
| `migrations/0001_ecosystem_knowledge_graph.sql` | D1 schema — `entities`, `relationships`, indexes, FK constraints, `json_valid` CHECK |
| `src/lib/ecosystem/knowledge-graph/types.ts` | TS types (Entity, Relationship, EntityType, RelationType, etc.) + minimal local `D1Database` interface |
| `src/lib/ecosystem/knowledge-graph/graph.ts` | `KnowledgeGraph` class — entity CRUD, relationship CRUD, `getRelated()` traversal, `searchEntities()`, `count()` |
| `src/lib/ecosystem/knowledge-graph/ids.ts` | `entityId()`, `relId()`, `relIdFromEndpoints()` — deterministic, business-prefixed id generation |
| `src/lib/ecosystem/knowledge-graph/index.ts` | Barrel re-export |

### Schema

**`entities`** — id (PK), business_id, type, name, data (JSON), created_at, updated_at.
- Unique index on `(business_id, type, name)` — no duplicate "HVAC Maintenance" within a business.
- Index on `(business_id, type)` — fast "list all FAQs for SP" queries.

**`relationships`** — id (PK), business_id, from_id, to_id, type, data (JSON), created_at.
- FK from_id / to_id → entities(id) ON DELETE CASCADE — edge disappears when endpoint deleted.
- Index on `(from_id, type)` — outbound traversal.
- Index on `(to_id, type)` — inbound traversal.
- Unique index on `(business_id, from_id, to_id, type)` — idempotent edge creation.

### Type-specific data shapes

The schema is generic (one table for all entity types). Type-specific fields live in the `data` JSON column. Conventions seeded from the Hermes blueprint, locked here for consistency across components:

| Entity type | `data` shape (suggested) | Source |
|---|---|---|
| `service` | `{ description, category, base_price?, duration_minutes?, active? }` | Hermes `services.py` |
| `faq` | `{ question, answer, category?, priority?, view_count?, helpful_count? }` | Hermes `faqs.py` |
| `question` | `{ text, category?, source?, occurrence_count?, last_seen? }` | Hermes `questions.py` |
| `pricing` | `{ amount, currency?, unit?, notes? }` | Implied by Hermes pricing index |
| `staff` | `{ role?, specialization?, bio? }` | Hermes `staff.specialization` |
| `case_study` | `{ summary?, client?, outcome?, date? }` | Implied |

These are conventions, not enforced — JSON Schema per type would be a component-10 (testing) addition if needed. The graph itself is type-agnostic.

### Relationship types

Seeded from Hermes; open union for downstream components.

| Type | From → To | Source |
|---|---|---|
| `has_answer_for` | service → faq | Hermes explicit |
| `relates_to` | question → service (or generic) | Hermes explicit |
| `offered_by` | service → staff | Hermes index on staff.specialization |
| `priced_by` | service → pricing | Hermes pricing index |
| `demonstrated_by` | service → case_study | Hermes case study constraint |

### Public API (KnowledgeGraph class)

```ts
class KnowledgeGraph {
  constructor(db: D1Database, business: BusinessConfig)

  // Entity CRUD
  createEntity(input: EntityInput): Promise<Entity>
  getEntity(id: string): Promise<Entity | null>
  getEntitiesByType(type: EntityType, opts?: ListOptions): Promise<Entity[]>
  updateEntity(id: string, patch: EntityPatch): Promise<Entity | null>
  deleteEntity(id: string): Promise<boolean>
  searchEntities(query: string, opts?: { type?: EntityType; limit?: number }): Promise<Entity[]>
  count(type?: EntityType): Promise<number>

  // Relationship CRUD
  createRelationship(input: RelationshipInput): Promise<Relationship>
  getRelationship(id: string): Promise<Relationship | null>
  deleteRelationship(id: string): Promise<boolean>

  // Traversal
  getRelated(entityId: string, relationType?: RelationType, direction?: "out"|"in"|"both"): Promise<RelatedEntity[]>
}
```

## Design decisions

1. **Single-table generic design** (architecture doc §5 spec). One `entities` table for all types; type-specific fields live in JSON `data`. Alternative (Hermes-style per-label tables) was rejected because it forces schema churn for every new business shape and breaks the wireframe's business-agnostic core. Cost: type-specific columns can't be indexed directly; mitigated by SQLite `json_extract()` and by component 8 (Vectorize) handling semantic search.

2. **`id` as global PK (TEXT).** Caller prefixes ids with the business slug (`entityId()` helper). Within a business, `(type, name)` is unique-indexed. Pattern: `<business_id>:<type>:<slug>` — debuggable in SQL, no UUID entropy.

3. **Business-implicit scoping.** `KnowledgeGraph` takes a `BusinessConfig` at construction; every method auto-applies `business_id`. Callers can't accidentally cross business boundaries — a bug that passes SP's `business_id` to a TFM query gets zero results, not a leak. This is the literal mechanism behind §0's "core logic knows nothing about SP or TFM specifically."

4. **Local minimal `D1Database` interface** in `types.ts` (not `@cloudflare/workers-types`). Keeps this component dep-free and the diff small. Cost: the interface is a hand-rolled subset; installing `@cloudflare/workers-types` later would (a) supply the full type here AND (b) fix pre-existing `PagesFunction`/`R2Bucket` tsc errors in `functions/api/{ask,lead}.ts`. CT105's call to bless the devDep.

5. **`getRelated` direction default = "out".** Matches the §5 spec literally (`getRelated(entityId, relationType)`); `"in"` and `"both"` available for "which services reference this FAQ?" patterns.

6. **Free-text `searchEntities` via SQLite LIKE.** Fine for Phase 1 corpus sizes (hundreds of entities per business). Component 8 (Vectorize) is the production semantic-search path — this method is for admin/index UIs and small lookups, not the agent.

7. **No live D1 binding on bird.** Per §3 deployment map, bird never runs `wrangler d1`. CT105 creates + binds the D1 database at review time. Verification here used a `MockD1` adapter over Node 22's `node:sqlite` — real SQL execution against the actual migration file (catches SQL bugs a Map mock would miss).

## How downstream consumes it

- **Component 2 (MCP server):** `faq_search`, `service_catalog`, `pricing_lookup`, `question_search`, `knowledge_query` tools all query the graph.
- **Component 5 (agent):** decides which tool to call based on user intent, then composes the graph's response into an answer.
- **Component 8 (vector search):** uses the graph as the source of truth for entity metadata (Vectorize holds embeddings; the graph holds facts).

## Verification

- `npm run build` — passes.
- `tsc --noEmit` — no errors in `src/lib/ecosystem/knowledge-graph/*` or `migrations/*`.
- Smoke test (`/tmp/opencode/smoke-graph.mjs`) — exercises entity CRUD, relationship CRUD, both traversal directions, business scoping (SP cannot see TFM entities), FK cascade, and the unique constraints. **36 checks, all pass.**

## Open items / TODOs

- **Ajv-style strict validation** of `data` per entity type — deferred to component 10 (testing) so test runner + validation stack lands as one decision.
- **Multi-hop traversal** (`getRelatedDepth(entityId, type, depth)`) — not in §5 spec, deferred until a concrete query needs it. Single-hop `getRelated` covers every Hermes pattern.
- **`@cloudflare/workers-types` devDep decision** — see LEADS in session report.
- **Seed data:** the catalog (component 9) is the only place business data currently lives. A seed file (`scripts/seed-sp-graph.ts` or similar) that turns CLAUDE.md's SP facts (services, four-movement method, locked hero copy) into actual graph rows is a natural P1 follow-up — flagged but not built here, to keep component 1's scope to the storage layer only.

## Hand-off to CT105

- **Migration:** `migrations/0001_ecosystem_knowledge_graph.sql` is ready to apply against a new D1 database. Create the DB, bind it in Pages project settings, then `wrangler d1 migrations apply`. Confirm with a row count: `wrangler d1 execute <db> --command "SELECT COUNT(*) FROM entities"`.
- **No `wrangler.toml` changes from bird.** Binding name suggestion: `ECOSYSTEM_DB` (so functions read `env.ECOSYSTEM_DB`). Open to CT105's preference.
- **No existing chatbot regression risk.** `ask.ts` and `lead.ts` are untouched; this component is library-only until component 2 wires HTTP entry points.
