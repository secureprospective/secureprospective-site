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

**Beelink routine-edit lane (added 2026-08-05):** a second clone lives on Beelink at `~/opencode/secureprospective-site`, wired with Impeccable for both Claude Code (`.claude/skills/impeccable`) and OpenCode (`.opencode/skills/impeccable`) — installed via `npx impeccable install` with harnesses `claude,opencode`. Purpose: routine/mechanical edits (design-system documentation drift, type-ramp/color fixups, small targeted Impeccable commands) run there on **DeepSeek free** (`opencode/deepseek-v4-flash-free`, opencode.ai's native free tier, no proxy needed — this is a different arrangement from Hermes's zen-noauth-proxy workaround) instead of burning Claude's tokens on mechanical work. Invoke: interactively via `opencode` (model picker) or one-shot via `opencode run --model opencode/deepseek-v4-flash-free "<task>"`, both from `~/opencode/secureprospective-site`. CT105 fetches the same way as bird: `git remote add beelink ssh://chris@beelink/home/chris/opencode/secureprospective-site && git fetch beelink <branch>` (SSH alias `beelink` added to `/root/.ssh/config`, key `/root/.ssh/beelink`). Claude still owns: design *judgment* (critique synthesis, live-mode direction planning, redesign calls), merge review, and the actual Cloudflare deploy — this lane is execution-only, same split as [[local_model_teammate_doctrine]]. First real output: DESIGN.md's Micro-UI Text Grays subsection (commit `93674ab`), closing a P3 finding from this session's critique.

---

## Strategic Picture (locked 2026-06-22)

**What SP is:** Technical business consulting — take businesses from "AI-bolted-on" to "AI-native." Two operating lines: (1) established IMO serving professional agents (current revenue + first internal proof); (2) consulting (the front-and-center flagship).

**Brand spine:** *se-curus* + *prospicere* = "look forward without fear, because the protection is already built." Sanctuary = invisible direction — felt in structure, never stated in copy.

**The four-movement method (brand IP / differentiator):**
Diagnose → Position → Shape → Transform
Loop-closer: *"What's native today gets re-diagnosed tomorrow. The loop doesn't end. Your business just stops being the bottleneck."* *(em dash removed 2026-08-05, see Content Rules below)*

**TFM relationship:** TFM is SP's **first client** (not a sister project). Proof-of-work for the consulting practice.

**Three-career bio spine:** Technology = passion / Construction (15 yrs electrical) = objective truth / Insurance = responsibility.

**Hero copy (locked):**
- H2: *"Make AI native. Drop the prefix."*
- S1: *"We make businesses AI-native: diagnose the bottleneck, position the tool, shape the output for ownership."* *(em dash removed 2026-08-05, see Content Rules below)*

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

### Content Rules (locked 2026-08-05)

**ZERO em dashes in anything a visitor reads.** All site copy and all page titles, no exceptions. Part of being AI-native is writing like it, not shipping the tell-tale AI-slop punctuation habit. Use a period, a colon, or a comma instead, and restructure the sentence if a straight swap reads awkwardly. The rule also binds the brand-voice sections of this file and PRODUCT.md/DESIGN.md (locked hero copy, brand spine, mood anchor, anti-list): those define the voice, so they hold themselves to it. It does not require scrubbing routine operational/infra prose elsewhere in these docs (changelog bullets, Cloudflare notes, build-state logs) — that's project record-keeping, not brand voice.

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

**Impeccable design-cleanup pass, session 2026-08-05: MERGED TO MAIN AND LIVE.** Installed the Impeccable design-critique skill (project-scoped, `.claude/skills/impeccable/`), wrote `PRODUCT.md` + `DESIGN.md` (North Star: "The Property Card System"), ran `/impeccable critique` three times (21 → 26 → 27/32, P0s 2 → 0). Framed explicitly by Christopher as a cleanup pass before the real redesign/polish work in his broader vision, not the redesign itself. `session/impeccable-experiment` fast-forward merged into `main` (`f251296`) and pushed; Cloudflare Pages auto-deployed; **live site verified serving the new content** (title, IMO copy, CTA classes, zero em dashes all spot-checked directly against `secureprospective.com`, not just a clean build).

