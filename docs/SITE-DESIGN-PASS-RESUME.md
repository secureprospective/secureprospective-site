# RESUME — secureprospective.com design pass (compact-safe, 2026-09-10 17:30)

## 1. WHAT WE ARE DOING

Cleaning up secureprospective.com to a shippable standard and repositioning the
homepage around a recruiting argument for new insurance agents. Two impeccable
design audits have been run and every finding from both has been fixed and
deployed to production.

Repo: `/home/chris/work/secureprospective-site` · branch `main` · clean · pushed.
Production: Cloudflare Pages, auto-deploys from `main`. Live at `55bdcd0`.
Preview locally with `cd dist && python3 -m http.server 4477 --bind 127.0.0.1`.

## 2. AGENTS + HARNESSES

None. All work done in this session directly. No subagents were dispatched and
none should be without Christopher asking.

## 3. GATES / STATUS

| Gate | Result |
|---|---|
| `pnpm build` | 14 pages, passes |
| `pnpm test` (vitest) | 16/16 pass, `tests/lead.test.ts` |
| `npx tsc --noEmit` | clean |
| Sweep: contrast / overflow / target size / labels / h1 / skip target | clean, 9 pages × 380, 790, 1440 |
| Width ladder 360→1920 for horizontal scroll | clean at every step |
| Filing gate `~/.reorg/tools/check-filing.sh` | PASS, exit 0, 23 entries |
| Production verify after deploy | 9 routes 200, 404 correct, www resolves, 6 members pages noindex, Turnstile key present, OG image 200 / 38,106 B |

## 4. ARTIFACTS THAT EXIST AND WORK

- `docs/IMPECCABLE-2026-09-10.md` — audit pass 1. Site 160/208 (77%), homepage
  14/24 (58%), plus a Resolution section recording every fix.
- `docs/IMPECCABLE-2026-09-10-pass2.md` — pass 2. Homepage re-scored 20/24 (83%),
  nav bar scored on its own 19/24 (79%).
- `docs/DRAFT-homepage-fold-copy.md` — the three fold options; Christopher chose B.
- `docs/SITE-CLEANUP-RESUME.md` — the previous session's resume, still valid for
  the contact form / R2 / Brevo lane.
- `public/assets/social/og-default.png` — 38,106 B, sha256 `ea89699fbc3f23d0…`.

## 5. THE CURRENT BUG

None open. One thing shipped but did not take effect:

**Edge caching of HTML is not actually working.** `public/_headers` sends
`Cache-Control: public, max-age=0, must-revalidate, s-maxage=60,
stale-while-revalidate=86400` and the header is present on production responses,
but `cf-cache-status` stays `DYNAMIC` on repeat requests to `/services/`.
Leading hypothesis: Cloudflare Pages does not honour `s-maxage` from `_headers`
for HTML and this needs a **Cache Rule in the dashboard** instead. **Caveat:** that
is inferred from the DYNAMIC status alone; it has not been tested by creating the
rule. The header itself is harmless where it is.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **`npx http-server` is NOT blocked in this environment.** The previous session
   recorded it as blocked (exit 7, empty log). It actually starts fine; the `-s`
   silent flag produces an empty log, which was misread as failure. An orphaned
   instance from 13:33 was found still serving on port 4399 and reaped at 17:29.
2. **Chrome cannot be resized below ~606px viewport width.** Test narrow layouts
   with a same-origin iframe against `127.0.0.1:4477`, not `resize_window`.
3. **The live site cannot be iframed** — `X-Frame-Options: DENY` makes
   `contentDocument` null. Serve `dist` locally and iframe that instead.
4. **`window.__fn` survives Astro view transitions** if you navigate by clicking a
   real nav link. It does NOT survive `location.assign`. This is how to run one
   injected audit function across many pages without re-pasting it.
5. **`getClientRects().length` over-counts heading lines** when the heading has
   inline children (`<br>`, per-letter stamp spans). Box height ÷ line-height
   over-counts when the element is grid-stretched. Neither is reliable alone;
   look at the rendered screenshot.
6. **Solid-colour full-viewport screenshots are a capture artifact**, not a
   defect. The DOM reported the correct background, opacity 1 and no overlay.
7. **`/` TTFB of ~5.2s from the Beelink is local DNS**, not the site.
   `dns 5.020s`, server ~135ms. Report, do not act (CT105 territory).
8. **The homepage counters are a count-up animation**; a mid-flight screenshot
   showing 7 / ~$16M / ~$99M is not wrong.
9. **`@astrojs/sitemap` 3.7.4 is incompatible with Astro 4.16** — it breaks the
   build. `src/pages/sitemap.xml.ts` is hand-written on purpose.
