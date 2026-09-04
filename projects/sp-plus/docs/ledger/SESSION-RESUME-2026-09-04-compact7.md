# SP+ RESUME — compact #7, 2026-09-04

## 1. WHAT WE ARE DOING

SP+ is an immutable KDE / Fedora-bootc "advisor OS". **`20260904e` IS THE ALPHA RELEASE. It is
built, fully verified, and sitting in `~/Downloads`.** The only thing between it and publication
is the upload method — see §5, which is a decision, not a bug.

- Repo: `~/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190), branch
  `session/sp-plus-plan`, HEAD **`fa17fbb`**, clean.
- CT105 reaches it with `ssh -i /root/.ssh/beelink chris@192.168.1.190`.
- Site repo: `~/work/secureprospective-site`, `main` = `a1fc639`, clean, DEPLOYED. Untouched
  this session.

## 2. IN FLIGHT — NOTHING

**No build is running. No background job of mine is running.** Nothing to orphan.

- `spplus-test` **no longer exists**. `virsh list --all` now shows **`fedora-alphaTEST`
  (running)**, which is **Christopher's own VM — DO NOT touch, stop, or reap it.**
- Check for a build with — never `pgrep -f sp-plus-iso-build`, it matches your own wrapper:
  ```bash
  ssh -n -i /root/.ssh/beelink chris@192.168.1.190 \
    "pgrep -af 'image-builder|podman build' | grep -v 'bash -c'"
  ```
- 2 dangling podman images remain, held by a live container. Left on purpose; do not force-remove.

## 3. THE ARTIFACT — THIS IS THE RELEASE

| | |
|---|---|
| Path | `/home/chris/Downloads/sp-plus-1.0-alpha-20260904.iso` |
| Checksum file | same path + `.sha256` |
| Size | **5,448,759,296** |
| sha256 | `7e8e795fa3c018dfa7a651c50d7931b8bd23d53ac4a922fa77e4793fa2cc355c` |
| Build | `SPPLUS_BUILD=20260904e`, `PRETTY_NAME=SP+ 1 (20260904e)` |
| Log | `~/logs/sp-plus/alpha-20260904e.log` |
| Source ISO | `projects/sp-plus/artifacts/spikeB-rootful/out/bootc-.../*.iso` — **same sha256, verified** |

**Verified INSIDE the image, not from the log:** absent — thunderbird, plasma-workspace-wallpapers,
boto3, libreoffice-base, libreoffice-math, qemu-kvm, virt-manager, libvirt-daemon-kvm,
qemu-system-x86-core. Present — libreoffice core/writer/calc/draw/**impress**, podman, bootc,
flatpak, spectacle, gwenview, `Next` wallpaper, `Kvantum/Modern`, `impress.xcd`, both Flatpak
preinstalls, `mailto=org.mozilla.Thunderbird.desktop`, **locales = exactly 3 (en en_US en_GB)**,
and Welcome carrying the Boxes row + `04 / BROWSE EVERYTHING`.

All gates green: `TRIM_OK` · `FINAL_TRIM_OK usr_bytes=6933164102 packages=2007 locales=3` ·
`ADVISOR_TOOLKIT_OK … no-virt /dev/kvm=0666` · `FLATPAK_PREINSTALL_OK` · `GLOBAL_THEME_DEFAULT_OK
themes=12` · `MENU_OK visible_entries=35` · `POSTURE_GATE_OK` · `KEYRING_GATE_OK` ·
`CRASH_GATE_OK` · `STORE_GATE_OK`.

Screenshots filed at `~/logs/sp-plus/welcome-boxes-2026-09-04/` (tools.png, vmnew.png,
vmscreen.png).

## 4. THE SIZE STORY — STOP PREDICTING, THE ESTIMATES ARE BIASED

**The ceiling I quoted all session was wrong.** R2's single-PUT limit is **4.995 GiB =
5,363,466,240 bytes** (5 GiB minus 5 MiB), not 5,368,709,120. Verified against Cloudflare docs.
Max object size via multipart is **4.995 TiB**, max **10,000 parts**.

So the Alpha is over the single-PUT limit by **85,293,056 bytes (81.3 MiB)**.

**I over-predicted the ISO saving THREE TIMES.** Do not trust a fourth.

| Build | Predicted | Actual |
|---|---|---|
| `d` (wallpapers+TB+boto3) | ~4.9 GB | 5,535,299,584 |
| `e` (locale+LO+virt) | ~5.335 GB | 5,448,759,296 |

`d`→`e` cuts measured **~192 MiB** by `tar | zstd -19` and delivered **86.5 MiB** of ISO — a
ratio of about **0.45**. The tar-of-a-path method is itself optimistic because the ISO is an
ostree/erofs payload plus installer runtime, not a tarball of `/usr`. **There is no predictor
here worth trusting. Measure a built ISO or say nothing.**

Remaining candidates, all measured by the biased method (halve them mentally):

| Candidate | tar+zstd | Verdict |
|---|---|---|
| `/usr/share/doc` | 59 MiB | only real one left; costs offline help |
| Gwenview | 7.7 MiB | also needs a mimeapps rewrite (image/png+jpeg point at it) |
| Spectacle | ~2–3 MiB | it is how the preview/QC screenshots get taken |
| Impress | <1 MiB | **CANNOT** — see §6 |

## 5. THE DECISION IN FRONT OF CHRISTOPHER — MULTIPART vs MORE CUTS

**Recommendation: ship `20260904e` as-is and upload with rclone multipart.**

- Multipart is **invisible to the advisor**: R2 assembles the parts into one ordinary object;
  one file, one URL, one progress bar, resumable. `functions/api/download/iso.ts` streams it with
  Range/206 either way.
- **The site code already anticipates it.** `functions/_lib/releases.ts` carries the comment:
  *"R2 does not return a whole-object sha256 for a multipart upload … the sha256 worth printing
  is the one the build computed."* The advisor-facing value is `X-SPPlus-Sha256` from the
  committed manifest; the ETag goes to HTTP caching only. **A multipart ETag is a
  digest-of-digests with a `-N` suffix — never show it as a checksum.**
- **Cost: $0.** 13 Class A ops ≈ $0.00006, inside the 1M/month free tier. Storage 5.449 GB
  inside the 10 GB-month free tier. **Egress is free** — the same file on S3 would be ~$490 per
  1,000 downloads. A *second* retained release costs ~1.4¢/month.
- Only real caveat: a killed multipart upload strands billable parts invisible to a normal
  listing. Set a lifecycle rule to abort incomplete uploads, or check `ListMultipartUploads`.

Cutting another 81 MiB buys nothing an advisor would ever notice.

## 6. HYPOTHESES REFUTED — DO NOT RETEST

**New this session:**
- **"Impress is a free 791 KiB cut."** FALSE and dangerous. `impress.xcd` is owned by
  `libreoffice-impress`, and `spplus-office-parity.xcd` declares `<dependency file="impress"/>`.
  LibreOffice **skips an .xcd whose declared dependency is missing**, so removing the package
  SILENTLY kills the whole DN-48 parity layer — ribbon, Office keybindings, `.docx` default save.
  A build gate now asserts `impress.xcd` survives.
- **"Firmware is 307 MiB of easy win."** FALSE. 1.01× compression makes it the biggest
  uncompressed block, but 127 MiB is `intel/` (wifi + bluetooth + GPU) and most of the rest is
  other wifi or `amdgpu`. Cutting it ships a laptop with no network. Safe subset (cxgb4, bnx2x)
  ≈ 5 MiB.
- **"Dropping LibreOffice Base frees java's 247 MiB."** FALSE, refuted twice now. `/usr/lib/jvm`
  is required by libreoffice-**core**. Base frees 65 MiB installed / **15.8 MiB of ISO**.
- **"Removing Gwenview is clean."** PARTLY FALSE — `kimageannotator` is NOT shared with
  Spectacle (checked), but `/etc/xdg/mimeapps.list` pins `image/png` and `image/jpeg` to
  `org.kde.gwenview.desktop`; removing it leaves images with no handler, silently.
- **"qemu-user-static-aarch64 should go too."** REVERSED BY ME. It removes cleanly (its
  `containers-common-extra` dep is the rich conditional `(… if fedora-release-identity-server)`,
  absent here) but it is ~4 MiB and its assertion sits near the end of a 2662-line build.
  Not worth failing a release build 25 min in. Reasoning is in the Containerfile — do not
  "finish the job".
- **"Boxes will need the advisor in the `kvm` group."** FALSE. `/dev/kvm` is `MODE="0666"` from
  **systemd-udev's** `50-udev-default.rules` line 116 — not from any qemu package. Gated now,
  because if it ever moves into a qemu subpackage Boxes degrades to TCG emulation SILENTLY.

**Carried forward, still true:**
- `dnf repoquery --whatrequires` returns EMPTY on an installed system. Only
  `dnf remove --assumeno` tells the truth.
- Thunderbird's Flathub id is **`org.mozilla.Thunderbird`**, not Fedora's
  `net.thunderbird.Thunderbird`. virt-manager's is **`org.virt_manager.virt-manager`**
  (underscore). Both checked against the Flathub API.
- ibus is 294 MiB installed and **16 MiB of ISO**. podman/openblas/pyside6/qt6-qtwebengine and
  paper-icon-theme are all NOT cuttable (bootc, Spectacle, akonadi, khelpcenter+Discover,
  `sp-plus-calm`).
- Theme choice survives reboot. Orchis legibility was the translucent panel, fixed with
  `panelOpacity=1`.

## 7. THE LESSON THAT COST THE MOST THIS SESSION

**A gate must be downstream of every operation that can violate it.** I put the locale purge in
the step-18 trim. **Six `dnf install` transactions run after step 18** and re-lay translation
files. The step-18 gate would have printed `locales=3` while the shipped ISO carried dozens and
~119 MiB quietly returned — green build, silent loss. The Containerfile's FINAL STORE GATE block
already documents this exact mechanism and I did it anyway. Fixed in `a088a00`: one purge, below
every install, which also re-asserts the whole cut set against the finished filesystem.

Related, same shape: **`/usr/share/licenses` (1,203 dirs, 15.2 MB) IS NOT A SIZE CANDIDATE.** It
is how SP+ meets the GPL/LGPL obligation to ship licence text with ~2,000 redistributed binaries.
It sits beside `/usr/share/doc` in `du` output at a quarter the size. Gated in `fa17fbb`.

## 8. DECISIONS (Christopher)

- **D-i** Thunderbird → Flatpak after boot, like Joplin. Help copy stays as written.
- **D-j** Cut stock wallpapers, **keep `Next`**.
- **D-k** R2, not Google Drive.
- **D-l** Own code GPL-3.0-or-later; brand by trademark.
- **D-m (2026-09-04)** Cut locales to English-only, and LibreOffice Base + Impress + Math.
  **Impress was NOT cut — see §6. Christopher has not yet ruled on that reversal.**
- **D-n (2026-09-04)** Take QEMU/libvirt off the ISO; offer **GNOME Boxes** from Welcome's
  Optional Tools as the Windows path; promote it on the site.

## 9. COMMITS THIS SESSION (branch `session/sp-plus-plan`)

| Commit | What |
|---|---|
| `67510d0` | English-only locales + LibreOffice Base/Math |
| `7ca7d68` | QEMU/libvirt off the ISO; GNOME Boxes in Welcome + gate |
| `a088a00` | locale purge moved downstream of every dnf install |
| `fa17fbb` | LICENSES.md regenerated from 20260904e + `scripts/generate-licenses.sh` |

Earlier in the day (already in): `d61c6f1`, `36c7a81`, `6dbfc4c`, `45f31f3`, `efd620d`,
`9aa618c`, `732b9cf`.

## 10. NEXT ACTIONS, IN ORDER

1. **Get Christopher's call on §5** — multipart (recommended) vs cutting `/usr/share/doc`.
2. **Install `20260904e` on a fresh VM and run `tests/runtime-posture-gate.sh` — must be 18/18.**
   This is the LAST unverified thing about the release. `fedora-alphaTEST` is Christopher's;
   make your own VM, do not reuse his.
3. **Confirm the Impress reversal** with Christopher (§6) — he ordered it cut, I did not cut it.
4. **Site work not started:** promote Boxes as the Windows path on
   `~/work/secureprospective-site`. No copy drafted yet.
5. **Then Cloudflare** — §11.

## 11. CLOUDFLARE — BLOCKED ON CHRISTOPHER, NOTHING STARTED

Server side is written and deployed: `functions/api/download/iso.ts` (Range/206 streaming),
`functions/_lib/releases.ts` (manifest), `src/pages/members/download.astro` (live, empty state).

**The existing Cloudflare token has NO R2 permission** — verifies active, returns
`Authentication error (10000)` on `/r2/buckets`. Account id `002dd2f758b67ac08d05a3809d65a25a`.

Christopher must, in the dashboard: enable R2 · create bucket **`sp-plus-releases`** (no public
access) · create an R2 API token (Object Read & Write) → `~/.r2_credentials` on the Beelink
(chmod 600). Then bind **`SPPLUS_RELEASES`** on the Pages project and redeploy.

- **rclone v1.75.0** already at `~/fleet/bin/rclone` (user-local).
- Manifest expects key **`sp-plus/sp-plus-1.0-alpha.iso`** (UNDATED) even though the local file
  is dated. After upload commit `size`, `sha256`, `published: true` into `releases.ts`.
- **Never echo the token into chat** — one leaked on 2026-06-21 and had to be rolled.

## 12. ENVIRONMENT NOTES

- Beelink is the ACTIVE repo; CT105 is backup. Never sync silently.
- **Do not litter `/home/chris`.** The home root holds exactly 4 files; I dropped ~40 scratch
  files there this session and had to clean them up. Write scratch to the CT105 scratchpad and
  `scp` single-purpose scripts, or use `~/scratch/`.
- **Quoting mangles through ssh** — `scp` a script file instead of a heredoc. Bit me again today.
- **`pgrep -f <pattern>` matches your own wrapper command line.** Match on `podman`/
  `image-builder` and filter `bash -c`.
- **`sudo -n` fails in a detached/nohup shell** (no TTY, no cached credential) — it silently
  killed my first ISO copy. The build artifacts are mode 644; plain `cp` works.
- **Launcher exit 0 is NOT completion.** Wait for `Image build successful`.
- **NEVER run a KDE GUI binary over plain SSH.** To run Welcome in a guest session use
  `systemd-run --user`, which inherits `WAYLAND_DISPLAY`/`XDG_RUNTIME_DIR`/the session bus.
  `welcome.py --screen 7` opens straight to Optional Tools; `QT_QPA_PLATFORM=offscreen` works
  for the layout gate and needs no display. Capture the guest with
  `virsh -c qemu:///session screenshot <vm> out.ppm`.
- Welcome resolves its app dir as `Path(__file__).resolve().parent`, so a copied source tree
  loads its own `app/index.html`.

## 13. HONEST STATUS

**The Alpha is real, complete and verified — except for one thing: it has never been installed.**
Every claim in §3 was checked inside the container image, and the Welcome UI was confirmed
running in a VM. But no machine has booted this ISO, and `runtime-posture-gate.sh` has not run
against it. The 18/18 posture result is from **RC1f**, a different image. Until item 2 in §10 is
done, "verified" means verified-in-image, not verified-on-hardware.

Also genuinely unproven: **clicking `ADD GNOME BOXES` has never been executed.** The bridge
allowlist, the markup, the layout and the Flathub id are all verified; the actual install of a
~500 MB Flatpak on a machine with no QEMU has not been. That is the one advisor-facing claim in
this release resting on reasoning rather than observation.

Known and accepted: the taskbar mail icon is inert between first login and the Flatpak
preinstall timer completing.
