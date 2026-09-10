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

### T-20 - Welcome: fixed-height containers paint over the content below them

Found 2026-09-10 during the Bee alpha sweep, on the released Alpha v0.10 image
(`sha256:2ee969adfc7a105a6b930db9cee7313f2965042bade7b5f077edcd785b1530cb`). **Fix in the
next ISO.**

Originally logged as a single email-card bug. Phase P02 showed it is not one card and not
one screen: **every fixed-height container in Welcome overflows silently.** There is no
scroll, no reflow and no clipping mask, so content that grows is simply drawn on top of
whatever sits below. Fix this at the container level, once, rather than tuning each card -
a per-card patchwork would leave the next piece of dynamic text to find its own way out.

**Reproduce - screen 03, Office connections.** All three cards do it:

- `03 / EMAIL`, choose **Other account**: the URL field pushes the card past its bottom
  edge. "It must start with https..." is clipped mid-sentence and **OPEN EMAIL SIGN-IN
  escapes the card onto the "A QUICK NOTE" strip**.
- `01 / OFFICE FOLDER`, run a check against an unreachable server: the error
  "INVALID-SERVER COULD NOT BE REACHED ON THE NETWORK..." renders *superimposed* on the
  quick-note strip. Two runs of text occupy the same pixels and neither is legible.
- `02 / PRINTER`, click PRINT ONE TEST PAGE with no printer: the status text overlaps the
  same strip, and **`I'LL DO THIS LATER` becomes unreachable** - the advisor cannot skip
  the step the screen just told them to skip.

Evidence: `~/logs/sp-plus/testvm/shots/p02-s03-other-url-20260910T034930Z.png`,
`p02-s03-check-folder-invalid-20260910T035118Z.png`,
`p02-s03-print-test-page-20260910T035224Z.png`.

**Reproduce - screen 04, Social service details.** Open Social details. The capability
list reported by the Social service is taller than the panel; the FACEBOOK row is sliced
in half by the panel footer and scrolling does nothing. The advisor cannot see what the
service actually offers, which is the panel's only job. Evidence:
`p02-s04-social-scrolled-20260910T035630Z.png`.

**Reproduce - screens 07 and 08.** Confirmed 2026-09-10 in sweep P04, so this is not a
screen-03 problem at all:

- Screen 07 Optional tools: the tool list is taller than its container. Row `04 GNOME
  BOXES` is sliced in half by the fixed footer and its `ADD GNOME BOXES` button is
  unreachable. No scrollbar. Evidence:
  `~/logs/sp-plus/testvm/shots/p04-screen07-20260910T052854Z.png`.
- Screen 08 Ready to work: "You can reopen this any time from Applications > SP+ Welcome"
  and the "Do not show this setup again" control are partly hidden behind the footer at the
  default viewport. Evidence: `p04-screen08-initial-20260910T053554Z.png`.

That is **five of eight Welcome screens** with the same fault, which is the argument for
fixing the container rather than the screens.

**Why it matters.** Screen 03 is where an advisor connects their email, and it is
precisely the error paths - the ones a nervous advisor will hit - that destroy the layout.
An advisor who cannot read the error and cannot reach the skip button is stuck on the
screen with no way forward and no idea why. It also violates the standing rule that every
Welcome screen fits one viewport with no overflow.

**Note on how it was found.** The first instance was caught by reading Bee's screenshot,
not its prose; the full extent was caught the same way. The lesson is the standing one:
look at the rendered result.

**Acceptance:** at 1280x800, drive every dynamic state on screens 03 and 04 - each email
provider including Other account, a folder check that fails, a printer search that finds
nothing, a test page with no printer, and a Social capability list longer than its panel.
In every case content stays inside its own border, nothing is drawn over the strip or
footer, every control including the skip stays reachable, and anything too tall scrolls
with a visible scrollbar. Also check the Google Workspace and Microsoft 365 selections do
not shift the rest of the screen.

### T-21 - Welcome: stale status text survives a change of provider

Found 2026-09-10, Bee sweep P02, Alpha v0.10. **Fix in the next ISO.**

**Reproduce.** Welcome -> 03 Office connections -> `03 / EMAIL`. Choose Microsoft 365 and
launch it, come back, then choose Google Workspace.

**What happens.** The card still reads "MICROSOFT 365 IS OPEN IN YOUR BROWSER. SP+ DID NOT
HANDLE OR STORE YOUR PASSWORD." while Google Workspace is the selected radio. Evidence:
`~/logs/sp-plus/testvm/shots/p02-s03-google-reset-for-skip-20260910T035311Z.png`.

