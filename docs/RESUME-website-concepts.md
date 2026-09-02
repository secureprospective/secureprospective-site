# RESUME · secureprospective.com concept build

Written 2026-09-02 for a mid-session context compaction. **The session continues after this.**
Resume at NEXT ACTIONS item 1. Do not re-derive, do not re-litigate, do not re-test the refuted
hypotheses in section 6.

---

## 1. WHAT WE ARE DOING

Christopher asked for the secureprospective.com website to be brought "five years into the
future": captivating and immersive, with movement, depth and readability. Two directions were
required as separate Cloudflare dev pages, one preserving the existing theme, voice and
structure, one deliberately radical. Both were built, both are live, both have had the full
Impeccable pass. He is now judging them and will pick a winner to roll across the remaining
five pages.

- **Repo:** `/home/chris/work/secureprospective-site` on Beelink (`com`, 192.168.1.190).
- **Branch:** `chore/retire-opencode`, based on `main` at `271600e`. Not pushed.
- **Scope, agreed with him:** homepage only for each concept, public marketing only. No members
  area, no ChatWidget, no D1, no APIs.

## 2. AGENTS + HARNESSES

- All work this session was done by me directly in Claude Code on the Beelink. No subordinate
  agents were dispatched, and none are running.
- **ClaudeBox / CT105 owns SP+ and is mid-campaign.** Its 29 unpushed commits sit on branch
  `session/sp-plus-plan` in the `secureprospective-advisor-os` worktree, newest 2026-09-02 08:08.
  They touch `projects/` and `HANDOFF.md` only, never `src/`. **Do not push, rebase or merge that
  branch, and do not edit `HANDOFF.md` or `PRODUCT.md`.**
- **OpenCode and the DeepSeek routine-edit lane are retired** as of this session. Do not dispatch
  through `opencode run`; the CLAUDE.md sections describing that lane are marked RETIRED.

## 3. GATES / STATUS

| Gate | State | Evidence |
|---|---|---|
| Concept A builds | PASS | `pnpm build`, 2 pages |
| Concept B builds | PASS | `pnpm build`, 2 pages |
| Concept A deployed | PASS | https://sp-concept-immersive.pages.dev/ returns 200 |
| Concept B deployed | PASS | https://sp-concept-radical.pages.dev/ returns 200 |
| Impeccable detector, A, 1280x800 | PASS, 0 findings | exit 0, JSON length 0 |
| Impeccable detector, A, 390x844 | PASS, 0 findings | exit 0, JSON length 0 |
| Impeccable detector, B, 1280x800 | PASS, 0 findings | exit 0, JSON length 0 |
| Impeccable detector, B, 390x844 | PASS, 0 findings | exit 0, JSON length 0 |
| Detector able to fail (control) | PASS, exit 2 | `bad.html` control yields low-contrast + tiny-text |
| Wordmark fits, B, 6 viewports | PASS | `concepts/tools/fit.mjs`, word <= container at all six |
| Production site touched | NO | separate Pages projects, never `secureprospective-site` |

## 4. ARTIFACTS THAT EXIST AND WORK

- `concepts/a-immersive/` — Astro 4, forks the production design system verbatim
  (`site.css`, `tokens.css`, `transitions.css`, `fonts.css`, `Nav.astro`, `Footer.astro`) and
  layers `src/styles/immersive.css` (about 420 lines) plus `src/scripts/motion.js` (311 lines).
- `concepts/b-radical/` — Astro 4, own `tokens.css` + `radical.css` (about 640 lines),
  `src/scripts/motion.js` (301 lines) and `src/scripts/field.js` (220 lines, canvas lattice).
- `concepts/tools/` — `shot.mjs`, `locate.mjs`, `fit.mjs` plus a README. Puppeteer is resolved by
  absolute path from `.claude/skills/impeccable/node_modules`.
- `docs/RESOURCES-ui-libraries.md` — the verified component-library inventory, paid entries
  excluded.
- **Cloudflare Pages projects, both on account `002dd2f758b67ac08d05a3809d65a25a`:**
  `sp-concept-immersive` and `sp-concept-radical`, production branch `main` on each.
- **Review artifact for Christopher:**
  https://claude.ai/code/artifact/cfeb8008-a463-4da6-a326-dd88dc370704
- Screenshots in the session scratchpad (replayable, not precious): `a-full.jpg`, `b-full.jpg`,
  `a-mobile.jpg`, `b-mobile.jpg`, `a-desktop.jpg`, `b-desktop.jpg`.

## 5. THE CURRENT BUG

**None open.** Both concepts scan clean at both viewports and the wordmark fit is verified.

The last two defects fixed, recorded because they were subtle:

- Concept B's display wordmark was clipped. "PROSPECTIVE" measures **8.04em** in Primal, so at
  the original `clamp(3.4rem, 13vw, 11.5rem)` it overran its container at every width from 390 to
  1920 and the final E was cut. Now `clamp(2.5rem, 10.4vw, 10rem)`, measured to fit.
  **Caveat: 8.04em was measured on the deployed build at six specific widths. If the display face,
  the shell width or the letter-spacing changes, re-run `concepts/tools/fit.mjs` rather than
  assuming the ramp still holds.**
- Concept A's reported `body-text-viewport-edge` was **not** a padding bug. It was the deal-in
  transform being measured mid-animation. Fixed by dropping the horizontal component below 760px.

