# SP+ — Defense-in-Depth Roadmap

**Document 15 of the SP+ planning set.**
Status: plan, 2026-09-10. Decision owner: Christopher.
**This document authorizes nothing.** Every phase below begins only on Christopher's approval.

Inputs: `14-THREAT-MODEL.md`, `ledger/POSTURE-2026-09-10-alpha4.md` (measured, not inferred),
`ledger/SECUREBLUE-INVENTORY-2026-09-10.md` (leads, triaged).
Origin: YouTux Channel, *Don't Give Me Another "Secure" Linux Distro*, researched into
`fleet/inbox/wiki-secure-linux-distro-defense-in-depth-research.md` on 2026-09-10.

---

## 0. The three rulings that shape everything below

Christopher, 2026-09-10:

1. **Fedora bootc only.** Debian is parked. This also happens to be where the reference
   implementations are: Secureblue is Fedora Atomic, so nearly every control here has a working
   example on our own base.
2. **Nothing may break day one.** Any control that breaks printing, printer discovery, Wi-Fi,
   Brave, PWAs, audio, camera, microphone, suspend and resume, external display or Bluetooth is
   **rejected outright**, however strong it is. Not negotiated. Rejected.
3. **Brave is fixed** for this lane. Harden around it. Q1 and Q17 stay open on their own clock.

Ruling 2 does most of the sorting in this document. It is also the correct ruling: doc 01
principle 1 says a security control that breaks printing will be uninstalled by the user, at
which point it protects nothing.

## 1. Where SP+ actually stands

Measured on alpha4, 2026-09-10. Layer numbering follows the research document.

| Layer | State |
|---|---|
| 1 Trust and supply chain | **Broken in one specific way.** Signing happens; verification does not exist on the machine |
| 2 Build hardening | Unstarted. SP+ inherits Fedora's flags and rebuilds nothing |
| 3 Kernel | Unstarted. SP+ ships exactly one sysctl file and it is a zram performance tune |
| 4 Privilege | Partial. Good network hygiene, measured by the posture gate. SP+'s own service scores 7.7 EXPOSED and runs unconfined |
| 5 Compartmentalization | None, and deliberately so |
| 6 Application confinement | Weak. Brave unconfined, Flathub unfiltered |
| 7 Updates and recovery | **Strong**, and the best part of the product |
| 8 The user | **Strong**, and the reason SP+ exists at all |

**The spine of this work is `tests/runtime-posture-gate.sh`.** It exists because a build gate
grepped a config file, reported `WSDD_OK` on every build for weeks, and smbd was listening on
`0.0.0.0:445` the whole time. It measures effect rather than configuration text. It passes 18 of
18 on alpha4.

**Every control in this roadmap gets an assertion in that gate, mutation-tested red before
green.** A row without an assertion is a feature request, not a control, and does not ship.

## 2. Phase S — the signature hole

**This is separate from the tiers because it is the only finding that is actively dangerous
rather than merely weak, and because it should be built and verified alone.**

| | |
|---|---|
| **Threat** | T5. An attacker who can write the ghcr tag owns the fleet |
| **What is wrong** | `/etc/containers/policy.json` is stock `insecureAcceptAnything`. No key in `/etc/pki/containers`. No ghcr.io entry in `registries.d`. Zero signature references in 2,921 Containerfile lines |
| **Why it is not already fixed** | D13 records the policy as shipping. Only the signing half was built. Nobody measured the other half until now |
| **Reference** | Secureblue's `modules/secureblue-signing/policy.json`: default `{"type":"reject"}` with pinned `sigstoreSigned` exceptions |
| **Advisor-visible?** | No. Zero usability cost |
| **Gate** | On a fresh install: an image signed with the SP+ key applies; an unsigned image, and an image signed with a different key, are both **refused**, and the refusal is visible in `bootc` output rather than silent |
| **Posture assertion** | `policy.json` default is `reject`; the SP+ public key is present; a deliberately unsigned pull fails |
| **Owner** | Claude drafts, Christopher ratifies |