**Why it matters.** The advisor is being told a sentence about a provider they have just
moved away from, on the screen where they are deciding which provider they use. It reads
as the app having done something they did not ask for.

**Acceptance:** changing the provider selection clears any status from the previous one.

### T-22 - Welcome: an error tells the advisor to open Settings but offers no way in

Found 2026-09-10, Bee sweep P02, Alpha v0.10. **Fix in the next ISO.**

Clicking PRINT ONE TEST PAGE with no printer configured returns "THE PRINT SERVICE IS
RUNNING, BUT NO USABLE PRINTER IS SET UP YET. OPEN PRINTER SETTINGS TO ADD ONE." - as
plain text, with no button or link that opens printer settings, and partly obscured by the
footer per T-20.

This is the vocabulary problem in another form: the message assumes the advisor knows
where "printer settings" is. Screen 01 already opens System Settings from a link, so the
mechanism exists.

**Acceptance:** the message carries a control that opens printer settings directly.

### T-23 - Welcome: Windows-facing copy still contains Linux and technical jargon

Found 2026-09-10, Bee sweep P02, Alpha v0.10. **Fix in the next ISO.** Low severity.

Observed in Welcome: "learn Linux", "leaving it mounted", "GVFS", "desktop wallet",
"ENCRYPTED AT REST", "SEC Marketing Rule". Screen 07 additionally prints raw Flatpak
application ids next to every tool - `FLATHUB`, `US.ZOOM.ZOOM`, `COM.BITWARDEN.DESKTOP`,
`ORG.SIGNAL.SIGNAL`, `ORG.GNOME.BOXES` (sweep P04,
`~/logs/sp-plus/testvm/shots/p04-screen07-20260910T052854Z.png`). Evidence:
`~/logs/sp-plus/testvm/shots/p02-final-screen1-20260910T040742Z.png`,
`p02-s03-start-20260910T034717Z.png`, `p02-s04-social-back-20260910T035703Z.png`.

The audience is an advisor who is frightened of anything outside Windows. "GVFS" and
"mounted" are the words that confirm their fear that this is a machine for engineers.

**Acceptance:** each term is replaced with what it means to the advisor, or removed. Keep
the accuracy - the point is not to hide that the folder connection is temporary, it is to
say so without naming the filesystem layer that implements it.

### T-24 - Welcome screen 02: the footer promises "Apply", the button says "Use This Look"

Found 2026-09-10, Bee sweep P02, Alpha v0.10. **Fix in the next ISO.** Low severity, but
it is one screen's two halves disagreeing about what the same action is called.

**Acceptance:** one name for the action, used in both places.

### T-25 - Three shipped themes have no panel layout of their own (decision needed)

Raised 2026-09-10, Bee sweep P03, Alpha v0.10. **This is a question for Christopher, not a
code defect.**

Applying Nordic Dark, Catppuccin Mocha or Catppuccin Latte leaves the standard bottom-left
panel in place. Welcome says so plainly: "Panel and pinned apps: replaced with the standard
arrangement, because this theme does not define its own." The desktop is correct and
usable - wallpaper, colours and decorations all change. Evidence:
`~/logs/sp-plus/testvm/shots/P03-61-catppuccin-mocha-closed-20260910T042346Z.png`.

Bee graded this FAIL against the "every theme owns its panel" criterion. That grading is
too literal. Those three are upstream third-party themes and upstream Plasma themes
generally do not ship a panel layout; the standing rule that the creator's declared intent
outranks the SP+ normalization layer says the fallback is the right behaviour, and the app
is honest about it.

**The decision:** does SP+ author panel layouts for the third-party themes it ships, so
every theme in the picker feels first-class, or does it keep the honest fallback? The first
is more work per theme and means overriding creator intent; the second means three of eight
themes change less than the advisor expects when they pick them. Christopher's call.

### P03 - theme round trip PASSED

Recorded 2026-09-10 for completeness, since this is the acceptance test that has failed
before. All eight themes applied and were visually verified. Panel, Kickoff, window focus
and close worked after every apply. The Breeze Light -> Modern Light -> Breeze Light round
trip completed **twice** with no breakage. Already-open windows keep their old look until
reopened, which is what the advisor message promises.

### P04 - what worked

Recorded 2026-09-10, sweep P04, Alpha v0.10, so the next session does not retest it.

