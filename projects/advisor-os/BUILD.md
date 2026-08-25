# Build notes

## Toolchain

- Fedora bootc 43 payload, pinned by major release for this pass.
- Podman for bootable-container storage and privileged image-builder execution.
- `ghcr.io/osbuild/image-builder-cli:latest` for qcow2 and generic ISO assembly.
- QEMU/KVM, OVMF, and swtpm for local validation.

The host currently has QEMU, OVMF, swtpm, and Docker. The documented bootc image-builder flow uses Podman because image-builder reads the local `containers/storage`; Docker's image store is not interchangeable. The scripts fail with an actionable message if Podman is missing rather than silently switching stores.

## Artifact order

1. Build and test the runtime/PWA on the host.
2. Build the bootable payload container.
3. Build a qcow2 disk for fast QEMU iteration.
4. Build the generic bootc installer ISO.
5. Boot the artifact with UEFI and a virtual TPM.
6. Run the printer acceptance flow.

## No secret handling

The payload contains no cloud credentials. A live AI endpoint is supplied only at runtime through a local environment file or future secret mechanism. Do not bake it into a Containerfile, image layer, QEMU command line, or Git history.

## Known build gate

The generic ISO requires an Anaconda installer container and a payload image in the same Podman storage. If either image-builder or Podman is unavailable, the qcow2/ISO scripts stop before modifying host state. This is an environment prerequisite, not a product failure.
