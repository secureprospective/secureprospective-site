# SP+ RESUME — release-readiness stress test (compact-safe)
Written 2026-09-03 ~13:37 local (17:37Z+). **Session CONTINUES after compaction.**

## 1. WHAT WE ARE DOING
Stress-testing SP+ for the **first public release**. Two motions in parallel:
**Motion 1 (Tom)** — fix the installer/image so applications install cleanly against the
update profile. **Motion 2 (Bee, gpt-5.6-luna)** — test the system update lane, Discover and
the Flatpak store in a VM until flawless. Loop: Tom fixes -> rebuild ISO -> fresh VM -> Bee
verifies -> repeat. Good ISO lands in `~/Downloads` for a fresh Dell install.

- Repo: `chris@192.168.1.190:~/work/secureprospective-advisor-os` (**Beelink = ACTIVE**)
- Branch: `session/sp-plus-plan`, tree CLEAN (0 modified)
- SSH: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- SP+ project root: `projects/sp-plus/`

## 2. CHRISTOPHER'S RULINGS THIS SESSION — do not relitigate
1. **Default VM storage moved to `/QEMU`** on the root disk (`/`, 335G free). Pools repointed:
   `default`->`/QEMU/images`, `ISO`->`/QEMU/iso`, plus `templates`/`scratch`/`exports`, `QEMU`.
2. **Update profile = the in-tree `spplus-update-*` subsystem.** `spplus-update-control` is the
   ONE OS-update lane (one JSON object on stdout ALWAYS, incl. failure; status/check/stage/apply;
   timestamp-guarded, digest-keyed). Discover's rpm-ostree backend is DELETED on purpose;
   Discover keeps applications + firmware only.
3. **Keep sshd, key-only auth. Christopher's key comes from the INSTALLER, never `/etc/skel`.**
   Release ISO ships NO key anywhere (assumption stated + accepted: key arrives via a separate
   kickstart overlay `installer/operator-key.ks.example`, not the public kickstart).
4. **A manual update must complete with ZERO errors; Discover + Flatpak must be flawless.**
   Bar is "flawless user experience", not "works".
5. **Bee must watch notifications** — crash reports land there.
6. **All Bee work happens INSIDE the VM.** gpt-on-pi drifts to the host. Now HARNESS-ENFORCED.
7. **NEW TARGET: idle RAM ~1.5 GB or less** out of the box (old advisor PCs). MEASURE now,
   act after the release blockers. Bee-1 section E does the measuring.
8. **Storage hygiene:** dangling-prune first, then targeted deletion of old tagged images.
   Keep all known-good rollback ISOs. `sp-plus-2026-09-01-0721.iso` deleted (not a rollback).
9. **Accepted Tom's pushback**: `SuccessExitStatus=0 1` STAYS on the flatpak UPDATE unit
   (alarm fatigue); it was removed only from the PREINSTALL unit. Do not "fix" this.

## 3. IN-FLIGHT RIGHT NOW — most perishable, check these FIRST
### (a) ISO build RC1 — pid 245475, started 13:29:03 local
- Command: `~/fleet/bin/sp-plus-iso-build.sh` (the SINGLE SANCTIONED path, DN-06 rootful)
- Log: `~/logs/sp-plus-iso-rc1.log`  ·  Output dir: `projects/sp-plus/artifacts/spikeB-rootful/out`
- Alive? `ps -p 245475` or `pgrep -f sp-plus-iso-build`
- Progress? `grep -E "^=== STEP|^STEP [0-9]+/" ~/logs/sp-plus-iso-rc1.log | tail -3`
- Was at STEP 87/174 of STEP 0 (payload container). THREE stages total:
  STEP 0 payload -> STEP 1 installer container -> STEP 3 image-builder ISO assembly.
- Pre-build gate already PASSED 10/10 (incl. "no private key material in installer definition").
- **When it finishes:** the ISO appears under that `out/` dir. It is NOT auto-named or moved.
  Copy it to `~/Downloads/sp-plus-1.0-rc1-20260903.iso`, record sha256 + size.
- **If it died:** just re-run the same script. It is idempotent and re-runnable.

