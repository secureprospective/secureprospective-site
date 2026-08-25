# Advisor OS proof of concept

This is the first build-test pass for Secureprospective Advisor OS. It is a build subproject, not a branding exercise.

## First-pass boundary

- One shared immutable Fedora bootc base.
- KDE Plasma only.
- Brave policy and a local Advisor PWA.
- A narrow local RPC adapter for the Pi Advisor runtime boundary.
- Markdown help content.
- One printer diagnosis, approval, remediation, verification, and evidence workflow.
- QEMU validation on x86_64.

GNOME, portal eligibility, MSP control-plane work, physical hardware certification, production signing, and compliance mappings are out of scope for this pass.

## Repository layout

```text
projects/advisor-os/
├── Containerfile                 # bootable KDE payload
├── installer/Containerfile      # generic bootc ISO installer environment
├── config/                       # Brave and systemd policy
├── knowledge/                    # canonical Markdown help
├── playbooks/                    # narrowly scoped remediation definitions
├── pwa/                          # static PWA served on localhost
├── runtime/                      # policy-enforcing RPC/PWA service
├── scripts/                     # build, run, and test entry points
└── tests/                       # host-side deterministic tests
```

## Important POC limitations

- The cloud-AI call is provider-neutral and opt-in through `ADVISOR_AI_ENDPOINT`. Without an endpoint, the deterministic test provider is used so acceptance tests are repeatable.
- The QEMU printer is a fixture. It models a failed printer and a reversible reconnect; physical IPP/CUPS testing comes after this pass.
- Playbooks use a checked-in SHA-256 trust manifest for this pass. A signed release key and verification chain are required before production use.
- The generated qcow2 is a disposable boot smoke artifact and is not the encrypted install acceptance result. The ISO installer path is built and reaches its GRUB menu; LUKS2 installation still needs an interactive Anaconda run before this gate is called passed.
- The disposable QEMU image contains the test account `advisor` with password `advisor-poc`. Remove that account or replace it through the installer before any non-test use.
- The runtime is the Pi Advisor RPC boundary and profile scaffold. The unrestricted coding-agent surface is not shipped into the image.

Never put API keys, recovery keys, signing private keys, client data, or real printer credentials in this directory.

## First commands

From this directory:

```bash
./scripts/test-host.sh
./scripts/build-container.sh
./scripts/build-qcow2.sh
./scripts/build-iso.sh
./scripts/run-qemu.sh
```

`build-qcow2.sh` and `build-iso.sh` require Podman and the unified `image-builder` container. They run privileged because image assembly needs loop devices and mounts. QEMU uses KVM when available and falls back to TCG.

## Acceptance test

The acceptance sequence is documented in `docs/ACCEPTANCE.md` at the repository root of this subproject. Passing means the PWA can diagnose the fixture, display the sanitized AI request, require approval, run the integrity-checked reconnect playbook, verify the fixture test page, and emit a readable evidence record without a terminal.
