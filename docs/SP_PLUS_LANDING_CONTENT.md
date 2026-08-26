# SP+: Landing Page Disclaimer and Step-by-Step Guide

**Status:** Reference draft for the Secureprospective landing page build.
**Owner:** Bee, 2026-08-25. Written against the build brief (`briefs/sp-plus-build-brief.md`) and the first-pass POC in `projects/sp-plus/`.
**Use:** Every claim, step, and disclaimer below is written to be lifted onto the landing page with light editing. Do not invent stronger claims than appear here. Where counsel review is required, it says so.

---

## 1. How To Use This Document

1. Section 3 gives you the positioning copy blocks: what SP+ is, who it is for, and what it costs.
2. Section 4 is the informational step-by-step guide. It walks a prospective user from the member portal to daily use, in plain English. Publish it as a walkthrough page, an accordion, or a downloadable guide.
3. Section 5 contains the master disclaimers. Publish them on the landing page (short forms) and link to a full legal page (long forms). Nothing in Section 5 may be trimmed to the point of changing meaning.
4. Section 7 lists approved language versus banned language. This table is the enforcement mechanism for our "no unsupported compliance claims" principle (build brief, Principle 10).
5. Section 8 provides FAQ blocks written from real questions a non-technical advisor will ask.

Content rules inherited from the site: zero em dashes anywhere. Plain English for the masses. If a sentence needs jargon, rewrite the sentence.

---

## 2. The One-Paragraph Truth Test

Before anything goes on the page, it must survive this paragraph:

> SP+ is a free, secure workstation computer system provided as a benefit to eligible Secureprospective members. It protects client information using strong encryption and careful defaults, and it produces reports you can show to anyone who asks about your security practices. It does not make you compliant with any law or regulation, it does not replace your own responsibility for protecting client data, and it does not promise that every printer, camera, or gadget will work. It helps you do the right things and prove you did them. The rest is up to you, as it always has been.

If a proposed landing page line contradicts any clause above, cut the line.

---

## 3. Positioning Copy Blocks

### 3.1 What It Is

> **Your practice computer, rebuilt around client trust.**
>
> SP+ is a complete computer operating system built for independent insurance and financial advisors. It arrives on your machine already set up: strong encryption turned on, a hardened web browser configured, automatic updates running quietly in the background, and a plain-English assistant ready to help when something goes wrong.
>
> There is nothing to configure, nothing to memorize, and no command line. If you can use a web browser, you can use SP+.

### 3.2 What It Is Not

Honesty is the differentiator. This block builds trust by saying plainly what we refuse to claim.

> **What SP+ is not:**
>
> - **It is not a compliance program.** It gives you security controls and evidence reports. Your compliance obligations remain yours, and every advisor's situation is different.
> - **It is not antivirus software.** It is an entire operating system designed from the ground up to be hard to break and easy to recover.
> - **It is not paid software waiting to upsell you.** It is free for eligible members. There is no license fee, no seat count, and no premium tier.
> - **It is not Linux, as far as you are concerned.** You will see a familiar desktop, a familiar browser, and your usual web apps: Google Workspace, Microsoft 365, your CRM, your e-signature tools, your carrier portals.

### 3.3 Who It Is For

> Built for working advisors: agents and financial professionals who live in browser-based tools, who handle client Social Security numbers and account details every day, and who have neither the time nor the desire to become computer experts. Choose the desktop that feels like home: one edition looks and works like Windows, another looks and works like a Mac.

### 3.4 Cost Framing

> Free for eligible members. SP+ is distributed as a Secureprospective member benefit, verified through the member portal under the IMO hierarchy. Eligibility is checked when you download. It is never enforced inside the computer itself: if your membership status ever changes, your computer keeps working.

### 3.5 Security Posture Summary (Landing Page Short Form)

> - Full-disk encryption, unlocked with a PIN only you know
> - Automatic updates that cannot corrupt your system, with a built-in way back if anything ever misbehaves
> - A locked-down browser where only vetted extensions run, with Bitwarden password management built in
> - A built-in assistant that fixes problems only after you approve, and never reads your documents, email, or client records
> - One-click Security Evidence Report: proof of encryption, updates, firewall status, and system history, ready for cyber insurance applications, carrier inquiries, or your own records

---

## 4. Informational Step-by-Step Guide

Publish this as the "How It Works" or "Getting Started" walkthrough. Each step states what happens and what the user experiences. Wording assumes the product as specified in the build brief; verify each step against the shipped installer before launch, and adjust numbers (PIN length, timing) to match reality.

### Step 1: Answer one question in the portal