### (b) Bee-1 QA dispatch — pid 199002, started 13:09:59 local, timeout 5400s (ends ~14:40)
- Brief: `~/.pi/agent/bee-spplus-lanes-20260903.md`
- Output: `~/.pi/agent/bee-spplus-lanes-20260903.{out,err,sentinel}`
- Alive? `pgrep -f "pi -p --provider"` · Done? `cat ...sentinel` (PROMOTED/REJECTED + bytes)
- Evidence it was really working: 45+ `Accepted` sshd logins inside the VM.
- ⚠️ **`run-bee.sh` uses `--no-session`, so THERE IS NO SESSION TRANSCRIPT to recover.**
  If it dies, its reasoning is GONE — re-dispatch is the only recovery.
- Auto-reject rule: output <1500 bytes or starting `<tool_call>` = REJECTED, do not trust it.

### (c) The test VM — `spplus-test`, RUNNING
- Disk `/QEMU/images/spplus-test.qcow2` (19.8 GB), installed from **test56**.
- `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 test@127.0.0.1`
  (user `test`, key auth via `~/.ssh/spvm.pub`, passwordless sudo, password `testtest`)
- LUKS passphrase `spplustest`. **Every boot needs it typed on the GRAPHICAL console.**

## 4. HARNESSES BUILT/FIXED TODAY — all in `~/fleet/bin/`
| Tool | What it does |
|---|---|
| `spplus-testvm.sh` | `install/up/down/nuke/info` — PERSISTENT QA VM on `/QEMU/images` |
| `vmunlock [pass]` | Types LUKS passphrase on the **graphical** console (`virsh send-key`) |
| `vmtype` | Console driver: `text/line/key/tty/login/run` — the back door when networking is off |
| `vmshot [label]` | `virsh screenshot` -> PNG, host-side, opens NO window. Bee's vision. |
| `tom-run.sh <brief> <tag> [tools] [timeout]` | GENERIC Tom dispatch, replaces `run-tom-*.sh` sprawl |
| `run-bee.sh <fid>` | Bee dispatch; NOW appends VM-ONLY + NO-GUI harness constraints |
| `sp-plus-iso-build.sh` | Pre-existing, sanctioned ISO build (rootful) |

**View a screenshot:** `pi @/path/shot.png "what is on screen?"` — `pi` takes images natively.

## 5. ARTIFACTS THAT EXIST AND WORK
- `~/Downloads/sp-plus-1.0-test56-20260902.iso` 5,549,975,552 B — CURRENT baseline, VM built from it
- `~/Downloads/sp-plus-1.0-test55-20260902.iso` 5,655,955,456 B — known-good rollback
- `~/Downloads/sp-plus-1.0-20260901.iso`        5,619,464,192 B — known-good rollback
- Podman rootless `localhost/sp-plus-kde:test56` — **KEPT DELIBERATELY** as the Brave bisect
  baseline. Do not delete; Tom's Brave pin only has value if this survives to compare against.
- Podman rootless `localhost/sp-plus-kde:d1d4-impl` — Tom's verified build of the 5 fixes.

## 6. COMMITTED (branch `session/sp-plus-plan`, tree clean)
```
aa85dd7 tests: unstale the cycle36 store-backend gate
2317269 D-8: delete the divergent dead Brave policy file
c5a8936 D-4: move the store gate downstream of the last dnf install
1e745ab D-3: make the application lane fail loudly, retry, and be observable
723edeb D-2/C-1/D-6: pin Brave to an exact NEVRA, vendor its repo, and stop shipping it
ea71055 D-1: stop shipping an SSH key; keep sshd and make it key-only
```
Build of that tree: **PASS 174/174**. Four gates PROVED by deliberately violating them
(reintroduced the skel key -> build aborted; flipped sshd to password auth -> aborted;
`BRAVE_VERSION=1.94` -> pin gate aborted; planted `rpm-ostree-backend.so` AFTER the last dnf ->
store gate aborted at step 174, which its OLD position structurally could not catch).
**Brave pinned: `brave-browser-1.94.119-1.x86_64`.**

