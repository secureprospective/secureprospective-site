# Handoff

## 2026-08-31 — Welcome services consolidated

- **Baton:** Bee — 2026-08-31
- **Where it stands:** Collapsed the File Portal and Social onboarding screens into one readiness-aware services screen with two in-place handoff panels. Removed the old portal, account-confirmation, and calendar flows. Committed as `8f94c55` on `session/sp-plus-plan`; branch is pushed.
- **Gates:** SP+ VM evidence covers eight-screen/no-scroll bounds at 1280x800 and 1024x768, real CDP card/panel/link/close/Escape/backdrop clicks, public-host-only browser launch, deleted-ID search, and the theme round trip.
- **Build boundary:** No ISO or image build started. The installed VM was not reset.
- **Next move:** Christopher reviews the six VM captures and chooses whether to merge this lane onward.
- **Blocked on:** Real File Portal sign-in/upload and real Social account connection/post publication remain outside Welcome and were not exercised.
- **Tried and rejected:** Keeping service administration inside Welcome. The new page only explains the services and hands off to their public sites.

## 2026-08-28 — Calm live contrast and pinstripe trial closed

- **Baton:** Bee — 2026-08-28
- **Where it stands:** Source trial is ready on `session/sp-plus-plan`: dark focused window edge is lighter blue `#76B4D4`; unselected edge is dark coral `#C4462E`; solid pinstripe is 3px; glow rows remain unchanged. Light mode has the same 3px geometry with warm active/inactive edge colors. Source was pushed to the running VM user theme and applied from the VM desktop terminal.
- **Gates:** `projects/sp-plus/theme/tools/validate-spplus-calm.sh` PASS 13/13; `git diff --check` PASS; `org.kde.kwin.aurorae.v2` remains in both look-and-feel defaults. Host framebuffer evidence was captured for the inverse behavior and 3px stripe.
- **Build boundary:** No image or ISO build. `fedora-test35` was not rebooted, reset, or destroyed. The trial is not visually approved; Christopher reported that the result still looked substantially unchanged.
- **Next move:** Christopher judges the current VM/screenshot. If rejected, make one focused visual correction to the source, push, apply in the VM terminal, and capture new framebuffer evidence. If accepted, update the evidence notes, then coordinate Tom for the image build.
- **Blocked on:** Visual acceptance. `THEME-APPROVED.md` and `THEME-APPROVED.DONE` are intentionally not present.
- **Tried and rejected:** A literal color swap alone did not make the pinstripe legible because the opaque rows matched the graphite ground. The current trial assigns behavior colors to the solid rows while preserving the glow ramp.

## 2026-08-28 — cycle36 runtime and desktop fixes implemented

- **Baton:** Bee — 2026-08-28
- **Where it stands:** Implemented FIX 1-7 in commit `be4ae98` on `session/sp-plus-plan`: full ICU plus Intl gate; Plasma 6.7 Aurorae v2 and first-login read-back/retry; literal wsdd hardening drop-in; `/etc/xdg/kscreenlockerrc`; Welcome close/exit behavior and live close gate; `lm_sensors`; Discover Flatpak/rpm-ostree launcher policy. FIX 8 was investigated from the real desktop session and did not reproduce, so no fix was added.
- **Gates:** `tests/cycle36-source-gate.sh` PASS; `tests/config-preflight.sh` PASS 13/13; shell/Python syntax and `git diff --check` PASS. Old installed VM field inspection intentionally FAILed on the pre-fix defects, proving the new checks surface them. Full report and sentinel are in `/home/chris/sp-plus-bee/`.
- **Build boundary:** No ISO or image build started. `fedora-test35` was not rebooted, reset, or reconfigured.
- **Next move:** Christopher decides when to build. After a rebuilt image exists, run the installed-system field gate as root, `tests/welcome-close-gate.sh` from the real desktop session, and inspect Discover/Calm visually.
- **Blocked on:** Post-fix image build and fresh installed-system verification.
- **Tried and rejected:** No FIX 8 polkit change; the real-session `firewall-config` launch remained normal, so the report records the SSH-context authorization error as a test artifact.

## 2026-08-27 — SP+ Calm KDE theme bundle added

