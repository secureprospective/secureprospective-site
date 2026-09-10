# SP+ HANDOFF -> CLAUDEBOX (CT105), 2026-09-10

You are taking over an SP+ session mid-flight. **An ISO build is running right now on the
Beelink.** Read section 3 before doing anything else.

Fedora bootc only. The Debian lane is a parked idea with no code -- never mention it in a
status summary.

---

## 1. WHAT THIS SESSION DID

Alpha v0.10 is released and Dell-tested. An overnight Bee sweep of it produced a defect list;
this session fixed the agreed batch and started the ISO that carries the fixes.

- SP+ repo: `~/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`,
  tip **`4f05de6`**, tree clean.
- Site repo: `~/work/secureprospective-site`, branch `sp-plus-alpha-release`, tip `d355461`,
  pushed, clean. **CT105 owns merge to `main`. The Beelink never deploys.**

Commits this session, newest first:

| Commit | What |
|---|---|
| `4f05de6` | T-33 deferred -- Fin's guardrail gets decided in actual use |
| `d932645` | payload ref bumped alpha3 -> alpha4 |
| `eaf0faa` | **T-36** Brave Shields warm-up + **T-32** deprecated policy replaced |
| `9f7b461` | resume document for the pre-build fix batch |
| `d3d0b5d` | T-31b, T-28, T-30, T-21, T-23, T-24, gate honesty |
| `7efe018` | twips guard raised above 220 so it fires on the bug it names |
| `8e72d3b`, `2fd9bd3` | T-20 container overflow, T-31a 6.3pt -> 12pt |

---

## 2. GATES

| Gate | State |
|---|---|
| `tests/preflight-gate.sh` | **10 passed, 0 failed** |
| `tests/config-preflight.sh` | **39 passed, 0 failed -- "Safe to build."** |
| `tests/libreoffice-xcd-check.py` | `LIBREOFFICE_XCD_CHECK_OK` |
| `tests/libreoffice-parity-gate.sh` | **Red against the alpha3 image: 15 of 68 fail.** Every failure is a real defect that shipped in v0.10. **It should go to 0 against alpha4. That is the proof the fixes reached the image and not just the source -- run it first.** |

---

## 3. IN FLIGHT RIGHT NOW -- THE ISO BUILD

- Driver: `~/fleet/bin/sp-plus-iso-build.sh`, started **10:48 local**, PID was `33208`.
- `SPPLUS_BUILD=20260910`, payload tag `localhost/sp-plus-kde:alpha4`.
- Log: **`~/logs/sp-plus/iso-build-20260910-104801.log`**
- As of writing it is on **STEP 11/196**, the pinned Brave RPM install. It has been slow --
  the Fedora mirrors were running at ~460 KiB/s. Slow is not stuck.

**Is it alive?**
```bash
pgrep -af "[s]p-plus-iso-build.sh"
grep -oE 'STEP [0-9]+/196' ~/logs/sp-plus/iso-build-20260910-104801.log | tail -1
```

**Three steps:** payload container (196 layers) -> installer container -> image-builder in a
privileged container producing `bootc-generic-iso`. Normally 15-25 min end to end; this one is
slower because of the mirrors.

**Where the ISO lands:**
```
~/work/secureprospective-advisor-os/projects/sp-plus/artifacts/spikeB-rootful/out/
  bootc-sp-plus-1.0-bootc-generic-iso-x86_64/
```

**If it fails,** the log is the evidence. The most likely failure is a Containerfile
assertion -- the Containerfile is full of deliberate `grep -q` gates that fail the build
rather than ship a wrong file. **Read which assertion fired before changing anything.** A
`COPY` change invalidates cache and can fire an assertion that has not executed in weeks;
that is not a regression.

**When it finishes, hand Christopher the path and the size immediately.** He wants artifacts
as soon as they exist, not withheld pending further verification. Then:

1. Run `tests/libreoffice-parity-gate.sh` against the new image -- 15 failures should become 0.
2. Render-check **T-28** (`[hidden]` actually hides) and **T-30** (exactly one Help entry).
3. Verify inside the ISO before it moves: the embedded kickstart ref must read
   `containers-storage:localhost/sp-plus-kde:alpha4` and the embedded image id must match the
   payload's. On 2026-09-04 that mismatch shipped an ISO where every install died in Anaconda
   with "does not resolve to an image ID".

---

## 4. WHAT WAS FIXED, AND HOW EACH WAS VERIFIED

| Item | Verified how |
|---|---|
| **T-20** container overflow, 5 screens | Driven on the rig at 1280x800 in all three failing states |
| **T-31a** body text 6.3pt -> 12pt | Writer on the rig shows `12 pt` |
| **T-31b** Office ribbon | Writer on the rig opens with the ribbon |
| **T-36** Brave Shields | See section 5 -- measured both ways on the rig |
| **T-32** deprecated policy | Read off `brave://policy` on a live browser |
| **T-28** `[hidden]` must hide | Root cause proven; render check pending the build |
| **T-30** hide empty KDE Help Center | Containerfile + gate; needs the build |
| **T-21 / T-23 / T-24** | Source-level |
| LibreOffice first-run wizard | Clean open, no dialog |

---

## 5. T-36 IN DETAIL -- AND A CORRECTION YOU MUST NOT UNDO

Christopher found Brave not blocking ads on the Dell.

**The evidence originally logged in TODO.md was WRONG, and this session corrected it.** It was
read off the mtimes of `Default/adblock_cache/engine0.dat` / `engine1.dat` and concluded the
filter lists took **8h13m** to arrive. Those files are a **serialization cache of an engine
that has already been built** -- they are not the filter lists and they are not what makes
blocking work. Re-measured from a genuinely cold profile on the rig:

| | Cold profile | Seeded profile |
|---|---|---|
| Default adblock component present | **25s** after first launch | at launch |
| Shields badge at 22-45s | **none** | **blocking** |
| At ~2 min | 5 blocked | -- |

So it is a **first-minute** defect, not an all-day one. That does not shrink it: the first page
an advisor ever loads is inside that minute. The cold control also got AccuWeather's
notification prompt and its cookie dialog; the seeded run did not.

**The fix as shipped.** `/usr/libexec/spplus-brave-shields-warmup`, run once by a first-login
user unit (`spplus-brave-shields-warmup.service`, stamped at
`%S/sp-plus/brave-shields-warmed`). It fetches the lists `--headless=new` with
`--component-updater=fast-update` into a **throwaway** profile, then copies the finished
components into the advisor's real profile.

**Do not "simplify" it to warm the real profile directly.** Brave is single-instance per
`--user-data-dir`. A warm-up holding the advisor's real profile means their click on Brave
opens **no window at all**. That is why the throwaway directory exists, and the preflight gate
asserts it.

It matches the component by its **declared name**, not its opaque extension ID, so an upstream
rename fails loudly at first login instead of quietly shipping empty Shields. No network at
first login is not a fault: the unit fails, leaves no stamp, a later login retries.

**Policy.** The managed policy set 24 keys and **not one concerned Shields** -- the whole
feature rested on an upstream default that nothing asserted. It now also sets
`ComponentUpdatesEnabled: true` and `BraveShieldsDisabledForUrls: []`, and the preflight
checks them. Mutation-tested red before green.

**Evidence on disk:**
- `~/logs/sp-plus/testvm/shots/t36-seeded-22s-20260910T153953Z.png` -- blocking at 22s
- `~/logs/sp-plus/testvm/shots/t36-cold-accuweather-20260910T153054Z.png` -- no badge at 45s
- `~/logs/sp-plus/testvm/shots/t32-policy-search-20260910T154033Z.png` -- `PromotionalTabsEnabled`
  status **Error**, `PromotionsEnabled` status **OK**

**Not proven, and only the Dell can close it:** that the warm-up finishes on a spinning disk
before the advisor opens Brave. The check takes seconds -- open `brave://components` and read
the version beside **Brave Ad Block Updater**. `0.0.0.0` means nothing is being blocked.

