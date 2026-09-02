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

---

# AUDIT + RED TEAM RESULTS — 2026-09-02

## Two of three original hypotheses were WRONG. Measurement beat intuition.

| # | Hypothesis | Tom (measured) | Bee (gpt-5.6, independent) |
|---|---|---|---|
| H1 | Collapsing 9 dnf transactions is a big win | Not the dominant cost | **FALSE** — low return |
| H2 | nodejs/npm wastefully shipping | 0.7s — **NOT WORTH DOING** | UNKNOWABLE without measuring runtime need |
| H3 | 55 RUN / 103 COPY layers are a significant cost | Not what dominates | **FALSE** — likely a wasted build cycle |
| H4 | 291 MB initramfs is a major boot tax | not yet measured | UNKNOWABLE without measuring |

Two independent models agreeing that H1/H3 are false is far stronger evidence
than ClaudeBox and Tom agreeing (same model, weak evidence).

## WHAT ACTUALLY DOMINATES (Tom, measured)

**1.68 GB uncompressed is content SP+ installs and then throws away** — it ships
in the payload but is absent from the final filesystem. Chiefly:
- base-image RPMs SP+ deletes (firefox, nvidia firmware, glibc-all-langpacks,
  mariadb, CJK fonts) — ~406 MB compressed / ~30s
- a 149 MB dnf metadata cache created by the releasever gate, cleaned 4 layers
  too late — **FIXED in 13e97c8, ~8.2s**
Of what SP+ genuinely KEEPS, one dnf transaction (line 38) is 676 MB compressed
= 40% of everything SP+ adds. Its single most removable item is
`libreoffice-base`, which hard-requires a 248 MB JDK.

## RANKED, PRICED IN SECONDS (~73s of install per GB)

| Proposal | Saves | Risk | Status |
|---|---|---|---|
| `dnf clean all` in the releasever layer | ~8.2s | low | **DONE — 13e97c8** |
| Remove `libreoffice-base` (+248 MB JDK) | ~9.4s | FEATURE CUT | **Christopher's call** |
| Squash/flatten the image | ~38-55s | HIGH, structural | **HELD — see below** |
| Build on a base without the deleted RPMs | ~30s | changes TRUST ROOT | **Christopher's call** |
| Drop `nodejs22-full-i18n` | 0.7s | low | **Rejected — not worth it** |

## WHY THE SQUASH IS HELD (the biggest single win)

Squashing collapses layers, so `bootc upgrade` can no longer ship deltas — every
future update pulls the whole image. Bee, independently: *"Layer changes can also
worsen incremental upgrade/download behavior."* We spent 2026-09-01 fixing the
update lane. Trading a faster first install for permanently heavier updates is an
operator decision, not an overnight one.

## CORRECTION TO THE FRAMING (Bee)

"Install time = bytes written" is a useful HEURISTIC, not a law. A bootc install
also does: OCI read+decompression, import into OSTree, deployment checkout,
SELinux metadata/xattrs, boot assets, LUKS setup. Treat ~73s/GB as an estimator
and always CONFIRM with a real measured run.

## BOOTC TRAPS — DO NOT DO THESE (Bee)

- Do not remove `ostree` / `ostree-prepare-root` or its initramfs config, or the
  bootc base integration — breaks deployment switch-root.
- Do not remove `cryptsetup` / `systemd-cryptsetup`, TPM2/Clevis/FIDO, keyboard,
  storage or filesystem drivers — **breaks LUKS unlock**.
- Do not mutate deployed systems with `rpm-ostree install` / `rpm-ostree
  initramfs` — `bootc upgrade` will error.
- Preserve SELinux policy/xattrs, the bootc image label, and kernel+initramfs at
  `/usr/lib/modules/$kver/` — do NOT relocate them to `/boot`.

## INITRAMFS — KEEP `--no-hostonly` (Bee, strong)

For unknown advisor laptops, keep it. The safe middle is a CURATED generic
initramfs: omit only demonstrably irrelevant dracut modules after testing Intel/
AMD/NVIDIA graphics, NVMe/SATA/RAID, filesystems, UEFI, LUKS, TPM, keyboard and
any network unlock path. Never ship an initramfs built host-only on the builder.

## SCHEDULING RULE LEARNED

**Never run a container build while a boot/install timing run is in flight.** A
rootful build saturates all 16 cores and corrupts the timings it shares a host
with. Builds and benchmarks must be serialised.

---

# BOOT — MEASURED 2026-09-02 (and H4 refuted)

## The capture was not "truncating". Boot was BLOCKED at the LUKS prompt.

Earlier runs looked like a broken harness (a 6.0s capture). The real cause: SP+
is encrypted, so boot stops at `Please enter passphrase for disk luks-...` and
waits. In the measured run it waited **4 minutes 8 seconds** for input. Any
"boot time" that includes that wait is measuring the typist, not the machine.

## Machine boot time, passphrase wait excluded

| Phase | Time |
|---|---|
| Kernel start -> LUKS passphrase prompt | **3.2s** |
| *(advisor types passphrase)* | *human time — excluded* |
| Unlock -> switch-root | 3.0s |
| Unlock -> `systemd-user-sessions` (login ready) | **20.6s** |
| **TOTAL MACHINE BOOT** | **~23.8s** |

Evidence: `~/logs/sp-plus/bench/20260902T035953Z/boot-1.stamped`.
Kernel 0.000 at epoch 1788322060.589; cryptsetup starts 1788322063.789;
passphrase accepted ~1788322311.41; `Permit User Sessions` finished
1788322331.996.

## H4 REFUTED — the 291 MB initramfs is NOT a boot bottleneck

The initramfs loads, starts systemd, and reaches the passphrase prompt in
**3.2 seconds**. Its size is unusual but it is not costing meaningful boot time.

**This is why `--no-hostonly` must stay.** Bee warned that trimming it risks
laptops that will not boot. We now know the win it was supposed to buy does not
exist. Trimming the initramfs would have traded real risk for nothing.

Do not revisit initramfs trimming without new evidence that contradicts the
3.2s measurement above.

## What this means for the goal

Boot is already fast in machine terms (~24s). The advisor's *perceived* boot time
is dominated by typing the passphrase, which is a REQUIRED security property, not
a defect. The honest remaining boot levers are inside the 20.6s post-unlock
window (`systemd-analyze blame` on that span), not the initrd.

**Not yet done:** `systemd-analyze` from inside the booted VM. The serial console
does not print systemd's own summary, so the blame/critical-chain breakdown of
that 20.6s window is still unmeasured. That is the next real boot question.
