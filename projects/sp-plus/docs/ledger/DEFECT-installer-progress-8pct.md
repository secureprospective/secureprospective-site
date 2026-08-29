# DEFECT — Anaconda install bar parks at 8% and reads as a hung installer

**Reported:** Christopher, 2026-08-29, from a live install.
**Target:** fix in cycle40.
**Severity:** first-impression defect. An advisor installing SP+ for the first
time sees a bar stuck at 8% for many minutes and concludes the product is
broken. This is the very first thing the product does on their machine.

## Status of the previous attempt

`375435d "fix: the installer progress bar follows the real image deploy"`
shipped in **cycle39** and was intended to fix exactly this. It was diagnosed
on cycle38. Whether Christopher observed the 8% hang on cycle38 or on the
cycle39 that contains the fix is THE open question and is recorded here as
unresolved. Do not assume the fix failed until that is settled.

## What the shipped fix does

`installer/patch-anaconda-progress.py` patches two pyanaconda files at image
build time, and refuses to build unless each anchor matches exactly once:

- `DeployBootcTask` declares `steps = 100` and parses `SPPLUS_PROGRESS <n>`.
- The boss scales `_total_steps` to `task_count * 100` and forwards the
  sub-step on a per-task base instead of discarding it.

The percentage is produced by `installer/bootc-wrapper.sh`, which measures
bytes actually landed on the target with `df`.

## Suspects found by reading the wrapper — unproven, ranked

1. **Progress is event-driven off bootc stdout, not off a clock.** The
   emission lives inside `bootc | while IFS= read -r line`. The one-second
   check only rate-LIMITS measurement; it does not drive it. If bootc goes
   quiet during the long unpack, no lines arrive, the loop body never runs,
   and no `SPPLUS_PROGRESS` is emitted at all. The bar freezes for exactly as
   long as bootc is silent. This matches the reported symptom most closely.

2. **The whole progress path is conditional on `scratch_bound == 1`.** If the
   `mount --bind "$target/boot" /var/tmp` fails, the wrapper falls through to
   `exec /usr/bin/bootc-real "$@"` and emits NO progress whatsoever. The bar
   then sits wherever Anaconda's own task accounting leaves it, which is
   about 8%.

3. **The denominator is a hardcoded guess.** `progress_image_bytes=5000000000`
   is 5 GB, while `localhost/sp-plus-kde:spike` is about 11 GB. Even when the
   path works the scale is wrong, so the bar misreports and pins at the 99
   clamp early rather than tracking the real deploy.

4. **`scratch_bound=0` inside the pipeline is written in a subshell** and
   never propagates to the parent, so the post-loop state is not what it
   appears to be. Minor, but the unbind bookkeeping is not doing what it
   reads as doing.

## Acceptance for cycle40

Not "the code looks right." A recorded install where the bar advances
visibly and monotonically through the image deploy, with no stall longer
than a few seconds, and where the number shown bears an honest relationship
to work actually completed. A bar that lies smoothly is not a fix.

---

## VERIFIED 2026-08-29, after Christopher confirmed the behaviour is unchanged

Christopher: "just about every build so far has done the same behaviour...
that hasn't changed." Identical behaviour before AND after `375435d` means the
fix is **not taking effect**, not that it is miscalibrated. The "8% then a
scream to the finish" signature is precisely the UNPATCHED accounting: one
task, `+1` on completion.

Evidence taken directly from the `localhost/sp-plus-installer` image, which IS
the installer runtime:

| Check | Result |
|---|---|
| `SPPLUS_PROGRESS` in patched payload `installation.py` | **present**, 2 hits |
| `_completed_steps` in patched boss `installation.py` | **present**, 4 hits |
| `/usr/bin/bootc` | **the real ELF binary**, NOT our wrapper |
| `/usr/bin/bootc-real` | present |
| `/usr/local/bin/bootc` | our wrapper |
| `command -v bootc` in a plain shell | `/usr/local/bin/bootc` |

So the Anaconda side of the fix is live and ready to parse `SPPLUS_PROGRESS`.
The question is entirely whether anything EMITS it.

`installer/Containerfile:64` installs the wrapper to `/usr/local/bin/bootc`
while leaving the real binary at `/usr/bin/bootc`. Anaconda invokes it as
`execReadlines("bootc", bootc_args)` (payload `installation.py:897`) — a bare
name resolved through PATH, not an absolute path. In a plain container shell
PATH puts `/usr/local/bin` first and the wrapper wins, so this is NOT proven
broken. It is proven FRAGILE: the whole feature rests on PATH order inside
anaconda.service.

