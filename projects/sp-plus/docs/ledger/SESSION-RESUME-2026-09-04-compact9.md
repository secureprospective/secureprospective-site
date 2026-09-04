# SP+ RESUME — 2026-09-04 (compact 9)

## 1. WHAT WE ARE DOING
Building the **SP+ 1 Alpha release ISO**. Christopher's order: "make sure we have
everything in order on the next build, keep it lean and mean and make this the
Alpha Release." A container build is RUNNING right now (see §2).

Repo (ACTIVE): `chris@192.168.1.190:~/work/secureprospective-advisor-os`
It is a **git WORKTREE of `~/work/secureprospective-site`** — that is why it does
not appear in the backup script's repo list; the objects live in the parent.
Branch `session/sp-plus-plan`, tree clean at **`066fa1d`**.

## 2. IN FLIGHT — THE BUILD (most perishable)
| | |
|---|---|
| What | `podman build -t localhost/sp-plus-kde:alpha1 -f images/kde/Containerfile .` |
| Started | 2026-09-04 ~14:02 local, from `projects/sp-plus` |
| PID | 219825 (sudo) / 219828 (podman) — **may be stale after compaction, re-check** |
| Log | `~/logs/sp-plus/alpha-20260904g.log` on the Beelink |
| Steps | 193 total; was at 87 when this was written |

**Is it alive?**
```bash
ssh -n -i /root/.ssh/beelink chris@192.168.1.190 \
  "pgrep -af 'podman build' | grep -v 'bash -c'"
```
**How far?** `grep -c '^STEP' ~/logs/sp-plus/alpha-20260904g.log`
**Did it fail?** `grep -n '^Error' ~/logs/sp-plus/alpha-20260904g.log`
**Did it finish?** `grep -c 'Successfully tagged' ~/logs/sp-plus/alpha-20260904g.log`

A local Monitor task was watching this log. **A monitor does not survive
compaction reliably — do not trust its silence. Check the log directly.**

⚠️ **DO NOT `podman image prune` while this runs.** Dangling-only, rootful, AFTER
the build, per standing rule.
⚠️ `fedora-alphaTEST` on the Beelink is **Christopher's VM. Never stop or reap it.**

## 3. WHAT HAPPENS WHEN THE BUILD FINISHES — NEXT ACTIONS, IN ORDER
1. **Confirm it tagged**, then verify the payload INSIDE the image, never from the
   log (`docs/ledger/TESTING-ON-HARDWARE.md` Loop B step 2). Check at minimum:
   `/usr/bin/pi --version` = 0.85.0 · `test ! -e /usr/share/doc` ·
   `rpm -q ibus google-noto-color-emoji-fonts` (CJK was KEPT) ·
   `ls /usr/share/applications/org.secureprospective.spplus.canva.desktop` ·
   `ls /usr/share/sp-plus/fin/extensions/` (3 files) ·
   `ls /usr/share/sp-plus/fin/skills/marketing/SKILL.md` ·
   `grep -c . /usr/share/flatpak/preinstall.d` (must be EMPTY, dir exists).
2. **Build the ISO** from the image (bootc-image-builder path; the previous Alpha
   came out at `projects/sp-plus/artifacts/spikeB-rootful/out/**/*.iso`).
3. **MEASURE THE ISO. Do not predict it.** See §6.
4. **Name and place it**: `~/Downloads/sp-plus-1.0-alpha.iso` + `.sha256`.
   `functions/_lib/releases.ts` expects the key `sp-plus/sp-plus-1.0-alpha.iso`
   (UNDATED).
5. **Upload with rclone MULTIPART** (Christopher ruled this 2026-09-04).
6. Reinstall the test VM from it and run `tests/runtime-posture-gate.sh` → 18/18.

## 4. GATES — ALL GREEN AS OF `066fa1d`
20 source gates pass. `config-preflight` **36/36 "Safe to build"**,
`pkg-preflight` safe. `welcome-close-gate` and `welcome-lifecycle-gate` SKIP on
the Beelink and PASS on the VM (they need a graphical installed session; run them
with `XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0`).

## 5. THE BUG THAT KILLED BUILD `f` — FIXED, BUT READ THIS
Build `alpha-20260904f` died at **step 116/193** on the DN-34 gate:

    Error: building at STEP "RUN systemctl enable spplus-flatpak-update.timer ...
    ! test -d /usr/share/flatpak/preinstall.d ..." : exit status 1

