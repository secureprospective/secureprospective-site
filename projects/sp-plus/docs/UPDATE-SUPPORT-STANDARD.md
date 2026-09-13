# SP+ UPDATE SUPPORT STANDARD

**Standing doctrine. Not a ledger entry.** Ledger entries record what happened on a
date; this document records what is true until someone changes it, and what every
future release has to satisfy before it reaches an advisor.

It exists because on 2026-09-13 we ran the first true end-to-end support simulation
-- publish a version, get it onto a real advisor laptop remotely, watch a real person
log back in -- and it produced findings that are expensive to rediscover and one
defect that would have stranded every machine already in the field.

**Evidence base:** `docs/ledger/2026-09-13-real-shape-of-a-distribution-update.md`
(commits `d25326d`, `7575e6b`). Every number in sections 3 and 4 below was measured on
the Dell Inspiron 5737, not inferred from reading code. Do not re-derive them.

**Scope note.** Tasks 2 and 3 of the originating brief are both here rather than in
two files. The gates in section 7 are not arbitrary ceremony: each one exists because
a specific thing went wrong, and the reason lives in sections 1 through 6. Split
across two documents, the gate table would be read without its reasons and the
reasons would be read without their consequences, and the two would drift.

---

## 1. THE UPDATE LANE, END TO END

This is the whole mechanism. Nothing else in SP+ moves a machine from one image to
the next.

```
spplus-stage-update.timer
        |
        v
spplus-stage-update.service
        |
        v  (SPPLUS_UPDATE_CONTROL, default /usr/libexec/spplus-update-control)
spplus-update-control  {status | check | stage | apply | simulate | parse}
        |
        +--> bootc upgrade --check      writes the local update cache
        +--> bootc upgrade              stages the new image
        +--> /run/sp-plus/update-staged        marker: an update is staged
        +--> /var/lib/sp-plus/last-check       stamp: when bootc last actually answered
        |
        v
spplus-update-notify
        |
        +--> notify-send --action  (BLOCKS while the notification is on screen)
        +--> "Restart now"  -> org.kde.Shutdown.logoutAndReboot
        |                      falls back to `systemctl reboot`
        +--> "Later"        -> nothing; the staged image applies at the next shutdown
        +--> on failure     -> posts a failure notice rather than leaving a dead button
```

**Two facts about this diagram that are easy to get wrong.**

- `spplus-update-notify` sits in `activating (start)` for as long as the notification
  is on the advisor's screen. That is how you detect from a shell that the advisor is
  being asked something. It is not a hung unit.
- `/run` is tmpfs. The `update-staged` marker is *supposed* to vanish on reboot. An
  absent marker after a restart is correct behaviour, not a hole in the lane. This was
  misread once already.

**The two advisor paths are equally real.** "Restart now" and "leave it, it applies at
the next shutdown" both put the new image in place. The Dell was updated by the
shutdown path, which is a legitimate workflow -- and which is why the button's click
handler is still untested (section 8).

---

## 2. THE STRANDED-MACHINE DEFECT, AND WHY IT IS THE WORST CLASS OF BUG WE HAVE HAD

The shipped `spplus-update-control` (9,868 bytes) decided entirely from the *local*
bootc update cache:

| Cache state | What the old script did |
|---|---|
| **EMPTY** | Reported `current` / "This computer is up to date". Staged nothing. **Never contacted the registry.** Permanently. |
| **POPULATED** | Correctly decided an update existed and called `bootc upgrade`, which re-resolved `:latest` and staged the current image. |

Every fresh install begins with an empty cache, and **nothing in the shipped system
ever filled it.** The Dell's own journal shows four consecutive runs on Sep 11-12
reporting "already up to date, nothing staged" while it was genuinely behind. A
one-minute-old install from the 0.11 ISO said `current` with zero checks ever run.

No error. No failed unit. No signal of any kind to the advisor or to us.

**Why it is the worst class: the fix ships inside the update.** A machine with the
broken script cannot receive the update that repairs it. Every field machine was
stranded, and no amount of publishing could reach them. That is what makes the
remediation in section 4 a permanent part of this standard rather than a one-off.

