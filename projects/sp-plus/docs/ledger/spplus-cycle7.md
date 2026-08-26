# SP+ cycle7 — verify the DN-16 relabel fix

You are running the SP+ test loop on this machine (the Beelink). Everything you need
is in `~/sp-plus-bee/RUNBOOK.md`. **Read that file first, in full, before running
anything.** It contains the rules, the traps, and the list of hypotheses already
refuted — do not retest those.

## Your task

Verify whether the SELinux relabel fix in ISO sha `6a593d70…` actually closes DN-16
(`/etc` is `unlabeled_t`, which breaks every login under Enforcing).

Run, in this order, from `~/sp-plus-bee`:

```bash
export CYCLE=cycle7
./spb-sha
./spb-install
./spb-boot
./spb-evidence
```

Do **not** run `./spb-build` — the ISO on disk is already the one under test.

## What to return

Paste the **entire** `spb-evidence` output to STDOUT, verbatim. Plus, in plain words:

1. Which ISO sha you tested (from `spb-sha`).
2. The `disk_bytes` number `spb-install` printed.
3. Whether `LUKS_PROMPT_ON_SERIAL` was `yes` or `no`.
4. Anything that did not behave the way the runbook says it would.

## What NOT to do

- **Do not write a verdict.** No "the fix works", no "SELinux is healthy", no
  "boot completed successfully". Return the lines; someone else judges them.
- Do not summarise or truncate the `avc:` section. Every line, verbatim, or the
  literal words "(none present in the log)".
- Do not use `sudo`. You never need it here — root lives inside the guest and
  `./spb-shell '<cmd>'` reaches it.
- Do not delete `~/sp-plus-iso/cycle6/` — that is evidence for an open defect.
- Do not retry a failed step "blind". If something does not match the runbook,
  capture what you saw and stop. A partial result with an honest note beats a
  clean-looking result from a step you re-ran until it passed.

Wall time is roughly 45 minutes, most of it waiting. That is expected.