10. **Cloudflare's managed robots.txt does not override ours** — it prepends its
    AI-crawler block and our content follows.

## 7. DECISIONS (Christopher's, do not relitigate)

- **D1** Fold copy: **Option B**, the twenty-five-year / Tuesday-morning argument.
- **D2** Lead with **SP+** at the top of the homepage; the argument sits below it.
- **D3** The SP+ half of the old two-state section is **deleted** — it has its own page.
- **D4** The operating figures (8 / ~$18M / ~$110M) are **out** of the homepage
  truth card. They remain on `/services`, `/the-operator` and the register.
- **D5** The hero lockup keeps the **new** treatment (gold rule, OPERATOR TO
  OPERATOR kicker, smaller left-ranged wordmark), not the old centred wordmark.
- **D6** The argument is a **card** with hover depth, and the whole story must be
  visible on open without scrolling.
- **D7** Nav: **no wordmark text**, glyph only.
- **D8** Copy takes the **truth approach over sales or CTA**. Plain links, not buttons,
  where a reader has just been told the industry oversells them.
- **D9** Interior page titles (`The Operation:`, `The Method:`, `SP+:`) lead with
  internal codenames and are search-invisible. **Still Christopher's open call** —
  do not change them unilaterally.
- **Standing:** live deploys need per-deploy approval. He gave it for `55bdcd0`.

## 8. LEDGER STATE

Everything is committed and pushed. `main` = `origin/main` = `55bdcd0`.
Ten commits this session on top of `215ebec`:

```
55bdcd0 Say that SP+ ships, because it does
11d250b Second impeccable pass: the homepage re-scored, and the nav on its own
b9b3a68 Clean up the nav bar
5203ee5 Put the whole story on the opening screen, and deal it as a card
77f4184 Drop the figures from the truth band and set the claim beside its answer
fbacc47 Lead with SP+, and give the argument the section below it
48e9434 Say something on the homepage fold
2b43f6c Draft three options for the homepage fold
309a769 Fix what the design audit found, top to bottom
```

Nothing is written-but-uncommitted.

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher whether to set the Cloudflare Cache Rule** for HTML edge
   caching (see §5). He has authorised me to drive web consoles myself, so if he
   says yes, do it in the dashboard rather than handing it back.
2. **Ask permission to submit one real lead** through
   `https://secureprospective.com/contact/` end to end and verify it lands in the
   `secureprospective-leads` R2 bucket and in `info@`. A submission sends a Brevo
   notification email, which the no-email-without-permission rule forbids
   unilaterally. This has been pending across two sessions.
3. **Tell him the typo in the campaign creative**: board SP/002
   (`~/Pictures/assets/Ads/secureprospective-02-the-work-is-real.png`) reads
   "TUESDAY MORNINGS NEED **ANWSERS**". Already raised once; not yet actioned.
4. **Offer to update `CLAUDE.md`**, which still describes the chatbot as live and
   `/kit/setup` as shipped. Raised; he has not answered.
5. His decision on a **Cloudflare WAF rate-limit rule** on `/api/lead` (free tier
   includes one).
6. His decision on the **two R2 test objects** in `secureprospective-leads`.
7. His decision on **dead Cloudflare config**: binding `LEADS` → `ccwork-leads`
   and secret `CF_API_TOKEN` (retired chatbot); `KIT_TOKEN_KEY`, `KIT_DB`,
   `PUBLIC_BASE_URL` (retired InsuranceAgentKit). Secret values cannot be
   restored if a deletion is wrong.
8. **D9** — whether interior page titles change for search.

## 10. RELAY / ENVIRONMENT NOTES

- Scratchpad: `/tmp/claude-1000/-home-chris/02c4f8ab-1ef8-40f7-954c-d5bc3d884bde/scratchpad`
- CT105 (Claudebox, `192.168.1.105`) is the head-brain. Observe, do not correct.
- Chrome tab `1561241819` is parked on `https://secureprospective.com/`. It is a
  live tab Christopher can see; do not close it without asking.
- **Never** run `mv` on a git repo — use `~/.reorg/tools/reorg-move.sh`.

## 11. HONEST STATUS

The design work is finished, verified against the running production site, and
deployed. Both audit documents are committed alongside it.

Genuinely unproven:
- **No lead has ever been submitted through the production form end to end.** The
  Pages Function is unit-tested at 16/16 against a stubbed fetch, the Turnstile
  fallback was proven in all three states on a local build, and the Production
  bindings and secrets were confirmed present in the Cloudflare dashboard. None
  of that is the same as one real submission reaching R2 and `info@`.
- **Edge caching does not work** despite the header shipping (§5).
- Everything visual was verified at 380, 790 and 1440 in Chrome only. No other
  browser and no real phone has looked at any of it.