### A claim made and withdrawn the same day -- recorded so it is not repeated
It was asserted mid-session that a stale cache would cause the old script to install
"a build we never released." **That is wrong, and it was stated to Christopher before
it was checked.** The stale cache is the *trigger* that makes the old script act; the
*payload* always comes from `bootc upgrade` re-resolving the tag. The stale cache
cannot install an old image; it can only fail to install a new one.

### The fix, shipped in v0.11.5
- `/var/lib/sp-plus/last-check`, written only after bootc has actually answered.
- `status` gains a fourth state, **`unknown`** -- "I have never successfully looked."
  The old script could not express this, which is precisely why it lied.
- `stage` runs its own `--check` first rather than trusting whatever is cached.

Proven on a fresh v0.11.5 install: never checked reports `unknown`; after a real check
it reports `current` and carries a timestamp saying when it looked.

---

## 3. THE REMEDIATION PROCEDURE FOR A STRANDED MACHINE

`/usr` is read-only on an image-mode system. The fixed script therefore goes to a
writable path and the unit is pointed at it by environment. No remount, fully
reversible, and the shipped script is never touched.

1. Copy the fixed `spplus-update-control` (14,255 bytes) to
   `/var/lib/sp-plus/spplus-update-control`. `chown root:root`, `chmod 755`.
2. Create
   `/etc/systemd/system/spplus-stage-update.service.d/10-fixed-update-control.conf`:
   ```ini
   [Service]
   Environment=SPPLUS_UPDATE_CONTROL=/var/lib/sp-plus/spplus-update-control
   ```
3. `systemctl daemon-reload`
4. Verify: `sudo /var/lib/sp-plus/spplus-update-control status` returns JSON.
5. `sudo systemctl start spplus-stage-update.service`

**Reversal:** delete the drop-in, `systemctl daemon-reload`. That is the whole undo.

**The rule that goes with it:** once the machine boots an image whose `/usr` carries
the fixed script, the drop-in is redundant and **must be removed**. It is a bridge onto
a stranded machine, not a fixture. A machine left with the drop-in is running code
that came from outside the signed image, which defeats the point of image mode. On the
Dell the remediation worked itself out of a job, which is the correct end state, and
G7 exists to enforce it.

---

## 4. RESOURCE REALITY ON OLD HARDWARE

Subject: Dell Inspiron 5737 laptop, i5-4200U, 7.6 GiB RAM, 1 TB 5400rpm HDD behind
LUKS+LVM, 18,737 power-on hours. Target `sha256:384e2c8a...`.

| Measure | Value |
|---|---|
| Wall clock to stage ~5.5 GB | **11m 44.8s** (65 of 289 layers already local; a cold run is longer) |
| CPU time | 4m 52.7s |
| cgroup memory peak | 2.1 G, almost all page cache, coexisting with 5+ GB available |
| Internal | import to checkout 75.5s, composefs 18.7s, final syncfs 3643ms |
| Disk free after | 56 GiB of 70 GiB. Space was never a constraint. |
| SMART after | PASSED. Reallocated 0, pending 0, uncorrectable 0, no ATA resets, no I/O errors |

### Memory exhaustion is REFUTED. Do not retest it.
Two prior sessions spent roughly two hours on the theory that staging wedged this
laptop by exhausting memory. Over **167 samples** across the full run:

- fork canary (`/bin/true` every cycle): **167 OK, 0 failures**
- `MemAvailable` never below **5,261 MiB** of 7,808
- `SwapFree` never moved a single page. The 7.6 GiB zram was untouched.
- PSI memory: `some avg10=0.00`, `full avg10=0.00`, and the cumulative total **never
  incremented** -- zero microseconds of memory stall for the entire run
- no OOM kill in dmesg

### What it actually is: I/O saturation
- PSI **io** climbed from 0.08 to a sustained 30-56, peak **56.05**, with `io full`
  tracking `io some` almost exactly. Every runnable task was stalled on disk.
- Load average went 0.02 to **5.88** on four cores while **CPU PSI stayed at 0.00**.
  That load is uninterruptible-sleep tasks waiting on a platter.
- SSH round-trip for `echo alive`: 0.45s, 3.5s, **17.0s**, 13.1s, 0.59s -- tracking the
  I/O curve exactly and recovering the instant the pull finished.