## Two candidates remain, and the guest logs settle it

1. **PATH inside anaconda.service does not include `/usr/local/bin`,** or
   Anaconda prunes it, so `bootc` resolves to the real binary and no
   `SPPLUS_PROGRESS` is ever emitted.
2. **The wrapper runs but falls through.** Its progress path is gated on
   `scratch_bound == 1`. If `mount --bind "$target/boot" /var/tmp` fails, it
   `exec`s the real bootc and emits nothing.

**The evidence is already on the cycle39 guest** at `/var/log/anaconda/`. The
wrapper echoes distinctive strings. Grep the install logs for
`Advisor bootc diagnostic target:` (proves the wrapper ran at all),
`Advisor bootc scratch:` (proves whether the bind succeeded), and
`SPPLUS_PROGRESS` (proves emission). That single grep decides between the two.

## Recommended fix regardless of which it is

Stop depending on PATH order: install the wrapper AT `/usr/bin/bootc` with the
real binary already moved to `/usr/bin/bootc-real`, so the wrapper is on the
absolute path too. Then make progress **clock-driven rather than
stdout-driven**, and make the no-scratch path still report progress instead of
silently exec'ing away. Fix the 5 GB hardcoded denominator while there.

## Priority

Christopher, 2026-08-29: "Not super critical but with a system designed for
nonTechnical people that might scare them." Real, worth fixing for cycle40,
does NOT displace the Welcome lane.

---

## ROOT CAUSE — MEASURED ON THE CYCLE39 GUEST, 2026-08-29

**My earlier ranking was wrong and is superseded.** Suspects 1 and 2 named PATH
resolution and the `scratch_bound` fallthrough as most likely. The install logs
refute both.

From `/var/log/anaconda/packaging.log` on the cycle39 guest:

    Advisor bootc scratch: bound /mnt/sysimage/boot to /var/tmp
    SPPLUS_PROGRESS 0
    SPPLUS_PROGRESS 0
    SPPLUS_PROGRESS 99
    SPPLUS_PROGRESS 100
    Advisor bootc scratch: unbound /var/tmp after image import
    SPPLUS_PROGRESS 99
    SPPLUS_PROGRESS 99
    SPPLUS_PROGRESS 99

So, established as fact:

- The wrapper **did** run. PATH resolution is fine. Candidate 1 REFUTED.
- The bind **did** succeed. There is no fallthrough. Candidate 2 REFUTED.
- The Anaconda patch is live and `SPPLUS_PROGRESS` **is** being parsed.

The bar is broken for two different reasons, both now proven:

**A. The scale is wrong, so the number leaps 0 -> 99 with nothing between.**
`progress_image_bytes=5000000000` hardcodes 5 GB. `localhost/sp-plus-kde:spike`
is about 11 GB. Once roughly 5 GB has landed the computed percentage exceeds
100 and pins at the 99 clamp. There is no useful middle. That is exactly the
reported "8% then a scream to the finish": the deploy task contributes 0 of its
100 for most of the install, so the overall bar sits at the ~8% the earlier
tasks left it at, then jumps.

**B. Only 7 samples were emitted across a multi-minute deploy.** Emission lives
inside `bootc | while IFS= read -r line`. The one-second window only RATE-LIMITS
sampling; it does not drive it. When bootc is quiet, nothing is sampled and
nothing is emitted. Even with a correct denominator, 7 updates cannot render a
smooth bar.

**C. bootc 1.16.9 has no native progress flag.** Checked
`bootc install to-filesystem --help` and the global `--help`: no `--progress-fd`,
no JSON progress. So SP+ must keep measuring for itself. Do not plan a fix
around a bootc feature that is not there.

## The fix for cycle40

1. **Sample on a clock, not on bootc's chatter.** A background sampler with its
   own `sleep`, writing progress independently of whether bootc has printed
   anything. It must stop cleanly when the deploy finishes.
2. **Derive the denominator; never hardcode it.** Take the real image size
   rather than a 5 GB guess, and make a wrong guess degrade gracefully instead
   of pinning at 99.
3. **Measure something that reflects the deploy, not the scratch archive.**
   The import writes its large temporary archive through the `/var/tmp` bind
   into the target, so a naive `df` on the target counts scratch as progress.

**Acceptance is a recorded install**, not a code read: the bar advances
visibly and monotonically through the deploy with no stall longer than a few
seconds, and the number tracks work actually done. A bar that lies smoothly is
not a fix. Two previous attempts (`spplus-installer-progress`,
`spplus-installer-progress-v2`) were verified only by reading the code, and both
shipped broken. That is the trap to avoid this time.
