# SP+ RESUME — 2026-09-10, pre-build fix batch for the ISO after Alpha v0.10

## 1. WHAT WE ARE DOING

Alpha v0.10 is **released and Dell-tested**. This session ran an overnight Bee sweep of it,
then fixed the defects the sweep and Christopher found. We are **one item away from building
the next ISO**. Nothing is mid-build.

- SP+ repo: `~/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`, tip
  **`d3d0b5d`**, tree clean.
- Site repo: `~/work/secureprospective-site`, branch `sp-plus-alpha-release`, tip `d355461`,
  pushed, clean. CT105 owns merge to `main`. Beelink never deploys.
- Fedora bootc only. The Debian lane is a parked idea — never mention it in status.

## 2. IN-FLIGHT RIGHT NOW

**Nothing.** The sweep finished 2026-09-10T09:18Z. No agents, no builds, no background jobs.
The `fedora-alpha-test` VM is running with a live desktop, which is the only thing to preserve.

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `tests/config-preflight.sh` | **39 passed, 0 failed — "Safe to build."** |
| `tests/libreoffice-xcd-check.py` | `LIBREOFFICE_XCD_CHECK_OK` |
| `tests/libreoffice-parity-gate.sh` | **Red against the SHIPPED image: 15 of 68 fail.** Every failure is a real defect that shipped in v0.10. Expect green after the next build. |
| T-20 render check | **Verified on the rig at 1280x800** on screens 03, 04, 07, 08 |

## 4. WHAT WAS FIXED THIS SESSION (all committed)

| Item | Commit | Verified how |
|---|---|---|
| **T-20** container overflow | `2fd9bd3`, `8e72d3b` | Driven on the rig at 1280x800 in all three failing states |
| **T-31a** body text 6.3pt -> 12pt | `2fd9bd3` | Writer on the rig shows `12 pt` |
| **T-31b** Tabbed toolbar | `d3d0b5d` | Writer on the rig opens with the **Office ribbon** |
| LibreOffice first-run wizard | `2fd9bd3` | Clean open, no dialog |
| **T-28** `hidden` must hide | `d3d0b5d` | Root cause proven; render check pending |
| **T-30** hide empty KDE Help Center | `d3d0b5d` | Containerfile + gate; needs the build |
| **T-21 / T-23 / T-24** | `d3d0b5d` | Source-level |
| Gate honesty | `7efe018`, `d3d0b5d` | Mutation-tested red, twice |

## 5. THE ONE OPEN ITEM — T-36, Brave does not block ads

Christopher found this on the Dell. **Cause is established**: Shields is on, but Brave ships
no filter lists and fetches them lazily. On the rig, `First Run` was 2026-09-09 22:48 and
`Default/adblock_cache/engine0.dat` (the full engine) was not written until **07:01 the next
morning — 8h13m later**. Also, the managed policy sets 24 keys and **none concerns Shields**.

**Proposed fix, NOT yet written:** a first-login user unit that launches Brave once in the
background, waits for `adblock_cache/engine*.dat` to exist, and writes a receipt, so its
success is checkable and it can fail loudly. Plus explicit Shields policy keys and a gate that
asserts them.

**Christopher was asked how to proceed (build now vs verify first) and had not answered when
this document was written. Do not assume. Ask again.**

## 6. HYPOTHESES REFUTED — DO NOT RETEST

- **A VM-only symptom is not a defect.** Flameshot, the black screen after resume, "hibernation
  unsupported" and the Welcome autostart were all VM artifacts. Christopher settled them from
  the Dell: Flameshot works, sleep works, hibernate works 1-in-2 on a spinning disk and is
  **accepted**, autostart is correct. See `docs/ledger/DELL-VERIFIED-2026-09-10-alpha-v0.10.md`.
- **`Active = Tabbed` is wrong.** LibreOffice stores the notebookbar **.ui filename**:
  `Active = notebookbar.ui`. Observed by dispatching `.uno:ToolbarMode` on a fresh profile and
  diffing `registrymodifications.xcu`. Neither the label nor the CommandArg is matched by code.
- **DefaultFont heights are 1/100 mm, not twips.** 1pt = 35.28. 12pt = 423, 14pt = 494,
  10pt = 353. The old value 220 rendered as 6.2pt.
- **`FirstRun=false` and `WhatsNewDialog=false` do NOT suppress the first-run wizard.**
  Only matching **`ooSetupLastVersion`** to the running version does. Verified by elimination.
  A LibreOffice update will bring the wizard back; the probe now fails when the pin drifts.
