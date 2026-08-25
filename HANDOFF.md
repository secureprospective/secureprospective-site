# Handoff

- **Baton:** ClaudeBox, 2026-08-25
- **Where it stands:** `projects/advisor-os/` contains the first KDE Fedora 43 bootc payload, Brave policy, local Advisor RPC/PWA, Markdown printer help, integrity-checked printer playbook, QEMU scripts, qcow2 artifact path, and generic bootc ISO path. Host tests, installed-image functional smoke, qcow2 UEFI/KVM/swtpm boot, and ISO UEFI/GRUB boot passed. The encrypted-install gate is still open.
- **Next move:** Run the interactive LUKS2 installation test in QEMU with `QEMU_MODE=iso ./projects/advisor-os/scripts/run-qemu.sh`, then verify Brave opens the PWA and complete the printer workflow without a terminal.
- **Blocked on:** Interactive graphical Anaconda/LUKS2 installation and the loopback test path for the local-only RPC service. Podman is absent; Docker plus the image-builder container is the working build path for now.
- **Tried and rejected:** Direct Docker `bootc install to-disk` was rejected after loop-device/root-partition-type failures. The host Docker image store was not treated as interchangeable with Podman storage; the image-builder container's internal Podman store is used instead. The QEMU host-forward experiment was not counted as passing because the service intentionally binds to guest loopback.
