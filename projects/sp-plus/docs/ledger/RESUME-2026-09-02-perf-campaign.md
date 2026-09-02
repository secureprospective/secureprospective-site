# SP+ RESUME — install/boot performance campaign
**Written 2026-09-02 ~12:15 UTC, mid-session. NOT a session close.**

## 1. WHAT WE ARE DOING
Minimise SP+ **install time** and **boot time** without weakening encryption, the
`bootc upgrade` lane, or advisor features — and leave behind a standard future
sessions can follow.

- Repo (ACTIVE): `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- Branch: `session/sp-plus-plan`. Clean build worktree: `~/work/sp-plus-build`.
- CT105 reaches Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- **Nothing SP+ runs on Beelink hardware. Everything in QEMU.**

## 2. AGENTS + HARNESSES
- `/root/run-tom-code.sh` — Tom, SURGICAL CODING. Carries the surgical mandate AND
  the batch-process rule (block and poll; never end a turn deferring work).
- `/root/run-tom.sh` — Tom, read-only verifier.
- `/root/run-bee.sh` — Bee, `pi -p`, gpt-5.6-luna via **openai-codex**.
  **Set `THINKING=high` for reasoning work** — at `low` Bee replied "No further
  action required." and did nothing.
- Briefs: `/root/briefs/`. Tom's finished outputs filed at
  `beelink:~/fleet/runs/2026-09-02-spplus-perf/`.

## 3. IN-FLIGHT RIGHT NOW (most perishable)
**Instrumented install — Terra rank-1 action.**
- Started ~12:09 UTC. Script `beelink:~/instrumented-install.sh` (left at ~ on
  purpose — it is running; file it after).
- Output dir: `beelink:~/logs/sp-plus/instrumented-20260902T120925Z/`
  (`samples.tsv`, `bench.log`, `meta.txt`)
- Alive?  `pgrep -af spplus-bench.sh` ; `virsh domstate spplus-bench-r1`
- Done?   `grep "SAMPLING DONE" ~/logs/sp-plus/instrumented-*/meta.txt`
- My watch task id: `b9md2xkda`
- **What to do with the result:** answers (a) test56 install time vs the 500.9s
  baseline, (b) **CPU-bound vs I/O-bound** during payload write. `samples.tsv`
  columns: epoch, qemu_cpu_pct, write_MBps, read_MBps, procs_running, iowait_pct.
  High qemu_cpu + low write => CPU-bound (squashfs decompress/hash/SELinux).
  Low cpu + high iowait => I/O-bound (byte recovery is the lever).

**Awaiting Christopher (physical, cannot be automated):** burn test56 to USB and
install on a ~14-year-old Dell. Relay already written at
`beelink:~/Downloads/paste.md` (steps 6-8).

## 4. ARTIFACTS THAT EXIST AND WORK
- **test56 ISO** `beelink:~/Downloads/sp-plus-1.0-test56-20260902.iso`
  **5,549,975,552 B**, sha256 `2d12181473ec98a0cded0f10ceaa01e48898f47ec9fd1ec75f4690c12078eccf`
  Built rootful from commit `363311c`. **101.1 MB smaller than test55.**
- test55 ISO (rollback) 5,655,955,456 B sha `86951b7fd636df8f1b74704be76f9b9dbe9b2c45cb5eaf70c2ee8555bf54807d`
- 20260901 ISO (older rollback) 5,619,464,192 B
- Payload image rootless: `localhost/sp-plus-kde:test56` = 11,235,609,836 B
  (test54 was 11,394,019,768 B; **-158.4 MB**)
- Bench harness: `beelink:~/fleet/bin/spplus-bench.sh`
- Terra research archived: `projects/sp-plus/docs/research/terra-q2-q3-bootc-install-2026-09-02.md`

## 5. MEASURED NUMBERS (the baseline to beat)
Install total **500.9s**: ISO boot->installer 66.8s (13%) | **payload write 414.5s
(83%)** | post-install ~16s.
Boot **~23.8s machine time**: kernel->LUKS prompt 3.2s; unlock->login-ready 20.6s.
(A naive boot number is dominated by the passphrase wait — 4m08s in our capture.
`systemd-analyze`'s `initrd` figure INCLUDES it. Use `userspace`.)

## 6. HYPOTHESES REFUTED — DO NOT RETEST
| Hypothesis | Verdict |
|---|---|
| Collapse 9 `dnf install` transactions into one | **FALSE** (Tom measured, Bee agreed) |
| 55 RUN / 103 COPY layers are a significant cost | **FALSE** (both) |
| `nodejs`/`npm` ship wastefully | **0.7s. Not worth doing** |
| 291 MB initramfs is a major boot tax | **FALSE** — reaches LUKS prompt in 3.2s |
| Payload OCI compression (zstd/gzip/chunked) can speed the ISO install | **FALSE — PROVEN.** kickstart line 67 uses `--source-imgref containers-storage:`, and containers-storage hands bootc UNCOMPRESSED layers. No OCI decompression in the hot path. |
| **"~73s per GB" estimator** | **RETRACTED — INVALID.** It divides a wall clock containing squashfs reads, decompression, tar parsing, hashing, OSTree object creation, SELinux and flushes by one byte count. **Never convert bytes to seconds.** |

## 7. DECISIONS (Christopher's — do not relitigate)
- **LibreOffice stays** (incl. `libreoffice-base` + 248 MB JDK).
- **No squashing the image** (~38-55s) — would force every update to pull ~5.6 GB.
- **No custom base image** (~30s) — moves trust root off Fedora.
- **`dracut --no-hostonly` stays** — one image must boot any advisor laptop.
- All install/boot testing in QEMU; nothing SP+ on Beelink hardware.

## 8. LEDGER STATE — all committed, tree clean
`13e97c8` dnf cache fix · `ba30b6b` install baseline · `d736c15` audit+red team ·
`363311c` PERFORMANCE-STANDARD.md · `4df8f77` boot measured, H4 refuted ·
`7284a76` validation -158.4 MB · `516cb0b` **retract 73s/GB** · `589418f` transport finding.
Standard: `projects/sp-plus/docs/PERFORMANCE-STANDARD.md`.
Ledger: `projects/sp-plus/docs/ledger/PERF-BASELINE-2026-09-02.md`.

## 9. NEXT ACTIONS, IN ORDER
1. **Collect the instrumented run** (§3). Report test56 install time vs 500.9s AND
   the CPU-vs-I/O verdict. Commit both to the ledger.
2. **Take the Dell numbers** when Christopher runs them: `systemd-analyze`
   (**read `userspace`, not `initrd`**), `blame | head -25`,
   `grep -w aes /proc/cpuinfo` (no AES-NI => dm-crypt software => expect much
   slower), wall-clock install time. Commit as real-hardware baseline.
3. **Fix the dead `--add-drivers` line** in the Containerfile: `bochs_drm` no
   longer exists (renamed `bochs`), and one bad name fails the WHOLE group, so
   `virtio_gpu qxl cirrus i915 simpledrm` are all silently skipped. Verified:
   i915/qxl/bochs are present anyway via `--no-hostonly`; virtio_gpu/cirrus/
   simpledrm are NOT. Either fix the names or delete the line — it is decoration
   pretending to be protection.
4. **Q3 byte recovery**, guided by the instrumented result: find other
   create-then-delete-in-a-later-layer cases. Terra's rule: **minimal semantic
   layers, each internally self-cleaning** — do NOT merge unrelated RUNs, that
   worsens update blobs. Base-image bytes (~406 MB) are NOT recoverable this way.
5. Consider a CI lint that fails a build when a layer installs something a later
   layer deletes (Terra suggested; would make the standard enforceable).

## 10. RELAY / ENVIRONMENT NOTES
- **`sudo` on Beelink needs a PASSWORD.** `sudo -n` FAILS. The rootful ISO build
  therefore cannot be automated — relay via `beelink:~/Downloads/paste.md`.
  **Never pipe a password into sudo.**
- Nested ssh quoting breaks constantly. **Write a script, `scp` it, run it.**
- Beelink `/home` at 78%, ~100 GB free. **No swap configured** on 30 GB RAM —
  never run a build and a benchmark at once.
- **Builds and benchmarks must be serialised** — a rootful build saturates 16
  cores and corrupts any timing sharing the host.
- Rootless ISO build is POSSIBLE but Tom only got there by shimming `chcon` to
  `#!/bin/sh; exit 0`. **Not acceptable without verifying SELinux labels.**
- Filing gate residual (deliberate): `~/instrumented-install.sh` (in flight),
  and dirs `~/briefs` + `~/tom-dispatch` — **`run-tom-code.sh` hardcodes those
  paths**; the harness should be changed to use `~/fleet/briefs` and
  `~/fleet/runs` before the gate can pass. `~/tmp` also undeclared.

## 11. HONEST STATUS
We removed **101 MB from the ISO** and **158 MB from the image** — measured, real.
We CANNOT say how many seconds that saves; the estimator that claimed 8.2s was
retracted as invalid. Boot is ~23.8s machine time and is NOT the problem.
**Four of my hypotheses were wrong and were caught by measurement or by an
independent model.** The genuinely unknown thing is whether the 414.5s payload
write is CPU-bound or I/O-bound — the in-flight run answers it. The campaign's
most durable output is the standard, including its record of what we got wrong.
