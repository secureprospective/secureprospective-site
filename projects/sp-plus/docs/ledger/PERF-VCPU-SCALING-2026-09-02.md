# vCPU scaling test + the noise floor — 2026-09-02

ISO under test: `~/Downloads/sp-plus-1.0-test56-20260902.iso` (unchanged between arms).
Harness: `~/fleet/bin/spplus-bench-vcpu.sh` — a copy of `spplus-bench.sh` with
`VCPUS`, `PREFIX` and `OWNER_TITLE` made env-overridable (3 lines) so arms run under
their own domain prefix. Runner: `~/fleet/bin/vcpu-arm.sh`.
Logs: `~/logs/sp-plus/vcpu-scaling/{vcpu8,vcpu4}/`.

## Results — deploy phase (Installation complete minus deploy start)

| Run | vCPU | Conditions | Deploy |
|---|---|---|---|
| instrumented-20260902T120925Z | 4 | uncontended | **493.0 s** |
| vcpu8 (arm A) | 8 | contended with a Tom install | **487.2 s** |
| vcpu4 (arm B) | 4 | contended with a Tom install | **459.5 s** |

## FINDING 1 — doubling vCPUs does not speed up the deploy phase

The 8-vCPU arm landed BETWEEN the two 4-vCPU runs. The fastest run of the three was a
4-vCPU run. There is no evidence that the deploy phase benefits from more cores.

Combined with the earlier host sampling (245% avg CPU of 400%, disk idle, iowait 5%),
the picture is a pipeline that is CPU-hungry but NOT widely parallel: throwing cores at
it does nothing. **"Add parallelism" is not a lever.** The lever, if there is one, is
doing less work per object.

**Do not re-run this test at higher core counts hoping for a different answer** unless a
guest-side profile first shows a specific parallelisable stage.

## FINDING 2 — the noise floor is ~33 s, and it invalidates single-run comparisons

Two runs of the IDENTICAL 4-vCPU configuration differed by **33.5 s** (493.0 vs 459.5),
about 7%. Part of that is host contention, which is exactly why it must be budgeted for:
this is a shared workstation, not a clean bench.

**Consequence — this is the important one:**

- Any single-run A/B difference smaller than ~35 s is NOISE and means nothing.
- This morning's "test56 installs 10.9 s slower than test55" is **not a real difference.**
  Do not cite that number. The broader conclusion (byte reduction produced no large win)
  still stands, because the retracted estimator predicted a ~7 s effect for 100 MB and
  that is far below what we can resolve.
- Most optimisations worth attempting are smaller than 35 s. We cannot see them one run
  at a time.

**STANDING RULE, effective now: every performance comparison runs at least 3 times and
reports the MEDIAN plus the spread.** `spplus-bench.sh` already takes a run count as its
second argument and reports median/min/max. We had been passing `1`. Stop doing that.

A single run is now only acceptable for answering "did it break", never "is it faster".

## Method note worth keeping

`spplus-bench.sh` hardcodes `PREFIX="spplus-bench"` and its `destroy_ours` tears down
`spplus-bench-r1` at startup. Running two copies concurrently would have destroyed the
other run's VM. Any concurrent benchmarking MUST override the domain prefix first. The
harness's own `assert_ours` guard (prefix AND owner title) is what makes that safe.
