# SP+ — HEADBRAIN ROLE HANDOFF TO TOM
**Written 2026-08-26 ~16:30 CDT by Claude (ClaudeBox CT105) · for Tom (Claude Code, Opus, on the Beelink)**

Christopher is presenting SP+ to someone important. He is working through tonight into
tomorrow. **CT105 Headbrain is about to lose its weekly compute window. You are Headbrain now.**

Read this file completely before you touch anything. Then read
`~/sp-plus-bee/RUNBOOK.md`. Those two files are the whole job.

---

## 0. WHAT YOU ARE INHERITING, IN ONE PARAGRAPH

SP+ is a Fedora-Kinoite-44 **bootc / image-mode** Linux distribution for financial
advisors. It builds. It boots. Its graphical installer works and installs onto
Dell-like SATA hardware automatically with full-disk LUKS2 encryption. **It is not yet
deliverable, because an advisor cannot actually use the installed machine.** Two
defects stand in the way, DN-16 and DN-15. DN-16 has a fix built and under test right
now. DN-15 has no fix and nobody has started it. Your job tonight is to close both and
produce an ISO Christopher can show.

---

## 1. THE MACHINES

| Where | What |
|---|---|
| **Beelink `192.168.1.190`** | You run here. Also Christopher's **daily driver** — keep RAM and disk tidy. Repo at `~/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`, **local only, no remote**. |
| **CT105 `192.168.1.105`** | The old Headbrain. Going quiet. Nothing you need lives only there. |
| **Dell `192.168.1.201`** | HW-00, the target hardware. `ssh -i ~/.ssh/laptop-sweep trader@192.168.1.201`. **FREE TO WIPE** (explicit authorization). 2014 Inspiron 5737, UEFI+GPT, Secure Boot present but DISABLED, **NO TPM**, i5-4200U, 7.6 GB RAM, 931 GB **mechanical SATA** HDD → presents `sda`. |

`/tmp` on the Beelink is a **16 GB tmpfs**. Never copy a repo into it.
A VM named `chris` belongs to Christopher. **Never kill it.**

---

## 2. THE TWO DEFECTS — THIS IS THE WHOLE PROJECT RIGHT NOW

### DN-16 — `/etc` is `unlabeled_t`, so EVERY login fails under SELinux Enforcing

This is the login loop Christopher hit by hand. **His password was always correct.**
Anaconda writes `/etc` while the installer itself runs with `selinux=0` (DN-09), so the
files never receive a security context. Real kernel AVCs at `permissive=0` from cycle6:

```
plasmalogin denied read on /etc/nsswitch.conf and /etc/passwd
local_login  denied /etc/nsswitch.conf
getty        denied /etc/localtime
firewalld    denied /etc/nsswitch.conf
all with tcontext=system_u:object_r:unlabeled_t:s0
```

Matches upstream bootc **#1438** and **#1690**.

**The fix (commit `44f14bb`, shipped in ISO `6a593d70…`):** `%post` runs
`spplus_relabel_targets()` — `setfiles -F` over `/etc` and `/var` using the *target*
policy at `/etc/selinux/targeted/contexts/files/file_contexts`, then **verifies** that
`nsswitch.conf`, `passwd`, `shadow` and `localtime` are no longer unlabeled, writing a
durable failure to `/var/lib/spplus/%post-failed` if not.

**STATUS: BUILT, INSTALLED ONTO cycle7, NEVER YET OBSERVED WORKING.** Closing this is
your first task.

### DN-15 — the LUKS passphrase prompt is INVISIBLE on the local screen

`fbcon: Deferring console take-over`. The prompt goes somewhere the physical screen
never shows. `systemd-cryptsetup` waits forever → `cryptsetup.target` never completes →
`sysinit.target` is held → nothing starts. **To Christopher, and to anyone he shows
this to, the laptop looks dead.**

**STATUS: UNFIXED. NOT STARTED.** Almost certainly a plymouth / fbcon console-handoff
issue. This blocks the Dell independently of DN-16 — you can close DN-16 completely and
still have an unusable machine. **Do not let this one sit until the last hour.**

---

## 3. LIVE STATE AS OF THIS WRITING