> Which desktop feels most familiar: Windows or Mac? That single question decides which edition you receive. We do not guess from your hardware. You tell us, and you get the experience that feels like home.

### Step 2: Download and verify

> Download your edition from the member portal. Every download is cryptographically signed: your computer checks the signature before installing, so you can be confident you received the genuine article and not something tampered with along the way.

### Step 3: Create the installation USB

> Put the download on any USB memory stick (8 GB or larger) with our guided instructions. If you would rather not do it yourself, this is a five-minute task for any family tech helper, and MSP partners can handle the entire process for firms.

### Step 4: Install (about 20 minutes, mostly unattended)

> Boot your computer from the USB stick and follow the prompts. During installation you will choose your disk-unlock PIN and your login password. Write down the recovery key when it is shown: store it somewhere safe away from the computer, such as a home safe or a lockbox. That key is your master backup, and it exists for one rare situation explained in the guide.
>
> When installation finishes, remove the USB stick and restart. You land on a clean, familiar desktop with everything already set up.

### Step 5: First boot tour

> The built-in Assistant opens automatically on first login and walks you through the basics in plain English: where your files go, how the browser is arranged, how to connect a printer, and what the screen lock does. Nothing is changed on your computer without your approval, including during this tour.

### Step 6: Sign in to your work

> Open the browser. Your bookmarks are already organized: Google Workspace or Microsoft 365, your CRM, e-signature, carrier portals. Sign in to your accounts, then sign in to Bitwarden, your password manager. From now on, passwords fill themselves, and this computer's own password saver stays off on purpose: one vault, encrypted, under your control.

### Step 7: Daily driving

> Work the way you always have. Everything runs in the browser: email, calendar, proposals, illustrations, e-applications, video calls with clients. Files save to your home folder, your cloud drives, or a USB drive. At the end of the day, close the lid or walk away: the screen locks itself and requires your password to return.

### Step 8: When something breaks, ask the Assistant

> Printer stopped? Wi-Fi acting strange? Click the Assistant and describe the problem in your own words. It checks the relevant parts of the system, explains what it found in plain English, and proposes a fix. You approve before anything changes, and it verifies the fix worked afterward. Every step is recorded in the device history.
>
> When the Assistant needs to consult advanced diagnostics online, it sends only technical facts: device model, software versions, sanitized error codes. It never sends your documents, email, browsing history, passwords, client information, or screenshots unless you separately approve a screenshot.

### Step 9: Updates happen while you sleep

> Updates download and prepare themselves in the background. A small notice tells you when a restart will finish the job. Restart whenever convenient: coffee, lunch, end of day. If an update were ever to misbehave, the previous version remains on the disk and the computer can return to it. Your files are untouched by either direction.

### Step 10: Prove it when asked

> Need documentation of your security posture for a cyber insurance application, a carrier, a broker-dealer, or your own peace of mind? Generate the Security Evidence Report: a readable summary of your encryption status, firewall status, update history, and significant device events, with a timestamp. Save it as a PDF or export the data form. It documents what the computer observed; it is evidence, not a compliance certification.

---

## 5. Master Disclaimers

Two depths: SHORT for on-page display, FULL for the legal/disclaimers page linked from the landing page footer. All FULL disclaimers require counsel review before publication. Flagged lines are those most likely to need adjustment for entity structure.

### 5.1 Product Nature and No Professional Advice

**SHORT:**

> SP+ is software and documentation, not professional advice. It does not provide legal, regulatory, tax, investment, compliance, audit, or insurance advice. Consult your own qualified professionals for advice about your obligations.

**FULL:**

> SP+ is a computer operating system and accompanying services distributed by Secureprospective as a membership benefit. It is a tool. Secureprospective is not a law firm, compliance consultancy, auditor, accountant, or fiduciary, and SP+ does not constitute legal, regulatory, tax, investment, compliance, audit, or insurance advice. No attorney-client, advisory, or fiduciary relationship is created by downloading, installing, or using SP+. Each user is responsible for obtaining its own professional advice regarding its obligations.

### 5.2 No Compliance Certification

This is the load-bearing disclaimer. Regulatory landscape facts behind it are summarized in Appendix A.

**SHORT:**

> SP+ provides security controls and generates evidence about your own computer. It does not certify compliance with any law, regulation, framework, contract, or standard, and no report it produces constitutes proof of compliance. Applicability of laws such as the FTC Safeguards Rule, state insurance data security laws, SEC Regulation S-P, and state breach notification laws depends on your entity, activities, registrations, and regulators. Compliance remains your responsibility.

