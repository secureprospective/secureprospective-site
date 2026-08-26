# SP+ — Product Definition

**Document 1 of 6 in the SP+ planning set.**
Status: research baseline, 2026-08-25. No code is authorized by this document.

---

## 0. What SP+ is, in one sentence

SP+ is a free, immutable, preconfigured Linux workstation operating system that Secure
Prospective gives to eligible independent insurance and financial advisors so that the
computer their client data lives on is hard to compromise, hard to break, and easy to
account for — without the advisor ever needing to learn Linux.

"SP+" is the product name. "Secure Prospective Advisor OS" was the working title and is
retired. Internal identifiers use `sp-plus` (paths, services, repos) and `SPPLUS_`
(environment variables).

---

## 1. Who the user actually is

This matters more than any technical decision in this planning set, because every
architectural choice downstream is justified or invalidated by it.

### The primary user

An independent insurance or financial advisor operating as a one-person business or a
principal with one or two staff. Concretely:

- **Age and background.** Frequently 45–70. Career built on relationships, not
  technology. Competent and intelligent, but has never had a reason to learn what a
  filesystem is.
- **Origin platform.** Overwhelmingly Windows. A minority are Mac. Essentially none have
  used Linux. Many have never intentionally installed an operating system.
- **Where the work happens.** Inside a browser. Carrier portals, agent back-offices,
  quoting engines, e-application systems, e-signature (DocuSign, Adobe Sign), CRM
  (AgencyBloc, Redtail, Wealthbox, HubSpot), Google Workspace or Microsoft 365, Zoom or
  Teams. Very little happens in a locally installed application beyond a PDF reader and
  occasionally Excel.
- **What is on the disk.** Client PII of the most sensitive kind available in civilian
  commerce: full names, dates of birth, Social Security numbers, health disclosures on
  life and LTC applications, bank account and routing numbers for premium drafts,
  beneficiary designations, income and asset statements. Usually in a downloads folder,
  a desktop folder, and an email client, in plaintext, on an unencrypted laptop.
- **Risk posture.** Carries genuine regulatory exposure (state insurance data security
  laws modeled on the NAIC model law, the FTC Safeguards Rule where applicable, SEC
  Regulation S-P for the dually registered, state breach notification statutes in all
  50 states) and typically has no IT function, no MSP, no MDM, and no written
  information security program.
- **Tolerance for disruption.** Near zero. A workday interrupted by a computer problem
  is a workday of lost commission. Any change that makes them slower gets abandoned,
  regardless of how much safer it is.
- **Support channel today.** A relative, a local computer shop, or nobody.

### The secondary users

- **Small advisory firms** (3–15 seats) after individual-seat proof. They need
  consistent images across staff, not per-machine artistry.
- **MSPs**, as an eventual deployment and support channel. Their requirement is fleet
  legibility: identical images, remote support, evidence export, and no snowflakes.
- **Secure Prospective itself**, which needs SP+ to function as a recruiting and
  retention differentiator that costs a bounded, predictable amount to operate.

### Who SP+ is explicitly not for

- Linux enthusiasts. There is no audience-building goal here. If a technical user is
  delighted, that is incidental.
- Advisors with a hard dependency on a Windows-only desktop application that has no web
  equivalent and no acceptable virtualization path. SP+ must tell these people, before
  download, that it is not for them.
- Enterprises with an existing managed Windows fleet and a security team.

---

## 2. Why they would use it

An advisor does not want an operating system. They want four outcomes, and SP+ is only
worth building if it delivers all four.

### 2.1 "If this laptop is stolen, I am not the subject of a breach notification."

This is the single strongest motivator and the one that pays for everything else.
Full-disk encryption with a properly handled recovery key converts a stolen laptop from
a reportable incident with legal costs, notification costs, credit monitoring, and
reputational damage, into an insurance claim for a laptop. Most state breach
notification statutes contain an encryption safe harbor. This is not a compliance claim
— it is the reason the feature exists, and the reason it must be non-optional.

### 2.2 "I can answer the security questionnaire."

Advisors are increasingly asked to attest to their security posture: cyber insurance
applications, IMO and carrier onboarding, broker-dealer supervision, and RIA due
diligence. They currently answer these from memory and hope. SP+ generates a **Security
Evidence Report** describing the actual state of the actual machine — encryption on,
Secure Boot on, firewall on, updates current, last rollback, event history — as a
readable PDF and a machine-readable export. Evidence, never a compliance certificate.

### 2.3 "It does not break, and when it does, something explains it to me."

