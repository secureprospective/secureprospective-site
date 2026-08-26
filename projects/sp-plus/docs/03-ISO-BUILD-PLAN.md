# SP+ — ISO Build Plan

**Document 3 of 6 in the SP+ planning set.**
Status: plan of record for review, 2026-08-25. **Nothing in this document is authorized
to be executed.** It exists so that when building begins, it begins correctly.

This is the phased plan to get from an empty repository to an ISO an advisor can use.
Every phase has an entry condition, a deliverable, and an exit gate. **A phase is not
complete until its gate is demonstrated and recorded.** The failure mode this structure
exists to prevent is the one from 2026-08-25: many things built, several things
verified, and an artifact nobody can hand to a member.

---

## 0. Ground rules for the whole build

1. **The Containerfile is the product.** If a change is not in git, it did not happen.
   No manual step on a build host is ever the source of a shipped behavior.
2. **Prototype to learn, never to ship.** A hand-configured VM is a legitimate way to
   discover what the image needs. Every discovery is transcribed into the Containerfile
   and the prototype is destroyed. See document 2, Option D.
3. **Pin everything by digest.** Base images, builder containers, and the SP+ image
   itself are referenced by `@sha256:...` in anything that ships. Tags move; digests do
   not.
4. **One gate at a time.** Do not build the PWA integration before the image boots with
   Secure Boot on. Do not build the two editions before one edition is accepted.
5. **Record negative results.** "This did not work and here is the error" is a
   deliverable. The 2026-08-25 session did this well and it should continue.
6. **No secrets in the image, ever.** No AI credentials, no signing private keys, no
   recovery keys, no printer credentials, no member data. Not in a layer, not in a
   `Containerfile`, not in build args, not in git history.
7. **Every claim of "passed" names the artifact and the environment.** "Booted" is not a
   result. "`sp-plus-kde:44@sha256:abc…` booted on a ThinkPad T14 Gen 4 with Secure Boot
   enabled, `mokutil --sb-state` = SecureBoot enabled" is a result.

---

## 1. Repository layout

```
projects/sp-plus/
├── images/
│   ├── common/                 # the SP+ delta, shared by both editions
│   │   ├── Containerfile.inc   # package installs, units, branding
│   │   ├── etc/                # files that land in /etc
│   │   │   ├── brave/policies/managed/sp-plus.json
│   │   │   ├── systemd/system/…
│   │   │   └── …
│   │   └── usr/                # vendor defaults, branding, KB, PWA
│   ├── kde/Containerfile       # FROM quay.io/fedora/fedora-kinoite:44
│   └── gnome/Containerfile     # FROM quay.io/fedora/fedora-silverblue:44
├── installer/
│   ├── config.toml             # image-builder config (Track 1)
│   ├── minimal-interactive.ks  # deliberately minimal kickstart
│   └── live/                   # titanoboa config (Track 2)
├── runtime/                    # SP+ local RPC service
├── pwa/                        # advisor-facing PWA
├── knowledge/                  # Markdown knowledge base
├── playbooks/                  # signed remediation playbooks
├── tests/                      # host + guest test suites
├── docs/                       # this planning set + logs
└── ci/                         # GitHub Actions workflows
```

`artifacts/` stays gitignored. The 4.5 GB of qcow2, ISO, and QEMU state currently under
`projects/sp-plus/artifacts/` must be pruned before this layout is adopted; only the
text logs are worth keeping and they belong under `docs/`.

---

## 2. Phase 0 — Feasibility spike (the phase that was skipped)

**Entry condition:** none. Start here.
**Duration estimate:** one working session.
**Purpose:** answer the three questions that can invalidate the entire architecture,
before any effort is invested in it.

### 0.1 Install Podman on the build host

The 2026-08-25 session used Docker because Podman was absent, then spent most of its
effort working around the fact that `image-builder` reads Podman's
`containers/storage` and Docker's image store is not interchangeable. That workaround
(build with Docker → `docker save` → load into a privileged image-builder container's
internal Podman store) is a fragile detour around a `dnf install podman`.

**Podman is a prerequisite, not a preference.** Install it. Delete the Docker path from
the build scripts entirely rather than keeping it as a fallback — a second, subtly
different build path is a source of "works in CI, fails locally" that nobody has budget
to debug.

### 0.2 Spike A — does the derived desktop image build and boot?

