# The update support standard and the live-log sampler

**Date:** 2026-09-13
**Branch:** `session/sp-plus-defense-in-depth`
**Status:** Ready for review. Committed, **not pushed** (see Open items).

## What changed

- **`projects/sp-plus/docs/UPDATE-SUPPORT-STANDARD.md`** (new, 291 lines). Standing
  doctrine, not a ledger entry: the update lane end to end, the stranded-machine
  defect and the remediation with its reversal, the measured resource numbers from the
  Dell, the WiFi fragility, the two open greeter defects, the eight gates G0 to G7,
  the live-log format, the method rules, and a roadmap of what is still unproven with
  how to prove each.
- **`projects/sp-plus/tests/update-sampler.sh`** (new, executable). The instrumentation
  the standard requires.

Tasks 2 and 3 of the brief are one document on purpose, and the document says so.
Each gate exists because a specific thing went wrong, and those reasons are its first
six sections. Split in two, the table gets read without its reasons and the two files
drift.

## Why
Brief at `~/fleet/briefs/tom-spplus-site-and-standard.md`: turn what was learned on
2026-09-13 into durable things so nobody relearns it. Evidence base is
`docs/ledger/2026-09-13-real-shape-of-a-distribution-update.md` (`d25326d`, `7575e6b`).
Nothing in it was re-derived.

## Verification
- `bash -n` clean; the sampler was **run and observed** on the Beelink for four cycles,
  producing real PSI memory and io, per-device diskstats, top-5 RSS and canary lines.
- **The canary's FAIL branch was mutation-tested** through `SPPLUS_CANARY_BIN` and
  reports `canary=FAIL(...)`. A gate whose failure path has never run is not known to
  work.
- Fixed one real hole found by running it: the booted-digest header printed empty
  rather than `unknown` on a machine without bootc.
- No SP+ machine was touched. The Dell and the VM were left alone, as instructed.

## Open items / what Claude or Christopher should check

1. **Not pushed, deliberately.** Since my commit `e45dcd4`, another agent committed
   `4cdcf94` to this same branch. Pushing would carry that commit up too, and it is
   not mine to publish. Standing instruction is to stay out of CT105's way rather than
   pick a winner, so I stopped and am asking.
2. **One value in the brief was wrong and the repo was right**, which is the reverse
   of the usual direction: the brief's ISO sha256 `74a8e71c...` is correct, and it was
   the *site repo* that carried the stale v0.11.4 hash. Fixed on the site side.
3. **The R2 token is still unrotated.** Referenced in the standard's roadmap, never
   copied anywhere.
