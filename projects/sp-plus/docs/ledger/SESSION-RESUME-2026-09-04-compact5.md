# SP+ RESUME — compact #5, 2026-09-04

## 1. WHAT WE ARE DOING

SP+ is an immutable KDE / Fedora-bootc "advisor OS" heading for its **first public release**
("SP+ 1 Alpha") on a Dell laptop. RC1f is built and its security posture is proven. Since then,
nine commits of theme, licensing and preview work have landed that are **in no ISO yet**.
**The next action is to build RC1g.**

- Repo: `~/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190), branch
  `session/sp-plus-plan`, HEAD `916706b`, clean.
- CT105 reaches it with `ssh -i /root/.ssh/beelink chris@192.168.1.190`.
- Build: `SPPLUS_BUILD=<date> ~/fleet/bin/sp-plus-iso-build.sh` (rootful podman; ~25 min).
- Test VM harness: `~/fleet/bin/spplus-testvm.sh {install|up|down|nuke|info}`.
- Site repo: `~/work/secureprospective-site`, `main` = `origin/main` = `a1fc639`, clean, DEPLOYED.

## 2. NOTHING IS IN FLIGHT

No build, no dispatch, no agent, no install. Verified:
`pgrep -af "tom-run.sh|claude -p|podman build|image-builder|spplus-testvm.sh install"` → empty.

**`spplus-test` VM is RUNNING (id 13) and is GOOD — do not nuke it.** It is a clean RC1f install
plus deliberate per-user staging (below). Filing gate PASS, 23 entries. Disk: 108 G free on
/home, 330 G on /.

### Per-user staging on the guest — this is why things "work" there
`/usr` is READ-ONLY (bootc). To test RC1g-only changes, these were staged into per-user paths,
which Plasma reads with higher precedence:
- `~/.local/share/color-schemes/Orchis.colors` — warm palette
- `~/.local/share/plasma/look-and-feel/com.github.vinceliuice.Orchis/` — opaque panel + 12h clock
- `~/.local/share/wallpapers/SPPlus-Quiet-Coast/` — the new wallpaper
- `~/.spplus-harness/welcome-theme-apply-e2e.py` — the theme switcher
Helper scripts on the Beelink at `/tmp/{shoot,switch,walk,verify3,wptest}.sh` (ephemeral).

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `tests/config-preflight.sh` | **33 passed, 0 failed — "Safe to build."** at `916706b` |
| `tests/runtime-posture-gate.sh` | **18/18 `RUNTIME_POSTURE_OK`** against RC1f (RC1e failed 11) |
| Theme switching, all 8 | apply cleanly; all four properties confirmed BY EYE |
| Theme persistence | survives a clean cold boot |
| Site (`/members`) | live and verified on secureprospective.com |

## 4. ARTIFACTS THAT EXIST

- `~/Downloads/sp-plus-1.0-rc1f-20260904.iso` — 5,683,275,776 bytes,
  sha256 `ef5e96015bbe8fc0c6f9ae1ef10e77b27ae71b250452399f9ca085c3ffce147a`. BUILD_ID `20260904a`.
- Keep also: `test55`, `test56`, `sp-plus-1.0-20260901`, `rc1c`, `rc1d`, `rc1e`.
- Images: `localhost/sp-plus-kde:spike`, `localhost/sp-plus-installer:latest`, **ROOTFUL** store.
- Tom's theme report: `~/fleet/tom/out/spplus-theme-switching.out` (9,733 bytes).
- Theme walk evidence: `~/logs/sp-plus/theme-walk/` (per-theme shots + state files).
- Build log: `~/logs/sp-plus/rc1f-20260904a.log`.

## 5. COMMITS SINCE RC1f WAS BUILT — none of these are in any ISO

| Commit | What |
|---|---|
| `df403ee` | theme renamed off Microsoft's mark (ids + LICENSE/TRADEMARK/LICENSES) |
| `07f7494` | Welcome labels MODERN LIGHT / MODERN DARK |
| `5ed2ce7` | theme e2e harness fixed (was failing on working software) |
| `8c51a8a` | Orchis card says what it actually does |
| `9b8ac5f` | Orchis contrast failure fixed + warm type |
| `1e384a6` | Orchis panel opaque + 12-hour clock |
| `06c2279` | SP+ Quiet Coast wallpaper for Orchis |
| `12b8181` | Quiet Coast licence cleared (Pexels) |
| `916706b` | all 8 Welcome theme previews re-shot |

## 6. DECISIONS (Christopher, this session)

- **D-a** Cloudflare **R2**, not Google Drive, for the ISO download. Drive serves a virus-scan
  interstitial >100 MB and has an invisible per-file daily quota.
- **D-b** Retire the Claude Agent Kit wizard, Google provisioning, CRM adapter. DONE, deployed.
- **D-c** Own code → **GPL-3.0-or-later**; brand → trademark. **Non-commercial is impossible**
  (233 GPL-2.0+ / 66 GPL-3.0+ packages; GPL forbids field-of-use restrictions).
- **D-d** Theme renamed to **Modern Light / Modern Dark**, no "SP+" prefix.
- **D-e** **Keep Orchis** — the picker needs one genuinely different layout.
- **D-f** Wallpaper is Christopher's pick, from **Pexels**.

## 7. HYPOTHESES REFUTED — DO NOT RETEST

- **"Theme choice does not survive reboot."** FALSE. Clean `poweroff` + cold boot kept
  `modern.dark` + `windows-modern`. The earlier Breeze-Light result came from shutting down a
  session whose DISPLAY was wedged, so plasmashell never flushed.
- **"The posture gate found 3 real failures."** FALSE — all three were bugs in the gate.
  `pgrep -c` / `grep -c` PRINT `0` and exit non-zero, so `|| echo 0` produced `"0\n0"`.
  Also `[ ] && record PASS || record FAIL` recorded both. Fixed; now 18/18.
- **"Warming the ink fixes Orchis legibility."** FALSE. `51,51,51` on Orchis's light surfaces
  already measured **11.6:1**. The cause was a TRANSLUCENT PANEL over a busy wallpaper.
  `panelOpacity=1` (Opaque, established by testing 1/2/3 and looking) is what fixed it.
- **"Codecs / fonts are a licensing risk."** FALSE. Every media package is Fedora's `-free`
  variant, `noopenh264` is a stub, and only metric-clone fonts ship. Zoom and Joplin are flatpak
  PREINSTALL REFERENCES, not bundled binaries.
- **"crm-booking is wired into the catalog."** FALSE — zero references anywhere.
- **"The display freeze is a product defect."** UNRESOLVED but not reproduced since the reboot;
  nine theme applies and a cold boot with no repeat. Points at Tom's session, not the product.

## 8. STILL OPEN

- **Brave** is a third-party vendor RPM bundled in the image (`Vendor: Brave Software`,
  `License: Multiple, see https://brave.com/`). Redistribution permission unconfirmed. Fallback:
  move it to a Flathub reference like Zoom's.