NOT committed / NOT done: nothing outstanding in the repo. `~/fleet/bin/*` is NOT a git repo —
today's harness work lives only on disk there.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
**Brave network hang** (`file://` instant, ALL network URLs hang forever, `curl` HTTP 200 in
0.12s). Refuted with evidence, do not revisit: TLS (plain http hangs too), DNS-over-HTTPS, QUIC,
IPv6 default route, proxy autodetection, Chromium sandbox (`--no-sandbox`).
Tom additionally refuted from the install side: the live Brave policy (written at Containerfile
2055-2080, NOT from the dead `config/brave-policies.json`) has NO `URLBlocklist`/`Proxy*`/
`DnsOverHttps` keys; no runtime dependency is missing; no network unit is disabled;
`wifi.powersave=2` DISABLES powersave (helpful direction).
**Still live and untested:** `/opt` -> `/usr/lib/opt` (Containerfile:66) puts Brave's binaries
under a type no upstream SELinux rule targets, and nothing relabels it. Settle with
`ls -Z`, `ausearch -m AVC -ts recent`, then `setenforce 0` + reload a network URL.
Tom's read (NOT a conclusion): symptom shape = wedged out-of-process network service, since
`file://` is served in the browser process — consistent with everything refuted.

**Install-time performance** (from the earlier campaign, still true): image size, OCI
compression, and more vCPUs are all measured-dead levers. Noise floor ~33s; 3 runs + median.

**Storage:** `podman image prune` (dangling-only) recovers ~nothing here — the space is in
TAGGED build history. Targeted `podman rmi` by name is what works.

## 8. BUGS I HIT AND FIXED — do not re-walk
1. **Install destroyed itself.** Anaconda stopped at "Press ENTER to quit", the VM rebooted with
   ISO+OEMDRV still attached, began a SECOND unattended install, and `zerombr`/`clearpart`
   re-partitioned the disk over the good install (ESP GUID changed dbffd483 -> 2c88529a; VM fell
   to the UEFI shell with no FS). FIX: `poweroff` in the generated kickstart. Already applied.
2. **LUKS is a GRAPHICAL prompt, not serial.** Feeding the serial pty types into nothing.
   FIX: `vmunlock` (send-key). **Folded into `spplus-bench.sh` too** — this is almost certainly
   the HANDOFF's "boot leg hangs at the LUKS prompt and burns BOOT_TIMEOUT (900s)".
   Backup: `~/fleet/bin/spplus-bench.sh.bak-20260903`. Tom's pty-drainer fix PRESERVED.
   ⚠️ UNVERIFIED: `send-key` against a `--graphics none` domain (bench uses that). Check first
   if the bench boot leg still times out. Deliberately did NOT add a video device to bench —
   that would change the measured config and invalidate existing install-time numbers.
3. **`portForward` needs the passt backend.** Plain `<interface type='user'>` is refused:
   "can only be used with the 'passt' backend". passt IS installed. Survives reboots, unlike
   the `hostfwd_add` monitor trick.
4. **bash trap, hit TWICE:** `local a="$1" b="$a/x"` — bash creates ALL names unset first, THEN
   assigns, so `$a` is unbound under `set -u`. Split the declaration.
