# SP+ RESUME — 2026-09-09, compact #1

## 1. WHAT WE ARE DOING

Fixing the defects that slipped through the last build so SP+ can be **formally offered**.
Christopher's constraint: **the next ISO is the final one before release.** Nothing gets built
until every known defect is fixed and everything cheaply verifiable has been verified.

- **ACTIVE repo (Beelink, 192.168.1.190):** `/home/chris/work/secureprospective-advisor-os`
- Project subdir: `projects/sp-plus`. Branch **`session/sp-plus-debian-plan`**, tip `af1718d`,
  **tree clean (0 dirty)**. (Branch name is misleading — it carries the Fedora work too.)
- `~/work/sp-plus-build` is a **stale detached-HEAD clone**. Do not work there.
- **Lane settled 2026-09-09: STAY ON FEDORA bootc.** Christopher ruled. Debian 13 is a parked
  idea with zero code. **Do not mix the Debian lane into SP+ status, defect lists or work.**

## 2. IN-FLIGHT RIGHT NOW (most perishable)

**`spplus-alpha2-test` QEMU VM is RUNNING and Christopher is LOGGED INTO IT, testing by hand.**
**DO NOT shut it down, reset it, or drive its input.** He is working through the punch list in §9.

- Check alive: `virsh -c qemu:///session domstate spplus-alpha2-test`
- Disk: `/QEMU/images/spplus-alpha2-test.qcow2` (80 GiB sparse, on `/`, 327 GB free)
- Credentials (test fixtures): LUKS `testpassphrase1`; desktop `testadvisor` / `testpassword1`
  (in `wheel`, so sudo uses the same). SSH `ssh -i ~/.ssh/spvm -p 2222 testadvisor@127.0.0.1`.
- The domain XML was redefined to use the **passt backend with portForward 2222→22**; a plain
  `type='user'` interface rejects `<portForward>`.
- No builds, no dispatches, no agents running. No orphaned helper processes.

**The Dell (HW-00) is live and untouched**, up 1 week+, running the 09-02 image. It moved DHCP
lease again: **`test@192.168.1.197`** (NOT `.134`, NOT `.201` — see TRAP 3). Key `~/.ssh/spvm`.

## 3. WHAT WAS ACCOMPLISHED THIS SESSION

**First successful SP+ install of the entire cycle.** alpha2 installed to completion in QEMU,
rebooted, unlocked, logged in, desktop up. Evidence:
`~/logs/sp-plus/alpha2-install-2026-09-09/` — 8 screenshots, 01 through 08.

Two commits, both pushed-ready on `session/sp-plus-debian-plan`:

- `1c2b4b6` — Welcome "do not show this setup again" fix + new gate
- `af1718d` — TODO.md: closed T-07, T-08, T-09 against measured evidence

## 4. GATES / STATUS

| Gate | Result | Where run |
|---|---|---|
| `tests/runtime-posture-gate.sh` | **18/18, all controls in effect** | Fresh alpha2 install, via 127.0.0.1:2222 |
| `tests/welcome-no-show-gate.sh` (NEW) | **4/4** | Both the Dell and the fresh alpha2 install |
| ISO sha256 | **verified OK** | `sha256sum -c` |
| `config-preflight.sh` | not re-run this session | — |

## 5. ARTIFACTS THAT EXIST AND WORK

- `~/Downloads/SP-PLUS-1.0-alpha2.iso` — **5,451,438,080 bytes**,
  sha256 `d697fd741db742de69a4a52d5df0edb05b60b9d254fb3e3752a9b6e280550bec`. **Verified installable
  end to end.** Contains the T-07/08/09 fixes; does NOT contain today's Welcome fix.
- Installed VM image digest: `sha256:d4db4a1ffd9afb6740392a48fee6533ff0975cc0771bf0099512c041d140644d`
  (Version 1, 2026-09-04T22:43:57Z).
- Rootful podman: `localhost/sp-plus-kde:alpha2` (11 GB), `localhost/sp-plus-installer:alpha2` (3.98 GB).
- ghcr `sp-plus-kde`: `latest` = `20260902b` = `testlane` = `sha256:ca2fad9e...` (2026-09-02T01:37:19Z);
  `20260902` = `sha256:89c2347a...`.
- **`/QEMU/base-archive/fedora-kinoite-dd672611.tar`** — content-faithful copy of the dead base.
- Helper written this session: `<scratchpad>/vmdrive.py` — drives the VM by QMP `input-send-event`
  (absolute clicks, typing, screenshots). This is the fix for T-10's "defective instrument".

## 6. DEFECTS — CURRENT TRUTH

**Closed this session, with measured evidence:**

- **T-07 (grey graphical installer) — RESOLVED.** Was fixed 2026-08-26 by `f22887b` (`autovt@` →
  `anaconda-shell@` symlink in BOTH `/usr/lib` and `/etc`, plus `ReserveVT=2`) and by
  `iso.yaml` making **`inst.graphical` the DEFAULT entry**, text mode second. TODO.md claimed the
  opposite for two weeks and named a "leading candidate" already in the tree.
