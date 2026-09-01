# SP+ RESUME — 2026-08-31 evening (Welcome app services work)

Written mid-session for compaction. **The session continues.** Resume at NEXT ACTIONS item 1.

## 1. WHAT WE ARE DOING

Building the SecureProspective service integration into the SP+ Welcome app: getting a newly
contracted advisor onto the file portal and the social scheduler. **The goal is an app
Christopher can sit down and test by hand.** No ISO gets built until then — that is his
explicit instruction, and the trigger for a build is hands-on readiness, not accumulated fixes.

- Repo: `/home/chris/work/secureprospective-advisor-os` (**a git worktree** — never `cd` to the
  original checkout).
- Branch: `session/sp-plus-plan`. HEAD at write time: `5e5978e`.
- Welcome source: `projects/sp-plus/welcome/` — `welcome.py`, `app/index.html`, `app/app.css`,
  `app/app.js`.
- SP+ VM: `ssh -p 2222 test@127.0.0.1` → libvirt domain `fedora-test` (`qemu:///session`),
  inside it hostname `sp-plus`, `10.0.2.15`, `systemd-detect-virt=kvm`.
- **ClaudeBox (CT105) the agent is DOWN until Thursday night. I am headbrain.** The machine
  `192.168.1.105` is still reachable over SSH — only the agent is offline.

## 2. AGENTS + HARNESSES

- Bee = `pi` on `gpt-5.6-luna`, thinking max, via
  `~/fleet/bin/run-bee-spplus-impl.sh <fid>` under `systemd-run --user --unit=bee-<name>`.
- The runner reads `~/.pi/agent/spplus-brief-<fid>.md`. **Briefs must be copied there**;
  `~/fleet/briefs/` is the archive copy.
- Reports land in `~/fleet/runs/REPORT-<name>.md` with a `.DONE` sentinel.
- **Never poll a dispatch.** Use a Monitor watching the sentinel.

### The pgrep trap — hit twice, do not hit a third time

`pgrep -f 'python3.*welcome\.py'` matches **the watching shell's own command line** and raises
false alarms. Use the `comm` field instead:

```bash
ps -eo comm,pid,args --no-headers | awk '$1 ~ /^python/ && $0 ~ /welcome\.py/ {print $2}'
```

## 3. IN-FLIGHT RIGHT NOW — most perishable

**A. `bee-welcome-design.service` — RUNNING**, started 18:36, ~38 min elapsed at write time,
timeout 7200s. The design pass: fix empty cards, doubled readiness/Retry, and panel weighting.
- Alive? `systemctl --user is-active bee-welcome-design`
- Output: `~/.pi/agent/spplus-welcome-services-design.{out,err}` (empty until it finishes —
  normal for this runner). VM working files are `/home/test/welcome-design-*`.
- Sentinel: `~/fleet/runs/REPORT-welcome-design.DONE`
- Brief: `~/fleet/briefs/spplus-welcome-services-design.md`

**B. A chain script — RUNNING** (`scratchpad/chain-contrast.sh`, Monitor task). It waits for
the design sentinel and then dispatches `bee-welcome-contrast`. **It deliberately does NOT
dispatch if the design pass dies without its sentinel.** If compaction kills it, dispatch by
hand:

```bash
rm -f ~/fleet/runs/REPORT-welcome-contrast-close.DONE
systemd-run --user --unit=bee-welcome-contrast --collect \
  --setenv=THINK=max --setenv=TMO=7200 \
  ~/fleet/bin/run-bee-spplus-impl.sh welcome-contrast-close
```

**C. `pi` PID 1004997 — NOT MINE. DO NOT KILL.** It is in a kitty terminal scope on pts/1 with
an interactive bash parent — Christopher's own session.

## 4. STATUS

