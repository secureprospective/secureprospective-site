# SP+ RESUME — compaction #4, 2026-08-27 ~00:31 CST

## 1. WHAT WE ARE DOING
Ship a demonstrable SP+ ISO (Fedora Kinoite 44 bootc, image-mode) that Christopher
installs LIVE at 09:30 CST today on a 12-year-old Dell Inspiron 5737, 8 GB RAM,
spinning SATA, in front of an important person. Repo
`/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`
(a worktree — never `cd` to the original root). Lane scripts `~/sp-plus-bee/`,
mirrored into `projects/sp-plus/tests/bee-lane/`.

## 2. IN-FLIGHT RIGHT NOW (most perishable — read this first)
- **cycle27** — driver pid **2325172**, launched 00:20. Alive? `[ -d /proc/2325172 ]`.
  Log `~/spb-cycle27.log`, build log `~/sp-plus-build-cycle27.log`, dir
  `~/sp-plus-iso/cycle27/`. Was at STEP install at 00:29, install VM pid **2366777**
  (`-name spplus-cycle27-sata`). Watcher background task **b933t22us** prints the
  assertion lines on driver exit.
- **What cycle27 carries**: the 4-fix batch (mimeapps defaults, TerminalApplication=kitty,
  Brave enterprise policy, en_GB catalog + LANGUAGE drop-in) on top of everything in
  cycle26. It does **NOT** carry the Fin approval fix (54530c7), which landed after
  the build started.
- **PID MATCHING TRAP** (bit me 3x): `pgrep -af "spb-cycle cycleN"` matches your own
  shell and returns the nohup wrapper. Resolve by scanning `/proc/*/cmdline` for the
  exact string `bash ./spb-cycle cycleN `.

## 3. THE RULE THAT COST A WHOLE BOOT PHASE
**CHECK PORT 2299 IS FREE BEFORE ANY BUILD/BOOT.** `ss -ltn | grep 2299`.
qemu REFUSES TO START when `hostfwd` cannot bind, so cycle24's boot phase never ran
(SERIAL_BYTES 0, both live gates "returned no gate output at all"). Free it with
`echo system_powerdown | socat - UNIX-CONNECT:<cycledir>/boot-monitor.sock`, then
`pkill -F <cycledir>/boot.pid` if still up.

## 4. GATES / STATUS
| Thing | State |
|---|---|
| 3 image gates | GREEN: PACKAGES 47/0, BRANDING 11/0, APPS 50/0/0 |
| Build assertions | all green on cycle26/27 (see §5) |
| Install | works, ~11.7 GB plateau |
| Boot | works, hostname `sp-plus login:` CONFIRMED |
| Live gates (branding/apps) | FAIL — no account exists; needs `spb-mkuser` first |
| DN-13 no human account | holds |
| DN-15 LUKS prompt | RESOLVED — was the lane, not the product (§7) |
| DN-17 "Welcome to SP+" | **OPEN** — 2nd attempt in cycle27, unproven on a panel |

## 5. BUILD ASSERTIONS (quote verbatim; never a verdict)
```
TRIM_OK usr_bytes=7768288594 packages=1912
GROUPS_OK count=82
DN15_PLUGIN_OK script.so present on disk and in the initramfs
DEBLOAT_OK enabled_units=76
AUTOSTART_OK count=12
DN17_BRANDING_OK / DN17_LOCALE_OK
TUNING_OK vm.swappiness=180
MENU_OK visible_entries=22
DN15_KARGS_OK / MIME_OK / BRAVE_POLICY_OK 16 policies
```

