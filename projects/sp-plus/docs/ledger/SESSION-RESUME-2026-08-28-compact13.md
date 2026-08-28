# SP+ RESUME — Claudebox (CT105) Headbrain, 2026-08-28, compact 13

Written for a context compaction MID-SESSION. The session continues. Read this,
check the in-flight section, then go to §9 NEXT ACTIONS item 1. Do not re-derive,
do not recap, do not retest §7.

---

## 0. IN-FLIGHT WORK

**Nothing is running.** No build, no dispatch, no agent, no watcher. The build
unit `spplus-build-cycle36.service` is `inactive` after a SUCCESSFUL run.

Two Bee dispatches happened earlier and are CLOSED:

| tag | result | run dir on CT105 |
|---|---|---|
| welcome-bridge-isolation | ACCEPT, 19163 bytes, USED | `/root/bee-runs/20260828T142055Z_welcome-bridge-isolation/out` |
| cycle36-tail-audit | REJECT, rc=124 timeout, 0 bytes, produced nothing | `/root/bee-runs/20260828T143719Z_cycle36-tail-audit/` |

The welcome-bridge-isolation deliverable is still UNUSED work product: its
line-by-line inventory was spot-verified against source and was accurate. It is
the plan for §9 item 5. Read it before redoing that analysis.

To check whether any Bee dispatch is alive, poll the session transcript mtime on
the Beelink under `~/.pi/agent/sessions`, NOT the run directory — artifacts
persist after an agent dies.

---

## 1. WHAT WE ARE DOING

Driving SP+ (Secure Prospective Advisor OS), Christopher's Fedora Kinoite 44
bootc image-mode distribution for independent financial advisors, toward a
**Beta release**. Christopher's words, 2026-08-28: "We need to get to Beta
release. We have a lot of work to get that going."

- **Repo (git worktree):** `/home/chris/work/secureprospective-advisor-os`
  Branch `session/sp-plus-plan`. HEAD `0dc2fc8`. Tree CLEAN.
  Run everything from there. Do NOT cd to the main checkout.
- **No work on main. Never `git --no-verify`. Never bare `git stash`.**
- **CT105 reaches the Beelink directly:** `ssh beelink` (192.168.1.190, user
  chris). Everything for SP+ runs there. Nothing needs paste.md relay except
  actions inside the guest's GUI.
- **bird** (`ssh bird`, 192.168.1.175, user x) is Christopher's own working
  Fedora 44 KDE machine. Diff against it before theorising. Read freely, change
  nothing, do not capture its screen.
- Beelink is **Debian**, no dnf. `sudo -n` works for **podman only**; there is no
  password sudo. `visudo` lives in /usr/sbin, off PATH in a non-interactive ssh
  shell (see §7).

---

## 2. AGENTS + HARNESSES

- **Build:** `~/sp-plus-gates/sp-plus-build-gated.sh` — the ONLY sanctioned path.
  Runs `preflight-gate.sh` then `~/sp-plus-iso-build.sh`. ~15 min.
- **Launch it detached** (never in the foreground, never poll):
  ```
  cd /home/chris/work/secureprospective-advisor-os
  systemctl --user reset-failed spplus-build-cycle36.service
  LOG="/home/chris/sp-plus-build-cycle36-$(date +%Y%m%dT%H%M%S).log"
  echo "$LOG" > /home/chris/.spplus-current-build-log
  systemd-run --user --unit=spplus-build-cycle36 \
    --setenv=HOME=/home/chris \
    --setenv=PATH=/usr/sbin:/sbin:/usr/local/bin:/usr/bin:/bin \
    --working-directory=/home/chris/work/secureprospective-advisor-os \
    bash -c "~/sp-plus-gates/sp-plus-build-gated.sh > '$LOG' 2>&1"
  ```
  **The PATH setenv matters** — see §7 on visudo.
- **Watcher** (blocks until the unit exits, then reports): `bash /tmp/spplus-watch.sh`
  on the Beelink. Recreate it if /tmp was cleared; it loops on
  `systemctl --user is-active spplus-build-cycle36.service`, then greps the log
  for gate strings, errors, last STEP, and stats the ISO.
- **NEVER edit the repo while a build runs.** podman reads COPY sources from the
  working tree as each step executes.
