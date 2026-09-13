# The real shape of an SP+ distribution update — measured, 2026-09-13

First end-to-end simulation of supporting real advisors. Subject: Dell Inspiron
5737 laptop (i5-4200U, 7.6 GiB RAM, 1 TB 5400rpm HDD behind LUKS+LVM, 18,737
power-on hours). Target: v0.11.5,
`sha256:384e2c8afbf1fdd485ea9555f258c1999decdf8e7158382e59955c4d304c3d3d`.

Method: head brain directed, Tom executed on the machine, Bee researched the
knowledge gaps from sources. Nothing here is inferred from code reading alone;
every number below was measured on the Dell.

---

## 1. THE DEFECT THAT STRANDS MACHINES — confirmed in the field

The shipped `spplus-update-control` (9,868 bytes) decides from the LOCAL bootc
update cache only. Its behaviour splits on whether that cache is populated:

| Cache state | What the old script does |
|---|---|
| **EMPTY** | Reports `current` / "This computer is up to date", stages nothing, **never contacts the registry**. Permanent. |
| **POPULATED** | Decides an update exists, calls `bootc upgrade`, which re-resolves `:latest` and stages the CURRENT image correctly. |

Every fresh install begins with an empty cache, and nothing in the shipped system
ever fills it. The Dell's own journal shows four consecutive runs on Sep 11-12
reporting "already up to date, nothing staged" while it was genuinely behind.

**The fix ships inside the update.** A machine with the broken script cannot
receive the update that repairs it. Existing field machines are stranded and
require an out-of-band remediation (section 4). This is the single most important
finding of the day.

### Corrected — a claim made and withdrawn the same session
It was asserted mid-session that a stale cache would cause the old script to
install "a build we never released." **That is wrong.** The stale cache is the
TRIGGER that makes the old script act; the PAYLOAD always comes from
`bootc upgrade` re-resolving the tag. Recorded because the wrong version of this
claim was stated to Christopher before it was checked.

## 2. THE WEDGE — memory exhaustion REFUTED, decisively

Prior sessions spent ~2h on the theory that staging wedged this laptop by
exhausting memory (SSH authenticates, then no command executes). Measured over
**167 samples** across a full 11m45s staging run:

- fork canary (`/bin/true` each cycle): **167 OK, 0 FAIL**
- `MemAvailable` never below **5,261 MiB** of 7,808
- `SwapFree` **never moved a single page** (7.6 GiB zram untouched)
- PSI memory: `some avg10=0.00`, `full avg10=0.00`, cumulative total **never
  incremented** — zero microseconds of memory stall
- no OOM kill in dmesg

**What it actually is: I/O saturation.**

- PSI **io** climbed 0.08 → sustained 30–56, peak **56.05**; `io full` tracked
  `io some` almost exactly, i.e. *every* runnable task stalled on disk
- load average 0.02 → **5.88** on 4 cores while **CPU PSI stayed at 0.00** —
  the load is uninterruptible-sleep tasks waiting on the platter
- SSH round-trip for `echo alive`: 0.45s → 3.5s → **17.0s** → 13.1s → 0.59s,
  tracking the I/O curve and recovering the instant the pull finished

That 17-second round-trip is the reported wedge in miniature. Auth succeeds
because sshd forks without touching disk; execution hangs because every exec'd
binary and library must fault in from a saturated 5400rpm platter, and PAM/logind
writes queue behind the same writeback. Bee reached the same mechanism from
documentation independently: *"a clean fork() failure would often produce an
immediate error, so an hours-long hang points at broad reclaim/I/O starvation at
least as strongly as a simple fork limit."* The duration was always evidence
AGAINST the memory theory.

**Still open (INFERRED, not proven):** that the original multi-hour wedge was this
same mechanism at greater severity. It was not reproduced. To close it: repeat
from a genuinely cold ostree repo (this run had 65 of 289 layers local) with
`/proc/<pid>/stack` and `vmstat 1 procs_blocked` added to the sampler.

## 3. WHAT STAGING COSTS ON BAD HARDWARE — the numbers

