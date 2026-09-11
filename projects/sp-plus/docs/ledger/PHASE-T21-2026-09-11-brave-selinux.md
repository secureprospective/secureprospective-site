# T2.1 — SELinux confinement for Brave: mechanism proven, policy blocked, with a number

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Status:** **Not shipped.** Nothing from this investigation is in the t28 image.

This entry exists because "blocked on real carrier portals" was an assumption. It is now
a measurement, and the measurement says something more useful than the assumption did.

## What was proven to work

Run live on the t28 guest, nothing shipped:

- A **CIL policy module loads and applies** on the running image. No reference-policy
  headers are needed, and `selinux-policy-devel` is absent from the image but is an
  ordinary Fedora package, not a new trust root.
- The **domain transition works**. Brave was confirmed running as
  `unconfined_u:unconfined_r:brave_t:s0-s0:c0.c1023` via `ps -eZ`.
- **Brave keeps working inside the domain.** Three real pages loaded, exit 0 each.
- `checkmodule`, `semodule_package`, `semodule`, `semanage` and `audit2allow` are all
  already present in the image.

So the mechanism is not the hard part, and the next attempt does not have to rediscover
it. The working skeleton is preserved at the bottom of this file.

**One wrinkle worth knowing:** `/usr/lib/opt/brave.com/brave/brave-browser` is a 1 KB
launcher script, not the browser binary, and `/usr` is read-only on ostree so relabelling
must happen at image build time. The live experiment used a bind-mounted relabelled copy.

## What blocks it, measured

A permissive domain with no baseline policy is what a first attempt ships. Measured cost
of that, from **three headless page loads**:

| Measure | Value |
|---|---|
| AVC denials logged | **2,163** |
| Denials involving `brave_t` | 2,163 |
| Distinct (permission, type, class) triples | 145 |
| Largest single contributor | `write tmp_t dir`, 1,896 of them |

Three static pages, no GUI, no downloads, no printing, no camera, no PWAs, no
extensions. A real advisor browsing for a day would generate this by orders of
magnitude. **That is a journal flood on a machine nobody can support, so a bare
permissive domain is rejected on measurement, not on taste.**

The flood is suppressible: 145 distinct triples is a tractable baseline and
`audit2allow` generates it. But **a baseline derived from three headless pages covers a
small fraction of the real surface.** The remainder is GUI, GPU, audio, camera, printing,
file upload and download, PWAs, and carrier portals — which is precisely the workload
that is unavailable here.

**So the block is not "we lack a test", it is "we lack the workload the policy must be
derived from."** Those are different claims and the second one is the true one.

## Why it cannot simply ship enforcing

Doc 15's day-one rule. A confinement policy that passes on a VM and blocks a carrier's
document upload costs an advisor a submission, which is the worst outcome SP+ can
produce. Enforcing without the real workload is exactly the trade the rule forbids.

## What would unblock it

1. Run the advisor's real Brave workload on the Dell with a permissive `brave_t` and
   **collect the AVC log**: two carrier portals with a real document upload, a print from
   inside the browser, every installed PWA, a download, and a video call using camera and
   microphone.
2. Generate the baseline from that log with `audit2allow`.
3. Ship permissive with the baseline, confirm the residual denial rate is near zero in
   daily use.
4. Only then flip to enforcing.

Step 1 is the only one that needs Christopher. Steps 2 through 4 are ordinary work.

## The working skeleton, preserved

```cil
(type brave_t)
(typeattributeset domain (brave_t))
(typepermissive brave_t)
(type brave_exec_t)
(typeattributeset file_type (brave_exec_t))
(typeattributeset exec_type (brave_exec_t))
(typeattributeset entry_type (brave_exec_t))
(roletype unconfined_r brave_t)
(allow unconfined_t brave_exec_t (file (execute read open getattr map)))
(allow unconfined_t brave_t (process (transition siginh rlimitinh noatsecure)))
(allow brave_t brave_exec_t (file (entrypoint execute read open getattr map)))
(typetransition unconfined_t brave_exec_t process brave_t)
```

## Two measurements in this investigation reported a clean result while measuring nothing

Recorded because both were nearly believed.

1. **`ausearch -m avc -ts "$MARK"`** with the timestamp passed as a single quoted
   argument matched nothing, and reported **0 denials** for a run that had actually
   produced 2,163. Even `ausearch -m avc -ts today` returned `<no matches>`. Counting
   from the journal is what produced a true number.
2. **A positive control is what caught it.** A throwaway permissive domain doing
   something plainly forbidden logged 9 denials with `permissive=1`, proving the counter
   could produce a non-zero at all. Without that control, "zero denials from a permissive
   browser domain" would have been written down as a remarkable result instead of a
   broken query.

**A zero that you cannot make non-zero on demand is not a measurement.**

## And the umask defect, for the fourth time

`sudo cp` of the Brave launcher produced a **0750** file under SP+'s own `UMASK 027`, so
the test user could not execute it and every run exited 126. Same root cause as the
`resolved` drop-in that silently disabled DNS over TLS and the `/run` file an
unprivileged restore could not read. See the T2.3 ledger for the general rule.