`/usr/share/flatpak/preinstall.d` EXISTS, is EMPTY, and is owned by
`flatpak-1.18.1-1.fc44.x86_64`. The assertion I added when retiring Thunderbird
demanded SP+ delete a directory belonging to a package. Both places now assert
`test -z "$(ls -A /usr/share/flatpak/preinstall.d 2>/dev/null)"` instead.
**All 20 source gates were green through this — they read the repo; only the
image knows what the packages put there.**

## 6. HYPOTHESES REFUTED — DO NOT RETEST
- **"/usr/lib/jvm is 237 MB of orphan."** FALSE and DANGEROUS.
  `rpm -q --whatrequires java-headless` says nothing needs it; that query does
  not follow virtual provides. `dnf remove --assumeno` shows it takes
  **libreoffice-writer, -calc, -impress and -draw** with it. THE JVM STAYS.
- **"tar | zstd -19 predicts ISO savings."** FALSE, ~2x optimistic. The d->e cuts
  measured ~192 MiB and delivered 86.5 MiB — ratio ~0.45. Over-predicted three
  times. **Measure a built ISO or say nothing.**
- **The R2 ceiling is 5,368,709,120.** WRONG. It is **5,363,466,240** (4.995 GiB).
  Alpha `e` was 5,448,759,296 = **81.3 MiB over**.
- **"Cutting docs + CJK clears the ceiling."** FALSE — ~51 MiB delivered against
  81.3 needed. Withdrawn; multipart instead.
- **Fin's guardrail fires under pi 0.85.0** — PROVEN, not inferred: with the
  prompt section removed it returned the extension's own block text.
- **The organizing promise as prompt prose** — FAILED five live runs. It is an
  extension now.

## 7. DECISIONS (Christopher, 2026-09-04)
- Keep the `/usr/share/doc` cut; **restore CJK input**; upload **multipart**.
- Fin pin bumped to **0.85.0**; Fin updates ARE image updates.
- Canva ships as the **seventh PWA**, neutral lettermark (no third-party logo).
- Marketing skill carries the **FINRA 2210 / SEC Marketing Rule** review line.

## 8. LEDGER STATE — COMMITTED, NOTHING UNCOMMITTED
    066fa1d  fix the preinstall retirement gate that had never been built
    1459c6d  correct the R2 ceiling, cut /usr/share/doc, keep CJK input
    7003684  third size pass for the Alpha release
    aca631d  add Canva as the seventh PWA
    25646bf  Fin as a tech buddy that cannot quietly wreck the place
    0b2f783  bump the Fin pin to 0.85.0, the honest way
    eb80b65  make Fin's update path the only path it can find
    394b81f  run the last four gates where their subject actually lives
    df605ab  put the email article back in step with the manual
    1b5e830  revive the four remaining dead QtWebEngine gates
    6148ec7  fix the help corpus gate, which had never run

## 9. STILL OPEN — CHRISTOPHER'S CALL, DO NOT DO UNASKED
1. **BACKUP. 92 unpushed commits.** The CT105 mirror holds nothing for this repo
   newer than **2026-09-02**. A power surge already rehearsed this failure today.
   Fix is `/root/backup-beelink-repos.sh` (additive, cannot harm the source);
   verify by the mirror's ref list, never the exit code. **Sync is announced,
   never silent.**
2. **156 MB shadow pi** at `/var/usrlocal/lib/node_modules` on the test VM.
   Remove with `sudo rm -rf /var/usrlocal/lib/node_modules /usr/local/bin/pi`.
3. **The rest of the Fin review** — Christopher has more to give.
4. Optional: Inkscape/GIMP/Scribus as Optional Tools; pin Canva to the taskbar.

## 10. ENVIRONMENT
- VM: `ssh spvm` from CT105. Lost on VM reboot; restore with ONE command on the
  Beelink: `virsh qemu-monitor-command fedora-alphaTEST --hmp "hostfwd_add hostnet0 tcp:127.0.0.1:2222-:22"`.
  **Do not rebuild the reverse-tunnel approach — dead end.**
- Beelink GUI session vars: `XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0 DISPLAY=:0`.
- Filing gate PASS (23 entries). /tmp scratch reaped.

## 11. HONEST STATUS
The build may still fail at a step no source gate can see — that already happened
once today at 116/193. **Nothing has been built end to end yet. No ISO exists for
this Alpha.** Everything else is committed and gated. The two verifications that
still need a human are Bluetooth on the Dell and the kdialog mailto chooser;
Fin's interactive TUI under 0.85.0 has also never been seen by a person.
