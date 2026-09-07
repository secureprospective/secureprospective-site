# HANDOFF — SP+ platform direction

**Baton:** ClaudeBox — 2026-09-07

**Where it stands:** `projects/sp-plus/docs/11-PLATFORM-DIRECTION-AND-DEBIAN-ARCHITECTURE.md` is the concise controlling direction. Fedora/KDE remains the immediate SP+ product and proving ground. Debian 13 Trixie/Cinnamon is the deliberate long-term distribution path: stock signed boot chain, live installer, LUKS2, Btrfs/Timeshift, controlled mutability, curated stable application profile, and bounded Fin/AI. Butterknife remains a licensed-and-supply-chain-gated reference, not an implementation dependency. No SP+ product code changed.

**Next move:** Run Debian Gate A only: a disposable UEFI/Secure-Boot live-install test without TPM. Prove LUKS2 passphrase and recovery key, Btrfs snapshot boot, permanent restore, and no firmware change or MOK enrollment. Do not add TPM until Gate A passes.

**Blocked on:** The documented host verification currently fails in the pre-existing runtime test `test_tampered_playbook_is_blocked`: expected `integrity`, received `that approval is not recognised`. No code in this session caused or fixed that failure.

**Tried and rejected:** XFCE as the primary SP+ desktop; global Mint repositories on Debian; Testing/Forky/Sid mixing or APT pinning for a newer desktop; Butterbian code, branding, configuration, and `butterrepo` reuse without review; fail-open snapshots as a recovery guarantee; calling local snapshots backups or bootc-equivalent rollback; combining TPM with the base installer/recovery test.
