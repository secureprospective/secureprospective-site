# SP+ first build-test session log

Date: 2026-08-25
Branch: `session/sp-plus-poc`

## Objective

Create the first functional SP+ build-test pass with minimal branding: one KDE immutable Fedora bootc payload, Brave/PWA surface, narrow SP+ RPC boundary, Markdown printer help, one reversible printer workflow, and QEMU build/boot paths.

## Work completed

1. Read and accepted the build brief as the scope baseline.
2. Located `work/secureprospective-site` as the Secureprospective Git repository. Its active page-transition branch was left untouched. A separate worktree and branch were created from `origin/main`.
3. Added `projects/sp-plus/` with:
   - Fedora 43 bootc KDE `Containerfile`.
   - Brave RPM installation and managed policy.
   - Local Python RPC/PWA service with an allowlisted method set.
   - Sanitized printer snapshot and optional provider-neutral AI endpoint.
   - Deterministic test provider for repeatable tests.
   - Markdown printer help.
   - Approval-gated printer reconnect playbook.
   - SHA-256 trust manifest and tamper-blocking test.
   - Static PWA with diagnosis, approval, remediation, verification, and JSON evidence export.
   - Generic bootc ISO installer container definition.
   - Host tests, runtime smoke tests, image-builder wrapper, QEMU runner, and acceptance documentation.
4. Built the KDE bootable payload with Docker. Docker was used because Podman is not installed on this machine.
5. Built a Fedora bootc qcow2 with the unified `image-builder` container. The image-builder container was run privileged with the host loop devices passed through and the Docker payload archive loaded into its internal Podman store.
6. Built a generic bootc installer ISO after correcting current Fedora/image-builder compatibility issues.
7. Boot-tested the qcow2 in QEMU with UEFI, KVM, OVMF, and swtpm. The system reached graphical.target and started CUPS, firewalld, SDDM, and `sp-plus.service`.
8. Boot-tested the ISO in QEMU with UEFI. Its GRUB menu presented `Install SP+ POC`.
9. Ran host unit tests, playbook verification, RPC smoke, installed-image HTTP/PWA smoke, and the complete printer workflow against the installed image.
10. Committed and pushed the project branch. The project handoff now belongs to ClaudeBox.

## Important findings and fixes

- The host has QEMU, qemu-img, OVMF, swtpm, Docker, and `/dev/kvm`; it does not have Podman, bootc, mkosi, lorax, or a host image-builder binary.
- The documented image-builder flow expects Podman container storage. Docker's store was not treated as interchangeable. The working fallback is Docker build/save followed by `ghcr.io/osbuild/image-builder-cli:latest` with an internal Podman store.
- Direct Docker `bootc install to-disk --via-loopback` was attempted. It first lacked loop devices, then failed with a root partition type mismatch after loop devices were passed through. That route was abandoned in favor of image-builder.
- The current Fedora installer image stores EFI files under `/usr/lib/bootupd/updates/EFI`, not the older `/usr/lib/efi/*/*/EFI` path from the reference example.
- The installer image needed `--bootc-default-fs ext4`; without it image-builder reported missing `DefaultRootFs`.
- The installer build needed `ln -sf` because Fedora already provided `autovt@.service`.
- Debian's OVMF package provides `/usr/share/OVMF/OVMF_CODE_4M.fd` and `OVMF_VARS_4M.fd`; the QEMU runner uses those defaults.
- image-builder writes versioned artifact directories. The build scripts normalize them to `artifacts/qcow2/disk.qcow2` and `artifacts/iso/sp-plus-installer.iso`.
- The local Advisor service binds to guest loopback by design. A QEMU host-forward experiment therefore did not reach it and is not counted as a passing guest/PWA test.
- The qcow2 is a disposable boot/runtime smoke artifact, not proof of encrypted installation. The ISO reaches GRUB, but interactive Anaconda installation with LUKS2 remains the next gate.

## Verification record

- `./scripts/test-host.sh`: passed, 3 tests.
- `./scripts/verify-playbook.sh`: passed.
- `./scripts/test-rpc.sh`: passed.
- Python compilation and Bash syntax checks: passed.
- Installed-image PWA/RPC printer workflow: passed.
- QEMU qcow2 UEFI/KVM/swtpm boot: passed; `sp-plus.service` reached started state.
- QEMU ISO UEFI/GRUB boot: passed.
- Interactive LUKS2 installation: not yet run.
- Brave graphical PWA acceptance inside the installed VM: not yet run.

## Next action

Use the graphical QEMU ISO runner with a disposable install disk. Complete the Anaconda install with LUKS2 enabled, record the unlock/reboot result, then verify Brave opens `http://127.0.0.1:8765/` and complete the printer acceptance sequence without a terminal.

## Do

- Keep the project on its own branch/worktree.
- Use Docker plus the image-builder container until Podman is deliberately installed.
- Use the deterministic AI provider for acceptance tests and keep live AI behind `SPPLUS_AI_ENDPOINT`.
- Treat Markdown as knowledge source, not as the enforcement boundary.
- Keep the printer fixture disposable and clearly separate from physical IPP testing.
- Record encryption and graphical acceptance separately from boot/service smoke.

## Do not

- Do not claim LUKS2 acceptance passed until Anaconda installation and reboot/unlock are actually tested.
- Do not bake real AI credentials, recovery keys, signing private keys, client data, or printer credentials into the image or repository.
- Do not expose arbitrary shell/file-edit capability through the SP+ RPC service.
- Do not treat the checked-in SHA-256 trust manifest as production signing.
- Do not treat QEMU as hardware certification for Wi-Fi, Bluetooth, webcams, suspend, or physical printers.
- Do not edit the other agent's page-transition worktree or the pre-existing dirty `~/.pi` settings/cache files.
