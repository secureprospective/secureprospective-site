# SP+ deep security posture — alpha4, measured 2026-09-10

**What this is.** Every number below was measured over SSH on a booted SP+ alpha4, installed
fresh from the ISO built that morning. Nothing here is read out of the Containerfile. This file
is the evidence behind `14-THREAT-MODEL.md` and `15-DEFENSE-IN-DEPTH-ROADMAP.md`; where those
documents state a fact about the machine, it came from here.

**The machine.** `PRETTY_NAME=SP+ 1 (20260910)`, `BUILD_ID=20260910`, `ID=sp-plus`, kernel
`7.1.13-200.fc44.x86_64`. Installed by `fleet/bin/spplus-testvm.sh install` into domain
`spplus-test` from
`artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/…iso`,
sha256 `d841d489ed9ce57d928e97678fa8a388215a2a914a5c9f170b0b7aca489dbccd`.

**ISO provenance verified before install.** Payload `localhost/sp-plus-kde:alpha4`, image id
`68b3c5ba3721`; the installer's own `DN51_PAYLOAD_REF_OK` gate confirmed the embedded kickstart
installs from that ref, and the config blob copied into the ISO is `sha256:68b3c5ba3721…`. The
2026-09-04 ref mismatch that killed every install in Anaconda is ruled out for this ISO.

## 0. What this measurement CANNOT tell you

**The test VM has no Secure Boot.** It boots `/usr/share/OVMF/OVMF_CODE_4M.fd` with
`OVMF_VARS_4M.fd` — not the `OVMF_CODE_4M.secboot.fd` + `OVMF_VARS_4M.ms.fd` pair that D30
requires. In-guest: `bootctl status` reports `Secure Boot: disabled (unsupported)`, the
`SecureBoot` EFI variable is absent, and `TPM2 Support: no`.

Four results below are therefore **not evidence about the product**, only about this VM:

| Reading | Value here | Why it is not a product finding |
|---|---|---|
| `/sys/kernel/security/lockdown` | `[none]` | Fedora auto-enables lockdown under Secure Boot. With SB off, `none` is expected |
| `module sig_enforce` | `N` | Same dependency |
| `mokutil --sb-state` | fails | The binary IS present at `/usr/bin/mokutil`. It fails because there is no SB state to read |
| TPM2 / PCR policy | absent | No vTPM attached to this domain |

**`spplus-testvm.sh` does not build a Secure Boot VM.** That is a gap in the test tooling. Until
it is fixed, no SP+ claim about Secure Boot, kernel lockdown, module signing or TPM has been
tested by this lane. D30 requires the secboot firmware pair and this harness does not use it.

## 1. Existing posture gate — the baseline

`tests/runtime-posture-gate.sh test@127.0.0.1 2222 ~/.ssh/spvm` →
`RUNTIME_POSTURE_OK all 18 controls measured in effect`, 18 passed, 0 failed.

Everything that gate covers is holding on alpha4: no world-listener on 139/445/1716/5357, help
app loopback-only on 8765/8766, smb and nmb masked and inactive, no WSD responder (wsdd inactive,
`BindsTo=smb.service`), firewalld default zone `public`, high port range closed, no kdeconnectd
and no kdeconnect D-Bus activation, SELinux Enforcing, and sshd with password auth, root login
and keyboard-interactive all off.

**What that gate does not cover** is layers 1, 2, 3, 5 and 6 entirely, and the confinement of
SP+'s own additions. The rest of this file is that uncovered ground.

## 2. Layer 1, supply chain — THE FINDING

**SP+ signs its images and no installed machine verifies the signature.**

Measured `/etc/containers/policy.json` on the installed system is the stock Fedora default:

```json
{
    "default": [ { "type": "insecureAcceptAnything" } ],
    "transports": { "docker-daemon": { "": [{"type":"insecureAcceptAnything"}] } }
}
```

Corroborating measurements:

| Check | Result |
|---|---|
| `/etc/pki/containers/` | does not exist |
| `/etc/containers/registries.d/` | `default.yaml`, `registry.access.redhat.com.yaml`, `registry.redhat.io.yaml`. **No ghcr.io entry** |
| `default.yaml` lookaside | commented out, stock |
| `images/kde/Containerfile` grep for `policy.json\|sigstore\|cosign\|signedBy\|sigstoreSigned` | **zero matches in 2,921 lines** |
| `bootc status` booted image | `ghcr.io/secureprospective/sp-plus-kde:latest`, transport `registry` |

