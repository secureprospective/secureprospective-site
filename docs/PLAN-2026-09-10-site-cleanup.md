# Site cleanup plan — secureprospective.com
**Date:** 2026-09-10 · **Repo:** `/home/chris/work/secureprospective-site` · **Branch now:** `session/contact-forms` (unmerged)

## How this was established

- `pnpm build` — **green**, 14 pages, 1.07s.
- `pnpm test` — **red**, 4 test files failing.
- Full static sweep of `src/`, `functions/`, `public/`, `dist/`.
- Browser pass over every public page plus `/members`, desktop 1204px and an injected 390px mobile viewport.

Nothing below is speculative. Each item was observed.

---

## FINDINGS

### A. Production is behind the work already done

| # | Finding |
|---|---------|
| A1 | The chatbot removal is **on the branch, not in production**. `origin/main` still ships `src/components/ChatWidget.astro` (300 lines) and `functions/api/ask.ts`. The live chat widget is calling an endpoint that returns a bare 502. |
| A2 | The proven contact form (R2 + Brevo, verified desktop and mobile) is also stuck on the branch. |

**Consequence:** every day this sits unmerged, campaign traffic hits a broken chatbot and a `mailto:`-only contact page.

### B. Junk exposed to the public

| # | Finding |
|---|---------|
| B1 | `public/zai.html` and `public/gemini.html` are **served in production** at `/zai.html` and `/gemini.html` — two abandoned AI-generated design mockups, 18KB and 20KB. They load fonts from the Google CDN (the site otherwise self-hosts), use an off-brand gold `#D4AF37`, carry em dashes in their `<title>`, and have no nav. Indexable and linkable. |

### C. Visitor-facing defects

| # | Finding |
|---|---------|
| C1 | **The 404 page says "CONCEPT PREVIEW" and "This page isn't built yet."** Its meta description reads "This preview builds the homepage only." That is what a campaign visitor with a mistyped URL sees. Stale from the pre-launch concept era. |
| C2 | The 404 page is the **only page on the site with no `<h1>`**. |
| C3 | **Dead anchor: `/the-work#sp-plus`.** No `id="sp-plus"` exists on that page. Linked from three places, including the homepage proof register line "SP+ first deliverable" — line 02 of the primary conversion path — plus `/services` and `/the-method`. All three silently land at the top of the page. |
| C4 | The contact hero **"DIRECT CHANNEL" card has a large empty gap** between its rule and the email address. Present on desktop and mobile. Reads as broken. |
| C5 | **The contact form dead-ends when Turnstile does not render.** If the widget fails for any reason (blocked script, privacy extension, missing key), the visitor gets "The verification check has not finished yet. Give it a moment and try again" forever, with no fallback and no visible escape route. On a live campaign with mobile traffic this loses leads silently and invisibly. |
| C6 | The contact form collects name, email and message into R2 and Brevo with **no privacy-policy link at the point of collection**. |
| C7 | Required fields on the contact form are **not marked** as required. |
| C8 | Large empty bands on `/contact`: roughly 250px between the route cards and the form, and a tall empty column under the form intro copy. |

### D. Campaign plumbing that is simply absent

| # | Finding |
|---|---------|
| D1 | **No Open Graph or Twitter Card tags anywhere on the site.** Every link shared to LinkedIn or Facebook renders as bare text with no preview image. The LinkedIn banner and Facebook cover assets exist in `grafix/` and are committed, but the site does not reference them. This is the highest-leverage single fix for a launched campaign. |
| D2 | No canonical URLs. |
| D3 | No `robots.txt`. No `sitemap.xml`. |
| D4 | No JSON-LD `Organization` structured data. |
| D5 | **Back-office pages carry no `noindex`** — `/members`, `/members/login`, `/members/admin`, `/members/download`, `/members/accept-invite`, `/members/change-password` are all indexable. |
| D6 | Members pages pass no meta description. |

### E. Consistency