- **T-08 (LUKS passphrase UX) — RESOLVED for the graphical path.** Storage spoke shows "Encrypt my
  data." + "You'll set a passphrase next"; Done opens DISK ENCRYPTION PASSPHRASE (confirm field,
  strength meter, layout warning); first boot shows the SP+-branded "Enter your passphrase to
  unlock this computer" and it unlocks. **D34 satisfied.** Text mode is now academic, not blocking.
- **T-09 (`--ondisk=vda`) — RESOLVED.** Kickstart names no disk; `%pre` picks the largest writable
  non-removable non-USB disk via `lsblk` and refuses rather than guessing. **Confirmed on virtio.
  STILL UNCONFIRMED on the Dell's SATA `sda`.**

**Welcome "do not show this setup again" — ROOT CAUSE FOUND, FIXED, NOT YET IN AN IMAGE.**
The checkbox wrote `localStorage`. `QWebEngineProfile.defaultProfile()` is **off the record** —
measured on the Dell: `offTheRecord = True`, `storagePath = '.../QtWebEngine/OffTheRecord'` — so
that storage is in memory and dies with the process. `--reset-no-show` was clearing a `QSettings`
store **nothing ever wrote to**. Fixed: preference lives in QSettings, shell owns it, and the
decision is made **before the window is built** (the old `loadFinished` placement caused a visible
flash at every login and no opt-out at all when the page failed to load). Added an
`SPPLUS_INSTANCE_NAME` env seam — without it the advisor's running Welcome owns the single-instance
socket and every gate launch returns instantly having tested nothing.
**Christopher re-observed this defect on the running VM on 2026-09-09. That is EXPECTED — alpha2
predates the fix. Do not re-investigate it.**

**New, found this session, not yet fixed:**

- **Dev text leaks to the advisor on the install progress screen:** "Advisor bootc diagnostic:
  using supported --skip-finalize; Anaconda owns final target cleanup" and "Bootc deployment
  complete: containers-storage:localhost/sp-plus-kde:alpha2". Cosmetic, on screen ~13 minutes.
- **Welcome overflows the viewport at 1280×800** (screen 07 "Optional tools + store" confirmed).
  Violates the standing "every Welcome screen must fit one viewport, no scrolling" rule. Correct at
  higher resolution. Christopher: low priority, "don't stress, easy fix only". Needs card density
  reworked for short viewports — no one-liner.

## 7. THE DELL UPDATE LANE — WHAT IS ACTUALLY TRUE

The timers fire **perfectly**: `spplus-stage-update` ran every day 09-02→09-09, zero misses, zero
failures. `spplus-update-health` = OK daily.

**But nothing has ever been staged, and the reason is not a bug:**

```
booted:        sha256:fe211ce2...  timestamp 2026-09-02T11:59:05Z
ghcr :latest:  sha256:ca2fad9e...  timestamp 2026-09-02T01:37:19Z
```

`bootc upgrade --check` says "Update available". `spplus-update-control` says `current` with the
note *"The update source is older than this computer"*. **The guard is correct** — it refuses
downgrades by timestamp, exactly as designed after the 2026-09-01 near-miss. The Dell's own running
digest exists under **no ghcr tag at all**.

**Verdict: the schedule works, the guard works, and the update path has never once been exercised
against a genuinely newer image.** Eight days of "up to date" is a gate that could not have failed.

## 8. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The Flatpak `No such ref ... in remote flathub` warnings are a defect."** NO. Re-ran the unit
  2026-09-09: appstream pulled cleanly (11.0 MB), "Nothing to update", zero ref errors. Installed
  Zoom 7.1.5.4332 already matches Flathub's current version. Those were transient remote-summary
  fetch failures the unit is explicitly designed to survive. I flagged this as a defect and was
  wrong; the correction is recorded here so it is not re-flagged.
- **"T-07 and T-09 are open."** NO — both were fixed weeks ago; only the ledger was stale.
- **"The installer defaults to `inst.text`."** NO. `iso.yaml` defaults to **`inst.graphical`**;
  text is the second entry. Verified in the GRUB menu of the actual alpha2 ISO.
- **"The Dell is at 192.168.1.134 or .201."** NO. It is at **192.168.1.197**. TRAP 3: the IP moves
  across reboots. Scan, do not theorise. `.201`/`trader` in HARDWARE-MATRIX.md is stale.
- **"`virsh` can add `<portForward>` to a plain `type='user'` interface."** NO — libvirt refuses:
  *"can only be used with the 'passt' backend"*. Add `<backend type='passt'/>`.
- **"`'<backend type=' not in xml` proves there is no interface backend."** NO — the TPM device
  carries `<backend type='emulator' version='2.0'/>` and false-matches.
- **"The social platform list is hardcoded in Welcome."** NO. It is served by Social at
  `https://social.secureprospective.com/.well-known/sppl` and rendered in the order served.