**Why this matters.** D13 records: "Images are cosign-signed and a signature policy ships in the
image." Publishing genuinely signs — `publish-image.sh` signs by digest and verifies. The
**enforcement half was never built**, so the signature protects nothing on the machine.

Every installed SP+ machine pulls `ghcr.io/secureprospective/sp-plus-kde:latest` and bootc stages
what it finds. `publish-image.sh` prevents *Secure Prospective* publishing a bad image. It cannot
prevent anyone else who can write that tag from doing so, and the machine will accept it. This is
the same vector as the 2026-09-01 BlueBuild incident, which is the incident the signing lane was
created in response to.

Secureblue's equivalent is `modules/secureblue-signing/policy.json`: default `{"type":"reject"}`
with `sigstoreSigned` exceptions pinned to their key.

**Not measured, and worth checking separately:** whether `--target-imgref` machines also lack a
signature policy in the installer kickstart, and whether `bootc` on this Fedora version consults
any policy path other than `/etc/containers/policy.json`.

## 3. Layer 3, kernel

Active LSMs: `lockdown,capability,yama,selinux,bpf,landlock,ipe,ima,evm`. Yama is loaded and
Landlock is available; neither is being used to restrict anything.

Kernel command line carries `rhgb quiet` and the LUKS/ostree arguments. No hardening arguments.

| sysctl | alpha4 | Note |
|---|---|---|
| `kernel.yama.ptrace_scope` | **0** | Any process may ptrace any other at the same UID. Yama is loaded and set to its weakest value |
| `kernel.kptr_restrict` | **0** | Kernel pointers exposed |
| `kernel.dmesg_restrict` | 1 | Fedora default, good |
| `kernel.unprivileged_bpf_disabled` | 2 | Fedora default, good |
| `net.core.bpf_jit_harden` | absent | |
| `kernel.kexec_load_disabled` | 0 | |
| `kernel.modules_disabled` | 0 | |
| `user.max_user_namespaces` | 31115 | Unrestricted. Brave's sandbox and Flatpak both depend on this |
| `kernel.perf_event_paranoid` | 2 | |
| `fs.protected_*` (symlinks, hardlinks, fifos, regular) | all 1 | Fedora defaults, good |
| `kernel.randomize_va_space` | 2 | Full ASLR |
| `vm.swappiness` | 180 | SP+ set this, for zram |

`sysctl.d` files present: Fedora's own, plus `53-brave.conf` and SP+'s `60-sp-plus-zram.conf`.
**SP+ ships exactly one sysctl file and it is a performance tune, not a security control.**

Module policy: only Fedora's stock blacklists. SP+ adds none.

## 4. Layer 4, privilege

**SUID and SGID under `/usr` — 23 binaries.** Notable: `pkexec`, `sudo`, `su`, `mount`,
`umount`, `mount.nfs`, `fusermount3`, `passwd`, `chage`, `chfn`, `chsh`, `gpasswd`, `newgrp`,
`userhelper`, `pam_timestamp_check`, `unix_chkpwd`, `grub2-set-bootflag`, `lockdev`,
`utempter`, `dbus-daemon-launch-helper`, `polkit-agent-helper-1`,
`/usr/lib/opt/brave.com/brave/chrome-sandbox`, and `vmware-user-suid-wrapper`.

`chrome-sandbox` is required by Brave. `vmware-user-suid-wrapper` is on an advisor laptop for no
reason SP+ has stated.

**File capabilities:** `kwin_wayland cap_sys_nice`, `newgidmap`/`newuidmap cap_setuid/setgid`,
`mtr-packet`, `arping`, `clockdiff`, `gst-ptp-helper`, `ksgrd_network_helper`,
`ksystemstats_intel_helper`, and three `sssd` helpers.

**systemd-analyze security:** `sp-plus.service` scores **7.7 EXPOSED**. It is the one service SP+
adds and it has no sandboxing directives.

**SELinux contexts of SP+'s own processes:**

```
system_u:system_r:unconfined_service_t:s0   python3   (sp-plus.service, port 8765)
unconfined_u:unconfined_r:unconfined_t:s0   python3   (help app, port 8766)
```

SELinux is Enforcing, and **every process SP+ adds runs unconfined**. The posture gate asserts
the global switch, which is true and is not the same thing.

