# SecureProspective — Claude Code Ground Truth
*Read this entire file before doing anything. If this file conflicts with anything said in the session, this file wins.*

---

## What This Project Is

Christopher Campbell's personal brand and professional website.

- **Domain:** secureprospective.com (Cloudflare Pages, auto-deploy from main)
- **Repo:** github.com/secureprospective/secureprospective-site
- **Local path (CT105):** /mnt/storage/claudebox/projects/secureprospective/
- **Bird clone path:** ~/qa/repos/secureprospective

---

## Stack

**Astro + Cloudflare Pages** (same pattern as TFM Website).

| Piece | Detail |
|---|---|
| Framework | Astro |
| Deploy | Cloudflare Pages — auto-deploy from main |
| Build command | `npm run build` |
| Dev server | `npm run dev` |

Stack status: Astro pending Christopher's confirmation — not yet scaffolded.

---

## Workflow — Bird Scratch-Pad → CT105 Deploy Gate

This project uses the bird/CT105 split workflow:

1. **Bird (off-LAN, solo mode):** Christopher rough-drafts and demos locally via `npm run dev`. GLM assists with code changes. Bird **never** deploys to Cloudflare.
2. **Return home:** CT105 pulls the work (bird pushes branch to GitHub → CT105 pulls, or direct rsync via offload).
3. **CT105 (Claude):** Reviews the diff, runs `npm run build` to verify, merges to main after Christopher's visual gate passes. Cloudflare Pages auto-deploys from main.

Bird never runs `wrangler deploy` or `wrangler pages deploy`. CT105 owns the merge and the Cloudflare push.

---

## Pillars

Business, Creative

---

## Cloudflare Configuration

*(Inventory pending — Cloudflare AI output to be pasted here once Christopher brings it back.)*

---

## Current Build State

- Phase 0 — project created. Repo exists (empty). No scaffold yet.
- Stack: not yet scaffolded (Astro recommended, pending Christopher's confirmation).
- Cloudflare: domain live, tunnel/DNS config TBD (pending inventory).

---

## Open Items

- [ ] Christopher confirms Astro as the stack
- [ ] Scaffold Astro project, commit to main, push to GitHub
- [ ] Connect Cloudflare Pages to the GitHub repo
- [ ] Paste Cloudflare AI config inventory into this file
- [ ] Bird clones the repo at ~/qa/repos/secureprospective
- [ ] Design / content direction for Phase 1

---

## Next Branch

`session/secureprospective-scaffold` — Astro scaffold + Cloudflare Pages connection
