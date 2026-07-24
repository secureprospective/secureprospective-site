# Component 10 — Testing & Monitoring

**Status:** Implemented (P1 — per §5 priority order, the highest-priority component after the §8 P0 slice + first P2).
**Last updated:** 2026-07-20 (fourth session, codeword "prove it").
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5.10 ("Testing & Monitoring"), §0.5 ("AI citation-rate measurement"), §5 P1 row.

## What this component is

Three deliverables per §5.10, plus LEAD #4 (Ajv validation, explicitly deferred here from component 9):

1. **Structured logging helper** — thin wrapper, no new infra. Sink-injectable; default emits JSON-lines to console (Workers captures these into Logs).
2. **Vitest/unit test scaffolds** per P0+P2 component + `npm test` wired. Per §5.10: *"none currently configured in package.json — GLM should pick one, e.g. Vitest."* (Explicit delegation — Vitest installed as devDep.)
3. **AI citation-rate measurement fixture** — per §0.5: *"a checked-in list of 30–100 realistic customer questions, logged periodically against ChatGPT/Perplexity/Gemini/Claude."* This is the actual measurement mechanism behind the original Hermes blueprint's "AI citation rate" success metric.
4. **Ajv strict JSON-Schema validation** (LEAD #4) — code-complete seam with lazy `import('ajv')` + fallback to the existing hand-rolled validator in `catalog/loader.ts`. The actual `ajv` runtime-dep install is Christopher's ruling (not delegated).

## What's implemented

### Test-runner wiring

| File | Role |
| ── | ── |
| `package.json` (scripts.test, scripts.test:watch, scripts.test:ui) | `npm test` runs `vitest run`; `npm run test:watch` for interactive; `npm run test:ui` for browser UI |
| `package.json` (devDependencies.vitest) | Vitest 4.1.10 installed as devDep (doc §5.10 explicitly delegated the runner pick to GLM) |
| `vitest.config.ts` | Includes `src/lib/ecosystem/**/*.test.ts`; node environment; explicit imports (no globals → no tsconfig change) |

### Test files (6 ports from `/tmp/opencode/` + 1 new)

| File | Tests | Ported from |
| ── | ── | ── |
| `src/lib/ecosystem/catalog/catalog.test.ts` | 29 | smoke-catalog.mjs |
| `src/lib/ecosystem/knowledge-graph/knowledge-graph.test.ts` | 43 | smoke-graph.mjs |
| `src/lib/ecosystem/vector-search/vector-search.test.ts` | 29 | smoke-vector.mjs |
| `src/lib/ecosystem/mcp/mcp.test.ts` | 19 | smoke-mcp.mjs |
| `src/lib/ecosystem/agent/agent.test.ts` | 24 | smoke-agent.mjs |
| `src/lib/ecosystem/orchestration/orchestration.test.ts` | 36 | smoke-orchestration.mjs |
| `src/lib/ecosystem/monitoring/monitoring.test.ts` | 22 | new — covers logger, detectMention, runner, summarizeResults, Ajv seam |
| **Total** | **202 passing** | (vs 349 raw `check()` calls in the smoke suite — see "Test-count metric" below) |

### Shared test helpers

| File | Role |
| ── | ── |
| `src/lib/ecosystem/testing/mock-d1.ts` | Typed MockD1 (port of `/tmp/opencode/d1-mock.mjs`). Real SQL execution via `node:sqlite`; catches SQL bugs a Map mock would miss. |
| `src/lib/ecosystem/testing/node-ambient.d.ts` | Minimal ambient types for `node:sqlite`/`fs`/`url`/`path` used by test helpers. Deleted automatically when LEAD #3 lands and `@cloudflare/workers-types` provides real types. |
| `src/lib/ecosystem/testing/index.ts` | Barrel |

### Monitoring module (`src/lib/ecosystem/monitoring/`)

| File | Role |
| ── | ── |
| `logger.ts` | `LogLevel`, `LogSink`, `ConsoleJsonLogSink`, `Logger` (with `.child()` + defaults merge), `logger` module-level default |
| `citation-fixture.ts` | Types + `detectMention(responseText, business)` — specificity-ordered detection: url → domain → name; returns `MentionShape` + ±60-char excerpt |
| `citation-runner.ts` | `CitationRunner` (fixture × clients), `LlmClient` injection seam, `TimeoutError`, `summarizeResults` → per-LLM `MentionSummary` with by-shape + by-category breakdowns |
| `ajv-validator.ts` | `validateWithSchema(cfg, schema)` — lazy `import('ajv')` throws `AjvNotInstalledError` when the dep is absent; callers fall back to the existing hand-rolled validator. The `@ts-expect-error` directive on the import becomes an auto-reminder when Christopher resolves LEAD #4. |
| `index.ts` | Barrel |
| `fixtures/secureprospective.citation-queries.json` | 50 queries across 5 categories (direct-intent, discovery, comparative, vertical-specific, brand-probe) |
| `fixtures/techfreedomministries.citation-queries.json` | 33 queries (TFM is minimally spec'd in the catalog — see LEAD #2; queries skew discovery/brand-probe) |
| `monitoring.test.ts` | 22 checks across all of the above |

### CLI script

| File | Role |
| ── | ── |
| `scripts/citation-benchmark.mjs` | Manual + automated runner. Auto-mode constructs LLM clients from env vars (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`); with no keys, falls back to manual mode (prints the prompt list for hand-pasting into ChatGPT/Perplexity/Gemini/Claude). Writes results to `citation-results/<business>-<timestamp>.jsonl` + emits per-LLM summary to stdout. Detection logic + summarization ported inline so the script has zero build step (just `node scripts/citation-benchmark.mjs`). |

## Public API

```ts
// Logger
type LogLevel = "debug" | "info" | "warn" | "error";
interface LogSink { log(level: LogLevel, event: string, fields: LogFields): void; }
class Logger {
  constructor(opts?: { sink?: LogSink; defaults?: LogFields });
  child(fields: LogFields): Logger;
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

// Citation fixture + detection
interface CitationFixture {
  businessId: string;
  version: string;
  queries: CitationQuery[];   // { id, query, category }
}
type MentionShape = "domain" | "name" | "url" | "none";
function detectMention(responseText: string, business: Pick<BusinessConfig, "id" | "name">): MentionDetection;

// Citation runner
interface LlmClient { name: string; query(prompt: string): Promise<string>; }
class CitationRunner {
  constructor(fixture: CitationFixture, business: BusinessConfig, clients: LlmClient[]);
  runAll(opts?: RunnerOptions): Promise<CitationResult[]>;
  runOne(queryId: string, client: LlmClient, opts?: RunnerOptions): Promise<CitationResult>;
}
function summarizeResults(results: CitationResult[]): MentionSummary[];

// Ajv validator seam
type ValidationResult = { valid: true } | { valid: false; errors: string[] };
class AjvNotInstalledError extends Error {}
async function validateWithSchema(cfg: unknown, schema: unknown): Promise<ValidationResult>;
```

## Decisions made

1. **Vitest picked as the test runner per explicit §5.10 delegation.** The doc says *"none currently configured in package.json — GLM should pick one, e.g. Vitest."* That overrides the usual lane rule (Christopher owns package.json rulings) for this specific dep — Vitest 4.1.10 added as devDep without a LEAD. The dep is dev-only (not shipped to Cloudflare Pages production); it transitively brings `vite` + `@vitest/expect` + `@vitest/utils` (37 packages total).

2. **Ajv kept optional behind a lazy import seam (LEAD #4 unchanged).** Ajv is NOT explicitly delegated the way Vitest is, and the precedent from LEAD #3 (`@cloudflare/workers-types` devDep) and LEAD #5 (`agents` runtime dep) is "stub + flag, Christopher rules." Same pattern here: `validateWithSchema()` is code-complete, the loader can adopt it with a one-line change once Christopher rules, and the `@ts-expect-error` on the dynamic import is an auto-reminder when the dep lands. The existing hand-rolled `validate()` in `catalog/loader.ts:57-98` remains the default validator.

3. **Test ports consolidate assertions; raw check count drops from 349 to 202.** The `/tmp/opencode/` smoke tests use a hand-rolled `check(name, cond)` helper that emits one row per check. Vitest's idiom is one `it()` per behavior with multiple `expect()`s inside. The verification scope is preserved (every assertion from the smoke tests has a corresponding `expect()` in the port) but the metric shape changes. The §8 architecture-doc verification target is unchanged: catalog → graph → vector → MCP → agent answer, exercised end-to-end on fake data.

4. **Test helpers under `src/lib/ecosystem/testing/`, not under a top-level `test/` or `__tests__/`.** Co-located with the library code so imports stay short (`from "../testing"`). The vitest config's include glob catches only `*.test.ts` for execution — helper `.ts` files are imported but not run as tests.

5. **`MockD1` kept as the only shared test helper.** Other smoke tests' fakes (fake embedder, fake index, fake AI client, fake fetch, fake router) are test-specific — they stay inline in each `.test.ts` file. Only `MockD1` is shared across 3+ tests (graph, mcp, agent) and bridges Node's `node:sqlite` to the D1 interface, so it earned its own module.

6. **`node-ambient.d.ts` declares minimal Node built-in module types.** Without `@types/node` (LEAD #3 unresolved), TS can't resolve `node:fs`/`url`/`path`/`sqlite` imports in test files. Rather than block component 10 on LEAD #3 or scatter `@ts-expect-error` directives, a single ambient declaration file provides the narrow surface the test helpers actually touch. When LEAD #3 lands, the file deletes itself (the real types take over).

7. **Citation fixture queries grouped into 5 categories.** `direct-intent` (ready to hire), `discovery` (exploring the concept), `comparative` (vs other vendors/approaches), `vertical-specific` (industry-named), `brand-probe` (directly naming the business). Categories are data-only — they drive `summarizeResults`'s by-category breakdown so Christopher can see "we mention rate is high in brand-probe but low in direct-intent" rather than a single flat metric.

8. **SP fixture has 50 queries, TFM has 33.** §0.5 spec says "30-100." SP skews toward direct-intent + brand-probe (the goal is discovery of new business). TFM skews discovery + brand-probe because TFM's market category is still being defined (LEAD #2 placeholder email is one symptom). Both fixtures are versioned (`"version": "2026-07-20"`) — refresh quarterly as market language evolves.

9. **CLI script (citation-benchmark.mjs) ports detection + summarization logic inline.** The script lives in `scripts/` (outside the Astro build), runs on plain Node without a build step, and zero-imports from the TypeScript library. This means Christopher can run it from any checkout without `npm install` first. The trade-off: the detection logic exists in two places (lib + script). Refactor candidate if it diverges.

10. **No live LLM calls in test or build.** Per §3 (no deploys from bird) and the standing pattern: external API access is CT105's wiring lane at production time. The runner takes injected `LlmClient`s; tests use fakes; the CLI's auto-mode errors cleanly to manual when env vars are absent.

## Hand-off to CT105

For the runner to actually measure citation rate against real LLMs:

- **Set API keys in env** (any subset works — the runner uses whatever's available): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`. Optional model overrides via `OPENAI_MODEL` / `ANTHROPIC_MODEL` / `GEMINI_MODEL` / `PERPLEXITY_MODEL`.
- **First run, recommended:** do it manually once before automating. `node scripts/citation-benchmark.mjs --business secureprospective --manual` → paste each query into ChatGPT/Perplexity/Gemini/Claude by hand, eyeball the responses, then move to automated mode once the fixture feels right.
- **Automated:** `node scripts/citation-benchmark.mjs --business secureprospective` writes `citation-results/<business>-<timestamp>.jsonl` + emits per-LLM summary to stdout. Set up a cron (Hermes or otherwise) per §0.5: *"logged periodically."*
- **Refresh the fixtures quarterly.** Market language drifts; the queries should track how customers actually phrase these questions, not how the first-draft author guessed.

For the logger:

- **No wiring needed at runtime** — the default `ConsoleJsonLogSink` works in Workers. For richer observability (per-component defaults), construct a `Logger` with `{ business_id, component }` defaults at the top of each handler and pass it down. Component 5's `AgentResponse.toolCalls/toolResults` arrays are observability gold — log them as structured fields per answer.

For Ajv (when LEAD #4 lands):

- `npm install ajv`
- Update `catalog/loader.ts:validate` to call `validateWithSchema()` first, fall back to the existing hand-rolled `validate()` on `AjvNotInstalledError`. (Bird can do this in a follow-up; one-line change at the seam.)
- Remove `src/lib/ecosystem/monitoring/ajv-validator.ts`'s `@ts-expect-error` directive (tsc will flag it as unused).
- Update `monitoring.test.ts`'s "Ajv seam" test to exercise the positive-validation path (currently asserts `AjvNotInstalledError` because ajv is absent).

## LOW-CONFIDENCE ITEMS

None for component 10 itself — no Cloudflare API surface, no external service integration. All verification is local.

The runner's LLM client implementations in `scripts/citation-benchmark.mjs` make REST calls to public LLM APIs. The URL patterns + body shapes are based on current public docs as of 2026-07-20:

- **OpenAI** chat/completions endpoint (`POST /v1/chat/completions`) — stable for years; low risk.
- **Anthropic** messages endpoint (`POST /v1/messages` with `x-api-key` + `anthropic-version: 2023-06-01`) — verify the version date is still current at first automated run.
- **Google** generative-language endpoint (`POST /v1beta/models/<model>:generateContent?key=<key>`) — `v1beta` has been stable but may move to `v1`. Verify at first run.
- **Perplexity** OpenAI-compatible endpoint (`POST /chat/completions`) — model name `sonar` may have been renamed; verify current model list.

Each of these is the kind of thing that breaks silently in production. The runner's per-query error handling captures failures into the result log (as `detection.error`) rather than crashing the benchmark — so a single provider changing their API doesn't lose the data from the others.

## Hand-off summary

| Item | Owner | Action |
| ── | ── | ── |
| `npm install vitest` | Done | devDep added in this branch |
| Run `npm test` in CI | CT105 | add to Pages build pipeline if/when desired (currently a local-only check) |
| `npm install ajv` (LEAD #4) | Christopher rules | one-line wiring change in `catalog/loader.ts:validate` |
| First citation benchmark run | Christopher | `node scripts/citation-benchmark.mjs --business secureprospective --manual` to eyeball fixtures, then add API keys + automate |
| Quarterly fixture refresh | Christopher | market-language drift |
| LEAD #3 lands (`@cloudflare/workers-types`) | Christopher rules | delete `src/lib/ecosystem/testing/node-ambient.d.ts` (real types take over) |