- **T-13 ISO built and on disk:** sha256
  `6a593d7082614e561dd5ce8ea8f13b22acf331497f348e6b6172a9200f2aa0db`,
  4,135,002,112 bytes, 2026-08-26 16:04. Supersedes b04 `afc0f9c7…`.
- **cycle7 install: SUCCEEDED, fully automated.** 8,339,324,928 bytes, plateaued at
  420 s, final screen stddev 9068 (a real UI, not a grey screen). Disk at
  `~/sp-plus-iso/cycle7/disk.qcow2`.
- **cycle7 boot: FAILED TO INSTRUMENT.** `spb-boot` reported
  `LUKS_PROMPT_ON_SERIAL=no`, `bserial.log` only 258 bytes. **See §5 — this is a bug in
  my script, not in SP+.** The AVC count of 0 from that log is MEANINGLESS; the log
  captured nothing past GRUB.
- `~/sp-plus-iso/cycle6/` — the disk and `bserial.log` that PROVE DN-15 and DN-16.
  **Do not delete.** `reap.sh` holds disks younger than 12 h; that window will expire
  tonight, so if you still need cycle6, touch it or copy it aside.

---

## 4. YOUR TOOLS — `~/sp-plus-bee/`

The whole test lane runs **as `chris`, with no root**. Root lives *inside* the guest and
you reach it over the serial console. If you find yourself reaching for `sudo`, you are
on the wrong path.

```bash
cd ~/sp-plus-bee
export CYCLE=cycle8            # a NEW name each run; never reuse a cycle dir
./spb-sha                      # what ISO is on disk + known shas
./spb-build                    # rebuild, ~15 min, detached (the ONE privileged step)
./spb-install                  # fresh SATA VM + drives Anaconda, ~12 min. WORKS.
./spb-boot ["extra kargs"]     # serial boot + LUKS unlock. SEE §5 — NEEDS A FIX.
./spb-shell '<cmd>'            # run a command as root inside the booted guest
./spb-evidence                 # every avc: line, failed units, in-guest label state
```

Mirrored into the repo at `projects/sp-plus/tests/bee-lane/`.
Gates at `~/sp-plus-gates/`: `preflight-gate.sh` (runs inside the build, 10 checks),
`release-gate.sh` (**exit 0 is the only verdict that counts**), `reap.sh`.

---

## 5. THE FIRST THING YOU MUST FIX — `spb-boot` MISSES THE GRUB WINDOW

I wrote `spb-boot` an hour ago and it has a real bug. It sleeps ~6 s setting up socat,
then sends 60 `end` keys at 0.4 s apart to halt the GRUB countdown. **The countdown is
1 second and has already expired** — the log shows
`The highlighted entry will be executed automatically in 0s` followed immediately by
`Booting …`. So `console=ttyS0` was never appended, and the serial log went silent
after GRUB. That is why cycle7's boot produced 258 bytes.

**Fix it before you trust any boot result.** Options, cheapest first:
1. Start hammering `end` **immediately** after the QEMU launch, before the socat setup,
   and drop `KEYDELAY` to ~0.05.
2. Better: raise the GRUB timeout in the image so the window is not a race at all.
3. Or copy the proven approach from `~/sp-plus-iso/sboot.sh`, which drives a
   `system_reset` first so the countdown start is known.

`sboot.sh` and `gboot.sh` in `~/sp-plus-iso/` are the versions that actually worked on
cycle6 — they are hardcoded to `cycle6` but they are correct. Steal from them.

**GRUB editor facts, learned the hard way:** `end` alone selects *UEFI Firmware
Settings* — you must press `home` to get the first entry. Pressing Enter inside the
editor **splits the linux line**, which is why `vmtype-noret.sh` exists (it is
`vmtype.sh` with the trailing Enter removed). `grubby` **does not exist** in a bootc
image (DN-12); boot entries are edited as BLS files under `/boot/loader/entries/*.conf`.

---

## 6. DO NOT RETEST — ALREADY REFUTED

Every one of these was tested and disproved today. Re-running any of them costs hours
you do not have.