| Gate | State |
|---|---|
| No-scroll, 8 screens + 2 panels, 1280x800 and 1024x768 | PASS, `overflowRegions=[]` |
| Hit tests, all controls | PASS |
| `pending_review` inert under real CDP clicks | PASS — `aria-disabled`, `tabIndex=-1`, `onclick=null` |
| Failure fixtures (6) | PASS, `passwordInputs=0`, `forms=0` |
| Clean shutdown / no coredump | PASS |
| Theme round trip, t1≡t3 | PASS |
| Only public hostnames launched | PASS |
| Dead-code removal (12 ids) | PASS, zero matches in HTML/CSS/JS |
| Banned strings | PASS — no Nextcloud/Postiz/"coming soon"/"cannot read your files" |
| **Composition and polish** | **NOT ACCEPTED — see §6** |
| `welcome-lifecycle-gate.sh` can-fail proof | **OPEN** |
| Dell hardware gate (owed by D-02 pin bump) | **OPEN** |
| VM passt port forward, first boot | **UNEXERCISED** |

## 5. ARTIFACTS

- `~/fleet/runs/REPORT-welcome-services.md` — the r2 build evidence.
- `~/fleet/runs/REPORT-welcome-consolidate.md` (8112 b) — consolidation evidence.
- `~/fleet/runs/welcome-consolidate/evidence-services-{base,files,social}-{1024x768,1280x800}.png`
  — the six screenshots Christopher reviewed. **These are the "before" for the design pass.**
- `~/fleet/runs/welcome-services/` — 18 artifacts from r2 (geometry, hit-test, fixtures, live
  capability, coredump evidence).
- VM working copy: `/home/test/welcome-consolidate-20260831/`.

## 6. THE CURRENT PROBLEM — composition, not correctness

Every gate passes and the screen is **still not good enough**. From the screenshots:

1. **Base page mostly empty** — both cards ~380px tall holding a headline, one line, then a
   void. Reads as unfinished rather than spare.
2. **Doubled readiness** — a status strip above each card *and* a `READY` marker inside it,
   plus a **RETRY button offered when nothing has failed**.
3. **Panels dominated by the caveat** — the yellow "REVIEW AFTER AN OUTAGE" box takes the whole
   right half at full height, out-weighing "Bluesky is ready to use", the only actionable item.
   The File Portal panel's right box is ~470px with content centred in a void.

Christopher then found two more himself:

4. **Yellow text on white must go.** `#ffd700` on white ≈ **1.5:1**. Fifteen rules set yellow or
   gold as a text colour; roughly half sit on blue and are fine. Offenders on light surfaces
   include `.preview-kicker`, `.preview-label`, `.preview-result`, `.theme-preview-header
   .text-button:hover`, `.folder-divider`, and **`.service-password-note`** — which is the
   "portal password is separate" line, the highest-value sentence on the screen.
   Check `.ask-feedback[data-kind=pending]` — may be yellow on yellow.
5. **The 75% panel has no obvious close.** `#service-panel-close` is 10px white `text-button`
   text reading "CLOSE PANEL". Escape and backdrop work but are undiscoverable.

**Caveat on the leading hypothesis:** the design pass had made **no repo edits** 28 minutes in
while running VM gates. The likely reading is that it was capturing the "before" half of the
required same-scale before/after. **If it finishes with the repo unchanged, it measured the old
screen and the pass must be rejected.** Verify from the diff, not the report.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **The capability endpoint is NOT missing.** It is live on both hosts, 200 JSON, CORS `*`,
   `Cache-Control: 60`, **zero redirects**. Earlier 404/307 readings are stale.
2. **Round-trip latency is NOT ~5.4s.** That was measured on the Beelink and was cfgate's
   mitmproxy in the TLS path (5.05s of it was *connect*). From the VM it is **0.106–0.203s**.
   **Measure on the VM or the Dell, never the Beelink.**
3. **The SIGABRT was never a software-GPU/WebEngine problem.** Refuted earlier; `libEGL: failed
   to create dri2 screen` is expected VM noise.
4. **`exec()` returning 0 does not prove a clean exit.** The abort happens during interpreter
   teardown. `coredumpctl` is the authority.
5. **A Welcome process "on the Beelink" was a false alarm** — the `pgrep -f` self-match in §2.
6. **Postiz's OAuth callback is `/integrations/social/<platform>`**, not
   `/api/auth/oauth/<platform>`. X is `x`. LinkedIn is two providers. Bluesky has no callback.

## 8. DECISIONS

- **D-13 — Primal is not shipped.** `Noto Sans Condensed Black` is the permanent display face,
  treated as the design, not a fallback. `welcome/app/fonts/` stays empty. Do not reintroduce.
