# PART 1 — The five open questions

## 1. Is “names yes, contents no” a coherent privacy boundary?

**No. Filenames must be treated as content unless proven otherwise.** A filename can identify a client, establish the advisory relationship, disclose an account type, and reveal a transaction or life event. `Robert Chen 2026 IRA rollover disclosure.pdf` is not harmless metadata.

A defensible alternative:

1. Keep the file inventory and search index local.
2. Present files through a trusted local picker.
3. Give the cloud model opaque identifiers such as “Document A” or minimally descriptive, locally generated labels.
4. Reveal the real filename only when necessary and under the same authorization used for contents.
5. Send only the relevant extracted passage, locally redacted where possible—not the complete file by default.
6. Bind approval to a content hash or immutable snapshot, purpose, provider, operation, and expiration. A path alone is vulnerable to replacement and symlink attacks.
7. Treat unknown files and metadata as protected by default.

The assistant does not need a raw client directory listing to ask, “Do you mean the PDF modified this morning?” Local deterministic code can resolve the user’s answer to the actual file.

## 2. Is an expiring, revocable standing grant real consent?

**It can be a useful authorization mechanism, but it is not a liability-transfer instrument, and account scope is too broad.**

The advisor operating the computer is generally not the consumer whose nonpublic personal information appears in the mailbox. Their click therefore is not consumer consent under 17 CFR § 248.15(a)(1). It also does not waive the practice’s safeguarding obligations.

If standing access is retained, scope it to:

- Authenticated operator and role.
- Mail account plus folder, label, sender class, or deterministic query.
- Read operation only; no credential export, rules modification, or send capability.
- Defined data classes and maximum volume.
- Specific workflow rather than a natural-language “purpose.”
- Named model provider and applicable provider configuration.
- Short duration and periodic reauthorization.
- Parameter-bound, tamper-resistant approval.
- Immediate future-access revocation, with a separate provider-deletion process.

Revocation cannot recall data already transmitted, remove it from provider security logs, or reverse model-provider processing. The UI must not suggest otherwise.

Most importantly, mail is hostile input. The component that reads message bodies should have no privileged tools. A separate deterministic policy executor should mediate any resulting action.

## 3. Where should the sensitive-store classifier get its list?

**From a versioned system data inventory and per-application security manifest—not extensions and not an informal hand-maintained list.**

Each application package should declare:

- Files, directories, databases, sockets, keyrings, caches, indexes, and credentials it creates.
- Data classes stored there.
- Which operations Fin may request.
- Whether content may leave the machine.
- Required redaction and retention treatment.

A central policy compiler should combine those declarations with a distribution baseline covering `/home`, `/var`, mounted shares, browser profiles, mail stores, password stores, print queues, search indexes, thumbnails, backups, process state, `/proc`, keyrings, clipboard history, swap, and crash dumps. Installation or update of an application should fail CI if it writes sensitive state outside its declaration. Runtime discovery can detect drift, but must not be the primary authority.

Enforcement must resolve the final object, not trust a pathname: canonicalize paths, reject unsafe symlinks and mount crossings, account for hard links, bind mounts, archives and database records, and bind permission to the exact file version.

None of this is effective while Fin has unrestricted root and shell access. Root can bypass the classifier. The classifier must sit in a separate reference monitor that Fin cannot modify or circumvent.

## 4. What unmentioned failure mode matters most?

**Indirect prompt injection converts an attacker’s email or document into root command execution.**

A client, compromised mailbox, website, filename, log entry, network device name, or PDF can contain instructions aimed at Fin rather than the advisor. Current agents combine trusted instructions and untrusted data in one model context. NIST describes this as agent hijacking and reports that red-team attacks induced agents to perform remote code execution, database exfiltration, and automated phishing; an adaptive attack raised measured success from 11% to 81% in one evaluation set.[1]

The likely chain here is:

