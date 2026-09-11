# SP+ RESUME — defense-in-depth branch, 2026-09-11

## 1. WHAT WE ARE DOING

Running each of doc 15 §7's five moves individually through a surgical build, test and
verify loop, then leaving a complete ISO in `~/Downloads` for Christopher to test
himself. Branch exists to see what we are capable of, in hope of merging to main.

- Repo: `beelink:~/work/secureprospective-advisor-os`, branch `session/sp-plus-defense-in-depth`
- Head: `3036861`. **Tree is clean.**
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Guest: `ssh -p 2222 -i ~/.ssh/spvm test@127.0.0.1` from the Beelink. Passwordless sudo.

## 2. NOTHING IS IN FLIGHT

No builds running. All three libvirt domains `shut off`. 21 G RAM free, 304 G on `/`,
132 G on `/home`. Filing gate PASS at 23 entries. Nothing to recover.

## 3. THE DELIVERABLE, ALREADY IN PLACE

```
~/Downloads/sp-plus-defense-in-depth-20260911.iso
sha256  951fe34f667f14c7e4177f7dbe1f4ca80bef86e0a84476505dfb960aeab1b144
payload localhost/sp-plus-kde:t28  b8311826c58db2ef9b65c4848da96eb0aad41c6561b5605d7db8f046f91c0e9c
```
Plus `.sha256` and a `.README.md` beside it. Checksum verified against the build record.
These are the exact bytes installed, booted and gated, not a rebuild.
`artifacts/t28-iso/` still holds the same ISO with its `payload.env` sidecar.

## 4. SCORECARD — the thing to not re-derive

| Move | Result |
|---|---|
| 1 Phase 0 Secure Boot lane | Done, verified |
| 2 Phase S signature policy | Verified in image, **not shippable** until the published ghcr image is re-signed in the readable format. Christopher's decision |
| 3 Tier 1 (T2.4 kargs, T2.6 login) | Done, verified |
| 4 T2.2 Flathub verified subset | Done, verified, re-verified on t28 first boot |
| 5 Tier 2 remainder | **Two of four.** T2.3 and T2.7 shipped and verified. T2.1 and T2.5 not |

**75 of 75** runtime controls measured on a genuine first boot, zero failed units. The
gate went 48 → 75 this session; all 27 new assertions mutation-tested red before green.

## 5. THE STOP HOOK WILL KEEP FIRING

The goal says "all 5 done checked and verified". It is 4 of 5 plus half of move 5, and
**that is the honest ceiling without breaking Christopher's own rules.** Do not mark
either remaining control green to satisfy the hook.

## 6. NEXT ACTION — I was interrupted mid-sentence here

I had just said I would **measure an in-repo alternative to `hardened_malloc` before
putting the T2.5 decision to Christopher**: `GLIBC_TUNABLES=glibc.malloc.check=3` and
related glibc hardening, which needs no new package and no new trust root.

1. Boot the t28 guest and test `glibc.malloc.check=3` against Brave, LibreOffice, Fin's
   node 22 and a Flatpak. Measure whether anything aborts. **Do not ship it** — doc 15
   names `hardened_malloc` specifically, and substituting a different mechanism and
   calling T2.5 done would be exactly the scorecard-padding I refused. Measure it as an
   *option to offer*.
2. **Then put the decision to Christopher with `AskUserQuestion`.** Three things are
   genuinely his and are blocking, not mine to resolve:
   - T2.5: add Secureblue's COPR as a trust root, vendor a build, take the glibc
     alternative, or drop the control from the roadmap.
   - T2.1: will he run one hour of real Brave use on the Dell under a permissive domain
     and keep the AVC log? That log is the only missing input.
   - Merge: does the branch go to main at 4.5 of 5, or wait?

## 7. T2.1 — DO NOT REDO THE INVESTIGATION

Full detail in `docs/ledger/PHASE-T21-2026-09-11-brave-selinux.md`. Nothing shipped.

**Proven working, do not retest:** a CIL module loads on the running image with no
reference-policy headers; the domain transition works, Brave confirmed as
`unconfined_u:unconfined_r:brave_t:s0-s0:c0.c1023` via `ps -eZ`; Brave kept working
inside the domain across three real page loads; `checkmodule`, `semodule_package`,
`semodule`, `semanage`, `audit2allow` are all already in the image. **The working CIL
skeleton is preserved in that ledger.**

**The measured blocker:** a permissive domain with no baseline produced **2,163 AVC
denials from three headless page loads**, 145 distinct triples, one repeated 1,896 times.
Journal flood, rejected on measurement. Suppressible with a baseline, but a baseline from
three headless pages covers a fraction of the real surface.

**Gotchas:** `/usr/lib/opt/brave.com/brave/brave-browser` is a 1 KB launcher script, not
the binary. `/usr` is read-only on ostree so relabelling must happen at build time; the
live experiment used a bind-mounted relabelled copy.

## 8. HYPOTHESES REFUTED — I WAS WRONG TWICE, DO NOT REPEAT

- **T2.7 was NOT blocked on a dock.** Fedora already ships
  `wifi.cloned-mac-address=stable-ssid`, so Wi-Fi randomization had been live since day
  one. The dock risk is entirely in the *wired* half, which we simply decline. Shipped.
- **T2.3 was NOT blocked on a captive portal.** `DNSOverTLS=opportunistic` falls back by
  construction. Measured with port 853 blackholed: 5/5 still resolved, HTTP 200
  throughout, ~6.6 s penalty **once** then cached. Shipped.
- **The `bee-dispatcher` agent never executed.** Three turns, it kept reporting it had
  not run anything. Do not rely on it without verifying real output; do the research
  directly or use a different lane.

## 9. THE DEFECT THAT KEEPS FIRING — umask 027, four times

T2.6 ships `UMASK 027`, so **anything a root shell creates on a live machine lands 0640**
and every daemon running as its own user ignores it **with no log line**. Worse,
`systemd-analyze cat-config` runs as root, so the config looks applied.

Four hits: the `resolved` drop-in that silently left DNS over TLS off; `/run/real-mac`
an unprivileged restore could not read; a `sudo cp` of the Brave launcher at 0750 that
made every run exit 126; and the original discovery. Image content is unaffected —
container build steps use 0022. Memory card: `lesson_unreadable_config_silently_ignored`.

## 10. TEN CHECKS THAT MEASURED NOTHING AND PASSED

Full list in `docs/ledger/PHASE-COMPLETE-2026-09-11-defense-in-depth.md`. The rules:
strip comments and echoed text before any absence grep; anchor markers to line start;
take the *effective* value, not a count and not a guess at precedence; and prove the
check produces both answers before trusting either. Two extra traps found late:
`ausearch -ts "$MARK"` with the timestamp as one quoted argument silently matches nothing
— count AVCs from the journal — and `tr -d 's" '` eats the letter s *inside* the value.

## 11. STILL WAITING ON CHRISTOPHER

1. Phase S re-sign of the published ghcr image.
2. D47 — sshd ships installed but disabled.
3. D48 — the `flathub-vouched` remote vouching by name for Zoom and Signal.
4. T2.5 trust root (see §6).

## 12. HONEST STATUS

The ISO is real, verified and in his hands. Four moves are genuinely complete and the
fifth is genuinely half done. The two open controls are blocked on real-world access and
on a decision Christopher reserved to himself — not on engineering effort, and not on
anything the next context window can grind out alone.
