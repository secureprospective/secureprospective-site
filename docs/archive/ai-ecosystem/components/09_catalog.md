# Component 9 — Knowledge Catalog (`BusinessConfig`)

**Status:** Implemented (P0, first component per §5 priority order).
**Last updated:** 2026-07-20.
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §9, §6.

## What this component is

Defines the per-business plug-in data store. One `BusinessConfig` per business the wireframe serves. Every other component (knowledge graph, MCP server, agent, vector search, CRM/booking) takes a `BusinessConfig` as input — that's how the same code serves SP, TFM, and future clients without per-business code changes. This is the literal mechanism behind §0's wireframe rule ("core logic knows nothing about SP or TFM specifically").

Built first because nothing else typechecks meaningfully without it.

## What's implemented

| File | Role |
|---|---|
| `src/lib/ecosystem/catalog/types.ts` | `BusinessConfig` + `BusinessContact` + `BusinessMethod` + `BusinessCategory` TypeScript types |
| `src/lib/ecosystem/catalog/schema.json` | JSON Schema (draft 2020-12) — canonical contract; TS types mirror it |
| `src/lib/ecosystem/catalog/loader.ts` | `loadBusinessConfig(id)`, `listBusinessIds()`, `BusinessConfigError`, structural validator |
| `src/lib/ecosystem/catalog/index.ts` | Barrel re-export |
| `config/businesses/secureprospective.json` | SP config (real values from CLAUDE.md ground truth) |
| `config/businesses/techfreedomministries.json` | TFM config (minimal — voice per §6, contact flagged placeholder) |

### Schema fields

Required: `id`, `name`, `category`, `voice`, `serviceAreaRadius`, `contact.email`.

Optional enrichments: `domain`, `tagline`, `method.movements`, `method.loopCloser`, `contact.phone`, `contact.website`.

Faithful to §9 (`name, category, service area, brand voice constraints, contact info`) plus three optional enrichments downstream obviously needs and CLAUDE.md provides for SP — `domain`, `tagline` (SP's locked hero H2), and `method` (the four-movement IP + loop-closer). TFM omits `tagline` and `method` because no ground truth exists for them.

### Loader behavior

- Static registry of ESM JSON imports (works in both Astro build and Cloudflare Pages Functions).
- Validates each config once per worker isolate, then caches the pass via a `Set<string>`. Lazy validation keeps cold-start fast for unused businesses.
- Throws `BusinessConfigError` on: unknown id, missing required keys, wrong types, empty strings, id/file mismatch.
- `listBusinessIds()` exposed for admin/index endpoints.

## Design decisions

1. **Static registry, not dynamic load.** A registry means the catalog knows SP and TFM by name. That's plumbing, not business logic — every other component stays agnostic. Dynamic load by path is fragile on Workers (no FS). Cost of a new business: one import + one registry entry, no other code changes.
2. **No Ajv yet.** JSON Schema is the canonical contract; a hand-rolled structural validator enforces the common authoring mistakes. Strict Ajv-backed validation ships with the test runner in component 10 (avoids a dependency bump in P0; lets component 10 own the test+validation stack as a single decision).
3. **Voice as a single string.** §9 says "brand voice constraints" (plural) but §6 ships it as one string and that's what the agent will concatenate into prompts anyway. Structured constraints (do/don't lists, prohibited phrases) can be added later if prompt-engineering demands it — not now, not on speculation.
4. **`category` as an open union.** Locked seeds (`technical_consulting`, `ministry`) plus `string & {}` so a new business shape doesn't break the type — downstream code that switches on category still has to handle a default branch.

## How downstream consumes it

- **Component 1 (knowledge graph):** `business_id` is the partition key on every entity/relationship row. Graph queries are always scoped to one business.
- **Component 2 (MCP server):** tool descriptions and response framing use `name`, `tagline`, `voice`.
- **Component 5 (agent):** `voice` becomes a clause in the system prompt; `method` answers "what's your process?" questions; `contact` powers booking-handoff.
- **Component 6 (CRM/booking):** `contact` + `serviceAreaRadius` drive adapter behavior.
- **Component 8 (vector search):** `business_id` scopes every query.

## Open items / TODOs

- **TFM contact email is a placeholder** (`placeholder-pending-confirmation@techfreedomministries.org`). Christopher needs to supply the real address before TFM goes live in any wave. Currently the loader accepts it (non-empty string) — flag, don't block.
- **Ajv strict validation** deferred to component 10 (test runner) so both decisions ship together.
- **Voice structure** stays a string until real prompt-engineering feedback says otherwise.

## Verification

- `npm run build` passes (confirmed at write time — see verification block in session journal).
- Loader unit tests deferred to component 10 (no test runner wired yet; architecture doc §10 owns that decision).