1. An attacker sends a crafted email.
2. A standing grant authorizes unattended ingestion.
3. The cloud model interprets attacker text as instructions.
4. Fin uses passwordless sudo or another privileged tool.
5. It reads browser tokens, mail credentials, client records, mounted backups, or process memory.
6. It exfiltrates data, encrypts `/var/home`, alters `/etc`, installs persistence, or tampers with the consent log.

Per-file consent does not stop this. It authorizes the delivery of the attack to the model. The model must not simultaneously possess untrusted content, unrestricted tools, root authority, and arbitrary network access.

## 5. Is one generated source for articles and Fin skills correct?

**Use one source for canonical facts, but do not generate both complete artifacts from the same prose.**

The shared layer should contain:

- Stable issue and command identifiers.
- Symptoms and diagnostic facts.
- Supported remedies.
- Preconditions, permissions, risks, rollback steps, and verification criteria.
- Version applicability and links between related facts.

Then maintain separate audience-specific projections:

- Advisor articles: explanation, choices, reassurance, escalation, and accessible language.
- Fin skills: typed tool calls, exact constraints, failure handling, authorization requirements, and machine-verifiable postconditions.

Forcing both audiences through one prose template will either make the article read like an operator manual or make the skill dangerously vague. Automated cross-reference and consistency tests are preferable to literal single-source prose generation.

---

# PART 2 — What is wrong that has NOT been flagged

**Decisions 5 through 10 should not ship enabled. The architecture places the policy mechanism inside the authority it is meant to restrain.**

## 1. Decision 7 is defeated by decision 5

A mechanical read gate is meaningful only if the requesting process cannot bypass it. Fin runs as a user with unrestricted passwordless sudo. It can therefore:

- Invoke `sudo cat`, Python, `dd`, SQLite, OCR, or archive tools.
- Copy protected content into an unprotected temporary file.
- Read the underlying block device or another process’s memory.
- Modify or stop the policy service.
- Edit consent records and audit logs.
- Open another network path.

The record never specifies Fin’s actual tool surface. If it has arbitrary shell execution, the proposed gate is plainly ineffective. If it does not, “Fin holds full root” is misleading and the allowed privileged interface needs to be specified.

The correct boundary is a separate, root-owned broker. Fin should run under a distinct unprivileged identity with no sudo, no raw user-home access, no arbitrary shell, and no unrestricted network. The broker should expose narrowly typed operations such as “query service status” or “restart this allowlisted unit,” not `execute(command)`.

## 2. The same process controls data, action and network

This violates basic separation of duties. A cloud-generated tool call can select data, perform a privileged action, and choose an egress destination.

Outbound traffic must be default-denied except through a controlled AI gateway. Otherwise data can leave through:

- Direct HTTP, DNS or webhooks.
- URLs containing encoded secrets.
- Crash reports and telemetry.
- Shell command arguments.
- Support logs or model traces.
- Email, browser automation, cloud drives, printers, or mounted shares.

A file-read interceptor does not constitute an egress control.

## 3. “System files and logs” are not a low-sensitivity class

Logs commonly contain client names, filenames, email subjects, print jobs, URLs, SMB paths, command arguments, OAuth tokens, bearer tokens, credentials, and application payloads. Other nominally “system” sources can expose:

- `/proc`, environment variables and process command lines.
- Kernel and desktop keyrings.
- Browser cookies and session databases.
- Notification and clipboard history.
- Search indexes, thumbnails and recent-file databases.
- Core dumps, swap and hibernation images.
- Network-manager secrets and share credentials.
- Backup catalogues and deleted-but-open files.

Regulation S-P classifies information by what it contains and whose information it is—not by extension or whether Linux calls it a log.

## 4. Consent is vulnerable to object substitution

“Consent for this file” is underspecified. Between display and read:

- The file can be replaced.
- A symlink can point somewhere else.
- A bind mount can change the target.
- A document can be modified.
- An archive can contain undisclosed files.
- A database query can return different records.

