# BEE BRIEF — cycle32 full verification
Issued by Headbrain, 2026-08-27. Read `~/sp-plus-bee/RUNBOOK.md` first, in full.

## Your job

Christopher is about to put this ISO in front of someone who matters. He asked for
**extensive** evidence that everything works as intended. You own the loop; produce the
evidence. Headbrain decides what it means.

**THE ONE RULE STILL APPLIES: return evidence, never a verdict.** Paste actual lines.
"It works" is the single least useful sentence you can write. "NOT FOUND" and "I could
not tell" are correct, valuable answers.

## Before you start — things you must not do

- **Do NOT kill any VM you did not start.** PID 2897407 (`fedora-test`) is Christopher's
  own machine and a VM named `chris` is his too. A cycle31 VM is Headbrain's and is
  mid-install; leave it alone. Kill only your own cycle32 VM, from its pidfile.
- **Do NOT use `pkill -f`** — it matches your own shell. The runbook says why.
- **Do NOT delete any log, screenshot or VM disk that evidence came from.**
- Watch disk. `df -h /home` before you create the VM. If free space drops under 25 GB,
  stop and say so rather than filling Christopher's daily driver.

## Step 0 — the ISO is ALREADY BUILT. Do not build one.

The build finished at 10:02. An earlier version of this brief told you to wait for the
line "ISO build complete" — that line is never printed by the build script that runs
here, so waiting for it blocks forever. Do not wait; verify instead:

```bash
./spb-sha
```

The ISO under test is:

```
/home/chris/work/secureprospective-advisor-os/projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
sha256 = b7780868abab4a0cff058b98884a5546f3c81144ccdda7a9ca13279b774d2529
```

Confirm `spb-sha` reports that same sha256. If it reports a different one, STOP and say
so — it means something rebuilt underneath you and the rest of the run would be testing
an unknown artifact.

## Step 1 — the loop

```bash
cd ~/sp-plus-bee && export CYCLE=cycle32
./spb-install     # ~35 min
./spb-mkuser spbtest spplus-test   # MANDATORY -- see below
./spb-boot        # serial boot + LUKS unlock
./spb-evidence    # the standing deliverable
```

**If you skipped `spb-mkuser`, everything below will fail with `Login incorrect` and
it will look like the ISO is broken.** It is not. SP+ ships no account at all (DN-13)
and root's password is a random hash thrown away at install time, so there is nobody
to log in as until the lane creates one. `spb-mkuser` types into a VM that is ALREADY in a dracut
pre-pivot shell: run `./spb-boot 'rd.break=pre-pivot'` FIRST, then `spb-mkuser`, then
kill that VM from its pidfile and `./spb-boot` normally. Headbrain missed this step
in the first version of this brief; it is not your mistake if you hit it.

## Step 2 — the new surface (this is the part that has never been observed)

```bash
./spb-fin         # 21 checks: Fin-as-Pi-agent, and btop/fastfetch/flameshot
./spb-apps
./spb-branding
```

Paste `spb-fin` output whole. For every FAIL, also run the underlying command by hand
with `spb-shell` and paste the raw result, so Headbrain sees the real output and not
just the gate's opinion of it.

## Step 3 — the three things a gate cannot see

These need eyes. Use `spb-screen` / `spb-bootshot`, and `spb-qc` if you want a second
opinion on an image (allow it up to 7 minutes per image — it is slow, not broken).

1. **The wallpaper.** Is it the SP+ one, or Fedora's default? DN-24 is the fix that is
   supposed to make this right on a FRESH install. Screenshot it.
2. **Print Screen.** In a real session, press it. Does flameshot's crosshair appear, or
   Spectacle, or nothing? This is UNVERIFIED and is the most likely thing to be wrong.
3. **Fin's first run.** Launch Fin. It should print a shoal of blue and grey fish, then
   ask for a key, then exit cleanly when given none. Screenshot the fish.

## Step 4 — report

Write your report to `~/sp-plus-bee/REPORT-cycle32.md`. Include:

- the ISO sha256 you tested and the cycle name
- what you ran, in order, with the actual output
- **a table: what you PROVED, what you DISPROVED, what you COULD NOT TEST and why**
- anything that did not behave the way the runbook describes
- every `avc:` line, or the word NONE

Then, as the very last thing:

```bash
touch ~/sp-plus-bee/REPORT-cycle32.DONE
```

Headbrain is watching for that file. Do not skip it — it is how the work gets back to
Christopher.