- **Optional tools install end to end.** Zoom installed from Flathub, the button changed to
  `ADDED`, it appeared in Kickoff and launched to its sign-in screen.
- **Printer lane behaves.** Find printers showed a working state and returned in 2-3s. The
  helper agreed with the UI: `discover` -> `{"ok": true, "printers": []}`, `list` ->
  `{"ok": true, "queues": [], "default": ""}`. The messages are honest and actionable; only
  their layout is wrong (T-20, T-22).
- **Screen 06 Help is sound.** Topics, guides, paging, copy buttons, navigation and the
  empty Ask-Fin validation all worked.
- **Screen 05 Fin** explains itself clearly and opens to its login prompt. P08 owns login.
- **Screen 08** update check, Back, Finish Setup and Open Desktop all worked.
- Booted digest re-confirmed as the alpha3 digest.

## Sweep phases P06 to P11 - 2026-09-10, Alpha v0.10

### T-26 - The display never repaints after resume, and it is probably the VM

Sweep P09, P10 and P11 all returned FAIL, and all three failed on the same thing: the
screen stays black with `Display output is not active.` after a resume or a reboot.

**Do not read those verdicts as three defects.** They are one symptom, and the evidence in
P09's own report argues it is not SP+:

- The guest logged `PM: suspend entry (s2idle)` and then `PM: suspend exit`.
- **SSH answered 1.61 seconds after wake.**
- KWin replied to a D-Bus ping; Plasma and the Wayland session were alive throughout.
- No new failed units, network reconnected, guest clock still matched the host.

So the machine sleeps and resumes correctly underneath. What did not come back is the
framebuffer, and the component that owns it is QEMU's virtio-GPU, not SP+.

The same artifact wasted P11 and P12 several hours later: the rig idle-suspended while
unattended, and P11 graded "ship-blocking - the graphical console remained unusable after
reboot". After a `virsh reset` the machine booted perfectly, showed the branded SP+ LUKS
unlock prompt, unlocked, reached SDDM, logged in, and reported zero failed units.

**Action: this is a question for the Dell, not for the VM.** Sleep the Dell, wake it, and
look at the screen. That is a five-minute test on real hardware and it settles a question
the VM cannot answer. Until then, resume-repaint is **unproven**, not broken.

### T-27 - Hibernation is unavailable, and honest about it (decision needed)

Sweep P10. Hibernation does not work on SP+ and cannot: the only swap is `/dev/zram0`
(7.7G against 8.1G of RAM), there is no `resume=` or `resume_offset` on the kernel command
line, and root is LUKS on LVM.

The important half is that **nothing is broken or lying**. PowerDevil reports
`isActionSupported Hibernate = false` and logind reports `CanHibernate = "na"`, and no
Hibernate entry appears in the Kickoff power row. The capability is simply absent.

**The decision:** does SP+ support hibernation? Supporting it means a persistent swap file
at least the size of RAM inside the LUKS container plus a resume target, which costs disk
and adds an unlock path to get right. Not supporting it is defensible for an advisor
laptop that sleeps and shuts down. Either way the current state is coherent; what is not
acceptable is leaving it undecided and undocumented. Christopher's call.

### T-28 - Welcome offers DOWNLOAD IT NOW when there is no update

Sweep P07. The update lane is otherwise sound - all three SP+ system timers are enabled,
active and `Persistent=yes`, and every unit's last run completed and did what it should -
but Welcome renders an inert `DOWNLOAD IT NOW` button while simultaneously reporting that
no update is available. The guarded SP+ check itself is honest and raises no error dialog.

An advisor who presses it gets nothing and has no way to tell whether the machine is
broken or already current.

**Acceptance:** with no update staged, no download control is shown at all.

### T-29 - Help "Related pages" are raw Markdown and inert

Sweep P06. At the bottom of a guide, related links render as literal source, e.g.
`- [Bluetooth devices](bluetooth-devices.md)`, and clicking one navigates nowhere.
Evidence: `~/logs/sp-plus/testvm/shots/p06-guide-wifi-related-20260910T074822Z.png`.

This is the screen an advisor reaches when they are already stuck, and it shows them a file
path. Everything else in Help is sound: live search suggestions returned the right guide
for all six queries, the click-tree reached a guide without search, and search and guides
kept working with the network disabled, showing the offline notice.

**Acceptance:** related links render as titles and navigate. Also render image links, which
P06 could not exercise because the corpus has no images.

### T-30 - Two things called Help in the menu