- **Bee:** `THINKING=high /root/run-bee.sh <brief.md> <timeout_s>` on CT105.
  gpt-5.6-luna via openai-codex on the Beelink. Briefs in `/root/briefs/`, runs
  in `/root/bee-runs/`. Do not run two concurrently. A 2100 s budget was NOT
  enough for a whole-Containerfile audit; scope smaller or budget longer.

---

## 3. GATES / STATUS

| Gate | Command | Status |
|---|---|---|
| Config preflight | `PATH=/usr/sbin:/sbin:$PATH bash projects/sp-plus/tests/config-preflight.sh` | 13/13 "Safe to build." |
| cycle36 source | `bash projects/sp-plus/tests/cycle36-source-gate.sh` | PASS |
| Global themes | `python3 /usr/libexec/spplus-validate-global-themes --root /` | 8/8 errors=0, in the image AND on the install |
| Build | gated build | **PASS**, all 107 payload + 22 installer steps |
| Field inspect | `ssh <guest> bash -s < ~/sp-plus-gates/field-inspect.sh` | 1 PROBLEM as root: `firmware legacy_BIOS` |
| **Release gate** | `~/sp-plus-gates/release-gate.sh --ssh '<args>'` or `<report.txt>` | **1 FAILURE: firmware=legacy_BIOS** |

The release gate failure is a property of how the TEST VM was created (BIOS, not
UEFI), not of the ISO. Everything else passes: SELinux Enforcing, no selinux=0
leak, luks_containers=1, luks2 on /dev/vda3, graphical.target, 0 failed units.

`~/sp-plus-gates/field-inspect.sh` is a SYMLINK I created to the repo copy at
`projects/sp-plus/tests/field-inspect.sh`. The release gate looks for it beside
itself and it had never lived there, so the release gate had never once run.

---

## 4. ARTIFACTS THAT EXIST AND WORK

**Current ISO, built and delivered 2026-08-28 10:54 CDT:**

```
/home/chris/Downloads/SP-PLUS-cycle36.iso
also at projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/
5451173888 bytes
sha256 cc3555e6e4b7e075bdc658c84cd44e12e2fb6a1c7b51ac6af829365a61db57ce
```

Superseded earlier ISO (do not confuse them):
`ab11b15ca22580ee2892b42830b9176a42f1f4eda278346757a1b39986f16a40`, 5450719232
bytes, built 09:42. That one lacks the Flameshot rebind and the installer
branding.

**Standing rule:** finished ISOs go to `/home/chris/Downloads/SP-PLUS-cycle<N>.iso`,
plain `cp` as user chris (sudo will FAIL, podman-only), then verify sha256.
Never delete the older ISOs there — that folder is his.

**Verified inside the payload image `localhost/sp-plus-kde:spike`:**
- `flameshot-capture` → `_launch=Print,Print,Take Screenshot`
- `spplus-screenshot` → `_launch=none,none,Take Screenshot with Spectacle`
- /etc/xdg and /etc/skel copies byte-identical
- Papirus-Dark present; theme gate 8/8 errors=0
- first-login contains the SetPermission grant and 2 kreadconfig6 uses

**Verified inside `localhost/sp-plus-installer`:** `/.buildstamp` Product=SP+,
IsFinal=True; conf.d declares custom_stylesheet; os-release ID=sp-plus.

