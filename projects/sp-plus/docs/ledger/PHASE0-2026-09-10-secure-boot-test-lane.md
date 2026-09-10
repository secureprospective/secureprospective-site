# Phase 0 — the Secure Boot test lane

**Built and verified 2026-09-10.** Branch `session/sp-plus-defense-in-depth`.
Doc 15 §6 is the specification. This file is the evidence.

## Why this had to come first

Until today the SP+ test VM booted `OVMF_CODE_4M.fd` + `OVMF_VARS_4M.fd` — firmware with no
Secure Boot and no TPM. Four security properties were therefore **untestable**, and their absence
was repeatedly mistaken for a defect in the product:

| Property | Measured on alpha4 before Phase 0 | What it actually meant |
|---|---|---|
| `mokutil --sb-state` | `This system doesn't support Secure Boot` | the VM, not the image |
| `/sys/kernel/security/lockdown` | `[none]` | Fedora enables lockdown *under Secure Boot*; there was none |
| `module sig_enforce` | `N` | same cause |
| TPM 2.0 | absent | `--tpm none` in the harness |

A lane that cannot boot securely cannot report honestly on any of them.

## What changed

Both files now live in the repo at `projects/sp-plus/tests/` and are symlinked from
`~/fleet/bin/` on the Beelink, so every existing caller keeps working and the harness travels
to main with the work it tests.

### 1. Secure Boot firmware and a vTPM, applied after install

`spplus-testvm.sh secboot [name]` converts a domain to `OVMF_CODE_4M.ms.fd` +
`OVMF_VARS_4M.ms.fd` (Microsoft KEK and db already enrolled), turns on SMM, and attaches an
emulated TPM 2.0. `install` calls it automatically unless `SECBOOT=0`.

**It is a post-install step for a reason, and the reason is not cosmetic.** `do_install` boots
the installer by direct kernel load. Under enforcing Secure Boot the firmware verifies that
kernel against db, and db holds Microsoft's keys — but Fedora's kernel is signed by Fedora's key,
which lives in shim's vendor certificate, not in db. A direct-kernel install therefore cannot
boot with Secure Boot on. The **installed** system boots the real chain, shim (signed by
Microsoft) to grub to kernel (both verified by shim), which is exactly what a Dell does.

Two details that silently break this if omitted:

- **`enrolled-keys` must be `yes`.** With `secure-boot` alone the machine comes up in Setup Mode
  and reports Secure Boot disabled.
- **SMM must be on.** Without it the varstore is writable from the guest and the guarantee is
  theatre.

### 2. Two real defects in `up`, found by using it

The first was known. The second was hiding behind it.

- **The LUKS passphrase went to the serial console.** SP+ draws its unlock prompt on the
  graphical console under Plymouth (`rhgb quiet`, no serial console defined), so the passphrase
  typed into nothing, sshd never started, and the VM looked hung. `up` now sends keystrokes to
  the video console via `vmunlock`, on a bounded timer, because there is no way to see the prompt
  from the host.
- **The SSH readiness probe offered no identity.** No `-i`, so it could only ever offer the
  default keys and could never succeed. `up` reported *"SSH never came up"* on a VM that was
  fully up — which is how the same symptom read a second time, after the LUKS half was fixed.
  Measured directly: the probe timed out at 600 s, and the posture gate connected to the same VM
  seconds later and passed 22 of 22.

## The gate

Four assertions added to `tests/runtime-posture-gate.sh`, so the harness can no longer lie by
omission — a lane that cannot boot securely now fails loudly instead of quietly measuring
nothing.

```
  PASS  secure boot enabled                    SecureBoot enabled
  PASS  kernel lockdown active                 none [integrity] confidentiality
  PASS  module signature enforced              sig_enforce=Y
  PASS  tpm 2.0 present                        tpm0 version 2
```

**Mutation-tested red before green, per D46.** The firmware was reverted to the non-secboot pair,
the VM rebooted, and the gate re-run against the same machine:

```
passed=18 failed=4     <- firmware reverted
  FAIL  secure boot enabled                    This system doesn't support Secure Boot
  FAIL  kernel lockdown active                 [none] integrity confidentiality
  FAIL  module signature enforced              sig_enforce=N
  FAIL  tpm 2.0 present                        <no tpm0>

passed=22 failed=0     <- firmware restored
```

Exactly the four new assertions moved. The other eighteen held in both directions, which is the
control that makes the result mean something.

## Day one, unaffected

Verified on the converted VM:

| Check | Result |
|---|---|
| Boot chain | `shimx64.efi` → GRUB → `SP+ 1 (20260910)`, no MOK prompt, no user interaction |
| Graphical login | Plasma Login Manager renders the branded SP+ login screen (screenshot captured) |
| Failed units | 0 |
| CUPS, Avahi, NetworkManager | all active |
| Brave | `brave-browser-1.94.119-1.x86_64` present |
| Unattended boot to SSH | 73 s, repeatable across three cycles |

## What Phase 0 does not prove

- It proves the **lane** can measure Secure Boot. It does not prove SP+ boots on a real Dell with
  vendor firmware, only that it boots the same shim chain under enrolled Microsoft keys.
- `bootctl` reports `✗ Loader reports active TPM2 PCR banks` — the vTPM exists and PCRs are
  readable, but nothing yet measures into it or seals to it. No TPM-backed claim is available
  from this, and none should be made.
- The install path itself still runs with Secure Boot off. Converting afterwards is correct for
  the reason given above, but it means an ISO's *installer* is not covered by this lane.
