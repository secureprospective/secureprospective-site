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
