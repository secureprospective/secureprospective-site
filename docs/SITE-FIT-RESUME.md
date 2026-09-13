# SITE FIT RESUME: secureprospective.com

Written 2026-09-12 for a mid-session compaction. The session CONTINUES after this.
Supersedes the 2026-09-12 12:53 edition, which covered the homepage pass.

---

## 1. WHAT WE ARE DOING

Christopher walks the live site and hands over work one ask at a time. I build it,
verify it rendered, and deploy when he authorises that specific deploy. The current
stretch is the member back office: two long documents about SP+ brought into the site
as real pages.

- **Repo:** `/home/chris/work/secureprospective-site` (Beelink clone)
- **Branch:** `main`, clean, `origin/main` == local HEAD == `2411867`
- **Deploy:** Cloudflare Pages auto-deploys from `main`. Typical rebuild ~45 seconds.
- **Live:** https://secureprospective.com

---

## 2. AGENTS AND HARNESSES

**None.** No subordinate agents were dispatched this session. Nothing to orphan and
no transcripts to recover. All work was done in the main context.

---

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `npm run build` | PASS, 16 pages |
| Filing gate `~/.reorg/tools/check-filing.sh` | PASS, exit 0, 23 visible entries |
| Zero em dashes in visitor copy | PASS in prose; 2 remain inside fenced blocks, deliberately, see §7 D-9 |
| No font CDNs | PASS, 0 `fonts.googleapis` references on both new pages |
| Rendered verification | PASS at 390px, 847px and 1440px on both pages |
| Live verification against production | PASS, see §4 |
| Dev / preview servers | None running |

---

## 4. ARTIFACTS THAT EXIST AND WORK

Two new pages, both live and verified **against production**, not against `dist/`.

### `/members/inside-sp-plus`, commit `d5cbea6`

The advisor-facing reference document. Source was `~/Downloads/INSIDE-SP-PLUS.html`
(62,733 bytes), which carried its own palette and two Google font links. Both removed.

| File | Bytes |
|---|---|
| `src/pages/members/inside-sp-plus.astro` | 70,902 |
| `src/styles/pages/inside-sp-plus.css` | 14,452 |

Live asset hash: `_astro/inside-sp-plus.3VlSqibq.css`, matches local `dist/` exactly.

### `/members/sp-plus-security-architecture`, commit `2411867`

The technical counterpart, for a security reviewer. Source was
`~/Downloads/SP-PLUS-SECURITY-ARCHITECTURE-2026-09-11.md` (85,590 bytes, 1,705 lines).

| File | Bytes |
|---|---|
| `src/pages/members/sp-plus-security-architecture.md` | 85,090 |
| `src/layouts/ArchitectureDoc.astro` | 7,577 |
| `src/styles/pages/architecture.css` | 14,447 |
| `astro.config.mjs` | +14 lines, Shiki `css-variables` theme |

Live asset hashes: `_astro/sp-plus-security-architecture.D6X52_YQ.css` and
`_astro/sp-plus-security-architecture.mW_Jeoa3.css`, both matching local `dist/`.

**Live read-back, 2026-09-12 after the push:**

| Check | Observed |
|---|---|
| Architecture page | 200, 151,607 bytes |
| Section rail | 20 `data-rail-link` entries |
| Tables rendered | 15 |
| Shiki theme in output | `astro-code css-variables` |
| Em dashes in page | 2, both in fenced blocks |
| `fonts.googleapis` references | 0 |
| sha256 in artifact ledger | `038795fe96b734015d941967eca9b63a96318ab90ee5d9ece0b843be68016c94` |
| Back office buttons | Download SP+ / Read Inside SP+ / Read the security architecture, all present |
| Inside SP+ page | 200 |

### The transform script

`/tmp/claude-1000/-home-chris/bb43a672-693a-40e4-b860-f122f05da111/scratchpad/xform.py`
(12,556 bytes) holds the 64 explicit em-dash rewrites applied to the architecture
markdown. It asserts every source string is found and re-scans for strays, so it is
the thing to re-run if the upstream `.md` is regenerated. **Scratchpad only, not
committed, and it will not survive the session.** If the report gets regenerated
later, copy it into the repo first.

---

## 5. THE CURRENT BUG

