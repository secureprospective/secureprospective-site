# SP+ — Threat Model

**Document 14 of the SP+ planning set.**
Status: first version, 2026-09-10. Decision owner: Christopher.
Scope: the Fedora/KDE bootc lane, which is the active product. Debian is parked.

---

## 0. Why this document exists

SP+ has always been able to say what it *has*: encryption, immutability, a firewall, signed
images, rollback. It has never been able to say what it **protects, from whom, and where it
stops**. Doc 01 §2 names four outcomes an advisor wants. That is a value proposition, not a
threat model.

The difference is not academic. D15 forbids compliance claims on any surface, and the Security
Evidence Report exists to state facts about a machine rather than to certify anything. Neither
of those can be done well without a written statement of what SP+ is defending. A threat model
is how SP+ says what it does protect **without** claiming what it does not.

This document also sets the bar for every future control: a proposed control that does not
reduce a risk named here does not belong in the product.

## 1. Assets, in the order an advisor would lose sleep over them

| # | Asset | Where it lives on an SP+ machine |
|---|---|---|
| A1 | **Client PII** — names, dates of birth, Social Security numbers, health disclosures from life and LTC applications, bank account and routing numbers, beneficiary designations, income and asset statements | Downloads folder, desktop, browser cache, email attachments, LibreOffice documents |
| A2 | **Credentials** to carrier portals, agent back-offices, quoting engines, e-signature, CRM, and email | Browser password store, kwallet, active browser sessions |
| A3 | **The LUKS passphrase and recovery key** | The advisor's memory, and whatever they wrote the recovery key on |
| A4 | **System integrity** — that the machine is running the SP+ Secure Prospective built and not something else | The bootc deployment and its update path |
| A5 | **The advisor's identity and reputation** — their ability to say truthfully that they had no breach | Downstream of A1 through A4 |
| A6 | **Availability of the machine** | A workday lost to a broken computer is lost commission |

A1 is the reason the product exists. A4 is the asset most people forget, and it is the one the
2026-09-01 BlueBuild incident put at risk across the whole fleet at once.

## 2. Adversaries, ranked by likelihood for THIS user

Ranking matters more than completeness. An advisor is not a defence contractor, and a control
sized for the wrong adversary costs usability for nothing.

| # | Adversary | Likelihood | What SP+ does about it today |
|---|---|---|---|
| T1 | **Laptop lost or stolen, powered off** | Highest | LUKS2 with argon2id. This is the core control and it works. Verified on alpha4 |
| T2 | **Phishing and credential theft through the browser** | Very high | Brave managed policy, Shields, Safe Browsing, leak detection, a password manager. The advisor is still the last check |
| T3 | **Hostile web content compromising the browser** | High | Brave's own sandbox. Nothing outside it. SELinux does not confine Brave |
| T4 | **A hostile or malicious document** | High | LibreOffice defaults. Not specifically addressed |
| T5 | **A bad SP+ update reaching the fleet** | Moderate likelihood, catastrophic reach | **Currently unmitigated on the machine.** See §4 and `ledger/POSTURE-2026-09-10-alpha4.md` §2 |
| T6 | **Hostile network** — hotel, airport, coffee shop Wi-Fi | High exposure, low per-event severity | firewalld public zone. But sshd listens on all interfaces, and system DNS is plaintext |
| T7 | **Malicious USB device** | Low for this user | Nothing. USBGuard is rejected under the day-one rule |
| T8 | **A compromised process attacking another process at the same UID** | Low, and only after T3 or T4 | Nothing. `ptrace_scope` is 0 and SP+'s own services run unconfined |
| T9 | **Laptop stolen while powered on and unlocked** | Low | **Nothing, by design.** See §5 |
| T10 | **A targeted attacker who specifically wants this advisor's clients** | Very low | Out of scope. Stated plainly in §6 |

## 3. Trust anchors

Everything below is something SP+ cannot verify its way out of trusting. If one of these is
dishonest or compromised, controls downstream of it do not save the machine.

| Anchor | Who holds it | Notes |
|---|---|---|
| Platform firmware and the Microsoft/Fedora Secure Boot keys | The laptop vendor and Microsoft | SP+ ships no custom keys and requires no MOK enrolment, deliberately |
| Fedora's package signing and the `fedora-kinoite` base | Fedora | SP+ pins the base by digest and does not rebuild packages |
| **Brave's RPM signing key** | Brave Software | A second trust root, accepted deliberately for the browser |
| **The `ghcr.io/secureprospective/sp-plus-kde:latest` tag** | Whoever can write to it | Every installed machine pulls from it. See §4 |
| The SP+ cosign private key | Secure Prospective, in `~/.config/sp-plus-signing` on the Beelink | Signing works. Verification on the machine does not exist yet |
| **The Beelink** as build host | Secure Prospective | Single machine, no CI. D20 and D35 are in acknowledged tension |
| The advisor's LUKS passphrase and lock screen | The advisor | See §5 |

