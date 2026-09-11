# SP+ RESUME — v0.11 punch items before the official release
**Written:** 2026-09-11, mid-session, for compaction. **This is not session close.**
**Supersedes:** the 2026-09-11 v0.11-inspection resume (`RESUME-2026-09-11-v011-inspection.md`).
That one is still correct about the inspection; this one carries the punch-item work on top of it.

---

## 1. WHAT WE ARE DOING

Christopher opened this session with: *"we are just going to handle some punch items I noticed
that needs correcting before releasing the offical v0.11 - None of it is major but we need to
address them and setup for the next ISO build. We will start with the Welcome app 1st then tackle
Fin configurations."*

So: **Welcome app punch items first, then Fin configuration.** Fin has not been started at all.

- **Repo:** `/home/chris/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190).
  SP+ lives under `projects/sp-plus/`. Reach it with
  `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`.
  ⚠️ `~/work/sp-plus` is NOT the repo, it is a byproducts folder. `~/work/sp-plus-build` is a
  different, detached tree. The repo is `secureprospective-advisor-os`.
- **Branch:** `session/sp-plus-defense-in-depth`. **Head `4fe0818`, tree clean.**
- **VM:** `fedora-0.11`, **running**, on the Beelink under `qemu:///session`. It is the installed
  v0.11 machine. Christopher handed it over: *"just log into the VM yourself and do it, its still
  up"*. User `alpha`, password `password`, passphrase `password`.

---

## 2. IN-FLIGHT WORK

**None.** Nothing of mine is running.

- The probe Welcome instance I launched inside the VM (`SPPLUS_INSTANCE_NAME=probe`) was killed
  and confirmed gone by `pgrep -af welcome.py` returning nothing.
- tty3 in the VM was logged out; the VM is back on tty2 showing Christopher's desktop.
- `/tmp/w.log` and `/tmp/u` inside the VM were deleted.
- Beelink `/tmp` scratch (`punch1*.py`, `punch3.py`, `msg*.txt`, `mut3.sh`, `mut4.sh`, `cmd1.txt`,
  `/tmp/mut`) removed. ⚠️ Beelink `/tmp` is a 16G tmpfs — a `cp -a` of the whole sp-plus tree
  filled it once today. Copy only `welcome/` and `tests/` when making a mutant.
- Evidence kept: `~/logs/sp-plus/v011-punch/` on the Beelink, 28 files, 4.6 MB, screenshots
  `shot00.ppm` … `shot27.ppm` (they are PNGs despite the extension).
- Console tooling reused from the last session: `~/logs/sp-plus/v011-inspect/typer.py`.

---

## 3. GATES / STATUS

| Gate | State | Where proved |
|---|---|---|
| `tests/welcome-no-show-gate.sh` | **PASS 6/6, exit 0** | inside `localhost/sp-plus-kde:v0.11` |
| same gate, mutated | **RED on the punch-item assertion** | fix reverted in a scratch copy |
| Containerfile theme-preview gate (new) | **PASS, 8 previews, exit 0** | inside the v0.11 image |
| same gate, mutated | **RED, names the missing file** | `orchis-light.png` deleted |
| Containerfile theme-preview gate (old) | **could not fail** | exit 0 with 3 files missing |
| Filing gate | **PASS**, 23 entries | `~/.reorg/tools/check-filing.sh` |
| 80-assertion runtime posture gate | **still never run** | needs a QA-kickstart install with SSH |

### How to run the Welcome gate (this is the expensive-to-rediscover part)

PySide6 is **not** on the Beelink, so the gate SKIPs there and exits 0 having tested nothing.
Run it inside the image instead. Three flags are all required:

```bash
cd ~/work/secureprospective-advisor-os/projects/sp-plus && sudo podman run --rm \
  --security-opt seccomp=unconfined -v "$PWD":/src:ro,Z -w /src --user 1000 \
  -e HOME=/tmp/h -e QTWEBENGINE_CHROMIUM_FLAGS=--no-sandbox \
  localhost/sp-plus-kde:v0.11 bash -c "mkdir -p /tmp/h && bash tests/welcome-no-show-gate.sh"
```

