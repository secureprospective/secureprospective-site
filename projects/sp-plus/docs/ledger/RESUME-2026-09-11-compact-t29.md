# SP+ RESUME — defense-in-depth branch, 2026-09-11 (post security write-up)

## 1. WHAT WE ARE DOING

Ran each of doc 15 §7's five moves through its own build, install, boot and verify
cycle, then left a finished ISO in Christopher's Downloads for him to test himself.
**That deliverable is done and shipped.** The last work in this window was a full
security architecture and evidence report for expert review.

- Repo: `beelink:~/work/secureprospective-advisor-os`, branch `session/sp-plus-defense-in-depth`
- Head: **`23105ab`**. **Tree clean.**
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Guest: `ssh -p 2222 -i ~/.ssh/spvm test@127.0.0.1` from the Beelink. Passwordless sudo.
  LUKS `spplustest`, login `testtest`.
- Harness: `tests/spplus-testvm.sh {install <ISO> <name>|up|down|info|nuke}`.
  **Argument order is ISO first, name second.** Getting it backwards prints "no such ISO".

## 2. NOTHING IS IN FLIGHT

No builds, no dispatches, no agents. Every SP+ domain is `shut off`. Filing gate
PASS at 23 entries. 292 G on `/`, 127 G on `/home`. Nothing to recover.

**`fedora-dnd-test` is CHRISTOPHER'S OWN VM. Confirmed by him 2026-09-11. Do not
touch it, do not shut it down, do not count its 8 CPUs and 8 G against build
headroom as if it were reclaimable.** The SP+ domains are `spplus-test`,
`fedora-alpha-test` and `SP-Alpha-Rig`; those are the only ones this work may act on.

## 3. THE DELIVERABLES, BOTH IN PLACE

```
~/Downloads/sp-plus-defense-in-depth-20260911.iso
sha256  038795fe96b734015d941967eca9b63a96318ab90ee5d9ece0b843be68016c94
bytes   5497683968
payload localhost/sp-plus-kde:t29  7d38a2ff4fc2e341f71e6b561170ca765d9b62295b186987f6a4dda46985c1e8
plus    .iso.sha256 and .README.md beside it

~/Downloads/SP-PLUS-SECURITY-ARCHITECTURE-2026-09-11.md
1,705 lines, 12,316 words, 85,590 bytes
also committed as projects/sp-plus/docs/16-SECURITY-ARCHITECTURE-AND-EVIDENCE.md
```

**The t28 ISO that previously carried this filename is superseded.** Its checksum began
`951fe34f`. The README beside the ISO says so explicitly. Do not resurrect it.

## 4. SCORECARD — do not re-derive

| Move | Result |
|---|---|
| 1 Phase 0 Secure Boot lane | Done, verified |
| 2 Phase S signature policy | Verified in the image. **Not shippable** until the published ghcr image is re-signed in the readable format. Christopher's decision, still open |
| 3 Tier 1 (T2.4 kargs, T2.6 login) | Done, verified |
| 4 T2.2 Flathub verified subset | Done, verified |
| 5 Tier 2 remainder | **Three shipped, one deferred by decision.** T2.3, T2.7, T2.5 shipped. T2.1 deferred under D50 |

**80 of 80** runtime controls measured on a genuine first boot of t29, zero failed system
units, zero failed user units. Gate went 48 → 80 across the session; every new assertion
mutation-tested red before green.

## 5. DECISIONS TAKEN THIS WINDOW — do not relitigate

- **D49** — `hardened_malloc` dropped from doc 15. `glibc.malloc.tcache_count=0` ships
  instead, described as smaller. Taken on Christopher's explicit delegation
  ("Ask Bee, then give me your recommendation, i dont know").
- **D50** — SELinux confinement for Brave deferred. Permissive domain NOT shipped.
  Reopens on one hour of real browser use on real hardware with the audit log kept.
- Bee was consulted via `/root/run-bee.sh` before both. Its answer is at
  `/root/bee-runs/20260911T114044Z_spplus-t25-t21-merge/out` (4,716 bytes) and it
  independently reached the same three conclusions.

## 6. HYPOTHESES REFUTED — DO NOT RETEST

1. **`glibc.malloc.check=3` is NOT a usable substitute for hardened_malloc.** It is
   INERT on glibc 2.43. `ld.so --list-tunables` faithfully reports it as 3. The
   implementation moved into `libc_malloc_debug.so` in glibc 2.34 and that library is
   **not in the image** (`ls /usr/lib64/libc_malloc_debug.so*` → No such file). A
   deliberate heap overflow behaved identically set and unset.
2. **`glibc.malloc.perturb` is inert for the same reason.** Double-free abort message
   byte-identical to baseline.
3. **`glibc.malloc.tcache_count=0` IS real.** Proven by a changed abort path:
   `free(): double free detected in tcache 2` → `double free or corruption (!prev)`.
   Cost 5.8% on 2M malloc/free pairs, nothing measurable on Brave/LibreOffice/Node.
4. **`GLIBC_TUNABLES` DOES propagate into a Flatpak sandbox.** Verified by reading it
   back from inside one. Sandbox glibc 2.42, host 2.43.
