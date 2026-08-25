# First-pass QEMU acceptance

## Preconditions

- `./scripts/build-iso.sh` produced `artifacts/iso/advisor-os-installer.iso`, or `./scripts/build-qcow2.sh` produced `artifacts/qcow2/disk.qcow2`.
- QEMU, OVMF, and swtpm are installed.
- The host has `/dev/kvm`; if not, the runner reports that it is using TCG.
- The qcow2 artifact is suitable for boot and service smoke tests only. It does not prove an encrypted installation. The encryption gate requires completing the ISO installer with LUKS2 enabled and recording the result.

## Test sequence

1. Boot the artifact with UEFI and a virtual TPM.
2. Complete the installation if using the ISO. Use the test account documented by the runner only for this disposable VM.
3. Confirm KDE reaches a usable desktop.
4. Open Brave. Confirm the managed start page is the Advisor PWA at `http://127.0.0.1:8765/`.
5. Open **Printer help**. Confirm the page describes a failed fixture printer without exposing paths, usernames, or credentials.
6. Select **Diagnose**. Confirm the displayed request contains only an allowlisted technical snapshot.
7. Confirm remediation is unavailable until approval is explicitly selected.
8. Select **Approve reconnect** and then **Reconnect printer**.
9. Confirm the PWA reports a successful fixture reconnect and test-page verification.
10. Generate the evidence record. Confirm it contains event type, timestamp, sanitized request, approval, playbook digest, verification result, and no secrets.
11. Reboot once and confirm the immutable system and local service return.

## Pass criteria

- No terminal is needed.
- The ISO boots through UEFI and presents the Advisor OS installer entry. This was verified in the first pass.
- A completed LUKS2 installation is separately recorded before claiming the encrypted-install gate passed.
- A failed printer is explained in plain language.
- The cloud boundary is visible and sanitized.
- The action requires approval and passes playbook integrity verification.
- The test page is verified.
- The evidence JSON can be read and contains no credentials or raw paths.

## Explicit non-coverage

QEMU does not validate Wi-Fi, Bluetooth, webcams, physical printers, laptop suspend behavior, or broad hardware support. Those require a later hardware matrix pass.