- **Two screens collapsed into one** "Your SecureProspective services": two cards, each opening
  a ~75% panel with features and a link out. 9 screens → 8.
- **Welcome sets up and hands off. It is not an administration console.** 2FA enrolment,
  missed-post review and account administration belong to the services. Test: would the advisor
  otherwise do this in the service's own interface? Then point them there.
- **The app must never carry, cache or pre-fill Christopher's account details.** It onboards a
  new advisor. He tests with his own logins.
- **Bluesky/SMTP are UNPROVEN, not BLOCKED.** The test-member ask was withdrawn.
- **Yellow is a background/accent colour, never text on light.**
- **No ISO until the app is ready for hands-on testing.**
- **Do not settle for average.** "It improved" and "nothing regressed" are not acceptance.
  Composition and confidence are acceptance criteria, because a nervous advisor reads an
  unfinished-looking screen as unsafe for client work.

## 9. LEDGER STATE

Committed today: `28b268a`, `774706b`, `270abc1`, `a0fd923`, `f0b1e4f`, `8f94c55`, `5e5978e`.
Headbrain log at `projects/sp-plus/docs/ledger/HEADBRAIN-LOG-2026-08-31.md` (`f0b1e4f`).

**Uncommitted and not mine:** `.gitignore`, `CLAUDE.md`, `HANDOFF.md`, `HEADBRAIN.md`,
`SP-PLUS-STATE.md`, `grafix/render/ROUND4-PLUS-SHADING.md`,
`projects/sp-plus/docs/08-BUILD-SESSION-HANDOFF.md` — dirty since session start. `a0fd923`
accidentally swept in ~20 `bee-lane` files; harmless and reversible, but the commit is untidy.

## 10. NEXT ACTIONS, IN ORDER

1. **Wait for `bee-welcome-design`.** When the sentinel drops, **read the diff first** — confirm
   `app.css` and `index.html` actually changed. If unchanged, reject the pass (§6 caveat).
2. **Look at the after-screenshots yourself.** Do not accept a gate summary. Judge whether the
   screen reads as trustworthy to a nervous advisor, per §8's last bullet.
3. **Confirm the chain fired** `bee-welcome-contrast`. If not, dispatch by hand (§3B).
4. **Review the contrast pass** — every fixed instance ≥4.5:1 with the measured number, and a
   close control findable in under a second.
5. **Prove `welcome-lifecycle-gate.sh` can fail** — run with Welcome up and down, show different
   results. The fix in `a0fd923` is unverified.
6. **Only then** consider an ISO, and re-run the Dell hardware gate owed by the D-02 pin bump.

## 11. ENVIRONMENT NOTES

- Beelink is Christopher's live desktop. **Never launch a GUI here.** All execution — app
  launches, screenshots, gates, hit tests, latency — runs on the VM or the Dell.
- **Do not reboot the VM.** Its permanent `<portForward>`/`<backend type='passt'/>` is in the
  persistent XML but the running domain is still on the memory-only `hostfwd_add`. passt is a
  different network stack; first boot on it is a real test and would cost SSH access.
- Never bare `git stash` — the stack is shared across worktrees. There is already an entry from
  another session (`stash@{0}`, opencode-deepseek-design-doc). Use a WIP commit.
- Filing gate FAILS on `~/JoplinBackup` only. It is **live** (Joplin plugin
  `io.github.jackgruber.backup` targets it) and deliberately not moved. The fix is a plugin
  setting, not a `mv`. Do not "tidy" it.

## 12. HONEST STATUS

The service integration is **functionally complete and verified**, and **not yet good enough to
put in front of Christopher**. Two passes are in flight to close that gap; neither has been
reviewed. Nothing about the visual result should be claimed until the after-screenshots are
looked at directly.

**No ISO contains any of today's work.** The installed image on the VM is stale and still
coredumps on the QThread bug fixed in source this morning — expected, and the clearest argument
for the eventual build.

Genuinely unproven: **no post has ever published through Bluesky** (it reports `live` because
it structurally cannot require keys, not because anything was tested), and **SMTP has no
verified sender**, so activation and password-reset email cannot send.
