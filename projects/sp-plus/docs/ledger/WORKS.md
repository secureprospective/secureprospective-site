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

Empty by design. The first entry is written when Spike A passes its gate.
