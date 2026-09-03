# SP+ RESUME — compact #3, 2026-09-03 ~17:00 CDT
Written by compact-safe. **The session CONTINUES.** Resume at NEXT ACTIONS item 1.

## 1. WHAT WE ARE DOING
Stress-testing SP+ (immutable KDE/Fedora-bootc advisor OS) for its FIRST PUBLIC RELEASE.
Loop until a clean ISO lands in `~/Downloads` for a fresh install on the Dell.

- Repo (BEELINK IS ACTIVE): `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- Branch `session/sp-plus-plan` · project dir `projects/sp-plus`
- SSH Beelink: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`
- SSH the test VM FROM the Beelink:
  `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 test@127.0.0.1`
- **Beelink is CDT, VM clock is EDT — one hour apart, same moment. Do not re-flag it.**

## 2. IN-FLIGHT WORK  ← MOST PERISHABLE
**RC1e ISO BUILD IS RUNNING.** Started ~16:45 CDT. Takes ~25 min.
- Driver: `/tmp/rc1e.sh` (pid was 719223) -> `~/fleet/bin/sp-plus-iso-build.sh`
- Stamp: `SPPLUS_BUILD=20260903b` (RC1d used `20260903`; two builds, same day)
- Log: `~/logs/sp-plus-iso-rc1e.log`
- Alive?  `pgrep -af "rc1e.sh|podman build" | grep -v "bash -c"`
- Done?   `grep -E "ADVISOR_TOOLKIT_OK|PWA_GATE_OK|Image build successful" ~/logs/sp-plus-iso-rc1e.log`
- **183 steps, not 174** — the 9 extra are the new toolkit+PWA blocks. If a build ever
  shows 174 again, the new content is NOT in it.
- Output path (OVERWRITTEN EVERY BUILD):
  `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`
- Watch: one transient `Curl error (56)` to mirrors.fedoraproject.org at step ~14. dnf
  retried. If it recurs on a package step the build FAILS — it does not half-ship.
- **DO NOT `podman prune` while this runs.** Storage reaping was deliberately SKIPPED
  this compact for that reason.

VM `spplus-test`: **shut off**, is the RC1c install, CONTAMINATED by my manual edits
(hand-injected ssh keys, a left-open Konsole, 2 coredumps I created). It is due to be
destroyed and replaced by the RC1e install — NEXT ACTION 3. Nothing in it is precious.

Background waiter `bm150dn0w` polls the build; it may not survive compaction. The
`pgrep`/`grep` commands above are the real check.

## 3. AGENTS + HARNESSES
- `~/fleet/bin/sp-plus-iso-build.sh` — THE sanctioned build path. **NOW takes
  `SPPLUS_BUILD=<date>`** and verifies the stamp landed in the built image.
- `~/fleet/bin/spplus-testvm.sh install <iso> [name]` | `up` | `down` | `nuke` | `info`
  **PATCHED TODAY** to install the operator key by `%post` instead of `sshkey`.
- `~/fleet/bin/run-bee.sh <fid>` — keeps a per-dispatch transcript (fixed today).
- `~/fleet/bin/vmshot` (PNG of VM screen) · `vmtype` · `vmunlock spplustest`
- `~/fleet/bin` is a git repo and IS backed up to CT105.

### VM CONSOLE — READ THIS BEFORE USING vmtype
- **`vmtype tty` / `login` / `run` DO NOT WORK on a graphical session.** Ctrl+Alt+F2 is
  swallowed by Plasma/Wayland. `vmtype run` prints "ran on VT2" which is an ECHO, NOT
  EVIDENCE. Verified: screen never left Plasma.
- **Plain keystrokes DO reach the guest** (`vmtype text|line`, `vmtype key KEY_ENTER`).
  LUKS unlock and greeter login both work this way.
- **The working back door is Konsole:** `virsh send-key ... KEY_LEFTMETA`, then
  `vmtype text "konsole"`, then `KEY_ENTER`, then drive with `vmtype line "..."` and read
  with `vmshot`.
- **`vmtype` has NO KEYCODE FOR `~`.** Use `$HOME`. It silently drops the character.
- `vmtype key` needs `KEY_ENTER`, not `enter`.

