# SP+ RESUME — compact #4, 2026-09-04

## 1. WHAT WE ARE DOING

SP+ is an immutable KDE / Fedora-bootc "advisor OS" heading for its **first public release** on
a Dell laptop. This session took delivery of RC1e, ran a full pre-release security audit, and
fixed everything that audit and Christopher's own testing turned up. **The next action is to
build RC1f** — nothing is in flight.

- Repo: `~/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190), branch
  `session/sp-plus-plan`. CT105 reaches it with `ssh -i /root/.ssh/beelink chris@192.168.1.190`.
- Build script: `~/fleet/bin/sp-plus-iso-build.sh` (own git repo at `~/fleet/bin`, HEAD `b3f41c8`).
- Test VM harness: `~/fleet/bin/spplus-testvm.sh`.

## 2. NOTHING IS IN FLIGHT

No build, no dispatch, no install is running. Verified with
`pgrep -af "rc1e.sh|podman build|tom-run.sh|claude -p|spplus-testvm.sh"` → empty.

**`spplus-test` VM is RUNNING but is CONTAMINATED — rebuild it, do not trust it.** It carries
three coredumps I created (`kcmshell6 --list`, two `kioclient stat`), a hand-edited task-bar
launcher list written through `evaluateScript`, and a Konsole-free but otherwise poked desktop.
It is not a clean surface for RC1f testing.

⚠️ **DO NOT RUN GUI TOOLS ON THAT VM OVER SSH.** Three times this session a stock KDE binary
(`kcmshell6`, `kioclient`) aborted under Qt for want of a display, dumped core, and raised a
crash notification on Christopher's screen that he then opened and reported as a product defect.
Read the `.desktop` file or inspect the container image instead. The container is free:
`sudo -n podman run --rm --entrypoint /bin/bash localhost/sp-plus-kde:spike -c '<cmd>'`.

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `tests/config-preflight.sh` | **33 passed, 0 failed — "Safe to build."** at `ab48977` |
| `tests/welcome-tools-source-gate.sh` | PASS |
| `tests/runtime-posture-gate.sh` | **NEW.** 11 FAIL / 7 PASS against RC1e — that is the "before" picture; it must go green on RC1f |
| Tom's security audit | Delivered, 48,186 bytes, committed |

## 4. ARTIFACTS THAT EXIST

- `~/Downloads/sp-plus-1.0-rc1e-20260903.iso` — 5,683,083,264 bytes,
  sha256 `ce8cdd1ce4954b22f694af555af12a4e82127199993e39efdbeef158d01f702b`, bootiso digest
  `87a5fe8c6f33266e4baa848968d33c864ddf464616426b9c9b848917b56b053e`.
- Keep also: `test55`, `test56`, `sp-plus-1.0-20260901.iso`, `rc1c`, `rc1d` (Christopher's list).
- Images: `localhost/sp-plus-kde:spike` (11.7 GB) and `localhost/sp-plus-installer:latest`, in the
  **ROOTFUL** podman store — rootless will not see them.
- Audit: `projects/sp-plus/docs/ledger/AUDIT-security-2026-09-03.md`.

## 5. COMMITS THIS SESSION (advisor-os, all on `session/sp-plus-plan`)

| Commit | What |
|---|---|
| `a5f1b00` | installer SUPPORT_URL/BUG_REPORT_URL/.buildstamp BugURL → `/contact` (3 copies, not 1) |
| `ac6ba53` | TODO T-17 (installer sidebar) + T-18 (rebranding loop overwrites by path, not type) |
| `7a4981a` | Brave stops asking to be default; dropped Joplin |
| `93a367f` | **Reverted the Joplin removal — Joplin STAYS** (Christopher reversed it) |
| `38f00d9` | Tom's security audit into the ledger |
| `8d17891` | The four security blockers closed + `tests/runtime-posture-gate.sh` |
| `690d5d3` | Brave password manager ON + keyring wiring + crash reports to SP+ + display button + Bitwarden recommended |
| `ae43a50` | pin-help writes through plasmashell (superseded next commit, kept for history) |
| `ab48977` | **PIN YOUR HELP button removed entirely** |

`~/fleet/bin` `b3f41c8`: testvm kickstart writes the operator key via `%post`.

Both repos **clean**. Nothing uncommitted.

## 6. THE SECURITY AUDIT — what was fixed, what was NOT

Tom (Claude Opus, `~/fleet/bin/tom-run.sh`, brief at
`~/fleet/briefs/tom-spplus-security-2026-09-03.md`) returned **0 CRITICAL, 4 HIGH, 5 MEDIUM,
3 LOW**, and found **no embedded secret, key or token** — that check was run hard and came back
clean.

**All four HIGH are fixed in `8d17891`:**
1. Root command injection in `spplus-stage-update` — `eval` on registry-derived text. `json.dumps`
   does not escape `$` or backticks; a payload of `$(id -u)` executed as root on a timer. Now
   NUL-delimited and read straight into variables. **Proven closed**: the same payload survives as
   literal text.
2. firewalld `DefaultZone` FedoraWorkstation → `public`. The old default accepted inbound tcp AND
   udp 1025-65535.
3. `smb.service`/`nmb.service` **masked**. The wsdd drop-in's empty `BindsTo=` never took: smb read
   `disabled` and ran anyway, smbd on 0.0.0.0:139 and :445 serving a read-write `[homes]` share.
4. KDE Connect D-Bus activation file removed — deleting the autostart never stopped it.

**The finding that matters most is structural:** build gates assert SOURCE TEXT, not effect.
`grep -q '^BindsTo=$' <file>` passed on every build while the control failed. **Every
grep-the-source gate in this build is suspect.** `tests/runtime-posture-gate.sh` is the answer and
must be run against RC1f.

**NOT fixed, needs Christopher's ruling:**
- **M-1 `spplus-grant-admin`** grants passwordless root to EVERY uid ≥ 1000 account on EVERY boot,
  so de-privileging is impossible — remove someone from `wheel` and the next power-on undoes it.
  The decision (advisor is admin) is sanctioned; the implementation is broader than the decision.
- **M-2** no ISO signature, no signed checksum, no SBOM. Not blocking for the Dell; blocking for
  public download.
- M-3 libvirt/iSCSI stack enabled; M-5 the gate class above; L-1 sshd X11/TCP forwarding;
  L-2 LUKS passphrase-only, no TPM2; L-3 subsumed by the smb fix.

## 7. DECISIONS THIS SESSION

- **Brave password manager is ON** (Christopher). His reasoning: Schwab and Fidelity both require
  a timed code, so a stolen password DB does not open a custodian account, and someone arriving at
  SP+ is *leaving* a reckless setup. Shipped with `--password-store=kwallet6`, `pam_kwallet` wiring,
  SafeBrowsing and DoH.
- **Joplin STAYS.**
- **Crash reports go to `info@secureprospective.com`** via the advisor's own mail client.
- **PIN YOUR HELP removed** — Help is opened from Brave.
- Crash-report URL points at `/contact`, not a new `/support` page.
- Installer sidebar redesign (T-17) is deferred until after testing; it is cosmetic.

## 8. HYPOTHESES REFUTED / FACTS ESTABLISHED — DO NOT RETEST

- **The operator SSH key fix works on real hardware.** On the RC1e guest `/home/test/.ssh/` does
  not exist at all; the only key is `/etc/ssh/authorized_keys.d/test` written by the kickstart
  `%post`, and it authenticated with SELinux enforcing. D-1 escape hatch is proven.
- **Anaconda 44 has NO `rnotes`** — zero references in anaconda-gui-44.30-2.fc44. The slideshow was
  removed upstream. Do not build assets for it.
- **GTK CSS has no `content` property and no `::before`/`::after`.** The installer sidebar CANNOT
  take text via CSS; it needs a rendered image. I started writing web CSS for a GTK stylesheet and
  caught it before shipping a silent no-op.
- **DrKonqi cannot be redirected.** `/usr/libexec/drkonqi` carries `kdeBugzillaURL()` and
  `submit@bugs.kde.org` and has NO reference to `BUG_REPORT_URL` or `os-release`. Setting
  `BUG_REPORT_URL` in os-release does NOT move where it reports. The "Report to SP+" string is
  KDE's `"Report to %1"` with the distro name substituted.
- **Brave crashes produce no usable KDE crash report** — "KCrash metadata not marked complete /
  Nothing handled the dump :O" on the real 18:30:04 Brave SIGTRAP.
- **That Brave SIGTRAP matches the "make default closes the window" report** by timing (crash
  18:30:04, relaunch 18:30:56). NOT PROVEN — Brave ships stripped, every frame is `n/a`.
- **Nextcloud theme edits ship to nobody without a cachebuster bump.** The URL is
  `?v=cfcd2084-17` where `cfcd2084` is `md5("0")`, a constant, served
  `max-age=15778463, immutable`. Bump with `occ config:app:set theming cachebuster --value=N`.
  Verify with the URL the BROWSER requests, never with your own `?x=$RANDOM` — that bypasses the
  exact cache that is blocking the user. I reported "it's live" from such a fetch and was wrong.
- **`pgrep -f "<pattern>"` matches the shell running the pattern.** A waiter looping on
  `pgrep -f "tom-run.sh ..."` matched itself and would never have exited. Always
  `| grep -v "bash -c"` or exclude the loop.
- **A launcher exit code says nothing about what it launched.** The `rc1e.sh` wrapper printed
  "RC1e started" and exited 0 immediately; twice I nearly read that as the build finishing.

## 9. THE OPEN BUG THAT WAS DELETED RATHER THAN FIXED

Clicking a pinned SP+ Help launcher gave **"Unknown application folder"**. Every static check
passed: identical `applications:<file>.desktop` format to the five working launchers, present in
the KDE menu under `Accessories/`, valid `Exec` (`brave-browser` exists), icon present at
`hicolor/scalable/apps/spplus-help.svg`, `desktop-file-validate` clean. The runtime resolution
failure was **never root-caused** — it needs a live Plasma session to iterate, and the VM was off
limits. Christopher's call: remove the button, since Help opens from Brave anyway. The three
config-preflight assertions are **inverted**, so the button cannot return with the same defect.

If it ever needs solving: the next thing to try is adding Help as a sixth entry in
`spplusTaskbarLaunchers` in
`theme/look-and-feel/org.secureprospective.spplus.windows11.dark/contents/layouts/org.kde.plasma.desktop-layout.js`,
which is the exact mechanism that produced the five working pins.

## 10. NEXT ACTIONS, IN ORDER

1. **Build RC1f.** `cd ~/work/secureprospective-advisor-os && SPPLUS_BUILD=20260904a
   ~/fleet/bin/sp-plus-iso-build.sh` (confirm the invocation against the script first). Expect
   MORE than 183 steps. Watch for `ADVISOR_TOOLKIT_OK`, `PWA_GATE_OK`, `STORE_GATE_OK`,
   `UPDATE_LANE_GATE_OK`, `BRAVE_POLICY_OK`, `BRAVE_DEFAULT_GATE_OK`, **`POSTURE_GATE_OK`**,
   **`KEYRING_GATE_OK`**, **`CRASH_GATE_OK`**, `Image build successful`.
2. **Verify the payload in the image**: `BUILD_ID=20260904a`, `PasswordManagerEnabled: true`,
   `DefaultZone=public`, smb masked, no kdeconnect D-Bus file, the crash desktop entry.
3. Copy to `~/Downloads/sp-plus-1.0-rc1f-20260904.iso` + sha256.
4. **Destroy and reinstall `spplus-test`** — do not reuse the contaminated one.
5. **Run `projects/sp-plus/tests/runtime-posture-gate.sh`** against the fresh guest. It failed 11
   assertions on RC1e; it should now pass. This is the proof the security fixes took effect.
6. Hand the VM to Christopher to test: the display-settings button on Welcome screen 1, the crash
   report opening email to info@secureprospective.com, Brave saving a password without a KWallet
   prompt, Joplin, the six PWAs.
7. Open items to raise: M-1 `spplus-grant-admin` scope; M-2 signing + SBOM; T-17 installer sidebar
   (needs a rendered PNG, not CSS); T-18 the rebranding loop.

## 11. ENVIRONMENT NOTES

- Beelink is the ACTIVE repo; CT105 is backup. Never sync silently.
- Nextcloud: `https://cloud.secureprospective.com`, CT107 `192.168.1.30`, admin `spadmin`,
  password in `/opt/nextcloud/.env` as `NC_ADMIN_PASSWORD` (Christopher was given it and intends
  to change it). Theme edits need a cachebuster bump. `/root/.cloudflare_token` reads zones but
  **cannot purge cache**.
- Test VM creds (harness only, never shipped): user `test` / `testtest`, LUKS `spplustest`,
  key `~/.ssh/spvm` on the Beelink, port 2222.
- Screenshots: `~/fleet/bin/vmshot spplus-test` → `~/logs/sp-plus/testvm/shots/`.

## 12. HONEST STATUS

RC1f is **not built**. Everything above it is committed and preflight says "Safe to build", but
**no image has ever been built with any of today's fixes** — the security block, the keyring
wiring, the crash reporter and the display button have passed only source-level checks and a
`bash -n`. The one runtime proof that exists is the injection test, which ran on CT105 against the
real script, and `evaluateScript`, which is now moot because the button was deleted.

`runtime-posture-gate.sh` going green on a fresh RC1f install is the only thing that will show the
security fixes actually took effect, and that is exactly the class of failure — a control that
reads correct and does not take — that this whole audit was about.
