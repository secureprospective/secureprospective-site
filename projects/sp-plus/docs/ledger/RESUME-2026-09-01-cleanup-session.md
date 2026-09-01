# RESUME — SP+ code cleanup / stability + security session
## Written 2026-09-01 ~17:50 CDT, mid-session, ahead of a context compaction
### THE SESSION CONTINUES. This is not a session close.

---

## 1. WHAT WE ARE DOING

Christopher's brief: **code cleanup for stability and security**, with Claude doing the
reasoning head-on rather than delegating ("Not this session"). Task 1 was the Welcome
application — bloat, dead code, better data flow, polish — because "we seem to break
something every time we make modifications." That is **done and committed**. Task 2 was
"prove the PIN YOUR HELP button on the new image" — **done and committed**. Christopher
said he has a further task after that; it has not been named yet.

- Repo: `/home/chris/work/secureprospective-advisor-os`, project under `projects/sp-plus/`
- Branch: `session/sp-plus-plan` — **tree CLEAN at `5194dc4`**
- Build worktree: `/home/chris/work/sp-plus-build`, detached at `3bdf319`
- Work is driven from CT105 over SSH to the Beelink; the Beelink reaches the VM.

---

## 2. MACHINES, AGENTS + HOW TO REACH THEM

| Machine | How to reach it | State |
|---|---|---|
| Beelink `192.168.1.190` | `ssh -i /root/.ssh/beelink chris@192.168.1.190` from CT105 | Christopher's desktop. Dispatch + builds only. |
| Test VM (new, from today's ISO) | from the **Beelink**: `ssh -p 2222 test@127.0.0.1` | running, key auth works |
| Dell `192.168.1.124` | `ssh -i /root/.ssh/spplus-test test@192.168.1.124` from **CT105** | **DOWN — see §5** |
| Registry `spplus-reg` | `localhost:5000` on the Beelink | up, MUST STAY UP |

**No agents were dispatched this session.** Christopher explicitly asked Claude to do the
reasoning directly. Nothing is running in the background; verified with `pgrep`.

### ⚠️ THE VM's SSH FORWARD IS LIVE-ONLY AND WILL NOT SURVIVE A VM RESTART
The new VM was created with `-netdev type=user` and **no `hostfwd`**. `10.0.2.15` is QEMU
user-mode NAT and is unreachable from the host by design. Port 2222 exists only because it
was added to the *running* qemu:

```bash
ssh -i /root/.ssh/beelink chris@192.168.1.190 \
  'virsh qemu-monitor-command fedora-test --hmp "hostfwd_add hostnet0 tcp:127.0.0.1:2222-:22"'
```

**If the VM is restarted, re-run that command or nothing can reach the VM.** Making it
permanent requires editing the libvirt domain XML; that has NOT been done.

VM credentials from Christopher: user `test`, password `password`, LUKS passcode `password`.

---

## 3. GATES / STATUS

Run Welcome gates from the Beelink. **Every desktop gate must import the live Plasma session
environment; SSH does not inherit it** (without it a gate reports ~20 phantom failures). The
runner `~/rungate.sh` on the VM already does this.

```bash
cd ~/work/secureprospective-advisor-os/projects/sp-plus
rsync -a -e "ssh -p 2222" welcome tests test@127.0.0.1:~/sp-plus-welcome-src/
ssh -p 2222 test@127.0.0.1 "bash ~/rungate.sh <gate>.sh"
```

| Gate | Result (2026-09-01, this session) |
|---|---|
| `welcome-layout-gate.sh` | PASS |
| `welcome-finish-handoff.sh` | PASS (mutation-tested both directions) |
| `welcome-close-gate.sh` | PASS |
| `welcome-lifecycle-gate.sh` | PASS |
| `welcome-help-search-gate.sh` | PASS |
| `welcome-help-corpus-gate.sh` | PASS |
| `welcome-all-stubs-source-gate.sh` | PASS (updated for `send()`) |
| `welcome-tools-source-gate.sh` | PASS (updated + de-vacuumed) |
| `cycle36-source-gate.sh` | PASS (updated for `send()`) |
| `welcome.py --self-test` | exit 0, 4 worker families, no QThread abort |
| `config-preflight.sh` | **31 passed, 0 failed — on a CLEAN tree** |
| `preflight-gate.sh` | 10 passed, 0 failed |
| `theme-fidelity-gate.sh` | **NOT RUN this session** (~10 min) |
| `theme-wallpaper-roundtrip.sh` | **NOT RUN this session** |

Helper scripts staged on the VM (`~/`): `rungate.sh`, `selftest.sh`, `pin_state.sh`,
`unpin.sh`, `shot.sh`, `restore_shell.sh`, `pin_driver.py`, `run_pin_fixed.sh`,
`spplus-pin-help-fixed`, plus the title probes.

---

## 4. ARTIFACTS THAT EXIST AND WORK

**The ISO — handed to Christopher, in his Downloads:**
```
/home/chris/Downloads/sp-plus-1.0-20260901.iso
5,619,464,192 bytes (5.2 GB)
sha256 921da03309889ea9ca2548677cf2698b40172db330113185971426717ecf0d23
ISO 9660, DOS/MBR boot sector, 'Secureprospective-Advisor-POC' (bootable)
```
Source artifact (identical sha256):
`~/work/sp-plus-build/projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`

Build log of the successful run: `~/logs/sp-plus/iso-build-20260901-163031.log`
Preflight logs: `~/logs/sp-plus/preflight-{config,gate}-attempt4.log`

**⚠️ TWO DIGESTS, ONE IMAGE — do not read these as different builds:**
```
localhost/sp-plus-kde:spike              = the ISO's payload container
localhost:5000/sp-plus-kde:test51        = the same image, pushed to spplus-reg
local image digest    sha256:22f238593023eaf5a706721e5cf6d70fa0658ef2381e40cdb4a369816c3e2a51
registry manifest     sha256:76d25e5ac30bdda4e78e222b9508fdb27508c7a34ebbd026dfd44d5e7d77c974
```
The **VM's booted imageDigest is 22f2385…**, i.e. the VM runs exactly this build. The
**Dell staged 76d25e5a…**, the same image via the registry transport. Same content.

Superseded and reclaimable but **deliberately NOT deleted** (destructive, unasked):
`sp-plus-kde:test48, test48v2, test48v3, test48v4` ≈ 44 GB. `/home` is at 78%, 99 GB free.

---

## 5. IN-FLIGHT / PENDING — THE DELL

**The Dell was updated in place and is now unreachable.** `ping 192.168.1.124` = 100% packet
loss (it answered earlier in the session).

- `bootc switch` to `192.168.1.190:5000/sp-plus-kde:test51` completed, exit 0.
- Staged and **queued for next boot**, digest `sha256:76d25e5a…`. `test47` remains rollback.
- Christopher chose in-place switch + reboot (over reinstall-from-ISO) when asked.
- **Claude did NOT issue the reboot** and told him why: `/dev/sda3` is LUKS with **no clevis,
  no TPM binding** — verified, not assumed — so a reboot halts at the passphrase prompt and
  the machine cannot return on its own. There is no remote console.

**Most likely current state: Christopher rebooted it and it is sitting at the LUKS prompt.**
It will come back on the network once the passphrase is typed at the machine, and will then
be running test51. If it is instead simply powered off, nothing is lost — the deployment is
staged on disk and applies at the next boot either way.

**Fleet constraint worth keeping: the Dell cannot be remotely rebooted unattended.**

---

## 6. THE CURRENT BUG

**There is no open bug blocking work.** Everything found this session was fixed and
committed, or deliberately deferred to Christopher with the reasoning recorded.

The one open *design* question, deliberately not attempted:

**Making the pinned Help icon appear without a sign-in.** `refreshCurrentShell` is out (it
kills plasmashell — see §8). `evaluateScript` is confirmed safe (same plasmashell pid across
a remove/add cycle) and is the viable path, **but it must write THROUGH plasmashell, not the
config file.** While the shell runs, plasmashell's in-memory launcher list and the file
disagree, and plasmashell wins.

*Caveat on that hypothesis, stated as a caveat:* the one attempt to drive it left the panel
showing only Help and dropping Brave/Thunderbird/Dolphin/Writer/Okular until plasmashell was
restarted. The approach is sound in principle; the implementation is unproven and it is a
design change, not a bug fix. **Christopher has not ruled on it.**

---

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **"The Welcome codebase is sloppy."** Refuted. It is dense, deliberate, defect-numbered
   and well-commented. The problem was *duplication that drifted*, not sloppiness.
2. **"Those 16 unused element ids are dead."** Refuted — every one is an
   `aria-labelledby`/`aria-describedby` target. Deleting them strips the accessibility labels.
3. **"`observer`/`onResize` in hero.js are dead."** Refuted — both are used inside `boot()`.
   (`hero.js` no longer has a `requestAnimationFrame` loop at all; the CPU-pinning issue in
   `REFERENCE-HARDWARE-dell.md` is already fixed — it draws one frame per event.)
4. **"help-core.js has dead exports."** Refuted — the four Welcome does not call are used
   internally, and `tokenise` is used by `tests/help-search-coverage.mjs`.
5. **"QtWebEngine coalesces two title assignments in one task."** Refuted by direct
   measurement: **both** are delivered. This is what makes `send()` safe.
6. **"Fin's model output could be an XSS path."** Refuted — it goes through `textContent`.
   Every `innerHTML` sink takes shipped-corpus or hardcoded content.
7. **"The pin-help button is broken."** Refuted — it always wrote and verified the launcher
   correctly. Only the *live refresh* and the *reported message* were wrong.
8. **"The `send()` fix does not fix repeat clicks."** Refuted — that probe contaminated
   itself (its second arm started from a title left stuck by its first). Clean test:
   old protocol 1-of-2 requests, `send()` 2-of-2.
9. **"`refreshCurrentShell` failing was the ~4% churn segfault."** Refuted — it killed
   plasmashell **3 of 3**, deterministically, returning exit 0 each time.
10. **The unreproducible `30 passed / 1 failed` config-preflight in the previous handoff.**
    Almost certainly **`git tree is dirty`** — it is one of the 31 checks. A dirty tree fails
    and a clean re-run passes, which is exactly what was observed and never explained.

---

## 8. DECISIONS / RULINGS THIS SESSION

- **Christopher: in-place `bootc switch` + reboot for the Dell**, not reinstall-from-ISO.
- **Christopher: the new test VM is built from today's ISO** and is the gating environment.
- **Claude's call, with reasoning recorded in the helper:** the pin helper **must not** ask
  plasmashell for a live reload. Losing the whole task bar is far worse for an advisor than
  an icon that arrives at the next sign-in.
- **Claude's call:** did not delete ~44 GB of superseded podman images, and did not reboot
  the Dell — both destructive/irreversible and not requested.

---

## 9. LEDGER STATE — WHAT IS COMMITTED

All committed on `session/sp-plus-plan`, tree CLEAN:

| Commit | What |
|---|---|
| `5194dc4` | PIN YOUR HELP proven; qdbus6→no-refresh; Welcome reports the helper's own message; cycle36 gate updated |
| `7b6ced6` | Welcome: one worker lifecycle, one page→shell channel, dead code out (−92 lines) |
| `3bdf319` | ISO build fix: create `/etc/brave/policies/managed` before writing the policy |

**Nothing is written-but-uncommitted.** This RESUME document is the only new file.

---

## 10. NEXT ACTIONS, IN ORDER

1. **Ask Christopher for the next cleanup task.** He said "then we will work on the next
   coding clean up" — it has not been named. Do not invent one.
2. **Check whether the Dell came back** (`ping 192.168.1.124`, then
   `ssh -i /root/.ssh/spplus-test test@192.168.1.124 'sudo -n bootc status'`). If it is up,
   confirm it booted `test51` and that its rollback is `test47`.
3. **Put the evaluateScript question to Christopher** (§6) — his call, not Claude's.
4. **Re-add the VM's port forward if the VM was restarted** (§2). Nothing reaches it otherwise.
5. **Run `theme-fidelity-gate.sh` and `theme-wallpaper-roundtrip.sh`** on the new VM — neither
   has been run against this image (~10 min).
6. **`ghcr.io/secureprospective/sp-plus-kde:latest` is still stale.** Confirmed live this
   session: the VM's image *reference* is ghcr `:latest` while its content is today's build,
   so an update from ghcr would move it BACKWARDS. This is ISO-44-QUEUE item 2 and is open.

---

## 11. HONEST STATUS

**Proven, with evidence in hand:** the Brave policy fix on a real install; the Welcome
worker-lifecycle and `send()` refactor (8/8 gates, self-test, mutation-tested both
directions, baselined against unmodified source first); the PIN YOUR HELP button, watched
pinning with before/after screenshots and confirmed idempotent.

**Not proven:** the Dell has never booted test51 — it is staged only, and the machine is
currently down. `theme-fidelity` and `theme-wallpaper-roundtrip` have not been run against
this image. The plasmashell churn segfault is still untested on real hardware. Brave issue
\#45106 (Rewards/Wallet/AI Chat surviving policy) still needs a human at `brave://policy`;
the policy *file* is correct, which is a different claim.

**Known-fragile:** the VM's port 2222 forward is live-only and dies with the VM.

**Two mistakes made and corrected this session, recorded so they are not repeated:** a first
"unused id" sweep would have deleted 16 accessibility bindings; and driving `evaluateScript`
against the config file left the VM's panel missing five launchers until plasmashell was
restarted. Both were caught, both were fixed, the VM is in a good state — all six launchers
present including Help.