- **Baton:** ClaudeBox — 2026-08-27
- **Where it stands:** Added committed theme-only candidate in `projects/sp-plus/theme/sp-plus-calm/` (commit `ed314a9`). It has Plasma 6 Global Theme light/dark packages, Plasma styles, complete color palettes, original Aurorae controls, Paper-Mono-Dark + JetBrains Mono defaults, GTK 3/4 bridge examples, native Breeze Qt fallback, and a logo-only 7680x4320 wallpaper. Research and the integration boundary are in `projects/sp-plus/theme/SPPLUS-CALM-RESEARCH.md` and `theme/sp-plus-calm/INSTALL-MANIFEST.md`.
- **Gates:** `projects/sp-plus/theme/tools/validate-spplus-calm.sh` passes 8/8; shell/Python syntax, desktop-file validation, and SVG XML validation pass. The 8K wallpaper was visually inspected from the generated preview.
- **Build boundary:** The active ISO/QEMU work was not touched. The modified `projects/sp-plus/images/kde/Containerfile` was deliberately left unstaged. No ISO build was started or changed by this lane.
- **Next move:** After the current ISO cycle is safe, ClaudeBox integrates the bundle in the image owner’s Containerfile, installs `paper-icon-theme` and `jetbrains-mono-fonts`, and runs the documented VM inspection gates for both themes, KWin Aurorae, Brave/GTK, lock/unlock, and HiDPI.
- **Blocked on:** Plasma 6 VM validation and image integration. The theme bundle is complete as a source artifact, not yet installed in the ISO.
- **Tried and rejected:** Reusing or modifying the existing Windows Modern bundle; the new candidate is isolated to avoid the active ISO/theme lane. A custom lockscreen and third-party Qt widget fork were rejected as update-sensitive; native Plasma/Breeze fallback is safer until VM evidence exists.

## 2026-08-26 — SP+ help documentation added

- **Baton:** Bee — 2026-08-26
- **Where it stands:** Added `projects/sp-plus/knowledge/START-HERE.md`, a plain-English master help guide with a task and symptom index, installation and first-day checklist, everyday work, safety, updates, troubleshooting, Assistant/support guidance, evidence-report guidance, and glossary. Added `projects/sp-plus/docs/SP-PLUS-HELP-DESIGN.md` with the beginner-distro research, source links, information-architecture decisions, article standard, and claim-safety rules.
- **Build boundary:** Only those two documentation files and this handoff changed. Existing build work and untracked `grafix/` files were left untouched.
- **Next move:** Wire `knowledge/START-HERE.md` into the PWA help navigation, then test the links and wording with a non-Linux advisor. Mark any test-only or not-yet-shipped feature in the UI before pilot use.
- **Blocked on:** PWA rendering and final feature availability. The help copy must not be treated as proof that a planned screen exists in the current test image.
- **Tried and rejected:** A single undifferentiated manual was not used as the only structure. The master guide is the front door, while focused articles remain the troubleshooting paths.

## 2026-08-26 — SP+ research complete, build begins next session

The `advisor-os` subproject is renamed **SP+** and now carries an eight-document planning
set at `projects/sp-plus/docs/`. **Start at `docs/08-BUILD-SESSION-HANDOFF.md`**; it is
written to be sufficient on its own.

Branch `session/sp-plus-plan` (unpushed), cut from `session/advisor-os-poc` at `48b033a`.

**Architecture of record.** Build SP+ as a bootc image derived from the official Fedora
Atomic Desktop bootc images (`quay.io/fedora/fedora-kinoite:44` for KDE,
`quay.io/fedora/fedora-silverblue:44` for GNOME, both verified `containers.bootc=1`), not
from the minimal `fedora-bootc` base. Install media is `image-builder --type
bootc-generic-iso` from a purpose-built `sp-plus-installer` container carrying Anaconda,
with the payload embedded via `--bootc-installer-payload-ref`. Anaconda is the installer
of record. Golden-image capture is rejected as a shipping mechanism.

**Three hard rules.** No out-of-tree kernel modules or custom kernel, so Fedora's signed
shim/GRUB/kernel give Secure Boot with zero MOK enrollment. The ISO never contains the
encryption secret: the advisor sets the LUKS2 passphrase in Anaconda, and the recovery key
plus TPM2 enrollment happen at first boot on their own machine. `--target-imgref` is
mandatory in the Anaconda `bootc` kickstart, because omitting it produces a fleet that
installs perfectly and silently never updates.

**Next action.** `sudo apt install -y podman buildah skopeo`, then Phase 0 of
`docs/03-ISO-BUILD-PLAN.md`. The first deliverable is an ISO that completes an Anaconda
install in QEMU under enforced Secure Boot (`OVMF_CODE_4M.secboot.fd` +
`OVMF_VARS_4M.ms.fd`, both present on Beelink), then the same ISO on the Dell laptop
Christopher has prepared. Gate 0.B is the Dell: Secure Boot enabled, no MOK screen.

**Calendar.** Fedora 45 GA is 2026-10-20. The F44→F45 migration is a scheduled rehearsal
run on the canary ring that week while the fleet is small, not a chore deferred (D28).

**Open, Christopher's call.** Whether Brave stays (Q1), RPM Fusion codecs (Q3), the
hardware matrix survey (Q6, start now — it takes calendar time), and whether the assistant
ships in v1 at all (Q11). None block Phase 0.

**Not done, deliberately.** 4.5 GB of superseded build artifacts under
`projects/sp-plus/artifacts/` are gitignored and left in place pending Christopher's call.
The branch is unpushed. CT105's backbone still owes a dated entry for the rename; source
material is `projects/sp-plus/docs/RENAME-LOG-2026-08-25.md`.

---

## Prior handoffs

Earlier entries are preserved in git history and in
`projects/sp-plus/docs/SESSION-LOG-2026-08-25.md`.