**The Contact hero email wrap.** Carried over from the previous resume document and
still open. At roughly 1000px the direct-channel card breaks
`info@secureprospective.co` / `m`.

- **Element:** the `<a href="mailto:...">` inside `.contact-channel-card`
- **Styled in:** `src/styles/pages/contact.css`
- **Leading hypothesis:** a width or `overflow-wrap` interaction on the anchor.
- **Caveat on that hypothesis: it is unconfirmed.** Nobody has inspected the computed
  style on that anchor at that width. Do not write a fix against this guess. Reproduce
  at 1008px in the iframe rig and read the computed style first.

Christopher has now raised this twice and it has been deferred twice.

---

## 6. HYPOTHESES AND METHODS ALREADY REFUTED: DO NOT RETEST

1. **`resize_window` does not change the viewport.** Confirmed across two sessions.
   Use an iframe rig instead: create an iframe at the target width, read
   `contentWindow`/`contentDocument`. Add a cache-busting `?v=Date.now()` or it serves
   stale CSS.
2. **`scrollIntoView` and `window.scrollTo` inside a transformed iframe do nothing.**
   Observed this session: both returned `scrollY: 0`. `contentDocument.documentElement.scrollTop = N`
   works. Use that.
3. **`offsetTop` inside `.arch-doc` is not the document offset.** Its offsetParent is the
   card, so scrolling to `el.offsetTop` lands in the wrong section. Use
   `getBoundingClientRect().top + scrollY`.
4. **Synthetic `hover` does not register as `:hover`** across separate tool calls. Use
   `browser_batch` so pointer state survives.
5. **`curl` without `-L` makes a successful deploy look like a failure.** The site
   308-redirects `/path` to `/path/`. Always `curl -L`.
6. **A chained `sleep 45` is blocked by the harness.** Use a poll loop.
7. **`pkill -f` returns exit 144 and looks like a failure.** It is not. Confirm with a
   follow-up `pgrep`. Note that `pgrep -af <pattern>` matches its own wrapper shell, so
   a bare match is not proof something is still running. Check the port instead.
8. **`.btn--outline` does not exist in this codebase.** `CLAUDE.md` says it was promoted
   to a shared component in `Layout.astro`. It was not, or it was later removed. Using
   the class alone renders a default yellow `.btn`. It is now defined scoped inside
   `src/pages/members/index.astro` only.
9. **Astro's default Shiki theme paints its own palette inline.** `github-dark` writes
   `style="background-color:#24292e"` onto every `<pre>`, which no stylesheet rule wins
   against. Fixed by setting `theme: 'css-variables'` in `astro.config.mjs` and defining
   `--astro-code-*` from tokens in `architecture.css`. Do not try to override it with CSS
   specificity; that was the wrong road.

---

## 7. DECISIONS

Carried forward and still binding:

- **D-1.** Zero em dashes in anything a visitor reads. Rewrite the sentence, never swap
  the character.
- **D-2.** No Tailwind, no font CDNs. Colour only through `tokens.css`.
- **D-3.** Nothing is done until it has been observed rendering. A clean build is not
  evidence.
- **D-4.** No grey drop shadow on the homepage truth card. He asked for it, then
  withdrew it. Do not reintroduce it.
- **D-5.** Live deploys need approval for that specific deploy. It does not carry
  forward to the next one.

New this session:

- **D-6.** The two SP+ documents are **not behind the auth gate**. Both are `noindex`,
  so they are links you hand somebody rather than pages they find. Rationale: both are
  written to be read before a conversation, and the architecture report exists to be
  forwarded to a reviewer. Flagged to Christopher; he did not ask for a gate.
- **D-7.** The architecture report stays **authored as markdown**, rendered by
  `ArchitectureDoc.astro`. It is an evidence document that will be regenerated as SP+
  changes, and hand-porting 80 assertions into a component every time guarantees drift.
- **D-8.** The back office carries **three button weights**: yellow for the download,
  ink for Inside SP+, outline for the architecture report. Not three of the same.
- **D-9.** **Two em dashes stay** in the architecture page, inside fenced blocks:
  `SP+ runtime posture gate — test@127.0.0.1:2222` in quoted gate output, and
  `# SP+ SUID/SGID allowlist — T1.10.` in a quoted source file. Editing quoted evidence
  in a document whose whole argument is that its quotes are verbatim would be worse
  than the style violation. The honest fix is upstream in `runtime-posture-gate.sh` and
  the allowlist, then re-import.

