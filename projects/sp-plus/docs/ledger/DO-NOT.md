# Do Not

Greppable record of approaches proven not to work. Every entry has an error signature so a future engineer can find it by searching the observed failure.

### DN-01 — Never use Docker anywhere in the SP+ build path
- **Error signature:** `image-builder` cannot read the Docker image store; the Docker-built image is not available in Podman's `containers/storage`.
- **Why:** image-builder reads Podman's `containers/storage`, while Docker maintains a separate image store. The detour cost most of the 2026-08-25 session and creates a divergent build path.
- **Do instead:** Use Podman; delete the Docker path rather than keeping a fallback.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part I, item 3; docs/08-BUILD-SESSION-HANDOFF.md §6
- **Status:** PROVEN

### DN-02 — Never use `OVMF_VARS_4M.fd` for a Secure Boot test
- **Error signature:** The VM boots unsigned or broken-boot-chain content and reports a confident Secure Boot pass because no keys are enrolled.
- **Why:** the plain variable store enrolls nothing, so it does not enforce the Microsoft-signed Secure Boot chain.
- **Do instead:** Use a writable per-VM copy of `OVMF_VARS_4M.ms.fd` paired with `OVMF_CODE_4M.secboot.fd` and `-machine q35,smm=on`.
- **Source:** docs/08-BUILD-SESSION-HANDOFF.md §3
- **Status:** PROVEN

### DN-03 — Never omit `--target-imgref` from the Anaconda bootc kickstart
- **Error signature:** The machine installs perfectly and silently never updates.
- **Why:** `--source-imgref` alone identifies the installer source, not the installed system's update target; the omission can remain unnoticed for weeks.
- **Do instead:** Provide both `--source-imgref` and `--target-imgref`.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part II, #29; docs/08-BUILD-SESSION-HANDOFF.md §5
- **Status:** PROVEN

### DN-04 — Never let `selinux=0` leak from the installer into the installed system
- **Error signature:** `getenforce` reports `Disabled` on the installed system.
- **Why:** `selinux=0` is an installer-side workaround in the upstream image-builder example, not an installed-system setting. SP+ must remain SELinux enforcing (D22).
- **Do instead:** Keep `selinux=0` confined to the installer workaround, if needed, and verify the installed system is enforcing.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part II, #34; docs/08-BUILD-SESSION-HANDOFF.md §5
- **Status:** PROVEN

### DN-05 — Never build the desktop from the minimal `fedora-bootc` base
- **Error signature:** NOT-YET-OBSERVED
- **Why:** The minimal base requires assembling the KDE desktop by hand, recreating integration maintained by Fedora's official Atomic Desktop images.
- **Do instead:** Use `quay.io/fedora/fedora-kinoite:44`, which carries `containers.bootc=1` and `ostree.bootable=true` and is rebuilt daily.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part I, item 1; docs/08-BUILD-SESSION-HANDOFF.md §6
- **Status:** PREDICTED

### DN-06 — Never mix Podman's ROOTLESS and ROOT image stores in one build
- **Error signature:** image-builder reports the image reference cannot be found despite `podman images` listing it.
- **Why:** On this host, `podman info` as `chris` reports GraphRoot `/home/chris/.local/share/containers/storage` (rootless), while `sudo podman` uses `/var/lib/containers/storage` (root). The image-builder invocation in `docs/03-ISO-BUILD-PLAN.md` §2.2 bind-mounts the ROOT store, so a rootless-built image is invisible to it.
- **Do instead:** Build with `sudo podman build` so the image lands in the root store that image-builder reads, and state which store you used in every ledger entry.
- **Source:** Dated host verification run, 2026-08-26; docs/03-ISO-BUILD-PLAN.md §2.2
- **Status:** PREDICTED

## Candidates from the postmortem

See docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part II. Anti-patterns get promoted into this file with a DN number when a run actually proves them, not in bulk.
