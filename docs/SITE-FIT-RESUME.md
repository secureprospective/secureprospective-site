# SecureProspective front-page pass — RESUME

Written 2026-09-12. Supersedes the earlier `docs/SITE-FIT-RESUME.md` from the
screenshot-defect pass; that document's history is still accurate, this one
carries the current state.

## 1. WHAT WE ARE DOING

Christopher is walking the live site and handing over annotated screenshots of
things he wants changed. I reproduce each at the width that shows it, fix it,
verify it rendered, and push when he says to. Phase one (his ten original fit
defects) is finished and live. This session was a second round: hero motion,
the homepage truth card, and a batch of copy edits.

- Repo: `/home/chris/work/secureprospective-site` on Beelink, branch `main`.
- Deploy: push to `main`, Cloudflare Pages rebuilds `secureprospective.com`.
- Dev server: `pnpm dev --port 4331`. Currently STOPPED.

## 2. AGENTS + HARNESSES

None. Everything this session was done in the main context. No briefs written,
no subordinate agents dispatched, nothing to recover.

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `pnpm build` | PASS, 14 pages |
| `pnpm test` | PASS, 16/16 |
| Filing gate (`~/.reorg/tools/check-filing.sh`) | PASS, exit 0, 23 entries |
| Live verification of this push | PASS, see section 4 |
| Em dash scan on edited pages | PASS, zero |
| Working tree | clean, nothing unpushed |

## 4. WHAT IS LIVE AND PROVEN

Commit `5a20523` "Tighten the hero field and rework the homepage truth card",
pushed to `origin/main`, deployed, and verified against the production site
rather than the build output:

| Change | Live evidence |
|---|---|
| Hero thread pitch 32px to 11px | `_astro/HeroTicker.astro_astro_type_script_index_0_lang.BkRoldSk.js` carries `=11,`; the hash matches the local `dist/` file |
| Operating-state badge to ink | live CSS `home-operating-state strong{...background:var(--ink);color:var(--white)...}` |
| Truth card three-column rework | live CSS `truth-columns{display:contents}` |
| Truth card hover flashes ink | live CSS `.truth-card:hover,.home-page .truth-card:focus-within{background:var(--ink)}` |
| "nobody to trust" | present on the homepage |
| Suitability row deleted, register renumbered | 0 occurrences of "Suitability and best interest"; labels read `01 02 03 04 05` |
| "6 years in annuities and income planning" | present on The Work |
| "$110M+ assisted annuity production" | present on The Work |
| Method spine line removed | `method-loop::before` 0 occurrences in `_astro/the-method.Dh97xIdj.css`; hash matches local build |
| Contact copy stops at "himself." | present on Contact |

`20fa2c6` (the previous resume document) rode along in the same push. Docs only.

## 5. THE CURRENT BUG

**Contact hero email wraps mid-word at roughly 1000px.** The direct-channel card
breaks the address as `info@secureprospective.co` / `m`. Pre-existing, not
introduced by any commit this session, and it only appears in that narrow-desktop
band. The element is the `<a href="mailto:...">` inside `.contact-channel-card`,
styled in `src/styles/pages/contact.css`.

Leading hypothesis: the anchor inherits a word-breaking rule (`overflow-wrap` or
`word-break`) that is meant for long prose and is breaking the address instead of
keeping it atomic. **Caveat: this has not been confirmed by inspecting the
computed style at that width.** Do not record it as the cause until it has been
measured at 1008px.

Christopher has asked for this fix twice now. It is the first thing to do.

## 6. HYPOTHESES AND METHODS ALREADY REFUTED — DO NOT RETEST

- **`resize_window` does not change the viewport.** It reports success and the
  viewport stays where it was, so breakpoint testing silently tests the wrong
  width. Use the iframe rig instead (below).
- **Production cannot be iframed.** `contentDocument` comes back `null` because
  the site sets frame-ancestors. Verify production by navigating the tab directly
  or with `curl`.
- **`scrollWidth > clientWidth` is not a usable overflow gate.** It false-positives
  on 1px decorative spans and on elements with negative-margin children. Compare
  `getBoundingClientRect().right` against `documentElement.clientWidth` instead.
- **`curl` without `-L` reads like a failed deploy.** The site 308-redirects
  `/services` to `/services/`, so an unredirected fetch returns nothing and looks
  exactly like the change never shipped. Always `curl -L`.
- **Full-width footer CTA on the truth card: tried and rejected.** Putting the
  action across both columns made the headline column run short and simply moved
  the empty band under the headline. The working answer was to span the ANSWER
  column across both rows, which sizes row one by the lede alone.
- **Centring the paragraph block was a patch, not a fix.** Christopher called it
  out. The structural fix was flattening the `.truth-columns` wrapper with
  `display: contents` so the card is one real three-column grid.

## 7. DECISIONS

- **D-1.** Caption every rail mark on Contact. Applied in the earlier pass.
- **D-2.** Status badges: one fill, weight by border. Applied in the earlier pass.
- **D-3 (superseded by D-5).** Deploy authorisation is per push.
- **D-4.** The grey second offset on the truth card is out. He asked for extra
  depth, saw it, and reversed himself: "I know I asked for it, but it's not good."
  One hard ink offset only. Do not reintroduce a softer or layered shadow.
- **D-5.** He authorised this session's push explicitly ("push all to main live
  site"). That authorisation covered that push and does not carry forward. Ask
  again before the next one.
- **D-6.** Hover on the homepage blue card flashes to theme ink, deliberately
  plain, matching the white-to-yellow flash on the SP+ card above it. "Nothing
  special."

## 8. LEDGER STATE

Working tree clean. `origin/main` is at `5a20523`. Nothing uncommitted, nothing
unpushed, no stashes created this session.

## 9. NEXT ACTIONS, IN ORDER

1. **Fix the Contact email wrap.** Reproduce at 1008px in the iframe rig first,
   inspect the computed style on the anchor before assuming the cause, fix, then
   re-verify at 1008px and at 1440px.
2. **Decide the two remaining $110M phrasings.** `the-operator.astro:154`
   ("Approximately $110M in annuity production assisted over six years") and its
   stat caption at line 169 ("Total annuity production assisted over six years")
   still use the old wording that The Work has moved away from. Flagged to
   Christopher, no instruction given. Ask before changing.
3. **Ask before pushing.** D-5 does not carry forward.
4. **Keep taking screenshots.** He is still walking the site. Expect more.

## 10. ENVIRONMENT NOTES

- **The iframe rig** is how breakpoints get tested, since `resize_window` does
  not work. Navigate the tab to `http://localhost:4331/`, then replace the
  document with an iframe of the target width, scaled to fit:
  `document.documentElement.innerHTML='<body style="margin:0"><iframe id="rig" src="/?x='+Date.now()+'" style="width:1400px;height:1400px;border:0;transform:scale(0.585);transform-origin:0 0"></iframe></body>'`
  Then read geometry out of `document.getElementById('rig').contentDocument`.
  The cache-busting query parameter matters; without it the iframe serves stale CSS.
- **Real hover cannot be verified across separate tool calls.** The pointer state
  does not survive between them. Use `browser_batch` with navigate, hover and
  screenshot in one call.
- **Chrome viewport here is about 825px**, which is the tablet layout. Anything
  desktop must be checked through the rig.

## 11. HONEST STATUS

Everything Christopher has asked for so far is live and was checked on the
production site, not merely built. The one known open defect is the Contact email
wrap, which is unfixed and whose cause is still unconfirmed. The two Operator
phrasings are a judgement call waiting on him, not a defect. Nothing is running
and nothing is half-applied.