---

## 8. LEDGER STATE

Everything is committed and pushed. Nothing is written but uncommitted.

```
2411867  Publish the SP+ security architecture report   <- origin/main, live, verified
d5cbea6  Add Inside SP+ to the back office              <- live, verified
339e983  Update the resume document for the front-page pass
5a20523  Tighten the hero field and rework the homepage truth card
```

Working tree clean. `origin/main` == local HEAD.

**Note:** `docs/SITE-FIT-RESUME.md` in the repo is still the previous (homepage pass)
edition until this one is committed in Step 3.

---

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for Christopher's next screenshot.** He is walking the site and handing over
   asks one at a time. That is the actual driver, not this list.
2. **Fix the Contact email wrap.** Reproduce at 1008px in the iframe rig, read the
   computed style on the anchor **before** assuming a cause, fix, re-verify at 1008px
   and 1440px. Open since two sessions ago and raised twice.
3. **Correct `CLAUDE.md`'s `.btn--outline` claim.** It documents a shared component that
   is not in the codebase. Flagged to Christopher, no instruction given.
4. **Decide the two remaining `$110M` phrasings** at `the-operator.astro:154` and `:169`.
   They still use the wording The Work has moved away from. Flagged, no instruction
   given. Ask before changing.
5. **Ask before pushing.** D-5 does not carry forward. Both deploys this session were
   separately authorised.

---

## 10. RELAY / ENVIRONMENT NOTES

- Working directory is `/home/chris/work/secureprospective-site`. Beware: a bare `cd`
  inside a Bash call changes the harness's primary working directory for later calls.
  It happened twice this session. Prefer absolute paths.
- **Iframe rig**, the only way to test a viewport width here:
  ```js
  const f=document.createElement('iframe');
  f.style.cssText='position:fixed;top:0;left:0;width:1440px;height:1450px;border:0;z-index:99999;background:#fff;transform:scale(0.585);transform-origin:0 0';
  f.src='/path/?v='+Date.now();
  document.body.appendChild(f);
  await new Promise(r=>f.onload=r);
  const d=f.contentDocument, w=f.contentWindow;
  d.documentElement.scrollTop = el.getBoundingClientRect().top + w.scrollY - 90;
  ```
  The `transform: scale()` is what lets a 1440px layout fit inside an 847px screenshot.
- **Viewing a gated members page:** the auth script redirects to `/members/login` before
  you can see anything. Write a throwaway copy into `dist/` with the module script
  stripped and `hidden` removed, view it, then delete it. Never commit it; `dist/` is
  not tracked, but the file should still be removed.
- **Deploy verification loop** that worked:
  ```bash
  for i in $(seq 1 50); do
    code=$(curl -sL -o /tmp/x.html -w '%{http_code}' https://secureprospective.com/PATH/)
    [ "$code" = 200 ] && grep -q 'MARKER' /tmp/x.html && break
    sleep 15
  done
  ```
  Deploys landed in 3 to 4 polls both times, so roughly 45 to 60 seconds.
- **Filing gate note:** a new dotfile `.wrangler` has appeared at `~` since the baseline.
  The gate calls it out as a review item, not a failure, and still exits 0. Not
  re-baselined, because that is Christopher's call.

---

## 11. HONEST STATUS

Everything Christopher asked for in this session is live on production and was verified
against production rather than against the build output. There is no work in flight and
nothing is running.

What is genuinely unproven:

- **The Contact email wrap has never been diagnosed.** The hypothesis in §5 is a guess,
  and it is recorded as a guess.
- **Neither new page has been seen by Christopher on a real phone.** I measured 390px in
  an iframe, which proves layout but not feel.
- **The print stylesheets on both pages have never been rendered to paper or to a PDF.**
  They are written and they are plausible; they are not measured. Both documents are
  meant to be handed over on paper, so this is a real gap, not a pedantic one.
- **The architecture report's figures are dated.** It names edition t29, head `830023b`
  and 2026-09-11 throughout. It will be wrong the moment SP+ moves, and nothing on the
  page warns a reader of that beyond the prepared date.
