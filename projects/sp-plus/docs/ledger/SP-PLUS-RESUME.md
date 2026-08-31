# SP+ RESUME — 2026-08-31 (second compaction of the session)

## 1. WHAT WE ARE DOING

SP+ is an image-mode (bootc) Fedora KDE desktop for non-technical financial
advisors. The session goal — switching Windows -> Breeze -> Windows through the
Welcome app alone, without error — **is MET and was met before this window**, on
test45, test46, and on an ISO-installed VM. This window fixed the two Welcome
defects that goal work exposed, and picked up two new Welcome flows.

- Repo: `/home/chris/work/secureprospective-advisor-os` (a **git worktree** —
  run everything from it, never cd to the original checkout).
- Branch: `session/sp-plus-plan`. HEAD `50d914a`.
- VM: `ssh -p 2222 test@127.0.0.1` (libvirt session domain `fedora-test`).

## 2. AGENTS + HARNESSES

- **Bee** = the Pi agent, `--provider openai-codex --model gpt-5.6-luna
  --thinking max`. Never leave the model to pi's default.
- Three lanes in `~/fleet/bin/`: `run-bee-spplus.sh` (research, stdout only),
  `run-bee-spplus-impl.sh` (edits repo source), `run-bee-spplus-verify.sh`
  (**drives a live machine, writes reports under `~/fleet/runs`, must NOT edit
  repo source**). The verify lane is the one used this window.
- Dispatch pattern: `systemd-run --user --unit=<name> --collect
  --setenv=HOME=/home/chris --setenv=THINK=max --setenv=TMO=7200
  --property=TimeoutStartSec=7500 ~/fleet/bin/run-bee-spplus-verify.sh <fid>`.
  The runner reads its brief from `~/.pi/agent/spplus-brief-<fid>.md`, so a
  brief written to `~/fleet/briefs/` must ALSO be copied there.
- Sentinel convention: agent writes `REPORT-<job>.md` then touches
  `REPORT-<job>.DONE`. A background watcher loop pings back. Never poll.

## 3. GATES / STATUS

| Gate | State |
|---|---|
| Theme round trip on installed VM | **PASS** (proven pre-window) |
| Welcome BUG A — cards unreachable | **FIXED + VERIFIED** at `97f2dee` |
| Welcome BUG B — intermittent SIGABRT | **FIXED + VERIFIED** at `00e2e02` |
| ISO contains either fix | **NO.** Source only. No build since 11:53. |
| Dell hardware gate | **OWED** — not re-run since the D-02 pin bump |
| Two new Welcome flows | Direction read, nothing built |
| Filing gate | FAIL, one known offender (see §12) |

## 4. ARTIFACTS THAT EXIST

