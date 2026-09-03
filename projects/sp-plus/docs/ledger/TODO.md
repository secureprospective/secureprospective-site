# TODO

| ID | Item | Owner | Blocks (which phase) | Opened | Status |
|---|---|---|---|---|---|
| T-01 | TPM2 LUKS enrollment is unproven on real firmware — the Dell test machine has no TPM. Needs a second, TPM-equipped test machine. | Christopher | Phase 5 | 2026-08-26 | OPEN |
| T-02 | Q1 — Brave, Firefox, or Chromium? And does Brave's self-updater behave on an immutable root? | Christopher | Phase 1 | 2026-08-26 | OPEN |
| T-03 | Q3 — RPM Fusion and patent-encumbered codecs? | Christopher | Phase 1 | 2026-08-26 | OPEN |
| T-04 | Q11 — does the assistant ship in v1 at all? | Christopher | Phase 2 | 2026-08-26 | OPEN |
| T-05 | Q14 — ask the Fedora Council whether an unchanged Fedora-signed shim needs trademark permission inside a modified image. | Christopher | public release | 2026-08-26 | OPEN |
| T-06 | Gate 0.B(update) — after a rootful ISO install succeeds, run `bootc upgrade --check` against `ghcr.io/secureprospective/sp-plus-kde:edge` and capture the registry-reachability result verbatim. | Bee | Phase 0.5 | 2026-08-26 | OPEN |

### T-07 — Graphical installer paints grey (#808080) forever

**Status:** OPEN. Worked around by defaulting to `inst.text` (commit `20830ed`).

**What is NOT the cause** (verified 2026-08-26, do not retest): local graphical mode was
NOT removed in Fedora 44 (Anaconda became a native Wayland client in F42; RDP replaced
VNC for REMOTE installs only). No RPM is missing — `mesa-dri-drivers`, `systemd-pam`,
`gnome-kiosk`, `gnome-remote-desktop`, `gnome-settings-daemon`, `gsettings-desktop-schemas`,
`librsvg2` and `anaconda-install-img-deps` are all present in the installer image.
`xorg-x11-server-Xorg` must NOT be added — that is contrary to the F42+ architecture.

**What #808080 means:** it is GNOME Kiosk's default background colour. The compositor
started and took the graphical VT; Anaconda's GTK window never appeared.

**LEADING CANDIDATE for build #4:** the bootc ISO contract requires
`/etc/systemd/system/autovt@.service -> anaconda-shell@.service`. **This symlink is ABSENT
from our installer image** (confirmed by inspection). Anaconda switches to VT6 for the GUI.
Add the link in `installer/Containerfile` and retest.

**Then audit, in order:** active `systemd-logind`, `/run/user/0`, VT6 ownership,
`gnome-kiosk` journal output, `/dev/dri` + i915 init, Anaconda GTK traceback files in `/tmp`.

### T-08 — Confirm the LUKS passphrase UX in TEXT mode

**Risk flagged by research, NOT yet verified.** Anaconda's TUI contains a LUKS passphrase
dialog, but the visible passphrase path is associated with preconfigured or incomplete
automated Kickstart partitioning. Our kickstart declares `--encrypted --luks-version=luks2`
with NO passphrase. It is NOT established that interactive `inst.text` offers the same
"encrypt my data" + passphrase UX as the GTK installer.

**This is a product-blocking question**, not a cosmetic one: D34 requires the advisor to set
their own LUKS2 passphrase at install. Verify at the very next QEMU install and record the
exact prompt sequence. If text mode cannot prompt, the options are RDP
(`inst.rdp inst.rdp.username= inst.rdp.password=`) or fixing T-07.

### T-09 — Kickstart hardcodes `--ondisk=vda`

`vda` is a virtio disk. The Dell (HW-00) has a SATA mechanical drive and will present
`sda`. The kickstart will fail there as written. Make disk selection dynamic or interactive
before the bare-metal test.

### T-10 — Test VMs must expose a driveable console, not a GTK window

**Problem found 2026-08-26, first QEMU install.** The launcher used `-display gtk` with the
serial console redirected to a FILE (`-serial file:...`). That is output-only. The QEMU GTK
window has no clipboard integration with the host, so the operator had to hand-type every
command into the guest — including an ed25519 public key. Unacceptable and error-prone.

