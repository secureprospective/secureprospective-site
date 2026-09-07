# HANDOFF — SP+ Butterknife/Cinnamon research

**Baton:** ClaudeBox — 2026-09-07

**Where it stands:** Butterbian and Butterknife research is recorded in `projects/sp-plus/docs/09-BUTTERBIAN-BUTTERKNIFE-TRIAGE.md` and `projects/sp-plus/docs/10-BUTTERKNIFE-CINNAMON-AUDIT.md`. Butterbian-XFCE is now a developer/reference environment, not the SP+ desktop. Butterknife Cinnamon is installed in the disposable `debian13-Buttertest` VM and was audited read-only. The Beelink Graphite-One theme was copied into the VM and applied for visual evaluation. No SP+ implementation was changed.

**Next move:** Run the dedicated UEFI/Secure Boot plus virtual-TPM Butterknife Cinnamon test, then test recovery-key enrollment, snapshot boot, and permanent restore in a disposable guest.

**Blocked on:** The documented host verification currently fails in the pre-existing runtime test `test_tampered_playbook_is_blocked`: expected `integrity`, received `that approval is not recognised`. No code in this session caused or fixed that failure.

**Tried and rejected:** XFCE as the primary SP+ desktop was rejected after hands-on evaluation; Butterbian code, branding, and configuration reuse was rejected pending licensing and because its fail-open snapshot hooks and unproven TPM/Secure Boot behavior do not meet SP+ requirements. Snapshot boot was not treated as permanent rollback.
