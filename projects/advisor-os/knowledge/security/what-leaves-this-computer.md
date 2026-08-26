# What Leaves This Computer

Trust is easier to keep when you can check it. This page states plainly which information goes where, so you never have to wonder.

## The short version

- Your work stays on your side: documents, email, browsing, passwords, client records.
- The Assistant sends only technical facts about the computer itself when diagnosing a problem, with identifying details removed first.
- Every transmission is logged locally where you can read it.

## When the Assistant diagnoses a problem

Some diagnoses benefit from consulting advanced diagnostics online (the same way a good mechanic might phone the manufacturer). Before anything is sent, a filtering layer reduces it to an allowlist:

**Allowed to leave:**

- Operating system version
- Computer model and hardware capabilities
- Driver and component status ("print service stopped", "Wi-Fi chip present")
- Error codes, scrubbed of identifying details
- Network state, without passwords or credentials
- Update status
- The Assistant's own recent diagnostic history, sanitized

**Never leaves unless you approve that specific item:**

- Documents, spreadsheets, PDFs, anything in your files
- Email, calendar, contacts, CRM records
- Browser history, bookmarks, open tabs
- Passwords, cookies, Bitwarden vault contents
- Anything on your clipboard
- Client names and policy information
- File names and folder paths
- Screenshots: each one needs your explicit, separate approval

The filtering is enforced by the system itself, not by instructions the Assistant is asked to follow. You can see this working: every diagnosis shows exactly what was sent, in a "technical information sent for diagnosis" panel.

## Where AI requests go

Diagnosis requests reach online AI services through Secureprospective. Providers may retain processed requests under their own commercial terms; the current provider and its retention policy are documented in your service materials and may change as providers change. What does not change: only the allowlisted technical facts above are ever in the request.

## What support sessions see and record

When you approve a support session, three things are true at once: access is temporary, it requires your approval, and it is recorded in your device history like everything else. Support works technical problems; there is no routine reason for anyone to open your documents.

## What you can check anytime

1. **Device history**: the Assistant page keeps the readable log of events: diagnoses, approvals, fixes, support sessions, each timestamped.
2. **Sent-request records**: any diagnosis that went online shows its full payload under "technical information sent".
3. **Security Evidence Report**: generates a summary of protections and significant events, ready to share. See [Security Evidence Report](../advisor-help/security-evidence-report.md).

If anything in the history ever looks wrong to you, that is precisely what [support](../advisor-help/getting-more-help.md) is for.

## Related pages

- [The Assistant](../advisor-help/asking-the-assistant.md)
- [Your encryption and recovery key](your-encryption-and-recovery-key.md)
- [Screen lock and privacy](screen-lock-and-privacy.md)
