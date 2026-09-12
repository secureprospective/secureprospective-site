# RESUME — secureprospective.com fit-and-consistency pass

Written 2026-09-12 before a context compaction. **The session continues.** Resume at
NEXT ACTIONS item 1; do not re-derive what is below.

## 1. What we are doing

Christopher supplied ten annotated screenshots (four mobile, six desktop) of
secureprospective.com and asked for fit issues and corrections, to his standard of
"consistency, clarity, and excellence is the standard, not the goal." That first phase is
**done, pushed and live**. He framed it as two phases: fixes first, then improvements once
the fixes are in. Phase two has not started.

- Repo: `/home/chris/work/secureprospective-site` (Beelink clone)
- Branch: `main`, at `557a8d6`, pushed to `origin/main`
- Live: https://secureprospective.com (Cloudflare Pages auto-deploy from `main`)

## 2. Agents and harnesses

None used. This was done directly in the main session: edits by hand, verification in
Christopher's Chrome via the claude-in-chrome extension. No subordinate agents were
dispatched, so there is no brief, no run directory and no transcript to recover.

## 3. Gates / status

| Gate | State |
|---|---|
| `pnpm build` on `main` | PASS, 14 pages |
| `pnpm test` | PASS, 16/16 |
| Viewport-overflow sweep, 7 pages x 9 widths (360-1717px) | PASS, 63/63, nothing escaping, no horizontal scroll |
| Live deploy | PASS, live 30s after push |
| Live CSS matches local build | PASS, hash `the-method.k5SP9RuR.css` identical |
| Filing gate (`~/.reorg/tools/check-filing.sh`) | PASS |

## 4. Artifacts that exist and work

- Commit `557a8d6` "Fix the fit defects across the six public pages", 8 files, +187/-80.
- Branch `session/fit-corrections` still exists locally at the same SHA as `main`. It is
  merged; deleting it is safe but not required.
- Live stylesheets carrying the fixes: `_astro/index.BK7GYF4h.css` (home),
  `_astro/the-method.k5SP9RuR.css` (method).

## 5. The ten defects, all fixed and verified live

| # | Page / width | Defect | Cause |
|---|---|---|---|
| 1 | Home, mobile | Pronunciation and REVENUE ACTIVE off the right edge | `.pronunciation` hard-placed at `grid-column: 2`; the mobile breakpoint collapses the lockup to one column, so the placement opened an implicit second column |
| 2 | SP+, mobile | Foundation tabs spilling through their own borders | Equal-thirds grid sized buttons without reference to their labels; each word was ~5px wider than its third |
| 3 | SP+, mobile | Starting-point connector struck through the copy | A full-width rule rotated 90deg, so its length became the column width |
| 4 | SP+, desktop | Arrow floating between label and value | Centred against the whole field rather than the value row |
| 5 | The Method | Loop spine missed every number, both breakpoints | Spine at `left: 40px`, number centres at 38px; two breakpoints restated the position independently |
| 6 | The Operator | CONTRIBUTES. across the paragraph; TRANSFORM out of its card | Both sized in `vw` while sitting in columns of unrelated width (547px of text in a 435px box; 273px in a 234px card) |
| 7 | Contact | ROUTE label off its line, marker sitting on top of it | Two translates either side of the rotation, the second applied in the rotated frame; marker floored at 30px, inside the label's zone |
| 8 | SP+ access terms | First column's bullets flush to its border | `site.css` and `the-work.css` both styled the block; each won different properties |
| 9 | Home register | ALPHA and AVAILABLE in two yellows a shade apart | `--yellow-accent` vs `--gold-identity` |
| 10 | Contact | Uncaptioned rail square | Ornament with no caption, unlike the same device on The Method |

Two were structural rather than patches: `--loop-spine` is now one custom property that both
the spine and the return arrow hang off, and `.access-terms` has a single owner after the
duplicate block was deleted from `site.css`.

## 6. Decisions Christopher made this session

- **D-1.** Contact's rail mark: **caption every rail mark.** Keep the square, fill it yellow,
  caption it in The Method's pattern. Shipped as "ONE LINE AT A TIME". Do not revisit.
- **D-2.** Status badges: **one fill, weight by border.** PROVEN blue-filled, ALPHA and
  AVAILABLE both `--yellow-accent`, PROSPECTIVE outline only. The gold `--gold-identity`
  badge is gone. Do not reintroduce a second yellow.
- **D-3.** He authorised this specific push to `main` and the live deploy, overriding the
  repo's usual "CT105 owns the merge" workflow. **That authorisation was for that push only.**
  The next push needs asking again.

## 7. Method notes that cost time to work out — reuse these

- **Verification rig:** run `pnpm dev --port 4399`, then in Chrome replace the page with an
  iframe harness and point it at `http://localhost:4399<path>`. Media queries respond to the
  iframe's width, so this gives real breakpoint testing at any width.
  `resize_window` did **not** change the viewport (stayed 1260px) and is not a usable path.
- **Production cannot be framed.** secureprospective.com sets frame-ancestors, so the iframe
  harness returns `contentDocument === null` against the live site. Verify production by
  navigating the tab directly and running measurements in the page.
- **Measure, do not eyeball.** The overflow sweep compares each element's `getBoundingClientRect().right`
  against `documentElement.clientWidth`. A `scrollWidth > clientWidth` check is noisy on this
  codebase and produces false positives on 1px decorative spans and on elements with
  negative-margin children (e.g. `.method-loop-link`); it is not a usable gate here.
- Zoomed screenshots of very small rotated text are unreliable through JPEG compression.
  Confirm such elements with `offsetWidth`/`offsetHeight` and computed style instead.

## 8. Ledger state

Everything is committed and pushed. Nothing is written-but-uncommitted except this document,
which is being committed as part of this step.

## 9. NEXT ACTIONS, in order

1. **Fix the Contact email wrap.** On the live Contact hero at roughly 1000px wide, the
   direct-channel card breaks the address mid-word: `info@secureprospective.co` / `m`.
   Pre-existing, not introduced by `557a8d6`, and it only shows in that narrow-desktop band.
   The element is the `<a href="mailto:...">` inside `.contact-channel-card`, styled in
   `src/styles/pages/contact.css`. Christopher has asked for it to go in the next push.
   Reproduce it first at 1008px in the iframe rig, then fix, then re-verify at 1008px.
2. **Ask before pushing.** D-3 does not carry forward. Land the fix on a branch, verify, and
   ask Christopher for the deploy.
3. **Then phase two: improvements.** He said the fixes come first and improvements follow.
   Wait for him to open that rather than starting it.

## 10. Environment notes

- This is Beelink (`com`, 192.168.1.190). CT105 (192.168.1.105) is the head-brain; `ssh
  root@192.168.1.105` works from here with BatchMode.
- Dev server was on port 4399 and has been stopped. Nothing is running.
- The Chrome tabs opened for verification were closed.

## 11. Honest status

Phase one is genuinely finished and observed working on production, not merely built: the
badge fills, the loop spine geometry and the contact rail were each read back off
secureprospective.com after the deploy. The remaining known defect is the Contact email
wrap in item 1, which has been reproduced by eye on the live site but **not yet measured or
fixed**. No estimate is offered for phase two because its scope has not been discussed.
