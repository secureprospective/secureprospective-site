# SecureProspective — Claude Code Ground Truth
*Read this entire file before doing anything. If this file conflicts with anything said in the session, this file wins.*

---

## What This Project Is

Christopher Campbell's technical business consulting firm website. NOT an insurance retailer.

- **Domain:** secureprospective.com (Cloudflare Pages, auto-deploy from main)
- **Repo:** github.com/secureprospective/secureprospective-site
- **Local path (CT105):** /mnt/storage/claudebox/projects/secureprospective/
- **Bird clone path:** ~/qa/repos/secureprospective

---

## Stack (locked 2026-06-22)

| Piece | Detail |
|---|---|
| Framework | Astro + React islands |
| Animation | GSAP (scroll) + CSS (micro-interactions) — no Framer Motion |
| Styling | CSS custom properties via tokens.css — **no Tailwind, no font CDNs** |
| Forms | Formspree |
| Fonts | Primal (display, self-hosted) + IBM Plex Sans (body, self-hosted) |
| Deploy | Cloudflare Pages — auto-deploy from main |
| Build command | `npm run build` |
| Dev server | `npm run dev` |

Astro 4.11.0, pinned for Node 20 (CT105 + bird). Build verified on both machines.

---

## Workflow — Bird Scratch-Pad → CT105 Deploy Gate

1. **Bird (off-LAN, solo mode):** Christopher rough-drafts and demos locally via `npm run dev`. GLM + z.ai + Gemini triangle assists. Bird **never** deploys to Cloudflare.
2. **Return home:** CT105 fetches branch directly from bird (no GitHub credentials on bird). Claude reviews diff, `npm run build`, merges to main after Christopher's visual gate.
3. **Cloudflare Pages** auto-deploys from main.

Bird never runs `wrangler deploy` or `wrangler pages deploy`. CT105 owns the merge.

**Note on pull method:** bird can't push to GitHub (no credentials). CT105 fetches directly: `git remote add bird ssh://x@bird/home/x/qa/repos/secureprospective && git fetch bird <branch>`. Bird remote is already added on CT105.

---

## Strategic Picture (locked 2026-06-22)

**What SP is:** Technical business consulting — take businesses from "AI-bolted-on" to "AI-native." Two operating lines: (1) established IMO serving professional agents (current revenue + first internal proof); (2) consulting (the front-and-center flagship).

**Brand spine:** *se-curus* + *prospicere* = "look forward without fear, because the protection is already built." Sanctuary = invisible direction — felt in structure, never stated in copy.

**The four-movement method (brand IP / differentiator):**
Diagnose → Position → Shape → Transform
Loop-closer: *"What's native today gets re-diagnosed tomorrow. The loop doesn't end — your business just stops being the bottleneck."*

**TFM relationship:** TFM is SP's **first client** (not a sister project). Proof-of-work for the consulting practice.

**Three-career bio spine:** Technology = passion / Construction (15 yrs electrical) = objective truth / Insurance = responsibility.

**Hero copy (locked):**
- H2: *"Make AI native. Drop the prefix."*
- S1: *"We make businesses AI-native — diagnose the bottleneck, position the tool, shape the output for ownership."*

**IA (6-section, thesis-first — Option C):** Home / The Method / The Work / Services / The Operator / Contact

---

## Design System (locked — full spec in docs/DESIGN_SYSTEM.md)

**Color tokens:**
| Token | Hex | Role |
|---|---|---|
| `--silver-base` | #E5E4E2 (platinum, dead-matte) | Primary surface |
| `--blue-brand` | #0033A0 | Brand color blocks, depth sections |
| `--gold-identity` | #D4AF37 | Logo / key brand moments only — use sparingly |
| `--yellow-accent` | #FFD700 | Solid UI only — CTAs, hover-active. NEVER text on dark/blue |
| `--ink` | #222222 | Primary text |
| `--white` | #FFFFFF | Clean information surfaces |

**Motion:** Fast/snappy — 120–200ms, Bloomberg ticker feel. NOT slow/deliberate.

**Anti-list:** no organic curves, no pastels, no script/serif type, no shadows, no rounded pills, no full-bleed photography, no multi-hue gradients, no glassmorphism, no bouncy easings, no Tailwind, no font CDNs.

