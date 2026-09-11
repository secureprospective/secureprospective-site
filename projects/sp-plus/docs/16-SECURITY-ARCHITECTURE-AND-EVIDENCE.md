# SP+ Security Architecture and Evidence Report

**Subject:** `sp-plus-defense-in-depth-20260911.iso`, payload `localhost/sp-plus-kde:t29`
**Prepared:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`, head `830023b`
**Audience:** security reviewers examining the technical substance of the work
**Status of this document:** every claim below is either a measured result with the command
that produced it, or a design decision with the register entry that records it. Where a
control is untested, unfinished, or deliberately absent, it is stated as such in the same
voice as the controls that work.

---

## Contents

| § | Section |
|---|---|
| 0 | How to read this, and how to check it |
| 1 | What SP+ is, and who it is for |
| 2 | Trust anchors |
| 3 | Threat model, and what currently answers each threat |
| 4 | The evidence system |
| 5 | Controls, layer by layer — 5.1 supply chain and signing · 5.2 build hardening · 5.3 kernel policy · 5.4 disk encryption · 5.5 privilege and attack surface · 5.6 authentication · 5.7 network policy · 5.8 memory allocator · 5.9 application confinement · 5.10 update and recovery · 5.11 the user as a layer |
| 6 | Chronology — when the work happened |
| 7 | **Failure register — checks that passed while measuring nothing** |
| 8 | What SP+ deliberately does not do |
| 9 | Residual risk |
| 10 | Decision register extract |
| A | Complete runtime posture gate output, t29 — all 80 assertions |
| B | Build-time gate markers — all 74 |
| C | Kernel hardening sysctls, read off the running kernel |
| D | SUID and SGID allowlist |
| E | Kernel command line, as shipped |
| F | Brave managed policy, as shipped |
| G | Signature policy and lookaside configuration |
| H | Where to find the primary sources |

**A reviewer short of time should read §4, §7 and §9.** Those three say how claims here are
produced, where this project's own checks have failed, and what remains true after every
control listed.

---

## 0. How to read this, and how to check it

This is not a marketing document and it is not a compliance statement. Secure Prospective
makes **no compliance claims** for SP+ — that is a recorded decision (D15), and it exists so
that nothing in this document can be read as an assertion of conformance to a framework that
has not been audited.

Three kinds of statement appear here and they are distinguishable on sight:

| Marker | Meaning |
|---|---|
| **Measured** | A command was run against a booted machine or a build container and its output is quoted. The command is given so it can be re-run |
| **Configured** | A file ships with a value. Where a control is only configured and not measured, it says so, because a configuration file is not a behaviour |
| **Decided** | A design choice with a register entry (D-number) in `docs/06-OPEN-QUESTIONS-AND-DECISIONS.md` |

**The distinction between measured and configured is the organising principle of this
project**, and section 6 explains why. Briefly: an SP+ build gate once grepped a
configuration file, printed `WSDD_OK` on every build, and `smbd` was listening on
`0.0.0.0:445` the whole time. Everything since has been built to make that failure mode
impossible to repeat.

### Reproducing the measurements

The artifact:

```
~/Downloads/sp-plus-defense-in-depth-20260911.iso
sha256  038795fe96b734015d941967eca9b63a96318ab90ee5d9ece0b843be68016c94
bytes   5497683968
```

The runtime evidence suite, which produced the 80 results in Appendix A:

```
projects/sp-plus/tests/runtime-posture-gate.sh
```

It takes an SSH target and measures a booted machine. It is the same script used to produce
every number in this document. It exits non-zero if any control it asserts is not in effect.

---

## 1. What SP+ is, and who it is for

SP+ is a free, immutable, preconfigured Fedora 44 KDE workstation image, delivered as an ISO
and installed on one laptop per person. Its users are **independent insurance and financial
advisors**: non-technical, self-employed, with no IT department and no support desk behind
them. There is no fleet administrator. There is nobody to call.

That user profile is not incidental to the security design; it determines it. Two consequences
run through every decision in this document:

**First, a control that breaks the workday is not a weak control, it is a negative one.** This
is recorded as **D44**, and it is a hard gate rather than a preference: a control that breaks
printing, printer discovery, Wi-Fi, the browser, progressive web apps, audio, camera,
microphone, suspend and resume, external display or Bluetooth is **rejected outright, however
strong it is.** The reasoning is mechanical. An advisor who cannot print uninstalls the
operating system, at which point the control protects nothing and the machine is on Windows
again. Section 8 lists five controls rejected under this rule, each with what it would have
bought.

**Second, there is no administrator to absorb complexity.** Anything requiring a decision the
user cannot make is not a security feature. This is why the password policy sets a length
floor rather than a composition rule, why an account lockout clears itself after two minutes
rather than requiring an unlock, and why `sudo` is passwordless — each explained in place
below, with the trade stated rather than hidden.

### 1.1 System shape

| Property | Value |
|---|---|
| Base | `quay.io/fedora/fedora-kinoite`, pinned by digest `sha256:1424b842708911553486cc4003526a138704fd44c4531d926b96b9340561dd92` |
| Model | bootc image mode. The OS is a container image; the machine is a deployment of it |
| Root filesystem | composefs, `/usr` **read-only at runtime** |
| Kernel | `7.1.13-200.fc44`, stock Fedora. **No custom kernel, no out-of-tree modules** (D5) |
| Packages | 2,004, manifest shipped in the image at `/usr/share/sp-plus/security/rpm-manifest.txt` |
| Browser | Brave `1.94.119-1`, native RPM, pinned to an exact version |
| SELinux | Enforcing (D22) |
| Disk | LUKS2, argon2id |
| Updates | Staged on a daily timer, applied at shutdown, never reboots the advisor |
| Build host | One Beelink mini PC. **No CI.** This is a known weakness, see §9 |

`/usr` being read-only is load-bearing for much of what follows. It means file modes, SELinux
labels and configuration have to be correct **at image build time**, because there is no
runtime opportunity to fix them. It also means that a compromise which does not achieve
persistence in `/var` or `/etc` does not survive a reboot into a fresh deployment.

### 1.2 Provenance recorded inside the image

Every build writes its own provenance into the image it produces, so an installed machine can
state what it is without reference to any external system:

```
$ cat /usr/share/sp-plus/security/build-provenance.txt
build_id=20260910
release=1
base=quay.io/fedora/fedora-kinoite@sha256:1424b842708911553486cc4003526a138704fd44c4531d926b96b9340561dd92
brave=1.94.119-1
kernel=7.1.13-200.fc44
packages=2004
built_utc=2026-09-11T11:57:19Z
```

Alongside it, `/usr/share/sp-plus/security/` carries the full 71 KB RPM manifest and the
SUID/SGID allowlist. A build gate (`PROVENANCE_GATE_OK`) refuses to complete if the manifest
is absent or the base digest line is missing.

**Measured.** Read directly off the booted t29 machine on 2026-09-11.

### 1.3 What is not in the supply-chain story yet

Stated plainly because a reviewer will look for it:

- **No SBOM in a standard format.** There is a complete RPM manifest and a pinned base digest.
  There is no SPDX or CycloneDX document.
- **No build reproducibility claim.** Fedora's own reproducibility work covers the packages.
  SP+ makes no claim about its own delta being bit-reproducible and has not tested it.
- **No CI.** Images are built on a single machine. **D20 and D35 are in acknowledged tension**
  in the register over exactly this point.
- **Two trust roots for software, not one.** Fedora, and Brave Software's own signing key. The
  second is accepted deliberately to ship the browser the business runs on (D45).

---

## 2. Trust anchors

Everything in this table is something SP+ cannot verify its way out of trusting. If one of
these is dishonest or compromised, the controls downstream of it do not save the machine.
This table is reproduced from `docs/14-THREAT-MODEL.md` §3 and is current.

| Anchor | Held by | Note |
|---|---|---|
| Platform firmware, and the Microsoft and Fedora Secure Boot keys | The laptop vendor and Microsoft | SP+ ships **no custom keys and requires no MOK enrolment**, deliberately. An advisor cannot be asked to enrol a key at a firmware screen |
| Fedora package signing, and the `fedora-kinoite` base | Fedora | Pinned by digest. SP+ does not rebuild packages (D24: no `dnf update` in the Containerfile, so a build is reproducible against the pinned base rather than against whatever was current that morning) |
| Brave's RPM signing key | Brave Software | A second trust root, accepted deliberately |
| The `ghcr.io/secureprospective/sp-plus-kde:latest` tag | Whoever can write to it | Every installed machine pulls from it. This is the largest single exposure in the product; see §5.1 and §9 |
| The SP+ cosign private key | Secure Prospective, held in `~/.config/sp-plus-signing/` on the build host | Never leaves that directory. The public half ships in the image |
| The build host | Secure Prospective | One machine, no CI |
| The advisor's LUKS passphrase and lock screen | The advisor | See §8 |

A deliberate non-anchor is worth naming: **`hardened_malloc` was rejected partly because
adopting it would have added a fifth trust root** to that list. Section 5.8 gives the full
reasoning.

---

## 3. Threat model, and what currently answers each threat

The threat model lives at `docs/14-THREAT-MODEL.md`. The table below restates its adversary
list and gives the **current** answer as measured on t29, which in four places is better than
what that document says. The document was written on 2026-09-10 against alpha4, and the work
described in this report happened after it. Where they differ, this report is current and the
threat model needs updating; that discrepancy is called out rather than quietly fixed, because
a stale threat model is itself a finding.

| # | Threat | Likelihood for this user | What answers it today |
|---|---|---|---|
| T1 | Laptop lost or stolen, powered off | Highest | LUKS2 with argon2id. See §5.4. This is the core control and it works |
| T2 | Phishing and credential theft through the browser | Very high | Brave managed policy, Shields armed before first page load, Safe Browsing, password leak detection, a password manager. The advisor remains the last check |
| T3 | Hostile web content compromising the browser | High | Brave's own sandbox, and `chrome-sandbox` is present and SUID. **SELinux does not confine Brave** — see §8 and D50 |
| T4 | A hostile or malicious document | High | LibreOffice defaults only. Not specifically addressed |
| T5 | A bad SP+ update reaching the fleet | Moderate likelihood, catastrophic reach | **Improved since the threat model was written.** The image now ships a reject-by-default signature policy; the published tag is not yet re-signed in the readable format. See §5.1 |
| T6 | Hostile network: hotel, airport, coffee shop | High exposure, low per-event severity | firewalld `public` zone, sshd **installed but not enabled**, and **system DNS is now opportunistically encrypted** — a change since the threat model, see §5.7 |
| T7 | Malicious USB device | Low for this user | Nothing. USBGuard is rejected under D44; see §8 |
| T8 | A compromised process attacking another at the same UID | Low, and only after T3 or T4 | **Improved since the threat model was written.** `kernel.yama.ptrace_scope=1` is now set and measured. SP+'s own service is sandboxed at exposure 1.1 |
| T9 | Laptop stolen while powered on and unlocked | Low | **Nothing, by design.** See §8 |
| T10 | A targeted attacker who wants this specific advisor | Very low | Out of scope, stated plainly |

**Four corrections to the threat model that this work produced**, listed so a reviewer reading
both documents is not misled: T5 is partially closed, T6's plaintext DNS and listening sshd
are both addressed, T8's `ptrace_scope=0` is now 1, and the threat model's §6 item 8 — that
Secure Boot, kernel lockdown, module signing and TPM had "never been tested by the SP+ test
lane" — **is no longer true.** All four are now measured on every gate run; see Appendix A
lines 19 to 22. That gap was closed by the Secure Boot test lane built on 2026-09-10.

---

## 4. The evidence system

This section describes how claims in this document are produced. A reviewer who reads nothing
else should read this, because it is the part of the work that is unusual.

### 4.1 Two independent gate layers

**Build-time gates.** 74 distinct assertions embedded in the Containerfile as `RUN` steps. A
failing gate fails the build; there is no way to produce an image that skipped one. They are
named by an `_OK` marker printed on success, and the full list is Appendix B. They cover what
can only be checked while the image is writable — file modes, SELinux labelling, the presence
and syntax of policy files, package facts, and refusals.

**Runtime gates.** 80 assertions in `tests/runtime-posture-gate.sh`, run against a booted
machine over SSH after a genuine first boot from the installed ISO. They measure **effect**.
The full output is Appendix A.

The two layers are deliberately not the same checks in two places. A build gate can confirm a
sysctl file ships with `kernel.kptr_restrict = 2`. Only a runtime gate can confirm that a
running kernel reports `2`.

### 4.2 The rule that makes a gate mean something

**D46, recorded in the register:** every security control ships with an assertion in the
runtime posture gate, **mutation-tested red before green**. A control without an assertion
does not ship.

Mutation testing here means: before an assertion is believed, it is run against an image or a
machine state that **lacks** the control, and it must fail. An assertion that has never
produced a negative result is not evidence, it is decoration.

This is not a theoretical safeguard. Section 7 is a register of twelve checks that passed
while measuring nothing, every one of them caught by this discipline. That register is
included in this report on purpose. A security document that lists only successes is telling
you about its authors' confidence, not about the system.

### 4.3 Why the runtime gate exists at all

The gate was built after a specific failure. A build gate grepped
`wsdd.service.d/sp-plus.conf`, found the text it expected, and printed `WSDD_OK` on every
build. Meanwhile `smbd` was listening on `0.0.0.0:445` on the running machine. The
configuration was correct and the posture was not.

The general rule that came out of it, and which governs the whole suite: **measure effect, not
configuration text.** Where this document says a control is only configured, that is a
deliberate admission, not an oversight.

---

## 5. Controls, layer by layer

Each subsection states the mechanism, the exact values, when it was added, why it takes the
shape it does, and how it is verified. Where a shape was chosen against a stronger-looking
alternative, the rejected alternative is named.

### 5.1 Supply chain and image signing

**Mechanism.** Images are signed by digest with cosign at publish time. The machine ships a
`containers-policy` that **rejects by default** and accepts the SP+ repository only when a
sigstore signature verifies against a public key baked into the image.

Shipped at `/etc/containers/policy.json`:

```json
{
    "default": [ { "type": "reject" } ],
    "transports": {
        "docker": {
            "ghcr.io/secureprospective/sp-plus-kde": [
                {
                    "type": "sigstoreSigned",
                    "keyPath": "/etc/pki/containers/sp-plus-cosign.pub",
                    "signedIdentity": { "type": "matchRepository" }
                }
            ]
        },
        "containers-storage": [ "insecureAcceptAnything" ],
        "dir":            [ "reject" ],
        "docker-daemon":  [ "reject" ],
        "oci":            [ "reject" ],
        "docker-archive": [ "reject" ]
    }
}
```

Note what `default: reject` means in practice: **a pull from any registry other than the SP+
repository fails**, including a pull of the stock Fedora base. That is intentional.

**The one line that makes it work.** `/etc/containers/registries.d/ghcr-secureprospective.yaml`
carries:

```yaml
docker:
    ghcr.io/secureprospective:
        use-sigstore-attachments: true