**The trap to design around before writing a line of it.** A fail-closed update path can brick
the fleet's ability to update if the key, the policy, or the publish lane disagree. The order
matters: ship the key and the policy in an image that is *itself* correctly signed and already
installed, prove verification works on a test machine, and only then rely on it. A machine that
cannot verify the next image stops updating; it does not stop working. That failure mode is
acceptable and must be the one that happens.

Rollback safety is what makes this affordable: if Phase S ships wrong, `bootc rollback` is the
escape, and it is already proven.

## 3. Tier 1 — invisible to the advisor

Ruling 2 cannot block any of these, because the advisor cannot perceive them. Most also feed the
Security Evidence Report, which is value proposition 2.2.

| # | Control | Threat | Mechanism | Posture assertion |
|---|---|---|---|---|
| T1.1 | `kernel.yama.ptrace_scope=1` | T8 | One line in a new `/usr/lib/sysctl.d/55-sp-plus-hardening.conf` | sysctl reads 1 |
| T1.2 | `kernel.kptr_restrict=2` | T8 | Same file | sysctl reads 2 |
| T1.3 | Kernel hardening sysctl set | T6, T8 | Port the non-colliding subset of Secureblue's `55-hardening.conf`: `net.core.bpf_jit_harden`, `kernel.kexec_load_disabled`, `fs.suid_dumpable=0`, `vm.unprivileged_userfaultfd=0`, `kernel.sysrq=0`, ICMP and reverse-path settings | each key reads its intended value |
| T1.4 | Close the sshd door | T6 | Decide whether sshd ships enabled at all; if it does, bind it to loopback and drop `ssh` from the firewalld public zone | no world-listener on 22 |
| T1.5 | Sandbox `sp-plus.service` | T3, T8 | systemd directives on SP+'s own unit. It scores 7.7 EXPOSED today and it is our code, so nothing upstream can break underneath it | `systemd-analyze security` score below an agreed threshold |
| T1.6 | Confine SP+'s services under SELinux | T3, T8 | Both run unconfined today. A minimal policy module for the RPC service and the help app | process contexts are not `unconfined_*` |
| T1.7 | Trim the enabled unit surface | T6 | `systemd-homed`, `sssd`, NFS and remote-* targets, `pcscd`, `smartd`, `lvm2-monitor`, `qemu-guest-agent` and `vmware-user-suid-wrapper` are enabled or present on a single-user advisor laptop for no stated reason | named units absent or masked |
| T1.8 | Disable coredumps | A1 | `kernel.core_pattern`, limits drop-in, systemd `DumpCore=no`. A coredump of Brave contains client PII in plaintext | core_pattern is the null handler |
| T1.9 | Supply-chain evidence | T5, A4 | SBOM and provenance per image; base digest, source revision and toolchain recorded per release; a written key rotation and compromise procedure; a plain statement of what is not covered | release artifact exists per build |
| T1.10 | SUID and capability inventory as evidence | T8 | Enumerate and record in the evidence report. **Removal is Tier 3** | inventory matches an approved allowlist; a new SUID binary fails the gate |

T1.4 is a decision, not a default. sshd is development convenience currently shipping to
production. If remote support later needs it, that is a designed feature with its own gate, not
an open port left behind.

T1.10 is deliberately inventory-only. Watching the list for unexpected changes is most of the
value and carries none of the risk of removal.

## 4. Tier 2 — real gain, must be measured before it is promised

Each of these can break something an advisor uses. None is rejected. Each needs a rig test and
then a Dell test before it enters the plan of record.

