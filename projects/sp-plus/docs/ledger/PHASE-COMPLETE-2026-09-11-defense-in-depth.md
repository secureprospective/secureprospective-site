# Defense-in-depth branch — where the five moves actually landed

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Deliverable:** `~/Downloads/sp-plus-defense-in-depth-20260911.iso`
sha256 `66b98f66a966691c3f1d83e5d33b0a1b38f12d5dd345ed11ac79d6841a45dfa4`

## Honest scorecard

| Move | doc 15 §7 | Result |
|---|---|---|
| 1 | Phase 0, Secure Boot test lane | **Done and verified** |
| 2 | Phase S, signature policy | **Verified in the image, not shippable** — the published ghcr image needs re-signing in the readable format. Christopher's decision |
| 3 | Tier 1 invisible hardening | **Done and verified.** T2.4 kernel arguments, T2.6 login policy |
| 4 | T2.2 Flathub verified subset | **Done and verified** |
| 5 | Tier 2 remainder, one control per build | **Not done. Blocked, each with a named test** — see `PHASE-T2-REMAINDER-2026-09-11-blocked.md` |

**Four of five moves are complete. Move 5 is not, and the ISO does not pretend it is.**
T2.1, T2.3 and T2.7 are blocked on a real carrier portal, a real captive portal and a
real dock, none of which a VM can produce. T2.5 is blocked on a trust-root decision:
`hardened_malloc` is in none of the four repositories SP+ ships, so it needs either an
external repo or a vendored build, and that is standard-setting.

Calling any of those green off a VM run is precisely the failure the roadmap was
written to prevent.

## The gate is the asset

`tests/runtime-posture-gate.sh` went from 48 assertions to **66**, and every one of the
18 added this session has been **mutation-tested red** on an image or a machine state
that lacks its control. The gate measures effect, never configuration text, with one
assertion explicitly labelled `(policy read)` in its own output so nobody mistakes it
for a measurement.

## Five checks that measured nothing and still passed

The recurring defect of this session, all one family: **a check that cannot produce a
negative result is not evidence.** Each was written, believed, and then caught.

1. **A build gate matched `mitigations=` inside its own explanatory comment.**
2. **A build gate matched `even_deny_root` inside its own explanatory comment** — the
   same mistake, made a second time, in the same session.
3. **A wait loop matched `GATE FAIL` inside the echoed text of passing gates** and
   exited early reporting a build failure that had not happened — the third time.
4. **`grep -c ':'` on `faillock` output counted the `<user>:` header**, returning 1 on
   an account with zero recorded failures.
5. **The slab assertion counted alias symlinks** where this kernel publishes
   directories, returning 0 on hardened and unhardened machines alike.

**The rule that falls out of this: any check for the ABSENCE of something must strip
comments and echoed text before it greps, and must be shown failing before it is
trusted.** Three of the five above were absence checks matching their own prose.

## Two more probe shapes that measured nothing

Specific to faillock, and worth not repeating:

- **`sudo -u X cmd` authenticates the INVOKING user, never X.** Twelve wrong passwords
  never touched the target account's auth stack.
- **`script -qec` exits 127** — the SP+ image does not ship `script(1)`, so every
  attempt was a silent no-op.

The working probe drives `su(1)` under a real pty from `python3` and asserts **exactly
10** recorded failures, because the count stopping at the threshold is the account
actually locking. It travels to the guest as base64 so that no ssh, heredoc or shell
quoting layer can mangle a backslash.

## Harness integrity, now proven in both directions

The `payload.env` sidecar fix is fully exercised. The **refusal** path was already
verified. The **rewrite** path fired for the first time during the t24 mutation
install, catching a working tree that said `t26` against an ISO carrying `t24` and
correcting it. That was the last open item on the verification-integrity defect.

## Day-one rule, measured rather than reasoned about

- `harbour ledger spring` — no digit, no capital, no symbol — is accepted.
- A short password is refused in plain English.
- Home stays `700`, the advisor's own files stay readable, CUPS stays active, the KDE
  greeter authenticates through the hardened stack, zero failed units.
- `enforce_for_root` and `even_deny_root` are both absent, so a lockout is always
  clearable and recovery is never locked out by the policy it enforces.

## Still waiting on Christopher

1. **Phase S re-sign** of the published ghcr image. Until then the update lane cannot
   use it.
2. **D47** — sshd ships installed but disabled.
3. **D48** — the `flathub-vouched` remote, SP+ vouching by name for Zoom and Signal.
4. **T2.5 trust root** — external repository, vendored build, or drop the control.