- **"Editing `sppl.json` directly will hold."** NO. `sppl.timer` runs `/opt/postiz/bin/gen-sppl.sh`
  **every 2 minutes** and regenerates it, deriving each platform's `state` from whether that
  provider's credentials exist in `.env`. The change must go in the generator.
- **"nc is available in the SP+ image."** NO — `nc: command not found`. Use `curl -T` to a PUT
  receiver instead.
- **"`runtime-posture-gate.sh` runs inside the guest."** NO. It is a REMOTE harness: it SSHes to
  `test@127.0.0.1:2222`. Run it from the Beelink against the VM. It correctly refuses to pass when
  it cannot reach the target ("That is a harness problem, not a pass").

## 9. DECISIONS (do not relitigate)

- **Fedora bootc, not Debian.** Settled 2026-09-09 by Christopher.
- The next ISO is **the final one before release**.
- Social platform list: **keep Facebook, LinkedIn, YouTube only.** Remove Bluesky, LinkedIn Page,
  X, Instagram, Threads, TikTok, Pinterest, Mastodon. Others are added **on request** — that
  affordance replaces the removed entries. Must stay readable after trimming.
- Christopher will run the **bootc rebase test on the real Dell** himself once there is a good ISO.
- Do NOT blanket-prune podman: the irreplaceable `dd672611` base lives in **ROOTFUL** storage.

## 10. NEXT ACTIONS, IN ORDER

1. **Wait for Christopher's punch-list findings** from the running VM (§11). They set the fix list.
2. **Trim the social capability document to Facebook / LinkedIn / YouTube** and add the "on request"
   affordance. Edit **`/opt/postiz/bin/gen-sppl.sh` on CT106**, not `sppl.json`.
   **BLOCKED: no SSH route to 192.168.1.31 — `Host key verification failed`.** Ask Christopher for
   the access route (likely `pve` 192.168.1.200 → `pct enter 106`).
3. **Fix the dev-text leak** on the install progress screen (§6).
4. **Decide on `gh`.** Not installed; Beelink sudo permits `podman` ONLY. Proposal already put to
   Christopher: install as a user-local binary under `~/.local/bin` — no root, and `gh auth login`
   still uses device flow, never a PAT. **Awaiting his yes.**
5. **Phase 3 — prove the update lane can update.** Build the payload, push to ghcr with a timestamp
   genuinely NEWER than the Dell's, let the Dell's own daily timer stage it, then power-cycle and
   confirm `ostree-finalize-staged` applies it. This is the real end-to-end test and needs no
   hand-driving.
6. **Phase 4 — the final ISO.** **Rebase `session/sp-plus-base-repin` onto HEAD first** — it is 8
   commits behind and its own commit message says DO NOT SHIP FROM THIS COMMIT. Then
   `config-preflight.sh` → 39/39, build payload → installer → ISO, and **verify the payload ref
   INSIDE the ISO** before it moves.
7. Consider the 1280×800 Welcome overflow before the final build.

## 11. THE PUNCH LIST GIVEN TO CHRISTOPHER

Never verified on any build: theme round trip (Breeze→Windows→Breeze, twice); Fin launch/`/login`/
ask; printer flow; help search with live suggestions; Welcome update button status→check→stage;
Finish Setup closes cleanly. Advisor-facing: Office "Other account" paste path; optional installs
actually install; Discover opens Flathub; yellow never as text on light; no jargon leakage. System:
sleep/resume; shutdown applies a staged update; second reboot→unlock→login.
Told him NOT to bother with: the no-show checkbox, and the 1280×800 overflow.

## 12. MACHINE / ENVIRONMENT NOTES

- Beelink sudo permits **`podman` ONLY** — not scripts, not `rm`, not `virsh -c qemu:///system`.
- Rootful podman: 1244 images, 47 GB, only 3 dangling. **Never blanket-prune.**
- `spplus-reg` (port 5000) is **NOT running**, though `~/NOW.md` lists it as live. Left alone.
- `~/NOW.md` is stale in two ways: it predates the lane decision, and its reap path
  `~/sp-plus-gates/` is wrong — the real one is `~/work/sp-plus/gates/reap.sh` (cron, every 15 min,
  running clean).
- `SP-Alpha-Rig` was shut down this session: idle 24h, holding a 12 GB allocation. `butter` was
  already off. Memory now 15 GB available.
- Reaped 6 MB of replayable `.ppm` from the scratchpad. Filing gate: **PASS**.

## 13. HONEST STATUS

alpha2 installs, boots, unlocks, logs in and passes 18/18 runtime posture. That is real and it is
the first time this cycle. **It is not the release candidate** — it lacks today's Welcome fix, it
was built on a base digest that no longer exists upstream, and the base re-pin has never been built
or gated.

Unproven and openly so: the bootc rebase on advisor hardware; the update lane against a genuinely
newer image; the disk picker on the Dell's SATA `sda`; text-mode install; everything on the §11
punch list. Christopher's standard for this release is "absolutely flawless, 100% before
distributing" — **not met, and should not be claimed.**