| # | Control | Threat | What must be proven first |
|---|---|---|---|
| T2.1 | SELinux confinement for Brave | T3 | Secureblue confines Trivalent; a Brave equivalent must be written. Test against real carrier portals, every installed PWA, printing from the browser, file downloads and uploads, camera and microphone in a video call |
| T2.2 | Flathub `--subset=verified` and a permission baseline | T3, T4 | Nothing is installed today, so this is cheap now and expensive later. Prove every application SP+ intends to ship is available in the verified subset **before** switching the remote |
| T2.3 | System DNS over TLS with DNSSEC | T6 | Brave already does DoH; the rest of the machine is plaintext. The blocker is captive portals — hotel and airport Wi-Fi is where advisors work. A tested captive-portal path is the gate, not an afterthought |
| T2.4 | Kernel argument hardening | T3, T8 | Secureblue's `init_on_alloc`, `init_on_free`, `randomize_kstack_offset`, `slab_nomerge`, `vsyscall=none`, `pti=on`. **Exclude `mitigations=auto,nosmt`**, which Secureblue documents as costing up to about 40% on parallel work. Test suspend and resume, Wi-Fi, audio, external display and boot time |
| T2.5 | ~~`hardened_malloc`, scoped~~ **superseded 2026-09-11 — see §4a** | T3 | Dropped on measurement. It is in none of the four repositories SP+ ships. What ships instead is `glibc.malloc.tcache_count=0`, which is smaller and honest |
| T2.6 | Login and password hardening | T9 | `faillock`, `pwquality`, `UMASK 027`. Weigh against a non-technical advisor locking themselves out, which is a support call SP+ pays for |
| T2.7 | MAC randomization | T6 | Secureblue documents USB Ethernet adapters failing to connect. Test the Dell's built-in adapter and any dock |

### 4a. T2.5 superseded — what was measured and what ships instead

Decided 2026-09-11. Full measurement in `docs/ledger/PHASE-T25-2026-09-11-hardened-malloc.md`.

`hardened_malloc` is in **none of the four repositories SP+ ships.** Secureblue builds it in
their own COPR, so taking it means trusting a fifth repository — a statement about what SP+
vouches for, not an implementation detail. Two further facts weigh against it. Secureblue's own
tracker records that the configuration which *enables* the allocator is not inside their RPM, so
installing the package does not turn it on. And the documented breakage class is Electron, which
here means Brave, Zoom and Signal: most of an advisor's working day.

Before that went up for decision, the in-repo alternative was measured on a booted image at
glibc 2.43. Two of the three candidate tunables are **inert**:

| Tunable | Verdict |
|---|---|
| `glibc.malloc.check=3` | Inert. `ld.so --list-tunables` reports it as set. The implementation moved into `libc_malloc_debug.so` in glibc 2.34 and that library is not in the image. A deliberate heap overflow behaved identically set and unset |
| `glibc.malloc.perturb` | Inert, same reason |
| `glibc.malloc.tcache_count=0` | **Real**, proven by a changed abort path rather than a config read |

**What ships is `glibc.malloc.tcache_count=0`, across three layers** — `/etc/environment` for
pam_env logins, `/usr/lib/environment.d/` for the systemd user manager that the Plasma session
and therefore Brave inherit, and `DefaultEnvironment` for system services.

**Say what it is, and is not.** It removes the per-thread cache, and with it tcache poisoning,
one of the most commonly used heap primitives against an attacker who already has a
use-after-free or a double free. It gives **none** of `hardened_malloc`'s guard pages,
randomised allocation, isolated size classes or delayed reuse. The Security Evidence Report must
carry that sentence, not a feature name. Measured cost is 5.8% on two million malloc/free pairs,
which is the worst case that exists, and nothing measurable on Brave, LibreOffice or Node 22.

**The trigger that reopens `hardened_malloc`:** SP+ deciding it is willing to vendor and build
the allocator from source inside its own build, so that no new repository enters the trust set.

**T2.2 has a deadline that the others do not.** Filtering Flathub while zero applications are
installed costs nothing. Filtering it after advisors depend on an unverified application is a
migration.

## 5. Tier 3 — rejected for now, with the trigger that reopens each

Recorded so they are not rediscovered and re-argued in six months.