Shipped and verified live:
- **Harden:** mobile nav rebuilt with a real `<button aria-expanded aria-controls>` (was an inert checkbox/label hack), Escape-to-close, focus return. A regression (Escape listener attached to a sibling element, never fired) was caught by real Playwright interaction testing and fixed before this pass closed, not just source-reviewed.
- **Clarify (CTA hierarchy):** the three homepage CTAs carry distinct visual weight, verified by screenshot, not just class name: only "Start with a conversation" (the real conversion goal) keeps the primary Ticker Yellow `.btn`; "See the method" uses `.btn--ink`; "Meet the operator" uses `.btn--outline` (needed because the dark `.operator-teaser` background would swallow an ink fill).
- **`.btn--outline` promoted from a page-scoped one-off to a real shared component** in `Layout.astro` alongside `.btn`/`.btn--ink`, documented in `DESIGN.md` (Buttons, Cards/Containers, Elevation & Depth, plus the component-token YAML) and `.impeccable/design.json` (new Outline Button entry).
- **Card-Lift shadow applied to the homepage proof-teaser cards** (`.teaser`), the system's first real content-section use of its own signature move, static with a slightly deeper hover state.
- **IMO case study reframed (honesty fix):** the ~$110M/six-year IMO track record predates AI-native entirely; copy across `index.astro`, `the-work.astro`, `the-operator.astro` says so explicitly instead of implying the method was already proven there before the consulting offer existed. "We ran an IMO" → "We operated inside an IMO" everywhere. Correction logged in `PRODUCT.md` under Evidence on Hand.
- **The Work hero rewritten** for the same honesty reason: "One internal, and it's happening right now. We do not sell a method we are not running ourselves, live."
- **New locked content rule: ZERO em dashes** in anything a visitor reads (site copy, page titles) and in the brand-voice sections of `CLAUDE.md`/`PRODUCT.md`/`DESIGN.md` (locked hero copy, brand spine, mood anchor, anti-list, component descriptions). Does not require scrubbing routine operational/infra prose elsewhere in these docs. All em dashes found across `src/pages/`, `src/components/`, `src/layouts/`, `src/styles/`, `DESIGN.md`, and `design.json` were rewritten (not mechanically swapped) and reverified at zero, including a second pass that caught em dashes I'd written into DESIGN.md/design.json before the rule existed.
- **ChatWidget renamed** "Ask about Christopher" → "Ask SecureProspective" per Christopher's direction that it become a general assistant over time. **Renamed only:** the backend (`functions/api/ask.ts`) is still grounded exclusively in the operator profile-cast corpus, not company-wide content. See the Chatbot section below.

Two P2s remain, explicitly deferred (not started, not urgent):
- No above-the-fold signal for the IMO-agent audience (PRODUCT.md names two co-equal users, hero only speaks to the consulting one).
- `.node-marker` (13px) / `.teaser-meta` (11px) sit below the documented type ramp, likely intentional, currently uncodified.

**Playwright MCP:** used successfully this session (local-scope `claude mcp add`, not a `.mcp.json` file, which turned out to be the reliable path after real friction, see the lesson below), then **removed after use** (`claude mcp remove playwright`) per Christopher's explicit preference: add it right before a critique that needs real browser evidence, remove it after, don't leave it connecting on every session start. Re-add with `claude mcp add --scope local playwright -- npx -y @playwright/mcp@latest --headless` when next needed (Chromium already installed at `/root/.cache/ms-playwright/`, no reinstall needed).

**MCP setup lesson (2026-08-05, worth reading before repeating this):** a project-scoped `.mcp.json` approval prompt turned out to be fragile in this environment (survived a full CT105 reboot showing "Pending approval" and never re-prompted; root cause never fully confirmed, `lastGracefulShutdown: false` on the killed session is the leading suspect). `claude mcp add --scope local <name> -- <command>` bypassed the whole approval-prompt dependency entirely and connected reliably. Prefer that path over a `.mcp.json` file for any future MCP server on this project. Also: MCP tools do not propagate to background sub-agents dispatched via the Agent tool, confirmed twice this session, so any critique/review step needing real browser evidence must run in the main context, not delegated.

**Background sub-agent Bash-result infra bug, also observed this session (2026-08-05):** dispatching Assessment A/B for critique as background sub-agents produced zero tool_results across 20+ Bash calls each (verified via raw transcript inspection), not a stall, a silent execution failure. The first two critiques this session ran single-context (⚠️ DEGRADED banner) as a result; the third ran in the main context deliberately once Playwright was working there. Not yet confirmed whether this was session-specific or a recurring CT105 issue.

