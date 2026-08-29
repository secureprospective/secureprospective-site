# DN-30 — SP+ update and reboot policy. DECIDED by Christopher, 2026-08-29.

Status: DECIDED. Not yet implemented. Implementation lands in ISO 44.

## The decision, verbatim in intent

- **Stable only, strictly.** Advisor machines follow a `:stable` channel. Nothing an advisor owns
  ever rides a testing branch.
- **Updates: 15:00 local time, every other Friday.** Download and stage only. No reboot.
- **Reboots: 04:00 local time, the Sunday following that Friday.** Automatic.

## Why (Christopher's reasoning, recorded so it is not relitigated)

Friday afternoon the office is slow. If an update breaks something, it surfaces while there is
slack in the day and somebody can act on it. The reboot happens when nobody is looking, and the
advisor arrives Monday to a fresh machine sitting at the login screen. Non-intrusive, regular,
predictable — three properties that matter more than speed for this audience.

## Cadence anchor

"Every other Friday" has no native systemd expression. Use ISO-week parity with a fixed anchor:

- Update fires on Fridays where `ISO week number` is **EVEN**.
- Reboot fires on the Sunday two days later (that Sunday is in the FOLLOWING ISO week, odd).

Verified next occurrences:

| Update (Fri 15:00 local) | ISO week | Reboot (Sun 04:00 local) |
|---|---|---|
| 2026-09-04 | 36 (even) | 2026-09-06 |
| 2026-09-18 | 38 (even) | 2026-09-20 |
| 2026-10-02 | 40 (even) | 2026-10-04 |

## Implementation notes — the traps, decided in advance

1. **The reboot must be conditional.** Reboot ONLY if an update was actually staged. A machine
   that received nothing must not reboot. Check `bootc status` for a staged deployment; no staged
   image means no reboot, silently.
2. **The update timer may be `Persistent=true`; the reboot timer must NOT be.** A missed Friday
   should catch up on next boot — it only downloads. A missed Sunday reboot must NOT fire late:
   `Persistent=true` on the reboot would restart the machine the moment an advisor powers on
   Monday morning, mid-workday. Missed reboot waits for the next scheduled Sunday.
3. **Local time is the machine's timezone**, deliberately. An advisor in Denver gets 15:00 Denver.
   systemd `OnCalendar` is local by default — do not force UTC.
4. **Warn on the Friday.** Welcome shows a plain-language notice after a successful stage: the
   computer updated and will restart Sunday at 4am. Unsaved work in a session left open over the
   weekend WILL be lost at reboot. Say so in the notice, in those words.
5. **Signing is a hard prerequisite.** `/etc/containers/policy.json` currently reads
   `insecureAcceptAnything`. Auto-pull MUST NOT ship before signature verification replaces it.
   Unattended pull plus accept-anything means any image published under that name lands on every
   advisor machine. This ordering is not negotiable.
6. **Rollback must be proven, not assumed.** Deliberately roll back a real deployment on the Dell
   and confirm the machine boots the prior image, BEFORE any advisor depends on this.
7. **Staged rollout still applies.** Publish to stable only after the build has been proven on the
   Dell. "Stable" is a promise, not a tag name.

## OPEN — raised, not yet decided

**A strict 14-day cadence means a critical vulnerability sits unpatched for up to 14 days.** Brave
ships security fixes far faster than fortnightly, and SP+ freezes it. This is the one place the
policy trades real risk for predictability.

Recommendation: a break-glass path — an `emergency` marker that stable machines also honour,
used rarely and deliberately, that stages immediately and reboots that night rather than waiting
for the fortnight. It preserves the predictable rhythm for the 99% case without leaving a known
exploited bug on advisor machines for two weeks.

NOT implemented, NOT decided. Needs Christopher's call.

## Process note

Per the standing quality gate, an architecture decision of this class goes to an independent
expert-AI panel before it becomes doctrine. The cadence above is Christopher's call and stands;
the panel should be aimed at the failure modes — conditional reboot, missed-window behaviour,
and the emergency path — not at relitigating the schedule.