| # | Finding |
|---|---------|
| E1 | **The members area is a visually separate site.** No nav, no footer, no brand chrome, default browser button styling on "Sign in." Crossing from the marketing site to `/members` feels like leaving the company. |
| E2 | `/members/` and `/members/login` are two separate pages both presenting a sign-in gate. |
| E3 | The footer carries no contact address and no social links, despite live LinkedIn and Facebook pages. |
| E4 | The privacy policy does not disclose the new lead pipeline's processors: Cloudflare Turnstile, R2 storage, Brevo. |

### F. Repo bulk and red tests

| # | Finding |
|---|---------|
| F1 | `src/lib/ecosystem/` — 51 files, 436KB, the AI-ecosystem/chatbot lane. **Zero imports from any shipped page, component, layout, script or function.** It is the sole source of all four test-file failures: three die on an unbuilt `better-sqlite3` native binary, one asserts `contact.email === "info@secureprospective.com"` while the config still says `secureprospective@gmail.com`. |
| F2 | `concepts/` — **180MB on disk**, 85 files tracked in git: two entire abandoned site variants (`a-immersive`, `b-radical`) still carrying the old gmail address and superseded copy. |
| F3 | `.impeccable/` critique artifacts are tracked in the repo. |

### G. Hardening

| # | Finding |
|---|---------|
| G1 | **No rate limiting on `/api/lead`** beyond Turnstile. Carried over from the last session, still undecided. |
| G2 | No `_headers` file: no CSP, no HSTS, no `X-Content-Type-Options`, no asset cache-control. |

---

## PLAN

### Phase 0 — Land what is already proven *(needs your word; production deploy)*
1. Merge `session/contact-forms` → `main`. This removes the chatbot and `/api/ask` from production and turns the contact form on.
2. Verify production at `https://secureprospective.com/contact/`.
3. Verify `https://www.secureprospective.com/contact/` — that hostname was a late Turnstile addition and has never been exercised.
4. Delete the unused `SP Contact Form` Turnstile widget.
5. Decide: the WAF rate-limiting rule on `/api/lead` (G1), and whether to delete the two R2 test objects.

### Phase 1 — Visitor-facing defects
6. Rewrite the 404 page as a real page: proper `<h1>`, honest copy, useful routes out. (C1, C2)
7. Add `id="sp-plus"` to the correct section of `/the-work`, or repoint all three links. Verify every in-page anchor across the site. (C3)
8. Fix the "DIRECT CHANNEL" card gap. (C4)
9. Harden the contact form's Turnstile failure path: detect that the widget never rendered, say so plainly, and surface the `mailto:` escape at the button. (C5)
10. Add a privacy-policy link and required-field marks to the form; close the empty bands. (C6, C7, C8)
11. Delete `public/zai.html` and `public/gemini.html`. (B1)

### Phase 2 — Campaign plumbing
12. Add Open Graph + Twitter Card tags to `Layout.astro`, with a per-page image, wired to the existing `grafix/` social assets. Verify the render in a real link-preview debugger. (D1)
13. Add canonical URLs. (D2)
14. Add `robots.txt` and a generated `sitemap.xml`. (D3)
15. Add JSON-LD `Organization`. (D4)
16. Add `noindex` and descriptions to every `/members/*` page. (D5, D6)

### Phase 3 — Repo cleanup, tests green
17. Move `src/lib/ecosystem/` out of the site repo to a parked location, logged through `~/.reorg/tools/reorg-move.sh` with its `MOVED.md` row, so the chatbot build is recoverable when you return to it. `pnpm test` goes green. (F1)
18. Same treatment for `concepts/` (180MB) and `.impeccable/`. (F2, F3)

### Phase 4 — Consistency and hardening
19. Bring the members area onto the site's visual system: nav, footer, brand chrome, real button styling. (E1)
20. Resolve the `/members` vs `/members/login` duplication. (E2)
21. Add contact and social links to the footer. (E3)
22. Update the privacy policy for Turnstile, R2 and Brevo. (E4)
23. Add a `_headers` file: CSP, HSTS, `X-Content-Type-Options`, asset cache-control. (G2)

---

## NOTES

- Every phase is verified in the browser before it is called done, not by reading the diff.
- Nothing deploys to production without your approval for that specific deploy.
- Phase 0 is the only phase that touches production. Phases 1 to 4 land on a branch and get proven on a preview deployment first.