**Immediate workarounds used:**
1. `tests/vmtype.sh` — types a command into the guest by driving `sendkey` over the QEMU
   monitor socket. Works, but slow and character-mapped.
2. A short `curl 192.168.1.105:8000/k` one-liner fetching the pubkey from a temporary
   HTTP server on CT105 (guest reaches the LAN through user-mode NAT).

**Correct fix for all future launchers:** attach the serial console to a Unix socket
instead of a file:
```
-serial unix:$D/console.sock,server,nowait
```
and drive it from the build host with `socat -,raw,echo=0 UNIX-CONNECT:$D/console.sock`.
That gives full bidirectional console access with no GUI, works headless, survives over
SSH, and mirrors how the bare-metal Dell will be reached. Keep `-monitor` on its own
separate socket for screendumps and `sendkey`.

**Rule.** A test environment the operator cannot paste into is a defective instrument.
Build the access channel before the test, not during it.

### T-11 — Make `field-inspect.sh` exit non-zero on a security-critical PROBLEM

`release-gate.sh` currently supplies the pass/fail judgement over the report. Fold the
security-critical subset into `field-inspect.sh` itself so the script cannot be run and
casually ignored: exit 0 clean, exit 1 when any of `selinux_mode`, `selinux_arg_leaked`,
`luks_containers`, `luks_version` is wrong. Deferred only to avoid a merge conflict with
the in-flight b03 dispatch, which is editing `tests/`.

### T-12 — Wire the pre-build gate into `sp-plus-iso-build.sh` directly

`~/work/sp-plus/gates/sp-plus-build-gated.sh` currently WRAPS the build script rather than
modifying it, because b03 was mid-run and editing a script an agent is executing is a way
to break a dispatch. Once b03 closes, fold the gate call into the head of
`sp-plus-iso-build.sh` so there is exactly ONE build path and it cannot be bypassed by
habit. A gate that is optional is not a gate.

### T-13 - Make SELinux Enforcing boot (BLOCKS the Dell) 🔴
Cause of DN-14. The installed ostree filesystem is not correctly labeled, so Enforcing blocks
service startup. Candidate fixes, in order of preference: ensure the bootc image ships correctly
labeled; trigger an autorelabel on first boot (`/.autorelabel`); or `restorecon`/`fixfiles` over
the installed tree from `%post`. **Verification is not "it builds" - it is an SSH banner plus a
Plasma greeter with NO `enforcing=0` on the cmdline.**

### T-14 - Suppress the Fedora pre-release warning dialog
Every graphical install shows "This is unstable, pre-release software... Do *not* use this
software for any critical work", requiring the installer to click "I want to proceed". An advisor
must never see this. Comes from building on `fedora-bootc:44` pre-release.

### T-15 - Installer serial log stops when Anaconda takes the console
`-serial` capture dies at ~94 KB the moment Anaconda starts, so `%post` output is not captured.
This is why `%post` success/failure could not be read from the serial log. Need Anaconda's own
logs off the installed system instead.

