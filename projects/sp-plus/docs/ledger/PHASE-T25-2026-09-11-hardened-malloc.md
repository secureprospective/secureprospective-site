# PHASE T2.5 — hardened_malloc, and the in-repo alternative measured

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Status:** **resolved and shipped as a reduced control.** `hardened_malloc` dropped
(D49); `glibc.malloc.tcache_count=0` ships in t29 and is measured in effect.
**Evidence:** `~/logs/sp-plus/t25-malloc-20260911T113641Z/` on the Beelink — four probe
scripts, their logs, and `results.txt`.

## 1. Why T2.5 is blocked

Doc 15 Tier 2 names `hardened_malloc` specifically. It is in **none of the four repositories
SP+ ships**. Secureblue builds it in their own COPR
(`copr.fedorainfracloud.org/coprs/secureblue/`). The unofficial alternatives are
`divestedcg/rpm-hardened_malloc` and a fork of it.

Taking any of them adds a **fifth trust root** to an image whose whole supply-chain story is
that it has four and signs what it publishes. That is a decision about what SP+ vouches for,
not an implementation detail, so it is not mine to make.

Two further facts, both from Secureblue's own tracker and documentation, not from inference:

- The configuration that actually *enables* `hardened_malloc` is not shipped inside their RPM.
  Installing the package is not the same as turning the allocator on.
- The documented breakage class is **Electron applications**. SP+ ships Brave, Zoom and Signal.
  That is most of the advisor's day.

## 2. The question I could answer without Christopher

**Is there an in-repo heap hardening lever that needs no new trust root?**

Measured on the t28 guest, glibc 2.43, against the real applications. Three candidates.

### `glibc.malloc.check=3` — INERT. Do not ship it.

`ld.so --list-tunables` reports it faithfully:

```
--- baseline ---                  glibc.malloc.check: 0 (min: 0, max: 3)
--- with glibc.malloc.check=3 --- glibc.malloc.check: 3 (min: 0, max: 3)
```

It does nothing. Since glibc 2.34 the malloc checking implementation lives in
`libc_malloc_debug.so`, and **this image does not contain that library**:

```
ls: cannot access '/usr/lib64/libc_malloc_debug.so*': No such file or directory
```

A deliberate heap overflow behaved identically with the tunable set and unset. A deliberate
double free aborted identically in all three arms — caught by glibc's *default* tcache
integrity check, which is always on and owes nothing to the tunable.

This is the **fourth** appearance this session of a control that reads as applied and is not:
the resolved drop-in at 0640, the `/run/real-mac` file, the Brave launcher at 0750, and now
this. The difference is that here the *reporting tool itself* says the value is set. Shipping
it would have produced a green line in the Security Evidence Report for zero security.

### `glibc.malloc.perturb=204` — INERT, same reason.

The double-free abort message was byte-identical to baseline. `perturb` moved to
`libc_malloc_debug.so` alongside `check`.

### `glibc.malloc.tcache_count=0` — REAL, and small.

It is in libc proper, so it works. Proven by a change in the abort path, not by a config read:

```
baseline   free(): double free detected in tcache 2
tcache0    double free or corruption (!prev)
```

Different message means a different code path means the allocator genuinely changed.

**What it buys:** the per-thread cache is removed. tcache poisoning is one of the most
commonly used heap primitives, and it is gone. That is one primitive.

**What it is not:** `hardened_malloc` gives guard pages, randomised allocation, isolated size
classes and delayed reuse. `tcache_count=0` gives none of those. Offering it as "T2.5 done"
would be exactly the scorecard padding this session has refused elsewhere.

**What it costs — measured, three runs, median:**

| Workload | Baseline | tcache_count=0 |
|---|---|---|
| 2,000,000 malloc/free pairs | 1.307 s | 1.383 s |
| Brave headless page load | 0.42 s | 0.42 s |
| LibreOffice convert to PDF | 0.47 s | 0.49 s |
| Node 22 allocation churn | 0.19 s | 0.18 s |

5.8% on a pure allocator microbenchmark, which is the worst case that exists. Nothing
measurable on any real application. Brave produced an identical 271-byte DOM every run,
LibreOffice an identical 371,410-byte PDF, Node exited 0 every run.

**It reaches Flatpaks too.** `GLIBC_TUNABLES` propagates into the sandbox, verified by reading
it back from inside one:

```
GLIBC_TUNABLES inside sandbox: [glibc.malloc.tcache_count=0]
sandbox glibc: 2.42      host glibc: 2.43
```

## 3. Harness notes, so the next window does not re-learn them

