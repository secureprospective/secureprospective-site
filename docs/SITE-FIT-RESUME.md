# RESUME: secureprospective.com site fit + SP+ 0.11 release wiring
**Written:** 2026-09-12 23:30 CDT. Supersedes the back-office-pass resume at `69b7a02`.
This is a compact-safe snapshot. The session CONTINUES; nothing here is a wrap-up.

## 1. WHAT WE ARE DOING
Two threads. (a) A full pre-launch audit of every page of secureprospective.com,
fixing what it found. (b) Making the site tell the truth about the SP+ 0.11
release, which is mid-upload and therefore not yet downloadable.

- Repo: `/home/chris/work/secureprospective-site`, branch `main`, NOT a worktree.
- Deploy: Cloudflare Pages auto-deploys on push to `main`. A push IS a production deploy.
- Second repo touched: `/home/chris/work/secureprospective-advisor-os`, branch
  `session/sp-plus-defense-in-depth`. **This one IS a git worktree** and another
  agent is actively working in it. Never `git stash` there.

## 2. AGENTS + HARNESSES
- **Me (Claude, Opus 5, Beelink `com` / 192.168.1.190).** Owns the site repo.
- **Claudebox / CT105 (192.168.1.105).** Head brain. Owns the SP+ release end:
  the ISO build, ghcr publish, the R2 upload, and the Dell. Talks to me through
  brief files that Christopher relays by hand; there is no direct channel.
  - Brief I sent: `~/fleet/briefs/ct105-spplus-011-release-verify.md`
  - Its reply: `~/fleet/briefs/ct105-spplus-011-release-verify.reply.md`
  - **CT105 addresses me as "Tom".** It has the wrong identity recorded for this
    end. Flagged to Christopher, not corrected.

## 3. GATES / STATUS
| Gate | State |
|---|---|
| Static audit (SEO, a11y, links, security, content) over all 16 pages | PASS |
| Rendered audit in Chrome at 360/390/768/1008/1280/1440 | PASS, 0 overflow, 0 contrast failures |
| Em dashes sitewide | 0, verified against production |
| Cloudflare edge caching of HTML | LIVE and verified MISS then HIT |
| SP+ 0.11 downloadable by members | **BLOCKED. The R2 object does not exist yet.** |
| SP+ update lane (`spplus-update-control status`) | **DEFECTIVE, CT105's lane.** See §5 |
| R2 credential rotation after the argv leak | NOT DONE |

