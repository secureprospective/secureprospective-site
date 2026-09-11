# Defense-in-depth branch — where the five moves landed

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Deliverable:** `~/Downloads/sp-plus-defense-in-depth-20260911.iso`
sha256 `951fe34f667f14c7e4177f7dbe1f4ca80bef86e0a84476505dfb960aeab1b144`
payload `localhost/sp-plus-kde:t28`, image id `b8311826c58d…`

## Scorecard

| Move | doc 15 §7 | Result |
|---|---|---|
| 1 | Phase 0, Secure Boot test lane | **Done and verified** |
| 2 | Phase S, signature policy | **Verified in the image, not shippable** — the published ghcr image needs re-signing in the readable format. Christopher's decision |
| 3 | Tier 1 invisible hardening | **Done and verified.** T2.4 kernel arguments, T2.6 login policy |
| 4 | T2.2 Flathub verified subset | **Done and verified**, re-verified on t28's first boot |
| 5 | Tier 2 remainder, one control per build | **Two of four done.** T2.3 and T2.7 shipped and verified. T2.1 blocked on real carrier portals. T2.5 blocked on a trust-root decision |

**Move 5 was not one decision, and treating it as one was my error.** I first recorded
all four of its controls blocked. Two of them were not. Measuring the baseline instead
of reasoning from the roadmap text is what separated them:

- **T2.7** was recorded blocked on a real dock. Fedora already ships
  `wifi.cloned-mac-address=stable-ssid`, so Wi-Fi randomization had been live in SP+
  since day one without incident. The dock risk lives entirely in the **wired** half,
  which can simply be declined. Blocking the safe half on the risks of the half we were
  never going to ship was wrong.
- **T2.3** was recorded blocked on a real captive portal. `DNSOverTLS=opportunistic`
  falls back to plaintext by construction, and blackholing port 853 on the guest is a
  faithful and harsher stand-in for a portal than a hotel is. Resolution never failed.

Neither correction lowered the bar. Both controls are measured, mutation-tested, and
carry an explicit statement of what they do **not** protect against.

## The gate is the asset

`tests/runtime-posture-gate.sh` went from 48 assertions to **75**. Every one of the 27
added this session was **mutation-tested red** on an image or a machine state lacking
its control. Assertions that read configuration rather than measure behaviour are
labelled as such in their own output, so nobody mistakes one for the other.

## Ten checks that measured nothing and passed anyway

One family, one rule: **a check that cannot produce a negative result is not evidence.**
Every one of these was written, believed, and then caught — most by running a mutation,
not by re-reading the code.

**Absence checks that matched their own explanatory comment:**
1. A build gate matched `mitigations=` inside its own comment.
2. A build gate matched `even_deny_root` inside its own comment — the same mistake, a
   second time, the same session.
3. A wait loop matched `GATE FAIL` inside the echoed text of *passing* gates and
   reported a build failure that had not happened.

**Checks structurally incapable of failing:**
4. `grep -c ':'` on `faillock` output counted the `<user>:` header, returning 1 for an
   account with zero recorded failures.
5. The slab assertion counted alias symlinks where this kernel publishes directories,
   returning 0 on hardened and unhardened machines alike.
6. Counting occurrences of a wanted NetworkManager value stayed green while a
   higher-priority section overrode it to `random`.
7. Then taking the **last** matching line was exactly backwards:
   `NetworkManager --print-config` emits sections in **descending** precedence.

**Probes that never reached the thing they claimed to test:**
8. `sudo -u X cmd` authenticates the **invoking** user, never X. Twelve wrong passwords
   never touched the target's auth stack.
9. `script -qec` exits 127 — the image does not ship `script(1)` — so every attempt was
   a silent no-op.
10. `nmcli GENERAL.PERM-HWADDR` is not a field NetworkManager 1.56 has. The query
    errored and the assertion went red against a working control. **A check that can
    never pass is as useless as one that can never fail.**

**The rules that fall out, now written into the gate next to the checks:** strip
comments and echoed text before any absence grep; anchor markers to line start; take the
effective value, not a count and not a guess at precedence; and prove the check can
produce both answers before trusting either.

## The defect that reaches past the control that found it

**A config file the daemon cannot read is silently ignored. No log line. The old setting
simply persists.**

`systemd-resolved` runs as its own user. A drop-in created by a root shell under SP+'s
own `UMASK 027` from T2.6 lands **0640** and is invisible to it. What made this
convincing is that `systemd-analyze cat-config` runs as **root**, so the configuration
looked applied from every angle except the daemon's live D-Bus property.

The same trap fired twice more in the same session: a mutation helper wrote `/run/real-mac`
at 0640 and the unprivileged restore could not read it back.

**General rule for SP+: T2.6's umask means anything a root shell creates on a live
machine defaults to 0640, and every daemon running as its own user will ignore it
without complaint.** Image content is unaffected, because container build steps use the
default 0022. Both the build gate and the posture gate now assert the mode, with the
reason written beside the check so nobody "tidies" it away.

## Artifact reconciliation

Three t22 ISOs were built during move 4. Builds two and three share a payload image id
and differ only in the ISO wrapper, which is not byte reproducible; build three exists
only because it was the first to carry a `payload.env` sidecar. The T2.2 ledger recorded
build two's checksum without saying any of that, which would have read as "the" T2.2
artifact. It now carries the full table and points at t28 as the artifact of record. The
control itself is re-verified on t28 on a genuine first boot.

## Harness integrity, proven in both directions

The `payload.env` sidecar is fully exercised. The **refusal** path was verified earlier.
The **rewrite** path fired for the first time during the t24 mutation install, catching
a tree that said `t26` against an ISO carrying `t24`. That was the last open item on the
verification-integrity defect.

## Still waiting on Christopher

1. **Phase S re-sign** of the published ghcr image. Until then the update lane cannot use it.
2. **D47** — sshd ships installed but disabled.
3. **D48** — the `flathub-vouched` remote, SP+ vouching by name for Zoom and Signal.
4. **T2.5 trust root** — Secureblue's COPR, a vendored build, or drop the control. The
   argument against is in the blocked ledger: SP+ is Electron-heavy and that is exactly
   what `hardened_malloc` is documented to break.

## The one control genuinely left undone

**T2.1, SELinux confinement for Brave.** It needs real carrier portals, a real upload and
a print from inside the browser. A VM has no carrier account and no printer. A
confinement policy that passes on a VM and blocks a carrier's document upload costs an
advisor a submission, which is the worst failure SP+ can produce.
