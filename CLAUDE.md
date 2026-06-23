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
| `secureprospective.com` | CNAME | `webpage-c6h.pages.dev` | ✅ | Auto |
| `www.secureprospective.com` | CNAME | `secureprospective.com` | ✅ | Auto |
| `_domainconnect` | CNAME | `_domainconnect.gd.domaincontrol.com` | ✅ | Auto |
| `jellyfin` | CNAME | `773073cd-b07b-4acf-a066-3d1be4c198aa.cfargotunnel.com` | ✅ | Auto |
| `nextcloud` | CNAME | `773073cd-b07b-4acf-a066-3d1be4c198aa.cfargotunnel.com` | ✅ | Auto |
| `nexus` | CNAME | `37f773e3-fe01-42e0-a0c1-7d2169a987a3.cfargotunnel.com` | ✅ | Auto |
| `seerr` | CNAME | `773073cd-b07b-4acf-a066-3d1be4c198aa.cfargotunnel.com` | ✅ | Auto |
| `_dmarc` | TXT | `v=DMARC1; p=reject; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | ❌ | Auto |

### Hosting — Cloudflare Pages

- **Project name:** `webpage` (pages.dev: `webpage-c6h.pages.dev`)
- **Production branch:** `main`
- **Build command:** *(none — not yet connected to GitHub repo)*
- **Output directory:** *(none — not yet configured)*
- **Uses Functions:** No | **Compatibility date:** 2026-03-18

✅ **Pipeline connected 2026-06-23** via a NEW git-connected project `secureprospective-site` (main / `npm run build` / `dist` / NODE_VERSION=20), live at `secureprospective-site.pages.dev`. The old direct-upload `webpage` project still serves the domain until main has real content; then cut the custom domains over to `secureprospective-site` and delete `webpage`. (Note: the original `webpage` project below is the legacy placeholder, kept only until cutover.)

### Tunnels

| Name | Tunnel ID | Status | Hostnames → Origin |
|---|---|---|---|
| `Home` | `773073cd-...` | 🔴 DOWN (since 2026-03-22) | jellyfin → `192.168.40.79:8097`; nextcloud → `:7580`; seerr → `:5055` |
| `casaos-nexus` | `37f773e3-...` | 🟢 healthy | nexus → `localhost:8700` |

⚠️ **`Home` tunnel down** — jellyfin, nextcloud, seerr DNS records are stale/dangling. Traffic unreachable. Clean up when convenient.

### Other

- **Page Rules / Transform Rules / Cache Rules / Worker Routes / Firewall / Access:** None
- **SSL/TLS mode:** `Full` *(upgrade to Full Strict after connecting Pages — Pages issues a valid cert)*
- **Plan:** Free | **Zone:** Active
- **Nameservers:** `connie.ns.cloudflare.com`, `lamar.ns.cloudflare.com`

---

## Current Build State

- **Phase 0 COMPLETE** — scaffold committed to main (commit `2ea6ec5`), brand assets in `grafix/`.
- **Branch `session/secureprospective-draft-v1` IN PROGRESS (built solo on bird, 2026-06-22):**
  - Rough draft Home page: sticky nav, hero, blue method preview (transit-map connecting line + square node markers), ledger-framed proof teasers, dark footer
  - Design system: `src/styles/tokens.css` + `src/styles/fonts.css` (Primal @font-face) + `src/layouts/Layout.astro`
  - 3 design comparison views: `/` (bird draft), `/zai.html` (z.ai winner), `/gemini.html` (Gemini winner)
  - Project docs: `docs/DESIGN_SYSTEM.md` (locked spec), `docs/OPERATOR_DRAFT.md` (bio copy v1), `docs/PROMPT_TEMPLATES.md` (z.ai prompt templates)
  - Build clean on CT105. Branch on GitHub. NOT merged to main.
- Cloudflare: domain live (still on old `webpage` placeholder). **Git pipeline LIVE 2026-06-23** via new project `secureprospective-site` — auto-deploys `main` → `secureprospective-site.pages.dev` (verified by curl, HTTP 200, bare scaffold). Domain cutover deferred until main has real content.

---

## Open Items

- [x] Cloudflare dashboard inventory — complete (2026-06-22)
- [x] Connect Pages to GitHub — **DONE 2026-06-23.** NEW git-connected project `secureprospective-site` (main / `npm run build` / `dist` / NODE_VERSION=20), live + verified at `secureprospective-site.pages.dev`. The old `webpage` project was direct-upload and can't be converted, so a new project was made; `webpage` still serves the domain.
- [ ] **Domain cutover — DEFERRED until main has a real homepage.** main is currently the bare Astro scaffold. When ready: add `secureprospective.com` + `www` custom domains to `secureprospective-site`, then delete the old `webpage` project. Do NOT cut over to the bare scaffold.
- [ ] Upgrade SSL/TLS Full → Full (Strict) — after the domain cutover (Pages issues a valid cert)
- [x] Clean up stale `Home` tunnel DNS records (jellyfin, nextcloud, seerr) — **DONE 2026-06-23**, deleted + confirmed via dig. The dead `Home` tunnel object itself still exists; delete whenever.
- [ ] Christopher picks winning elements from 3 design views → integrate into Astro
- [ ] Calibrate silver hex against actual Silver Logo PNG (accept #E5E4E2 or refine)
- [ ] Self-host IBM Plex Sans (currently system fallback)
- [ ] Integrate real brand symbol SVG (currently text lockup in nav)
- [ ] Build remaining 5 pages: The Method, The Work, Services, The Operator, Contact
- [ ] Verify CTA scroll collision bug Gemini flagged (Playwright check on bird)
- [ ] Fix bird's `website.md` agent file: line 21 incorrectly says TFM uses Tailwind — correct to "Astro + React + CSS custom properties (tokens.css)"

---

## Next Branch

`session/secureprospective-design-review` — Christopher picks winning elements from 3-way comparison → bird integrates into Astro structure