## 4. GATES / STATUS
| Item | State |
|---|---|
| RC1e build | **RUNNING** |
| ADVISOR_TOOLKIT_OK / PWA_GATE_OK (new) | unproven — first build |
| STORE_GATE_OK · UPDATE_LANE_GATE_OK | PASS in RC1c and RC1d |
| config-preflight.sh | 32 passed / 0 failed on a clean tree |
| Filing gate | PASS, 23 entries |
| Operator-key `%post` | mechanism proven on a booted VM; **%post path NOT yet proven** |
| Welcome busy-close | **CONFIRMED FIXED by Christopher on real SP+** |
| Discover A1–A6 | **PASS** (A5 + A6 confirmed by Christopher) |
| Brave | **PASS** (Christopher) |
| Idle RAM, clean fresh boot, nothing open | **1.34 GB** vs 1536 MiB target — PASS |

## 5. ARTIFACTS
`~/Downloads` (Christopher's keepers — never delete `20260901`, `test55`, `test56`):
- `sp-plus-1.0-rc1c-20260903.iso` 5,549,893,632 B
  sha256 `5820a728efef90c47d62ad38c1f45dec57791b0a658fa591eff8d448c4d56c65`
- `sp-plus-1.0-rc1d-20260903.iso` 5,549,885,440 B
  sha256 `18ed80b27feaddbc5edb60734ac37c40d7fe28532931ceb715426df6822dab97`
- RC1e: **not yet copied.** Copy to `~/Downloads/sp-plus-1.0-rc1e-20260903.iso`.
Screenshots proving the PWA verification: `~/logs/sp-plus/testvm/shots/shot-20260903T2134*.png`
(Teams sign-in) and `shot-20260903T213636Z.png` (Schwab, chromeless).

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
1. **"Discover crashed 3 times = instability"** — REFUTED. All three coredumps are
   `plasma-discover --help`/`--version` aborting via `QMessageLogger::fatal` because there
   is no display over SSH. `QT_QPA_PLATFORM=offscreen plasma-discover --version` -> rc 0,
   "discover 6.7.4". **TWO OF THE THREE COREDUMPS ARE MINE**, from reproducing it. Stock
   upstream Qt behaviour. Discover's GUI never crashed.
2. **"Teams does not work on SP+"** — REFUTED. curl gets redirected to
   `/v2/unsupported-browser#isLinux=true`, but real Brave reaches the normal Microsoft
   sign-in page. Microsoft gates on user-agent + JS. **Trusting curl would have dropped a
   working app from the release.**
3. **"Schwab URL is broken (403)"** — REFUTED. Akamai bot protection rejects curl. In Brave
   it loads the Log In page, chromeless, screenshotted.
4. **"1.5 GB RAM target is barely reachable"** — REFUTED. That came from Bee-1 measuring the
   LOGIN GREETER. Clean logged-in fresh boot = **1.34 GB**. Comfortably inside.
5. **"Welcome leaks ~767 MB"** — that was an RSS UPPER BOUND (WebEngine shares memory).
   Real delta ≈ 373 MB. Welcome autostarts on FIRST login only.
6. **"Apps leak memory after close (1.34 -> 1.65 GB)"** — REFUTED as dirty code. Brave, Zoom
   and Discover all exited with ZERO processes left. The rise is plasmashell (563 MB) and
   kwin (279 MB) not returning heap, flatpak d-bus helpers staying resident by design, and
   ~105 MB of MY OWN left-open Konsole. `available` was 6,224 MB.
7. **"VLC needs RPM Fusion"** — REFUTED. `vlc 1:3.0.23-10.fc44` is in Fedora proper on 44.
8. **"BUILD_ID=dev is a config bug"** — REFUTED. The default is deliberate. The real defect
   was that `sp-plus-iso-build.sh` never passed the build-arg AT ALL.
9. Earlier refutations still standing: rpm-ostree cannot be removed (bootc needs ostree);
   `spplus-update-notify.timer` is a USER unit (querying system scope shows nothing);
   normal-user `flatpak install` "failure" was just no polkit agent over SSH.

## 7. DECISIONS (Christopher, today)
- Crash reporter **must point somewhere real before release** -> `/contact` (the only page
  that resolves; `/support` is 404). Move back to `/support` if that page is ever built.
- **Add** PWAs: Google Messages/Photos/Maps, Microsoft Teams, Schwab Advisor Center,
  Fidelity Wealthscape. Plus VLC, Joplin, Liberation fonts, unzip/p7zip/curl/wget/git/jq,
  KVM/QEMU/virt-manager/libvirt.
  URLs he supplied and confirmed: `https://advisorservices.schwab.com/advisor/login`,
  `https://www.wealthscape.com/`, `https://teams.microsoft.com/`.
- **He tests the new apps himself; do NOT assign them to Bee.**
- "If Joplin fails or I hate the new way, we will kill it on the next ISO." Removal cost:
  one file + two gate lines. NOTE: machines already installed KEEP it (preinstall runs at
  first boot); removing from a later image does not uninstall it.
- Stop Bee-2 early; wall clock matters. **Do not burn wall clock.**
- Earlier standing rulings unchanged: keep sshd key-only, key from the INSTALLER not skel
  (D-1); podman prune dangling-only, rootful, AFTER a build; all agent work happens in the
  VM, never on the Beelink.

## 8. LEDGER STATE — all committed, both trees clean
advisor-os (`session/sp-plus-plan`):
- `96a5209` store gate sweeps whole plugin tree + notifier removed
- `9946a6f` Welcome drain/close fix
- `7f2368d` operator-key overlay actually installs a key (`sshkey` is a silent no-op)
- `a95f22b` os-release URLs -> `/contact`
- `a1c735b` advisor toolkit + six PWA launchers + Joplin
fleet/bin:
- `9e1c02b` initial repo · `32a8f98` iso-build stamps BUILD_ID and proves it landed
- **spplus-testvm.sh %post key patch is NOT YET COMMITTED** (edited during the build).

## 9. NEXT ACTIONS, IN ORDER
1. **Wait for RC1e**, then confirm `ADVISOR_TOOLKIT_OK`, `PWA_GATE_OK`,
   `STORE_GATE_OK`, `UPDATE_LANE_GATE_OK`, `Image build successful` in the log.
2. **Verify the payload in the IMAGE, not the log:**
   `sudo -n podman run --rm --entrypoint /bin/sh localhost/sp-plus-kde:spike -c ". /usr/lib/os-release; echo \$PRETTY_NAME; ls /usr/share/applications/org.secureprospective.spplus.*.desktop; rpm -q vlc git 7zip virt-manager"`
   Expect `SP+ 1 (20260903b)` and six PWA desktop files.
3. **Copy to `~/Downloads/sp-plus-1.0-rc1e-20260903.iso`**, record sha256 + byte size.
4. **`~/fleet/bin/spplus-testvm.sh nuke spplus-test`**, then `install <the RC1e iso> spplus-test`.
   ~7 min; ends POWERED OFF by the `poweroff` delta (do not "fix" that — without it a second
   unattended install destroys the first).
5. **Boot it.** LUKS is GRAPHICAL: `~/fleet/bin/vmunlock spplustest`. Then log in at the
   greeter with `vmtype line "testtest"` (user `test` is preselected).
6. **PROVE `7f2368d`:** ssh in with NO hand-injected key. If it works, the `%post` overlay
   is proven end to end. If it fails, `/etc/ssh/authorized_keys.d/test` and
   `sshd -T | grep -i authorizedkeysfile` are the two things to look at.
7. **Commit the spplus-testvm.sh patch** in `~/fleet/bin`.
8. **Hand the VM to Christopher to test the new apps.** Tell him Joplin arrives AFTER first
   login via the preinstall timer, not from the image.
9. Then: helpapp duplicate tracebacks; `flatpak update` exits 0 while printing errors;
   `SuccessExitStatus=0 1`; boot errors at `err` priority.
10. Open rulings still unanswered: the PoC `projects/sp-plus/Containerfile` (creates account
    `advisor`, password `advisor-poc`) — delete or relocate? `CLAUDE.md` says "14 repos",
    it is now 16. Build `/support` on the site?
11. Install the final ISO on the Dell.

## 10. ENVIRONMENT NOTES
- **Never nest ssh heredocs.** Write a script locally, `scp` it, run it. Violated twice
  before; it mangles git commit messages and dies on unmatched quotes. Commit messages go
  via `scp` + `git commit -F`.
- `pgrep -f "podman build"` **matches your own `bash -c` wrapper.** Always
  `| grep -v "bash -c"`. Same false-positive class as matching a `timeout` wrapper.
- **Do not reproduce a crash on a machine an agent is measuring** — I added 2 coredumps to
  the QA VM and nearly fed Bee a false finding.

## 11. HONEST STATUS
Everything advisor-facing that we set out to test today is GREEN, and most of it was
confirmed by Christopher on a booted system rather than by me on a harness: Discover opens,
installs, launches, removes, and offers NO OS update (A6 — the check the whole RC1c existed
for); Brave passes; Welcome closes clean; the update path works; idle RAM 1.34 GB.

**What is NOT proven:** the `%post` operator-key path has never survived an actual install —
only the mechanism was proven, on an already-booted machine. The six PWAs, VLC, the KVM
stack and Joplin have NEVER been built, let alone run; RC1e is their first build and its two
new gates have never executed. RC1d was built and verified in the image but **never
installed or booted.** Joplin's Flathub ID is verified but its preinstall has never run.

Nothing has been installed on the Dell.
