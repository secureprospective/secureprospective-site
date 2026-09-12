# SP+ RESUME — everything that must reach the v0.11 release ISO
**Written:** 2026-09-12, mid-session, before a context compaction.
**This is not a session close. The session continues.**

Christopher's instruction for this document, verbatim: *"after compact we will build the new
v0.11 ISO for testing. I believe this will be the one that will release. So to insure that is
the case I need you to take full inventory of everything we worked on such as the additional
security changes, Welcome app fixes, Fin config, and the rest of the little tweaks inbetween.
Dont let anything slip through, this is where we have a full commitment to excellence as the
standard, not a goal."*

**So the organising question of this document is: what is committed but has never been built?**
Section 4 answers it exhaustively. Nothing else in here matters as much.

---

## 1. WHAT WE ARE DOING

Build a v0.11 ISO that Christopher expects to be the release build, then test it. Everything
going into it is already written, gated and committed; none of it has ever been through a build.

- **Repo:** `~/work/secureprospective-advisor-os` on the Beelink, project dir `projects/sp-plus`.
- **Branch:** `session/sp-plus-defense-in-depth`. **Head `1ba0f5d`, tree clean.**
- **Beelink:** `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`.
- **581 commits on this branch** since it left main at `771d96b` (2026-08-15). The branch is
  effectively the whole SP+ project. Do not try to inventory it commit by commit.

### THE LINE THAT MATTERS