Sweep P06. KDE's `Help Center` and the SP+ `Help` entry sit together in the menu, and the
SP+ one is labelled only "Help". An advisor who picks wrong lands in KDE documentation.
This is the vocabulary problem again: the advisor should not have to know which Help is
theirs. Evidence: `~/logs/sp-plus/testvm/shots/p06-help-menu-final-20260910T075237Z.png`.

**Acceptance:** the SP+ entry is unambiguous, and KDE's Help Center does not compete with
it in the menu an advisor uses.

### T-31 - LibreOffice is not in Tabbed mode, and the gate says it is

Sweep P08. Writer and Calc both open with `View > User Interface` set to **Standard
Toolbar** and classic menus, not the Tabbed Office-style layout the parity layer promises.
Windows and Office users do not get the familiar layout that is the entire point.

**The worse half is the gate.** The headless parity check reports `LIBREOFFICE_PARITY_OK
58 checks passed` against an interactive UI that contradicts it. A gate that passes while
the thing it checks is wrong is a false positive, not evidence - so this is two fixes: set
the interactive UI correctly, and make the gate able to fail when it is not set.

Evidence: `~/logs/sp-plus/testvm/shots/p08-writer-ui-dialog-20260910T082902Z.png`,
`p08-calc-ui-dialog-20260910T083018Z.png`.

### T-32 - A Brave policy is deprecated, so its behaviour is not guaranteed

Sweep P08. `brave://policy` shows all 24 managed values matching the shipped JSON, but
`PromotionalTabsEnabled: false` is reported with status **Deprecated**. A deprecated policy
may stop being honoured, and this is the one that keeps promotional tabs out of an
advisor's browser. Replace it with the supported equivalent.

### T-33 - Fin's shell escape can delete advisor files (decision needed)

Sweep P08 graded Fin FAIL: `! rm -f /home/test/Documents/P08-fin-probe` executed with no
warning and no approval prompt, and the file was gone.

**Bee is grading against a criterion Christopher has already rejected.** The standing
ruling is that safety on SP+ comes from the immutable bootc OS rather than from crippling
the assistant, and Fin is meant to be an open Pi-style TUI agent. The guardrail source says
as much in its own comment: "a sufficiently creative command will get past both."

What makes it worth raising anyway is the target. The immutable OS protects the system; it
does not protect `~/Documents`, which is exactly where an advisor's client files live. So
the open question is narrow and is not "should Fin have a shell":

**The decision:** should destructive commands against the advisor's own home directory ask
first, even though the shell stays open? Christopher's call.

### P07 to P11 - what passed

- **Update schedulers are correct.** 13 timers enumerated. The three SP+ system timers are
  enabled, active and `Persistent=yes`, so a machine that was off does not silently skip a
  cycle. Every unit's last run completed successfully. The plain-English update
  notification exists and renders.
- **No shipped application was found without an update route** (P07 step 7).
- **Brave is managed correctly** - all 24 policy values match the shipped JSON and there is
  no first-run wizard.
- **Help works offline** - search and guides kept working with the network down and showed
  the offline notice.
- **Dolphin, KeePassXC, Fin, Writer and Calc all launch and are usable** in 2-5 seconds on
  a deliberately slow rig. Writer and Calc saved valid `.docx` and `.xlsx`.
- **Sleep and resume work underneath the display problem** - see T-26.
- **After a clean reboot: zero failed system units, correct alpha3 digest, branded LUKS
  unlock prompt renders, SDDM login works.** Verified by Claude on 2026-09-10 after the
  rig was restored.

### Observation - the SDDM login screen is not SP+ branded

Noticed 2026-09-10 while restoring the rig. The LUKS unlock prompt is fully SP+ branded,
and the login screen immediately after it is stock Breeze blue with a generic avatar. The
advisor sees the brand, then loses it, then gets it back on the desktop. Not logged as a
defect because it may be deliberate for the alpha; raising it because the unlock sequence
is the first thing an advisor sees every morning.

## Sweep P05 - every application launches (re-run 2026-09-10)

The original P05 timed out at 90 minutes with no output because its brief pointed at
"every non-hidden .desktop file" against P01's count of 233. **The real number of visible
applications is 40**; the rest are `NoDisplay` entries that never appear in the menu. It
was re-cut as P05A/B/C with explicit named lists. Part A covered 15 applications in 23
minutes.

### T-34 - Flameshot cannot take a screenshot