## 4. ARTIFACTS THAT EXIST AND WORK
- **SP+ 0.11 ISO**, built as v0.11.4, on this machine at
  `~/work/secureprospective-advisor-os/projects/sp-plus/artifacts/v0.11.4-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
  - `5520687104` bytes
  - sha256 `a793df68e7f21cea274d139ef9b3aca375f7545bba9a38ddb79945d863cc562b`
  - **I recomputed that hash myself from the file on disk.** It agrees with the
    release ledger. It is not a copied number.
- **ghcr image**, published + signed + verified by CT105:
  `sha256:286075671c3f18259db7339c059f74ffdc389604f79e4b3c99e6ececd29304ac`
  (tags `:latest` and `:20260913`). This half of "released" is genuinely done.
- **Audit scripts**, scratchpad only, WILL NOT SURVIVE:
  `/tmp/claude-1000/-home-chris/bb43a672-693a-40e4-b860-f122f05da111/scratchpad/audit/static.mjs` (SEO/a11y/content/link scanner over `dist/`) and
  `/tmp/claude-1000/-home-chris/bb43a672-693a-40e4-b860-f122f05da111/scratchpad/audit/pass2.mjs` (labels, heading order, duplicate meta, og:image).
  Both re-runnable with `node <path>` after `npx astro build`. Copy into the repo
  if the audit is ever to be repeatable.

## 5. THE CURRENT BUG(S)
**A. The release is not released.** Christopher's words were "We just uploaded and
released SP+ 0.11." The ghcr half is true. The member-facing ISO is not: `rclone`
is still uploading, 65% at 23:28 CDT, ETA ~28 min, ~1.07 MiB/s.
- It is a **multipart** upload, so the key does not appear in the bucket until the
  final part commits. An empty `sp-plus/` prefix is therefore NOT evidence of
  failure. Both I and CT105 listed it and got nothing; both readings were correct.

**B. `spplus-update-control status` lies, on the Dell.** CT105 observed it report
`"state": "current"`, `"This computer is up to date."` while `check`, seconds later,
found `sha256:286075...` available. Status cannot distinguish "verified current"
from "never looked" and gives the reassuring answer for both.
- **Caveat, and it matters:** this is CT105's observation on the Dell, not mine. I
  have not reproduced it and cannot from here.
- **Site consequence, unconfirmed:** Inside SP+ says *"A daily health check can mark
  the system as needing attention rather than leaving a problem to be discovered
  later."* IF that health check consumes `update-control status`, that sentence is a
  promise the machine does not keep and must be reworded before 0.11 reaches members.
  **I could not trace the linkage from this machine. Do not reword it on the
  assumption. The open question to CT105 is: does the daily health check consume
  `update-control status`?**

**C. The R2 access key and secret are exposed in `ps` right now.** The running
upload was launched by the OLD `publish-iso-r2.sh`, which passed them as rclone
CLI flags. The script has since been fixed to use the environment, but the live
process still carries them in argv, readable by any local user, until it exits.
Rotation has not happened. Do not paste those values anywhere.

## 6. HYPOTHESES ALREADY REFUTED. DO NOT RETEST.
| Claim | Verdict |
|---|---|
| "Shiki's code-block colours can be beaten with CSS" | **REFUTED.** It writes `style="background-color:#24292e"` inline. Fixed at source with `theme: 'css-variables'` in `astro.config.mjs`. Do not fight specificity. |
| "`.btn--outline` is a global component" | **REFUTED.** CLAUDE.md says it was promoted sitewide; `grep -rn 'btn--outline' src/` finds nothing. It is defined scoped in `members/index.astro`. CLAUDE.md is stale on this. |
| "The contact email wrap is a width or `overflow-wrap` bug" | **PARTLY WRONG, now solved.** Real cause, measured: above 980px the hero grid goes two-column and the card drops 456px to 298px while `clamp(1.18rem, 2vw, 1.5rem)` kept growing with the VIEWPORT. Fixed with `container-type: inline-size` + `cqi`. |
| "An empty R2 prefix means the upload failed" | **REFUTED.** Multipart; the key appears only at final commit. |
| "The 18x18 download checkbox fails WCAG 2.5.8" | **REFUTED.** It is wrapped in a 280x153 `<label>`, so the hit area is the label. Not a defect. |
| "`scrollIntoView` / `window.scrollTo` work inside a transformed iframe" | **REFUTED.** Both leave `scrollY: 0`. Set `contentDocument.documentElement.scrollTop` directly. |
| "`pgrep -af <pattern>` proves a process is running" | **REFUTED, twice, by both of us.** It matches its own wrapper shell. Confirm a server by curling the port. |
| "We have a Cloudflare token that can read Pages bindings or R2" | **REFUTED by CT105, checked twice.** The stored token 403s on `/pages/projects`; the wrangler OAuth login has no `r2` scope. |
| "Publishing the sha256 implies we verified it against R2" | **REFUTED by reading the page.** The download page frames it as the build's fingerprint for the member to compare against their own file. It claims nothing about the bucket. No copy change needed. |

## 7. DECISIONS
- **D-1.** A push to `secureprospective-site` main is a production deploy and needs
  Christopher's explicit approval **for that specific push**. It does not carry forward.
- **D-2.** The 0.11 manifest entry stays `published: false` until the R2 object is
  listed at 5,520,687,104 bytes. A published entry over a missing object would give
  every member a download button that streams nothing.
- **D-3 (mine, stated to CT105).** Rotate the leaked R2 token BEFORE publishing, not
  just before finishing the upload.
- **D-4 (Christopher, 2026-09-13, via CT105's ledger).** The image keeps reporting
  `SP+ 1 (20260913)`. 0.11 is the release name, not the image string. Publish rather
  than rebuild. Do not relitigate.
- **D-5.** Only ONE thing from a release ever reaches site `main`: the `releases.ts`
  entry. CT105 does not push to the site repo; I do.
- **D-6 (mine).** The fictitious `1.0-alpha` manifest stub (size 0, empty sha256,
  a key for an ISO never built) was REPLACED, not kept alongside. If that was the
  "old one" Christopher wanted deleted, it is handled.
- **D-7.** Ghcr tags `:20260911` and `:signtest` still exist. Nothing deleted. Awaiting
  Christopher's answer on what "delete the old one" meant.

## 8. LEDGER STATE
**Site repo, `main`:**
- `1cfc113` Stage the real 0.11 entry + fix the stale 404 note. **COMMITTED, NOT PUSHED.**
  Deliberate: it should go up together with `published: true` in one step.
- `26f8028`, `0cc692d`, `69b7a02` are pushed and verified live.
- Working tree clean.

**advisor-os, `session/sp-plus-defense-in-depth`:**
- `bda4543` (my em dash fix at source) is committed AND already at origin.
- `projects/sp-plus/installer/interactive-defaults.ks` and `payload-ref.txt` are
  modified by **someone else**. I did not touch them and neither should the next window.

## 9. NEXT ACTIONS, IN ORDER
1. **Wait for CT105's confirmation** that the R2 object is listed. Do not poll the
   upload aggressively and do not touch the rclone process.
2. **Confirm the token was rotated** and a `publish-iso-r2.sh check` passes with the
   new credential.
3. **Flip** `published: false` to `true` in `functions/_lib/releases.ts`, amend or add
   a commit, and **ask Christopher for the push** (D-1).
4. **Verify against production**, not `dist/`: sign in, confirm the release card
   renders, the size reads 5.14 GiB, the sha256 string matches, and
   `/api/download/iso?v=0.11` streams rather than 404s.
5. **Put the health-check question to CT105**: does the daily health check consume
   `update-control status`? Reword the Inside SP+ sentence only if the answer is yes.
6. **Raise with Christopher**: ghcr `:20260911` / `:signtest`, keep or delete.

## 10. RELAY / ENVIRONMENT NOTES
- Chrome is the only usable rendering engine here. `playwright-core` is installed but
  **no browser binary exists**, and `resize_window` does not work. The working rig is
  an iframe at a fixed pixel width inside a normal tab, driven by `javascript_tool`.
- Gated `/members/*` pages redirect to login before they can be inspected. To view one,
  write a copy into `dist/` with the module script stripped, look at it, then delete it.
- A long `javascript_tool` sweep will blow the 45s CDP timeout. Park results on `window`
  and poll for them instead of awaiting inline.
- `cd` inside a Bash call changes the harness's working directory. Prefer absolute paths;
  it has flipped between the two repos several times this session.

## 11. HONEST STATUS
The site itself is in good shape and that part is proven, not asserted: every fix was
checked rendered and then re-checked against production. What is NOT proven:
- **The 0.11 download has never worked, because the object does not exist yet.** Nothing
  about the download lane is verified end to end. The manifest entry is correct data
  pointing at an absent file.
- **The update-lane defect is CT105's report, not my observation**, and its blast radius
  on the site copy is a linkage I could not trace.
- **The Pages binding `SPPLUS_RELEASES` is unverified by anyone.** It rests on
  Christopher having read the dashboard. No credential on either machine can check it.
  If the download 404s after publishing, suspect this first.