**FULL:**

> SP+ includes security features (such as full-disk encryption, managed browser settings, controlled updates, and event logging) and can generate a Security Evidence Report describing the status of those features on your computer. These features and reports are intended to help you operate and document your own information security program. They do not establish, demonstrate, certify, or guarantee compliance with any law, regulation, regulatory framework, contractual requirement, industry standard, insurer requirement, or audit criterion.
>
> Whether you are subject to any particular requirement depends on facts specific to you: your business activities, entity structure, licenses, registrations, locations, and the regulators with authority over you. For example: federal privacy and security enforcement for entities regulated primarily under state insurance law generally rests with state insurance authorities rather than the FTC; many states have enacted data security laws based on the NAIC Insurance Data Security Model Law with varying terms; SEC Regulation S-P imposes requirements on registered broker-dealers and investment advisers; and all states maintain breach notification laws with differing triggers and deadlines. SP+ makes no determination of your regulatory exposure, and nothing in its documentation or output should be read as a statement that any requirement does or does not apply to you.
>
> You remain solely responsible for designing, implementing, maintaining, documenting, and asserting your own compliance program, including policies, risk assessments, training, vendor oversight, incident response, notifications, and filings. [Counsel review flag: confirm this allocation matches the final terms of service and the IMO/member agreement.]

### 5.3 Warranty Disclaimer (AS IS)

Baseline follows the open-source norm (Apache License 2.0, section 7). Because distribution as a free member benefit resembles software distribution rather than a SaaS subscription, warranty language should track the open-source norm plus service expectations.

**SHORT:**

> SP+ is provided "as is" and "as available," without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that it will be uninterrupted, error-free, or secure against all threats. Your remedies are limited as described in the full terms.

**FULL:**

> SP+ is provided on an "as is" and "as available" basis, without warranties or conditions of any kind, express or implied, including without limitation warranties of title, non-infringement, merchantability, or fitness for a particular purpose. You are responsible for determining whether SP+ meets your needs and you assume all risk associated with its use. Secureprospective does not warrant that the software will operate uninterrupted or error-free, that defects will be corrected, that the software is compatible with any particular hardware or peripheral, or that the software will protect against all security threats, data loss, or unauthorized access. Third-party components are provided under their own licenses, and nothing in these materials modifies those licenses. [Counsel review flag: liability limits, damages exclusions, and indemnity provisions must be drafted by counsel; they are deliberately not drafted here.]

### 5.4 Cloud AI Data Handling Disclosure

Say what leaves the machine. Plainness here is a selling point, not a risk.

**SHORT:**

> When the built-in assistant needs online diagnostics, it sends limited technical facts only: device model, software versions, component status, and error codes with personal details removed. It never sends your documents, email, calendar, contacts, CRM records, browsing activity, passwords, clipboard contents, client names, policy information, or file paths. Screenshots are sent only if you approve that specific screenshot. Every request is recorded in your device history.

**FULL:**

> The SP+ assistant may consult online artificial intelligence services to diagnose technical problems. Before any request leaves the computer, it passes through a filtering layer that permits only an allowlisted set of technical information: operating system and kernel version, hardware model and capabilities, driver and service status, sanitized error codes, network state without credentials, printer and peripheral status, update status, approved diagnostic results, and sanitized technical history. Browser contents; email, calendar, contacts, and CRM records; documents and PDFs; passwords, cookies, tokens, and vault data; clipboard contents; client names and policy information; raw file names and paths; and screenshots are blocked from transmission by default. Screenshots require explicit per-item approval.
>
> Requests and responses are logged locally in the device technical history. Online AI providers may retain processed requests under their own policies; provider selection, retention terms, and data jurisdiction are described in the current service documentation and may change as providers change. [Counsel review flag: finalize the provider retention disclosure when the production AI gateway decision lands.]

### 5.5 Hardware Compatibility

**SHORT:**

> SP+ supports common PC hardware, including most computers manufactured in recent years, and works with the vast majority of modern printers, scanners, webcams, headphones, and displays without extra drivers. Compatibility with any specific device is not guaranteed. Review the current hardware guidance before installing on equipment you rely on, and keep your existing system until you have confirmed your devices work.

**FULL:**

> SP+ is engineered for broad compatibility with mainstream x86-64 personal computers and common peripherals, prioritizing driverless standards for printing and standard protocols for audio, storage, networking, and displays. Nevertheless, hardware manufacturers vary, and Secureprospective does not guarantee that any particular computer, printer, scanner, multifunction device, webcam, headset, docking station, or other peripheral will function with SP+. Very old, very unusual, or vendor-locked devices may require additional support or may not function. Users should validate critical peripherals before relying on SP+ in production, and should maintain fallback access to required systems during any transition.