| Measure | Value |
|---|---|
| Wall clock | **11m 44.8s** (65 of 289 layers already local — a cold run is longer) |
| CPU time | 4m 52.7s |
| cgroup memory peak | 2.1 G (mostly page cache; coexisted with 5+ GB available) |
| Internal | import → checkout **75.5s**, composefs 18.7s, final syncfs 3643ms |
| Disk free | 56 GiB of 70 GiB after; space was never a constraint |
| SMART after | PASSED. Reallocated **0**, pending **0**, uncorrectable **0**, no ATA resets, no I/O errors |

The disk did not die and is not currently dying. Its aging signal is
`Load_Cycle_Count` 1,602,496 (normalized 001 — end of rated life). The risk this
drive poses is **latency, not data loss**.

**Unexpected fragility found: WIFI, not disk.** Hundreds of
`iwlwifi: missed beacons exceeds threshold` during the window, consistent with
the previous session's `dial tcp … i/o timeout` staging failure. The network is a
more likely cause of update failures on this class of machine than the HDD.
Track separately. (Relevant: the next test machine, an old HP laptop, has known
WiFi driver difficulty.)

## 4. THE REMEDIATION PROCEDURE — for stranded machines

`/usr` is read-only on an image-mode system, so the fixed script goes in a
writable path and the unit is pointed at it. Reversible, no remount.

1. Copy the fixed `spplus-update-control` (14,255 bytes) to
   `/var/lib/sp-plus/spplus-update-control`; `chown root:root`, `chmod 755`.
2. Create `/etc/systemd/system/spplus-stage-update.service.d/10-fixed-update-control.conf`
   with `Environment=SPPLUS_UPDATE_CONTROL=/var/lib/sp-plus/spplus-update-control`
3. `systemctl daemon-reload`
4. Verify: `sudo /var/lib/sp-plus/spplus-update-control status` returns JSON.
5. `sudo systemctl start spplus-stage-update.service`
6. **Reverse:** delete the drop-in, `daemon-reload`. The shipped script is
   untouched throughout.

Once the machine boots the new image, the drop-in is redundant (the fix is in
`/usr`) and should be removed.

## 5. THE ADVISOR-FACING CHAIN — what is now PROVEN

| Step | Status | Evidence |
|---|---|---|
| Image published + signed | PROVEN | ghcr `:latest` = 384e2c8a, accepted by policy, REFUSED under a wrong key |
| ISO in R2 | PROVEN | content-verified by byte range (v0.11.4/v0.11.5 are byte-identical in LENGTH — size proves nothing) |
| Lane stages on real hardware | PROVEN | Dell staged 384e2c8a in 11m45s |
| Marker written | PROVEN | `/run/sp-plus/update-staged` = 384e2c8a. (An earlier absence on the VM was tmpfs cleared by reboot, not a hole.) |
| **Advisor is notified** | **PROVEN** | Screenshot 09:01: *"SP+ is ready to update — A new version has been downloaded. Restart to put it in place, or leave it — it will be applied the next time you shut down."* + Restart now / Later |
| Advisor clicks Restart → boots new version | **NOT PROVEN** | must be a human press; faking it proves the reboot, not the button |
| Advisor logs back in at the greeter | **NOT PROVEN** | highest-risk gate, see below |

## 6. THE UNCLOSED RISK — the greeter

The password field has previously come up WITHOUT keyboard focus; the journal
showed it accepting an Enter and submitting an empty password. This lands
immediately after an update we pushed, on a machine an advisor cannot fix. Until
an advisor can sit down, type their password with no clicking and no coaching,
**the update path is not shippable regardless of how well staging works.**

The greeter is `plasmalogin.service` (plasma-login-manager), NOT sddm.

## 7. METHOD NOTES THAT SAVED OR COST TIME

- **Instrument BEFORE the risky run.** A detached `systemd-run` sampler writing to
  `/var/tmp` (never `/tmp`, tmpfs) every 5s produced the curve that settled a
  question two prior sessions argued about. The fork canary — run `/bin/true`,
  record OK/ENOMEM — is the single measurement that separates "slow" from
  "cannot fork".
