# Parked: the AI-ecosystem library and the chatbot lane

**Parked:** 2026-09-10 · **Recover from:** `2ae58179004ad2094e95a3e7d8f3e53c799d6d42`

## What was removed and why

The site repo carried a large body of code that nothing on the site imported. It
was the AI-ecosystem / chatbot build, paused until Christopher returns to it. It
was removed from the working tree because it was the sole cause of a permanently
red test suite, and because 180MB of abandoned site variants made the repo
expensive to clone and search.

| Path | What it was | Size |
|---|---|---|
| `src/lib/ecosystem/` | The 10-component AI-ecosystem library: knowledge graph, MCP server, agent, vector search, orchestration, monitoring, transcription, CRM/booking, catalog, a2a. Zero imports from any page, component, layout, script or Function. | 51 files, 436KB |
| `scripts/citation-benchmark.mjs` | Driver for the monitoring component's citation benchmark. Reads fixtures from `src/lib/ecosystem/monitoring/fixtures`, so it could not survive on its own. | 1 file |
| `concepts/a-immersive/`, `concepts/b-radical/` | Two complete abandoned site variants from the redesign. Superseded by the live site; still carried the retired `secureprospective@gmail.com` address and pre-launch copy. | 85 tracked files, 180MB on disk |
| `.impeccable/` | Design-critique run artifacts. | 7 tracked files |

## Why the tests were failing

Four test files, all inside `src/lib/ecosystem/`:

- `agent.test.ts`, `mcp.test.ts`, `knowledge-graph.test.ts` — all three died before
  the first assertion on `Module did not self-register: better_sqlite3.node`. The
  native binary was never built for this Node version. `MockD1` cannot construct
  without it, so 86 tests were being skipped, not passing.
- `catalog.test.ts` — one real failure: it asserted
  `sp.contact.email === "info@secureprospective.com"` while the business config
  still said `secureprospective@gmail.com`. The address moved to `info@` across
  the site; the config behind the chatbot never followed.

## How to bring it back

Everything is in git history. Nothing was copied to a parked directory, because a
copy rots while history does not.

```bash
# See what was there
git show 2ae5817 --stat -- src/lib/ecosystem

# Restore the whole lane into the working tree
git checkout 2ae5817 -- src/lib/ecosystem scripts/citation-benchmark.mjs

# Restore the abandoned site variants, if they are ever wanted again
git checkout 2ae5817 -- concepts
```

Before restoring, expect to fix two things that were already broken when it was
parked: build the `better-sqlite3` native binary for the current Node version
(`pnpm rebuild better-sqlite3`), and reconcile the catalog's contact email to
`info@secureprospective.com`.

## What was deliberately kept

- **`docs/ai-ecosystem/`** — the full architecture spec and per-component docs.
  Documentation is cheap to keep and is the map back to the code.
- **`migrations/0001_ecosystem_knowledge_graph.sql`** — already applied to the live
  `ECOSYSTEM_DB` D1 database. Removing an applied migration would misrepresent the
  state of a real database.

## What replaced the test suite

`vitest.config.ts` now points at `tests/`, covering the Pages Functions the site
actually ships. `tests/lead.test.ts` exercises the contact form's capture endpoint:
every refusal path including a rejected Turnstile token, what gets written to R2,
and the guarantee that a failing email notification cannot turn a stored lead into
an error for the visitor.
