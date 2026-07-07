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

---

## Next Branch

Hardening complete — no branch was needed (all Cloudflare dashboard work, no code changes). Next: a design-polish pass on the live pages (`session/secureprospective-design-polish` when Christopher's ready), or fold in with CCwork lead-gen automation once target role/skill set is declared. (Cloudflare knowledge captured in vault `02_wiki/cloudflare.md`.)
