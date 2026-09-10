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

**Status:** RESOLVED 2026-09-09. Observed working on the alpha2 ISO in QEMU.

The fix landed on 2026-08-26 and this entry was never updated, so the ledger
described the machine as broken for two weeks after it was mended. Two commits
did it: `f22887b` created the `autovt@.service -> anaconda-shell@.service`
symlink in BOTH `/usr/lib` and `/etc` and set `ReserveVT=2`, and the graphical
entry was restored as the DEFAULT boot entry in `installer/iso.yaml`, with text
mode kept as the second entry.

Measured on 2026-09-09: booting the default entry of `SP-PLUS-1.0-alpha2.iso`
paints the full graphical Anaconda with SP+ branding -- sidebar logo, "WELCOME TO
SP+ 1.0.", the language spoke, the hub, and every spoke through to "Complete!".
No grey. Evidence in `~/logs/sp-plus/alpha2-install-2026-09-09/`.

**Do not trust a status line in this file over the source.** This one was wrong
in the direction that costs the most: it described a shipped fix as an open
defect and named a "leading candidate" that was already implemented.

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

**Status:** RESOLVED 2026-09-09 for the graphical path, which is now the default
boot entry -- so the risk this entry describes is no longer on the advisor's road.

Measured end to end on alpha2 in QEMU:

1. Installation Destination shows `Automatic` storage with "Encrypt my data."
   ticked and the note "You'll set a passphrase next."
2. Done opens **DISK ENCRYPTION PASSPHRASE** -- Passphrase and Confirm fields,
   a live strength meter, reveal toggles, and the keyboard-layout warning.
3. Save Passphrase clears the spoke's warning icon.
4. On first boot the machine shows the SP+-branded prompt "Enter your passphrase
   to unlock this computer" and the passphrase set at install unlocks it.

D34 is satisfied: the advisor sets their own LUKS2 passphrase and nothing else
knows it. The text-mode question is now academic rather than product-blocking,
because text mode is the second entry and only reached deliberately. It stays
worth answering before the text entry is offered as a supported route.

**Original risk, kept for the record.** Anaconda's TUI contains a LUKS passphrase
dialog, but the visible passphrase path is associated with preconfigured or incomplete
automated Kickstart partitioning. Our kickstart declares `--encrypted --luks-version=luks2`
with NO passphrase. It is NOT established that interactive `inst.text` offers the same
"encrypt my data" + passphrase UX as the GTK installer.

**This is a product-blocking question**, not a cosmetic one: D34 requires the advisor to set
their own LUKS2 passphrase at install. Verify at the very next QEMU install and record the
exact prompt sequence. If text mode cannot prompt, the options are RDP
(`inst.rdp inst.rdp.username= inst.rdp.password=`) or fixing T-07.

### T-09 — Kickstart hardcodes `--ondisk=vda`

**Status:** RESOLVED. `interactive-defaults.ks` no longer names a disk. A `%pre`
block picks the largest writable, non-removable, non-USB disk with `lsblk` and
refuses with a message rather than guessing when none qualifies, then emits
`ignoredisk`/`clearpart`/`autopart` through `%include`. That works on virtio and
on the Dell's SATA `sda` alike.

Confirmed on virtio 2026-09-09: the installer auto-selected "Virtio Block Device
vda / 80 GiB free" and reported `Automatic partitioning selected`, with no
operator choice and no custom-storage classification. **Still unconfirmed on the
Dell's SATA disk** -- that is part of the bare-metal run, not this entry.

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

### T-19 - Sleep and resume: proven on the VM except for the display

Measured 2026-09-09 on the alpha2 install in QEMU, after enabling
`<suspend-to-mem enabled='yes'/>` in the domain XML (it ships disabled, which is why sleep
could not be tested before).

**What works.** Kickoff -> Sleep suspends in about 4 seconds. The kernel logs
`PM: suspend entry (deep)` and `PM: suspend exit` 13 seconds later. After resume the session,
D-Bus, networking and every unit are healthy, and no unit is failed.

**Security-relevant and confirmed:** the machine wakes LOCKED. `kwin_wayland` holds a delay
inhibitor reading "Ensuring that the screen gets locked before going to sleep", and after resume
`org.freedesktop.ScreenSaver GetActive` returns true and logind reports `LockedHint=yes`. This
matters because `config/kscreenlockerrc` ships `Autolock=false`; the resume lock is a separate
setting and it is in force.

**What fails, and it is the VM's GPU.** The screen never comes back. `kwin_wayland` logs
`Pageflip timed out! This is a bug in the virtio_gpu kernel driver` once a second, 28 times in
one resume, and `kscreen-doctor --dpms on` hangs. The framebuffer stays wedged through a guest
reboot; only destroying and restarting the domain clears it. SP+ ships no logind, sleep.conf or
powerdevil overrides, so this is stock Fedora KDE on a virtio GPU, not an SP+ policy.

**Unproven, and only real hardware can prove it:** that the Dell resumes with a working screen on
i915. The Dell has never suspended once in 7 days of uptime (`PM: suspend entry` count is zero),
and it must not be suspended unattended - if resume fails there is nobody at the keyboard.

**Acceptance:** on the Dell, with someone present: close the lid or choose Sleep, wake it, and
confirm the screen returns and asks for the password.

### T-20 - Welcome screen 03: the email card breaks its layout on "Other account"

Found 2026-09-10 during the Bee alpha sweep, on the released Alpha v0.10 image
(`sha256:2ee969adfc7a105a6b930db9cee7313f2965042bade7b5f077edcd785b1530cb`). **Fix in the
next ISO.**

**Reproduce.** Welcome -> 03 Office connections -> in the `03 / EMAIL` card choose
**Other account**. The radio group grows a "Paste the web address your practice uses for
email" label and a URL field.

**What happens.** The added field pushes the card's own content past its bottom edge:

- The explanatory line "It must start with https. SP+ opens the page and never asks for or
  stores your password." is clipped mid-sentence at the card boundary.
- **The OPEN EMAIL SIGN-IN button escapes the card entirely** and lands on top of the
  "A QUICK NOTE" strip below it, with that strip's text still visible underneath the button.

Evidence: `~/logs/sp-plus/testvm/shots/p02-s03-other-url-20260910T034930Z.png`.

**Why it matters.** This is the screen where an advisor connects their email, and the
control they need is the one that breaks out of its box and lands on top of other text.
It also violates the standing rule that every Welcome screen fits one viewport with no
overflow - the other two cards on this screen are fixed-height and this one is not.

**Note on how it was found.** Bee was mid-phase and driving the screen correctly; the
defect was caught by reading its screenshot, not its prose. The lesson is the standing
one: look at the rendered result.

**Acceptance:** with "Other account" selected at 1280x800, the whole card renders inside
its own border, nothing is clipped, and no control overlaps the strip below. Check the
Google Workspace and Microsoft 365 selections at the same time - they are shorter, but
the card should not resize in a way that shifts the rest of the screen.