- **Never run `bootc upgrade --check` by hand on a subject machine.** It fills
  the very cache under test. This contaminated the Dell before this session and
  produced a false "the lane works" earlier.
- `systemctl start spplus-stage-update.service` is the same code path the timer
  fires, but it is NOT the timer firing on its own. Full field simulation still
  wants the timer.
- Exit codes prove nothing; gate on the sentinel and read the artifact.
- The notification unit sits in `activating (start)` while the notification is on
  screen — that is how you detect from a shell that the advisor is being asked.

---

## 8. THE GREETER GATE — CLOSED on the Dell, with caveats

**Result: an advisor logged in at a real greeter immediately after the update
applied, on the target hardware. No lockout.**

Dell journal, post-update boot:
```
09:33:25  plasmalogin-greeter: session opened for user plasmalogin
09:34:36  pam_unix(plasmalogin:session): session opened for user dell(uid=1000)
09:34:41  greeter session closed
```
`/etc/plasmalogin.conf.d/` on the Dell is EMPTY — no autologin. This was a real
greeter and a real password authentication.

### The VM is NOT a faithful stand-in for this test
The VM carries `/etc/plasmalogin.conf.d/99-test-autologin.conf`
(`User=advisor`, `Session=plasma.desktop`, `Relogin=false`), so it autologins and
**shows no greeter at all after a reboot**. Any greeter conclusion drawn from the
VM is about a state the VM only reaches by force-terminating its session. Test the
greeter on hardware, or on a VM with the autologin dropin removed.

### Measured on the VM (pre-update image, focus only)
Typing blind with no click put **11 of 11 characters** into the password field;
a second pass with valid credentials logged in. The focus bug did NOT reproduce.
**Scope caveat:** this ran on the booted image `16c1924f…`, NOT post-update — the
VM reboot was blocked by the Beelink guardrail hook and was correctly NOT routed
around. The post-update focus question is answered only by the Dell.

### Two NEW user-facing defects found, neither a lockout
1. **The lock-screen curtain.** The first keystroke lifts a full-screen clock
   before the password field is visible. No character was lost, but the advisor
   types into a screen showing them no field. This is the most likely source of
   the original "password field has no focus" report.
2. **A wrong password produces SILENCE.** Enter on an incorrect password changed
   nothing on screen — no error, no shake, no message — and wrote **no journal
   line at all**: no PAM attempt, no failure. The keypress never reached PAM.
   An advisor who mistypes gets no signal that anything was rejected.

**Consequence for evidence-gathering:** absence of failure lines in this journal
does NOT prove a first-attempt success. Do not read it as such.

### Still unknown
Whether a click on the password field was needed before typing on the Dell. Not a
lockout — the login succeeded — but it decides whether advisors need coaching.

## 9. FINAL STATE OF THE DELL

| Item | Value |
|---|---|
| Booted | `sha256:384e2c8a…` (SP+ 1, BUILD_ID 20260913) |
| Previous | `sha256:1593017d…` — retained as rollback |
| Shipped control script | **14,255 bytes — the FIXED script, now in read-only /usr** |
| Remediation dropin | **REMOVED** — redundant once the fix ships in the image; machine runs signed image code only |
| `update-staged` marker | absent (correctly cleared) |
| Shipped script reports | `state: current`, `checked: 2026-09-13T12:35:49Z` — current AND able to say when it last looked |

The remediation worked itself out of a job, which is the correct end state: the
dropin is a bridge onto a stranded machine, not a permanent fixture.

## 10. WHAT IS STILL NOT PROVEN

- **The "Restart now" button has never been pressed by a human.** The Dell was
  updated via the OTHER advertised path — "leave it, it will be applied the next
  time you shut down" — which is a legitimate advisor workflow, but it is not the
  button. The button's click handler remains untested.
- **The timer has never fired the lane unattended on hardware.**
  `systemctl start spplus-stage-update.service` is the same code path, not the
  same trigger.
- **The original multi-hour wedge was not reproduced**, so the I/O-saturation
  explanation is inferred from a milder instance, not proven on the severe one.
- **Whether a click was needed at the Dell greeter.**
- **The R2 token is still unrotated** — it was exposed in a `ps` listing.