```dockerfile
# images/kde/Containerfile  (spike version, ~10 lines)
FROM quay.io/fedora/fedora-kinoite:44
RUN dnf install -y --setopt=install_weak_deps=False \
        firewalld cups cups-filters nss-mdns \
 && dnf clean all
RUN bootc container lint
```

```bash
podman build -t sp-plus-kde:spike -f images/kde/Containerfile .
sudo podman run --rm -it --privileged --pull=newer \
  --security-opt label=type:unconfined_t \
  -v /var/lib/containers/storage:/var/lib/containers/storage \
  -v "$PWD/out":/output \
  <image-builder container, pinned by digest> \
  --type qcow2 --local sp-plus-kde:spike
```

Boot the qcow2 in QEMU with UEFI + OVMF + swtpm.

**Gate 0.A:** the image builds, and boots to an SDDM login on a KDE Plasma session,
with no manual intervention.

### 0.3 Spike B — Secure Boot on real hardware

Build a Track 1 `anaconda-iso` from the spike image, write it to a USB stick, and
install it on one physical laptop from the hardware matrix with **Secure Boot enabled in
firmware**.

**Gate 0.B:** the machine installs and boots with Secure Boot on, `mokutil --sb-state`
reports `SecureBoot enabled`, and no MOK enrollment screen appeared at any point.

This gate is the single most important one in the plan. If it fails, the architecture in
document 2 is wrong and the fallback in document 2 §2 must be considered before
proceeding. QEMU with OVMF is a useful pre-check but **does not satisfy this gate** —
it must be real firmware on real hardware.

### 0.4 Spike C — encryption and TPM2 on that same machine

During the Anaconda install, tick "Encrypt my data" and set a passphrase. After first
boot, manually run:

```bash
sudo systemd-cryptenroll --recovery-key /dev/<luks-device>
sudo systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=7 /dev/<luks-device>
```

Reboot. Confirm the machine unlocks without a typed passphrase. Then change a BIOS
setting that alters PCR 7, reboot, and confirm the passphrase fallback works and the
recovery key works.

**Gate 0.C:** LUKS2 install succeeds; TPM2 auto-unlock works; passphrase and recovery
key both still unlock after PCR invalidation.

### 0.5 Spike D — hardware reality check

On the same machine, without installing anything further, verify: Wi-Fi connects to a
WPA2/WPA3 network; suspend and resume work on a lid close; an external monitor works
over HDMI and over USB-C; audio plays and the microphone records; the webcam works; a
driverless IPP network printer prints a test page.

**Gate 0.D:** all of the above, or a written record of exactly which failed and why.

**Phase 0 exit:** a written spike report answering "is this architecture viable?" with
evidence. If any gate fails, stop and revise document 2 before continuing.

---

## 3. Phase 1 — The SP+ delta layer

**Entry:** Phase 0 gates passed.
**Deliverable:** `sp-plus-kde:44` and `sp-plus-gnome:44` images containing everything an
advisor needs, built reproducibly from git.

### 3.1 What goes into the image