Approval must bind to the resolved object and exact version or snapshot, expected data class, byte limit, provider, purpose and operation. The trusted approval interface must also be outside the model-controlled UI path and should use step-up authentication for high-risk access.

## 5. The consenting person may lack authority

A logged-in employee may be authorized to use a mailbox but not to disclose every client’s information to an AI provider. One file or mail thread may contain data about multiple clients, employees, prospects, custodians, or another financial institution’s customers.

The proposed model asks whether the operator consents. It does not establish:

- Whether the practice permits the disclosure.
- Whether applicable client privacy notices cover it.
- Whether an exception or client authorization applies.
- Whether the operator’s role permits this purpose.
- Whether information received from another institution can be reused this way.

## 6. The audit log is neither sufficient nor trustworthy

A local log writable by root does not prove what was transmitted. It also becomes another sensitive customer-information store.

A useful audit trail needs at least:

- Authenticated actor and role.
- Authorization record and trusted-UI event.
- Resolved object, version/hash and data classification.
- Exact provider, model, tenant and endpoint.
- Purpose, tool, bytes and transformations/redactions.
- Transmission result, provider request identifier, retention setting and deletion event.
- Denied and attempted bypasses.
- Tamper-evident remote or separately protected storage.

A filename list cannot establish whether the full file, excerpts, credentials, hidden metadata, or additional tool output left the machine.

## 7. Cloud-provider lifecycle is absent

The record says only that data leaves the machine. It does not decide:

- Whether prompts are retained or used for training.
- Whether provider personnel may review them.
- Whether abuse-monitoring logs contain prompts.
- Which subprocessors receive the data.
- Geographic processing and storage locations.
- Tenant isolation and encryption.
- Deletion timelines and backup retention.
- Customer-managed keys or access logging.
- Contractual restrictions on secondary use.
- Breach-notification obligations.

Consent to transmission is not consent to unlimited downstream processing.

## 8. Root creates destructive and persistent risks unrelated to reading

Fin can delete, encrypt, corrupt, chown, or silently alter client records. It can disable backups, endpoint controls and logging; change the clock; create autostart entries under `/etc` or `/var`; alter boot configuration; or steal credentials for later use.

Because `/var` and `/home` survive rollback, malware and persistence placed there survive too. Mounted or locally accessible backups may be destroyed in the same event. Immutability is not a backup or a containment boundary.

## 9. “Fin does not send mail” is not enforced

A root-capable process can send mail through SMTP, browser automation, a provider API, a desktop client, a queued outbox, or stolen OAuth credentials. Removing a nominal `send_mail` tool does not remove sending capability.

Even a genuine draft-only mechanism leaves risks:

- Prompt injection can insert false statements, phishing links or hidden HTML.
- The model can select incorrect recipients or reply context.
- Automation bias turns “advisor presses send” into rubber stamping.
- Draft synchronization is itself a disclosure to the mail provider.
- Mail rules or plugins may transmit or process drafts.

Draft-only is a worthwhile layer only if enforced through a narrowly scoped API credential that cannot send, modify rules, export tokens, or access unrelated mail.

## 10. Revocation cannot undo disclosure

“One-click revocation” stops future access only if every credential, cache, queued task and session is actually terminated. It cannot remove already transmitted material from provider logs, backups, embeddings, human-review queues or model context. The UI and record must distinguish prospective revocation from downstream deletion.

## 11. Availability contradicts the governing goal

Cloud-first repair fails during internet outages, DNS failures, provider outages, account suspension, exhausted quotas and precisely the network incidents the system is supposed to repair. Deterministic local diagnostics and recovery paths are required. Some hardware, network, compromise and regulatory incidents will still require human escalation; “eliminate the IT department” cannot safely mean “remove every qualified escalation path.”

## Required architectural correction

Before any enabled release:

1. Remove `%wheel ... NOPASSWD: ALL` from Fin’s execution identity.
2. Run Fin under a distinct unprivileged identity.
3. Put privileged operations behind a separate typed policy broker.
4. Give the cloud-facing component no shell and no direct filesystem or arbitrary network access.
5. Parse untrusted mail and documents in a no-tools quarantine.
6. Route all provider traffic through a data-minimizing, logged egress gateway.
7. Use a trusted local approval path and independent, tamper-evident audit sink.
8. Ship disabled until adversarial tests demonstrate denial of prompt-injection, privilege-escalation, classifier-bypass and exfiltration cases.

OWASP’s agent-security guidance explicitly advises least privilege, separate tool sets by trust level, approval for sensitive operations, sandboxing, output validation and rejection of unrestricted shell access.[2]

---

# PART 3 — Regulatory assessment

**No. Decisions 8 and 9, standing alone, would not satisfy an examiner evaluating an SEC-registered investment adviser under Regulation S-P.** The problem is not that AI processing is categorically forbidden. The problem is that the record substitutes operator clicks for the covered institution’s legal and operational safeguards.

As of the draft’s August 2026 date, the 2024 Regulation S-P amendments are already within their compliance period for both large and small covered institutions. The small-entity deadline was June 3, 2026.[3] If the practice is state-registered rather than SEC-registered, the exact federal coverage must be checked against its registration and applicable state or FTC rules; the same operator-consent design would still be inadequate.

## The advisor’s click is not the relevant consumer consent

17 CFR § 248.15(a)(1) recognizes disclosure made with the consent or at the direction of the **consumer**.[4] Decisions 8 and 9 obtain permission from the advisor operating the machine, not from the client or other consumer identified in the records.

Nor is client consent necessarily the only lawful route. Depending on the arrangement, a cloud provider may perform services under an applicable Regulation S-P exception. For example, § 248.13 can remove the opt-out requirement for a service provider if required notice is given and a contract prohibits the provider from using or disclosing the information beyond the disclosed purpose.[5] Other processing exceptions may apply to particular activities. That analysis must be performed at the practice level.

What is not lawful reasoning is: “the employee clicked, therefore liability transfers.”

## Safeguarding responsibility remains with the practice

Section 248.30 requires written administrative, technical and physical safeguards reasonably designed to:

- Ensure security and confidentiality.
- Protect against anticipated threats and hazards.
- Prevent unauthorized access or use that could cause substantial harm or inconvenience.[6]

A cloud AI provider that receives, maintains, processes or is permitted access to customer information is a “service provider” under § 248.30(d)(10). The practice must maintain and enforce written service-provider oversight procedures, including due diligence and monitoring, designed to ensure appropriate protection and notification within 72 hours after a qualifying provider breach. Even where the provider performs notification work, the obligation to ensure affected individuals are notified remains with the covered institution. That directly contradicts the proposed liability-transfer premise.

## What is missing

An examiner would expect at least:

### Governance and written safeguards

- A data inventory and risk assessment covering prompts, attachments, metadata, outputs, logs, credentials and provider copies.
- Written administrative, technical and physical safeguards.
- Defined accountable owners and operator roles.
- Least-privilege access and segregation of privileged execution from AI interpretation.
- Change control, vulnerability management, testing and periodic review.
- Workforce authorization and training.

### Privacy and disclosure basis

- Accurate initial and other required privacy notices.
- Analysis of whether each use falls under a Regulation S-P exception.
- Consumer opt-out where no exception applies.
- Actual consumer consent where reliance is placed on § 248.15(a)(1).
- Contractual limits on provider use and redisclosure where relying on § 248.13.
- Treatment of information received from other financial institutions.

### Service-provider management

- Due diligence on security, retention, training use, personnel access, subprocessors and data location.
- Ongoing monitoring rather than a one-time vendor review.
- Restrictions on training and secondary use.
- Encryption, access control, tenant isolation and deletion obligations.
- Required incident reporting that supports the 72-hour rule.
- Exit, deletion and provider-failure procedures.

The final safeguards amendment does not universally mandate that every service-provider control appear in a contract, but § 248.13 does require a contractual use/disclosure restriction when that privacy exception is used. In practice, enforceable contract terms are also the obvious means of obtaining provider breach, deletion and use restrictions.