---

## 6. A BUILD-PATH DEFECT FIXED THIS SESSION

`~/fleet/bin/sp-plus-iso-build.sh` hardcoded the payload tag `localhost/sp-plus-kde:spike`
while the shipped kickstart said `:alpha2`, `:alpha3` and so on. That is why every alpha ISO
had to be built by hand outside the sanctioned path to keep the two strings in step. The
script now reads `installer/payload-ref.txt`, the same single source of truth the installer
image already gates on, and refuses to build if it is empty.

**Consequence for you:** to cut the next ISO, bump `installer/payload-ref.txt` AND
`installer/interactive-defaults.ks` together, then run the script. Nothing else needs editing.

Note the ordering trap: `config-preflight.sh` asserts the payload tag **already exists in the
rootful podman store**, which it cannot before STEP 0 has run. On a fresh tag, preflight will
fail that one check until the payload container is built. That is expected, not a defect.

---

## 7. HYPOTHESES ALREADY REFUTED -- DO NOT RETEST

- **A VM-only symptom is not a defect.** Flameshot, the black screen after resume,
  "hibernation unsupported" and the Welcome autostart were all QEMU artifacts. Christopher
  settled them from the Dell: Flameshot works, sleep works, **hibernate works 1-in-2 on a
  spinning disk and is accepted**, autostart is correct. See
  `docs/ledger/DELL-VERIFIED-2026-09-10-alpha-v0.10.md`.
- **`engine*.dat` is not the ad-block signal.** See section 5. The component directory is.
- **`Active = Tabbed` is wrong.** LibreOffice stores the notebookbar **.ui filename**:
  `Active = notebookbar.ui`. Observed by dispatching `.uno:ToolbarMode` on a fresh profile and
  diffing `registrymodifications.xcu`.
- **DefaultFont heights are 1/100 mm, not twips.** 1pt = 35.28. 12pt = 423, 14pt = 494,
  10pt = 353. The old value 220 rendered at 6.2pt.
- **`FirstRun=false` and `WhatsNewDialog=false` do NOT suppress the first-run wizard.** Only
  matching `ooSetupLastVersion` to the running version does. A LibreOffice update brings the
  wizard back; the probe now fails when the pin drifts.
- **An `.xcd` whose declared `<dependency file="...">` is missing is silently skipped WHOLE.**
  Verify new component/package names against the image, not against documentation.
- **Brave headless picks X11 ozone and exits** with `Missing X server or $DISPLAY` unless you
  pass `--ozone-platform=wayland` or use `--headless=new`. Two earlier "tests" were VOID for
  this reason and proved nothing in either direction.
- **A localhost origin is not a valid ad-block test.** A fetch to a known ad host from a
  `127.0.0.1` page loads even with Shields working. Use a real site and read the Shields badge.
- **`pkill -f <pattern>` over SSH matches its own command line** and kills the shell.
  Bracketing the pattern is not enough if the literal string appears elsewhere in the command.
- **`bootc status` needs root** -- `sudo -n bootc status`.
- **Welcome exits 0 silently** when "do not show this setup again" is set. Use `--force`.
  It is NOT the single-instance lock.
- **`vmtype` does not reach QtWebEngine fields; `vmclick type` does.**
- R2: `wrangler r2 object put` hard-refuses >300 MiB; R2 multipart is **S3 API only**; CT105's
  account token cannot mint S3 keys. Once real keys exist use **rclone** (`~/fleet/bin/rclone`).
  `~/fleet/bin/r2-put-large` was written for the dead v4 mpu route and is useless as written.

---

## 8. THE TEST RIG