### 5.6 Third-Party Services

**SHORT:**

> SP+ is designed to give you excellent access to third-party services such as Google Workspace, Microsoft 365, CRM platforms, e-signature providers, carrier portals, and Bitwarden. Those services are governed by their own terms, availability, and pricing, and Secureprospective is not responsible for them. Your use of any third-party service remains subject to your agreements with that provider.

### 5.7 Availability and Eligibility

**SHORT:**

> SP+ is available at no charge to members who meet current eligibility requirements, verified through the Secureprospective member portal. Eligibility requirements may change. Verification occurs at download: it is never enforced inside the installed operating system, and installed systems continue to function and receive updates regardless of later membership changes.

### 5.8 Backup and Data Responsibility

**SHORT:**

> SP+ protects your information with encryption and careful engineering, but no computer is a backup plan. You remain responsible for backing up your important files, whether to cloud storage, an external drive, or both. Store your disk recovery key safely away from your computer: if it is lost, data recovery from an encrypted disk may be impossible.

---

## 6. Approved Language Versus Banned Language

| Banned | Why | Use instead |
|---|---|---|
| "Compliant," "compliance-ready," "keeps you compliant" | Direct violation of the no-certification principle | "Gives you controls and evidence for your own compliance program" |
| "Meets GLBA / FTC / NAIC / SEC requirements" | Regulator named in a claim we cannot make; applicability varies by entity | Describe the control: "full-disk encryption," "automatic updates" |
| "Bank-grade," "military-grade," "unhackable," "bulletproof" | Unverifiable marketing superlatives | "Strong encryption," "hardened defaults" |
| "Guaranteed to work with your printer/devices" | No universal hardware guarantee before testing | "Works with the vast majority of modern devices" |
| "Exempt from the FTC Safeguards Rule" | Jurisdictional nuance, not exemption; risky and wrong for dual-registered advisors | Omit entirely; see Section 5.2 |
| "AI-approved fixes," "autonomous repair" | Overstates autonomy; approval is mandatory | "Fixes only after you approve" |
| "We protect your client data" | We protect the computer; the advisor protects the data | "Built to reduce client-data risk" |

Approved anchors (use freely): "free member benefit", "plain English", "your approval before any change", "evidence, not certification", "familiar, whether you came from Windows or Mac".

---

## 7. FAQ Blocks

**Q: Is this really free? What is the catch?**
A: Free for eligible members, verified through the Secureprospective member portal. No license fee, no seat count, no premium tier. It is a member benefit, not a funnel into paid software.

**Q: I have never used anything but Windows. Will I be lost?**
A: No. Choose the Windows-familiar edition and you get a taskbar, a start menu, and familiar click paths. Your work happens in the same websites you use today. The Getting Started guide covers the handful of things that differ, in plain English.

**Q: What happens to my existing files and programs?**
A: SP+ replaces the operating system, so plan the move like any computer change: your web applications carry over by simply signing in, files come across from backups or cloud drives, and anything Windows-only that cannot move should stay on a remaining PC or virtual machine. The guide walks through it. Install on a second machine or keep your old drive until you have confirmed everything you need is available.

**Q: Can it see my client files?**
A: No. The assistant is designed with hard boundaries: it can inspect technical facts about the computer itself, and it cannot read your documents, email, browsing history, passwords, or client records. When it consults online diagnostics it sends sanitized technical facts only. Screenshots require your explicit approval, one screenshot at a time.

**Q: What if an update breaks something?**
A: Updates prepare themselves in the background and finish at a restart. Your previous system version stays on the disk as a built-in way back. Files are unaffected either way.

**Q: Will my printer work?**
A: Almost certainly: modern printers speak a driverless standard that SP+ uses directly, so most printers made in roughly the last decade connect without hunting for drivers. Very old or unusual models are the exception. Check the hardware guidance, and test your printer during setup.

**Q: My compliance obligations. Does this satisfy them?**
A: SP+ gives you strong controls and documentation you can show, such as the Security Evidence Report. It does not certify compliance with anything, because compliance depends on your whole program and your specific regulatory situation. Many advisors use SP+ evidence in cyber insurance applications and regulator conversations; none may treat it as a compliance certification.

**Q: Who repairs it if something goes badly wrong?**
A: Start with the built-in assistant, which explains problems in plain English and fixes approved items safely. If the computer ever asks for your recovery key at startup, the guide explains exactly what happened and what to do. Support sessions, when needed, are time-limited and require your approval.