**Test guest:** `fedora-test36` on the Beelink, RUNNING, user `test` password
`password` (disposable, Christopher's call). SSH forward hot-added by me:
`virsh qemu-monitor-command fedora-test36 --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2236-:22'`
— does NOT survive a VM restart. Reach it from the Beelink with:
```
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2236 test@127.0.0.1
```
Key auth works: the image ships chris's pubkey in /etc/skel/.ssh/authorized_keys
and the Beelink's ~/.ssh/id_ed25519 matches. **sshd is DISABLED by the desktop
preset by design; Christopher enabled it by hand in this guest.** That is correct
for an advisor image and must stay disabled at ship.

**The guest runs the 09:42 image, NOT the current ISO.** Its first-login stamp is
absent and its Print Screen still points at the Spectacle wrapper. Both are
expected and will change only on a fresh install.

**Evidence to KEEP:** `/home/chris/sp-plus-bee/theme-evidence/` (23 PNGs, cited by
the ledger) and `/home/chris/sp-plus-shots/*.png` (10 PNGs, the Flameshot and
installer investigation, host-side virsh captures).

---

## 5. THE CURRENT STATE — no open bug

There is no failing build and no open defect in the tree. The last build passed
clean. The one open gate failure is `firmware=legacy_BIOS`, which is the test
VM's own configuration.

**Unproven, needs a fresh install to exercise:**
1. Whether the installer screen now wears SP+ branding rather than "ANACONDA
   BLUESKY INSTALLATION" with the red PRE-RELEASE banner. Verified only at the
   file level inside the installer image.
2. Whether Print Screen opens Flameshot with NO permission prompt on a brand new
   user. The grant runs at first login inside the session, so only a fresh
   install tests it.

**CAVEAT, do not state as fact:** the pre-seeded permission was proven to work
when written by hand into a live session with the store wiped and no dialog
pending. It has NOT been observed working via spplus-first-login on a fresh boot.

---

## 6. DECISIONS — do not relitigate

- **NEW 2026-08-28 — Print Screen runs `flameshot gui`.** Christopher: "flameshot
  gui needs to work out of the box for the next build" and it is to be bound to
  Print Screen. This REVERSES the earlier cycle36 decision that gave Print Screen
  to the Spectacle wrapper. The wrapper stays installed, in the menu, unbound, as
  the portal-free fallback.
- **NEW — Welcome bridge is to be ISOLATED into a drop-in module** so
  Christopher's separate Welcome rewrite can adopt it cleanly. He chose this over
  freezing Welcome or handing the bridge to the other project.
- **NEW — Christopher builds test VMs himself** in virt-manager. Claudebox does
  not touch VM lifecycle. User `test`, password `password`, disposable.
- **DN-28** — stock/vendored global themes; custom Calm WITHDRAWN; SP+ wallpapers KEPT.
- **DN-27** — the global theme is ergonomic, NOT a brand surface.
- **DN-13** — SP+ ships no human account; service identity `spplus` (/sbin/nologin).
- **DN-25/26** — the assistant is Fin; Welcome owns the first screen.
- Screen lock stays as-is. btop at default Kitty size is WONTFIX.

---

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

### The portal screenshot "wedge" — REFUTED 2026-08-28
- **"A portal Screenshot request permanently wedges xdg-desktop-portal-kde."**
  **NO.** Measured across eight launches on the cycle36 guest with host-side
  virsh screenshots: the portal answered before, during and after every one.
- **What actually happens:** the KDE portal shows "Allow Apps to Take
  Screenshots?" and BLOCKS waiting for a human. Over ssh nobody clicks, so it
  presents as an indefinite hang. That is almost certainly what cycle35 recorded
  as a permanent wedge.
- Christopher clicked Allow; Flameshot immediately wrote a 955978-byte PNG.
- **The portal writes the EMPTY app id**, not `flameshot-gui`. bird has
  `flameshot-gui` because bird's grant came from a differently-launched process.
  A blanket grant for unsandboxed apps is the only option available.
- **"Killing the requesting process closes the dialog."** **NO.** Portal dialogs
  persist. I read stale undismissed dialogs as fresh prompts and wrongly
  concluded pre-seeding had failed. **Always restart
  `xdg-desktop-portal-kde.service` and confirm no dialog is on screen before
  judging a screenshot experiment.**
- **"Pre-seeding the permission does not work."** **NO, it works.** With the store
  wiped, the portal restarted and no dialog pending, a programmatic
  `SetPermission screenshot true screenshot "" "['yes']"` is honoured and no
  prompt appears.
- **"bird works because it is X11."** **NO.** bird runs kwin_wayland, same
  versions of flameshot 14.0.0, xdg-desktop-portal 1.22.1 and
  xdg-desktop-portal-kde 6.7.4.

### Launching GUI apps over ssh gives false failures — the biggest trap here
- The portal derives an app identity from the **cgroup**. A process launched from
  an ssh login lands in `session-NN.scope` and has NO identity, so the portal
  prompts regardless of the permission store. bird's Flameshot sits in
  `app.slice/dbus-...org.flameshot.Flameshot@0.service`.
- **Spectacle ABORTS over a bare ssh pipe** with no WAYLAND_DISPLAY, which made
  `screenshot_capture_works` report `no_image` on a machine where Print Screen
  works. Pointed at the session it produced 113529 bytes instantly.
- Same class: `plasma-apply-lookandfeel --list` core-dumps over ssh with no
  display. **Display artifact, not a defect.**
- To run anything graphical in the guest, export
  `XDG_RUNTIME_DIR=/run/user/1000`, `WAYLAND_DISPLAY=wayland-0`,
  `QT_QPA_PLATFORM=wayland`.

### KConfig cascade — the theme WAS applied all along
- **"The user's kdeglobals lacking LookAndFeelPackage/ColorScheme means the theme
  did not apply."** **NO.** KConfig writes NOTHING when the new value already
  equals the current EFFECTIVE value, and SP+ ships those very values in
  /etc/xdg. The user file is legitimately silent on exactly the keys worth
  testing, while keys with no system default (fonts, titlebar buttons) do appear.
- **Read effective values with `kreadconfig6`**, never awk the user file.
- **`kwriteconfig6 --delete` does NOT revert a key.** It writes a `Key[$d]`
  tombstone that MASKS the system default and leaves the effective value EMPTY.
  Delete the line from the file instead.
- **`kreadconfig6 --type bool` is broken in Plasma 6.7** — exits 1, prints
  nothing. Drop the flag.
- Running field-inspect under sudo makes per-user checks read ROOT's config and
  invent failures. Run it as the advisor; elevate only for storage/daemon checks.

### Installer branding — REFUTED
- **"Lorax's bootc-generic-iso template packages installer/product/ as
  images/product.img."** **NO.** This ISO is built by osbuild's
  image-builder-cli. Nothing collects /usr/share/lorax/. `xorriso` on the ISO
  shows NO images/product.img at all. The branding was inert for every cycle up
  to and including 36.
- Anaconda reads `/.buildstamp` (or $PRODBUILDPATH) and
  `conf.ui.custom_stylesheet` from `/etc/anaconda/conf.d/`. With no buildstamp it
  falls back to Product=anaconda, Version=bluesky, IsFinal=false — exactly what
  was on screen.
- **Anaconda profile detection matches os_id EXACTLY, no ID_LIKE fallback.**
  ID=sp-plus matches nothing, so Anaconda uses NO profile and silently drops the
  whole fedora → fedora-kde → fedora-kinoite chain, including storage
  partitioning, efi_dir and network defaults. OPEN QUESTION for Christopher, see
  §9 item 6. Adopting a profile would change installed disk layout.

### Environment artifacts
- **"config-preflight reports sudoers-sp-plus invalid."** **NO.** `visudo` lives
  in /usr/sbin, off PATH in a non-interactive ssh shell. The file parses fine.
  Prepend `/usr/sbin:/sbin` to PATH.
- **"Field-inspect exiting non-zero means it could not run."** **NO.** It exits
  non-zero whenever it finds a problem. The release gate treated that as a
  harness failure and threw away a complete report. Fixed.

### Carried from the previous Headbrain, still refuted
- `plasma-apply-lookandfeel -a` does NOT apply everything, and RESETS user keys —
  Plasma must run FIRST, then write.
- A custom URL scheme cannot bridge the Welcome web view; QtWebEngine replaces
  the page. The window-title channel is what ships.
- Aurorae themes live in `~/.local/share/aurorae/themes/`. The binary is
  `qdbus-qt6`.
- Every upstream theme shipped incomplete: all four named the Plasma 5 decoration
  plugin `org.kde.kwin.aurorae`; Plasma 6.7 needs `.v2`.
- Okular has no password prompt; that was the screen lock. fastfetch is not
  broken; /usr is read-only on bootc so repo changes are absent until a rebuild.

---

## 8. LEDGER STATE

Committed on `session/sp-plus-plan`, all today, tree clean at `0dc2fc8`:

```
0dc2fc8 fix: one source for kglobalshortcutsrc, so the two copies cannot drift apart
29dbcf1 feat: Print Screen runs flameshot gui, and it works out of the box
ff2f499 fix(tests): stop field-inspect crying wolf when run as root, and fix the lock check
66a4d48 fix(tests): verify the EFFECTIVE Plasma config, and retarget the theme checks to DN-28
0dd34fa fix(installer): SP+ branding never reached Anaconda; install it where Anaconda reads
662e23d fix: let welcome-close-gate.sh through .containerignore so step 86 can COPY it
4fbc707 fix: install papirus-icon-theme-dark; Papirus-Dark is a separate F44 package
```

The commit messages carry the full reasoning and the refutations. They are the
durable record; this file is the index.

**NOT yet written to the ledger docs directory:** a DN number and defect record
for the portal refutation. The old `docs/ledger/DEFECT-portal-screenshot-wedge.md`
now states a REFUTED conclusion and should be corrected. See §9 item 4.

**Uncommitted harness changes OUTSIDE the repo** (they live on the Beelink, not
in git, and will not survive a Beelink rebuild):
- `~/sp-plus-gates/release-gate.sh` — patched to judge the report, not the exit code.
- `~/sp-plus-gates/field-inspect.sh` — symlink to the repo copy.
These two should arguably move into the repo. Raise it.

---

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher to recreate the test VM with UEFI firmware** and install
   `/home/chris/Downloads/SP-PLUS-cycle36.iso` into it. BIOS is the only
   remaining release-gate failure and it cannot be fixed from this side.
2. **Watch the installer screen during that install** and capture it host-side
   with `virsh screenshot`. That is the only proof the SP+ branding landed. Expect
   SP+ blue #0033A0 and the sidebar logo, no "ANACONDA BLUESKY", no red
   PRE-RELEASE banner. Sample the sidebar pixel to be sure; stock is #2f4265.
3. **On the fresh install, verify Print Screen opens Flameshot with NO prompt**,
   then run field-inspect as the advisor and confirm
   `printscreen_bound_flameshot yes` and `screenshot_portal_permission granted`.
   Then run the release gate and expect a PASS.
4. **Write the ledger record** correcting the portal-wedge defect to REFUTED, and
   give the Print Screen reversal and the blanket screenshot grant a DN number.
5. **Isolate the Welcome theme bridge** into a drop-in module using Bee's
   delivered plan at
   `/root/bee-runs/20260828T142055Z_welcome-bridge-isolation/out`. Its inventory
   was spot-verified and accurate. Raise it with Christopher before either side
   does more Welcome work.
6. **Ask Christopher about the Anaconda profile** (§7). SP+ currently gets no
   profile at all. Adopting one changes partitioning and bootloader defaults, so
   it is his call, and it matters for Beta.
7. **Offer the podman prune again.** 599 images, 29.06 GB, 100% reclaimable on the
   Beelink root fs. He raised RAM and storage hygiene and I have offered twice
   with no answer. **Do not prune unilaterally** — the dangling images are the
   layer cache that makes rebuilds fast.

---

## 10. RELAY / ENVIRONMENT NOTES

- CT105 reaches the Beelink and bird directly over ssh. Most work needs no relay.
- **`/root/paste.md` is only for actions inside the guest's GUI** or on machines
  CT105 cannot reach. One batch, overwrite, plain commands with `#` comments, a
  header naming the target machine, never real secrets.
- A stop hook checks paste.md. It pattern-matches words like `sudo` in the final
  message and can fire on explanatory prose. If the match is a false positive,
  say so plainly rather than fabricating a batch.
- **Nested heredocs through ssh break.** Write the script or commit message to a
  file locally, `scp` it, then run or `-F` it. Several commits were mangled this
  way before I switched.
- Beelink: 30 GB RAM, ~16 GB available; `/` 378 GB free; `/home` 96 GB free, 78%
  used. `/tmp` is a 16 GB tmpfs — never copy a repo into it.

---

## 11. HONEST STATUS

**The ISO builds clean and installs and boots.** That is real and was proven
today with a host-side screenshot of SP+ Welcome running on a cycle36 install.

**Everything added since that install is unproven on a running system.** The
installer branding, the Flameshot rebind and the first-login permission grant are
verified only as file contents inside the built images. None of them has been
seen working by a human, and the two that matter most to Christopher — the
branded installer screen and Print Screen opening Flameshot without a prompt —
require a fresh install to exercise at all.

The release gate has NEVER returned PASS. It returns one failure, and that
failure is the test VM's BIOS firmware rather than the image. Until it is rerun
against a UEFI guest, **SP+ has no passing release gate and must not ship.**

Today's pattern, worth carrying forward: every one of the five build failures was
an assertion referring to something the tree no longer provided. Three were stale
tests rather than product defects. When a gate fails, suspect the gate first, and
prove the product independently before changing it.
