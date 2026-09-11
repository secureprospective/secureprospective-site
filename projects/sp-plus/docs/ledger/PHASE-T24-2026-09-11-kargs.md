# Phase T2.4 — kernel hardening arguments

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Commit:** `cf84bc8`
**Image:** `localhost/sp-plus-kde:t24` (`7ab3f824161a`)
**ISO sha256:** `e16133c7c1112373452a678ea14c1137a083873706c3715f036bc6c1bb9ef352`
**Roadmap row:** doc 15 Tier 2, control T2.4

## What ships

Six arguments in `/usr/lib/bootc/kargs.d/20-sp-plus-hardening.toml`, a second
file rather than an edit to the splash one, so rolling back a security control
never touches the LUKS passphrase prompt.

| Argument | What it buys | Cost to the advisor |
|---|---|---|
| `init_on_alloc=1` `init_on_free=1` | zeroes allocations on both ends, turning most use-after-free and uninitialised-memory bugs into a crash rather than a leak | a few percent of memory bandwidth, invisible on a desktop |
| `randomize_kstack_offset=on` | per-syscall kernel stack randomisation | negligible |
| `slab_nomerge` | distinct caches keep distinct backing memory | slightly more memory |
| `vsyscall=none` | removes the last fixed-address executable page, a classic ROP anchor | only pre-2013 static binaries need it, SP+ ships none |
| `pti=on` | page table isolation regardless of what the CPU claims about its errata | measurable on syscall-heavy work, not on this workload |

**`mitigations=auto,nosmt` is deliberately absent.** Disabling SMT halves the
usable cores on the advisor's laptop, felt every day in the browser and in
LibreOffice, to defend against cross-thread side channels that require the local
code execution this entire tier exists to prevent. Doc 15 section 4 rejects it.
A build gate now fails if anyone reinstates it, and a runtime assertion fails if
it reaches the command line.

## The control is self-healing

All six arguments were stripped from `/boot/loader/entries/ostree-1.conf` and
confirmed gone from the file. After a reboot they were back and the gate still
read 58 of 58.

The deployment owns the kernel command line: ostree regenerates the boot entry
from the image, so a local edit does not survive. Root on the machine cannot
quietly turn these off and have it persist. This is a stronger property than the
control was designed for, and it is the reason the mutation below had to be a
differently built image rather than a tampered boot entry.

## Evidence

| Measurement | Result |
|---|---|
| Runtime posture gate on the t24 install | 58 of 58, `RUNTIME_POSTURE_OK` |
| All six arguments on `/proc/cmdline` | present |
| `mitigations=` on the command line | absent |
| vsyscall lines in a live process map | 0 |
| Slab cache aliases summed across all caches | 0 |
| `X86_FEATURE_PTI` | set on 4 cpus |
| Kernel log | `Kernel/User page tables isolation: force enabled on command line` |

## Mutation test — red before green

Run against the pre-T2.4 `t22` image, installed through the corrected harness:

```
FAIL  karg init_on_alloc=1              absent from the installed cmdline
FAIL  karg init_on_free=1               absent from the installed cmdline
FAIL  karg randomize_kstack_offset=on   absent from the installed cmdline
FAIL  karg slab_nomerge                 absent from the installed cmdline
FAIL  karg vsyscall=none                absent from the installed cmdline
FAIL  karg pti=on                       absent from the installed cmdline
FAIL  no vsyscall mapping               1 vsyscall lines present
FAIL  page table isolation active       no pti flag in /proc/cpuinfo
passed=50 failed=8
```

## Three gate defects the work exposed

All three were in the gates, never in the image.

1. **The build gate failed on its own comment.** It grepped `mitigations=` across
   the whole kargs directory and matched the sentence explaining why that
   argument is absent. It now reads only non-comment lines, and the corrected
   form was re-proven able to fail on a real reinstatement before being trusted.

2. **The PTI assertion read the wrong file.**
   `/sys/devices/system/cpu/vulnerabilities/meltdown` reports whether the CPU
   carries the Meltdown *bug*, not whether the mitigation is running. On an AMD
   Ryzen 9 6900HX it printed `Not affected` while that machine's own kernel log
   said `force enabled on command line`. The assertion now reads
   `X86_FEATURE_PTI`, which the kernel sets only when isolation is actually on.

3. **The slab assertion could never fail.** It counted alias *symlinks* under
   `/sys/kernel/slab`. This kernel publishes all 566 caches as directories and no
   symlinks at all, so it returned 0 on hardened and unhardened machines alike.
   It now sums the `aliases` files, and is labelled in the gate as a **property
   assertion, not evidence the karg acted**: Fedora 44 already reports zero
   aliases without `slab_nomerge`, measured on the t22 install where all six
   karg assertions were red and this one still passed. Its job is to turn red if
   a future kernel default reinstates merging. The karg's own evidence is the
   command line assertion, which did go red.

## Harness defect — the lane could have verified the wrong image

Found while setting up the mutation, and more serious than anything in T2.4.

`tests/spplus-testvm.sh` built its kickstart from
`installer/interactive-defaults.ks` in the working tree. Every build rewrites the
payload ref in that file. Installing the t22 ISO therefore tried to deploy
`localhost/sp-plus-kde:t24`.

It failed loudly only by luck, because that image was not resolvable in the
installer's storage. **Had both images existed it would have installed the wrong
payload, printed `INSTALL OK`, and the posture gate would have been measuring a
machine that ISO never produced.** Every green result in this lane rests on the
assumption that the booted machine came from the ISO under test.

The fix is two-sided:

- `scripts/build-iso.sh` writes `payload.env` beside each ISO, recording the ref
  and image id **after** its existing ref and id checks pass. The ISO's directory
  belongs to the rootful builder, so the file is written through a container with
  that directory bind-mounted, the same way the artifacts around it were made.
- `tests/spplus-testvm.sh` reads that file, pins the generated kickstart to it,
  says so when it differs from the tree, and **refuses to install any ISO without
  one** rather than falling back to a guess. The refusal was verified before the
  sidecar existed.

## Open

- The kickstart-follows-the-ISO rewrite path has not yet been observed firing.
  Both installs since the fix had a tree ref that already agreed with the
  sidecar, because rebuilding an ISO re-pins the tree. The refusal path, which is
  the one that prevents a wrong install, has been verified.
