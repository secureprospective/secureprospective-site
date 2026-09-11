# T2.3 — DNS over TLS, opportunistic

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Move:** doc 15 §7 item 5, Tier 2 remainder, one control per build
**Payload:** `localhost/sp-plus-kde:t27`

## What shipped

`/usr/lib/systemd/resolved.conf.d/90-sp-plus-dot.conf`, mode 0644:

    DNSOverTLS=opportunistic
    DNSSEC=allow-downgrade

## The honesty note, which is not optional

**Opportunistic DNS over TLS protects against a passive observer only.** An active
attacker blocks port 853 and watches the plaintext fallback. It must never be described
to an advisor as "encrypted DNS" without that qualifier, and the Security Evidence
Report must carry the limitation, not just the control.

`DNSOverTLS=yes` would close the downgrade. It is **rejected**, because it turns every
hotel and airport captive portal into "the internet is broken" in a room with nobody to
call. That is the exact failure the day-one rule forbids. The build gate refuses `yes`.

## Why it is captive-portal safe — measured, not assumed

Outbound TCP 853 blackholed with nftables on the guest, which is the worst case a portal
can present, since a drop costs a full timeout where a reject is instant.

| Condition | Resolved | Encrypted | 5 queries |
|---|---|---|---|
| 853 reachable | 5/5 | 5/5 | 0.40s |
| 853 blackholed, first pass | 5/5 | 0/5 | 6.61s |
| 853 blackholed, second pass | 5/5 | 0/5 | 0.27s |

Resolution never failed and a plain HTTP fetch returned 200 throughout. **The fallback
verdict is cached per server**, so the roughly six second penalty is paid once on joining
a DoT-hostile network rather than on every query. An advisor joining hotel Wi-Fi
experiences a few sluggish seconds once, then normal speed.

`DNSSEC=allow-downgrade` for the same reason: it validates where the upstream supports
DNSSEC and stops asking where it does not, rather than failing the query, so a portal's
forged answers are downgraded rather than rejected and the portal page still loads.

## The defect this control exposed, which matters beyond T2.3

**A drop-in that systemd-resolved cannot read is silently ignored. No log line. The
daemon simply keeps its previous setting.**

The first measurement run reported the config applied and the control working. It was
neither. `/etc/systemd/resolved.conf.d/90-sp-plus-dot.conf` had been created by a root
shell and landed **mode 0640 in a 0750 directory**, because SP+'s own `UMASK 027` from
T2.6 applies to root shells. `systemd-resolved` runs as its own user and could not read
it. Every query in that run was plaintext while the run reported success.

What made it convincing was that `systemd-analyze cat-config` **runs as root**, so it
printed the drop-in's contents happily. The configuration looked applied from every
angle except the one that mattered: the daemon's live D-Bus property, which still said
`no`.

Two consequences, both acted on:

1. **The build gate asserts mode 0644 on the file and 0755 on the directory**, with the
   reason written next to the check, because a future hand will otherwise "fix" the
   permissive-looking mode and silently disable the control.
2. **The posture gate reads the live D-Bus property and issues a real query**, never the
   file. This is the same lesson as `lesson_config_file_is_not_behaviour`, arriving by a
   new route: not "the config is wrong" but "the config is right and unread."

**General rule for SP+ from here: T2.6's umask means any config created by a root shell
on a live machine defaults to 0640, and every daemon that runs as its own user will
ignore it silently.** Image content is unaffected, because container build steps use the
default 0022, but anything written on a running machine is exposed.

## Assertions added

Five, in `tests/runtime-posture-gate.sh`:

- `DNS over TLS opportunistic` — resolved's live D-Bus property.
- `DNSSEC allow-downgrade` — same.
- `captive portals still usable` — goes red if the machine has acquired `DNSOverTLS=yes`.
- `resolved drop-in readable by resolved` — the silent-disable failure above.
- `a real query is encrypted` — the only one that proves the control is doing work
  rather than being switched on. Network-dependent by nature: on a network whose
  resolver has no DoT this is red, and that is the honest answer, not a false green.

## Mutation results

**71 of 71 green on a real t27 boot.** Two mutations on the live guest, both red:

| Mutation | Result |
|---|---|
| Shadow the drop-in with `DNSOverTLS=no` in `/etc` | 2 red: the mode assertion correctly stayed green, because the file really is readable and the fault is elsewhere |
| Bind-mount a 0640 copy over the drop-in | 4 red, including `resolved drop-in readable by resolved`, which named the cause |

The second mutation is the one that matters. It reproduces the exact silent failure
found while measuring this control, and the gate now catches it and says why.

## One assertion that was wrong and passed anyway

`tr -d 's" '` was used to strip the D-Bus wrapper off the property value. `tr -d`
deletes every listed character wherever it appears, so it also ate the letter `s`
**inside the value**: `opportunistic` arrived as `opportunitic` and the assertion went
red against a control that was working perfectly.

The instructive part is the neighbouring assertion. `DNSSEC=allow-downgrade` contains no
letter `s`, so it passed through the identical broken parser unharmed. **A parsing bug
that damages one value and not the next reads as a real failure of the first control.**
Fixed by taking the last field and keeping only the characters a resolved mode can
contain, which names no quote character and so cannot be mangled by a quoting layer.