1. **"SELinux Enforcing deadlocks the boot."** FALSE. This was my own wrong conclusion
   (recorded as DN-14, since corrected). It came from a single-variable A/B where the
   harness typed the LUKS passphrase on a timer and it landed differently between runs.
   With a serial console the system **boots to a login prompt under Enforcing**.
2. The first-boot password unit causes the hang. Masking it → byte-identical hang.
3. The system asks for the LUKS passphrase twice. It does not.
4. **"`/etc` is fully labeled"** — a `find`/`ls -Z` survey reported 4820 files, 0
   unlabeled. **The survey was wrong.** `ls -Z` prints in columns so `?` is not at line
   start. **The kernel AVC log is the authority, never a filesystem survey.**
5. Fedora 44 removed local graphical installs. FALSE.
6. A missing RPM caused the grey installer screen. FALSE — the cause was
   `TMPDIR=/mnt/sysimage/boot`.
7. `/.autorelabel` is the fix. It is not — the ostree root is read-only (bootc #1087).
8. `chcon` in the Containerfile. OCI layers do not carry `security.selinux` xattrs.

**GOTCHA THAT WILL FOOL YOU:** SELinux **`dontaudit`** rules silently suppress denials.
A clean `grep avc:` proves **nothing** until you have run `semodule -DB` in the guest.

---

## 7. VERIFICATION DOCTRINE — THIS IS THE ROLE, NOT A FORMALITY

I got two conclusions wrong today and had to retract both in front of Christopher. Both
came from trusting a signal instead of an artifact. Inherit the scars:

- **The artifact is the evidence, never the exit code.** A build that exits 0 proves
  nothing; check the file and its size. An install that "succeeded" with a 1 MB disk
  installed nothing.
- **An implausible number beats green output.** Check the *size* of a result.
- **An open port is NOT a listening service.** QEMU slirp accepts the TCP connect
  whether or not anything listens. Prove sshd with a **banner grab**:
  `timeout 8 bash -c 'exec 3<>/dev/tcp/127.0.0.1/2299; head -c 40 <&3'`
- **`pkill -f <pattern>` and `ps | grep <pattern>` match your own shell** when the
  pattern appears in your own command line. This killed my ssh session **twice** today,
  the second time an hour after I wrote the lesson down. Kill from a **pidfile**, or
  match on `comm`.
- **Never report a hypothesis as a conclusion.** Say what you observed and what you
  infer, separately.
- The build log line `Failed to create directory or subvolume "/usr/local/sbin":
  Read-only file system` is **non-fatal**. Do not chase it.

---

## 8. CHRISTOPHER'S STANDING RULINGS — DO NOT RELITIGATE

- **D36 — partitioning is fully automatic and always encrypted.** His words: *"no. IF an
  advisor wants something else, they can build it themselves, or pay me to build a
  custom setup. The intent for this is lowest bar for entry."* The LUKS passphrase is
  the **only** storage input an advisor gives.
- **DN-13 — SP+ ships NO default account password, ever.** The advisor account ships
  **LOCKED** and the advisor sets their own password at first boot.
- **No secrets in the image, ever** — not in a layer, a Containerfile, a build arg, or
  git history. **The ISO must never contain the encryption secret.**
- `spplus-test` is a **disposable test-only** LUKS/root passphrase for throwaway VMs. It
  may appear in run logs. It must **never** appear in the ISO, the repo, or committed
  config.
- **No work on main, ever.** Work on `session/sp-plus-plan`. **Never use
  `git --no-verify`, under any circumstances.**
- **A passing build is not a working feature.** Nothing is done until Christopher has
  used it in the real environment. That gate is the most commonly skipped one.
- **Cleanup is part of the loop**, not a policy debate: *"If we will not be coming back
  to said process or file, it must be cleaned up. The token burn is worth the prevention
  of slop."* Keep RAM and disk tidy on his daily driver. But **never delete a disk or
  log that an open defect's evidence was drawn from.**

---

## 9. HOW TO WORK WITH CHRISTOPHER

- **Lead with the outcome.** First sentence is the conclusion or what just happened.
- **Act, don't over-plan.** When you have enough to move, move — give a recommendation
  and the exact first step, not a menu. *Unless* he is in plan mode, which is a
  deliberate signal to slow down and align first.
- **Confirm between steps.** Observe each step's real output before starting the next.
  Assumed success is where drift enters.
- **Push back on faulty premises**: flaw → risk → fix. Do not confidently elaborate a
  wrong answer faster.
- **No em-dashes in prose he will read.** Full bash output, not summaries, when he asks
  what happened.
- When he must run something you cannot reach, write exact commands to `/root/paste.md`
  — plain commands and `#` comments only, one batch, overwrite, header naming the target
  machine, **never real secrets**.
- Under 85% confidence, ask him. But foresee the issue rather than reporting it after.

---

## 10. YOUR PLAN TONIGHT, IN ORDER

1. **Fix `spb-boot`'s GRUB timing (§5).** Nothing downstream is trustworthy until the
   serial console reliably attaches. Prove it by seeing >50 KB in `bserial.log`.
2. **Boot cycle7 and settle DN-16.** Run `semodule -DB` first so `dontaudit` cannot hide
   anything, then `./spb-evidence`. You need: **zero `avc: denied`**, real contexts on
   `/etc/passwd` and `/etc/nsswitch.conf`, and **an actual successful login**. A login
   that works is the only proof that matters; label output alone is not.
3. **Then attack DN-15** — make the passphrase prompt visible on the local VGA console.
   Research first, guess second: plymouth's console handoff, `plymouth.enable=0`,
   `rd.plymouth=0`, and the `fbcon` deferred take-over are the places to look. Test with
   `spb-boot` and a **screendump** (stddev ~0–170 = grey/black, 5,000–15,000 = real UI),
   because the whole point is what a human eye sees.
4. **Rebuild, then run the full loop clean** on the resulting ISO: preflight gate →
   install → boot → `release-gate.sh` **exit 0**.
5. **Only then** the Dell (HW-00) — and Christopher does the graphical install himself.
   That is his rule and it is the real acceptance test.
6. Record what you learn in `projects/sp-plus/docs/ledger/` (`DO-NOT.md`, `TODO.md`,
   `OPERATIONS.md`) and **commit as you go**. Incremental commits are mandatory; you can
   hit a hard compute wall with no warning, exactly as I am about to.

---

## 11. THE HONEST STATE

Two mile markers are genuinely done: the graphical installer works, and the SATA/`sda`
rehearsal for the Dell passes. Those were the two biggest unknowns and they are closed.

**But there is no deliverable ISO yet, and Christopher has a presentation.** DN-16's fix
looks right, was negative-tested at the preflight gate, and has *never been observed
working on a running system*. That is precisely the shape of evidence that misled me
twice today. DN-15 has no fix at all.

Believe nothing until `release-gate.sh` exits 0 against a live installed system with
zero AVC denials and a login you actually completed.

**The biggest process lesson of the day (OP-22):** most of today was burned A/B-testing
a black screen against a screendump statistic that could say *"bad"* but never *"why."*
A read/write serial console answered the entire question in a single boot. **Buy
observability before you test another hypothesis.** If you find yourself running the
same experiment a third time with a slightly different variable, stop and build an
instrument instead.

Good luck. He is counting on this one.

---

# ADDENDUM — WRITTEN 2026-08-26 ~16:45, AFTER THE ORIGINAL HANDOFF

I got further before the compute ran out. **Sections 3 and 5 above are now out of date.
This addendum supersedes them.** Everything else in this document still stands.

## A. `spb-boot` IS FIXED AND WORKING. Do not rewrite it.

Section 5 told you to fix it. **I fixed it.** It took four versions and the failure was
subtle enough that you would have burned an hour rediscovering it:

- **v1** set up socat first (~6 s) and the 1-second GRUB countdown had already expired.
- **v2** fired 250 `end` keys immediately — **also missed**, because GRUB only appears
  after several seconds of OVMF POST, so every key was consumed before the menu existed.
- **v3** hammered `end` continuously in the background across the whole POST+menu window
  and *did* hold the menu — then killed the hammer, the countdown resumed, and it booted.
- **v4 (current, WORKS):** hammers continuously, and enters the editor with `home` `e`
  **while the hammer is still running**, because `e` is what stops the countdown
  permanently. Only then kills the hammer.

Result on cycle7: `GRUB_MENU_SEEN=yes`, `IN_EDITOR=yes`,
`LUKS_PROMPT_ON_SERIAL=yes after 21s`, **121,960 bytes of serial**. The instrument works.

## B. DN-16 LOOKS CLOSED — but finish the proof

The cycle7 boot with the T-13 relabel fix produced:

- **`AVC_COUNT: 0`** — with the standing caveat that you must run `semodule -DB` in the
  guest before you may treat a zero as meaningful.
- **`getty`, `systemd-logind`, `accounts-daemon`, `polkit`, `NetworkManager`,
  `systemd-homed`, `plymouth`, `authselect-apply-changes` all reached `OK`.** Under
  DN-16 these were exactly the units being denied. That is the strongest signal we have.
- The system reached a working `fedora login:` prompt on ttyS0.

**What is still missing:** an actual successful login, and `ls -Zd /etc/passwd
/etc/nsswitch.conf` showing real contexts instead of `unlabeled_t`. I could not get
either, because of the new defect below. **Do not record DN-16 as closed until you have
logged in.** I have been wrong twice today on exactly this kind of near-proof.

## C. NEW DEFECT — DN-17: nobody can log in, because the password service FAILED

```
[FAILED] Failed to start spplus-firstboot-password.service — first-boot advisor password setup.
See 'systemctl status spplus-firstboot-password.service' for details.
```

It is the **only** failed unit on the system. Consequence: `root` and the advisor
account have no credential, every login attempt returns `Login incorrect`, and the
machine is unusable for a completely different reason than DN-16.

This is good news disguised as bad: the login prompt is **behaving correctly** and
rejecting a password that genuinely does not exist. That is a normal auth failure, not
the SELinux denial loop. But it is now the top blocker.

**Attack it first.** You cannot see the journal without logging in, so:
1. `./spb-boot "enforcing=0 systemd.unit=emergency.target"` or add `rd.break`, get a
   root shell without auth, and read
   `journalctl -u spplus-firstboot-password.service -b`.
2. The unit's definition is in the Containerfile / installer tree in the repo. Read what
   it actually executes and under what conditions it is `ConditionFirstBoot`.
3. Remember **DN-13**: SP+ ships **no default password, ever**. Whatever you do, the fix
   is "the advisor successfully sets their own password at first boot", never "ship a
   known credential". Christopher has ruled on this and it is not negotiable.

## D. CORRECTED PRIORITY ORDER FOR TONIGHT

1. **DN-17** — make `spplus-firstboot-password.service` succeed. Nothing is usable
   until someone can log in.
2. **Finish DN-16's proof** — `semodule -DB`, log in, `ls -Zd /etc/passwd
   /etc/nsswitch.conf`, `getenforce` must say `Enforcing`.
3. **DN-15** — the invisible LUKS prompt on the local screen. **This is the one that
   will embarrass a live demo**, because the machine looks bricked while it waits for a
   passphrase nobody can see. If time runs short, this matters more than polish.
4. Rebuild, full clean loop, `release-gate.sh` **exit 0**.
5. The Dell — Christopher installs it himself.

## E. CURRENT ARTIFACT STATE

- ISO under test: `6a593d7082614e561dd5ce8ea8f13b22acf331497f348e6b6172a9200f2aa0db`
- `~/sp-plus-iso/cycle7/disk.qcow2` — installed system, **currently booted and running**,
  sitting at a login prompt. `bserial.log` is 121,960 bytes of real evidence. **Keep it.**
- `~/sp-plus-iso/cycle6/` — the original DN-15/DN-16 proof. `reap.sh`'s 12-hour hold
  expires tonight; copy it aside if you still want it.
- The `spb-*` lane is proven end to end: install **and** boot both now run unattended.

---

# SECTION 12 — YOUR OPERATING DISCIPLINE AS HEADBRAIN
**Added last. This is how you keep the role, not just assume it.**

## 12.1 Skills now installed for you

`~/.claude/skills/` — invoke by name:

| Skill | When it fires |
|---|---|
| **`compact-safe`** | **Your context is filling and the session must survive a compaction.** Not session close, nothing merges. Reap, capture in-flight work, write the resume doc, persist it in three places, hand off. **Run it BEFORE you are forced to, not after.** |
| `fablebrain-verify` | Any time you are about to report a result or claim something is done. Ground every claim in evidence; flag what you could not verify. |
| `fablebrain-lessons` | After a correction, and at the end of a work block. Log the lesson into the ledger so it is never relearned. |
| `fablebrain-boundaries` | Before anything destructive or irreversible. A question is not an order. |
| `tom-session-close` | Your existing close checklist. |

## 12.2 State keeping — THIS IS THE PART THAT MATTERS TO ME

**Claude on CT105 takes the Headbrain role back tomorrow night.** Everything I know
about this project dies with my context. The only thing that survives is what you
write down.

**`~/SP-PLUS-STATE.md` is the baton.** After **every** cycle:

```bash
~/sp-plus-bee/spb-state          # regenerates the machine-truth half automatically
# then EDIT the narrative half by hand — it is the half that has the value
cd ~/work/secureprospective-advisor-os && git add -A && git commit -m "state: <what changed>"
```

`spb-state` captures the ISO sha, repo HEAD, RAM, disk, running VMs, every cycle
directory, and the latest AVC/failed-unit headline. It **never** overwrites your
narrative, which is the five headings you fill in:

- **Where it stands** — one paragraph of what is true right now
- **What I did since the last update** — newest first, each with its evidence
- **Next move** — one concrete action starting with a verb
- **Blocked on** — nothing, or the specific thing
- **Tried and rejected, with why** — **never delete an entry from this list.** It is
  the most expensive information in the project. Today's four refuted hypotheses cost
  most of a day; section 6 of this document exists so nobody pays that twice.

Write it as if the reader has no memory of tonight, because I will not.

## 12.3 Hygiene — binary, not a judgment call

The Beelink is **Christopher's daily driver**. His rule: *"If we will not be coming
back to said process or file, it must be cleaned up. The token burn is worth the
prevention of slop."*

```bash
~/sp-plus-bee/spb-hygiene            # report
~/sp-plus-bee/spb-hygiene --apply    # reclaim (12h evidence hold via reap.sh)
```

Run it at the **start of a work block**, after **every completed cycle**, and before
**any handoff**. It reports RAM, disk, running VMs, and the size and age of every cycle
directory, and warns below 6 GB RAM or 40 GB disk.

The numbers that matter: **each cycle disk is ~8 GB** and **each running VM holds
6 GB of RAM**. Three stale cycles is a quarter of his free space. Stop VMs you are done
with — `pkill -F <cycledir>/boot.pid`, **never `pkill -f <pattern>`**, which matches
your own shell and has killed a session twice.

**But never delete evidence an open defect rests on.** Right now that is `cycle6`
(the DN-15/DN-16 proof) and `cycle7` (the DN-17 proof). `cycle1b` through `cycle5` are
small and answer closed questions — they can go.

## 12.4 Cadence

1. **Start of block:** `spb-hygiene`, read `~/SP-PLUS-STATE.md`, `git pull` is not
   needed (local-only repo) but check `git status` is clean.
2. **Each experiment:** one hypothesis, one instrument, one result. If you are about to
   run the same experiment a third time with a different variable, **stop and build an
   instrument instead** — that is OP-22, the most expensive lesson of the day.
3. **After each cycle:** `spb-state`, edit the narrative, commit. `spb-hygiene --apply`.
4. **When context gets tight:** run `compact-safe`. Do not wait until you are cornered.
5. **Before you stop for the night:** `spb-state` with a full narrative, commit, and
   leave `Next move` filled in with something I can execute cold.

## 12.5 What to hand me tomorrow night

One sentence I should be able to read and act on immediately: **which defects are
closed with what evidence, which are open, and what the single next move is.** Put it
at the top of the narrative. If DN-17 is fixed, say what fixed it and how you proved it.
If you closed DN-16, say that the login actually succeeded, not that the labels looked
right — I have twice mistaken the second for the first today.
