# SP+ RESUME — compact #6, 2026-09-04

## 1. WHAT WE ARE DOING

SP+ is an immutable KDE / Fedora-bootc "advisor OS" heading for its **first public release**,
**"SP+ 1 Alpha"**. The build now running IS the Alpha. The release must fit under
**R2's 5 GiB single-upload ceiling (5,368,709,120 bytes)**; RC1f was 5,683,275,776, so ~300 MiB
had to come out. Three cuts were made to achieve that.

- Repo: `~/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190), branch
  `session/sp-plus-plan`, HEAD `9aa618c`, clean.
- CT105 reaches it with `ssh -i /root/.ssh/beelink chris@192.168.1.190`.
- Site repo: `~/work/secureprospective-site`, `main` = `a1fc639`, clean, DEPLOYED.

## 2. IN FLIGHT RIGHT NOW — THE ALPHA BUILD

**`SPPLUS_BUILD=20260904d`**, started 2026-09-04 ~06:45 CDT, ~25 min, 192 steps.

- Log: `~/logs/sp-plus/alpha-20260904d.log`
- **Check alive — DO NOT use `pgrep -f sp-plus-iso-build`:**
  ```bash
  ssh -n -i /root/.ssh/beelink chris@192.168.1.190 \
    "pgrep -af 'image-builder|podman build' | grep -v 'bash -c'"
  ```
  `pgrep -f` MATCHES MY OWN WRAPPER COMMAND LINES. That trap made me report a dead build as
  "running and climbing" for seven hours on 2026-09-04. Match on `podman`/`image-builder` and
  filter out `bash -c`, or read the log's mtime.
- **Launcher exit 0 is NOT completion.** Wait for `Image build successful` in the log.
- **The step that failed twice is STEP 18** (the trim). Confirm it passed with
  `grep -c TRIM_OK ~/logs/sp-plus/alpha-20260904d.log` — 1 means past it.
- Artifact lands at
  `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/*.iso`

**`spplus-test` VM is SHUT OFF.** It is the old RC1f install and is now expendable — the
per-user staging it carried is redundant once the Alpha installs. Nuke and reinstall from the
Alpha ISO.

## 3. THE THREE CUTS (all committed, none yet in an ISO)

| Cut | Installed | **ISO effect (measured)** |
|---|---|---|
| `plasma-workspace-wallpapers` | 255 MiB | **~255 MiB** — wallpapers do not compress |
| Thunderbird → Flatpak | 381 MB | **~131 MiB** |
| `python3-boto3` + botocore + s3transfer | 119 MiB | **~30 MiB** |
| **Expected total** | | **~416 MiB → ISO near 4.9 GiB** |

**THE MEASUREMENT THAT DECIDED ALL OF THIS** (zstd -19 on the RC1f guest):

| Content | On disk | Compressed | Ratio |
|---|---|---|---|
| `/usr/share/wallpapers` | 331,929,825 | 330,460,160 | **1.00x** |
| Thunderbird | 381,069,817 | 131,415,422 | 2.9x |
| ibus | 154,381,445 | 15,674,491 | 9.8x |
| unicode data | 170,038,792 | 15,888,137 | 10.7x |

**Package size is a bad predictor of ISO size.** This is why ibus was NOT cut despite looking
like a 294 MiB win, and why the wallpapers were the only cut that actually closed the gap.
Wallpaper split if more is ever needed: cutting ALL wallpapers except the 8 themes' own frees
309,090,825 bytes (294.8 MiB) — only ~40 MiB more than the package alone, and nearly all of that
40 MiB is **`Next`**, which Christopher ruled KEEP as the fallback (a build assertion now fails
if it disappears).

## 4. HYPOTHESES REFUTED — DO NOT RETEST

- **"repoquery --whatrequires tells you what depends on a package."** FALSE on an installed
  system — it returns EMPTY for packages with obvious dependents. The Containerfile already
  recorded this and I used it anyway. **Only `dnf remove --assumeno` tells the truth.**
- **"Dropping libreoffice-base frees java's 237 MiB."** FALSE. Base frees 65 MiB; java is
  required by libreoffice-CORE, and removing it takes all 709 MiB of LibreOffice.
- **"ibus is a 294 MiB win."** FALSE — 16 MiB of ISO. See the ratio table.
- **"Thunderbird's Flatpak id is the RPM's id."** FALSE. Flathub publishes
  **`org.mozilla.Thunderbird`**; Fedora ships `net.thunderbird.Thunderbird.desktop`. Verified
  against the Flathub API both ways — the RPM id returns nothing there.
- **"paper-icon-theme is an unused 62 MiB leaf."** FALSE — the build gates on `Paper-Mono-Dark`
  and `sp-plus-calm` uses it.
- **"podman / openblas / pyside6 / qt6-qtwebengine are cuttable."** FALSE — they take bootc,
  Spectacle, akonadi, and khelpcenter+Discover respectively.
- **"Theme choice does not survive reboot."** FALSE (verified compact #5).
- **"Warming the ink fixes Orchis legibility."** FALSE — the translucent panel was the cause;
  `panelOpacity=1` fixed it.

## 5. TWO BUILD FAILURES ALREADY DIAGNOSED AND FIXED

1. **RC1g (20260904b) died at step 142** — `FAIL ...modern.light: missing declared Kvantum skin
   'Modern' asset`. The trademark rename changed the declaration to `Modern` but left the asset
   directory `Windows-modern`. Fixed in `6dbfc4c`; a source gate now reads the declared name and
   checks the asset, negative-tested.
2. **Alpha (20260904c) died at step 18** — my own wallpaper commit dropped a trailing backslash,
   so the RUN ended on `grep -q "google-noto.*cjk"`, which **exits 1 exactly when it correctly
   finds nothing**. Fixed in `9aa618c` plus `tests/containerfile-continuation-gate.py`, wired
   into preflight as P-24b and negative-tested.

**Preflight caught neither.** It reads source, and both were valid shell — just not the shell
intended. It is now 34 checks.

## 6. COMMITS THIS SESSION (branch `session/sp-plus-plan`)

| Commit | What |
|---|---|
| `d61c6f1` | Modern preview/thumb assets renamed off `windows-*` |
| `abc5b22` | Breeze Light light panel — **REVERTED, see D-h** |
| `36c7a81` | the revert of `abc5b22` |
| `6dbfc4c` | Kvantum skin restored + boto3 trim |
| `45f31f3` | Thunderbird → Flatpak |
| `efd620d` | stock wallpapers cut, `Next` kept |
| `9aa618c` | line continuation restored + continuation gate |

## 7. DECISIONS (Christopher, this session)

- **D-g** Rename the internal `windows-*` preview assets to `modern-*`. Done. The
  **`windows-modern` ICON THEME is upstream and stays.**
- **D-h** **Drop the Breeze Light panel fix** rather than re-shoot its preview card. The fix is
  written and reverted, recoverable from `abc5b22`. Cost of taking it later: one staging round
  with Christopher, because **he composes the preview shots, not a script**
  (`welcome/PREVIEW-CAPTURE-CONTRACT.md`).
- **D-i** Cut boto3/botocore and Thunderbird; **Thunderbird returns as a Flatpak after boot,
  like Joplin.** Help and info files stay as written even though they describe it as installed.
- **D-j** Cut the stock wallpapers, **keep `Next`**.
- **D-k** R2, not Google Drive, for the download. (Carried from compact #5.)
- **D-l** Own code GPL-3.0-or-later; brand by trademark. Non-commercial is impossible.

## 8. NEXT ACTIONS, IN ORDER

1. **Wait for `Image build successful`** in `~/logs/sp-plus/alpha-20260904d.log`. Watch for
   `TRIM_OK`, `FLATPAK_PREINSTALL_OK zoom + thunderbird declared`, `GLOBAL_THEME_DEFAULT_OK`,
   `POSTURE_GATE_OK`, `KEYRING_GATE_OK`, `CRASH_GATE_OK`.
2. **Check the ISO size first** — it is the whole point:
   `ls -l .../out/**/*.iso`. Under **5,368,709,120** = the cuts worked.
3. **Verify in the image**: `BUILD_ID=20260904d`; `/usr/share/Kvantum/Modern/Modern.kvconfig`;
   `! rpm -q thunderbird`; `/usr/share/flatpak/preinstall.d/sp-plus-thunderbird.preinstall`
   naming `org.mozilla.Thunderbird`; `test -d /usr/share/wallpapers/Next`;
   `! rpm -q plasma-workspace-wallpapers`; `mailto=org.mozilla.Thunderbird.desktop` in
   `/etc/xdg/mimeapps.list`.
4. **Rename and place it**: `~/Downloads/sp-plus-1.0-alpha.iso` + sha256. That exact filename is
   what `functions/_lib/releases.ts` already expects.
5. **Nuke and reinstall `spplus-test`** from the Alpha; run `tests/runtime-posture-gate.sh`
   (must stay **18/18**).
6. **Then Cloudflare** — see section 9.

## 9. CLOUDFLARE — BLOCKED ON CHRISTOPHER, NOTHING STARTED

Everything server-side is already written and deployed: `functions/api/download/iso.ts` streams
from the binding with Range/206, `functions/_lib/releases.ts` holds the manifest, and
`src/pages/members/download.astro` is live showing its empty state.

**Verified: the existing Cloudflare token has NO R2 permission** — it verifies active but
returns `Authentication error (10000)` on `/r2/buckets`. Account id
`002dd2f758b67ac08d05a3809d65a25a`.

Christopher must, in the dashboard: enable R2 · create bucket **`sp-plus-releases`** (no public
access) · create an R2 API token (Object Read & Write) and drop the keys into
`~/.r2_credentials` on the Beelink (chmod 600). Then the binding **`SPPLUS_RELEASES`** on the
Pages project, which needs a redeploy.

- **rclone v1.75.0 is already installed** at `~/fleet/bin/rclone` (user-local, no system change).
- **Multipart is mandatory if the ISO is over 5 GiB** — that is the entire reason for the cuts.
  If the Alpha lands under, a simple upload works.
- Free tier is 10 GB stored, zero egress; one ISO is ~5 GB of it.
- After upload: commit `size`, `sha256`, `published: true` into `releases.ts`.

## 10. ENVIRONMENT NOTES

- Beelink is the ACTIVE repo; CT105 is backup. Never sync silently.
- **The site's `main` rejects MERGE COMMITS** — `git merge --ff-only` only. The sandbox
  classifier also blocks `git merge` from CT105; relay via `beelink:~/Downloads/paste.md`.
- Test VM: user `test` / `testtest`, LUKS `spplustest`, key `~/.ssh/spvm`, port 2222. Connect
  with `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`.
- **LUKS + login after a cold boot are GRAPHICAL** — use `virsh -c qemu:///session send-key`.
- **NEVER run a KDE GUI binary over plain SSH** — three coredumps came from this.
- `/tmp` on the guest is tmpfs; use `/home/test`.
- Beelink `/tmp` had a stale `copy.py` shadowing the stdlib `copy` module and breaking every
  `python3` run from `/tmp`. Removed. If python breaks oddly there, look for this again.
- Quoting: complex `python3 - <<EOF` heredocs mangle through ssh. **scp a patch script instead.**

## 11. HONEST STATUS

**No ISO has ever contained this work.** Twelve commits — the theme rename, the licence files,
the previews, and all three size cuts — exist only in git. Two builds have already failed on
them, both from rename/edit slips that preflight could not see, and both are now gated.

The ~4.9 GiB projection is arithmetic from the zstd measurements, **not a measured ISO**. The
size when it lands is the only number that settles whether the R2 path works at all.

Proven on real hardware and still true: the security posture (18/18 on RC1f), theme switching
and persistence across all 8 themes, and the site changes (live, verified by URL).

Known and accepted: **the taskbar mail icon is inert** between first login and the Flatpak
preinstall timer completing.