| Control | Why rejected | Reopens when |
|---|---|---|
| **Default service reduction** (Secureblue disables CUPS, cups-browsed, avahi) | Breaks printing and printer discovery. Day-one job #4. Rejected by ruling 2 | Never for CUPS and avahi. This is a product boundary |
| **USBGuard** | Docks, printers, keyboards, cameras and USB storage all arrive by insertion | An MSP-managed fleet where a policy can be maintained centrally |
| **Kernel module blacklist** | Secureblue's list disables Bluetooth and Thunderbolt. Both are day-one items | A narrowly scoped list that provably excludes every day-one device class |
| **User-namespace restriction** | Brave's sandbox and Flatpak both need it. A native Brave has no Trivalent-style exception written for it | T2.1 lands and a Brave SELinux domain exists to grant the exception to |
| **Flatpak permission lockdown** | Secureblue's own words: breaks "just about all Flatpaks by default" | Never in this shape. T2.2 is the affordable version |
| **Disabling Xwayland** | Breaks NVIDIA paths and unmigrated applications | Every application in the profile is proven Wayland-native |
| **SUID removal** | Secureblue deletes `sudo`, `su`, `pkexec`, `chsh`, `chfn` and breaks AppImages. This is the class of change that breaks printing or mounting on a machine nobody can support | Never wholesale. Individual binaries with individual evidence, if ever |
| **Per-package rebuild hardening** | Makes SP+ a distribution builder rather than a delta on one | A named vulnerability class demands it and no upstream fix exists |
| **VM compartmentalization** | The strongest answer to T3 and incompatible with one laptop and a non-technical user | SP+ ships a managed second machine |
| **Replacing Brave** | Christopher's ruling 3 | Q1 and Q17, on their own clock |
| **Thumbnailing disabled** | Advisors browse documents visually. Visible degradation for a modest gain | Not on current evidence |

## 6. Phase 0 — the test lane, which blocks honest claims about four controls

**`spplus-testvm.sh` builds a VM with no Secure Boot.** It uses `OVMF_CODE_4M.fd` and
`OVMF_VARS_4M.fd`, not the `OVMF_CODE_4M.secboot.fd` + `OVMF_VARS_4M.ms.fd` pair D30 requires.
In-guest, `bootctl status` reports `Secure Boot: disabled (unsupported)` and `TPM2 Support: no`.

Consequences: kernel lockdown, module signature enforcement, Secure Boot state and TPM are all
untestable on this lane, and `module.sig_enforce=1` in T2.4 cannot be gated without it.

| | |
|---|---|
| **Deliverable** | `spplus-testvm.sh` gains Secure Boot firmware and an optional vTPM |
| **Gate** | A fresh install reports `mokutil --sb-state` enabled, `/sys/kernel/security/lockdown` at `integrity`, and no MOK prompt during install |
| **Owner** | Claude |

This is small, and it unblocks a whole class of claims SP+ currently cannot make honestly.

A second, cheaper fix belongs here: **`spplus-testvm.sh up` feeds the LUKS passphrase to the
serial console**, which the SP+ image does not use because it boots `rhgb quiet`. The passphrase
types into nothing, sshd never starts, and the VM looks hung. `vmunlock` already solves this and
documents the failure in its own header. `up` should call it.

## 7. Suggested order, and why

1. **Phase 0**, the test lane. Small, and everything downstream is more honest with it.
2. **Phase S**, the signature hole. Alone, in its own ISO. It is the only actively dangerous
   finding, and building it alone means the test proves exactly one thing.
3. **Tier 1**, as one batch. All invisible, so one regression pass covers them.
4. **T2.2**, Flathub filtering, before any Flatpak is installed and it becomes a migration.
5. **The rest of Tier 2**, one control per build, because each one can break a workday and a
   batch of four leaves four suspects.

## 8. What this roadmap does not do

It does not make SP+ secure. The research document's actual conclusion is not "add more
controls" — it is that security branding without a threat model, evidence, boundaries and a
recovery story is worthless. §14's residual-risk list stays true after every row here is built.
A stolen unlocked laptop is still fully compromised. A browser compromise still reaches
everything the advisor can reach. There is still no backup story.

What this roadmap does is make each of those a stated position rather than an unexamined gap.