- `--user 1000`: Chromium refuses to run as root ("Running as root without --no-sandbox is not
  supported"), rc=1.
- `QTWEBENGINE_CHROMIUM_FLAGS=--no-sandbox`: without it every launch dies with
  `Trace/breakpoint trap`, rc=133, and the gate misreads that as "Welcome exited on its own".
- `seccomp=unconfined` alone does **not** fix the trap.

---

## 4. WHAT WAS FIXED AND COMMITTED

### `9951ba1` — punch item 1: do-not-show killed the menu entry

**Symptom Christopher reported:** after ticking "do not show this setup again", a reboot correctly
does not autostart Welcome, but clicking SP+ Welcome in the menu shows a KDE startup indicator for
a second and never opens.

**Cause:** `/usr/share/applications/...welcome.desktop` and the `/etc/skel/.config/autostart` copy
were the **same command**, `/usr/bin/spplus-welcome`. `main()` reads the preference before building
a window, so every launch exited 0 silently.

**Fix:** added `--autostart` to `welcome/welcome.py`; the gate is now
`if args.autostart and not force and read_no_show(): return 0`. The login launcher is a new,
separate file `welcome/org.secureprospective.spplus.welcome-autostart.desktop` carrying
`Exec=/usr/bin/spplus-welcome --autostart`. NoDisplay is deliberately **absent** from it: some
autostart implementations treat NoDisplay as a reason to skip an entry, and `Hidden=true` is the
only key that legitimately disables one. The Containerfile installs that file into
`/usr/share/sp-plus/welcome-autostart.desktop`, copies it into skel, and asserts both Exec lines
plus `! cmp -s` so the two can never be made identical again.

**Gate:** `tests/welcome-no-show-gate.sh` was **asserting the defect** — it launched bare and
required an exit. Rewritten: section 1 `--autostart` must exit, new section 1b bare launch must
stay open while the preference is set, section 2 `--autostart` with the preference clear must stay
open, new section 5 requires the two launcher files to differ. 6/6.

**Reaches machines how:** `/etc/skel` is copied at account creation, so this fix arrives with the
**next ISO**. Christopher's current v0.11 VM keeps the old autostart file. He has been told.

### `4fe0818` — punch item 3 (found by me, not reported): the preview gate could not fail

The Containerfile looped over eight hardcoded preview filenames running a bare `test -s` inside
the loop body. **A shell `for` loop exits with the status of its last iteration**, so every
failure except the final one was discarded. Demonstrated inside the v0.11 image: with
`orchis-light.png` deleted, the old gate exits 0.

Worse, two of the eight names — `windows-light.png`, `windows-dark.png` — **have not existed since
the theme was renamed to Modern**. The cards ask for `modern-light.png` / `modern-dark.png`, which
do ship. The gate had been asserting two absent files and passing.

Replaced with a `python3 -c` block that reads every `data-preview` attribute out of the shipped
`index.html` and requires each named file to ship non-empty, and every shipped preview to be
referenced by a card. The list can no longer drift from its source.

---

## 5. THE OPEN PUNCH ITEM — item 2, the theme spinner

**Christopher's report, verbatim:** *"On the 'Choose your look', when a look is selected, the
loading circle never quits even when the theme is completly loaded. The assumption is something is
broken when nothing is infact broken."*

**I could not reproduce it, and the machine's own records say why.**

What I measured on `fedora-0.11` today:

1. Drove Welcome by keyboard through the real UI and applied **MODERN LIGHT**. It completed and
   the Apply button read **APPLIED** within **8 seconds** (`shot19.ppm`), with the banner
   "Applied. The helper verified the package settings, wallpaper, decoration, and requested
   layout." and the status line "MODERN LIGHT APPLIED. THE WHOLE DESKTOP CHANGED."
2. Read `~/.local/state/sp-plus/theme-events.jsonl` in the VM. **Before** my test: 145 lines,
   `apply_received` = 1, `verdict` = 1, `result` = `success`, first event `2026-09-11T17:34:04`,
   last `2026-09-11T17:34:09` — **a 5 second apply**. `click_receipt` **= 0**.
3. **After** my test: 283 lines, `apply_received` = 2, `click_receipt` = 1,
   `apply_rejected_busy` = 0.
4. So the 12:34-local apply carried **no click receipt**, meaning it did not come from Welcome.
   `/usr/libexec/spplus-first-login` also calls `spplus-apply-theme` — that is what it was.

**Conclusion: no theme click from Welcome had ever reached the shell on that VM until mine, and
mine worked.** Whatever Christopher saw left no trace on that machine.

**The open question put to him, unanswered at compaction:** was the stuck circle on the **Dell**
rather than the VM? And if it was the VM, which look, and was the circle on the Apply button or
elsewhere? He said in the previous session *"I tested this on the Dell, so UEFI and secure boot
works perfect"*, so the Dell is a live possibility.

**Leading hypothesis, with its caveat.** The only busy state in the theme UI is the Apply button:
`openThemePreview` sets `previewApply.disabled = true` and `aria-busy="true"` and leaves them
until the preview image fires `onload` or `onerror`. `app.css` has exactly one spinner class,
`.service-spinner`, and it belongs to the **services** screen, not this one. **Caveat:** the two
heaviest previews (`catppuccin-latte.png` 2.49 MB, `orchis-light.png` 2.18 MB) both loaded in
under 2 seconds in the VM even with no GPU acceleration, so slow decode is not demonstrated.

**Also changed on his VM by this test:** the desktop theme is now **MODERN LIGHT**, was MODERN
DARK. He was offered a revert and has not answered.

---

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

Carried forward from the inspection resume, still refuted:
- The PAM mechanism; the physical-presence claim; that `skopeo --policy inspect` does not enforce;
  that podman and skopeo keep separate credential stores.
- **"Bitwarden has never shipped."** It ships, as a one-click Welcome install.
- **`fedora-0.11` cannot be reached over the network by any route.** sshd disabled (D47), guest
  agent not connected, usermode SLIRP with no hostfwd, no getty on the serial port, and the
  vsock the banner advertises has no device in the domain XML. The graphical console driven by
  `virsh send-key` plus `virsh screenshot` is the **only** channel.
- The argon2 memory figure is per-machine, not a product constant.

New this session:
- **"The theme helper hangs."** No. It is bounded everywhere: 60s per command
  (`SPPLUS_COMMAND_TIMEOUT`), 90s per poll (`SPPLUS_POLL_CEILING`), 600s on the worker
  subprocess. Measured: **5 seconds** for the first-login apply, under 8 for mine.
- **"A missing element id throws in the `themeApplied` handler."** No. `final-theme`,
  `theme-detail` and `theme-preview` all exist in `index.html`, one each.
- **"A theme preview image is missing."** No. All eight ship in the image and all eight names
  match the `data-preview` attributes. Checked with `podman run ... ls`.
- **"Welcome's stderr is in the user journal."** No. `journalctl --user` has zero Welcome lines
  in either the 12:34 or 17:34 window. ⚠️ VM local time is **UTC−5**; the log's `utc` field and
  `journalctl --since` do not agree, which cost one wasted query.
- **"Welcome had already been running and I could inspect its stuck state."** No. There was no
  Welcome process on the VM before I launched one; the taskbar had no Welcome entry.

---

## 7. DECISIONS AND STANDING CONSTRAINTS

Unchanged and not to be relitigated: never `git --no-verify`; no work on main; one branch per
session; never send email without per-message permission; all SP+ execution on the Dell or a VM,
never the Beelink; Beelink `sudo` permits `podman` only; never `mv` a git repo or worktree;
publishing `:latest` is fleet-wide and goes only through `scripts/publish-image.sh`; D44 nothing
may break day one; D15 no compliance claims; gates must be able to fail, mutation-test red before
claiming green; destructive SP+ work goes to `spplus-test` or `SP-Alpha-Rig`, never `fedora-0.11`.

From the previous session's rulings, still live: **publish v0.11 when the new version is up, as a
standing order that publication accompanies each new version.**

---

## 8. LEDGER STATE

Committed on `session/sp-plus-defense-in-depth`, hooks passed, nothing held back:

- `4fe0818` preview gate could not fail
- `9951ba1` do-not-show silenced the menu entry
- `1c9f2e3` previous compact-safe resume
- `1116c3b` the promise was wrong, not the product

Tree clean. Nothing written but uncommitted.

---

## 9. NEXT ACTIONS, IN ORDER

1. **Get Christopher's answer on punch item 2**: Dell or VM, and which element the circle is on.
   Do not re-measure the VM path — section 5 already has the numbers.
2. **Revert his VM theme to MODERN DARK** if he asks.
3. **Take the remaining Welcome punch items from him.** He said "start with the Welcome app 1st",
   so expect more than the two he has given.
4. **Then Fin configurations**, which he named as the second half of this session and which has
   not been touched.
5. **Rebuild the ISO** once the Welcome and Fin items are in, so the `--autostart` fix actually
   reaches a machine.
6. **Publish v0.11** via `projects/sp-plus/scripts/publish-image.sh`, per the standing order.
7. Still outstanding from the inspection resume, lower priority than the above: the **disk
   recovery key** ruling (promised in four places, does not exist); auditing the other eight
   day-one jobs; running the 80-assertion posture gate against a QA-kickstart install;
   signature enforcement on `spplus-test`.

---

## 10. RELAY / ENVIRONMENT NOTES

- **Driving the VM console.** `python3 ~/logs/sp-plus/v011-inspect/typer.py` reads a string on
  stdin and types it with `virsh send-key`. **It drops keystrokes on long lines** — a 431-char
  python one-liner arrived truncated. Keep typed commands **under ~100 characters**; split env
  exports onto separate lines. Screenshot with
  `virsh -c qemu:///session screenshot fedora-0.11 shotNN.ppm` (the file is a PNG), then `scp` it
  to the scratchpad and read it.
- **Switching consoles:** `virsh ... send-key fedora-0.11 --codeset linux KEY_LEFTCTRL
  KEY_LEFTALT KEY_F2` (graphical) / `KEY_F3` (spare tty). Log in on tty3 so his desktop is not
  disturbed.
- **Driving the Welcome GUI without a mouse:** every theme card is a real `<button>`. From the
  Choose-the-look screen, focus starts on nav item 02; 6 Tabs reaches MODERN LIGHT, then DOM order
  is MODERN DARK, BREEZE DARK, NORDIC DARK, CATPPUCCIN MOCHA, BREEZE LIGHT, ORCHIS LIGHT,
  CATPPUCCIN LATTE. In the preview dialog focus lands on the X; 2 Tabs reaches Apply.
- **Launching Welcome onto the desktop from tty3:** export `XDG_RUNTIME_DIR=/run/user/1000`,
  `WAYLAND_DISPLAY=wayland-0`, `SPPLUS_INSTANCE_NAME=probe`, then
  `spplus-welcome --force > /tmp/w.log 2>&1 &`. The libEGL/virtio_gpu errors in that log are VM
  noise, not failures.
- **Commit messages** go to a local file, `scp` to `/tmp`, then `git commit -F`. Apostrophes break
  single-quoted ssh heredocs.
- This environment **refuses compound `&&`-chained ssh commands**; split into single actions.

---

## 11. HONEST STATUS

Two punch items are fixed, gated, mutation-tested and committed. **The one Christopher cares most
about — the theme spinner — is not solved and is not reproduced.** I have strong evidence it did
not happen on that VM, and no evidence at all about the Dell. The next window must get his answer
before spending anything else on it; re-running the VM path will only re-derive section 5.

Nothing in this document is a claim about the Dell. Nobody has looked at the Dell.