- A **system** Flatpak install over SSH is polkit-denied: `Flatpak system operation Deploy not
  allowed for user`. There is no seat, so the session is not active. An advisor sitting at the
  machine is active and this does not apply. Use `--user` scope to measure.
- The guest was **restored to its gated state** afterwards: app uninstalled, the temporary
  user remote deleted, `~/.local/share/flatpak` removed. `flatpak remotes` is back to the
  three SP+ ships. The 75/75 gate result still describes this machine.
- The first probe run reported an empty output directory for the LibreOffice hardened arm.
  Re-running the identical command in the open produced the PDF. It was a harness artifact in
  profile creation, not a defect in the control. **Reported here because a discrepancy that
  resolves on retry is still worth writing down.**

## 4. What is decided and what is not

Decided: **the glibc alternative does not substitute for `hardened_malloc`.** Two of the three
candidate tunables are inert and the third is a single primitive. T2.5 stays open.

Not decided, and genuinely Christopher's:

1. Add Secureblue's COPR as a fifth trust root, vendor and build `hardened_malloc` inside the
   SP+ build so no new root is added, take `tcache_count=0` as a small separate win, or drop
   T2.5 from doc 15 with this ledger as the reason.
2. Whether `glibc.malloc.tcache_count=0` ships on its own merits. It is cheap, measured, and
   honest, but it is **not** T2.5.

---

## 5. Resolution — what shipped, and what it measured

Christopher delegated the call. `hardened_malloc` is dropped (D49) and
`GLIBC_TUNABLES=glibc.malloc.tcache_count=0` ships across three layers:
`/etc/environment` for `pam_env`, `/usr/lib/environment.d/` for the systemd user manager
that the Plasma session and therefore Brave inherit, and `DefaultEnvironment` for system
services.

**Two build gates, both behavioural.** The second one runs a deliberate double free inside
the build and asserts the abort came from a different code path:

```
baseline: free(): double free detected in tcache 2
hardened: double free or corruption (!prev)
T25_MALLOC_BEHAVIOUR_OK tcache genuinely disabled, proven by a changed abort path
```

Mutation-tested inside the t28 image across four arms before it was believed: green only
for the real tunable, red for no tunable, red for `glibc.malloc.check=3`, red for
`glibc.malloc.perturb=204`. The two inert tunables produce a red result, which is the
whole point — they are what a config-reading gate would have called green.

**Five runtime assertions, and two of them were wrong.** All five went red against the t28
guest first, as required. On t29 three passed immediately and two failed **against a
working image**:

- The system-service assertion ran `sudo tr '\0' '\n' < /proc/PID/environ`. The shell
  opens a redirect **before** `sudo` runs, so the read happened as the unprivileged user
  and returned "Permission denied", which the assertion saw as an empty answer. Fixed by
  making the privileged program the one that opens the file.
- The login assertion asked an ssh session for the variable. Fedora does not stack
  `pam_env` in `sshd` or `password-auth`, so it measured a stack that never reads
  `/etc/environment`. `/etc/pam.d/su` does stack it, so it now measures through `su` and is
  named for what it proves.

Both were mutation-tested again after correction. Moving `/etc/environment` aside empties
the `su` answer and restores on replacement; the service probe returns nothing for PID 1,
which predates `DefaultEnvironment`, and the tunable for NetworkManager.

**Result: 80 of 80 on a genuine first boot of t29, zero failed system units, zero failed
user units.**

## 6. Day-one check, which is the rule that governs all of this

Run on t29 through the systemd user manager, so the environment under test is the
desktop's and not ssh's — a plain ssh session does not carry the tunable and testing there
would have proved nothing.

| Workload | Result |
|---|---|
| Brave headless, 200,000 JavaScript objects | exit 0, DOM reports `alloc 200000` |
| LibreOffice convert to PDF | exit 0, 912,628 byte PDF |
| Node 22 allocation churn, 1.8M buffers | exit 0, `NODE_OK` |
| Flatpak remote query | exit 0, 55,256 bytes listed |
| CUPS status | exit 0 |
| GIO / GVFS | exit 0 |
| Failed units afterwards | 0 system, 0 user |

The converting process was confirmed to be carrying
`GLIBC_TUNABLES=glibc.malloc.tcache_count=0` at the time, so this is the hardened path and
not an accidental baseline.

**One harness note:** `systemd-run --user` does not inherit the working directory, so the
first LibreOffice run failed with "source file could not be loaded" on a relative path. An
absolute path converts fine. Recorded because a failure that resolves on retry still gets
written down.