That 17-second round-trip is the reported "wedge" in miniature. Auth succeeds because
sshd forks without touching disk; execution hangs because every exec'd binary and
library must fault in from a saturated 5400rpm platter while PAM and logind writes
queue behind the same writeback.

**Slow is not wedged.** The operational consequence: a support person looking at a
machine in this state must not conclude it is dead, and must not power-cycle it.

**Still INFERRED, not proven:** that the original multi-hour wedge was this same
mechanism at greater severity. It was never reproduced. Closing it is on the roadmap.

### The disk's real risk is latency, not data loss
SMART is clean. The aging signal is `Load_Cycle_Count` at 1,602,496 (normalized 001,
end of rated life). This drive will be slow long before it loses anything.

---

## 5. KNOWN FRAGILITIES

**WiFi is a likelier cause of update failure than the disk on this hardware class.**
Hundreds of `iwlwifi: missed beacons exceeds threshold` during the staging window,
consistent with the previous session's `dial tcp ... i/o timeout` staging failure. A
5.5 GB pull over a link that drops is the failure mode we should expect first. Track
it separately from disk performance; they look alike from a distance and are not.

**The next test machine, an old HP laptop, has known WiFi driver difficulty.** Plan
for it: put it on a cable for the first run so that a failure is unambiguous.

---

## 6. OPEN DEFECTS, HONESTLY LISTED

Neither of these is a lockout. The silent one is the more dangerous.

1. **The lock-screen curtain.** The first keystroke lifts a full-screen clock before
   the password field is visible. No character was lost in testing, but the advisor is
   typing into a screen that shows them no field. This is the most likely origin of the
   original "the password field has no focus" report.
2. **A wrong password produces total silence.** Enter on an incorrect password changed
   nothing on screen -- no error, no shake, no message -- and wrote **no journal line
   at all**: no PAM attempt, no failure. The keypress never reached PAM. An advisor who
   mistypes gets no signal that anything was rejected, and will call us.

**A consequence for evidence-gathering, not just for the product:** because a failed
attempt writes nothing, **the absence of failure lines in a journal can never prove a
first-attempt success.** Do not read a clean journal that way.

The greeter is `plasmalogin.service` (plasma-login-manager). It is **not** sddm, and
`/etc/sddm.conf.d` is silently ignored on this system.

---

## 7. THE GATES

**A release is not shippable until every gate passes.** A gate that cannot produce a
negative result is not a gate; before trusting any of these, confirm it can fail.

| Gate | What is measured | Passing |
|---|---|---|
| **G0 Baseline** | Machine profile captured **before anything is touched**: RAM, swap and whether it is zram, disk model / `rotational` / SMART, free space on `/sysroot`, booted digest, **whether `cachedUpdate` is present or absent**, and the byte count of `/usr/libexec/spplus-update-control`. | The profile exists and is recorded. A run without a baseline cannot be interpreted afterwards, and the cache state is the single field that decides whether the machine is stranded. |
| **G1 Publish** | Image is signed; device policy in `/etc/containers/policy.json` is default **reject**, with sp-plus-kde requiring `sigstoreSigned` against `/etc/pki/containers/sp-plus-cosign.pub` with `matchRepository`. | Policy accepts the new digest, **and refuses it under a WRONG, freshly generated key.** Never mutation-test with an older published tag: those are signed too, so the test passes for the wrong reason and proves nothing. |
| **G2 Artifact** | The ISO actually in R2, verified by **content**. | A byte-range sha256 read from the object in the bucket matches the local build. **Size is not identity** -- v0.11.4 and v0.11.5 are both exactly 5,520,687,104 bytes. **Modtime is not identity** -- an S3 server-side copy updates it while leaving the old bytes in place, which is exactly what a suspiciously fast "upload" looks like. |
| **G3 Stage** | The lane stages the correct digest **on real hardware**, with the sampler of section 8 running. | `bootc status` shows the target digest staged, `/run/sp-plus/update-staged` carries it, and the sampler log covers the whole window. |
| **G4 Notify** | The advisor sees the notification **in their own session**. | **A screenshot.** A journal line proves a unit ran, not that a human was shown anything. |
| **G5 Apply** | The machine boots the new digest. | Booted digest is the target **and the previous digest is retained as rollback**. An update with nothing to fall back to is not a pass. |
| **G6 Greeter** | A human types their password, **with no clicking and no coaching**, and gets in. | They get in. **Test on HARDWARE.** A VM carrying an autologin drop-in shows no greeter at all after a reboot, so it cannot fail this gate and therefore cannot pass it either. |
| **G7 Posture** | The machine is back to shipped state. | Remediation drop-ins removed, running signed image code only, `sshd` off for a real release. |