## 4. The boundary that is currently open

**SP+ signs every image it publishes and no installed machine checks the signature.**

Measured on alpha4: `/etc/containers/policy.json` is stock `insecureAcceptAnything`, there is no
key in `/etc/pki/containers`, no ghcr.io entry in `registries.d`, and the Containerfile has no
signature policy in 2,921 lines.

The consequence, stated plainly: an attacker who obtains write access to the SP+ package on ghcr
— a stolen GitHub credential, a compromised account — can publish an image, and every installed
SP+ machine will download it and apply it at the next shutdown. The advisor sees a normal
update. Nothing about it looks wrong.

`publish-image.sh` does not close this. It is a control on Secure Prospective's own publishing
hygiene, and it was built after the 2026-09-01 incident in which an unrelated workflow pushed a
stock `fedora-kinoite` to that exact tag and the update timer staged it. That incident was an
accident from inside. The same path is open to anyone from outside.

This is the largest single gap in the product and it is invisible to the advisor to fix.

## 5. The boundaries SP+ deliberately does not defend

These are decisions, not oversights. Each is recorded so that nobody "fixes" one without
understanding what it buys.

**The lock screen is the boundary, not the password prompt.** SP+ ships
`%wheel ALL=(ALL) NOPASSWD: ALL`. Anyone at an unlocked session is effectively root. The
reasoning is in `/etc/sudoers.d/sp-plus` and it is sound: Fin runs as the advisor and cannot
answer a password prompt, and a non-technical advisor frequently cannot either, since the
account is created by the first-boot wizard and the password is chosen once. A prompt the user
cannot answer stops the assistant from helping and stops no attacker who is already at the
keyboard. The containment is architectural instead: `/usr` is read-only, every change lands in a
new deployment, a bad state is one rollback away, and the disk is encrypted.

**What this means for the threat model:** T9 is unmitigated by design. An SP+ machine that is
stolen while powered on and unlocked is fully compromised. The controls that matter for that
case are the screen lock timeout and the advisor's habits, not the operating system.

**Printer discovery is an accepted exposure.** avahi-daemon listens on `0.0.0.0:5353` and
firewalld permits `mdns`. Secureblue disables both by default and documents that printing then
requires manual enablement. SP+ will not do that: printing is day-one job #4, and a security
control that breaks printing gets uninstalled by the user, at which point it protects nothing.

**No compartmentalization.** One machine, one user, one session. A Qubes-shaped VM boundary is
the strongest available answer to T3, and it is incompatible with a non-technical advisor on a
single laptop.

**No defence against a targeted attacker.** SP+ raises the cost of opportunistic compromise. It
does not claim to stop someone who has chosen this advisor specifically and has time and budget.

## 6. Residual risk, stated for the record

After every control currently shipping, these remain true:

1. A stolen unlocked machine is fully compromised.
2. A browser compromise reaches everything the advisor's user account can reach, which is
   everything in A1 and A2, and via NOPASSWD sudo, the whole machine.
3. An attacker who can write the ghcr tag owns the fleet.
4. System DNS is plaintext and observable on any network the advisor joins.
5. Any process running as the advisor can inspect any other, including the browser and any
   credential agent.
6. Firmware, Secure Boot keys, and hardware are trusted and unverified by SP+.
7. Snapshots and rollback are not backups. There is no external backup story in v1, so
   ransomware or a disk failure means data loss.
8. Secure Boot, kernel lockdown, module signing and TPM have **never been tested by the SP+ test
   lane**, because `spplus-testvm.sh` builds a VM without Secure Boot firmware.

Item 8 is a testing gap rather than a product defect. It is listed here because an untested
control must never be reported as a working one.

## 7. How this document is used

- A proposed control must name the threat it reduces. No row in §2, no place in the product.
- The Security Evidence Report states measured facts about a machine. This document is what
  makes those facts mean something, and it is also the reason the report must never imply
  coverage of §5 or §6.
- Every entry in §6 is a candidate for the roadmap or a candidate for a sentence in the advisor
  documentation. Silence is not an option for either.

Evidence: `ledger/POSTURE-2026-09-10-alpha4.md`, `ledger/SECUREBLUE-INVENTORY-2026-09-10.md`.
Roadmap: `15-DEFENSE-IN-DEPTH-ROADMAP.md`.