- ISO: `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
  — 5,498,066,944 bytes, built 11:53. **Predates every fix in this window.**
- VM deployment digest:
  `ostree-unverified-registry:ghcr.io/secureprospective/sp-plus-kde:edge`
  `sha256:e9d936bfd01a55740c60893017fa94955284280c0aa9155e69cb38f80c9ce437`
- Current source hashes (what Bee verified):
  - `projects/sp-plus/welcome/app/app.css` sha256 `3614f66932729deb9d2c57175883730bdf4981cdd110933c4bed766270d6eb47`
  - `projects/sp-plus/welcome/welcome.py` sha256 `8dad5ff06270bff65acccd5ffce8f896019ba956463375142354884a7972d3b8`
- Reports: `~/fleet/runs/REPORT-welcome-defects.md` (measurement),
  `~/fleet/runs/REPORT-welcome-fixverify.md` (12,727 bytes, the verification).
  Raw evidence in `~/fleet/runs/welcome-defects/` and `~/fleet/runs/welcome-fixverify/`.

## 5. THE CURRENT BUG

**There is no open Welcome defect.** Both are closed on evidence. Do not go
looking for one.

The two fixes, for context:

- **Cards clipped out of reach.** The theme screen sized every row to content,
  so at 1280x800 and 1024x768 it exceeded the `overflow:hidden` `.screens` box.
  Catppuccin Mocha and Latte fell 65px and 79px below the clip and their centre
  points landed on footer controls — clicking Mocha pressed "I'll do this
  later", clicking Latte pressed "Back". Fixed by making the three-deep card
  columns the one flexible grid row.
- **Intermittent SIGABRT.** `QThread: Destroyed while thread '' is still
  running`. `WelcomeBridge` held workers in sets and nothing waited for them at
  quit, so Python dropped the bridge and Qt aborted in `~QThread`. A theme apply
  restarts plasmashell; the shell teardown can close the Welcome window mid-apply
  and `quit()` then races the running `ThemeApplyWorker`. Fixed with
  `WelcomeBridge.shutdown()` connected to `aboutToQuit`.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **The SIGABRT is WebEngine failing on the VM's software GPU.** Refuted.
   0/10 crashes under normal rendering and 0/10 under
   `QTWEBENGINE_CHROMIUM_FLAGS=--disable-gpu`, and the
   `ContextResult::kTransientFailure` line did not even appear in the controlled
   units. The cause is our own teardown, proven by a directed test.
2. **The crash rate test would settle the cause.** Refuted — 0/10 vs 0/10
   separates nothing. Only the directed race did.
3. **`exec()` returning 0 means the process exited cleanly.** Refuted. The
   unpatched child *printed* rc=0 and still took SIGABRT during interpreter
   teardown, and SSH returned 255 (transport), not 134. **The coredump is the
   authoritative status evidence, not the exit code.**
4. **Enabling scroll would fix the clipped cards.** Rejected by standing rule —
   every Welcome screen must fit one viewport. A scrollbar is a FAIL condition.
5. **The image is missing `qdbus6`.** Refuted — the binary is `qdbus-qt6`.
6. **Five of eight themes share one panel (a defect).** Refuted — five ship
   their own layout, three declare none. Settled by D-2026-08-31.
7. **`10.0.2.15` is the VM's address.** Now STALE — see §10.
8. **The proposed OAuth callback `/api/auth/oauth/<platform>`.** Wrong, never
   file it. See §7.

## 7. DECISIONS

- **D-02 pin bump.** Installer base digest bumped after the old pin was
  garbage-collected on quay. Owes a Dell hardware gate re-run.
- **Layout-less themes keep the stock panel.** Christopher: "Leave them on
  stock." Nordic and both Catppuccins declare no layout; wording differs, panel
  is still reset either way.
- **Hostnames.** File portal `cloud.secureprospective.com` (changed from
  `files.` late on 2026-08-31); social scheduler
  `social.secureprospective.com`. Recorded in
  `projects/sp-plus/docs/ledger/DECISION-2026-08-31-public-hostnames.md`.
- **OAuth callbacks are Postiz's path, not ours:**
  `https://social.secureprospective.com/integrations/social/<platform>`.
  X is `x` not `twitter`. LinkedIn is TWO providers, `linkedin` and
  `linkedin-page`, and both callbacks belong on the one app. Bluesky is not
  OAuth at all (app password) so there is nothing to file — which is why it
  carries the first end-to-end test.
- **Welcome renders only live capabilities.** Reads
  `GET https://<host>/.well-known/sppl` (NOT `/api/...`, which collides with
  Postiz). Render only `state:"live"`; hide `pending_review`; treat unreachable
  as `unavailable` and defer. Keyed to the immutable D1 UUID, never email.
  Saved as a standing memory, not just a project note.
- **Filings are scoped as a multi-user scheduling service for contracted
  producers** — the stricter review. Re-scoping later means re-review.

## 8. LEDGER STATE

Committed this window, all on `session/sp-plus-plan`:

- `00e2e02` welcome: unclip the bottom theme cards, and drain workers before quit
- `6a9bdc5` ledger: VM SSH forward moved into the domain XML
- `68c9d6b` ledger: public hostnames (superseded by `50d914a`)
- `97f2dee` welcome: drop the theme descriptor on short screens
- `50d914a` ledger: correct hostname, callback path, tunnel ordering

