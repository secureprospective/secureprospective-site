# Works

Verified techniques that pass a gate. Use this format for every entry:

```text
### W-nn — <one-line statement of the technique>
- **Verified:** <date> on <environment: host, QEMU config, or hardware>
- **Artifact:** <image tag @sha256 digest, or ISO name + sha256, or N/A with reason>
- **Evidence:** <the exact command run and the exact output that proved it>
- **Re-verify when:** <what change would invalidate this, e.g. "Fedora major version bump">
```

The `Re-verify when` field makes this survive a Fedora migration.

### W-01 — `--network host` fixes root Podman build DNS resolution
- **Verified:** 2026-08-26 on Beelink `com`, LMDE 7, root Podman build
- **Artifact:** `localhost/sp-plus-kde:spike@sha256:da47edacbf5f4759f7b8613f0548ea8f583f530123de3aa7536a087a8a21c6fe`
- **Evidence:** `sudo podman build --network host -t sp-plus-kde:spike -f projects/sp-plus/images/kde/Containerfile projects/sp-plus/`; exact output included `Checks passed: 10`, `Warnings: 3`, `COMMIT sp-plus-kde:spike`, and `Successfully tagged localhost/sp-plus-kde:spike`.
- **Re-verify when:** Fedora major version bump, Podman/network backend change, or repository mirror configuration change.

### W-02 — Installer container builds from the current Fedora 44 generic-ISO layout
- **Verified:** 2026-08-26 on Beelink `com`, LMDE 7, rootless Podman build
- **Artifact:** `localhost/sp-plus-installer@sha256:535e2c67196265d013cb7a55db37880a4fda77f4eea97468631479560604130b`
- **Evidence:** `podman build --network host -t localhost/sp-plus-installer -f projects/sp-plus/installer/Containerfile projects/sp-plus/installer`; exact output ended `Successfully tagged localhost/sp-plus-installer:latest` and printed image ID `33bbab43c8110855c6b29bc0840ee8e97a20a9b99ad059c7bd53fe642fdf2c50`.
- **Re-verify when:** Fedora major version bump, Anaconda/image-builder layout change, or the installer Containerfile changes.

### W-03 — Direct kernel boot as the diagnostic escape hatch

Extract vmlinuz+initrd from the ISO with `osirrox` and boot QEMU with `-kernel`/`-initrd`/`-append`. Full cmdline control, serial-captured output, no bootloader UI. Confirmed 2026-08-26: turned a silent hang into a one-line root cause. Script: `~/work/sp-plus/iso/t-direct.sh` (and `t-direct2.sh`, its A/B twin).
