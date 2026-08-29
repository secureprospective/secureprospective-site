# ISO 44 — what is new, what is proven, what must be tested after install

Written 2026-08-29. Supersedes the earlier draft of this file.
Preflight at time of writing: **24 gates, 0 failed, "Safe to build."** Tree clean.

Legend for "Proven":
- **HW** — run on real hardware (the Dell) and observed working.
- **GATE** — enforced by a build gate and/or preflight, each proven by a
  negative test, but never executed on a machine.
- **NONE** — written and reviewed only.

A GATE is not a working feature. Gates stop a regression; they do not prove the
thing ever ran. Everything marked GATE below is a post-install test, not a
completed item.

---

## 1. What is new in this ISO

| # | Change | Proven | Note |
|---|---|---|---|
| DN-32 | `spplus-tune` survey + `/var/lib/sp-plus/THIS-MACHINE.md` | HW | EDID bug found + fixed on hardware |
| DN-32 | **"HAVE FIN CHECK MY COMPUTER"** button, first on the Fin screen | HW | via self-test: "up to date. Nothing was changed." |
| DN-30 | Daily update-health timer (persistent) | GATE | reuses the tuner's detector |
| DN-33 | Source gate asserts the `--system` Flatpak contract | GATE | old gate encoded the BUG and blocked the build |
| D1 | Welcome installs Flatpaks system-scope via `sudo -n` | HW | Bitwarden installed end to end |
| DN-34 | **`flatpak update` timer** — nothing updated Flatpaks before | GATE | staggered off preinstall (flatpak lock) |
| DN-36 | Wi-Fi power saving disabled in image content | GATE | latency measured, fix NOT yet applied on HW |
| DN-37 | Screenshot capture no longer writes to read-only `/usr` | GATE | never worked on any real install |
| DN-38 | **Headless `--self-test`** QC harness | HW | bypasses the single-instance lock |
| DN-39 | Office folder check actually checks the folder | HW (partial) | unreachable case correct; reachable case needs a real share |
| DN-40 | **GVFS + `gvfs-smb` shipped** | NONE | image not yet rebuilt — see §4 |

## 2. The two defects that would have shipped

**DN-40 — the office folder feature could never have worked.** GVFS was not in
the image at all: no packages, no `/usr/libexec/gvfsd-smb`, no mount definition.
GIO answered every mount with `NOT_SUPPORTED`, "volume doesn't implement mount".
Every advisor connecting their office folder would have failed, on every machine,
and been told to check the folder name.

**DN-39 — the check was racy by construction.** `mount_enclosing_volume` and
`unmount_with_operation` are ASYNC and were called as though synchronous, so
nothing waited for the mount. A live host and 203.0.113.1 (unroutable) returned
the identical sentence.

Both were found by the DN-38 self-test within minutes of it first working.
**Four GUI QC dispatches before it produced 24 UNVERIFIED results and neither
finding.** That is the argument for the harness.

## 3. Fixed on the Dell but NOT yet in the image — DECISION NEEDED

Suspend was masked on the Dell directly (`/etc`, machine-local). It is NOT in
the image and NOT in git.

Cause: the Dell entered S3 ("PM: suspend entry (deep)") and never resumed. The
journal ends on that line; LED solid, not pulsing; hard reset required. BIOS A08
(2014) + Haswell-ULT does not resume reliably. Applied: all five sleep targets
masked, logind ignore for lid/idle/suspend key, PowerDevil `AutoSuspendAction=0`
in the correct nested `[AC][SuspendAndShutdown]` group. Verified 30 samples,
0 unreachable, 35 min uptime, 0 suspend attempts.

**Do NOT blanket-mask suspend fleet-wide.** Advisors on battery want suspend, and
this is 2014 firmware. The image-level version should be a targeted quirk keyed
on hardware where resume is known broken. Christopher's call.

## 4. Test after installing ISO 44 on the Dell

### A — blocking. If these fail, stop.
1. Machine boots to desktop; LUKS unlock works.
2. `bootc status` — one deployment, `incompatible: false`, no layered packages.
3. `systemctl --failed` — read every failure, do not skim.
4. **`test -x /usr/libexec/gvfsd-smb`** — DN-40. If missing, the package name
   did not resolve in F44 and the office feature is still dead.
5. `systemctl is-enabled spplus-flatpak-update.timer spplus-update-health.timer`
   — both enabled. `systemctl list-timers` shows a real NEXT for both.

### B — the self-test does most of the work
6. Run `welcome.py --self-test`. Expect check-computer PASS, print-test REPORTED
   with a clean sentence, check-share-unreachable PASS naming the host.
7. **Office folder against a REAL share** with real credentials — the one case
   never tested. Confirm three distinct outcomes: wrong password, wrong folder
   name, and success. Confirm no permanent mount is left behind.

### C — the button (the advisor's first contact with Fin)
8. Click **HAVE FIN CHECK MY COMPUTER** as the advisor, not over ssh.
9. `/var/lib/sp-plus/THIS-MACHINE.md` written, displays separated by EDID.
10. Confirm it says nothing was changed — and that nothing was.

### D — REQUIRES-HUMAN, the self-test cannot do these
11. `apply-theme` — colours, icons, window frames, panel, cursor, fonts all
    change together. A readback of the same theme before and after is a FAIL.
12. `launch-fin`, `browse-store`, `connect-email` — each opens the right window.
13. `install` — a Flatpak installs system-scope and appears in the menu.
14. All 7 screens: clipping, overlap, scrollbars, off-screen controls.

### E — the two other laptops
15. Run the tuner on both. Different hardware is the point: confirm displays,
    power daemon and storage are detected correctly and nothing is asserted
    that is not true of that machine.

### F — not proven, do not assume
16. **`bootc rollback` has NEVER been tested.** Prove it deliberately before any
    advisor depends on it. It is the safety net under automatic updates.
17. **DN-36 Wi-Fi**: confirm `iw dev wlp2s0 get power_save` reports off and
    re-measure LAN latency. Baseline: 71.6 ms avg / 125.6 ms max, wired 1.38 ms.

## 5. Still blocked on Christopher

- ghcr package must be **public** or advisor machines cannot pull updates at all
  (currently 401 UNAUTHORIZED to anonymous).
- A **`:stable`** tag. Machines currently track `:edge`.
- One push token, on the build machine only. Advisors need nothing.
- Then: `bootc-fetch-apply-updates.timer` + image signing, which is the durable
  decision pair. Auto-updating AND unverified is worse than either alone.
