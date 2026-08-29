# SP+ RESUME — 2026-08-29, compact #19

## 1. WHAT WE ARE DOING

Finish SP+, an immutable bootc/Fedora-Kinoite-44 workstation OS for non-technical financial
advisors. **NEW DEADLINE: Fedora 45 lands in ~6 weeks (mid-Oct 2026) and Christopher intends to
market SP+ openly at that point.** His instruction, verbatim: "lets make sure every step we take
from now on is good, well thought out and stable. Verified." Current Fedora-44 line is pre-alpha.

- Repo (Beelink): `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`. CT105 is where I run. I am headbrain.
- **THE DELL (bare metal test rig): `192.168.1.124`, user `test`, password `password`.**
  Key auth from BOTH CT105 and Beelink is installed — prefer keys, never put the password in a
  command. Passwordless sudo. It runs cycle43. 4 cores, 7.8 GB RAM, spinning HDD, no GPU.
  **IT IS VERY SLOW. Slow is not broken.** Christopher is often sitting at it.
- Build: `cd <repo> && bash /home/chris/sp-plus-iso-build.sh` — **run WITHOUT sudo**.
  ISO lands at `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/`.

## 2. AGENTS + HARNESSES

- `/root/run-bee.sh <brief> [timeout]` — RESEARCH ("write nothing to disk").
- `/root/run-bee-apply.sh <brief> [timeout]` — APPLY (requires edits on disk + real gate output).
  **Using the research harness for a fix lane wastes the entire run.**
- `THINKING=high`, brief is a FILE, STDOUT is the findings channel, auto-REJECT under 1500 bytes.
  Never two dispatches at once.
- Runs: `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`. Briefs: `/root/briefs/`.
- Bee transcript (the liveness signal AND the recovery channel):
  `chris@192.168.1.190:/home/chris/.pi/agent/sessions/--home-chris--/*<tag>*.jsonl`

## 3. IN-FLIGHT WORK — ONE DISPATCH IS RUNNING

**Bee, Welcome-app QC on the Dell.** Started 2026-08-29T20:21:42Z, 2700 s cap (ends ~21:06Z).

- Brief: `/root/briefs/spplus-dell-qc.md` (now ~11.5 KB).
- Run dir: `/root/bee-runs/20260829T202142Z_spplus-dell-qc/`
- **Alive check:** transcript mtime, NOT the artifacts.
  `ssh ... 'S=$(ls -t ~/.pi/agent/sessions/--home-chris--/*dell-qc* | head -1); date -u -r "$S"'`
- **If dead/timed out:** pull that JSONL — the findings are in it even when `out` is empty.
- **What to do with the result:** triage as LEADS. Independently re-measure any CPU claim from
  `/proc/<pid>/stat` deltas before believing it.
- **Known incident during this run:** at 20:32Z Bee left a foreground QtWebEngine app
  (`spplus-qc-harness`) running on the Dell; it blocked its own shell for 11 minutes. I killed it
  BY PID (6916) at 20:44Z and Bee resumed within 4 seconds. The brief now forbids foreground GUI.

**Nothing else is running.** QEMU cycle43 VM reaped this turn; ISO build finished.

## 4. WHAT WAS PROVEN THIS SESSION — DO NOT RE-TEST

cycle43 (`sha256:dc85bfcd8852801c0520f13de398d5ae79f1b8bdf416941fcff6d9d5c17d5468`) is built,
in `~/Downloads/SP-PLUS-cycle43.iso` (5451427840 B,
sha256 `4f45542a481b843d5ef413974e0bbc42ce98f218c9d9cc494ac6e1d2868db358`), and INSTALLED ON THE
DELL — digest on the Dell matches the Beelink build exactly.

| Fix | Proven where | Evidence |
|---|---|---|
| No-NIC install | QEMU + Dell | `Begin Installation` live with zero network devices |
| DN-27 mandatory user | QEMU | spoke blocked, then "Administrator advisor will be created" |
| DN-28 weighted progress | QEMU | bar 143→375→517→718→771 px of 1070; was 98→122 px on cycle42 |
| DN-29 home directory | QEMU **and Dell** | Dell: `/var/home/test drwx------. 15 test test` |

**DN-29 root cause, now CONFIRMED (was a hypothesis):** the journal proves the FIRST-BOOT UNIT
created the home, not `%post` — `spplus-mkhomedir[1104]: SP+ home: created /var/home/advisor`.
Install-time creation really does evaporate. Had we only "fixed" the `%post` loop it would have
failed again on bare metal.

Commits this session: `2edbfc1` (DN-29+DN-28), `f3e5255` (gate realignment), `f6ca999` (ISO-44
queue), `d42007a` (DN-30 policy).

## 5. HYPOTHESES REFUTED — DO NOT RETEST

