# The Assistant

The Assistant is built into this computer to help when something goes wrong: a printer stops, Wi-Fi misbehaves, an update seems stuck. You describe the problem in your own words. It investigates, explains, and fixes only what you approve.

## How a fix works, start to finish

1. **You ask.** Open the Assistant (your browser's home page) and say what is wrong. Plain words are fine: "my printer quit" is a complete sentence.
2. **It checks.** The Assistant looks at the relevant parts of the system: print services for printing, network settings for Wi-Fi, and so on.
3. **It explains.** You get a short explanation in plain English of what it found. No jargon without translation.
4. **You approve.** Nothing changes until you approve the proposed fix. The approval step cannot be skipped, by you or by anyone else.
5. **It verifies.** After the fix runs, the Assistant checks that the problem is actually gone (a test page prints, the network reconnects).
6. **It remembers.** The whole event is recorded in the device history: what was found, what was approved, what changed, whether it worked.

## What the Assistant can see

Only technical facts about the computer itself: software versions, hardware model, component status, error codes with identifying details removed.

What it cannot see, ever, unless you explicitly approve a specific item:

- Your documents, spreadsheets, and PDFs
- Email, calendar, contacts, CRM records
- Browser history and open tabs
- Passwords and Bitwarden vault contents
- Clipboard contents
- Client names or policy information
- Screenshots (each one requires your separate approval)

This boundary is enforced by the system itself, not by a promise in a settings file. See [What leaves this computer](../security/what-leaves-this-computer.md) for exactly which facts go online during a diagnosis.

## What the Assistant will not do

- It will not change anything without your approval.
- It will not install random software from the internet.
- It will not act as a general chatbot for browsing questions, drafting emails, or anything involving client work. That is by design: this Assistant has one job, done safely.

## When the Assistant is not enough

Some problems need a human. Support sessions are time-limited, require your approval, and are recorded like everything else. See [Getting more help](getting-more-help.md).

## Related pages

- [Updates and restarts](updates-and-restarts.md)
- [Security Evidence Report](security-evidence-report.md)
- [Troubleshooting index](../troubleshooting/printer-not-printing.md)
