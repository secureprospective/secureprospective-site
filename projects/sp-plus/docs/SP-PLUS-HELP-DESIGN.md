# SP+ Help Design

**Status:** working documentation standard, 2026-08-26

This document records the help-system review behind `projects/sp-plus/knowledge/START-HERE.md`. It is for the people maintaining SP+, not a page an advisor needs to read.

## Decision

SP+ help is organized around the advisor's goal or symptom, not around Linux internals. The first page is a searchable, task-based hub. Detailed articles remain short and focused. Every article gives the reader a safe first step, a way to tell whether it worked, a next step, and a clear point at which to ask for help.

The navigation has six jobs:

1. **Start here:** orientation and the first five minutes.
2. **Everyday work:** files, browser, passwords, printing, displays, sound, camera, and applications.
3. **Fix a problem:** symptom-led troubleshooting.
4. **Safety and privacy:** encryption, recovery, screen lock, and data boundaries.
5. **Updates and recovery:** restarts, rollback, and what to expect after a change.
6. **Get more help:** the Assistant, support, evidence records, and what to include in a request.

The user-facing hub deliberately puts common words beside product terms. A reader searching for "wireless" reaches Wi-Fi. A reader searching for "earbuds" reaches Bluetooth. A reader searching for "disk key" reaches the recovery-key article.

## What was learned from beginner systems

### Ubuntu

Ubuntu's desktop guide is the strongest information-architecture model reviewed. It groups help by ordinary tasks such as networking, sound, files, software, settings, hardware, accessibility, and getting more help. Its newer documentation separates tutorials, how-to guides, reference, and explanation. Its wireless troubleshooter walks through one check at a time instead of presenting a wall of possible causes.

SP+ copies the task grouping, guided troubleshooting, and separate escalation path. It does not copy Ubuntu's internal technical vocabulary as the primary navigation.

Sources:

- https://help.ubuntu.com/stable/ubuntu-help/index.html.en
- https://help.ubuntu.com/stable/ubuntu-help/net-wireless-troubleshooting.html.en
- https://help.ubuntu.com/stable/ubuntu-help/community-support.html.en
- https://documentation.ubuntu.com/desktop/en/latest/

### Linux Mint

Mint's user guide is a direct topic index with practical entries for software, system settings, drivers, upgrades, printers, Bluetooth, lost passwords, and GRUB. Its update guidance places recovery advice next to update advice. Its forum has an explicit beginner-question route.

SP+ copies the practical topic names and the idea that recovery guidance belongs beside risky operations. SP+ avoids presenting an obviously unfinished guide or mixing old version-specific instructions into the main path.

Sources:

- https://linuxmint-user-guide.readthedocs.io/en/latest/
- https://linuxmint-user-guide.readthedocs.io/en/latest/mintupdate.html
- https://forums.linuxmint.com/

### Fedora and KDE

Fedora Quick Docs uses short how-to and FAQ articles, with a clear route to Ask Fedora when documentation is not enough. KDE's manual names the objects a person can see: panel, launcher, taskbar, system tray, clock, desktop, widgets, search, activities, and shortcuts.

SP+ uses visible labels such as **System Settings**, **Files**, **Activities**, **volume control**, and **network icon**. It also keeps the support route separate from the article itself. Version and desktop differences must be shown when they can change the steps.

Sources:

- https://docs.fedoraproject.org/en-US/quick-docs/
- https://docs.fedoraproject.org/en-US/quick-docs/getting-started-guide/
- https://docs.kde.org/stable_kf6/en/plasma-desktop/plasma-desktop/index.html

### elementary OS

elementary's basics guide starts with the visible desktop and uses exact menu paths. Its application search accepts names, keywords, actions, and settings. Its installation guide puts backup and verification before destructive steps.

SP+ copies the visual orientation, exact menu labels, and the install-before-you-erase checklist. SP+ keeps onboarding, reference, and troubleshooting separate rather than making one long page carry every job.

Sources:

- https://elementary.io/docs/learning-the-basics
- https://elementary.io/docs/installation

## Article standard

Every new help article should answer these questions in this order:

1. **What will this fix or teach?** State the outcome in the first sentence.
2. **What should the reader check first?** Start with the safe, reversible, likely cause.
3. **What exact visible control should the reader use?** Use the label shown on the screen.
4. **How will the reader know it worked?** Name the observable result.
5. **What is the next single step if it did not work?** Do not give five branches at once.
6. **What should the reader avoid?** Especially passwords, recovery keys, random installers, and destructive actions.
7. **When should the reader stop and ask for help?** Make the boundary explicit.
8. **What should the reader tell support?** Include the error and device, never secrets or client information.
9. **What release or desktop does it apply to?** Add this when the behavior can vary.
10. **Where can the reader go next?** End with related pages.

Use:

- Short paragraphs and numbered steps.
- Second person: **you** and **your computer**.
- Common words before technical terms.
- One technical term only when it helps, with a plain explanation beside it.
- Exact menu labels in bold.
- Symptom titles such as **Wi-Fi will not connect**, not component titles such as **NetworkManager troubleshooting**.
- A visible freshness marker in the PWA once the release process supports it.

Do not use:

- Terminal commands in advisor-facing help.
- Unexplained words such as initramfs, PCR, D-Bus, immutable, or container image.
- Claims that SP+ makes a business compliant or protects every copy of a file.
- "Works on most hardware" language. Untested hardware is unsupported until it is tested.
- A support forum as the first answer to a common problem.
- A long list of possible causes without an order.

## Claims that need care

The help content must match the decisions in the SP+ planning set:

- Say that the parts holding working files are encrypted. Do not claim that every byte on the machine is encrypted until the exact storage layout has been decided and tested.
- Explain that the recovery key is unique to one computer and must be stored away from it.
- Treat TPM automatic startup unlocking as a convenience with a passphrase fallback, not as the only unlock path.
- Say that Secure Boot checks startup software. Do not imply that it proves the whole computer or business is safe.
- Describe the Security Evidence Report as evidence about one computer, never as a compliance certificate.
- Describe the Assistant's allowlisted technical snapshot and approval step. Never promise that cloud providers retain nothing unless the current service terms support that statement.
- Mark planned or test-only screens when the installed test image does not yet provide them.

## Completion check for the help package

Before calling the help system ready for an advisor pilot, test it with a person who has not used Linux:

- They can find an answer from a symptom in under one minute.
- They can identify their KDE or GNOME desktop without knowing those names first.
- They can finish the first-day checklist without a terminal.
- They understand the difference between the disk passphrase, login password, and recovery key.
- They know where the recovery key is stored before moving client work onto the computer.
- They can tell what information a diagnosis sends and what it does not send.
- They know when to stop rather than keep guessing.
- Every linked page exists, uses the current menu labels, and states its applicability.
