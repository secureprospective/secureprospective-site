# Handoff

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