Uncommitted modifications exist in unrelated top-level docs (`CLAUDE.md`,
`HANDOFF.md`, `SP-PLUS-STATE.md`, bee-lane briefs, grafix). They predate this
window and were deliberately not touched.

## 9. NEXT ACTIONS, IN ORDER

1. **WAIT.** Christopher said "hold on, we are almost there" — Claudebox is
   standing up the Cloudflare tunnel. Do not start the flow build until he says
   go. The VM is idle and free if Claudebox needs it.
2. **Build the two Welcome flows** from `~/fleet/inbox/HANDOFF-tom-nextcloud.md`
   and `~/fleet/inbox/HANDOFF-tom-postiz.md`, driven by the `/.well-known/sppl`
   capability contract. Delegate execution to Bee; drive, do not type.
3. **Batch, then build ONE ISO** with the two fixes plus the flows. The build is
   the slowest step in the loop — do not build per fix.
4. **Re-run the Dell hardware gate**, owed by the D-02 pin bump.
5. **Verify the passt port forward on the VM's next boot** (§10) — defined but
   never yet observed carrying a session.

## 10. RELAY / ENVIRONMENT NOTES

- **The VM's SSH forward was a live `hostfwd_add` on the QEMU HMP monitor, which
  lives only in QEMU's memory.** QEMU restarted mid-run this window and the
  forward vanished, failing a dispatch through no fault of its own. It is now
  declared in the domain XML with `<portForward>` + `<backend type='passt'/>`.
  `<portForward>` is NOT accepted on the SLIRP backend — libvirt 11.3.0 rejects
  it outright, so the passt move is required, not optional.
  - **Takes effect at the VM's next boot and is UNPROVEN until then.**
  - **The guest will no longer be `10.0.2.15`** — that was SLIRP's lease.
  - Rollback XML: `fedora-test.backup-*.xml` in the session scratchpad;
    `virsh -c qemu:///session define` on it restores SLIRP.
  - To re-add by hand if needed:
    `virsh -c qemu:///session qemu-monitor-command fedora-test --hmp 'hostfwd_add tcp:127.0.0.1:2222-10.0.2.15:22'`
- The VM's SSH host key has changed more than once; clear with
  `ssh-keygen -f ~/.ssh/known_hosts -R '[127.0.0.1]:2222'`.
- **Service LAN addresses moved** (their old ones were inside the DHCP pool and
  another device took `.107`): Nextcloud `192.168.1.107` -> **`192.168.1.30`**,
  Postiz `192.168.1.106` -> **`192.168.1.31`**.
- The guest agent is SELinux-confined and returns `Permission denied` as root.
  **Never trust an "absent" reading from it** — use `virsh screenshot` or SSH.

## 11. HONEST STATUS

Both Welcome defects are genuinely closed: measured, fixed, and re-verified
against the current source by an agent that re-staged the follow-up commit on
its own. The crash gate's negative control actually failed, which is what makes
it evidence rather than a green tick.

What is NOT proven:

- **No ISO contains any of this.** Everything since 11:53 is source only.
- The passt forward is defined, not observed working.
- The two new flows are unbuilt, and cannot be proven end to end regardless —
  **the file portal's critical path is SMTP, not the container.** Steps 2 and 3
  of that flow *are* the activation and reset emails, and Brevo is deferred with
  a placeholder sender.
- The Dell has not run since the base-image pin changed.

Two blockers sit with Christopher and gate other people: **a verified Brevo
sender**, and **creating the Postiz operator account** in a browser at
`http://192.168.1.31:4007` before registration is closed (Postiz has zero
accounts and the first is made *through* registration, so closing it first locks
everyone out).

## 12. FILING GATE

FAILS at 23 visible entries against a target of 22. The single offender is
`~/JoplinBackup`. **It is LIVE** — the Joplin plugin
`io.github.jackgruber.backup` points at it. It was deliberately NOT moved:
the correct fix is a plugin setting, not a `mv`. Do not "tidy" it away.
Also noted: `.npm` is a new dotfile since the baseline, not a failure.