- libvirt domain **`fedora-alpha-test`**, `qemu:///session`, desktop live.
- Guest user `test` / `play123`; LUKS `play123`.
- **SSH `-p 2223 -i ~/.ssh/spplus-testvm -o IdentitiesOnly=yes test@127.0.0.1`.**
  The forward is a RUNTIME `hostfwd_add` and **does not survive a VM restart**:
  ```
  virsh -c qemu:///session qemu-monitor-command fedora-alpha-test --hmp \
    'hostfwd_add hostnet0 tcp:127.0.0.1:2223-:22'
  ```
- **`~/fleet/bin/vmlogin`** takes a cold or rebooted VM through LUKS and SDDM to a confirmed
  desktop in ~21s. Mutation-tested red then green across a real reboot.
- `vmdesktop` is the guard; `vmclick` for pointer/keys/type; `vmshot <label>` for screenshots
  (a **label**, not a path).
- **If the rig goes dark, suspect guest s2idle before sshd, the display or the boot.** A
  suspended guest is invisible to the hypervisor: `domstate` still says `running (booted)` and
  `dompmwakeup` refuses. Recover with `virsh reset` then `vmlogin`.
- All Brave test profiles and the `adsrv-test` user unit from this session were reaped; `/tmp`
  in the guest is clean.

---

## 9. STILL OPEN

- **Alpha v0.10 is still not downloadable.** Blocked on an R2 **Object Read & Write** token
  (Access Key ID + Secret) only Christopher can mint, dropped at `~/.config/fleet/r2.env`.
  Then: rclone the ISO up, verify size **5452943360** and sha256
  `5e10d090d07b28b6809003b12fa5f65a8a0b51630121349916ec2d95ecc8d221`, flip `published: true`
  in `functions/_lib/releases.ts`, build, commit, push for CT105 to merge.
  Cloudflare account is **`002dd2f758b67ac08d05a3809d65a25a`** (SecureProspective), NOT the
  personal `7ebaacec...` account that wrangler defaults to.
- **Cost note Christopher must weigh:** the ISO is ~5.1 GiB and R2's free tier is 10 GB-month.
  alpha4 plus the un-uploaded v0.10 exceeds it. He uses no paid services, so old ISOs get
  retired rather than accumulated. **Ask him whether alpha4 replaces v0.10 rather than
  joining it.**
- **T-25** and **T-27** are decisions Christopher still owes.
- **T-33 is decided: defer.** "We will decide Fin with actual use." No guardrail is added. Do
  not reopen it as an ask.
- Observation, unlogged as a defect: the SDDM login screen is stock Breeze blue while the LUKS
  prompt immediately before it is fully SP+ branded.

---

## 10. STANDING RULES THAT BIND WHOEVER HOLDS THIS

- **Never send email without explicit per-message permission.** Composing an unsent draft is
  the correct way to help with a reply.
- **All SP+ execution and verification runs on the Dell or a VM, never on the Beelink**, which
  is Christopher's live desktop and only a place to dispatch from.
- **Beelink `sudo` permits `podman` ONLY.**
- Subordinate agents may not run **any** git command, act on the Beelink, touch another VM,
  rebuild anything, or contact an outside service.
- Live production deploys need Christopher's approval for that specific deploy.
- Any move, rename or deletion is recorded old -> new in `~/MOVED.md`,
  `~/archive/MANIFEST.md`, and CT105's `/root/.claude/backbone/context.md`.
  Never `mv` a git repo or worktree -- use `~/.reorg/tools/reorg-move.sh`.
- Gates must be able to fail. A check that cannot produce a negative result is a false
  positive, not evidence. Mutation-test red before claiming green.
- Written code is not working software. Nothing is done until it has been observed working.

---

## 11. HONEST STATUS

Nine items are fixed and verified on the rig; both preflight gates are green; the ISO carrying
them is building and had not finished when this was written. The LibreOffice parity gate is
red against the OLD image for fifteen real reasons and is the single best proof-of-landing to
run against the new one.

What is genuinely unproven: **everything about alpha4, because it does not exist yet.** T-28
and T-30 have never been render-checked on a built image. The Brave warm-up has never run on
the Dell. And the website side has not moved since yesterday -- it still rests on one
dashboard action only Christopher can take.
