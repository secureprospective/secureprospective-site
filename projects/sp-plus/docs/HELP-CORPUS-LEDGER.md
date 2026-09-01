# SP+ advisor manual — work ledger

**This file is the single source of truth for what is done and what is not.**
Update it after every article, in the same commit as the article. On resume, read
THIS FILE ONLY to find your place. Do not re-read finished articles.

Status values: `TODO`, `DRAFTED`, `VERIFIED`, `BLOCKED`.
An article is only `VERIFIED` when every factual claim in it has been checked
against a running SP+ machine or the built image, and the check is recorded in the
Evidence column.

## Batch 1 — Start here

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| S1 | What this computer is | knowledge/advisor-help/welcome.md | VERIFIED | verified: live VM bootc status, lsblk crypto_LUKS, rpm -q brave-browser cups libreoffice-writer, /usr/bin/fin, updater timer disabled; image localhost/sp-plus-kde:spike same packages, Fin prompt/desktop, PasswordManagerEnabled=false, updater timer disabled. Drift: Bitwarden absent; VM has no LUKS recovery token; Autolock=false. |
| S2 | Coming from Windows | knowledge/advisor-help/coming-from-windows.md | VERIFIED | verified: live VM plasmashell plus Kickoff config, rpm -q plasma-workspace dolphin plasma-systemsettings brave-browser, /usr/bin/fin, wine absent; image same packages, Dolphin and System Settings desktop entries, Fin repair/no-command prompt, wine absent. |
| S3 | Finding your way around | knowledge/advisor-help/getting-around.md | VERIFIED | verified: live VM plasmashell and panel config for Kickoff, Icon Tasks, system tray, clock, network, volume; Dolphin and System Settings installed. Image localhost/sp-plus-kde:spike rpm -q plasma-workspace dolphin plasma-systemsettings kscreen, app desktop entries, Fin repair prompt. |
| S4 | Your first day: what Welcome set up | knowledge/advisor-help/your-first-day.md | VERIFIED | verified: live VM and image SP+ Welcome desktop entry; temporary office-folder check with KDE Wallet option; one-page CUPS test; provider web email with no password storage; own-window Fin; optional Bitwarden and Signal; skip/reopen flows. Image also verifies unavailable theme previews cannot apply. |

## Batch 2 — Your files

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| F1 | Where your files live | knowledge/files/where-your-files-live.md | VERIFIED | verified: live VM XDG Documents and Downloads, home resolves under encrypted /var, Documents/Fin exists, Dolphin installed; no sync/backup clients or units. Image skel Documents/Fin plus Fin workspace extension confines saves there; same sync/backup-client absence. |
| F2 | The file portal | knowledge/files/the-file-portal.md | VERIFIED | verified: image localhost/sp-plus-kde:spike has File Portal capability check and browser launch, Private/Shared copy, and separate portal-password guidance; public portal returns HTTP 200 and ready capability JSON. Drift: current running VM has older Welcome code with no File Portal service. |
| F3 | Private and Shared: the rule that stops misfiling | knowledge/files/private-and-shared.md | VERIFIED | verified: image localhost/sp-plus-kde:spike Welcome explicitly says Private is advisor alone and Shared - YOUR NAME is advisor plus SecureProspective; File Portal capability endpoint returns ready. Drift: current running VM has older Welcome code with no Private/Shared UI. |
| F4 | USB drives and external storage | knowledge/files/usb-and-external-drives.md | TODO | |
| F5 | Backups: what is protected and what is not | knowledge/files/backups.md | TODO | |

## Batch 3 — Everyday work

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| E1 | LibreOffice: your Word and Excel | knowledge/advisor-help/libreoffice.md | TODO | existing, needs re-verification |
| E2 | Browser and passwords | knowledge/advisor-help/brave-and-bitwarden.md | TODO | existing, needs re-verification |
| E3 | Printing | knowledge/advisor-help/printer.md | TODO | existing, needs re-verification |
| E4 | Scanning documents | knowledge/advisor-help/scanning.md | TODO | |
| E5 | PDFs: reading, filling in, signing | knowledge/advisor-help/pdfs.md | TODO | |
| E6 | Email | knowledge/advisor-help/email.md | TODO | |
| E7 | Video calls, camera and microphone | knowledge/advisor-help/video-calls.md | TODO | |
| E8 | Scheduling social posts | knowledge/advisor-help/social-posts.md | TODO | |
| E9 | Installing software safely | knowledge/advisor-help/installing-software.md | TODO | |
| E10 | Keyboard shortcuts | knowledge/advisor-help/keyboard-shortcuts.md | TODO | |

## Batch 4 — Fix a problem

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| P1 | Wi-Fi won't connect | knowledge/troubleshooting/wifi-wont-connect.md | TODO | existing, needs re-verification |
| P2 | Printer not printing | knowledge/troubleshooting/printer-not-printing.md | TODO | existing; RECATEGORISE to Fix a problem |
| P3 | No sound | knowledge/troubleshooting/no-sound.md | TODO | existing; RECATEGORISE |
| P4 | Second monitor problems | knowledge/troubleshooting/second-monitor.md | TODO | existing; RECATEGORISE |
| P5 | Bluetooth devices | knowledge/troubleshooting/bluetooth-devices.md | TODO | existing; RECATEGORISE |
| P6 | Computer asks for a recovery key | knowledge/troubleshooting/computer-asks-for-recovery-key.md | TODO | existing, needs re-verification |
| P7 | Something broke after an update: going back | knowledge/troubleshooting/going-back-after-an-update.md | TODO | **the promise welcome.md already makes** |

## Batch 5 — Safety and privacy

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| Y1 | What leaves this computer | knowledge/security/what-leaves-this-computer.md | TODO | existing, needs re-verification |
| Y2 | Your encryption and recovery key | knowledge/security/your-encryption-and-recovery-key.md | TODO | existing, needs re-verification |
| Y3 | Screen lock and privacy | knowledge/security/screen-lock-and-privacy.md | TODO | existing, needs re-verification |
| Y4 | If this computer is lost or stolen | knowledge/security/lost-or-stolen.md | TODO | |
| Y5 | When someone else uses this computer | knowledge/security/someone-else-using-it.md | TODO | |

## Batch 6 — Updates and recovery

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| U1 | Updates and restarts | knowledge/advisor-help/updates-and-restarts.md | TODO | existing, needs re-verification |
| U2 | Changing how it looks | knowledge/advisor-help/changing-how-it-looks.md | TODO | |
| U3 | Getting a new computer | knowledge/advisor-help/getting-a-new-computer.md | TODO | |

## Batch 7 — Get more help

| ID | Article | File | Status | Evidence |
|---|---|---|---|---|
| H1 | Fin the assistant | knowledge/advisor-help/asking-the-assistant.md | TODO | existing, needs re-verification |
| H2 | Getting more help | knowledge/advisor-help/getting-more-help.md | TODO | existing, needs re-verification |
| H3 | Security Evidence Report | knowledge/advisor-help/security-evidence-report.md | TODO | existing, needs re-verification |

## Infrastructure tasks

| ID | Task | Status | Notes |
|---|---|---|---|
| G1 | Write `welcome/build-help-data.py` generator | TODO | corpus becomes single source of truth |
| G2 | Decide and implement the category list | TODO | 7 categories vs the current hardcoded 6 |
| G3 | Regenerate `welcome/app/help-data.json` from corpus | TODO | never hand-edit again |