**Mood anchor:** corporate badge × transit signage × financial ledger × storm shelter × vault.

---

## Pillars

Business, Creative

---

## Cloudflare Configuration

*Inventoried 2026-06-22.*

### DNS Records

| Name | Type | Content | Proxied | TTL |
|---|---|---|---|---|
| `secureprospective.com` | CNAME | `secureprospective-site.pages.dev` | ✅ | Auto |
| `www.secureprospective.com` | CNAME | `secureprospective.com` | ✅ | Auto |
| `_domainconnect` | CNAME | `_domainconnect.gd.domaincontrol.com` | ✅ | Auto |
| `jellyfin` | CNAME | `773073cd-b07b-4acf-a066-3d1be4c198aa.cfargotunnel.com` | ✅ | Auto |
| `nextcloud` | CNAME | `773073cd-b07b-4acf-a066-3d1be4c198aa.cfargotunnel.com` | ✅ | Auto |
| `nexus` | CNAME | `37f773e3-fe01-42e0-a0c1-7d2169a987a3.cfargotunnel.com` | ✅ | Auto |
| `seerr` | CNAME | `773073cd-b07b-4acf-a066-3d1be4c198aa.cfargotunnel.com` | ✅ | Auto |
| `_dmarc` | TXT | `v=DMARC1; p=reject; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | ❌ | Auto |

### Hosting — Cloudflare Pages

- **Project name:** `secureprospective-site` (pages.dev: `secureprospective-site.pages.dev`)
- **Production branch:** `main`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Uses Functions:** Yes | **Node version:** 20

✅ **Pipeline connected 2026-06-23** via a git-connected project `secureprospective-site` (main / `npm run build` / `dist` / NODE_VERSION=20).

✅ **DOMAIN CUTOVER COMPLETE 2026-06-23 (evening), reconfirmed live 2026-06-26.** `secureprospective.com` + `www` serve `secureprospective-site` (live with the real 6-page site + chatbot). DNS CNAMEs repointed apex+www → `secureprospective-site.pages.dev` (proxied). **Old `webpage` project DELETED 2026-07-04** — verified 0 custom domains attached (via CF dashboard AI assistant) before deletion.

**Pages project bindings (production + preview):** `CF_API_TOKEN` (secret, for the chatbot Function — **edited 2026-07-04** from broad account token to `AI Search: Read` + `Workers AI: Read` + `Workers R2 Storage: Edit`; still account-wide on R2, not bucket-scoped to `ccwork-leads` — revisit if tighter scoping wanted), `NODE_VERSION=20`, `LEADS` → R2 bucket `ccwork-leads`. **Uses Functions: YES.**

### Tunnels

| Name | Tunnel ID | Status | Hostnames → Origin |
|---|---|---|---|
| `Home` | `773073cd-...` | 🔴 DOWN (since 2026-03-22) | jellyfin → `192.168.40.79:8097`; nextcloud → `:7580`; seerr → `:5055` |
| `casaos-nexus` | `37f773e3-...` | 🟢 healthy | nexus → `localhost:8700` |

⚠️ **`Home` tunnel down** — jellyfin, nextcloud, seerr DNS records are stale/dangling. Traffic unreachable. Clean up when convenient.

### Other

- **Page Rules / Transform Rules / Cache Rules / Worker Routes / Firewall / Access:** None
- **SSL/TLS mode:** `Full (Strict)` — upgraded 2026-07-04
- **Plan:** Free | **Zone:** Active
- **Nameservers:** `connie.ns.cloudflare.com`, `lamar.ns.cloudflare.com`

---

## Current Build State

**🚀 LIVE IN PRODUCTION on `secureprospective.com` (2026-06-23 evening).** Full 6-page site + lead-gated interactive-resume chatbot, merged to `main`, deployed, domain cut over. **Hardening pass DONE 2026-07-04** (SSL Full Strict, least-privilege chatbot token, old `webpage` project deleted).

- **Phase 0 COMPLETE** — scaffold (commit `2ea6ec5`), brand assets in `grafix/`.
- **Full site built (bird, 2026-06-22→23) + MERGED TO MAIN (`efaefae`):**
  - Home + 5 IA pages: The Method, The Work, Services, The Operator, Contact (`src/pages/*.astro`, ~2070 lines)
  - Shared `Nav.astro` + `Footer.astro`; design system `tokens.css`/`fonts.css`; GSAP scroll motion
  - Design system: `docs/DESIGN_SYSTEM.md` (locked); sharp 2px corners, silver/blue/gold/yellow, Primal display
  - Builds clean on CT105 + bird.
- **Interactive-resume chatbot LIVE** (see section below). `/api/ask` (grounded RAG) + `/api/lead` (R2 capture), lead-gated widget on every page via `Layout.astro`.
- **Cloudflare:** git pipeline + domain cutover both DONE. Production = `secureprospective.com` / `secureprospective-site.pages.dev`.
- **Branch `session/secureprospective-draft-v1`** = source of all the above; `main` fast-forwarded to it. Helper `scripts/list-leads.sh` on branch (one commit ahead of the deployed `efaefae`).

### Interactive-Resume Chatbot (the CCwork build, shipped here)

Lead-gated public chatbot answering questions ABOUT Christopher in the third person,
grounded in the CCwork profile-cast corpus. **Full Cloudflare runbook + every gotcha:
knowledge-vault `02_wiki/cloudflare.md`.**

- **Backend:** R2 `ccwork-profile-cast` (10 public docs) → AI Search `ccwork-resume`
  (embedding `@cf/qwen/qwen3-embedding-0.6b`, generation `@cf/google/gemma-4-26b-a4b-it`,
  namespace `default`, chunk 1024/overlap 10, max 5, threshold 0.4). 10/10 indexed, 33 vectors.
- **`functions/api/ask.ts`** — two-step retrieve→generate via REST (proven path, not the
  binding), strict third-person + deterministic refusal, origin-locked, token server-side.
  Passed adversarial grounding test (refuses even on tangential chunks).
- **`functions/api/lead.ts`** — name/email → one JSON object per lead in R2 `ccwork-leads`.
- **`src/components/ChatWidget.astro`** — bottom-right launcher, **hard gate** (name+email)
  before chat unlocks, then `/api/ask`. Vanilla JS, design-system styled.
- **Leads:** `./scripts/list-leads.sh` (token via env or `/root/.cf_token`).
- **Model is a knob:** swap generation model in AI Search; Claude via AI Gateway on standby.

---

## Hermes Inbox (docs/from-hermes/)

Standing convention (started 2026-07-07): Christopher uses Hermes on the go to drop ideas/builds/notes for later work here. When he says "pull it/them over" (or similar), fetch the named folder from Hermes (`ssh -i /root/.ssh/hermes hermes@192.168.1.222`) via `scp -r`, land it under `docs/from-hermes/<name>/`, verify file counts match, then delete the source on Hermes. Do not build from these unprompted — they're staging, not committed scope.

- **`docs/from-hermes/CT105/`** — pulled 2026-07-07, deleted from Hermes after transfer (10 files). Original "AI-first business ecosystem" planning blueprint (Python/Neo4j/Docker stack). **Promoted to real scope 2026-07-07** — see `docs/ai-ecosystem/ARCHITECTURE.md` for the Cloudflare-native rebuild + scaffold brief being handed to GLM 5.2 on bird. Keep the raw Hermes docs here for reference (esp. the Knowledge Graph and MCP Server component specs, which have real detail worth mining).

---

## Open Items

- [x] Cloudflare dashboard inventory — complete (2026-06-22)
- [x] Connect Pages to GitHub — **DONE 2026-06-23.** NEW git-connected project `secureprospective-site` (main / `npm run build` / `dist` / NODE_VERSION=20), live + verified at `secureprospective-site.pages.dev`. The old `webpage` project was direct-upload and can't be converted, so a new project was made; `webpage` still serves the domain.
- [x] **Domain cutover — DONE 2026-06-23 evening.** `secureprospective.com` + `www` attached to `secureprospective-site`, DNS repointed. Reconfirmed live 2026-06-26.
- [x] **Upgrade SSL/TLS Full → Full (Strict)** — DONE 2026-07-04.
- [x] **Least-privilege token for the chatbot Function** — DONE 2026-07-04. `CF_API_TOKEN` edited in place (`super-band-f10c`) to `AI Search: Read` + `Workers AI: Read` + `Workers R2 Storage: Edit`. Note: R2 scope is still account-wide, not bucket-scoped to `ccwork-leads` — the account-level token editor doesn't offer per-bucket scoping (that's only in R2's own "Manage API tokens" UI). Revisit later if tighter scoping wanted.
- [x] **Delete old `webpage` Pages project** — DONE 2026-07-04. Verified 0 custom domains attached first (via CF dashboard AI assistant), then deleted.
- [ ] Retrieval tuning: `match_threshold 0.4` refuses vague phrasings ("what licenses" vs "what insurance licenses") — lower if more lenience wanted.
- [x] Clean up stale `Home` tunnel DNS records (jellyfin, nextcloud, seerr) — **DONE 2026-06-23**, deleted + confirmed via dig. The dead `Home` tunnel object itself still exists; delete whenever.
- [ ] Christopher picks winning elements from 3 design views → integrate into Astro
- [ ] Calibrate silver hex against actual Silver Logo PNG (accept #E5E4E2 or refine)
- [ ] Self-host IBM Plex Sans (currently system fallback)
- [ ] Integrate real brand symbol SVG (currently text lockup in nav)
- [x] Build remaining 5 pages — DONE (bird, merged `efaefae`)
- [ ] Verify CTA scroll collision bug Gemini flagged (Playwright check on bird)
- [ ] Fix bird's `website.md` agent file: line 21 incorrectly says TFM uses Tailwind — correct to "Astro + React + CSS custom properties (tokens.css)"
- [ ] Design polish pass on the live 6 pages (Christopher reviewed + approved the chatbot UX; broader page-design review still open)
- [x] **AI-ecosystem wireframe scaffold** — **MERGED TO MAIN 2026-07-24 (`4424f40`, squash-merged from `session/ai-ecosystem-scaffold` to satisfy main's linear-history branch protection).** All 10 components, 225/225 tests, clean build, all 5 review LEADS resolved (real TFM email set; `@cloudflare/workers-types` added, also fixing 2 pre-existing tsc errors; `ajv`/`agents` SDK deferred to the wiring phase). Pure library code under `src/lib/ecosystem/` — not wired into any live page/route, so this deploy is inert on the live site. Full spec: `docs/ai-ecosystem/ARCHITECTURE.md`. **Next:** the real-Cloudflare-wiring phase (D1, Vectorize, Agents SDK, AI Gateway, JWT bindings) is a separate, not-yet-started follow-on.

---

## Next Branch

**AI-ecosystem wiring phase IN PROGRESS on `session/ai-ecosystem-wiring` (2026-07-24, not pushed to main).** See "Wiring Phase Progress" below for exact state. Next up when resuming: set up Cloudflare Access (team domain + AUD tag) so the MCP server + knowledge-graph write endpoints can go live, or continue with steps 5+ (agent/composer wiring) on read-only pieces in the meantime.

## Wiring Phase Progress (2026-07-24, branch `session/ai-ecosystem-wiring`)

**Step 1 — D1 database: DONE + verified live.** Created `secureprospective-ecosystem` (id `76a9973f-eef6-4d37-acd3-92e378e04151`), migration applied (`entities`+`relationships` tables), bound as `ECOSYSTEM_DB` on both Pages environments via the Cloudflare dashboard AI assistant (relayed through `/root/paste.md` — my API token lacks Pages scope by design, kept narrow on purpose). Verified independently via a throwaway probe Function on a preview deploy (not just trusting the assistant's self-report) — confirmed real, then removed.

**Step 2 — Vector search: DEFERRED (Christopher's call).** No real business content (FAQs/services prose) exists yet to index, and reusing the existing `ccwork-resume` AI Search instance would wrongly blend Christopher's personal resume corpus with SP's business content. The D1 knowledge graph (structured FAQ/service entities) covers P0 Q&A without it. Revisit once there's real unstructured content worth indexing semantically.

**Step 3 — HTTP layer:**
- `functions/api/ecosystem/catalog.ts` — **DONE, pushed (`d666023`), verified live** on the preview deploy (`GET /api/ecosystem/catalog[?business=]`). Read-only, no bindings/secrets, safe with no auth.
- `functions/api/ecosystem/knowledge-graph.ts` + `functions/api/ecosystem/mcp/router.ts` — **built, committed locally only (`cbaeddf`), NOT pushed.** Both verified end-to-end against a local D1 copy via `wrangler pages dev` (seeded real entities, exercised every route, confirmed the MCP tool chain genuinely works — pricing_lookup/service_catalog/etc. return real graph-traversal results). Auth fails closed on both (401 with or without a JWT) because no Cloudflare Access application exists on this account yet ("Access: None" in the Cloudflare Configuration section above) — there's no real `AccessJwtValidator` to check against. **Do not push/merge these two files until Access is configured** — that's step 4, deliberately not done yet.
- MCP router uses the local `McpServer` class directly, not the Cloudflare Agents SDK (`agents` package) — installing that dependency needs Christopher's explicit sign-off first (LEAD #5 from the original scaffold). Swapping in the real SDK later doesn't change the underlying `McpServer.listTools()`/`dispatch()` contract this file relies on.
- Vector search in the MCP router uses a `NullVectorSearchBackend` (always returns `[]`) per the step 2 deferral — tools still work via the graph keyword-search path.

**Remaining steps (4 and onward) unchanged from the original handoff below** — resume there once Access is set up. Full history/rationale: memory `project_ai_ecosystem_wireframe`.

---

## AI-Ecosystem Wiring Phase — Handoff (not started, read before beginning)

**What exists today (merged to `main`, `4424f40`, 2026-07-24):** all 10 components of `src/lib/ecosystem/` are real, tested (225/225), typechecked code — but every Cloudflare-side piece (D1 database, Vectorize/AI Search index, JWT auth, real Workers AI calls, secrets) is either a local mock or a stub. `functions/api/ecosystem/` (the HTTP layer that would actually expose any of this) **does not exist yet**. Nothing here is live or reachable — this phase is what makes it real. Read `docs/ai-ecosystem/ARCHITECTURE.md` §3 (Scaffold → Deployment Map) in full before starting; it's the authoritative map of which arrow is whose job. Per-component detail lives in `docs/ai-ecosystem/components/0N_*.md`.

**Suggested build order (P0 first, matches the scaffold's own priority order):**

1. **D1 database (Component 1 — Knowledge Graph).** Create a D1 database, bind it as `ECOSYSTEM_DB` in the Pages project (production + preview), apply `migrations/0001_ecosystem_knowledge_graph.sql`. `KnowledgeGraph` in `src/lib/ecosystem/knowledge-graph/graph.ts` already targets the real `D1Database` interface — no code change needed, just the binding + migration + real seed data (currently only `MockD1` + fixtures exist, in-memory only).
2. **Vector search backend (Component 8).** Either a Vectorize index or reuse the existing AI Search instance (`ccwork-resume`, already live for the chatbot — see Cloudflare Configuration above) — `VectorSearch` supports both via `VectorizeBackend`/`AISearchBackend` in `src/lib/ecosystem/vector-search/`. Decide: separate index per business, or shared with per-business filtering? Backfill from real SP content once decided.
3. **`functions/api/ecosystem/` HTTP layer.** Doesn't exist yet — this is the actual thing that makes any of this reachable. Thin wrappers per the original structure decision (see `project_ai_ecosystem_wireframe` memory); route into `McpServer`/`Agent` from `src/lib/ecosystem/`.
4. **Real `AccessJwtValidator` (Component 2 — MCP Server).** Currently a contract-only stub in `src/lib/ecosystem/mcp/auth.ts`. **CRITICAL security gate — do not ship an MCP endpoint without real JWT signature verification.** Fetch Cloudflare Access JWKS, verify signatures properly. `docs/ai-ecosystem/ARCHITECTURE.md` §0.5 explains why this is non-negotiable (real security-scan data on public MCP servers with no auth).
5. **`WorkersAiComposer` wiring (Component 5 — Agent).** Real `accountId` + `apiToken` from Pages secrets (same pattern as the existing chatbot's `functions/api/ask.ts`). Default model `@cf/google/gemma-4-26b-it` per this file's existing convention.
6. **LEAD #5 (deferred at scaffold time): install the `agents` npm package** (Cloudflare's official Agents SDK) to replace the local minimal MCP transport stub — needed once Component 2 goes from "passes tests" to "actually serves requests."
7. **LEAD #4 (deferred at scaffold time): decide on `ajv`** for stricter `BusinessConfig`/entity-JSON validation — the hand-rolled fallback in `catalog/loader.ts` already works; `ajv` is a "nice to have," not a blocker, revisit if config volume grows.
8. **AI Gateway (Component 7 — Orchestration), only if multi-model routing is wanted for production.** `AiGatewayRouter` in `src/lib/ecosystem/orchestration/gateway.ts` is the real-shaped implementation already; needs an actual AI Gateway instance in the CF dashboard + provider-key secrets (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc.) if used. **`docs/ai-ecosystem/components/07_orchestration.md` flags 4 LOW-CONFIDENCE items — verify AI Gateway's current URL/provider-segment shape against live docs before wiring; this has changed before.** If multi-model routing isn't wanted yet, `WorkersAiComposer` alone (step 5) is a complete, simpler P0 path — both are designed to coexist, neither replaces the other.
9. **Citation benchmark (Component 10) — run once other pieces are live.** `node scripts/citation-benchmark.mjs --business secureprospective --manual` to eyeball fixtures first, then set any subset of `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`/`PERPLEXITY_API_KEY` and run automated. Writes `citation-results/<business>-<timestamp>.jsonl`. Set up a quarterly cron once trusted.
10. **Transcription (Component 3) — only when a real audio source exists.** Needs `WORKERS_AI_ACCOUNT_ID` + `WORKERS_AI_API_TOKEN`, a model choice (`@cf/openai/whisper-tiny-en` default), and `extractQuestions()` implemented (currently throws a documented "unimplemented" error). `docs/ai-ecosystem/components/03_transcription.md` flags 3 LOW-CONFIDENCE items (Whisper response shape, model id, audio size limits) — verify before wiring.
11. **CRM/booking (Component 6) — only when a real Jobber account exists.** OAuth handshake, token storage in Pages secrets, JSON:API body construction in `crm-booking/jobber.ts` (currently stubbed with documented TODO errors), wire the `create_booking`/`sync_customer` MCP tools, adversarial-test before going live (CRM writes are high-stakes). `docs/ai-ecosystem/components/06_crm_booking.md` flags 3 LOW-CONFIDENCE items (Jobber URL pattern, OAuth scope names, JSON:API vs GraphQL) — verify before wiring.
12. **Only after all of the above are live in a preview deploy AND pass an adversarial-refusal test:** refactor the existing `functions/api/ask.ts` chatbot to be a thin wrapper around `new Agent(...)` — per §3's "Existing chatbot" row, only after the new agent is independently proven. This is the point where the AI-ecosystem work actually starts serving the live chatbot instead of running in parallel.

**Hard rules carried forward from the scaffold brief (still apply):** no new paid external services without Christopher's sign-off; real secrets/bindings/deploys are CT105's job, never bird's; a merge to `main` triggers Cloudflare Pages auto-deploy, so treat every step here as touching the live site once a Function route exists (steps 1–2 don't, step 3 onward does).

**Full context if this file alone isn't enough:** `docs/ai-ecosystem/ARCHITECTURE.md` (full spec), `docs/ai-ecosystem/components/*.md` (per-component spec + what's real vs. stubbed), memory `project_ai_ecosystem_wireframe` (build history — the node:sqlite bug, all 5 LEADS resolutions, why this was squash-merged). Bird's own task-status file (`~/.config/opencode/foundation/memory/ai_ecosystem_scaffold_task.md` on bird) has the original build session's blow-by-blow if deeper archaeology is ever needed, but everything load-bearing has been folded up into this file and the memory node — you shouldn't need to SSH to bird to start this phase.