## 6. HYPOTHESES ALREADY REFUTED. DO NOT RETEST.

1. **"The repo holds 78 unpushed commits."** False. `.project.yaml` says so and is stale. A
   verified fetch showed `main` exactly level with `origin/main` at `271600e`, zero ahead, zero
   behind. Do not go looking for that backlog.
2. **"The stash holds the Diagnose-station honesty copy."** False. CLAUDE.md claims it; the stash
   actually contained zero tracked changes, only 152 untracked files of the OpenCode install plus
   four research documents. The research documents were preserved and the stash dropped. **That
   copy is not recoverable and would need rewriting.**
3. **"The Beelink has no Cloudflare access for this site."** Was true early, is now false. See
   section 10.
4. **"The Impeccable detector passing means the page is clean."** Not on its own. The detector
   exited 0 with no output on everything, including a deliberately awful control file, because
   removing `.opencode/` had taken its parser dependencies. **Always run the control file first.**
5. **"`.claude/skills/impeccable/scripts/detector/cli/main.mjs` is the detector entry point."**
   False. It only exports. The runner is `scripts/detect.mjs`.
6. **"A URL scan works out of the box."** False, it needs puppeteer, now installed.

## 7. DECISIONS (Christopher's rulings, do not relitigate)

- **D-1.** No paid services, ever. Only genuinely free, unmetered tools go in the inventory.
  A metered free tier counts as paid. 21st.dev was excluded on this basis.
- **D-2.** Nothing to do with `tginas@live.com` or ginasfinancial. That is a separate business on
  a separate Cloudflare account. Never mix them.
- **D-3.** OpenCode is retired altogether.
- **D-4.** Homepage only per concept; public marketing pages only.
- **D-5.** "Impeccable is usually right." Its findings win over my own objections, including the
  kicker ban, which was applied to the production copy in Concept A after I had argued to keep it.
- **D-6.** Deploying to a live site requires his explicit approval for that specific deploy.
  Previews and separate projects need none.
- **D-7.** "Middle of the road boring is banned." Go big.

## 8. LEDGER STATE

- **Committed on `chore/retire-opencode`:** `7a943c9`, the OpenCode retirement and the ssh URL
  repair, plus the concept build commit made alongside this document.
- **Not pushed.** `origin` has not been written to at all this session, deliberately.
- **Not committed anywhere:** the screenshots and the artifact HTML, which live in the session
  scratchpad and are regenerable from `concepts/tools/shot.mjs`.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for Christopher's verdict** on which direction wins. He has both URLs and the review
   artifact. Do not start rolling anything out before he picks.
2. **Roll the winner across the remaining five pages** once picked: `/services`, `/the-work`,
   `/the-method`, `/the-operator`, `/contact`. Reuse the winning concept's stylesheet and motion
   system rather than re-deriving them per page.
3. **Re-run the Impeccable detector on every new page** at 1280x800 and 390x844, running the
   control file first each time to prove the gate can still fail.
4. **Run `concepts/tools/fit.mjs`** against any page carrying the display wordmark.
5. **Ask before any deploy to `secureprospective-site`.** Per D-6, that is gated on his say-so
   every single time.

## 10. RELAY / ENVIRONMENT NOTES

- **Cloudflare credentials for this site:**
  `set -a; . ~/.secrets/cf-secureprospective-pages.env; set +a`
  Scope is Pages Edit plus D1 Edit, this account only, never expires.
  `CLOUDFLARE_ACCOUNT_ID` must stay pinned or wrangler picks the wrong account.
  The token's own identifier is deliberately not recorded here. Read it from the env file if it
  is ever needed. **Never print the token, never commit it, never put it in HANDOFF.md.**
- **Do not use** `~/.cloudflare_token` or anything named `sp-crm`; that project is being retired,
  and that token has no Pages scope anyway.
- The token **cannot** do Workers, Queues, Turnstile, or anything DNS or zone level. Attaching a
  new custom domain will fail with an authentication error. That is expected. Report and stop.
- **Deploy commands used:**
  `npx wrangler pages deploy concepts/<dir>/dist --project-name <sp-concept-*> --branch main
  --commit-dirty=true`. `--branch main` is safe here because these are the concepts' own
  projects. On `secureprospective-site` it would publish live.
- **Detector:** `node .claude/skills/impeccable/scripts/detect.mjs --viewport WxH <url>`.
  Exit 2 means findings, exit 0 means clean.

## 11. HONEST STATUS

Both concepts are built, deployed, verified serving, and pass every Impeccable rule at two
viewports. I have looked at both rendered pages myself rather than trusting the scans.

What is genuinely unproven:

- **Neither concept has been seen by Christopher yet** at the time of writing. Aesthetic
  acceptance is entirely open, and "passes the detector" is not the same as "he likes it."
- **Only two viewport widths were scanned**, 1280 and 390. Tablet widths and very wide displays
  are unscanned, though `fit.mjs` did check the wordmark at six widths.
- **Motion has not been tested on slow hardware.** Concept B runs a canvas lattice every frame;
  it is capped at 130 nodes with a spatial grid, but it has only ever run on the Beelink.
- **No cross-browser testing.** Everything was verified in headless Chromium. Firefox and Safari
  are unverified, and Concept B leans on `backdrop-filter` for its chrome and
  `-webkit-text-stroke` for the method numbers.
- **Reduced-motion paths are coded and gated but were never exercised** with the setting actually
  on.