---

## 8. LIVE LOGS: REQUIRED FOR EVERY UPDATE RUN

**Script:** `projects/sp-plus/tests/update-sampler.sh`, installed on the subject
machine and started **before** the risky step.

Rules that are part of the gate, not suggestions:

- **Detached via `systemd-run`.** A sampler that dies with your SSH session is not
  instrumentation, and the SSH session is the thing most likely to stall.
- **Writes to `/var/tmp`, never `/tmp`.** `/tmp` is tmpfs: the log is gone at exactly
  the reboot you wanted it across, and it competes for the memory under measurement.
- **Every 5 seconds**, capturing: timestamp, `MemAvailable` / `SwapFree` / `Dirty`,
  loadavg, **PSI memory AND PSI io**, per-device diskstats, top-5 processes by RSS,
  and **the fork canary**.
- **The fork canary** runs `/bin/true` each cycle and records `OK` or
  `Cannot allocate memory`. It is the one measurement that separates "slow" from
  "cannot fork", and it is what killed a two-session-old wrong theory in a single run.
  PSI io without it tells you the disk is busy; it does not tell you the machine is
  still alive.
- **Confirm it is growing before you start the risky step.** `wc -l` the log twice,
  ten seconds apart. A sampler that was never running produces the same empty evidence
  as a machine that never logged anything.

### Method rules that cost real time. Do not relearn these.

- **Never run `bootc upgrade --check` by hand on a subject machine.** It fills the very
  cache under test. Doing this once produced a false "the lane works" and contaminated
  the Dell before the session that finally measured it.
- **Exit codes prove nothing.** Gate on the sentinel file and read the artifact.
- **An absence check matches its own comments.** Strip comments before asserting a
  string is missing, and prove the check *can* fail.
- **Nested ssh plus a heredoc silently does nothing and exits 0.** `scp` a script and
  run it. Every time.
- **Anchor `pgrep -f`.** Unanchored, it matches your own ssh command string. That
  happened five times in one session.
- **`systemctl start spplus-stage-update.service` is the same code path as the timer
  but is NOT the timer firing.** Say which one you did. A field simulation wants the
  timer.

---

## 9. ROADMAP: WHAT IS STILL UNPROVEN, AND HOW TO PROVE IT

| Unproven | How to close it |
|---|---|
| **The timer has never fired the lane unattended on hardware.** Every run so far was started by hand. | Leave a machine on past the timer window with the sampler running, touch nothing, and read `systemctl show spplus-stage-update.timer -p LastTriggerUSec` afterwards. |
| **The "Restart now" button has never been pressed by a human.** The Dell updated via the shutdown path. The click handler is untested. | A person presses it, on hardware, with G4's screenshot taken first. Faking the reboot proves the reboot, not the button. |
| **The severe multi-hour wedge was never reproduced**, so the I/O explanation is inferred from a milder instance. | Repeat from a **genuinely cold** ostree repo (the measured run had 65 of 289 layers local; `rpm-ostree cleanup -pbrm` does NOT restore virgin conditions, and neither does deleting the ostree ref -- use a fresh install). Add `/proc/<pid>/stack` and `vmstat 1` `procs_blocked` to the sampler. |
| **Whether a click on the password field was needed at the Dell greeter.** Not a lockout, but it decides whether advisors need coaching. | Watch a person do it, on hardware, without telling them anything first. |
| **The two greeter defects (section 6) have no fix.** | Product work, not a test. The silent rejection is the one that generates undiagnosable support calls. |
| **The R2 token is still unrotated.** It was exposed in a `ps` listing during the first upload, and is readable by any local user for as long as that process lives. | Rotate it in the Cloudflare dashboard, update `~/.config/sp-plus-r2/env` (mode 600), and re-run `publish-iso-r2.sh check`. Nothing in this repo or on the site carries the value. |