Immutability is not a philosophical preference here; it is the support-cost strategy.
A read-only system image with transactional updates and automatic rollback means the
machine cannot be degraded by accumulated user error, half-finished installers, or a bad
update. Combined with a plain-English assistant that can diagnose and offer a reversible
fix, this removes the "call my nephew" failure mode. If SP+ generates a support call
volume comparable to Windows, the program fails economically regardless of its security.

### 2.4 "It costs nothing and my life did not change."

SP+ is free to eligible members. The first day must feel like the last day on Windows:
the same browser tabs, the same passwords, the same printer, the same files. The value
is invisible; that is the design goal, not a shortcoming.

---

## 3. The jobs SP+ must do on day one

In priority order. Anything below the line is deferred.

| # | Job | Why it is above the line |
|---|-----|--------------------------|
| 1 | Install onto a laptop the advisor already owns, from a USB stick, without help | If this needs a technician the program does not scale |
| 2 | Encrypt the disk with LUKS2, with a recovery key the user is forced to record | The core value proposition |
| 3 | Boot with Secure Boot enabled and unmodified | Removes an entire class of support failure and firmware-menu spelunking |
| 4 | Connect to Wi-Fi, print, drive a second monitor, play audio, use a webcam | Failure here ends the trial in ten minutes |
| 5 | Open a hardened, preconfigured Brave with the advisor's business apps as installed PWAs | This is where the work is |
| 6 | Provide Bitwarden as the password manager, working, on day one | The single highest-leverage security control for this user |
| 7 | Update itself and roll back a bad update without being asked | Support cost |
| 8 | Provide plain-English help and one guided, approval-gated repair workflow | Proves the assistant model |
| 9 | Generate a Security Evidence Report | The second value proposition |
| 10 | Look and feel like the OS the advisor came from | KDE for Windows-origin, GNOME for Mac-origin |

**Below the line for v1:** local AI inference, MSP multi-tenant administration, remote
wipe, DLP, contact synchronization, mobile companion, full hardware certification
matrix, Windows application compatibility layers.

---

## 4. Product principles (unchanged from the build brief, restated as constraints)

1. **Just works first.** A security control that breaks printing will be uninstalled by
   the user, at which point it protects nothing.
2. **Security is reassuring, not obstructive.** Status, not jargon. No dialog the user
   cannot act on.
3. **Minimize friction.** Familiar workflow beats theoretical maximum restriction.
4. **Cloud AI first.** Local inference is deferred until commodity advisor hardware can
   run it well.
5. **Data boundaries are enforced in code, not in prose.** Markdown policy is
   documentation; the redaction gateway is the boundary.
6. **No bespoke desktop application.** The advisor-facing surface is a browser-installed
   PWA.
7. **Open-source foundation.** SP+ must never become an onramp to paid proprietary
   software.
8. **MSP-ready, individual-first.** Fleet capability is architectural, not a v1 UI.
9. **Evidence is a feature.**
10. **No unsupported compliance claims.** Ever, anywhere, including in marketing.

---

## 5. Distribution and eligibility

- The Secure Prospective member portal asks one question: *"Which computer are you most
  comfortable with today — Windows or Mac?"* Windows-familiar receives the KDE edition;
  Mac-familiar receives the GNOME edition.
- Eligibility is five active insurance contracts under the IMO hierarchy, verified at
  download.
- **Eligibility is never enforced inside the installed operating system.** If a member's
  status changes, their computer keeps working and keeps receiving updates. Building a
  license check into the OS would be both hostile and an operational liability.
- Never attempt to detect the user's previous OS from hardware. Ask.

---

## 6. What SP+ is not, stated plainly for internal discipline

- Not a compliance product. It produces evidence; the customer owns their program.
- Not a Fedora spin or an official Fedora product. See document 5 on trademark handling.
- Not a general-purpose Linux distribution. Breadth of use case is a cost, not a
  feature.
- Not a paid product, a freemium tier, or a lead magnet with an upsell.
- Not a research vehicle for interesting technology. Every component must be justified
  by one of the four outcomes in section 2.

---

## 7. Success criteria for the program

SP+ is successful when all of the following are true, and not before:

1. A named advisor, unassisted, has installed SP+ on their own laptop from a USB stick,
   encrypted, with Secure Boot on, and used it for thirty consecutive business days as
   their only computer.
2. Their printer, Wi-Fi, monitor, camera, and microphone worked without a terminal.
3. They received at least one automatic OS update without noticing it.
4. They generated a Security Evidence Report and sent it to a third party.
5. Total support contact over those thirty days was under one hour.

Everything in documents 2 through 6 exists to make that list achievable and repeatable.