- **Breeze Light renders a dark panel** under a light colour scheme (`plasmatheme=default`).
  Catppuccin Latte sets `breeze-light` and is correct. One-line fix, not yet made.
- **Asset filenames** are still `windows-dark.png` / `windows-light.png` for the Modern themes.
  Internal only. Christopher was asked and had not answered when the compaction came.
- **Quiet Coast photographer/URL** unknown. Licence does not require it; every other wallpaper
  names one.
- M-1 `spplus-grant-admin` scope · M-2 ISO signing + SBOM · T-17 installer sidebar.
- **R2 bucket does not exist.** The download page is live but shows its empty state. Needs:
  bucket + `SPPLUS_RELEASES` binding + upload + flip `published: true` in
  `functions/_lib/releases.ts`. The existing Cloudflare token cannot purge cache and probably
  cannot create buckets.

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher the two pending questions** (asset filename rename to `modern-*`; Breeze
   Light panel fix) — both are cheap and both are better done BEFORE the build than after.
2. **Build RC1g**: `cd ~/work/secureprospective-advisor-os && SPPLUS_BUILD=20260904b
   ~/fleet/bin/sp-plus-iso-build.sh`. Watch for `POSTURE_GATE_OK`, `KEYRING_GATE_OK`,
   `CRASH_GATE_OK`, and the wallpaper gate asserting `Image=SPPlus-Quiet-Coast`.
   **Launcher exit 0 is NOT completion** — wait on the sentinel/`Image build successful`.
3. **Verify in the image**: `BUILD_ID=20260904b`, look-and-feel dirs named `...modern.{dark,light}`,
   `Name=Modern Dark`, `/usr/share/wallpapers/SPPlus-Quiet-Coast`, `panelOpacity` in the Orchis
   layout, MODERN labels in `welcome/app/index.html`.
4. Copy to `~/Downloads/sp-plus-1.0-rc1g-20260904.iso` + sha256.
5. **Nuke and reinstall `spplus-test`** from RC1g. The per-user staging is then redundant and
   the wallpaper/rename become provable for the first time.
6. **Run `tests/runtime-posture-gate.sh`** — must stay 18/18.
7. Hand to Christopher: Orchis end-to-end through Welcome, the six PWAs, Joplin, crash-report
   email, Brave password saving.
8. Then: R2 bucket + upload + publish the download page.

## 10. ENVIRONMENT NOTES

- Beelink is the ACTIVE repo; CT105 is backup. Never sync silently.
- **The site's `main` is protected against MERGE COMMITS.** Use `git merge --ff-only`, never
  `--no-ff`. The sandbox classifier also blocks `git merge` from CT105 — relay via
  `beelink:~/Downloads/paste.md`.
- Test VM: user `test` / `testtest`, LUKS `spplustest`, key `~/.ssh/spvm`, port 2222. The VM's
  host key changed on rebuild — connect with `-o StrictHostKeyChecking=no -o
  UserKnownHostsFile=/dev/null`.
- **LUKS + login after a cold boot are GRAPHICAL prompts** — the serial autotyper does not reach
  them. Use `virsh -c qemu:///session send-key spplus-test --codeset linux KEY_S KEY_P ...`.
- Screenshots: `~/fleet/bin/vmshot spplus-test` → `~/logs/sp-plus/testvm/shots/`.
- **NEVER run a KDE GUI binary over plain SSH** (`kcmshell6`, `kioclient`, `systemsettings`).
  Three coredumps and three crash dialogs on Christopher's screen came from this.
- `/tmp` on the guest is tmpfs — a reboot wipes anything staged there. Use `/home/test`.
- Nextcloud: `cloud.secureprospective.com`, CT107 `192.168.1.30`, admin `spadmin`, password in
  `/opt/nextcloud/.env`. Theme edits need a cachebuster bump.

## 11. HONEST STATUS

**RC1g is not built.** Nine commits of theme, licence and preview work exist, preflight says
"Safe to build", and **none of it has ever been in an image**. Three things in particular are
unproven precisely because `/usr` is read-only and could only be tested through per-user
staging: the **theme rename**, the **Quiet Coast wallpaper**, and the **Modern labels**. The
build-time gate in the Containerfile is the mechanism that will catch them — it fails the build
if the wallpaper or its defaults entry is wrong.

What IS proven on real hardware: the security posture (18/18 on a booted RC1f guest), theme
switching and persistence for all 8 themes, and the site changes (live and verified by URL).