Sweep P05A. Launching Flameshot leaves only a tray process; the capture overlay starts -
the screen dims and the "Tool Settings" tab appears - and then the selection UI never
paints and the capture aborts. Confirmed by looking at the evidence, not only the report:
`~/logs/sp-plus/testvm/shots/p05a-flameshot-capture-20260910T113828Z.png` shows the dimmed
overlay with nothing drawn on it.

Journal: `QPainter::begin: Paint device returned engine == 0, type: 2`, repeated
`Painter not active`, then `flameshot: info: Screenshot aborted.`

This is a Wayland painting failure and may be virtio-GPU specific, so **it needs the Dell
to confirm** - but note that SP+ also ships **Spectacle**, KDE's own screenshot tool, which
is native to Wayland. If Flameshot cannot be made reliable, the cheaper fix is to drop it
and leave one screenshot tool that works rather than two entries where one fails.

**Acceptance:** an advisor can take and save a screenshot from the menu on the Dell.

### T-35 - Discover logs an SSL read error before loading

Sweep P05A. `QIODevice::read (QSslSocket): device not open`. The catalog does load, after
about 18 seconds. Low severity, but 18 seconds with no explanation is a long time for an
advisor who has just clicked something.

### Not defects, recorded so they are not re-raised

- **"Fin has no models available" is correct behaviour, not a defect.** Bee graded it High.
  On a fresh rig nobody has signed Fin in to a provider, and the warning tells the advisor
  exactly what to do: "Use /login to log into a provider via OAuth or API key." Welcome
  screen 05 is the path that does this. Fin itself launched in 4 seconds, drew, and its
  command autocomplete worked.
- **Brave's graphics errors are the VM.** `virtio_gpu_drv_video.so init failed`,
  `WebGL1 blocklisted`, `GpuControl.CreateCommandBuffer` failures. Every page still drew
  and responded. Same family as T-26; answer it on the Dell.

### P05A results - 13 of 15 fully passed

Launched, drew, interacted and closed cleanly, with seconds-to-usable on the deliberately
slow rig: About This Computer 1s, Ark 2s, Brave 3s, btop++ 3s, Canva 5s, Disks 3s,
Dolphin 3s, Fidelity Wealthscape 5s, Google Maps 6s, Google Messages 5s, Google Photos 6s,
Discover 18s, Firewall 20s.

The web-app launchers all reached the right site: Canva `canva.com`, Fidelity
`wealthscape.com`, Maps `maps.google.com`, Messages `messages.google.com/web`, Photos
`photos.google.com`. Firewall authenticated and showed its runtime zones. Boot digest
re-verified. The desktop was clean afterwards with every tested process gone.

**Discover at 18s and Firewall at 20s are the two slowest things an advisor can click.**
Neither shows progress while it waits.

### T-36 - Brave does not block ads on a freshly installed machine

Reported by Christopher 2026-09-10 from hands-on testing of Alpha v0.10 on the Dell:
"In testing the Dell I noticed Brave isnt blocking ads." Investigated on the test VM the
same day. **This is a real defect and it is a first-impression defect.**

**What is actually wrong.** Shields itself is fine - it is enabled, and per-site Shields
metadata is being written for the sites the sweep visited. What is missing is the filter
lists. Brave ships no lists inside the browser package; it downloads them after first run
as components, on its own lazy schedule. On the test VM:

- `First Run` was stamped `2026-09-09 22:48`.
- `Default/adblock_cache/engine1.dat` (2.2 MB) appeared at `2026-09-10 01:14`, **2h26m later**.
- `Default/adblock_cache/engine0.dat` (8.6 MB, the full default list engine) appeared at
  `2026-09-10 07:01` - **8 hours 13 minutes after first run.**
- Components eventually present: `Brave Default Adblock Filters` 1.0.22179, `Brave First
  Party Adblock Filters` 1.0.481, `Regional Catalog` 1.0.97.

So for the whole of an advisor's first session on a new machine, Brave is running with
Shields "up" and nothing behind it. That is precisely the window in which the advisor
decides whether this computer was a good idea.

**Second, smaller problem.** The managed policy at `/etc/brave/policies/managed/sp-plus.json`
sets 24 keys and **not one of them concerns ad blocking or Shields**. The whole feature
rests on an upstream default. Nothing in the image asserts it, and the `BRAVE_POLICY_OK`
gate cannot catch a regression because it only asserts on keys that are already there -
another gate that cannot fail in the direction that matters.

**Confirm it on the Dell in one step:** open `brave://components` and read the version
beside **Brave Ad Block Updater**. `0.0.0.0` means the lists have never been fetched and
nothing is being blocked. That is the diagnostic, and it takes a few seconds.

