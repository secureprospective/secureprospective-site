# Advisor Help Knowledge Base

Plain-English help content for Secureprospective Advisor OS advisors.

## Voice rules for every page in this directory

1. Written for the reader, not the engineer. Short sentences. Everyday words.
2. Second person: "you", "your computer".
3. No em dashes anywhere.
4. A technical term may appear only if it is explained in the same sentence, in plain words.
5. No terminal instructions. Everything happens in Settings, the browser, or the Advisor Assistant.
6. Never promise universal hardware support or compliance outcomes. Say what is true and stop.
7. Every page ends with related pages so the reader always has a next step.

## Structure

```text
knowledge/
├── advisor-help/       Daily life on Advisor OS: start here
│   ├── welcome.md                    What this computer is
│   ├── getting-around.md             Finding your way (Windows and Mac editions)
│   ├── brave-and-bitwarden.md        Browser and passwords
│   ├── asking-the-assistant.md       The built-in assistant and approvals
│   ├── updates-and-restarts.md       Automatic updates and the built-in undo
│   ├── security-evidence-report.md   Proving your security posture
│   └── getting-more-help.md          Self-help first, support second
├── troubleshooting/    Fix-it pages, ordered by likelihood of use
│   ├── printer-not-printing.md
│   ├── wifi-wont-connect.md
│   ├── bluetooth-devices.md
│   ├── second-monitor.md
│   ├── no-sound.md
│   └── computer-asks-for-recovery-key.md
├── security/           How the protections work, in plain terms
│   ├── your-encryption-and-recovery-key.md
│   ├── screen-lock-and-privacy.md
│   └── what-leaves-this-computer.md
├── playbooks/          Signed remediation definitions (machine-read; not advisor reading)
└── README.md           This file
```

## For PWA builders

- Render each markdown file as one help article. The `#` title becomes the page heading.
- Article order in navigation should follow the structure above within each section.
- Cross-references between pages use relative paths; resolve them inside the PWA.
- `msp-support/` is reserved for future delegated-support content and is intentionally absent until that feature ships.