---

## 8. Open Items Before Launch

1. Counsel review of Sections 5.2, 5.3, and 5.7 against final terms of service and the IMO member agreement.
2. Verify every Step number in Section 4 against the shipped installer (PIN rules, recovery key display moment, first-boot behavior). Adjust wording where the build diverges.
3. Confirm the AI gateway provider decision (deferred in the brief) and complete the retention sentence in Section 5.4.
4. Hardware guidance page must exist before the compatibility language in Sections 5.5 and the printer FAQ ships.
5. Decide whether the Security Evidence Report sample shown on the landing page is a mockup (must be labeled as such) or redacted real output.

---

## Appendix A: Regulatory Landscape Facts Behind the Disclaimers

Researched 2026-08-25 with citations. Purpose: prevent accidental false statements in landing copy. Not legal advice.

**FTC Safeguards Rule (16 CFR Part 314).** Applies to FTC-jurisdiction "financial institutions." Entities engaged in providing insurance fall under state insurance authorities' GLBA enforcement (GLBA section 505(a)(6), 15 USC 6805(a)(6)), so licensed agents acting in their regulated insurance business are ordinarily overseen by their state insurance regulator instead of the FTC. This is jurisdictional allocation, not blanket exemption: non-insurance activities or different entity structures can change the analysis. The December 2021 amendment (86 Fed. Reg. 70,272; effective January 10, 2022; detailed requirements from June 9, 2023) did not create an insurance-agent exemption. Sources: law.cornell.edu/cfr/text/16/314.1; ftc.gov Safeguards business guidance.

**NAIC Insurance Data Security Model Law (#668).** Requires covered licensees to maintain a comprehensive written information security program based on risk assessment, designate a responsible party, maintain a written incident response plan, and notify the home-state commissioner within 72 hours of determining a qualifying cybersecurity event occurred (the 72-hour clock is a regulator-notification rule, not consumer notice). Model section 9A exempts licensees with fewer than 10 employees from the section 4 program requirement; individual states vary. As of the NAIC adoption map dated April 1, 2026: 28 of 56 NAIC jurisdictions have implemented legislation. Sources: content.naic.org model-law-668.pdf; NAIC state adoption map.

**SEC Regulation S-P amendments (2024).** Adopted May 16, 2024, effective August 2, 2024. Applies to broker-dealers, investment companies, and SEC-registered investment advisers (relevant to dually registered advisors regardless of insurance licensure). Requires incident response programs, vendor notification duties (providers must notify institutions within 72 hours of a qualifying breach), and customer notification within 30 days for incidents involving sensitive customer information unless low risk of harm is documented. Compliance dates: December 3, 2025 (larger entities), June 3, 2026 (smaller entities). Sources: sec.gov final rule 34-100155; SEC small-entity compliance guide.

**State breach notification laws.** All 50 states plus DC and territories have them. Common pattern: consumer notice without unreasonable delay; roughly 20 jurisdictions specify 30 to 60 day outer deadlines (survey through January 1, 2026); about 36 states require attorney general or state agency notice with varying thresholds. Encryption can eliminate or narrow notification duties in many statutes, which is worth knowing but must never be claimed as a benefit on the landing page. Sources: ncsl.org breach law roundup; Privacy Rights Clearinghouse 50-state survey, 2026 edition.

**GLBA Safeguards core requirements (when applicable).** Written program, designated Qualified Individual, periodic written risk assessment, encryption of customer information at rest and in transit, MFA, annual penetration testing and semiannual vulnerability assessments absent continuous monitoring, workforce training, vendor oversight, written incident response plan, annual reporting, and 30-day FTC notification events for breaches affecting 500 or more consumers' unencrypted information (effective May 2024). SP+ evidence maps to selected endpoint elements only. Sources: 16 CFR 314.4.

**Cyber insurance.** Carrier applications (Beazley, Victor, Chubb, QBE forms reviewed) commonly ask about endpoint protection, device encryption, MFA, firewalls, patching, backups, incident response, and logging. Honest framing: the Security Evidence Report may help an applicant document controls for an underwriter. It guarantees nothing about coverage, eligibility, pricing, or claims.

**Disclaimer language norms.** Apache 2.0 section 7 supplies the AS IS/no-warranty baseline. Comparable financial-professional software terms reviewed (ArvoFin, Palnu, Brieflywealth) consistently include: tool-not-advice, no-compliance-guarantee, customer-responsibility, scope-of-evidence, and AS IS clauses. Direction adopted in Section 5 follows that consensus.
