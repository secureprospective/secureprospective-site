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
