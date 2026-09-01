# SP+ advisor manual — the plan for a complete instruction set

Written 2026-08-31. Christopher: "We need to be able to supply our users with the
complete set of instructions. Again, we can learn from this manual, SP+ is not the
same thing, but we need to learn from it." The manual in question is
https://omarchy.org/manual/.

## What we learned from Omarchy, and what we deliberately did not take

Omarchy documents its system in 51 numbered sections, on a website, in the
author's informal first person, for a reader who chose Arch and Hyprland and
enjoys the machine.

**Taken:** the *completeness*. Omarchy documents the whole surface of the system,
including the unglamorous parts -- filling in PDFs, monitors, sleep, fonts, dual
boot. A reader never reaches the edge of what is written down. Also taken: putting
migration anxiety near the front as its own destination ("Coming From Mac or
Windows" is section 3), and having troubleshooting be a named place rather than
scattered.

**Not taken:** the voice, the breadth, or the delivery. Informal first person and
philosophical asides build rapport with an enthusiast and read as unserious to
someone deciding whether to trust a machine with client files. 51 sections would
bury our reader. And Omarchy's manual is a website; SP+ keeps help *in the app,
offline, with no browser window*, which for a frightened user is an advantage over
Omarchy rather than a limitation. It stays that way.

## The gap, measured

The corpus today is 17 articles in 6 categories, 46,536 characters. Eighteen
topics an advisor plainly needs were tested against it. **Nine are absent
entirely, and of the nine that register a keyword hit, not one has a dedicated
article** -- every hit is a passing mention inside an article about something
else.

The most serious instance: `knowledge/advisor-help/welcome.md` tells the advisor
"there is a built-in way back if anything ever misbehaves." The concept appears
exactly once in the whole corpus, in that sentence. It is a promise with no page
behind it, which is the same failure class as a button that does nothing.

## The target structure

Existing articles are marked KEEP. Articles that exist but are filed where a
frightened user will not look are marked MOVE. Everything else is new.

### 1. Start here
- What this computer is — KEEP
- **Coming from Windows** — NEW. The single most anxious reader is a Windows
  advisor on day one and they currently have no door with their name on it.
- Finding your way around — KEEP
- **Your first day: what Welcome set up for you** — NEW

### 2. Your files
- **Where your files live** — NEW
- **The file portal** — NEW. cloud.secureprospective.com. Shipped, undocumented.
- **Private and Shared: the rule that stops misfiling** — NEW. This distinction is
  taught on the Welcome services screen and appears nowhere in the manual.
- **USB drives and external storage** — NEW
- **Backups: what is protected, and what is not** — NEW

### 3. Everyday work
- LibreOffice: your Word and Excel — KEEP
- Browser and passwords — KEEP
- Printing — KEEP
- **Scanning documents** — NEW
- **PDFs: reading, filling in, signing** — NEW
- **Email** — NEW. Thunderbird ships and is undocumented.
- **Video calls, camera and microphone** — NEW. Advisors run client calls.
- **Scheduling social posts** — NEW. social.secureprospective.com.
- **Installing software safely** — NEW. The Software Library screen exists and has
  no page behind it.
- **Keyboard shortcuts** — NEW

### 4. Fix a problem
- Wi-Fi won't connect — KEEP
- Printer not printing — MOVE from Everyday work
- No sound — MOVE from Everyday work
- Second monitor problems — MOVE from Everyday work
- Bluetooth devices — MOVE from Everyday work
- Computer asks for a recovery key — KEEP
- **Something broke after an update: going back** — NEW. This is the page the
  welcome article already promises.

The four MOVEs matter. Wi-Fi, printing, sound, monitors and Bluetooth are read
only while something is broken. A person whose printer just died is not browsing
"Everyday work".

### 5. Safety and privacy
- What leaves this computer — KEEP
- Your encryption and recovery key — KEEP
- Screen lock and privacy — KEEP
- **If this computer is lost or stolen** — NEW. Encrypted machine, client data,
  and no page telling them what to do in the hour it matters.
- **When someone else uses this computer** — NEW

### 6. Upkeep
- Updates and restarts — KEEP
- **Changing how it looks** — NEW
- **Getting a new computer** — NEW

### 7. Get more help
- Fin the assistant — KEEP
- Getting more help — KEEP
- Security Evidence Report — KEEP

17 articles become roughly 34.

## The rule that governs the writing

**Every claim must be verified against the built image or a running SP+ machine
before it is written down.** Documenting a capability SP+ does not have is worse
than leaving a gap: a gap is a missing page, but a false instruction sends a
nervous advisor to a control that is not there and proves the product cannot be
trusted. Where something is genuinely not supported, the honest page says so.

Voice follows the existing corpus and Christopher's warmth direction: a thoughtful
colleague explaining something to someone who is nervous and does not want to look
foolish. Plain words, short sentences, the reason as well as the instruction. No
cheerfulness, no marketing voice, no shortcuts.