- **The Brave `--component-updater=fast-update` test was VOID, not negative.** Brave never
  opened a window and never created a `Default/` profile. It proves nothing either way.
- **Welcome exits 0 silently** when "do not show this setup again" is set — Bee ticked it in
  sweep P04. Use `--force`. It is NOT the single-instance lock.
- **`vmtype` does not reach QtWebEngine fields; `vmclick type` does.**
- **`pkill -f <pattern>` over SSH matches its own command line** and kills the shell. Bracket
  the pattern: `pkill -f "[t]20/welcome.py"`.
- **`bootc status` needs root** — `sudo -n bootc status`. Unprivileged it is a permission
  error, not a finding.

## 7. HOW TO RE-VERIFY WELCOME ON THE RIG

The patched copy in the guest was reaped. To recreate:

```bash
ssh -p 2223 -i ~/.ssh/spplus-testvm -o IdentitiesOnly=yes test@127.0.0.1 \
  'cp -r /usr/libexec/sp-plus/welcome ~/t20 && chmod -R u+w ~/t20'
scp -P 2223 -i ~/.ssh/spplus-testvm -o IdentitiesOnly=yes \
  ~/work/secureprospective-advisor-os/projects/sp-plus/welcome/app/app.css \
  test@127.0.0.1:~/t20/app/app.css
# then, holding the SSH session open (it exits with the session):
ssh -tt -p 2223 -i ~/.ssh/spplus-testvm -o IdentitiesOnly=yes test@127.0.0.1 \
  'export XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0 \
   DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus SPPLUS_INSTANCE_NAME=t20; \
   cd ~/t20 && python3 welcome.py --force --screen 3'
```
Set 1280x800 first: `kscreen-doctor output.Virtual-1.mode.1`. Screenshot with
`DOM=fedora-alpha-test vmshot <label>` (label, NOT a path).

## 8. THE RIG

- libvirt domain **`fedora-alpha-test`**, `qemu:///session`, desktop live on tty2/tty1.
- Guest: user `test` / `play123`, LUKS `play123`.
- **SSH `-p 2223 -i ~/.ssh/spplus-testvm -o IdentitiesOnly=yes`.** The forward is a RUNTIME
  `hostfwd_add` and **does not survive a VM restart**:
  `virsh -c qemu:///session qemu-monitor-command fedora-alpha-test --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2223-:22'`
- **`~/fleet/bin/vmlogin`** takes a cold or rebooted VM through LUKS and SDDM to a confirmed
  desktop in ~21s. Mutation-tested red then green across a real reboot.
- `vmdesktop` is the guard; `vmclick` for pointer/keys/type; `vmshot <label>` for screenshots.

## 9. STILL OUTSTANDING FROM BEFORE THE SWEEP

**The Alpha v0.10 ISO is still not downloadable.** It needs an R2 **Object Read & Write** token
(Access Key ID + Secret) that only Christopher can mint, dropped at `~/.config/fleet/r2.env`.
Then: rclone the ISO up, verify size 5452943360 and sha256
`5e10d090d07b28b6809003b12fa5f65a8a0b51630121349916ec2d95ecc8d221`, flip `published: true` in
`functions/_lib/releases.ts`, build, commit, push for CT105.
Dead ends already proven: wrangler refuses >300 MiB; R2 multipart is S3-API only; CT105's
account token cannot mint S3 keys.

## 10. NEXT ACTIONS, IN ORDER

1. **Ask Christopher** the T-36 question that went unanswered: build now with seven verified
   fixes, or verify the Brave warm-up first. Do not decide for him.
2. If building: bump the payload ref (alpha3 -> alpha4) in `installer/payload-ref.txt` AND
   `installer/interactive-defaults.ks`, re-run `config-preflight.sh`, then build detached.
3. After the build, re-run `libreoffice-parity-gate.sh` against the new image — it should go
   from 15 failures to 0. That is the proof the fixes landed.
4. Render-check T-28 (`hidden`) and T-30 (one Help entry) on the new image.
5. Close out T-25 and T-27 — both are decisions Christopher still owes.

## 11. HONEST STATUS

Seven fixes are in and verified, preflight is green, and the parity gate is red against the old
image for fifteen real reasons. The Office ribbon and 12pt body text are confirmed by eye on the
rig. **T-36 is understood but unfixed, and the one test I ran on it was void.** Nothing else is
blocking a build. The website side has not moved since yesterday and still rests on one
dashboard action only Christopher can take.