### Incident response and notification

Written procedures must detect, respond to and recover from unauthorized access or use; assess scope and affected systems; contain the incident; and determine notification. Affected individuals generally must receive notice as soon as practicable and no later than 30 days after awareness, unless the rule’s investigation-based exception applies.[6]

The draft has no incident-detection mechanism, containment plan, provider-event integration, customer-notification process or method for determining exactly which records were exposed.

### Records and evidence

For SEC-registered advisers, amended Rule 204-2(a)(25) requires records of safeguards policies, detected incidents, response and recovery, notification investigations and decisions, service-provider oversight, relevant agreements, and disposal policies. The normal adviser retention period is at least five years from the end of the fiscal year of the last entry, with the first two years in an appropriate office.[7]

A user-readable consent log is only one small record. It does not satisfy those requirements.

### Disposal and downstream deletion

Regulation S-P requires reasonable measures and written procedures for proper disposal of customer and consumer information.[6] The architecture does not address provider retention, caches, backups, local conversation histories, embeddings, audit copies or deletion verification.

## Examiner-level conclusion

The system might become defensible if cloud AI is treated as a tightly governed service provider inside a written safeguards program. It is not defensible as “the advisor authorized this file, therefore the advisor owns the liability.” That sentence should be removed from the record.

---

# PART 4 — Factual challenges

## 1. The `bootc rollback` claim is substantially correct, but incomplete

**Confirmed:** A normal `bootc rollback` does not restore `/var`, and therefore does not restore a Fedora/OSTree home stored under `/var/home`.

Official bootc documentation says:

- `bootc rollback` changes bootloader ordering so the rollback deployment is used on the next boot; it does not reconstruct a backup.
- `/var` is one shared state area across deployments.
- A bootc update or rollback “should not affect” application data in `/var`.[8]
- OSTree documents exactly one `/var` per stateroot, shared by its deployments.[9]

On the normal Fedora OSTree layout, `/home` is backed by `/var/home`; a separately mounted home would likewise not be reverted by merely selecting an older OS deployment. Therefore client documents are not restored by `bootc rollback`.

The `/usr` wording needs precision: rollback selects the previous deployment, whose image content—including `/usr`—then becomes active. It does not restore modified user data or “repair” the current deployment from a backup.

**Important omission:** `/etc` behaves differently. Official `bootc rollback` documentation says changes made to `/etc` do not carry into the rolled-back deployment; `/etc` reverts to the state associated with that previous deployment because rollback only reorders existing deployments and does not perform a new three-way merge.[10]

Also, an automatic update agent can subsequently undo the rollback by reapplying the newer image. The record should mention this.

A running-guest test is still warranted to verify SP+’s actual `/home` mapping, separate mounts, composefs configuration and backup design, but the underlying `/var` claim is already confirmed by official documentation.

## 2. “The liability for that content sits with the advisor” is wrong

The operator’s consent does not transfer the regulated entity’s safeguards, privacy, service-provider oversight, recordkeeping, incident-response or notification obligations. Section 248.30(a)(5)(iii) expressly keeps notification responsibility with the covered institution even when a provider is involved.[6]

## 3. “Specific consent makes the transfer real” is wrong

Specificity can improve authorization quality. It does not create a legal transfer of regulatory responsibility. It also does not establish consumer consent when the person clicking is an employee or adviser rather than the affected consumer.

## 4. “The log is the only way” to tell a regulator what left is wrong

A local log is neither the only evidence nor sufficient evidence. Network gateway records, provider request IDs, DLP events, immutable audit records and provider-side access logs are also necessary. A root-writable local log can be altered and may not record the actual transmitted bytes.

## 5. “Immutability protects the operating system” is materially overstated

A read-only image protects image files from ordinary mutation. It does not protect the running operating system from a root process. Root can change `/etc`, `/var`, boot configuration, user autostart state, credentials, kernel runtime settings and selected deployments. It can also destroy or exfiltrate practice data. Verified images and Secure Boot do not make root-level agent execution harmless.