1. **"bootc re-initialises /var at first boot, discarding %post writes."** REFUTED by reading
   `rpm_ostree/installation.py`: `PrepareBootcMountTargetsTask` runs after deploy, before %post,
   bind-mounts `/ostree/deploy/<stateroot>/var` and creates `/var/home` itself.
2. **"stateroot is empty, so the bind-mount path is wrong."** REFUTED: `pykickstart/commands/
   bootc.py` defaults `--stateroot` to `"default"`, and the same string feeds both the mount path
   and `bootc install`.
3. **"authselect enable-feature with-mkhomedir is the fix."** REFUTED — it emits
   `pam_oddjob_mkhomedir.so`, which is NOT in this image. It would have broken EVERY login.
4. **"patch-anaconda-progress.py is broken."** REFUTED — it was correct but unweighted.
5. **"Bee was hung on the slow Dell."** REFUTED by measurement: 3.27 s CPU over 11 min, sleeping
   in `poll_schedule_timeout` = idle, not slow.

**Measurement traps that have burned this project (now FIVE occurrences of the last one):**
`ps pcpu` is a lifetime average — banned. `ls` prints LOCAL time, `date -u` prints UTC — use
`stat -c %Y` epoch arithmetic. `pgrep -f`/`pkill -f` MATCH YOUR OWN COMMAND LINE — kill by PID.
QEMU `sendkey` cannot send uppercase (`-RF` arrived as `-`); QEMU mouse clicks did not register
even with correct 0..32767 absolute coords — use keyboard. Anaconda's hub tab order is NOT the
visual order.

## 6. DECISIONS

**DN-30 — update and reboot policy. DECIDED by Christopher today.** Full record:
`projects/sp-plus/docs/ledger/DN-30-UPDATE-POLICY.md`.
- **Stable channel only, strictly.** No advisor machine rides a testing branch.
- **Updates 15:00 local, every other Friday** (even ISO weeks; next 2026-09-04, 09-18, 10-02).
  Download and STAGE only.
- **Reboots 04:00 local the following Sunday.** Automatic.
- Rationale: Friday afternoon the office is slow, so breakage surfaces with slack in the day;
  reboot happens when nobody is looking; advisor arrives Monday to a fresh login screen.
- **Break-glass emergency path: APPROVED this turn, NOT YET WRITTEN INTO DN-30.** Must reuse the
  SAME staging/signing machinery as the fortnightly path — a route only exercised in a real
  emergency is a route that has never been tested. Stages immediately, reboots that night.
- Christopher's framing to preserve: **"assume it works now, watch it in real time later."**

## 7. HARD CONSTRAINTS THAT ARE NOT NEGOTIABLE

- **Signing ships BEFORE auto-pull.** `/etc/containers/policy.json` is currently
  `insecureAcceptAnything`. Unattended pull + accept-anything = any image published under that
  name lands on every advisor machine.
- **`ghcr.io/secureprospective/sp-plus-kde:edge` returns 401 — NOT PUBLISHED.** Every installed
  machine already points there as its update source. The update mechanism is wired but DEAD.
- Never re-add npm to the payload image. Pi is pinned at 0.84.3 in `/usr` and npm is deliberately
  removed so no advisor machine can pull arbitrary code. Pi's self-updater failing is the
  DESIGN WORKING. Fix = update the image, not the machine. (npm latest is 0.84.4.)
- Never reboot the Dell or restart its compositor/plasmashell without asking — Christopher uses it.

## 8. NEXT ACTIONS, IN ORDER

1. **Wait for Bee's Dell QC** (ends ~21:06Z). Triage as leads; independently re-verify CPU claims.
2. **Christopher has "the next thing to discuss" queued** — he said so when calling this compact.
   Let him lead it.
3. **Write the break-glass path into DN-30**, structured for stability, then **compare notes with
   Bee** on the failure modes (emergency firing while a fortnightly update is staged; machine
   powered off through the window; catch-up after several missed cycles) — Christopher explicitly
   asked for this comparison BEFORE the build.
4. Implement DN-30 in ISO 44 with build gates in the DN-27/28/29 style.
5. Publish the image + replace `insecureAcceptAnything` with signature verification.
6. **Prove rollback on the Dell deliberately** before any advisor depends on it.
7. Triage the Fedora-45 live-installer research when it returns.

## 9. HONEST STATUS

cycle43 is the first build that installs and boots to a usable desktop on real hardware. The
Welcome app has been SEEN to launch on the Dell; its eight verbs have NOT been independently
verified by me — that is what Bee is doing now, and its report is leads until re-measured.

Update policy is DECIDED but ENTIRELY UNIMPLEMENTED and unproven in the field. Six weeks to
Fedora 45. The critical path is not features — it is publishing + signing + a proven rollback,
because without those the fleet cannot be updated at all.