**System packages (dnf, in the Containerfile):**
- Brave (from Brave's repository — see the open question in document 6)
- `cups`, `cups-filters`, `nss-mdns`, `ipp-usb` — driverless printing plus USB fallback
- `firewalld`, `NetworkManager` (present in base), `bluez`
- `fwupd` for firmware updates
- `tpm2-tools`, `cryptsetup` (present in base) for the enrollment flow
- `python3` and whatever the SP+ runtime needs
- Optionally `tailscale`, **installed but not enrolled and not enabled**
- Fonts, `hunspell` dictionaries, `libreoffice` if it is not going the Flatpak route

**Flatpaks (preinstalled via `flatpak preinstall` + a first-boot unit):**
- Bitwarden desktop
- Zoom, if the web client is judged insufficient
- A PDF viewer, an image viewer, whatever the advisor-facing app list settles on

Flatpak is preferred for user-facing applications because they update independently of
the OS image and do not force an image rebuild for an application security fix.

**Configuration shipped in the image:**
- `/etc/brave/policies/managed/sp-plus.json` — Rewards off, Wallet off, VPN off, Leo
  off, extension allowlist including Bitwarden, managed bookmarks, the SP+ PWA set,
  privacy defaults with a documented site-exception list
- firewalld default zone and rules
- `/usr` vendor defaults for the desktop: scaling, font sizes appropriate for older
  eyes, screen lock timeout, power management, panel layout per edition
- SP+ branding: wallpaper, logo, `/etc/os-release` `PRETTY_NAME`, plymouth theme,
  and the trademark-required package swap (document 5)
- The SP+ runtime systemd unit (`sp-plus.service`), bound to loopback
- The knowledge base under `/usr/share/sp-plus/knowledge/`
- The PWA under `/usr/share/sp-plus/pwa/`
- Signed remediation playbooks under `/usr/share/sp-plus/playbooks/`

**Explicitly not in the image:** any credential, any out-of-tree kernel module, any
custom kernel, any user account, any `/home` content, any machine-identifying state.

### 3.2 The first-boot wizard

This is the component that most determines whether SP+ feels plug and play, and it does
not exist yet. It runs once, on first login, before the desktop is usable, and it:

1. Welcomes the advisor by name and explains, in three sentences, what SP+ is.
2. Creates or confirms the user account (if the installer deferred it).
3. Connects to Wi-Fi if not already connected.
4. **Generates the LUKS recovery key, displays it in large type, and refuses to continue
   until the advisor confirms they have written it down or printed it.** Offers to print
   it directly.
5. Enrolls TPM2 against PCR 7 so future boots do not require the passphrase.
6. Offers to sign in to Bitwarden and to the advisor's email provider.
7. Adds their business apps as browser PWAs.
8. Runs the printer setup path.
9. Shows the SP+ help PWA once, so they know where it is.

Implement it as a normal desktop application launched by a first-boot unit, not as an
Anaconda addon. Steps 4 and 5 are the security-critical ones and must be idempotent and
resumable — an advisor who closes the laptop halfway through must not end up with an
un-enrolled recovery key and no prompt to fix it.

**Gate 1.A:** a clean install reaches a usable desktop through the wizard, with a
recorded recovery key and a TPM-enrolled disk, on real hardware.
**Gate 1.B:** `brave://policy` on the installed machine shows every SP+ policy applied.
**Gate 1.C:** both editions build from the same common layer and pass 1.A and 1.B.

---

## 4. Phase 2 — The assistant, the knowledge base, and evidence

**Entry:** Phase 1 gates passed.

This is the work the 2026-08-25 session actually did well, and most of it survives the
rename. It needs to be re-validated on the new base rather than rebuilt.

- SP+ RPC service with an allowlisted method set, bound to loopback, with no shell or
  file-edit capability exposed.
- Sanitized snapshot collection and the redaction gateway. **Enforcement is in code.**
  The Markdown policy documents are readable policy, not the boundary.
- The PWA: plain-English help, device health, detected problems, guided remediation,
  history, evidence export.
- The printer diagnose → explain → approve → remediate → verify → record workflow.
- The Security Evidence Report: human-readable PDF plus machine-readable export,
  covering encryption status, Secure Boot status, firewall status, update and rollback
  history, device health, security events, assistant requests and approvals, remediation
  actions and results, support sessions, timestamp, and integrity hashes.
- Playbook signing. The checked-in SHA-256 manifest is a development stand-in and must
  not be confused with production signing.

**Gate 2.A:** the printer acceptance sequence in `docs/ACCEPTANCE.md` completes on
installed hardware, with a real printer, without a terminal.
**Gate 2.B:** the evidence export contains no credentials, no raw paths, no client data,
and its assertions match reality on the machine.
**Gate 2.C:** an attempt to exfiltrate a blocked data class through the assistant is
demonstrably refused by code, not by prompt.

---

## 5. Phase 3 — Update channel and rollback

**Entry:** Phase 2 gates passed.

- Publish `sp-plus-kde` and `sp-plus-gnome` to a registry (`ghcr.io/secureprospective/…`
  or Quay), signed with cosign.
- Ship a container signature policy in the image so `bootc` verifies the signature before
  applying an update. An unsigned or wrongly signed image must be refused.
- `bootc-fetch-apply-updates.timer` enabled, with the cadence tuned for advisors — an
  unattended reboot in the middle of a client appointment is unacceptable. Consider
  download-only staging plus an "install on next shutdown" prompt.
- Test rollback: publish a deliberately broken image, let a test machine take it, roll
  back, and confirm the machine returns to service. **Note the documented trap:** after
  a rollback, the auto-update timer will pull the bad image again within 1–3 hours
  unless it is masked. SP+ needs an explicit rollback-pin mechanism, not just
  `bootc rollback`.

**Gate 3.A:** a machine updates unattended from release N to N+1 and the user notices
nothing but a reboot prompt.
**Gate 3.B:** a machine given a broken release recovers, and stays recovered.
**Gate 3.C:** a machine offered an unsigned image refuses it.

---

## 6. Phase 4 — Plug-and-play install media (Track 2)

**Entry:** Phase 3 gates passed. **This is where the public ISO is actually built.**

- Add the `titanoboa` live-ISO build to CI, producing a live SP+ desktop with the
  container image embedded for offline install.
- Integrate a graphical installer (`projectbluefin/bootc-installer` or Readymade),
  branded as SP+, with disk selection, LUKS2 passphrase, and TPM2 enrollment in the GUI.
- Vendor and pin both by digest. Budget for maintaining a fork.
- Preinstall Flatpaks into the live environment so the install works with no network.
- Produce a signed ISO plus a published SHA-256 checksum and a detached signature, with
  verification instructions written for a non-technical reader.
- Write the USB-writing guide for Windows and macOS users, naming specific tools.

**Gate 4.A:** an advisor-representative tester, given only the download page and a USB
stick, installs SP+ unassisted on their own laptop in under 45 minutes.
**Gate 4.B:** they can boot the live environment and try SP+ without touching their disk.
**Gate 4.C:** the ISO installs with no network available.

---

## 7. Phase 5 — Hardware matrix and pilot

**Entry:** Phase 4 gates passed.

Define the supported hardware matrix explicitly, test it, and publish it. Candidate
first tier, chosen because it is what advisors actually buy: Dell Latitude 5000/7000,
HP EliteBook 800 / ProBook 400, Lenovo ThinkPad T/L/X, and two or three current consumer
models from Dell, HP, and Lenovo. For each model record: Wi-Fi, Bluetooth, suspend and
resume, external display over HDMI and USB-C, docking station, audio, microphone,
webcam, fingerprint reader, TPM2 presence and version, Secure Boot behavior, and
firmware update support via `fwupd`.

Anything not tested is not supported, and the download page says so.

Then run a pilot: five to ten advisors, thirty days, instrumented support contact.
Success criteria are in document 1 §7.

---

## 8. CI and reproducibility

- Builds run in GitHub Actions on every commit to the image directories, and nightly to
  pick up Fedora updates.
- Image builds need no special privileges. **ISO and disk-image builds need a privileged
  container with `/var/lib/containers/storage` mounted**, and `--security-opt
  label=type:unconfined_t` on SELinux hosts, which typically means a self-hosted runner
  or a VM-based runner. Plan for this; it is a common blocker.
- Every build emits: the image digest, a full package manifest (`rpm -qa` inside the
  image), the Containerfile at that commit, and an SBOM. These are the answer to "what
  did we ship in 1.4?".
- The Beelink host is a development machine, not the release builder. Release artifacts
  come from CI or they do not ship.

---

## 9. What to do with the 2026-08-25 output

Not a total loss. Triage as follows:

| Artifact | Disposition |
|---|---|
| The build brief | Kept, renamed to SP+, still the product baseline |
| Knowledge base (17 files) | **Keep.** Genuinely good work; the voice is right |
| Landing content and disclaimers | **Keep**, renamed to SP+ |
| SP+ RPC runtime and PWA | **Keep**, re-validate on the new base |
| Printer playbook and workflow | **Keep** |
| `Containerfile` FROM `fedora-bootc:43` | **Discard.** Wrong base, wrong version. Rewrite FROM `fedora-kinoite:44` |
| Docker + image-builder workaround scripts | **Discard.** Install Podman instead |
| `bootc install to-disk --via-loopback` attempts | **Discard** as a build path; keep the log as a recorded negative result |
| Generic bootc installer ISO | **Discard.** Rebuild as Track 1, then Track 2 |
| 4.5 GB of qcow2 / ISO / QEMU state | **Delete.** Keep the text logs only |
| Session and live-test logs | **Keep** under `docs/`, as the record of what was tried |

---

## 10. Sequencing summary

| Phase | Deliverable | Blocking gate |
|---|---|---|
| 0 | Feasibility spike report | Secure Boot on real hardware, unmodified |
| 1 | SP+ image, both editions, first-boot wizard | Clean install to usable desktop, encrypted, TPM-enrolled |
| 2 | Assistant, KB, evidence report | Printer workflow end to end, no terminal |
| 3 | Signed update channel and rollback | Unattended update; recovery from a bad release |
| 4 | Live ISO + graphical installer | Unassisted install by a representative advisor |
| 5 | Hardware matrix and pilot | 30 days, under one hour of support |

Phases do not overlap. The temptation to start Phase 2 during Phase 0 is exactly what
produced an unusable ISO with a well-built PWA inside it.