## 6. “Guardrails should stay relaxed about `/usr`” is wrong

OS integrity and practice-data integrity are connected. Compromise of executables, boot state, trusted configuration or update selection can produce persistent future access to client records. Controls are needed around both system state and business data.

## 7. “A password prompt the user cannot satisfy buys no security” is false as a general security claim

Reauthentication can establish user presence and interrupt unattended compromise. If passwords are unsuitable, the replacement should be a trusted approval mechanism, hardware-backed authentication, narrowly scoped Polkit action or capability broker—not blanket passwordless root for every process running as the desktop user.

## 8. “Full read of system files, configs and logs is what fixing things requires” is false

Many repairs require only structured service status, selected diagnostics and tightly scoped actions. Credentials, browser databases, arbitrary logs and all of `/proc` are not generally required. The claim confuses occasional privileged diagnostics with unrestricted continuous access.

## 9. Decision 6 and decision 9 contradict each other

Decision 6 says mail is “per item consent, at all times.” Decision 9 authorizes account-level standing access. Decision 9 may be intended as an override, but the final policy table is factually inaccurate unless amended.

## 10. “Advisors keep separate accounts for separate duties” is an unsupported generalization

Even separate accounts commonly contain mixed client, prospect, vendor, employee and personal material. An account is an administrative boundary, not a reliable data-classification or regulatory-purpose boundary.

## 11. “Fin does not send mail” is not true under the stated privilege model

Unless SMTP, provider APIs, browser automation, mail credentials and arbitrary networking are mechanically unavailable, a root-capable Fin can send mail. “The intended mail tool only creates drafts” would be accurate; the broader assertion is not.

## 12. “One click, and an entire category of unrecoverable mistake disappears” is wrong

Human send approval reduces automated-send risk. It does not eliminate deceptive drafts, incorrect recipients, hidden links, automation bias, compromised mail rules, stolen credentials, or alternative sending paths.

## 13. “Everything Fin reads leaves the machine” is an implementation choice, not a necessary fact

Local indexing, local classification, deterministic extraction, redaction and scoped diagnostic collectors can prevent raw material from reaching the provider. The record incorrectly treats cloud inference as requiring transmission of every locally read input.

## 14. The implementation-status paragraph is internally unclear

It says every decision other than decision 5 is unimplemented, while decision 6 states as fact that Fin already uses cloud AI almost exclusively. The record should distinguish:

- Existing Fin cloud behavior.
- Existing Welcome behavior.
- Proposed Welcome-to-Fin integration.
- Proposed policy enforcement.

Without that distinction, the current truth of screen five cannot be evaluated. If it claims that the whole product sends no data while existing Fin already uses cloud inference, it is false now—not merely after this design is implemented.

---

## Sources

1. NIST, “Strengthening AI Agent Hijacking Evaluations”: https://www.nist.gov/news-events/news/2025/01/technical-blog-strengthening-ai-agent-hijacking-evaluations  
2. OWASP, AI Agent Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html  
3. SEC, Regulation S-P 2024 final rule and compliance guide: https://www.sec.gov/files/rules/final/2024/34-100155.pdf  
4. 17 CFR § 248.15: https://www.law.cornell.edu/cfr/text/17/248.15  
5. 17 CFR § 248.13: https://www.law.cornell.edu/cfr/text/17/248.13  
6. 17 CFR § 248.30: https://www.law.cornell.edu/cfr/text/17/248.30  
7. 17 CFR § 275.204-2: https://www.law.cornell.edu/cfr/text/17/275.204-2  
8. bootc filesystem documentation: https://bootc-dev.github.io/bootc/filesystem.html  
9. OSTree deployment documentation: https://ostreedev.github.io/ostree/deployment/  
10. `bootc rollback` documentation: https://bootc-dev.github.io/bootc/man/bootc-rollback.8.html