## 6. ARTIFACTS
- ISO cycle26: `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/…iso`
  (cycle24's was 5129928704 B, sha256 `588e263f34b9e6ea65863f3a5ae84dae0957f2d810b0117c2f11f7246abeec08`)
- `~/sp-plus-iso/cycle26/screen-firstscreen.png` — DN-17 evidence, still says "Plasma Desktop"
- `~/sp-plus-iso/cycle24/strip-baseline/` + `strip-rhgb-tty0/` — the DN-15 panel strips
- cycle20 disk REAPED 00:31; all its logs/screenshots kept.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST
1. **DN-15 was NOT a product defect.** Control boot with ` console=tty0` ALONE (no rhgb)
   put the prompt on the panel: `Please enter passphrase for disk QEMU_HARDDISK…`.
   The black screen was spb-boot's own `console=ttyS0,115200`. Three cycles of plymouth
   theme work chased an instrument artifact. The Dell passes no `console=` at all.
   `rhgb quiet` still ships — for polish (branded splash instead of scrolling text),
   NOT rescue. Whether the GRAPHICAL splash renders is unprovable in the VM (plymouth
   falls back to text on bochs-drm); only the hardware closes it.
2. **plymouth theme / script.so were never the cause** — necessary, correct, insufficient.
3. **`systemsettings` segfault offscreen is NOT an SP+ bug** — stock
   `quay.io/fedora/fedora-kinoite:44` crashes identically. Needs a real compositor.
4. **System Monitor "FAIL" was a bad test** — it has no `--version`; it runs fine.
5. **Fin's icon resolves** (hicolor 256/512/scalable) — not a bug.
6. **Admin path is correct** — sudoers `%wheel`, polkit `unix-group:wheel`, agent autostarts.
7. **`bfq` already selected by udev** for the rotational disk. Leave it alone.
8. **mimeapps breakage was narrower than it looked** — KDE's kde-mimeapps.list already
   handled folders/PDF/images; only https (falkon) and mailto (kmail2) were broken.
9. **Removing plasma-keyboard drags out plasma-desktop/workspace/setup/sddm** — disable
   via kwin `InputMethod=`, never remove. Same trap as cycle23's podman→bootc.
10. **Containerfile hostname is false-green** — podman bind-mounts `/etc/hostname`.
    Hostname is set in the kickstart and CONFIRMED working.

## 8. THE CURRENT BUG — DN-17
cycle26 showed the wizard still reads **"Welcome to Plasma Desktop"** even though the
en_US catalog resolves correctly under plain gettext. So the catalog is right and
something in KDE's layer never consults it. Two candidate causes, NOT separated:
(a) ki18n treats `en_US` as its untranslated SOURCE language and skips catalogs;
(b) `plasma-setup.service` runs with no `LANG`.
cycle27 covers BOTH: a systemd drop-in sets `LANG=en_US.UTF-8` and
`LANGUAGE=en_GB:en_US`, plus a merged en_GB catalog (upstream's "Password:" entry
preserved). **CAVEAT: proven only at the gettext layer. Do NOT mark DN-17 closed on a
container test again — cycle26 is why this fix exists.**
What DID work in cycle26: `LookAndFeelPackage` under `[KDE]` — the wizard's buttons now
render in the SP+ dark scheme where cycle20's were stock light.

## 9. DECISIONS (do not relitigate)
- **Test fixtures must read as tests.** "Advisor Test Printer" STAYS. Christopher:
  "If its test, keep it reading like test… we arent trying to fool anyone."
- **8 GB RAM. Slow installs are expected — "Its about opperations."** Optimise the
  running system, not the installer.
- **Batch 2–4 verified fixes per build.** Builds are the bottleneck.
- **plasma-setup must NEVER be removed** — under DN-13 it is the only path that creates
  the advisor's account. Its `UserGroups=wheel` knob left unchanged deliberately.
- Removing the wizard's redundant hostname page was CONSIDERED AND REJECTED — it gambles
  on the only account-creation path hours before the demo.
- No secrets in the image. `spplus-test` is disposable and must never reach ISO/repo.
- No work on main. Never `--no-verify`.

## 10. LEDGER STATE (all committed, branch session/sp-plus-plan)
```
54530c7 Fin approval gate was a presence check, not authenticity  <-- NOT in cycle27
c1325b4 second attempt at wizard headline, covering both causes
13dab04 three friction fixes — links, mailto, terminal, Brave
8db23cb catalog into the build context root
9ff9ca0 lane: fix plymouth gate + add spb-bootshot
b18ba32 ledger: cycle24 — DN-15 was the lane, not the product
5786fd6 DN-15 real cause + swappiness + menu 44->22
```
`~/.pi` repo: `a445a8d permission-gate: close the gaps an adversarial probe found`.
`~/SP-PLUS-STATE.md` narrative is current through cycle24 + the DN-15 correction.

## 11. TOOLS BUILT THIS SESSION
- `~/sp-plus-bee/spb-bootshot [extra-kargs]` — boots while screendumping the VGA panel
  every 2s into `<cycle>/strip/`. A single screenshot always races spb-boot answering
  the passphrase. THIS is what found DN-15's real cause.
- Scratchpad tests: `pigate.test.mts` (48 cases), `pigap.test.mts` (16 adversarial),
  `apptest.sh`, `livetest.sh`, `fintest.sh`, `approvaltest.sh`, `mimecheck.py`.
  Run TS with `node --experimental-strip-types`.

## 12. NEXT ACTIONS, IN ORDER
1. **Read cycle27's result** (watcher b933t22us / `~/spb-cycle27.log`). Quote assertion
   lines VERBATIM, never a verdict.
2. **Capture the first screen**: `CYCLE=cycle27 ~/sp-plus-bee/spb-screen firstscreen`
   then READ the png. It must say **"Welcome to SP+"**. That is DN-17's only proof.
3. **Free port 2299 before the next build.**
4. **Build cycle28** carrying the Fin approval fix (54530c7) + whatever else batches.
5. Create the lane account (`spb-boot 'rd.break=pre-pivot'` → `spb-mkuser spbtest
   spplus-test` → `spb-boot` → `spb-login`) and re-run the three LIVE gates.
6. Update `~/SP-PLUS-STATE.md` narrative + commit after each cycle. Run
   `spb-hygiene --apply`.
7. **When an ISO is good enough to be proud of, SAVE IT** (Christopher's instruction) —
   then keep fixing.

## 13. ENVIRONMENT
- `sudo -n` works for **podman only**.
- SSH to a guest: `SSH_ASKPASS=<script> SSH_ASKPASS_REQUIRE=force DISPLAY=:0 setsid -w
  ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o IdentitiesOnly=yes
  -o NumberOfPasswordPrompts=1 -p 2299 spbtest@127.0.0.1`. No sshpass/expect on this box.
- Build context root is `projects/sp-plus` — NOT `images/kde`. Verify container tests
  with the SAME context or you validate a path that cannot resolve (cost cycle25).
- Every `RUN` chain line must end with `\`.
- `dnf remove --assumeno` against the image is the ONLY trustworthy reverse-dependency
  check. `dnf repoquery --whatrequires` on an installed system returns empty for everything.
- `/tmp` is a 16 GB tmpfs — never copy a repo into it.
- A VM named `chris` belongs to Christopher. Never kill it.

## 14. HONEST STATUS
Demo is 09:30 CST, ~9 hours out. The ISO installs, boots, sets its hostname, reaches the
account wizard, has 22 menu entries, 76 enabled units, and 17/18 applications verified to
start. Fin's RPC boundary is sound and its one real hole (forged approval ids) is fixed but
NOT YET IN AN ISO. **Nobody has ever driven this desktop to completion** — no account has
been created through plasma-setup, no application has been opened by a human, and the
"Welcome to SP+" headline has never been seen on a panel. Those are the unproven things.
