# SP+ PERFORMANCE BASELINE — measured 2026-09-02

## The artifact measured
- ISO: `~/Downloads/sp-plus-1.0-test55-20260902.iso`, 5,655,955,456 bytes (5.66 GB)
- Built from commit `e311651` (branch `session/sp-plus-plan`), build wall time 16m53s
- Contains both update-lane fixes (871b144 parser, 8fcf7bb notifier), verified by
  sha256 INSIDE the image, not in git.
- Measured in QEMU on Beelink. Nothing SP+ runs on Beelink hardware.
- Raw logs: `~/logs/sp-plus/bench/20260902T031155Z/` on Beelink
- Harness: `~/fleet/bin/spplus-bench.sh` (written by Tom, 15 KB)

## INSTALL — the baseline to beat
| Phase | Time | Share |
|---|---|---|
| ISO boot -> anaconda ready | 66.8s | 13% |
| **Payload write to disk** | **414.5s** | **83%** |
| Post-install + bootloader | ~16s | 3% |
| **TOTAL** | **500.9s (8m21s)** | |

**KEY CONVERSION RATE: ~73 seconds of install time per GB of payload.**
This is THE number for judging any proposal. 1 GB saved = ~73s faster install.

Payload write dominating at 83% CONFIRMS that bytes-written is the right lever.
This was a hypothesis before this measurement; it is now evidence.

## BOOT — NOT YET MEASURED
The harness's `boot-1.stamped` capture is TRUNCATED at 6.0s — it does not cover a
full boot. **Do not quote boot numbers from it.** Boot must be measured with
`systemd-analyze` from inside the installed VM, on the SECOND boot.
Known lead, unmeasured: the initramfs is **291 MB** (typical is 30-80 MB), built
`dracut --no-hostonly --add ostree --add-drivers "bochs_drm virtio_gpu qxl cirrus i915 simpledrm"`.

## Structure of the thing being optimised
`projects/sp-plus/images/kde/Containerfile`: 2095 lines, 55 RUN layers,
103 COPY layers, 901 comment lines (43%), 9 separate `dnf install` transactions,
single-stage build, `nodejs`+`npm` installed ~line 664.

## Open hypotheses (NOT yet confirmed)
- H1 collapsing 9 dnf transactions into 1 shrinks the image meaningfully
- H2 nodejs/npm are build-time-only and wastefully shipping
- H3 55 RUN / 103 COPY layers are themselves a significant cost
- H4 the 291 MB initramfs is a major boot tax
Bee (GPT-5.6, independent model) is red-teaming these precisely because Tom and
ClaudeBox are the same model and their agreement is weak evidence.

## Rollback points (do not delete)
- `~/Downloads/sp-plus-1.0-test55-20260902.iso` — current head of line, has fixes
- `~/Downloads/sp-plus-1.0-20260901.iso` — older known-good

## Harness lessons banked tonight (now structural, not remembered)
1. `run-tom-code.sh` now tells Tom he is a NON-INTERACTIVE BATCH PROCESS: he must
   block and poll until work finishes. He previously ended a turn with "I'll pick
   back up when it completes" and orphaned a running install.
2. `pi -p` (Bee) buffers stdout until exit, so a timeout DESTROYS the output
   rather than truncating it. Briefs for Bee must be small enough to finish.
3. Check process names before concluding a job is dead: Bee runs as `pi`, not
   `codex`/`opencode`. Same class as `pgrep notify-send` matching `timeout`.