### T-13 (REVISED) - Label `/etc` at install time so logins work under Enforcing 🔴 BLOCKS THE DELL
Cause of DN-16. Options, best first: (a) give the installer environment a working SELinux policy
so bootc labels the deployment normally (research: `selinux-policy-targeted` in the buildroot,
bootc #1438) - this also removes the need for DN-09's `selinux=0`; (b) `setfiles`/`restorecon`
over the installed `/etc` from `%post` using the TARGET policy's file_contexts.
**Acceptance: boot Enforcing, log in on tty1 as the advisor, `getenforce` = Enforcing, and ZERO
`avc: denied` in the boot log with `semodule -DB` active.**

### T-16 - Make the LUKS passphrase prompt visible on the local console 🔴 BLOCKS THE DELL
Cause of DN-15. Likely `plymouth` + fbcon console hand-off. Acceptance: on a physical-style boot
with no serial console, the passphrase prompt is legible on screen within 30s of power-on.

### T-17 - Redesign the installer sidebar so the install screen carries content
Cosmetic, NOT release-blocking. Deferred 2026-09-03 until after RC1e testing, by Christopher.

Today the ~9-minute install shows correct SP+ branding (logo on a flat `#0033A0` sidebar) and
nothing else. It is the first SP+ surface a prospective client ever sees, and it is empty.

**What is NOT available** (verified 2026-09-03 against anaconda-gui-44.30-2.fc44, do not retest):
- **The `rnotes` slideshow is gone.** Anaconda 44 contains ZERO references to `rnotes`; the
  rotating release-notes carousel was removed upstream. The `rnotes/` directory that
  `fedora-logos` still ships is vestigial. Do not build assets for it.
- **Screenshots on the progress screen are not practical.** The only region we own is the narrow
  left sidebar; a UI screenshot there is illegible. Injecting widgets into the main area means
  patching `ui/gui/spokes/installation_progress.py` or its glade - unsupported and fragile on a
  path where a failure means no one can install the product.

**What IS available:** the sidebar background image, via `installer/product/anaconda-gtk.css`,
which we already own and which already works through the `custom_stylesheet` hook
(`/etc/anaconda/conf.d/10-sp-plus.conf`). One tall PNG into
`installer/product/pixmaps/`, one `background-image` line on `.logo-sidebar`.

**Proposed content:** logo at top, then 3-5 short lines of what SP+ is and what the installer is
doing (immutable OS, encrypted by default, curated advisor toolkit). Static, not rotating.

**Acceptance:** install to the test VM, take a host-side `virsh screenshot` during the deploy
phase, and confirm the sidebar text is legible at the VMs native resolution - measured from the

### T-17 - Redesign the installer sidebar so the install screen carries content
Cosmetic, NOT release-blocking. Deferred 2026-09-03 until after RC1e testing, by Christopher.

Today the ~9-minute install shows correct SP+ branding (logo on a flat `#0033A0` sidebar) and
nothing else. It is the first SP+ surface a prospective client ever sees, and it is empty.

**What is NOT available** (verified 2026-09-03 against anaconda-gui-44.30-2.fc44, do not retest):
- **The `rnotes` slideshow is gone.** Anaconda 44 contains ZERO references to `rnotes`; the
  rotating release-notes carousel was removed upstream. The `rnotes/` directory that
  `fedora-logos` still ships is vestigial. Do not build assets for it.
- **Screenshots on the progress screen are not practical.** The only region we own is the narrow
  left sidebar; a UI screenshot there is illegible. Injecting widgets into the main area means
  patching `ui/gui/spokes/installation_progress.py` or its glade - unsupported and fragile on a
  path where a failure means no one can install the product.

**What IS available:** the sidebar background image, via `installer/product/anaconda-gtk.css`,
which we already own and which already works through the `custom_stylesheet` hook
(`/etc/anaconda/conf.d/10-sp-plus.conf`). One tall PNG into `installer/product/pixmaps/`, one
`background-image` line on `.logo-sidebar`.

**Proposed content:** logo at top, then 3-5 short lines of what SP+ is and what the installer is
doing (immutable OS, encrypted by default, curated advisor toolkit). Static, not rotating.

**Acceptance:** install to the test VM, take a host-side `virsh screenshot` during the deploy
phase, and confirm the sidebar text is legible at the VM's native resolution - measured from the
screenshot, not from the design file.

### T-18 - The rebranding loop overwrites files by path, not by type
Cosmetic/hygiene, NOT release-blocking. Found 2026-09-03 while investigating T-17.

`images/kde/Containerfile` (around line 1073) walks `rpm -ql fedora-logos`, filters to
`/(plymouth|sddm|pixmaps|anaconda)/`, and runs `cp -f "$ICON" "$f"` for everything whose name
does not end in `.svg`. The catch-all does not check file type, so in the runtime image
`/usr/share/anaconda/pixmaps/fedora.css` and `/usr/share/anaconda/boot/splash.lss` are both
byte-identical 127884-byte copies of a PNG.

**Blast radius is believed to be zero** and that is why it is not a blocker: Anaconda is not
installed in the runtime image, so these files are dead weight there. The INSTALLER is built from
`installer/Containerfile`, which brands correctly into `pixmaps/sp-plus/` and deliberately does
not overwrite stock assets. **This belief is unverified** - nothing has confirmed that no other
component reads those paths.

**Fix:** extend the `case` to skip non-image extensions (`.css`, `.lss`, `.txt`) rather than
letting `*)` clobber them.
**Acceptance:** rebuild and confirm `file /usr/share/anaconda/pixmaps/fedora.css` reports text,
not PNG data.