5. **`pkill -f "spplus-testvm.sh install"` killed its own ssh session** (the pattern matched the
   wrapper's own command line). Use a bracket pattern.
6. **My Bee-1 brief locked Bee out of the VM** — B4/C9 tell it to `nmcli networking off`, over
   the very network its ssh uses. Recovered with `vmtype run test testtest "sudo nmcli
   networking on"`. **Bee-1's brief ALSO self-contradicts:** section E0 says reboot, RULES say
   do not reboot. FIX BOTH BEFORE RE-DISPATCHING.
7. **Tom backgrounded the ISO build and returned** ("Waiting for the build to finish", 33 bytes,
   auto-REJECTED correctly). Long builds must run in the FOREGROUND, or be run directly.

## 9. OPEN ITEMS NEEDING CHRISTOPHER
- **PoC Containerfile** `projects/sp-plus/Containerfile` (NOT the release path, still reachable
  from `scripts/build-qcow2.sh`) creates account `advisor` with known password `advisor-poc`,
  unpinned-curls Brave, targets Fedora 43. Tom stopped and reported per brief. Delete, or move
  under a marked `poc/`? **Not ruled on.**
- **Deferred, real, not blockers:** D-5 (Pi's npm tree unpinned under an exact top-level pin;
  install scripts run as root at build) and D-9 (starship + pi unowned by rpm, on no update lane,
  fetched from GitHub at build time — a CVE in either is invisible to every tool on the machine).
- **Rootful podman store**: ~42.5 GB reclaimable (test48/v2/v3/v4, cycle31, spb-*). NOT cleaned —
  the ISO build is writing to that store. Do it AFTER the build.

## 10. STATUS TABLE
| Item | State |
|---|---|
| Motion 1 blockers (D-1,2,3,4,8) | ✅ committed, build PASS 174/174, gates proved |
| cycle36 stale preflight gate | ✅ fixed (aa85dd7) |
| RC1 ISO | ⏳ building, step 87/174 of stage 1 of 3 |
| Bee-1 (update lane, flatpak, crashes, idle RAM) | ⏳ running, no output yet |
| Bee-2 (Discover GUI, Brave, notifications) | 📋 staged at `~/.pi/agent/bee-spplus-desktop-20260903.md`, needs the RC1 VM |
| Idle-RAM 1.5 GB target | ⏳ being measured by Bee-1 §E |
| 4 GiB-constrained RAM confirm run | ❌ not started (VM has 8 GiB; Linux caches more when it can) |
| `/home` hygiene | ✅ 78% -> 73%, 120 GB free |
| Rootful podman hygiene | ❌ deferred until build ends |

## 11. NEXT ACTIONS, IN ORDER
1. **Check the ISO build** (§3a). If finished: locate the ISO in `artifacts/spikeB-rootful/out`,
   copy to `~/Downloads/sp-plus-1.0-rc1-20260903.iso`, record sha256 + byte size.
   Verify the payload really carries the fixes (no `/etc/skel/.ssh/authorized_keys`,
   Brave 1.94.119-1, no `/etc/yum.repos.d/brave-browser.repo`) — inspect the IMAGE, not the source.
2. **Collect Bee-1** (§3b). Read the sentinel first; reject thin output. Report the idle-RAM
   number vs the 1.5 GB target and whether S-1 (silent flatpak failure) is CONFIRMED or REFUTED.
3. **Fix Bee-1's brief** before any re-dispatch: remove the E0-reboot / RULES-no-reboot
   contradiction, and give it `vmunlock`/`vmtype` so a networking-off test cannot lock it out.
4. **Prune rootful podman** (dangling first, then old tagged test48*/cycle31/spb-*), once the
   build is done.
5. **Nuke the old test VM and install the RC1 one:**
   `~/fleet/bin/spplus-testvm.sh nuke spplus-test` then
   `~/fleet/bin/spplus-testvm.sh install ~/Downloads/sp-plus-1.0-rc1-20260903.iso spplus-test`
   then `~/fleet/bin/spplus-testvm.sh up` + `~/fleet/bin/vmunlock spplustest`.
6. **Dispatch Bee-2** against the RC1 VM: `~/fleet/bin/run-bee.sh spplus-desktop-20260903`.
7. Loop until clean. Then the good ISO stays in `~/Downloads` for the Dell.

## 12. HONEST STATUS
The five release blockers are **fixed, committed and gate-proved** — that part is solid and
independently verified (I re-read the shipped-key block and the flatpak units myself).
**Nothing has yet been tested on a fixed build.** The RC1 ISO does not exist yet; every QA
result so far describes **test56**, which is the OLD build. Bee-1 has produced zero output —
it is provably doing work (45 sshd logins) but its findings are unread and unverified.
The 1.5 GB RAM figure is UNMEASURED as of this writing.
Brave is NOT root-caused and the pin changes the baseline: RC1 ships 1.94.119, test56 shipped
something unrecorded, so a Brave result on RC1 is not directly comparable to one on test56.
