# Instrumented install run — test56 — 2026-09-02

Run dir: `~/logs/sp-plus/instrumented-20260902T120925Z/` (Beelink)
Serial:  `~/logs/sp-plus/bench/20260902T120925Z/install-1.stamped`
ISO:     `~/Downloads/sp-plus-1.0-test56-20260902.iso`
sha256:  2d12181473ec98a0cded0f10ceaa01e48898f47ec9fd1ec75f4690c12078eccf

## Timings (from stamped serial log, epoch seconds)

| Landmark | Epoch |
|---|---|
| Running pre-installation | 1788351002.7 |
| Deploying image (start)  | 1788351021.8 |
| Installation complete    | 1788351514.5 |

- **Total install: 511.8 s** (baseline test55: 500.9 s)
- **Deploy phase: 492.7 s — 96% of the whole install**

## FINDING 1 — byte reduction bought NO install time

test56 removed 101.1 MB from the ISO and 158.4 MB from the image versus test55.
Install time did not improve: 511.8 s vs 500.9 s. That difference is noise, and if
anything it is in the wrong direction.

This CONFIRMS the retraction of the "~73 s per GB" estimator (see
PERFORMANCE-STANDARD.md). Bytes are not the lever. **Do not spend another session
shaving image size for install speed.** Size may still matter for download and for
`bootc upgrade` deltas — but not for install wall clock.

## FINDING 2 — the deploy phase is CPU-BOUND, not I/O-bound

Host-side sampling every 3 s across the deploy window (162 samples,
`samples.tsv`):

| Metric | Value |
|---|---|
| qemu CPU, average | **245.0%** of 400% available (4 vcpu) |
| qemu CPU, max | 370.0% |
| samples at >=350% | 4 (2%) |
| host disk write, average | **1.8 MB/s** |
| host disk write, max | 44.1 MB/s |
| host disk read, average | 0.0 MB/s |
| iowait, average | **5.0%** |
| samples with iowait >=30% | **0** |

The NVMe is essentially idle for the entire 493 s. The guest burns CPU.

**Caveat, stated deliberately:** 245% of 400% is not saturation either. The work is
partly parallel but not fully — the ceiling looks like single-thread throughput in a
mostly serial pipeline, not the number of cores and not the disk. Which process and
which operation holds that CPU is NOT yet established; it is the open question.

## Boot — not re-measured, and not the problem

The boot leg of this run hung after reaching the login prompt and produced no
`systemd-analyze` result; the run was reaped. Boot remains at the previously measured
~23.8 s of machine time (LUKS passphrase wait excluded). Boot is roughly 5% of the
install cost. It is not where the remaining budget lives.

Note on reading these logs: the boot log shows a 355.5 s gap immediately before the
`Please enter passphrase` line. That is the harness waiting and then typing, flushed as
one line. **It is not machine time.** Anyone reading a boot log here must exclude it.

## Next question (dispatched to Tom, 2026-09-02)

Inside the guest, which processes and which operations consume the CPU during
"Deploying image"? Ranked, with numbers. Brief:
`~/briefs/spplus-deploy-cpu-profile.md`.