**`dd97106` is the commit that built the current v0.11 ISO** ("build(sp-plus): v0.11 ISO, the
first image carrying the persistence guardrail"). The machine `fedora-0.11` is running that
image and reports `SP+ 1 (20260911)`.

**Everything after `dd97106` has never been in an image.** That is 21 commits and 29 files.
Section 4 lists all of it.

### CONSTRAINT — READ BEFORE TOUCHING ANYTHING

Christopher, 2026-09-12, verbatim: *"looks good. Be sure to make it beaufiful... dont touch
beelink... beelink is perfect and the VM is perfect for edit and seeing if it works."*

- **Do NOT build, install, or change configuration on the Beelink.** It stays the git repository
  host and the hypervisor. Reading the repo, committing, `scp`, and `virsh` are fine.
- **The VM is the work surface.** See §5 for exactly how it is currently set up.
- Bee's own `~/.pi/agent/*` is explicitly "perfect" and must not be edited.

---

## 2. AGENTS + HARNESSES

Nothing was dispatched this session. No Bee, no Tom, no subagents. All work was done directly.

---

## 3. GATES — all green, all mutation-tested

Five Fin gates plus the Welcome and posture gates. Every assertion added since `dd97106` has
been shown to fail when the thing it checks is broken.

| Gate | Where it runs | State |
|---|---|---|
| `tests/fin-opening-gate.sh` | checkout + image + VM | PASS |
| `tests/fin-permissions-gate.sh` | checkout + image | PASS |
| `tests/fin-notebook-gate.sh` | checkout + image + VM | PASS |
| `tests/fin-skills-gate.sh` | checkout + image + VM | PASS |
| `tests/fin-session-meter-gate.sh` | checkout + image + VM | PASS |
| `tests/welcome-no-show-gate.sh` | image | PASS (6/6 inside v0.11) |
| theme preview gate (inline, Containerfile) | image | PASS (8 previews) |

**Mutation counts proven red this session:** 5 on the width cap and meter, 5 on the tips, 9 on
the disclaimer and permissions, 4 on the hidden panel rows, 4 on the PII line. Plus the earlier
Welcome mutations recorded in `RESUME-2026-09-11-v011-punch-items.md`.

Run a gate from a checkout: `cd projects/sp-plus && bash tests/<gate>.sh`.
`tests/fin-opening-gate.sh --preview` prints the page instead of testing it.

**Two assertions can only run where the skills are installed** (a built image or the VM), because
the gate sets `SKILLS_INSTALLED=1` only when `/usr/share/sp-plus/fin/skills` exists: "a row cut
from the panel does not appear on it" and "it lists what Fin can do". Both were run and mutated
on the VM. **Do not assume a checkout run exercised them.**

---

## 4. THE FULL RELEASE INVENTORY — 21 commits, 29 files, never built

Oldest first. `git log --reverse --format='%h %s' dd97106..HEAD`.

### 4a. Welcome app fixes (2 commits) — BOTH FOUND ON THE INSTALLED v0.11

**`9951ba1` — do-not-show silenced the menu entry as well as the login launch.**
Christopher's punch item 1. After ticking "do not show this setup again", clicking SP+ Welcome in
the application menu gave a startup cursor and then nothing: no window, no error, no way back into
his own setup app. Cause: the menu entry and the autostart entry were the same command, and
`main()` read the preference before building a window. The preference now applies only to a launch
carrying `--autostart`, which only the login entry passes. The autostart entry is now a **separate
desktop file**, and the build fails if the two are ever made identical again.
Files: `welcome/welcome.py`, new
`welcome/org.secureprospective.spplus.welcome-autostart.desktop`, `tests/welcome-no-show-gate.sh`,
`images/kde/Containerfile`. New marker: `WELCOME_LAUNCH_OK`.

**`4fe0818` — the theme preview gate could not fail, and named two files that do not exist.**
Found by me, not reported. The gate looped over eight hardcoded filenames with a bare `test` in
the loop body; a shell `for` exits with the status of its LAST iteration, so every failure except
the final one was discarded. Measured inside `localhost/sp-plus-kde:v0.11` with
`orchis-light.png` deleted: **the old gate exits 0**. Two of the eight names,
`windows-light.png` and `windows-dark.png`, have not existed since the theme was renamed to
Modern. The list is now derived from `data-preview` attributes in `index.html` instead of repeated
beside it, and every shipped preview must also be referenced by a card.
File: `images/kde/Containerfile` only.

### 4b. Fin — the notebook and its privacy guard (2 commits)

**`1500af7`** `config/fin-extensions/spplus-notebook.ts`, ~18 KB. Gates `write`, `edit` and shell
redirection into `~/Documents/Fin/Notebook`. Refuses email addresses, Social Security numbers,
phone numbers, street addresses, dates of birth, account/policy numbers, and capitalised name
bigrams matched against a first-name set. Stamps frontmatter: `title`, `kind`, `created`,
`updated`, `written_by` — `created` survives a rewrite, `written_by` records the model.
**`9ae3d7e`** the index at `Notebook/README.md` rebuilds itself from every page's frontmatter on
`tool_result`, grouped under plain-language headings, with any title that trips the PII check
replaced by "(title withheld)". Wrapped in try/catch so a fault cannot break a save.

### 4c. Fin — four advisor skills (1 commit)

**`74af0da`** `config/fin-skills/{notebook,voice,email,save-this-session}/SKILL.md`.
`save-this-session` is Bee's `compact-safe`, renamed because "compact-safe" names a context
window. The voice skill names Kolbe A, DISC, CliftonStrengths, Myers-Briggs, Working Genius and
Predictive Index, and carries two hard rules: **"You are not assessing them"**, and the result
shapes tone only and never goes near a recommendation.

### 4d. Fin — the five npm packages, status bar and session meter (1 commit)

**`d96fad8`**. Five `ARG` pins added to the Containerfile and installed in the SAME
`npm install -g --prefix /usr` command as pi:

| Package | Version |
|---|---|
| `pi-web-access` | 0.28.0 |
| `pi-subagents` | 0.67.0 |
| `@destiner/pi-usage` | 0.2.1 |
| `@narumitw/pi-statusline` | 0.50.0 |
| `@narumitw/pi-plan-mode` | 0.58.0 |

Also `rm -f /usr/bin/pi-subagents`, an assertion that exactly one `pi-coding-agent` exists, and
two seeded config files. New markers `FIN_PACKAGES_OK`, `SPPLUS_STATUSLINE_OK`,
`SPPLUS_WEB_FETCH_ONLY_OK`, `FIN_FOOTER_OK`.

### 4e. Fin — the opening page (1 commit, then four more refining it)

**`30c7193`** created it. Then, all on 2026-09-12:

**`cd202fb` — quiet the startup and recompose the page.** Three things were printing under the
opening page that no advisor should see, all found by RUNNING Fin rather than testing it:
pi's own `[Context]/[Skills]/[Prompts]/[Extensions]` dump; `npm: command not found` printed over
the status bar (pi-subagents runs `npm root -g` and the image deliberately ships no npm — the call
is wrapped so subagents still works, only the shell error leaked); and an "Update Available"
banner naming `pi update`, a command that cannot work on a read-only `/usr`.
Fixes: `quietStartup: true` seeded at `/etc/skel/.pi/agent/settings.json` (new file), and
`export PI_OFFLINE=1` in the launcher **before the `--ask` branch**, because Welcome displays that
stdout and a stray shell error would land inside an advisor's answer.
Also: the launcher no longer prints "Fin is not connected to a provider yet" before pi starts;
the panel carries it on its Connected row. The page stops growing at 98 columns. Skills fall into
two columns when there is room. The room meter fills with what is LEFT. Blurbs moved off the
faintest theme colour. Meter glyphs changed from `▰▱` to `█░` (U+25B0 draws as a hairline in both
Konsole's and kitty's default font). Status icons: `⏱` → `🕒` (U+23F1 defaults to TEXT
presentation and drew as a hollow circle) and the three-person ZWJ sequence → `👥`.

**`ef7caa5` — thinking level in the bar, rotating tips.** `thinking` added to the statusline
segments with a `🧠 ` prefix; the palette already had colours for it. The tips became 19 (now 23)
two-part entries: something to DO and what it BUYS. Rotation steps in order, place kept in
`~/.pi/agent/fin-tip.json`.

**`6c19ca1` — the disclaimer, more command tips, plain-language permissions.** Four more command
tips (12 of 23 now name a command). The disclaimer, between two solid rules. Three guardrail
labels reworded off jargon. A new "Asking permission" section in `config/fin-system-prompt.md`.

**`d827a16` — trim the panel.** Printing, Writing and Saving removed from "what I can do" at
Christopher's instruction, leaving Design, Your style, Memory. The skills are NOT removed: printer,
email and save-this-session are installed and work; they are only off that list, and all three are
carried by the tips. Their blurbs stay in the table so a row brought back cannot return under its
directory name. Disclaimer shortened from four sentences to three.

**`1ba0f5d` — the PII line.** "NEVER share PII with Fin." as its own sentence, shouting. I KEPT
"in ways that cannot be undone" rather than replacing it, because it is the only place the page
says Fin can do permanent damage and "at your own risk" is empty without it. **Christopher was
told this and has not objected, but he asked for a replacement and got an addition. If he
objects, cut the permanence clause, not the PII line.**

### 4f. Documents (4 commits) — these do NOT ship in the image

`0113bb7` the public account of SP+ (`docs/PUBLIC-INSIDE-SP-PLUS.html`, 765 lines);
`b4a4dc3` the comparison the advisor is actually making; `a689086` the password-manager claim was
false in three places; `1116c3b` the promise was wrong, not the product
(`docs/01-PRODUCT-DEFINITION.md`, 1 line).

### 4g. Ledger resumes (5 commits)

`b50f76d`, `5feadbc`, `1c9f2e3`, `e011329`, `c415b02`. Prior-session resumes, all in
`docs/ledger/`. Do not delete; they carry the refuted hypotheses.

### 4h. EVERY NEW BUILD-TIME ASSERTION — watch for these seven echoes

A build that does not print all seven has silently skipped something.

```
FIN_NOTEBOOK_OK          FIN_SKILLS_OK        FIN_PACKAGES_OK
FIN_FOOTER_OK            FIN_OPENING_OK       FIN_QUIET_STARTUP_OK
WELCOME_LAUNCH_OK
```

Plus the two pre-existing inline config assertions (`SPPLUS_STATUSLINE_OK`,
`SPPLUS_WEB_FETCH_ONLY_OK`) and the rewritten theme preview gate.

**New COPY lines to verify landed:**
```
tests/fin-notebook-gate.sh        -> /usr/libexec/sp-plus/fin-notebook-gate
tests/fin-skills-gate.sh          -> /usr/libexec/sp-plus/fin-skills-gate
tests/fin-session-meter-gate.sh   -> /usr/libexec/sp-plus/fin-session-meter-gate
tests/fin-opening-gate.sh         -> /usr/libexec/sp-plus/fin-opening-gate
config/fin-pi-config/pi-statusline.json -> /etc/skel/.pi/agent/pi-statusline.json
config/fin-pi-config/web-search.json    -> /etc/skel/.pi/web-search.json
config/fin-pi-config/settings.json      -> /etc/skel/.pi/agent/settings.json
welcome/org.secureprospective.spplus.welcome-autostart.desktop
```

⚠️ **`tests/fin-permissions-gate.sh` has NO COPY line.** It runs in the checkout only. It was
extended this session with the plain-language assertions. Decide before the build whether it
should ship like the other four; the other four do.

### 4i. SECURITY WORK — already in the built v0.11, NOT new

Christopher named "additional security changes" in his instruction. **Checked: the Tier 1 and
Tier 2 defense-in-depth work is all BEFORE `dd97106` and is already in the image running on
`fedora-0.11`.** T2.2 Flathub verified subset, T2.3 DNS over TLS, T2.4 kernel hardening kargs,
T2.5 glibc tcache policy, T2.6 login and password policy, T2.7 MAC policy, Phase 0 Secure Boot
lane, Phase S image signature verification, the persistence guardrail. Nothing from that body of
work is waiting on this build. The only security-adjacent change after the line is the guardrail
label rewording in `6c19ca1`, which changed words and not one rule.

---

## 5. IN-FLIGHT STATE — the VM, and what a reboot destroys

**`fedora-0.11` is running and is Christopher's.** It is the SP+ desktop VM, `SP+ 1 (20260911)`.

| Thing | State | Survives a guest reboot? |
|---|---|---|
| Fin preview install under `/usr` | present, on a `bootc usr-overlay` | **NO — wiped by design** |
| SSH port forward `127.0.0.1:2223` → guest 22 | live | yes (guest reboot); **no** if the VM process restarts |
| `sshd` in the guest | enabled + running | yes |
| Claude's key in `alpha`'s `authorized_keys` | present | yes |
| `~/Documents/Fin/Notebook/voice.md` (test seed) | present | yes |
| `~/.pi/agent/fin-tip.json` (rotation state) | present | yes |
| `~/.pi/agent/settings.json` with `quietStartup` | present | yes |
| `~/.pi/agent/pi-statusline.json` (new version) | present | yes |
| a `kitty` window titled Fin | open | no |

### How to reach the VM

```bash
# from CT105, via the Beelink:
ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'bash /tmp/vm.sh "<command>"'
# /tmp/vm.sh is: ssh -i /tmp/finvm ... -p 2223 alpha@127.0.0.1 "$@"
```

**If port 2223 is gone** (the VM process restarted), re-add it live without touching the domain
XML — `fedora-0.11` uses plain SLIRP user networking, so this works on a running domain:
```bash
virsh -c qemu:///session qemu-monitor-command --hmp fedora-0.11 \
  'hostfwd_add tcp:127.0.0.1:2223-10.0.2.15:22'
```

**If the preview install is gone** (guest rebooted), restore it in about a minute:
```bash
ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'bash /tmp/vm.sh "bash -s" < /tmp/reinstall.sh'
```
That script re-runs `bootc usr-overlay`, unpacks `/tmp/npmroot.tgz` into `/usr`, copies the
extensions, skills, gates and launcher, and seeds the pi config. **It depends on
`/tmp/npmroot.tgz` and `/tmp/finpkg.tgz` on the VM and on the Beelink. Beelink `/tmp` is a 16 GB
tmpfs and is lost if the Beelink reboots.** `npmroot.tgz` is regenerable on CT105 with one
`npm install -g --prefix <dir>` of the six pinned packages (~20 s); `finpkg.tgz` is regenerable
from the repo.

**Nothing is running that anyone must come back to.** No dispatches, no builds, no background
jobs. The two `claude` processes on the Beelink are Christopher's own and were not touched.

### Evidence kept
- `~/logs/sp-plus/v011-fin-polish/` on the Beelink — 9 screenshots, 3.7 MB, the visual record of
  every iteration of the opening page.
- CT105 scratchpad holds the same 9 plus the earlier session's shots.

---

## 6. FACTS ESTABLISHED — DO NOT RETEST

These cost real time. Every one was measured.

1. **An extension loaded by absolute path resolves `@earendil-works/*` imports.** pi resolves its
   own packages, not the file's directory. `pi --help` loads extensions and calls no model, so it
   is a free probe. **All eleven Fin extensions load together with rc=0 and zero bytes on stderr**
   — measured on the VM this session, the first time this was ever proven under the real agent.
2. **Vendoring the five packages makes the image SMALLER.** pi alone in a global prefix is 88 MB;
   pi plus the five in the SAME `npm install -g` is 61 MB, because npm hoists shared dependencies.
   A separate prefix costs an extra 108 MB. **Do not "optimise" by splitting the install.**
3. **`pi-subagents` pulls `pi-coding-agent` through a caret range** and alone resolves to a NEWER
   pi. Installing in one command with the pinned pi resolves it to the pinned copy. Verified on
   the VM: exactly one `pi-coding-agent`, version 0.85.0.
4. **pi-statusline reads `getAgentDir()/pi-statusline.json`**, i.e. `~/.pi/agent/`.
   **pi-web-access reads `~/.pi/web-search.json`** (NOT `~/.pi/agent/`).
   An unrecognised key in either file is ignored SILENTLY, so the only proof a change took is a
   clean load: `PI_CODING_AGENT_DIR=/tmp/x pi --extension <ext> --help`, rc=0, empty stderr.
5. **`quietStartup: true`** removes pi's `[Context]/[Skills]/[Prompts]/[Extensions]` block.
   **`PI_OFFLINE=1`** removes BOTH the npm error and the "Update Available" banner. Separated by
   experiment: quietStartup alone leaves both; offline alone leaves the block.
6. **Skills are NOT slash commands.** The agent loads them on demand. Telling an advisor to type
   `/save-this-session` sends them to an error. The real commands are: `/login /model /thinking
   /new /resume /export /copy /compact /plan /hotkeys /settings /quit` plus `/statusline`,
   `/council`, `/parallel-review`, `/review-loop`, `/subagents-fleet`, `/tree`.
7. **Node 22 strips TypeScript types natively**, so gates import the real `.ts` extensions with no
   build step.
8. **The brand palette cannot be applied literally to the opening page.** It is specified for a
   LIGHT ground; the page sits on whatever the terminal is. The page takes text colour from pi's
   theme and carries the brand through the shoal and the gold wordmark only. The STATUS BAR is the
   opposite case and does use the palette literally, because each segment sets its own background.
   **Christopher was told and did not object.**
9. **A line-based `grep` cannot see a phrase split by prose wrapping.** Keep any phrase a gate
   greps for on one source line, and reflow wrapped text before matching.
10. **Changing the resolution in the VM's Display Configuration wedges the virtual GPU.** QEMU
    loses the buffers the guest still points at and every draw is rejected with
    `virtio_gpu_dequeue_ctrl_func *ERROR* response 0x1203`. The desktop is fine; only the picture
    is gone. A fresh compositor gets the same rejection, so restarting the display manager does
    NOT help. **Only restarting the VM rebuilds the device.** This is a virtual-graphics problem
    and will not affect advisors on real laptops — do not let it read as an SP+ defect.
11. **"Thinking level: low" appearing under the panel is a person pressing the thinking hotkey**,
    not a startup artifact. A clean capture with nobody at the keyboard shows zero occurrences.
12. **The old theme preview gate could not fail** (shell `for` returns its last iteration's
    status) and named two files that have not existed since the Modern rename. Measured, fixed,
    mutation-tested. See §4a.
13. **Bee's skills do not transfer to Fin.** Reviewed and settled; do not re-survey.

---

## 7. DECISIONS

Christopher's, this session and carried:

- **Palette: Shorts** — INK `#12325B`, BODY `#3A4048`, GROUND `#EEF0F3`, ACCENT `#F5C542`.
  Yellow is an accent only, never type.
- **Web access: fetch only, no search.** Advisors have no search-provider key.
- **Opening page below the fish**, plain language throughout, suggestions on the page with the
  voice interview in the cycle.
- **Notebook:** markdown, advisor-facing, indexed, timestamped, records which model wrote each
  page, and refuses names and PII.
- **Cut Printing, Writing and Saving from the panel** (2026-09-12).
- **Disclaimer** below the tips between two solid lines, with the PII warning.
- **Do not touch the Beelink. Use the VM. Make it beautiful.**
- Standing: never `git --no-verify`; no work on main; Beelink `sudo` permits podman only;
  `spplus-test` and `SP-Alpha-Rig` are the domains available for destructive work; signature
  enforcement must NOT be proven on `fedora-0.11`; **D44 nothing may break day one**;
  **D15 no compliance claims on any surface**; live deploys need his approval for that deploy;
  publish only via `scripts/publish-image.sh`.

---

## 8. LEDGER STATE

Tree clean. Head `1ba0f5d`. Every commit passed its hooks. Nothing written but uncommitted.

**Not yet written: a ledger entry describing the Fin polish as a whole.** Deliberate — it should
be written after the build proves the Containerfile assertions, so it records what shipped rather
than what was intended.

---

## 9. NEXT ACTIONS, IN ORDER

1. **Decide whether `tests/fin-permissions-gate.sh` ships.** It is the only Fin gate with no COPY
   line into `/usr/libexec/sp-plus/`. One line in the Containerfile if yes. See §4h.
2. **Ask Christopher where to build.** The Beelink is off limits for building. Verified
   2026-09-12 at compaction: `fedora-0.11` RUNNING (his, the work surface), `spplus-test` SHUT
   OFF, `SP-Alpha-Rig` SHUT OFF. `spplus-test` is the designated disposable SP+ domain; I started
   it briefly this session and it is shut off again, and nothing was ever installed on it.
   Confirm the chosen VM has podman, enough disk and network before starting a build.
3. **Build the ISO**, capturing the full log. **Watch for all seven new echoes in §4h.** A build
   that does not print all seven has skipped something.
4. **Run every gate inside the built image**, not just at build time: the five Fin gates, the
   Welcome no-show gate, the theme preview gate, and the 80-assertion posture gate.
5. **Boot the ISO and look at Fin on screen.** The panel has only ever been seen on the VM's
   transient overlay, never in a real image.
6. **Put the ISO in the Beelink's `~/Downloads` as `SP-PLUS-cycle<N>.iso`.**
7. **Write the ledger entry** describing what shipped.
8. **Publish v0.11** via `scripts/publish-image.sh`, per the standing order. Note `:latest` was
   five hours BEHIND the tested build as of the inspection resume.

### Carried forward, still open, none of them blocking the build

- **Punch item 2, the theme spinner — STILL OPEN and Christopher cares most about it.** His
  report: *"On the 'Choose your look', when a look is selected, the loading circle never quits
  even when the theme is completly loaded."* I could not reproduce it. Measured on `fedora-0.11`:
  apply completed in 8 s and read APPLIED; the machine's own `theme-events.jsonl` showed
  `click_receipt = 0` before my test, meaning **no theme click from Welcome had ever reached the
  shell on that VM**. The 12:34 apply came from `/usr/libexec/spplus-first-login`, not Welcome.
  **The unanswered question: was the stuck circle on the Dell rather than the VM? If the VM,
  which look, and was the circle on the Apply button or elsewhere?** He said previously *"I tested
  this on the Dell"*, so the Dell is live. Full detail in
  `docs/ledger/RESUME-2026-09-11-v011-punch-items.md` §5.
- **The disk recovery key ruling.** Promised in FOUR places
  (`docs/01-PRODUCT-DEFINITION.md` day-one job 2, `docs/SP_PLUS_LANDING_CONTENT.md:88, :202,
  :246`) and **does not exist**: keyslot 0 only, nothing generates, displays or stores one.
  Option A build it, Option B strike it from all four. **Recommended A. Awaiting his call.**
  This is a release-blocking honesty problem if the ISO ships with the copy intact.
- **Audit the other eight day-one jobs against the shipped image.** Jobs 2 and 6 are the only two
  ever checked and BOTH diverged. A demonstrated pattern, not a worry.
- **Run the 80-assertion posture gate against a QA-kickstart install** that permits SSH. Never run
  against a real install.
- **Signature enforcement**: `--enforce-container-sigpolicy` in `installer/bootc-wrapper.sh`,
  prove both directions on `spplus-test` (**NOT** `fedora-0.11`), assertion mutation-tested red.
  Never before a machine has booted a signed image.
- **More Welcome punch items.** He said *"start with the Welcome app 1st"* and then moved to Fin.
  Ask whether he has more before calling the ISO final.

---

## 10. RELAY / ENVIRONMENT NOTES

- Beelink: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`. **Repo, virsh and scp only.**
- **Never nest heredocs over ssh** — two hops, zero work, exit 0. Write the script locally,
  `scp` it, run it. Used throughout this session and it works.
- Editing repo files: write locally in the scratchpad, `scp` into place, patch with a python
  script that ASSERTS its anchor. That assertion caught several wrong-anchor bugs this session.
- Commit with a message file: write locally, `scp` to `/tmp/msg.txt`, `git commit -F`.
- Beelink `/tmp` is a 16 GB tmpfs. Everything the VM restore needs lives there.
- The VM clock on `fedora-0.11` runs about five hours behind UTC.
- Typed console commands into a VM lose keystrokes past ~100 characters. Use SSH.
- Commands Christopher must run himself go in `/root/paste.md`, then:
  `scp -i /root/.ssh/beelink /root/paste.md chris@192.168.1.190:/home/chris/Downloads/paste.md`.
  A stop hook enforces this; do not paste commands into chat.
- CT105 has npm and node 22; the SP+ image deliberately has **no npm**, which is why the package
  tree is built on CT105 and shipped as a tarball.

---

## 11. HONEST STATUS

**What is genuinely proven.** Every file listed in §4 exists, is committed, and its gate passes
and has been shown to fail when broken. All eleven extensions load under the real agent on a real
SP+ machine with rc=0 and empty stderr. The opening page, the status bar with the thinking level,
the rotating tips and the disclaimer have all been READ ON SCREEN in the advisor's own terminal,
not through a harness. Both Welcome fixes were verified inside `localhost/sp-plus-kde:v0.11`.

**What is NOT proven and must not be described as working.**

- **No image has ever been built with any of this in it.** All seven new Containerfile assertions
  are untested. `bash -n` passes on the RUN block, which only proves it parses.
- The Fin work has only ever run from a **transient `/usr` overlay** on one VM. The shipping paths
  are the same, but that is an argument, not a measurement.
- The notebook privacy guard has never blocked a real model, only synthetic tool-call events.
- The voice interview, the email skill and the session note have never been run by anybody.
- `tests/fin-permissions-gate.sh` has never run inside an image, because it does not ship.
- The theme spinner Christopher reported is **unreproduced and unexplained**. Building an ISO does
  not close it.
- The recovery key the product promises in four places **still does not exist**.

**ETA:** unknowable until the build surface is chosen, which is NEXT ACTION 2.

**The honest summary for a release candidate:** the code is ready and well gated; the build is
untested; and two things Christopher already knows about — the theme spinner and the recovery key
— are open and neither is fixed by building.
