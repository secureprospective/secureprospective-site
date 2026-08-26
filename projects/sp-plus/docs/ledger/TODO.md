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