```

Cosign attaches its signature to the registry as a separate artifact rather than to a
lookaside server, and `containers/image` does not go looking for those unless it is told to.
Without that one line the policy finds no signature and **rejects everything**, which
presents as a total update outage rather than as a misconfiguration. This was found by
testing, not by reading documentation.

**A trap discovered and worked around.** `cosign verify` passing proves nothing about whether
the machine can verify, because cosign reads its own format. Cosign v3 does not write the
attachment layout that `containers/image` looks for — the machine wants
`sha256-<digest>.sig` in the legacy layout. Signing was therefore moved to `skopeo copy
--sign-by-sigstore-private-key`, and the publish script verifies with the **policy the machine
actually ships**, not with cosign. The failure message is explicit:

```
FAILED: the signature is not readable by the policy SP+ ships.
```

**Publish-lane refusals.** `scripts/publish-image.sh` is the only sanctioned path to the
published tag, and it refuses to publish when:

- the image is missing files that identify it as SP+ ("this is not an SP+ image");
- Discover's `rpm-ostree` backend is present again, which would let the advisor layer packages
  and break bootc upgrades;
- the image **is not newer** than the tag it would replace, which prevents a rollback being
  published as an upgrade;
- the resulting signature is not readable by the shipped policy.

This script exists because of a real incident. On **2026-09-01** an unrelated workflow pushed a
stock `fedora-kinoite` image to the SP+ tag, and the update timer staged it. The fleet-wide
update path was demonstrated to work exactly as designed, on the wrong image.

**Status — and the open item.** The policy is correct in the image and verified there. The
**published `ghcr.io/secureprospective/sp-plus-kde:latest` tag has not yet been re-signed in
the readable format.** Until it is, the policy would reject an update. This does not affect
installing or running the ISO. It is a pending owner decision, because publishing is a
fleet-wide act.

**Residual exposure, stated without softening.** An attacker who obtains write access to that
ghcr tag and the signing key owns the fleet. Signature verification raises the bar from "write
the tag" to "write the tag and hold the key". It does not eliminate the anchor.

**Verified by:** build gates `SIGPOLICY_GATE_OK`, `PROVENANCE_GATE_OK`. Added 2026-09-10
(`6bc59fd`, "Phase S — verify the signature on our own OS image").

---

### 5.2 Build hardening

**Honest position: this layer is inherited, not owned.** SP+ compiles nothing. It ships
Fedora's packages with Fedora's compiler flags, Brave's binary as Brave built it, and adds a
delta of configuration.

What SP+ contributes at this layer is narrow and it is named rather than inflated:

- **Exact version pinning with literal-value gates.** `BRAVE_VERSION=1.94.119`,
  `BRAVE_RELEASE=1`, `PI_VERSION=0.85.0`. The gates `BRAVE_PIN_GATE_OK` and `PI_PIN_GATE_OK`
  reject anything that is not an exact three-part version — no ranges, no floating tags.
- **No `dnf update` in the Containerfile** (D24). Builds resolve against the pinned base, not
  against whatever the mirrors served that morning.
- **The base pinned by digest**, not by tag.
- **Repository and key removal after use.** `BRAVE_INSTALL_OK` confirms Brave's repo
  definition and signing key are removed from the image after installation, so the shipped
  machine does not carry a live third-party repo.
- **A known-package manifest** of all 2,004 packages, shipped in the image.

A reviewer should read this section as: *SP+ is a distribution delta, not a distribution.*
Rebuilding Fedora packages with different flags was considered and rejected (§8); it would
make SP+ a distribution builder, which is a different product with a different maintenance
obligation.

**One durability lesson recorded here because it bears on supply chain:** a pinned base digest
is **not** durable on its own. Quay rotated a digest SP+ depended on and the local container
cache could not restore it. The conclusion recorded was to mirror bases you depend on. That
mirroring is not yet in place.

---

### 5.3 Kernel policy

Three independent mechanisms: boot arguments, sysctls, and lockdown/module-signature
enforcement inherited from Secure Boot.

#### Kernel command-line arguments

Owned by `/usr/lib/bootc/kargs.d/*.toml`, which is the only durable place to set them. This
matters: ostree regenerates boot loader entries, so a local edit to a BLS entry **does not
survive a reboot**. The file ships as:

```toml
kargs = [
  "init_on_alloc=1",
  "init_on_free=1",
  "randomize_kstack_offset=on",
  "slab_nomerge",
  "vsyscall=none",
  "pti=on",
]
```

| Argument | What it does |
|---|---|
| `init_on_alloc=1` | Zeroes heap pages on allocation, killing a class of uninitialised-memory disclosure |
| `init_on_free=1` | Zeroes on free, shrinking the window in which freed secrets are readable |
| `randomize_kstack_offset=on` | Randomises kernel stack offset per syscall, degrading stack-layout-dependent exploits |
| `slab_nomerge` | Stops the allocator merging same-size slab caches, removing cross-cache attack primitives |
| `vsyscall=none` | Removes the legacy fixed-address vsyscall page, a classic ROP anchor |
| `pti=on` | Forces page table isolation on rather than leaving it to CPU-model heuristics |

**`mitigations=auto,nosmt` is deliberately absent.** Secureblue ships it and documents a cost
of up to roughly 40% on parallel workloads. Disabling SMT on an advisor's laptop is a
perceptible, permanent performance loss against a threat class this user does not face. Its
absence is itself asserted at runtime, so it cannot be silently reintroduced (Appendix A,
"nosmt not reinstated").

**Measured, not assumed.** Six assertions confirm each argument is on the installed command
line, and three more confirm the **effects**: zero vsyscall lines in a live process map, zero
merged slab aliases summed across every cache, and `X86_FEATURE_PTI` set on all 4 CPUs. The
effect assertions exist because a kernel can accept an argument and ignore it.

#### Sysctls

Shipped in `/usr/lib/sysctl.d/`, and every value below was **read back off the running t29
kernel**, not from the file:

```
kernel.yama.ptrace_scope        = 1      one process may not attach to another at the same UID
kernel.kptr_restrict            = 2      kernel pointers hidden from unprivileged readers
kernel.dmesg_restrict           = 1      kernel log closed to unprivileged users
kernel.perf_event_paranoid      = 3      perf closed entirely to unprivileged users
kernel.sysrq                    = 0      magic SysRq disabled
kernel.kexec_load_disabled      = 1      no loading a replacement kernel at runtime
vm.unprivileged_userfaultfd     = 0      removes a widely used exploit-timing primitive
kernel.unprivileged_bpf_disabled= 1      no unprivileged BPF program loading
net.core.bpf_jit_harden         = 2      JIT hardening against spraying, for all users
fs.suid_dumpable                = 0      SUID processes produce no core dump
fs.protected_symlinks           = 1      classic symlink race mitigation
fs.protected_hardlinks          = 1      classic hardlink race mitigation
fs.protected_fifos              = 2
fs.protected_regular            = 2
net.ipv4.tcp_syncookies         = 1
net.ipv4.tcp_rfc1337            = 1
net.ipv4.conf.all.rp_filter     = 1      and .default
net.ipv4.conf.all.accept_redirects   = 0 and .default, and both IPv6 equivalents
net.ipv4.conf.all.secure_redirects   = 0 and .default
net.ipv4.conf.all.send_redirects     = 0 and .default
net.ipv4.conf.all.accept_source_route= 0 and .default, and both IPv6 equivalents
net.ipv4.icmp_ignore_bogus_error_responses = 1
kernel.core_pattern             = |/bin/false    core dumps are discarded, not written
vm.swappiness                   = 180            zram tuning, not a security control
```

`net.ipv4.icmp_echo_ignore_all = 0` is set **to zero deliberately**: the machine answers ping.
Silently dropping ICMP echo breaks ordinary network troubleshooting on an office LAN and buys
nothing against any threat in §3.

**Core dumps are disabled in both halves**, which is the point of the `SYSCTL_GATE_OK` build
gate's wording. `kernel.core_pattern` discards the dump, and the login shell's hard core
`rlimit` is zero. Two assertions cover this because either half alone can be bypassed.

#### Lockdown, module signing, TPM and Secure Boot

**Measured on t29:**

```
secure boot enabled        SecureBoot enabled
kernel lockdown active     none [integrity] confidentiality
module signature enforced  sig_enforce=Y
tpm 2.0 present            tpm0 version 2
```

Lockdown in `integrity` mode blocks the interfaces that let root modify the running kernel —
unsigned module loading, `/dev/mem`, kexec of an unsigned image, certain BPF and ACPI paths.
Together with `sig_enforce=Y` this closes the root-to-kernel path that would otherwise make
every other kernel control advisory.

**This is the control most worth noting for a reviewer**, because the threat model states
these had *never* been tested. That statement was true when written. The Secure Boot test lane
built on 2026-09-10 (`a4e342b`) closed it, and exposed two defects in doing so. SP+ ships **no
custom Secure Boot keys and requires no MOK enrolment** — an advisor cannot be walked through
a firmware screen over the phone.

---

### 5.4 Disk encryption

**Measured on the installed t29 volume:**

```
Version:     2
Cipher:      aes-xts-plain64
Cipher key:  512 bits
Sector:      512 bytes
PBKDF:       argon2id
Memory:      606252 KiB
Threads:     4
AF hash:     sha256
```

LUKS2 with argon2id at roughly 592 MiB of memory cost per attempt. That memory-hardness is the
control that makes T1 — the stolen powered-off laptop, which is the highest-likelihood threat
this user faces — expensive to attack with GPUs.

A first-boot recovery key is generated so that an advisor who forgets a passphrase is not
holding a brick. That is a usability control with a real security cost, and it is named here
rather than buried: **the recovery key is a second credential that can open the disk.** Where
the advisor stores it determines whether T1 remains mitigated.

**Not encrypted:** the EFI system partition and `/boot`, as normal. Boot integrity is carried
by Secure Boot, not by encryption.

---

### 5.5 Privilege and attack surface

#### Listening surface

**Measured on t29:**

```
no world-listener on 139    absent      NetBIOS session
no world-listener on 445    absent      SMB
no world-listener on 1716   absent      KDE Connect
no world-listener on 5357   absent      WS-Discovery
help app is loopback-only   tcp 127.0.0.1:8766  tcp 127.0.0.1:8765
high port range closed      none
```

`smb.service` and `nmb.service` are masked and inactive. `wsdd` is inactive with zero sockets.
KDE Connect has zero processes and **zero D-Bus activation files**, which is the part that
matters — a service that is not running but can be D-Bus activated is a service that is
running on demand.

The only things listening are the two loopback ports of the local help application. They are
asserted to be loopback-only rather than merely present, because a help server that binds
`0.0.0.0` on hotel Wi-Fi is a different product.

**sshd ships installed but not enabled.** When it is enabled for QA it is key-only, and that
is enforced at build time by running `sshd -T` against a throwaway host key and parsing the
**effective** configuration rather than grepping the config file:

```
passwordauthentication no
kbdinteractiveauthentication no
permitrootlogin no
pubkeyauthentication yes
```

A second build gate (`SSH_KEY_GATE_OK`) refuses the build if any `authorized_keys` file or
even an `.ssh` directory appears in `/etc/skel`. **No key ships in the image** — that is D-1,
one of the oldest decisions in the project.

Whether sshd should ship installed at all is **D47, still unratified.**

#### Firewall

**Measured:**

```
public (default, active)
  interfaces: enp1s0
  services:   dhcpv6-client mdns ssh
  ports:      (none)
  masquerade: no
```

The `public` zone is the default, and it is the zone firewalld applies to new networks. `mdns`
is open and this is an accepted exposure, explained in §8: `avahi-daemon` is how printers are
found, and printer discovery is day-one job number four.

#### SUID and SGID

**Inventory, not removal.** 22 setuid/setgid files, every one on an explicit allowlist shipped
in the image at `/usr/share/sp-plus/security/suid-allowlist.txt`. A new SUID root binary
arriving in a future image is a **build failure**, not a discovery six months later.

The allowlist's own header states the position:

> INVENTORY, NOT REMOVAL. Secureblue deletes sudo, su, pkexec, chsh and chfn. That is exactly
> the class of change that breaks printing or mounting on a machine nobody can support, so SP+
> does not do it.

The full list is Appendix D. Notable entries a reviewer will want: `sudo`, `su`, `pkexec`,
`mount`, `umount`, `fusermount3`, `passwd`, `unix_chkpwd`, `polkit-agent-helper-1`, and
`/usr/lib/opt/brave.com/brave/chrome-sandbox` — the last being Brave's own sandbox helper,
whose presence is a security requirement rather than a finding.

#### sudo, and the decision behind it

**SP+ ships `%wheel ALL=(ALL) NOPASSWD: ALL`.** This is the single most reviewable decision in
the product and it is deliberate. The reasoning, recorded in `/etc/sudoers.d/sp-plus` and in
the threat model §5:

- The in-house assistant runs as the advisor and **cannot answer a password prompt**.
- A non-technical advisor frequently cannot either. The account is created by the first-boot
  wizard and the password is chosen once, under pressure, and then rarely typed again.
- A prompt the user cannot answer stops the assistant from helping and **stops no attacker who
  is already at the keyboard**.

**The containment is architectural instead:** `/usr` is read-only, every change lands in a new
deployment, a bad state is one rollback away, and the disk is encrypted at rest.

**The consequence, stated without softening:** the lock screen is the security boundary, not
the password prompt. T9 — a machine stolen while powered on and unlocked — is unmitigated by
design. A browser compromise that achieves code execution as the advisor reaches the whole
machine through `sudo`. This is in §9 as residual risk item 2 and it is the strongest argument
for the browser confinement work that is currently deferred.

#### Service sandboxing and removed components

`sp-plus.service` scores **1.1 on `systemd-analyze security`**, where lower is better and the
gate threshold is 5.0. This is SP+'s own code, so nothing upstream can regress it underneath.

Masked and measured masked: `systemd-homed.service`, `systemd-homed-activate.service`,
`sssd.service`, `sssd-kcm.socket`. Absent and measured absent: `qemu-ga`,
`vmware-user-suid-wrapper` — guest agents carry a SUID root binary and have no business on an
advisor's laptop. The `VMTOOLS_GATE_OK` build gate records that removing them took one SUID
root binary with them.

---

### 5.6 Authentication and local credential policy

Added 2026-09-10 (`45ffd3f`), verified 66 of 66 at the time and re-verified on t29.

#### Password quality

`/etc/security/pwquality.conf`:

```
minlen = 12
dcredit = 0        no digit required
ucredit = 0        no capital required
lcredit = 0        no lowercase required
ocredit = 0        no symbol required
minclass = 1
maxrepeat = 3
usercheck = 1      rejects passwords containing the username
gecoscheck = 1     rejects passwords containing the user's real name
dictcheck = 1      rejects dictionary words
```

**Length over composition, deliberately.** `harbour ledger spring` is accepted. Composition
rules drive non-technical users to `Password1!` and to writing it on the monitor. This is a
usability decision that is also the better security decision, and the gate proves both halves:
a long passphrase scores 100 with no class rules imposed, and an **11-character** password is
refused. That second assertion is the discriminating one — a check that only rejects
`password` would pass against stock Fedora settings and prove nothing about `minlen = 12`.

#### Account lockout

`/etc/security/faillock.conf`:

```
deny = 10
fail_interval = 900
unlock_time = 120
audit
```

Ten wrong attempts within fifteen minutes, then a **two-minute** lockout that clears itself.

**`even_deny_root` is deliberately absent, and a build gate refuses the build if it appears.**
Same for `enforce_for_root` in the quality config. The reason is operational: there is nobody
to phone. A lockout that cannot clear itself turns a mistyped password into a bricked machine
for a user with no support desk. The gate wording says it directly: *"even_deny_root would
make a lockout unclearable."*

Measuring this honestly was difficult and the first three attempts measured nothing; see §7,
entries 4, 8 and 9. The working probe drives `su` under a Python pseudo-terminal, feeds twelve
wrong passwords, and asserts that **exactly ten** failures were recorded and then counting
stopped.

#### Umask and empty passwords

`UMASK 027` in `/etc/login.defs`, measured two ways: the login shell reports `umask=0027`, and
a file created on the running machine has mode `640`.

`nullok` is removed so empty passwords cannot authenticate. The assertion scans **all of
`/etc/pam.d`**, not the two files originally checked, and permits exactly one exception:
`sssd-shadowutils`, because `sssd` is masked. Any other occurrence fails and the message names
the files.

**A consequence of `UMASK 027` that bit this project four times is recorded in §7.** It is the
most instructive defect in this document.

---

### 5.7 Network policy

#### DNS over TLS — and why it is `opportunistic`

`/usr/lib/systemd/resolved.conf.d/90-sp-plus-dot.conf`:

```
[Resolve]
DNSOverTLS=opportunistic
DNSSEC=allow-downgrade
```

**Measured on t29:** `resolved` reports both values over D-Bus, and a real query reports
`encrypted transport: yes`.

**The word `opportunistic` is load-bearing and must never be dropped when describing this.**
Where the network's resolver supports DNS over TLS, queries are encrypted against a passive
observer. **An active attacker blocks TCP 853 and watches the plaintext fallback.** That is
not a defect in the configuration; it is what the setting means.

It is built this way because the alternative breaks the advisor's job. `DNSOverTLS=yes` and
`DNSSEC=yes` both fail closed against a captive portal's deliberately forged answers, and
hotel and airport Wi-Fi is exactly where advisors work. Two build gates **refuse the build**
if either is set to `yes` or `true`.

**Measured with TCP 853 blackholed by nftables**, which is the captive-portal case simulated:

| | Resolved | Encrypted | First query | Subsequent | HTTP |
|---|---|---|---|---|---|
| 853 blocked | 5 of 5 | 0 of 5 | 6.61 s | 0.27 s | 200 throughout |
| 853 reachable | 5 of 5 | 5 of 5 | 0.40 s | — | 200 |

The one-off 6.61 second cost is `resolved` discovering the downgrade; the verdict is cached
per server, so it is paid once when joining such a network.

**Brave has its own DNS-over-HTTPS setting (`DnsOverHttpsMode = automatic`) and is unaffected
by this.** This control is about the rest of the machine.

#### MAC address policy, deliberately asymmetric

`/usr/lib/NetworkManager/conf.d/23-spplus-mac-policy.conf`:

```ini
[connection.23-spplus-wifi-mac]
match-device=type:wifi
wifi.cloned-mac-address=stable-ssid

[connection.23-spplus-ethernet-mac]
match-device=type:ethernet
ethernet.cloned-mac-address=preserve
```

Wi-Fi uses a per-network stable address, so the laptop is not trivially trackable across
venues by hardware address, while remaining stable enough that captive portals and MAC-based
network access control keep working. **Wired is deliberately left alone.** Docks and USB
Ethernet adapters are precisely what wired randomisation is documented to break, and that is a
D44 rejection.

`preserve` was chosen over `permanent` because a USB NIC without an EEPROM has **no permanent
address**, and `permanent` fails on such a device. A build gate refuses `permanent` for this
reason and refuses any occurrence of `random`.

Two honest notes. Fedora already shipped `wifi.cloned-mac-address=stable-ssid` in
`22-wifi-mac-addr.conf`, so the Wi-Fi half had been live since day one without incident; SP+
makes it explicit and asserts it rather than inheriting it silently. And **the wired address
is unchanged and identifiable** — that is a real, accepted privacy cost, stated in the
advisor-facing README as well as here.

Verification is behavioural, not textual: the gate compares the running address against the
**permanent** address read with `ethtool -P`, with a documented fallback for devices that
report no permanent address at all.

---

### 5.8 Memory allocator policy

This control's history is the clearest example in this document of the difference between a
control and the appearance of one, so it is given in full.

**What the roadmap asked for.** Doc 15 Tier 2 named `hardened_malloc`.

**Why it was dropped (D49, 2026-09-11).** Three findings, each verified:

1. It is in **none of the four repositories SP+ ships**. Secureblue builds it in their own
   COPR. Taking it means adding a **fifth trust root** to the table in §2 — a statement about
   what SP+ vouches for, not an implementation detail.
2. Secureblue's own issue tracker records that **the configuration which enables the allocator
   is not inside their RPM.** Installing the package does not turn it on.
3. Its documented breakage class is **Electron applications.** SP+ ships Brave, Zoom and
   Signal. That is most of an advisor's working day, and D44 applies.

**What was measured before deciding.** Whether glibc's own heap hardening could substitute
without any new trust root. On glibc 2.43, against Brave, LibreOffice and Node 22, three runs
each:

| Tunable | Verdict |
|---|---|
| `glibc.malloc.check=3` | **Inert.** `ld.so --list-tunables` faithfully reports it as `3`. The implementation moved into `libc_malloc_debug.so` in glibc 2.34 and **that library is not in the image**. A deliberate heap overflow behaved identically set and unset |
| `glibc.malloc.perturb=204` | **Inert**, same reason |
| `glibc.malloc.tcache_count=0` | **Real** |

The first of those is the important one for a reviewer. It is a control that reads as applied,
that the platform's own reporting tool confirms as applied, and that does nothing. Shipping it
would have produced a green line in this report for zero security.

**What ships.** `GLIBC_TUNABLES=glibc.malloc.tcache_count=0`, across three layers:

| Layer | Path | Reaches |
|---|---|---|
| pam_env | `/etc/environment` | tty logins and `su`. **Not ssh** — Fedora does not stack `pam_env` in `sshd` or `password-auth` |
| systemd user manager | `/usr/lib/environment.d/90-sp-plus-malloc.conf` | The Plasma session, and therefore Brave, LibreOffice and everything the advisor launches. **This is the load-bearing layer** |
| systemd system manager | `/usr/lib/systemd/system.conf.d/90-sp-plus-malloc.conf`, `DefaultEnvironment=` | System services such as NetworkManager and CUPS |

**What it buys, stated precisely.** Disabling the per-thread cache removes **tcache
poisoning**, one of the most commonly used heap primitives available to an attacker who
already holds a use-after-free or a double free. It gives **none** of `hardened_malloc`'s
guard pages, randomised allocation, isolated size classes or delayed reuse. This sentence, not
a feature name, is what belongs in any customer-facing security statement.

**How it is proven — by behaviour, not by reading a file back.** A deliberate double free
aborts either way; what differs is which code path catches it, and the message names the path:

```
baseline:  free(): double free detected in tcache 2
hardened:  double free or corruption (!prev)
```

The build gate asserts exactly that transition and was **mutation-tested across four arms**
inside the previous image before it was believed: green only for the real tunable, red for no
tunable, red for `glibc.malloc.check=3`, red for `glibc.malloc.perturb=204`. The two inert
tunables produce a red result, which is the entire point — they are what a
configuration-reading gate would have called green. A separate build gate **refuses the build**
if either inert tunable ever appears in any environment layer.

**Measured cost:**

| Workload | Baseline | tcache disabled |
|---|---|---|
| 2,000,000 malloc/free pairs (worst case that exists) | 1.307 s | 1.383 s |
| Brave headless page load | 0.42 s | 0.42 s |
| LibreOffice convert to PDF | 0.47 s | 0.49 s |
| Node 22 allocation churn | 0.19 s | 0.18 s |

5.8% on a synthetic allocator benchmark that does nothing else; nothing measurable on any real
application.

**It reaches Flatpak sandboxes**, verified by reading the variable back from inside one. The
sandbox runs its own glibc, 2.42 against the host's 2.43.

---

### 5.9 Application confinement

**This is SP+'s weakest layer and it is stated as such.**

#### The browser

Brave runs as a native RPM, **SELinux-unconfined**, like every other desktop application on
Fedora. Its own multi-process sandbox is the only containment, and `chrome-sandbox` is present
and SUID so that sandbox is actually available.

What SP+ does control is Brave's **policy**, applied through
`/etc/brave/policies/managed/sp-plus.json` and therefore not changeable by the user or by a
web page. The complete shipped policy:

```
BraveShieldsDisabledForUrls    = []              Shields armed everywhere, before first page load
SafeBrowsingProtectionLevel    = 1
PasswordLeakDetectionEnabled   = True
PasswordManagerEnabled         = True
AutofillCreditCardEnabled      = False
DnsOverHttpsMode               = automatic
ComponentUpdatesEnabled        = True

MetricsReportingEnabled        = False           telemetry off
BraveP3AEnabled                = False
BraveStatsPingEnabled          = False
BraveWebDiscoveryEnabled       = False

BraveAIChatEnabled             = False           attack surface removed
BraveWalletDisabled            = True
BraveVPNDisabled               = True
BraveRewardsDisabled           = True
BraveTalkDisabled              = True
BraveNewsDisabled              = True
TorDisabled                    = True
PromotionsEnabled              = False

HomepageLocation               = http://127.0.0.1:8766/
RestoreOnStartup               = 4
RestoreOnStartupURLs           = ['http://127.0.0.1:8766/']
DefaultBrowserSettingEnabled   = False
```

Three things a reviewer should note. **Shields are armed before the advisor's first page
load**, not on first launch by the user — that was a specific fix (`eaf0faa`, T-36), because
a default that requires action is not a default. **The wallet, VPN, AI chat, Tor and rewards
subsystems are disabled**, each of which is a network-facing component and therefore attack
surface that this user has no use for. And **credit card autofill is off** while the password
manager is on, which is a deliberate asymmetry.

`TorDisabled = True` deserves a note because it looks like a privacy regression. It is an
availability and support decision: a non-technical advisor who lands in a Tor window cannot
tell why the internet stopped working, and has nobody to ask.

#### SELinux confinement for the browser — investigated, working, and deliberately not shipped

This is **D50** and it is the one control genuinely left out of this release.

**What was proven** on the running image, and is preserved in
`docs/ledger/PHASE-T21-2026-09-11-brave-selinux.md` including the working policy skeleton:

- A CIL policy module **loads without reference-policy headers**.
- The domain transition works. Brave was confirmed running as
  `unconfined_u:unconfined_r:brave_t:s0-s0:c0.c1023` via `ps -eZ`.
- Brave **kept working** inside the domain across three real page loads, exiting 0.
- All the tooling needed is already in the image: `checkmodule`, `semodule_package`,
  `semodule`, `semanage`, `audit2allow`.

**Why it is not shipped.** A permissive domain with no baseline produced **2,163 AVC denials
from three headless page loads** — 145 distinct subject/object/class triples, one of them
repeated 1,896 times. A baseline built from three headless page loads covers a fraction of the
real surface: carrier portals, progressive web apps, printing from the browser, downloads,
file uploads, video calls.

The two available shapes were both rejected:

- **Enforcing** with an incomplete baseline breaks the advisor's day. D44 forbids it outright.
- **Permissive** blocks nothing. Shipping it would place telemetry in a scorecard under a
  heading that says hardening — and SP+ cannot collect the logs it would produce, so it does
  not even buy the vendor information.

**The single prerequisite that reopens it** is recorded in the register: roughly one hour of
ordinary browser use on real hardware under the permissive domain, keeping the audit log. The
test VM cannot produce it, because Brave does not reliably load network pages inside it.

#### Flatpak

**Measured remotes on t29:**

```
fedora           system,oci                 oci+https://registry.fedoraproject.org
flathub          system                     https://dl.flathub.org/repo/
flathub-vouched  system,no-enumerate        https://dl.flathub.org/repo/
```

**Flathub is restricted to `--subset=verified`**, which limits what the advisor can browse and
install to applications cryptographically verified as published by the upstream project. This
is cheap now and expensive later: the restriction was applied while **zero** applications were
installed, so there is no migration.

The `flathub-vouched` remote is the escape hatch and its shape is the interesting part. It is
**`no-enumerate`**, so it does not appear in the store and cannot be browsed. It exists so
that named applications SP+ has chosen to vouch for — currently Zoom and Signal, which are not
in the verified subset — can be installed by exact reference without opening the whole of
Flathub. Three runtime assertions cover it: the remote is not browsable, it enumerates zero
applications, and all four optional tools still resolve from their shipped remote.

**SP+ vouching by name for Zoom and Signal is D48, still unratified.** It is a genuine
statement of trust and it is recorded as one rather than buried in a config file.

**Not yet done at this layer:** a per-application Flatpak permission baseline. Overriding
filesystem and device permissions per application is the obvious next step and it is not in
this release.

---

### 5.10 Update, recovery and rollback

The strongest layer in the product, and the one that makes several decisions elsewhere
defensible.

- **Staged daily, applied at shutdown, never reboots the advisor.** `spplus-stage-update.timer`
  is `OnCalendar=daily` and `Persistent=true`, so a laptop that was closed still updates.
- **A build gate refuses the build if `--apply` appears** in the staging unit or its script,
  because that would reboot the advisor mid-work. `bootc-fetch-apply-updates.timer` is
  asserted **not enabled** for the same reason.
- **One guarded lane.** Discover's `rpm-ostree` backend is **removed from the image** — the
  `.so` is deleted and its absence asserted — so the advisor cannot layer packages and break
  bootc upgrades. Discover keeps Flatpak applications and firmware, which are the two things
  it should own.
- **No direct `bootc upgrade`.** A build gate fails if the staging script calls it directly,
  because that path has no downgrade guard.
- **Rollback, and its limit.** A bad *image* is one rollback away. The claim this line used to make, that every change lands in a new deployment, is false and is corrected here: `/etc` is mutable and `/var` is shared across deployments. Rollback reorders deployments. It does not merge `/etc` edits back and it restores nothing the advisor owns. It is an image undo, not a backup.
- **A health check** (`spplus-update-health`) runs daily and can mark the state `BROKEN`.
- **Polkit rules** let the advisor *finish* an update in all three lanes without a password,
  while a build gate refuses the build if those rules grant `rpm-ostree`
  `install-uninstall-packages`, `install-local-packages`, `override` or `repo-modify`.
- **The notifier cannot escalate.** A build gate fails if the session notifier contains `sudo`
  or `pkexec`.

**The honest limit.** Snapshots and rollback are **not backups**. There is no external backup
story in v1, so ransomware or a disk failure means data loss. This is residual risk item 7.

---

### 5.11 The user as a layer

Listed because the threat model treats the advisor as part of the system rather than as its
opponent.

- A first-boot wizard, a Welcome application, a searchable offline help corpus, and a
  plain-language Security Evidence Report.
- The help application **serves loopback only** and caches the manual offline, so help works
  on a plane and does not listen to the network.
- **Crash reports open the advisor's own mail client** to a Secure Prospective address rather
  than posting to a vendor endpoint, and Sentry is masked. The advisor sees and sends what is
  sent.
- Two build gates exist around the Welcome screen's egress claim, one asserting a
  "no data leaves" claim is true and the other asserting the claim was withdrawn where an ask
  box exists. **The product is gated against making a privacy claim it does not keep.**

---

## 6. Chronology — when the work happened

| Date | Event |
|---|---|
| 2026-06-22 | First commit in the repository |
| 2026-08-25 | SP+ distribution planning set written; first KDE QEMU build-test pass |
| 2026-08-26 | Installer brought up; SELinux, LUKS and kickstart defects found and fixed in sequence (DN-09 through DN-16) |
| 2026-09-01 | **Incident.** An unrelated workflow published a stock `fedora-kinoite` to the SP+ tag and the update timer staged it. `publish-image.sh` and its refusals exist because of this |
| 2026-09-10 09:00–11:00 | alpha4 built; posture measured against the research rubric for the first time |
| 2026-09-10 15:47 | **Threat model and defense-in-depth roadmap written** (`5118324`), with the measured posture behind them |
| 2026-09-10 16:35 | Phase 0: Secure Boot test lane, and two defects it exposed (`a4e342b`) |
| 2026-09-10 18:10 | Phase S: signature policy in the image (`6bc59fd`) |
| 2026-09-10 18:58 | Tier 1 invisible hardening batch measured in effect (`50de488`) |
| 2026-09-10 20:14 | Flathub restricted to the verified subset (`0cac9b1`) |
| 2026-09-10 21:54 | Kernel hardening arguments, plus a harness fix that stopped the lane verifying the wrong image (`cf84bc8`) |
| 2026-09-10 22:56 | Login and password policy, 66 of 66 measured (`45ffd3f`) |
| 2026-09-11 05:30 | Opportunistic DNS over TLS, 71 of 71 (`3310db9`) |
| 2026-09-11 06:04 | MAC address policy, 75 of 75 (`e76b332`) |
| 2026-09-11 ~11:40 | `hardened_malloc` alternative measured and refuted (`85cbeab`) |
| 2026-09-11 ~11:50 | Heap policy shipped; t29 built (`ff1f347`) |
| 2026-09-11 ~12:50 | Two of the new assertions found measuring nothing and corrected (`c88c7e2`) |
| 2026-09-11 13:00 | **t29 installed, booted, 80 of 80 measured, zero failed units** (`830023b`) |

550 commits are on this branch. The security-architecture work described here is the last
three days of it.

Each of the five moves in the roadmap was run as an **individual** build, install, boot and
verify cycle — a separate image per control, so that a regression could be attributed to one
change rather than to a batch. The tags `t22`, `t24`, `t26`, `t27`, `t28` and `t29` are those
cycles.

---

## 7. Failure register — checks that passed while measuring nothing

**This section is included deliberately.** A security report that lists only successes tells a
reviewer about its authors' confidence, not about the system. Every entry below is a check
that reported a correct-looking result and was, at the time, worthless. Every one was caught,
and the mechanism that caught it is named.

They fall into four families.

### Family 1 — a check matching its own explanatory comment

An absence check of the form "fail if this dangerous value appears" will match the comment
above it that explains why the value is dangerous.

1. A build gate searched for `mitigations=` and matched the word inside its own comment.
2. The same mistake again, with `even_deny_root`, which **failed the 02:57 t26 build** at step
   24 against a file that was correct.
3. A build-monitoring loop searched output for `GATE FAIL` and matched that string inside the
   echoed text of gates that were **passing**, and reported a build failure that had not
   happened.

**Rule adopted:** strip comments before an absence check (`grep -h -v '^[[:space:]]*#'`), and
anchor markers to line start. Items 1 and 2 are visible in the current Containerfile as
`grep -v '^#' ... | grep -q 'even_deny_root'`.

### Family 2 — a check structurally incapable of failing

4. `faillock` output was counted with `grep -c ':'`, which counts the `<user>:` header row.
   An account with **zero** recorded failures returned 1. Fixed by dropping header rows and
   asserting **exactly 10**.
5. A slab assertion counted alias **symlinks** in a location where the kernel publishes
   **directories**. It could never have produced a non-zero count.
6. A NetworkManager assertion counted occurrences of the wanted value. It stayed green while a
   **higher-priority** configuration section overrode that value to `random`. Exposed by
   mutation testing, not by inspection.
7. The fix to item 6 initially took the **last** matching line. That is exactly backwards:
   `NetworkManager --print-config` emits sections in **descending** precedence, so first match
   wins. Corrected to `head -1`.

**Rule adopted:** an assertion must be run against a machine that lacks the control, and must
fail. This is D46.

### Family 3 — a probe that never reached the thing it was testing

8. `sudo -k -S -u X true` authenticates the **invoking** user, never user X. Twelve wrong
   passwords never touched the target account's authentication stack. The lockout assertion
   was measuring nothing at all.
9. The replacement used `script -qec 'su X -c true'`, which **exits 127** because the image
   does not ship `script(1)`. Every attempt was a silent no-op.
10. `nmcli GENERAL.PERM-HWADDR` **is not a field NetworkManager 1.56 has.** The query errored
    and the assertion went red against a **working** control. Fixed by reading the permanent
    address with `ethtool -P`.
11. `ausearch -m avc -ts "$MARK"` with the timestamp as a single quoted argument matched
    nothing and reported **0 denials** for a run that had produced **2,163**. Even
    `ausearch -ts today` returned no matches. Caught only because a positive control had been
    built to prove denials were being generated; fixed by counting from the journal.
12. `sudo tr '\0' '\n' < /proc/PID/environ` — **found on 2026-09-11.** The shell opens the
    redirect **before** `sudo` runs, so the read happens as the unprivileged user and returns
    "Permission denied". The assertion saw an empty answer and reported a **working** control
    as absent.
13. An assertion asked an **SSH session** for a variable that only `pam_env` sets. Fedora does
    not stack `pam_env` in `sshd` or `password-auth`, so it measured a stack that never reads
    the file. Also found on 2026-09-11, also red against a working image.

**Rule adopted:** every probe needs a positive control — a demonstration that it can observe
the thing at all — before its negative result is believed.

### Family 4 — parsing that silently corrupted the value

14. A D-Bus property read used `tr -d 's" '` to strip the wrapper. That deleted the letter `s`
    **inside the value**: `opportunistic` arrived as `opportunitic` and went red against a
    working control. The companion assertion for `allow-downgrade` **passed the same broken
    parser**, because that value contains no letter `s`. Fixed with
    `awk '{print $NF}' | tr -dc 'a-z-'`.

### The defect that fired four times: `UMASK 027`

This one deserves its own heading because it is a second-order effect of a control SP+ ships,
and because it is the kind of thing that is very hard to see.

SP+ sets `UMASK 027`. Therefore **anything a root shell creates on a running machine lands
mode 0640.** A daemon running as its own unprivileged user then cannot read that file — and
`systemd-resolved`, notably, **ignores an unreadable drop-in with no log line at all.**

Worse, `systemd-analyze cat-config` runs as root, so the configuration **looks applied** when
you check it.

It broke four separate things:

| What | Consequence |
|---|---|
| A `resolved` drop-in written at 0640 | DNS over TLS silently stayed off while the measurement reported success |
| `/run/real-mac`, written by `sudo tee` | Unreadable by the unprivileged restore step, so a MAC address restore failed |
| A Brave launcher copied with `sudo cp` | Landed 0750; every run exited 126 |
| The initial heap-policy files | Would have been unreadable by the readers that need them |

**Rule adopted, and now enforced by build gates:** every configuration file a non-root daemon
must read has its mode asserted explicitly at build time, and the containing directory's mode
too. The T2.3 and T2.5 gates both fail the build on anything other than `644` and `755`, with
a message that names the consequence rather than the mode.

### What the register is evidence of

Twelve of the fourteen entries above were found by the mutation discipline rather than by
review. Two were found in the last hours of the work, in newly written assertions, by the same
discipline. The rate at which this class of defect appears is the argument for the discipline:
**a check is not evidence until it has been observed to fail.**

---

## 8. What SP+ deliberately does not do

Each of these is a decision with a recorded trigger that would reopen it. They are listed so
that a reviewer does not read their absence as an oversight, and so that nobody "fixes" one
without understanding what it costs.

| Not done | Why | What reopens it |
|---|---|---|
| **VM compartmentalization** (a Qubes-shaped boundary) | The strongest available answer to browser compromise, and incompatible with a non-technical advisor on a single laptop. The compartment boundary here is the application sandbox instead, with the limits of that stated in §5.9 | SP+ ever shipping a managed second machine |
| **USBGuard** | Collides head-on with D44. Docks, printers, keyboards and USB storage all arrive by insertion | Nothing currently |
| **Disabling Xwayland** | Breaks NVIDIA paths and legacy applications | Nothing currently |
| **SUID removal** | Secureblue deletes `sudo`, `su`, `pkexec`, `chsh`, `chfn`. Exactly the class of change that breaks printing or mounting on a machine nobody can support. SP+ inventories instead | Nothing currently |
| **Per-package rebuild hardening** | Makes SP+ a distribution builder rather than a delta on one | A named vulnerability class demanding it |
| **Replacing Brave** | Recorded ruling, D45. Security work hardens around it | Two open questions on their own clock |
| **`mitigations=auto,nosmt`** | Up to ~40% on parallel work, permanent, against a threat class this user does not face | A threat model change |
| **`hardened_malloc`** | D49. Fifth trust root, vendor's own RPM does not enable it, documented Electron breakage | SP+ deciding to vendor and build it from source, adding no repository |
| **SELinux confinement for Brave** | D50. Enforcing breaks the day; permissive is telemetry, not containment | One hour of real browser use on real hardware with the audit log kept |
| **Disabling mDNS / avahi** | Printer discovery is day-one job number four | Nothing currently |
| **Requiring a password for `sudo`** | The assistant cannot answer a prompt, the advisor often cannot either, and it stops nobody already at the keyboard | A change in how the assistant authenticates |
| **Blocking ICMP echo** | Breaks ordinary LAN troubleshooting, buys nothing against any listed threat | Nothing currently |
| **Compliance claims of any kind** | D15 | An actual audit |

---

## 9. Residual risk

After every control described in this document, all of the following remain true. This list is
the counterpart to the 80 passing assertions, and it should be read with them.

1. **A stolen unlocked machine is fully compromised.** The lock screen is the boundary. T9 is
   unmitigated by design.
2. **A browser compromise reaches the whole machine.** Code execution as the advisor reaches
   every client document and credential, and via passwordless `sudo`, root. This is the
   strongest argument for the confinement work deferred under D50.
3. **An attacker who can write the published tag and hold the signing key owns the fleet.**
   Signature verification raises the cost; it does not remove the anchor. The published tag is
   **not yet re-signed** in the format the shipped policy reads, so today the practical state
   is that verification is present in the image and not yet exercised end to end in production.
4. **DNS encryption is defeatable by an active attacker** who blocks TCP 853, by construction.
5. **The wired MAC address is unchanged and identifiable.**
6. **Firmware, Secure Boot keys and hardware are trusted and unverified by SP+.**
7. **Rollback is not backup.** No external backup story in v1. Ransomware or disk failure means
   data loss.
8. **One build host, no CI.** A compromise of the build machine compromises everything
   downstream of it, and there is no second party to notice.
9. **No SBOM in a standard format and no reproducibility claim** for the SP+ delta.
10. **No per-application Flatpak permission baseline.**
11. **Malicious documents are addressed only by LibreOffice defaults.**
12. **The advisor is part of the trusted computing base.** Phishing resistance rests on Brave's
    policy, Safe Browsing and the advisor's judgement.

Two of these — items 3 and 8 — are the ones a reviewer should press hardest on. They are the
items where a single failure has fleet-wide reach.

---

## 10. Decision register extract

The full register is `docs/06-OPEN-QUESTIONS-AND-DECISIONS.md`. Entries bearing on security:

| # | Decision |
|---|---|
| D5 | No out-of-tree kernel modules, no custom kernel |
| D6 | Golden-image capture is a discovery technique, never a shipping mechanism |
| D15 | **No compliance claims** |
| D21 | `--target-imgref` is mandatory |
| D22 | **SELinux stays enforcing** |
| D24 | No `dnf update` in the Containerfile |
| D30 | Secure Boot is pre-tested in QEMU |
| D43 | The Fedora/KDE bootc lane is the sole target of security-architecture work; Debian is parked |
| D44 | **Nothing may break day one.** A control that breaks printing, discovery, Wi-Fi, the browser, PWAs, audio, camera, microphone, suspend/resume, external display or Bluetooth is rejected outright |
| D45 | Brave is fixed for the current lane; security work hardens around it |
| D46 | **Every security control ships with an assertion in the runtime posture gate, mutation-tested red before green.** A control without an assertion does not ship |
| D49 | `hardened_malloc` dropped; `glibc.malloc.tcache_count=0` ships instead, described as smaller |
| D50 | SELinux confinement for Brave deferred; the permissive domain is not shipped |

Unratified and outstanding:

| # | Question |
|---|---|
| D47 | Should sshd ship installed at all, given it ships disabled? |
| D48 | Should SP+ vouch by name for Zoom and Signal on the `flathub-vouched` remote? |
| — | Should the published ghcr tag be re-signed in the readable format, activating end-to-end verification? |

---

## Appendix A — Complete runtime posture gate output, t29

Captured 2026-09-11 against a genuine first boot of the installed t29 image. Zero failed
system units and zero failed user units at the time of capture.

```
SP+ runtime posture gate — test@127.0.0.1:2222

  PASS  no world-listener on 139               absent
  PASS  no world-listener on 445               absent
  PASS  no world-listener on 1716              absent
  PASS  no world-listener on 5357              absent
  PASS  help app is loopback-only              tcp 127.0.0.1:8766 tcp 127.0.0.1:8765 
  PASS  smb.service masked                     masked
  PASS  smb.service not running                inactive
  PASS  nmb.service masked                     masked
  PASS  nmb.service not running                inactive
  PASS  no WSD responder                       wsdd inactive, 0 sockets on 5357 (BindsTo=smb.service)
  PASS  firewall default zone                  public
  PASS  high port range closed                 none
  PASS  kdeconnectd not running                0 processes
  PASS  no kdeconnect D-Bus activation         0 files
  PASS  selinux enforcing                      Enforcing
  PASS  sshd passwordauthentication no         passwordauthentication no
  PASS  sshd permitrootlogin no                permitrootlogin no
  PASS  sshd kbdinteractiveauthentication no   kbdinteractiveauthentication no
  PASS  secure boot enabled                    SecureBoot enabled
  PASS  kernel lockdown active                 none [integrity] confidentiality
  PASS  module signature enforced              sig_enforce=Y
  PASS  tpm 2.0 present                        tpm0 version 2
  PASS  ptrace scope restricted                kernel.yama.ptrace_scope=1
  PASS  kernel pointers hidden                 kernel.kptr_restrict=2
  PASS  dmesg restricted                       kernel.dmesg_restrict=1
  PASS  perf events restricted                 kernel.perf_event_paranoid=3
  PASS  kexec load disabled                    kernel.kexec_load_disabled=1
  PASS  unprivileged bpf disabled              kernel.unprivileged_bpf_disabled=1
  PASS  bpf jit hardened                       net.core.bpf_jit_harden=2
  PASS  suid dumps disabled                    fs.suid_dumpable=0
  PASS  protected symlinks                     fs.protected_symlinks=1
  PASS  protected hardlinks                    fs.protected_hardlinks=1
  PASS  sysrq disabled                         kernel.sysrq=0
  PASS  unprivileged userfaultfd off           vm.unprivileged_userfaultfd=0
  PASS  core dumps discarded                   core_pattern=|/bin/false
  PASS  core rlimit zero in login shell        ulimit -Hc = 0
  PASS  systemd-homed.service masked           masked
  PASS  systemd-homed-activate.service masked  masked
  PASS  sssd.service masked                    masked
  PASS  sssd-kcm.socket masked                 masked
  PASS  guest agent absent vmware-user-suid-wrapper /usr/bin/vmware-user-suid-wrapper not installed
  PASS  guest agent absent qemu-ga             /usr/bin/qemu-ga not installed
  PASS  sp-plus.service sandboxed              exposure 1.1 < 5.0
  PASS  suid set within allowlist              22 files, none unexpected
  PASS  flathub restricted to verified         subset=verified
  PASS  vouched remote not browsable           system,no-enumerate
  PASS  vouched remote enumerates nothing      0 applications listed
  PASS  optional tools all resolve             4 of 4 from their shipped remote
  PASS  karg init_on_alloc=1                   on the installed cmdline
  PASS  karg init_on_free=1                    on the installed cmdline
  PASS  karg randomize_kstack_offset=on        on the installed cmdline
  PASS  karg slab_nomerge                      on the installed cmdline
  PASS  karg vsyscall=none                     on the installed cmdline
  PASS  karg pti=on                            on the installed cmdline
  PASS  nosmt not reinstated                   no mitigations= on the cmdline
  PASS  no vsyscall mapping                    0 vsyscall lines in a live process map
  PASS  no merged slab caches                  0 aliases summed across every cache
  PASS  page table isolation active            X86_FEATURE_PTI set on 4 cpus
  PASS  login shell umask 027                  umask=0027
  PASS  new files group-read only              mode 640
  PASS  weak password rejected                 pwscore: Password quality check failed:
  PASS  minlen 12 enforced                     an 11 character password is refused
  PASS  long passphrase accepted               pwscore 100, no class rules imposed
  PASS  faillock locks after 10 tries          10 failures recorded, then the account stopped counting
  PASS  lockout policy clears itself (policy read) unlock_time=120, root not locked
  PASS  empty passwords not accepted           only in sssd-shadowutils, and sssd is masked
  PASS  DNS over TLS opportunistic             resolved reports DNSOverTLS=opportunistic
  PASS  DNSSEC allow-downgrade                 resolved reports DNSSEC=allow-downgrade
  PASS  captive portals still usable           DoT is downgradeable, so a portal can still be reached
  PASS  resolved drop-in readable by resolved  file 644, dir 755
  PASS  a real query is encrypted              resolvectl reports encrypted transport
  PASS  wifi mac is per-network stable (config) effective value is stable-ssid
  PASS  wired mac left alone (config)          effective value is preserve
  PASS  no random mac anywhere                 nothing in the effective config asks for a random address
  PASS  wired link uses its own hardware address enp1s0 is on its own 52:54:00:4a:35:1c

--- T2.5: glibc heap policy ---
  PASS  heap tunable reaches a pam_env login   su exports GLIBC_TUNABLES=glibc.malloc.tcache_count=0
  PASS  heap tunable reaches the desktop session systemd user manager exports glibc.malloc.tcache_count=0
  PASS  heap tunable reaches a system service  NetworkManager's own environ carries glibc.malloc.tcache_count=0
  PASS  tcache is genuinely disabled           abort came from the non-tcache path: double free or corruption (!prev)
  PASS  inert malloc tunables not shipped      neither malloc.check nor malloc.perturb appears in any environment layer

passed=80 failed=0
RUNTIME_POSTURE_OK all 80 controls measured in effect
```

---

## Appendix B — Build-time gate markers

74 distinct assertions embedded in the Containerfile as `RUN` steps. A failing gate fails the
build. Listed by the marker each prints on success, with variable expansions left as written.

```
ADVISOR_TOOLKIT_OK $(rpm -q vlc 7zip git | tr '\n' ' ')no-virt /dev/kvm=0666
AUTOSTART_OK count=$(ls /etc/xdg/autostart/ | wc -l)
BRAVE_DEFAULT_GATE_OK brave owns http(s), first-run default check suppressed
BRAVE_INSTALL_OK ${BRAVE_VERSION}-${BRAVE_RELEASE}, repo and key removed
BRAVE_PIN_GATE_OK pinned to an exact literal $BRAVE_VERSION-$BRAVE_RELEASE
BRAVE_POLICY_OK $(python3 -c 
CALM_DEPS_OK $(rpm -q paper-icon-theme jetbrains-mono-fonts | tr '\n' ' ')
CRASH_GATE_OK reports open the advisor's mail client to info@secureprospective.com; sentry masked
DEBLOAT_OK enabled_units=$(systemctl list-unit-files --state=enabled --no-legend | grep -c .)
DN15_KARGS_OK rhgb quiet staged for the installed cmdline
DN15_PLUGIN_OK script.so present on disk and in the initramfs
DN17_BRANDING_OK en_US catalog installed, plasma-setup still enabled
DN17_LOCALE_OK locale.conf + environment.d + drop-in, en_US leads the LANGUAGE list
DN20_FINISHED_ART_OK SP+ lockup replaces Konqi at 500x334 on the final wizard page
DN21_RPC_LOOPBACK_OK unit pins 127.0.0.1 and the kernel denies every other address
DN23_WIZARD_BYPASSED_OK flag file present; plasma-setup will find its work done
DN24_FIRST_LOGIN_OK look-and-feel is applied, not merely named
DN29_HOME_GATE_OK pam_mkhomedir, console+plasmalogin PAM, first-boot unit enabled
DN30_HEALTH_GATE_OK daily, persistent, reuses the tuner detector
DN32_TUNE_GATE_OK survey-only, no package verbs, EDID read by bytes
DN34_FLATPAK_UPDATE_OK daily and persistent; preinstall retired
DN36_WIFI_POWERSAVE_OK shipped in /usr/lib, value 2 = disable
DN40_GVFS_SMB_OK office folder mounting is actually installed
DN46_UPDATE_GATE_OK stages daily, applies at shutdown, never reboots, notifies once
DN47B_METADATA_GATE_OK firmware and appstream catalogues refresh on a schedule
DN47_POLKIT_GATE_OK the advisor can finish an update in all three lanes
DN47_POLKIT_SYNTAX_OK the update rules file parses as JavaScript
DN48_OFFICE_PARITY_OK shared .xcd layer, $(grep -c 'oor:op=\
DN49_HELP_APP_OK pinned help ships, serves loopback only, and caches the manual offline
FIN_AGENT_OK pi $(/usr/bin/pi --version) ships as Fin, no key in the image
FINAL_TRIM_OK usr_bytes=$(du -sb /usr | cut -f1) packages=$(rpm -qa | wc -l) locales=$lc
FIN_GUARDRAILS_OK 3 extensions loaded by path; sudo deliberately NOT gated
FIN_ORGANIZE_OK names-only promise is mechanical; marketing skill carries the review rule
FIN_SCHOOL_OK Fin's ichthys shoal renders: 10 lines, <=72 cols, 12 small fish, blue+grey
FIN_UPDATE_LANE_OK Fin updates with the image; the npm route is gated
FLATHUB_SUBSET_GATE_OK flathub=verified subset, flathub-vouched unsubsetted, two vouched apps
GLOBAL_THEME_DEFAULT_OK themes=$(ls /usr/share/plasma/look-and-feel | wc -l)
GROUPS_OK count=$(grep -c . /etc/group)
KEYRING_GATE_OK pam_kwallet wired into /etc/pam.d/kde for plasmalogin
MAILTO_OK gmail and outlook compose URLs built from a mailto link
MENU_OK visible_entries=$vis
MIME_OK defaults point at applications that exist
NODE_INTL_OK node-22 Intl.Segmenter
PI_PIN_GATE_OK pinned to an exact literal $PI_VERSION
POSTURE_GATE_OK zone=public smb+nmb=masked kdeconnect-dbus=removed
PROVENANCE_GATE_OK $(wc -l < /usr/share/sp-plus/security/rpm-manifest.txt) packages recorded with the base digest
PWA_GATE_OK seven advisor web apps chromeless, icons present
RELEASEVER_GATE_OK \$releasever pinned to Fedora $rel, not SP+ $VERSION_ID
SENSORS_OK lm_sensors installed for System Monitor
SIGPOLICY_GATE_OK default=reject, ghcr scope sigstoreSigned, attachments on, key parses
SSHD_GATE_OK sshd installed but not enabled; the QA kickstart turns it on
SSH_KEY_GATE_OK no key in /etc/skel, sshd is key-only
STARSHIP_OK $(/usr/bin/starship --version | head -1)
STORE_GATE_OK stock Discover, backends flatpak+fwupd, no rpm-ostree, no PackageKit, Flathub shipped
SUID_GATE_OK $(wc -l < /tmp/found) setuid/setgid files, all on the allowlist
SYSCTL_GATE_OK hardening sysctls ship in /usr, coredumps disabled in both halves
T23_DOT_GATE_OK opportunistic DoT, allow-downgrade, world-readable 0644
T24_KARGS_OK six hardening arguments staged, nosmt absent
T25_MALLOC_BEHAVIOUR_OK tcache genuinely disabled, proven by a changed abort path
T25_MALLOC_CONFIG_OK three layers, 0644, check and perturb refused
T26_LOGIN_GATE_OK faillock 10/120s, pwquality minlen 12, umask 027, nullok removed
T27_MAC_GATE_OK wifi stable-ssid, ethernet preserve, no randomization on wired
TOOLS_OK btop $(btop --version | grep -oE '[0-9.]+$'), fastfetch, flameshot configured out of the box
TRIM_OK usr_bytes=$(du -sb /usr | cut -f1) packages=$(rpm -qa | wc -l)
TUNING_OK vm.swappiness=180 for zram over rotational storage
UNITS_GATE_OK homed and sssd masked; printing, discovery and bluetooth untouched
UPDATE_LANE_GATE_OK one guarded lane; Discover keeps apps and firmware
USB_ENCRYPTION_GATE_OK gnome-disks formats LUKS sticks; udisks unlocks them on insert; GNOME disk notifier autostart removed
VMTOOLS_GATE_OK open-vm-tools and qemu-guest-agent gone, one SUID root binary with them
WELCOME_EGRESS_OK ask box present, no-data claim withdrawn
WELCOME_EGRESS_OK no ask box, no-data claim is true
WELCOME_HELP_OK search ships, the answer bar stays hidden, corpus intact
WELCOME_OK primal=ABSENT fallback=NotoSansCondensedBlack (see welcome/PRIMAL-FONT.md)
WELCOME_OK primal=SHIPPED
WELCOME_UPDATE_WIRING_OK the manual lane uses the guarded helper
WSDD_OK $(rpm -q wsdd) literal hardening flags
```

---

## Appendix C — Kernel hardening sysctls, read off the running kernel

```
kernel.yama.ptrace_scope = 1
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.perf_event_paranoid = 3
kernel.sysrq = 0
kernel.kexec_load_disabled = 1
vm.unprivileged_userfaultfd = 0
kernel.unprivileged_bpf_disabled = 1
net.core.bpf_jit_harden = 2
fs.suid_dumpable = 0
fs.protected_symlinks = 1
fs.protected_hardlinks = 1
fs.protected_fifos = 2
fs.protected_regular = 2
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_rfc1337 = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0
net.ipv4.icmp_echo_ignore_all = 0
net.ipv4.icmp_ignore_bogus_error_responses = 1
kernel.core_pattern = |/bin/false
vm.swappiness = 180
```

---

## Appendix D — SUID and SGID allowlist

Shipped in the image at `/usr/share/sp-plus/security/suid-allowlist.txt`. 22 files, measured
present and measured as containing no unexpected entries. A new setuid root binary appearing
in a future image is a build failure.

```
# SP+ SUID/SGID allowlist — T1.10.
#
# INVENTORY, NOT REMOVAL. Secureblue deletes sudo, su, pkexec, chsh and chfn.
# That is exactly the class of change that breaks printing or mounting on a
# machine nobody can support, so SP+ does not do it (doc 15 Tier 3). What SP+
# does instead is know the list and notice when it changes. A new SUID root
# binary arriving in the image is a build failure, not a discovery six months
# later.
#
# Anything added here needs a reason in the commit that adds it.
/usr/bin/chage
/usr/bin/chfn
/usr/bin/chsh
/usr/bin/fusermount3
/usr/bin/gpasswd
/usr/bin/grub2-set-bootflag
/usr/bin/lockdev
/usr/bin/mount
/usr/bin/mount.nfs
/usr/bin/newgrp
/usr/bin/pam_timestamp_check
/usr/bin/passwd
/usr/bin/pkexec
/usr/bin/su
/usr/bin/sudo
/usr/bin/umount
/usr/bin/unix_chkpwd
/usr/bin/userhelper
/usr/lib/opt/brave.com/brave/chrome-sandbox
/usr/lib/polkit-1/polkit-agent-helper-1
/usr/libexec/dbus-1/dbus-daemon-launch-helper
/usr/libexec/utempter/utempter
```

---

## Appendix E — Kernel command line, as shipped

`/usr/lib/bootc/kargs.d/`, which is the only durable owner of installed kernel arguments.
ostree regenerates boot loader entries, so an edit made to a BLS entry on a running machine
does not survive a reboot.

```
# SP+ DN-15: without rhgb, plymouth never takes the panel and the LUKS
# passphrase prompt is invisible -- the machine looks dead. quiet keeps
# the kernel log off the splash so the advisor sees the prompt, not scroll.
kargs = ["rhgb", "quiet"]
# SP+ T2.4: kernel hardening arguments. Effects are asserted at runtime by
# tests/runtime-posture-gate.sh, not merely by reading this file back.
# mitigations=auto,nosmt is deliberately absent -- see doc 15 section 4.
kargs = [
  "init_on_alloc=1",
  "init_on_free=1",
  "randomize_kstack_offset=on",
  "slab_nomerge",
  "vsyscall=none",
  "pti=on",
]
```

---

## Appendix F — Brave managed policy, as shipped

`/etc/brave/policies/managed/sp-plus.json`. Applied as enterprise policy, so it is not
changeable by the user or by a web page.

```
AutofillCreditCardEnabled        = False
BookmarkBarEnabled               = True
BraveAIChatEnabled               = False
BraveNewsDisabled                = True
BraveP3AEnabled                  = False
BraveRewardsDisabled             = True
BraveShieldsDisabledForUrls      = []
BraveStatsPingEnabled            = False
BraveTalkDisabled                = True
BraveVPNDisabled                 = True
BraveWalletDisabled              = True
BraveWebDiscoveryEnabled         = False
ComponentUpdatesEnabled          = True
DefaultBrowserSettingEnabled     = False
DnsOverHttpsMode                 = automatic
HomepageIsNewTabPage             = False
HomepageLocation                 = http://127.0.0.1:8766/
MetricsReportingEnabled          = False
PasswordLeakDetectionEnabled     = True
PasswordManagerEnabled           = True
PromotionsEnabled                = False
RestoreOnStartup                 = 4
RestoreOnStartupURLs             = ['http://127.0.0.1:8766/']
SafeBrowsingProtectionLevel      = 1
ShowHomeButton                   = True
TorDisabled                      = True
```

---

## Appendix G — Signature policy and lookaside configuration

`/etc/containers/policy.json` — reject by default, accept the SP+ repository only on a
verified sigstore signature.

```
{
    "default": [
        {
            "type": "reject"
        }
    ],
    "transports": {
        "docker": {
            "ghcr.io/secureprospective/sp-plus-kde": [
                {
                    "type": "sigstoreSigned",
                    "keyPath": "/etc/pki/containers/sp-plus-cosign.pub",
                    "signedIdentity": {
                        "type": "matchRepository"
                    }
                }
            ]
        },
        "containers-storage": {
            "": [
                {
                    "type": "insecureAcceptAnything"
                }
            ]
        },
        "dir": {
            "": [
                {
                    "type": "reject"
                }
            ]
        },
        "docker-daemon": {
            "": [
                {
                    "type": "reject"
                }
            ]
        },
        "oci": {
            "": [
                {
                    "type": "reject"
                }
            ]
        },
        "oci-archive": {
            "": [
                {
                    "type": "reject"
                }
            ]
        },
        "docker-archive": {
            "": [
                {
                    "type": "reject"
                }
            ]
        }
    }
}
```

`/etc/containers/registries.d/ghcr-secureprospective.yaml` — the one line without which the
policy finds no signature and rejects every update.

```
# Cosign attaches its signature to the registry as a separate `.sig` artifact
# rather than to a lookaside server. containers/image does not go looking for
# those unless it is told to, and if it does not look it finds no signature and
# the pull is REJECTED. This one line is the difference between a policy that
# verifies and a policy that refuses everything.
docker:
    ghcr.io/secureprospective:
        use-sigstore-attachments: true
```

---

## Appendix H — Where to find the primary sources

All paths are relative to the repository root, `projects/sp-plus/`.

| Artifact | Path |
|---|---|
| Threat model | `docs/14-THREAT-MODEL.md` |
| Defense-in-depth roadmap | `docs/15-DEFENSE-IN-DEPTH-ROADMAP.md` |
| Decision register | `docs/06-OPEN-QUESTIONS-AND-DECISIONS.md` |
| Image definition and all 74 build gates | `images/kde/Containerfile` |
| Runtime evidence suite, all 80 assertions | `tests/runtime-posture-gate.sh` |
| Publish lane and its refusals | `scripts/publish-image.sh` |
| ISO build and payload verification | `scripts/build-iso.sh` |
| Test VM harness | `tests/spplus-testvm.sh` |
| Heap policy measurement and resolution | `docs/ledger/PHASE-T25-2026-09-11-hardened-malloc.md` |
| Browser confinement investigation, with the working policy skeleton | `docs/ledger/PHASE-T21-2026-09-11-brave-selinux.md` |
| DNS over TLS, including the captive-portal measurements | `docs/ledger/PHASE-T23-2026-09-11-dns-over-tls.md` |
| MAC address policy | `docs/ledger/PHASE-T27-2026-09-11-mac-policy.md` |
| Login and password policy | `docs/ledger/PHASE-T26-2026-09-11-login.md` |
| Flathub verified subset | `docs/ledger/PHASE-T22-2026-09-11-flathub.md` |
| Overall scorecard for this branch | `docs/ledger/PHASE-COMPLETE-2026-09-11-defense-in-depth.md` |

On the build host, raw measurement logs are under `~/logs/sp-plus/`, including
`t25-malloc-20260911T113641Z/` which holds the four probe scripts and their output for the
allocator work in §5.8.

---

## Closing statement

SP+ is strong in update integrity, recovery, disk encryption, kernel policy and the honesty of
its own documentation.

It is weak in application confinement. Its compartment boundary is the application sandbox
rather than a virtual machine, which is the only boundary of that kind available on a single
laptop belonging to a non-technical user. Flatpak applications are confined by bubblewrap and
reach the system through portals; the browser carries its own internal sandbox; and the browser
ships as a native RPM, so it sits outside Flatpak confinement entirely. That last point is the
weakest link in this layer and it is stated in §5.9 rather than buried.

It trusts a single build host.

And it grants passwordless `sudo` to every *unconfined* process running as the advisor, not
only to the assistant the grant was written for. The qualifier is load-bearing and was added on
2026-09-11: a Flatpak under bubblewrap, a unit with `NoNewPrivileges`, and anything SELinux
confines are materially different from an unconfined shell, so "every process at the advisor's
UID" would overstate the exposure. What is not overstated is that the grant is written on
`%wheel` while its justification is written about the assistant, and those are not the same set.

That is a deliberate trade, made so that an assistant can repair a machine whose owner has no
support desk and often cannot recall a password. But it is the loss of a boundary and not merely
the removal of a prompt, because malware running as the advisor inherits the grant without the
advisor deciding anything. Writing that down is honesty, not mitigation.

Since 2026-09-11 there is one control in front of it, and its scope is narrow enough to state in
a sentence. Fin's bash guardrail shows the advisor any command that would **outlive the
conversation** — a new software source, a signing key, a service that starts by itself, another
administrator, a different place to get updates — and they can decline. That is not a defence
against malware holding the advisor's UID: external source review on 2026-09-11 demonstrated
five separate ways to synthesise a click on this desktop, one of which carries a literal
`// TODO: make secure` upstream, and this document does not claim otherwise. It is a check on
instructions smuggled into content the assistant reads, where the attacker is text and text
cannot answer a prompt. A boundary rather than a check needs an approval path outside the
advisor's session. That is recorded as the target and it is not built.

The claim this document makes is narrow and it is the only one worth making: **every control
listed as shipping has been measured in effect on a booted machine, and every measurement has
been shown capable of failing.** Where a control is absent, the absence is a decision with a
recorded trigger. Where a risk remains, it is in §9.

A reviewer who wants to test the integrity of this report should start with §7. It is the
record of this project's own checks failing, and it is the reason the other sections can be
read as measurements rather than as intentions.