5. **`/etc/environment` does NOT reach an ssh session on Fedora.** `pam_env` is stacked
   in `/etc/pam.d/su`, `sddm-autologin` and `sddm-greeter` only — NOT in `sshd` or
   `password-auth`. Measure that layer through `su`.
6. **`sudo tr '\0' '\n' < /proc/PID/environ` does not work.** The shell opens the
   redirect before sudo runs, so the read is unprivileged → "Permission denied". Use
   `sudo cat ... | tr`.
7. **`systemd-run --user` does not inherit the working directory.** A relative path to
   LibreOffice fails with "source file could not be loaded". Use absolute paths.
8. **A SYSTEM flatpak install over ssh is polkit-denied** ("Flatpak system operation
   Deploy not allowed for user") because the session has no seat. Not a defect. Use
   `--user` scope to measure.
9. **T2.1 mechanism is proven, the baseline is not.** CIL loads without refpolicy
   headers, Brave transitions to `brave_t` (confirmed via `ps -eZ`), Brave keeps working.
   Blocker: 2,163 AVC denials from three headless page loads, 145 distinct triples. The
   working CIL skeleton is preserved in
   `docs/ledger/PHASE-T21-2026-09-11-brave-selinux.md`. **Do not redo the investigation.**
10. **The test VM cannot exercise Brave realistically** — it hangs on network page loads
    and only renders `file://` reliably. This is why T2.1 needs real hardware.

## 7. LEDGER STATE — all committed, tree clean

```
23105ab docs(sp-plus): security architecture and evidence report, doc 16
830023b ledger(sp-plus): t29 is the deliverable, 80 of 80, move 5 resolved
c88c7e2 fix(sp-plus): two T2.5 assertions measured the wrong thing
10497ab docs(sp-plus): record D49 and D50, supersede T2.5 in the roadmap
ff1f347 feat(sp-plus): T2.5 ships glibc tcache policy, not hardened_malloc
85cbeab ledger(sp-plus): T2.5 measured, glibc alternative refuted
834dcbe ledger(sp-plus): compact-safe resume at t28 (SUPERSEDED by this file)
```

Nothing written but uncommitted.

## 8. KNOWN DIRT — recorded, not hidden

- **`artifacts/t28-iso/` (5.2 G) could not be reaped.** Its files are root-owned by the
  rootful podman build and Beelink sudo permits podman ONLY, so `rm -rf` returns
  Permission denied. Not urgent — 292 G free. Needs one `sudo rm -rf` from Christopher.
- **`/dev/sdX` incident, resolved.** Christopher ran the relay's `dd` with the literal
  placeholder and no stick attached, creating a 5.5 G regular file in devtmpfs (RAM).
  He removed it; memory recovered. **Lesson: never put a destructive command with a
  literal placeholder in a relay batch.** The current `paste.md` leaves the device blank
  and forces a confirm step first.
- The **threat model (doc 14) is stale in four places** — T5, T6, T8 and §6 item 8 are
  all better than it says. Doc 16 §3 names the discrepancy. Doc 14 should be updated.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for Christopher's hardware results.** He has the ISO and `paste.md` step 3
   writes the stick to `/dev/sda` (28.7 G SanDisk, confirmed present). The gate that
   matters now is him using the machine: printing, dock, real Wi-Fi, suspend/resume,
   carrier portal with an upload, a 12-character password.
2. **Act on whatever he reports.** A control that breaks his day gets pulled under D44,
   not negotiated.
3. **Get his decision on re-signing the published ghcr tag.** That is the only thing
   between move 2 and shippable. Publishing is fleet-wide and needs him specifically.
4. **Update doc 14** to match doc 16 §3, so the threat model stops understating the
   current posture.
5. Optional, his call: D47 (sshd installed but disabled) and D48 (vouching by name for
   Zoom and Signal).
6. Optional, costs him an hour: the T2.1 audit log on the Dell.

## 10. RELAY / ENVIRONMENT NOTES

- Commands Christopher runs go in `/root/paste.md` then
  `scp -i /root/.ssh/beelink /root/paste.md chris@192.168.1.190:/home/chris/Downloads/paste.md`.
  A Stop hook enforces this; it fires on code blocks containing `sudo` even when they
  hold no commands.
- **Beelink sudo permits `podman` ONLY.** Anything else needs Christopher.
- Bee dispatch: `THINKING=high /root/run-bee.sh <brief.md> <timeout>`. Briefs in
  `/root/bee-briefs/`, runs in `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`.
  The `bee-dispatcher` SUBAGENT did not execute across three attempts earlier in this
  session; the shell harness works. Use the harness.
- Commit messages: write to a file and `git commit -F`. Inline heredocs through ssh break
  on apostrophes (this cost an amended commit earlier).

## 11. HONEST STATUS

The build-and-verify work is **finished** and the artifacts are real. What is genuinely
unproven is everything that needs Christopher's hardware: no printer, no dock, no real
Wi-Fi, no suspend/resume, no carrier portal has been tested. Eighty passing assertions say
the image holds its posture on a VM. They say nothing about his Dell.

Two controls are deliberately absent and must not be marked green to close a scorecard:
browser confinement (D50) and hardened_malloc (D49). Both have their reasons and their
reopening triggers written down.