**Fix, at the rules level rather than per machine.** Preferred order:

1. **Ship the filter lists in the image** so the engine is populated at first boot rather
   than hours later. The component updater then remains the update path, which satisfies
   the standing rule that everything shipped has one.
2. Failing that, a first-login unit that forces a component update immediately instead of
   waiting for Brave's schedule, with the advisor told nothing - it should simply be true
   by the time they open the browser.
3. Add explicit Shields policy keys so the setting is asserted by SP+ and not inherited,
   and extend the policy gate to assert them so the gate can fail.

**Acceptance:** on a machine installed from the ISO, open Brave for the first time and load
a page carrying ads; they are blocked, and `brave://components` shows a real version for
Brave Ad Block Updater. Prove it on the Dell, not on a VM.

**Honest limit of this evidence:** what was proven is that the engine file was written more
than eight hours after first run, and that no policy asserts Shields. Ads passing through
during that window follows from it but was not itself watched happening - the VM was busy
with another phase and could not be driven.

## Sweep complete - P11 re-run and P12 consolidation, 2026-09-10

The first P11 ran against a rig that had idle-suspended and every finding in it was
worthless; that report is kept as `reports/P11-INVALID-suspended-rig.md` so it is not
mistaken for evidence. The re-run below was done on an awake rig.

### P11 re-run - the reboot is sound, with real timings

- **Branded SP+ unlock screen displayed**, then unlocked. Restart to unlock **14.8s**,
  unlock to login screen **18.4s**, login to usable desktop **13.9s** - about **47 seconds**
  from restart to working desktop on the deliberately slow rig.
- **Zero failed units.** Theme, resolution and home directory all persisted; the `.docx` and
  `.xlsx` written in P08 survived.
- **Security posture confirmed:** `/dev/vda3` and the active mapping are **LUKS2**; the
  firewall is up; sshd is key-only and the key worked after reboot; writing to `/usr` was
  refused with `Read-only file system`; bootc owns the OS and `rpm-ostree status --json`
  reports `requested-packages: []` and `packages: []`, so nothing is layered.
- Secure Boot remains unprovable in the VM (`/sys/firmware/efi` absent) - **a Dell question.**

### T-37 - SP+ Welcome opens itself on every login

Found in the P11 re-run. After logging in, `SP+ Welcome` auto-opened; it is registered as
`org.secureprospective.spplus.welcome.desktop` in autostart.

This connects to T-20 in a way worth noticing: the control that stops it doing so - "Do not
show this setup again" on screen 08 - is **one of the controls clipped behind the footer**.
So the advisor is shown a setup wizard every morning and the off switch is the thing they
cannot reach. Fixing T-20 fixes this too, but the autostart rule deserves its own decision:
Welcome should probably stop opening itself once setup has been completed once, rather than
relying on the advisor finding a checkbox.

### T-38 - Kickoff search shows stale results for ~14 seconds

Found in P05C. Searching for Spectacle left unrelated results on screen for about 14
seconds before the match appeared. Low severity on its own, but it lands on the surface
whose entire purpose is that the advisor should not have to know the right word - a search
that answers late with the wrong thing is worse than one that answers slowly.

### P12 consolidation - and where its ranking is wrong

Bee's consolidated verdict is DO NOT SHIP, with two CRITICALs at the top. **Both are
corrected elsewhere in this ledger and neither should reach a fix list as written:**

1. Its first CRITICAL is the Fin shell escape. That is T-33 - Christopher has already ruled
   that safety comes from the immutable OS rather than from crippling Fin. The live
   question is narrower and is recorded there.
2. Its second CRITICAL is "sleep/resume leaves the graphical output black". That is T-26 -
   one virtio-GPU symptom that produced three FAIL verdicts, with P09's own evidence
   showing the session alive underneath and SSH answering 1.61s after wake. It is a Dell
   question, not a defect.

Its remaining ranking is sound and matches this ledger: the Welcome container overflow
(T-20) at the top, then Help Center's missing documentation, Flameshot (T-34), Help's raw
Markdown links (T-29), screens 07/08 clipping and the Social list.

**The single most valuable thing the sweep produced is not in Bee's list at all**: three
separate gates that pass while the thing they check is wrong - LibreOffice parity (T-31),
the Brave policy gate (T-36), and, by omission, anything Shields-related. A gate that
cannot fail is a false positive, and those have been shipping green.