**Design/polish session, 2026-08-05 evening: MERGED TO MAIN AND LIVE.** Impeccable live-mode wired and used directly this session (config at `.impeccable/live/config.json`; browser picker via `live.mjs`/`live-poll.mjs`; harness install steps documented in the Beelink lane below). Shipped and verified live against `secureprospective.com` (not just build output) after each push:
- **Homepage "Method" section replaced with a floating card widget** (`src/components/MethodWidget.astro`), triggered by the hero's existing "See the method" button instead of navigating away, mirroring `ChatWidget.astro`'s exact aesthetics (ink launcher removed in favor of the hero trigger; blue header, white panel, hard-edge card-lift shadow). "Continue to The Method →" inside the card is the only path that actually navigates to `/the-method`. Fixed a mobile-width collision this created between the two floating widgets (Method widget now stacks above Chat on the same corner below 768px).
- **"The Work" section moved from silver-base to blue-brand**, fixing a silver-on-silver run after the hero once the old full-bleed Method band was removed (ran a full Impeccable critique first: 20/24, 83%, Good, single-context degraded and disclosed as such — subagent dispatch skipped deliberately given this project's two known infra issues, MCP-tools-don't-propagate-to-subagents and the background-subagent Bash bug noted above). Teaser card shadow/hover switched from brand-blue (invisible against the new blue backdrop) to ink offset + Ticker Yellow hover border.
- **Hero "prefix." got a Ticker Yellow chip** (`.prefix-chip`), chosen via three live-mode variants and carbonized into `index.astro`'s hero styles.
- **Hero "See the method" button changed from `.btn--ink` to full `.btn` (Ticker Yellow primary)**, chosen via live-mode, confirmed explicitly by Christopher after a mid-session mess where three separate live-mode generate events queued up (poll loop had been stopped) and, once the picker's controlling script was removed, showed as a literally duplicated button in raw HTML. Cleaned up: single clean `<a id="see-method-btn" class="btn">`. **This now puts two Ticker Yellow primary CTAs on one homepage** (this button + "Start with a conversation" in the loop-closer), which directly contradicts the CTA-hierarchy rule documented above in the 2026-08-05 Impeccable cleanup-pass entry ("only 'Start with a conversation' keeps the primary `.btn`"). Christopher's call, confirmed directly, not an oversight — but `DESIGN.md`'s Buttons section still states the old one-primary-CTA-per-page rule and hasn't been reconciled to match. See Open Items.
- **"Human authorship, not AI-slop" brand thesis** (Christopher's stance: AI structures/accelerates, human judgment and authorship stay the centerpiece, explicit bluntness when a tool/automation runs counter to a client's actual need) — partially threaded in. A drafted extension to the Diagnose station on The Method page (pace-of-change honesty commitment + a car-mechanic "loose connection, not the whole unit" gold pull-quote, reusing the existing `.annotation` component) is **stashed on the project git repo, not committed** (`git stash list` → `stash@{0}`, message "pending: Diagnose station honesty copy, awaiting approval"). Christopher said "not yet" mid-session reviewing it in the live browser and it was never revisited before session close. Next session: surface it for an explicit decision before committing or discarding. The human-authorship half of the thesis needed no new copy — Station 03 (Shape) already says "Human-held, AI-assisted," which is the thesis in three words.
- **New Beelink routine-edit lane wired and proven live**, full detail in the Workflow section above: second clone at `~/opencode/secureprospective-site` on Beelink, Impeccable installed for both Claude Code and OpenCode harnesses, running mechanical/documentation-drift edits on `opencode/deepseek-v4-flash-free` (opencode.ai's native free tier) instead of spending Claude tokens on non-judgment work. First real output (folding three undocumented gray hex colors into `DESIGN.md`) committed on Beelink, fetched to CT105 the same way bird branches come home, reviewed, merged, pushed.

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

**Widget renamed 2026-08-05:** launcher/panel copy is now "Ask SecureProspective" (was
"Ask about Christopher"). Christopher wants this to become a general SecureProspective
assistant, not an operator-only bot. Renamed the widget only; the backend
(`functions/api/ask.ts`) is still grounded exclusively in the operator profile-cast corpus
(bio, career, licenses), not company-wide content (services, pricing, the method). A
visitor asking about services under the new name will still get a refusal. Expanding the
actual knowledge corpus (new R2 docs, AI Search reindex, refusal-prompt update) is a
separate, not-yet-scoped backend task — do not assume it's done because the label changed.

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
- [ ] **Diagnose-station honesty copy, stashed not committed** (`git stash list` → `stash@{0}` on the project repo). Christopher said "not yet" reviewing it live and the session closed before it was revisited. Surface it next session for an explicit accept/discard.
- [ ] **DESIGN.md Buttons section is now stale**: still documents "only one primary Ticker Yellow CTA per page," but the homepage now ships two (hero "See the method" + loop-closer "Start with a conversation"), confirmed directly by Christopher 2026-08-05. Reconcile the doc to match reality, or revisit the button if reconsidered.
- [ ] The bleeding-edge background-pattern / cursor-effect exploration Christopher originally opened this session with was never reached (got redirected into Impeccable live-mode work on concrete elements instead) — still open if he wants it.

---

## Next Branch

**2026-08-05 design/polish session is DONE and merged to `main` (`c74a120`, live, verified against `secureprospective.com` directly).** Impeccable live-mode is now a proven, working tool on this project (config committed, harness-install steps documented) — reach for it directly for future visual iteration instead of guessing at directions. The Beelink DeepSeek routine-edit lane is also proven live; route mechanical/documentation-drift work there before spending Claude tokens on it.

Immediate next-session priorities, in order:
1. Surface the stashed Diagnose-station honesty copy for an explicit decision (see Open Items).
2. Reconcile DESIGN.md's stale one-primary-CTA rule.
3. Resume the background-pattern/mouse-effect exploration if Christopher still wants it.

Remaining small items, low priority, pick up whenever:
- The two P2s from the 2026-08-05 cleanup-pass critique (no above-the-fold IMO-agent signal, undocumented micro-text sizes).
- The CCwork backend expansion (general-assistant knowledge corpus) flagged above, only if Christopher explicitly scopes it; it's a real Cloudflare-touching project (new R2 docs, AI Search reindex), not a copy tweak.
- `session/impeccable-experiment` and `session/method-honesty-copy` local branch cleanup once confirmed merged (`git branch -d <name>`).

AI-ecosystem scaffold merged to `main` (`4424f40`) and pushed 2026-07-24, see Open Items above; the real-Cloudflare-wiring phase for that scaffold is still parked behind the design work.

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