**sudoers:** `%wheel ALL=(ALL) NOPASSWD: ALL`, with a long and honest rationale in the file
itself: Fin runs as the advisor and cannot answer a password prompt, and the advisor often
cannot either. The file states the cost plainly — anyone at an unlocked session is effectively
root — and argues the containment is architectural (read-only `/usr`, rollback, LUKS) rather
than a permission wall. **That reasoning is sound and should not be quietly reversed.** It does
mean the machine's security rests on the lock screen and the disk encryption, which is exactly
what the threat model has to say out loud.

## 5. Layer 6, applications

- **Flatpak:** remotes `fedora` and `flathub`. Flathub is the **unfiltered** remote, not
  `--subset=verified`. **No applications installed.** The exposure is latent, not active: nothing
  is running today and no policy prevents anything tomorrow.
- **Brave:** native RPM, SELinux-unconfined, sandbox via SUID `chrome-sandbox` plus user
  namespaces.
- **Brave managed policy:** 26 keys present and in effect, including `ComponentUpdatesEnabled`
  and `BraveShieldsDisabledForUrls` from the T-36 fix, `DnsOverHttpsMode: automatic`, telemetry
  and Rewards/Wallet/VPN/AIChat/News/Talk/Tor all disabled, `SafeBrowsingProtectionLevel: 1`.

## 6. Layer 7, encryption

`cryptsetup luksDump /dev/vda3`: **LUKS2**, `aes-xts-plain64`, 512-bit key, **argon2id**,
memory 684372. Root filesystem source is `composefs`. This matches what SP+ claims.

## 7. Network

**Listening set:**

| Socket | Process |
|---|---|
| `0.0.0.0:22`, `[::]:22` | **sshd** |
| `0.0.0.0:5355`, `[::]:5355` | systemd-resolved (LLMNR) |
| `0.0.0.0:5353`, `[::]:5353` (udp) | avahi-daemon (mDNS) |
| `127.0.0.1:631`, `[::1]:631` | cupsd |
| `127.0.0.1:8765` | sp-plus.service |
| `127.0.0.1:8766` | help app |
| `127.0.0.53:53`, `127.0.0.54:53` | systemd-resolved |
| `127.0.0.1:323` | chronyd |

**sshd listens on all interfaces and firewalld's public zone permits it.** Services allowed in
the public zone: `dhcpv6-client`, `mdns`, `ssh`.

`mdns` and avahi are **required** — they are printer discovery, and printing is a day-one job.
That exposure is accepted, not accidental, and the threat model should say so.

`ssh` is not required by any advisor workflow. It is development convenience shipping to
production.

**DNS:** `resolvectl` reports `DNSOverTLS=no`, `DNSSEC=no/unsupported`, servers `1.1.1.1` and
`8.8.8.8`. System DNS is plaintext. Only Brave does DNS-over-HTTPS, via its managed policy, so
browser lookups are encrypted and everything else on the machine is not.

## 8. Enabled unit surface

85 enabled units. Beyond the expected desktop and SP+ set, these are enabled on a single-user
advisor laptop and no SP+ document justifies them:

`systemd-homed.service`, `systemd-homed-activate.service`, `sssd.service`, `sssd-kcm.socket`,
`nfs-client.target`, `remote-fs.target`, `remote-cryptsetup.target`,
`remote-integritysetup.target`, `remote-veritysetup.target`, `pcscd.socket`, `smartd.service`,
`lvm2-monitor.service`, `intel_lpmd.service`, `vmware`/`qemu-guest-agent.service`.

`qemu-guest-agent` is correct in a VM and should not reach a laptop image.

SP+'s own enabled units, all present and correct: `sp-plus.service`, `spplus-relabel.service`,
`spplus-mkhomedir.service`, `spplus-grant-admin.service`, `spplus-stage-update.timer`,
`spplus-update-health.timer`, `spplus-flatpak-update.timer`.

`auditd.service` and `audit-rules.service` are enabled, which gives the evidence report a real
audit source it is not currently using.

## 9. Reproducing this

```
fleet/bin/spplus-testvm.sh install <iso> spplus-test
DOM=spplus-test fleet/bin/vmunlock spplustest
tests/runtime-posture-gate.sh test@127.0.0.1 2222 ~/.ssh/spvm
```

**Trap:** `spplus-testvm.sh up` feeds the LUKS passphrase to the *serial* console. The SP+ image
boots `rhgb quiet` with no serial console, so the passphrase types into nothing, sshd never
starts, and the VM looks hung. `vmunlock` sends the keys to the graphical console instead and
documents this exact failure in its own header. Use `vmunlock`.
