# SP+ — RESUME (final ISO session, compaction #2, 2026-09-09 18:20 CDT)

Supersedes `RESUME-2026-09-09-final-iso-prep.md` (commit `dc976ac`), which is still accurate for
everything before the punch list. Read this one first.

## 1. WHAT WE ARE DOING

Getting SP+ to the **final ISO before release**. Fedora bootc only — the Debian lane is a parked
idea with zero code and must never appear in a status summary.

- Repo: `/home/chris/work/secureprospective-advisor-os`
- **Branch: `session/sp-plus-plan`** (renamed target this session; `session/sp-plus-debian-plan`
  still exists as a stale pointer at the same commit because it has a remote counterpart. Do not
  work on it. `config-preflight.sh` FAILS on any other branch name.)
- Tip: `22c3c12`. Tree clean.
- Christopher tested the alpha2 VM by hand tonight; I ran the rest of the punch list for him.

## 2. IN FLIGHT RIGHT NOW

**One thing: the `spplus-alpha2-test` QEMU VM, and it is deliberate.** Left running, unlocked and
logged in so Christopher can pick up testing. **Do not shut it down or drive its input without
saying so.**

- Alive: `virsh -c qemu:///session domstate spplus-alpha2-test` → `running`
- Disk `/QEMU/images/spplus-alpha2-test.qcow2`; credentials (test fixtures): LUKS
  `testpassphrase1`, desktop `testadvisor` / `testpassword1`,
  `ssh -i ~/.ssh/spvm -p 2222 testadvisor@127.0.0.1`
- Domain XML uses the **passt backend with portForward 2222→22**; a plain `type='user'` interface
  rejects `<portForward>`.
- **`<suspend-to-mem enabled='no'/>` — I put it back to 'no' after the sleep test.** Flipping it to
  'yes' and restarting the domain is what makes sleep testable, and it black-screens the VM (§6).

**No builds, no dispatches, no agents, no background jobs.** Nothing else to recover.

**The Dell (HW-00) is live and untouched**, up 7+ days on the 09-02 image, at `test@192.168.1.197`
(key `~/.ssh/spvm`). Its IP moves across reboots — scan, do not theorise.

## 3. WHAT WAS DONE THIS SESSION (after the compaction)

Christopher's instruction: run the whole punch list except items 2 (Fin), 7 (Office "Other
account"), 11 (warm/human copy) and 12 (sleep) — he kept those. Then, later, "make sure all these
fixes are ready for the new ISO, then test the sleep/wake up".

Three commits:

- `8505288` — the printer lane (find / choose / test) + two theme copy fixes
- `47fd412` — **both Fedora base pins re-resolved** (the build was going to fail without this)
- `22c3c12` — T-19 in the ledger: what sleep and resume actually do

## 4. GATES / STATUS

| Gate | Result | Where |
|---|---|---|
| `tests/config-preflight.sh` | **39 passed, 0 failed — "Safe to build."** | Beelink, on `session/sp-plus-plan` |
| `tests/printer-control-gate.sh` (NEW) | **6/6**, verified red by mutation | Beelink |
| `tests/welcome-no-show-gate.sh` | **4/4** against the edited `welcome.py` | Run on the VM (needs PySide6; SKIPs on the Beelink) |
| `tests/runtime-posture-gate.sh` | 18/18 (earlier, pre-punch-list) | alpha2 install over 127.0.0.1:2222 |

## 5. PUNCH LIST RESULT (items 2, 7, 11, 12 are Christopher's, untouched)

Evidence: `~/logs/sp-plus/punchlist-2026-09-09/` (71 PNGs) and `<scratchpad>/punch/`.

| # | Check | Result |
|---|---|---|
| 1 | Theme round trip Breeze ↔ Modern Light, twice | PASS — panel swapped and restored all 4 applies, structured verdict each time |
| 3 | Printer flow | **Was a dead end. Rebuilt — see §7** |
| 4 | Help search, vague/wrong words | PASS — "pasword" → Browser and passwords; "nothing comes out of the printer" → Printer not printing |
| 5 | Update status → check → stage | PASS — both refuse the older registry image, stating both timestamps, no error dialog |
| 6 | Finish Setup closes cleanly | PASS — process gone, no leftover socket |
| 8 | Optional install (Bitwarden) | PASS — 2026.8.0 installed from the button, row flips to ADDED, launches from the menu |
| 9 | Discover → Flathub | PASS — its only update is fwupd firmware; the rpm-ostree OS lane is absent as designed |
| 10 | Yellow never text on light | PASS — all 8 screens viewed + CSS audit; every yellow-text rule sits on blue |
| 13 | Shutdown applies a staged update | PARTIAL — wiring correct, never exercised, see §9 |
| 14 | Reboot → LUKS → login, twice | PASS — branded unlock, theme and resolution persisted |

## 6. SLEEP AND RESUME — MEASURED (T-19)

- Kickoff → Sleep suspends in ~4s. `PM: suspend entry (deep)` → `PM: suspend exit` 13s later.
  Real S3. Session, D-Bus, networking healthy afterwards; no failed units.
- **It wakes LOCKED, and this was proven, not assumed.** `kwin_wayland` holds a delay inhibitor
  "Ensuring that the screen gets locked before going to sleep"; after resume
  `org.freedesktop.ScreenSaver GetActive` → true and logind `LockedHint=yes`. Relevant because
  `config/kscreenlockerrc` ships `Autolock=false`; the resume lock is a separate setting.
- **The display never comes back, and it is the VM's GPU.** `kwin_wayland` logs
  `Pageflip timed out! This is a bug in the virtio_gpu kernel driver` once a second (28 times in
  one resume). `kscreen-doctor --dpms on` hangs. The framebuffer stays wedged **through a guest
  reboot** — only `virsh destroy` + `start` clears it.
- SP+ ships no logind, `sleep.conf` or powerdevil overrides, so this is stock Fedora KDE.
- **The Dell has never suspended once** (`PM: suspend entry` count is 0 across its whole journal).
  It must not be suspended unattended — if resume fails, nobody is at the keyboard.

## 7. THE PRINTER LANE (Christopher's correction, and the fix)

He said: *"Why do we not have a 'find printer button' then they select the printer(s) on the
network and then test page, dont hide everything."* The card had done one silent check and, with
no queue, told the advisor to "open printer settings" — naming an application it never opened,
with no button at all.

Built and committed in `8505288`:

- `projects/sp-plus/config/spplus-printer-control` — privileged helper, same one-JSON-object
  contract as `spplus-update-control`. `discover` (drops the CUPS backends from the answer),
  `list`, `add` (no silent overwrite of a same-named queue; sets the default).
- `welcome.py`: `PrinterControlWorker` + verbs `printer-find` / `printer-list` / `printer-add`.
  The test page stays unprivileged in `PrinterWorker`, so a page is claimed printed only when CUPS
  says that job finished.
- Page: FIND PRINTERS → radio list → ADD THIS PRINTER → PRINT ONE TEST PAGE, plus a line naming
  the queues already set up. Fits the lane without scrolling.
- `tests/printer-control-gate.sh` — 6 checks, all able to fail.
- Also fixed: the theme screen said "ORG.KDE.BREEZE.DESKTOP APPLIED" and offered the advisor
  "Dell-specific evidence". It now names the look they chose.

Live on the VM: discover returns an honest empty list in 2.7s, add creates and defaults a queue,
list reads back, the card renders correctly. **Picking a real printer off a real network is
unproven** — nothing to discover behind the VM's NAT. That is a Dell check.

## 8. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The Flatpak update unit is broken."** It is not. `No such ref … in remote flathub` were
  transient remote-summary failures the unit survives by design. Re-ran clean.
- **"`spplus-update-notify` fires spuriously."** It does not. It exits 0 immediately when
  `/run/sp-plus/update-staged` is absent. The 16:32 run was a no-op.
- **"The base re-pin on `session/sp-plus-base-repin` is usable."** It is not — its digest
  (`6041ce7c`) was already dead two days later. That branch is superseded by `47fd412`; do not
  rebase or cherry-pick it.
- **"Sleep is broken in SP+."** The suspend/resume cycle itself works and the machine wakes
  locked. Only the virtio_gpu display fails, and kwin names that cause itself.
- **"`systemctl suspend` over SSH exercises the sleep path."** It silently does nothing — no
  journal entry at all. Use the Kickoff → Sleep button through `vmdrive.py`.
- **"The CUPS `file:` device can prove an end-to-end print in the VM."** Three attempts; cupsd
  reports "could not open the output file" even with `FileDevice Yes`, a writable dir and correct
  `DeviceURI` in `printers.conf`. It is my synthetic backend, not SP+. All fixtures removed and
  `cups-files.conf` reverted.
- **"1280×800 Welcome overflow."** Christopher raised the VM to 1920×1200 and told me not to
  stress about sizing. Screens fit at that resolution.

## 9. WHAT IS STILL OPEN

1. **Nothing has been built from the new base pins.** The Containerfile's own rule: bumping the
   digest requires a rebuild and a full re-run of the hardware gate before an ISO ships.
2. **Phase 3 — prove the update lane can update.** Push a payload to ghcr with a timestamp
   genuinely newer than the Dell's, let the Dell's own daily timer stage it, power-cycle, confirm
   `ostree-finalize-staged` applies it. The Dell's timer has fired every day for 7 days and
   correctly said "nothing staged" — the schedule is proven, the apply half is not.
3. **The social capability document** — trim to Facebook / LinkedIn / YouTube with an "on request"
   affordance. Edit `/opt/postiz/bin/gen-sppl.sh` on CT106, **not** `sppl.json` (a timer
   regenerates it every 2 minutes). **BLOCKED: no SSH route to 192.168.1.31**, "Host key
   verification failed". Ask for the route (likely `pve` 192.168.1.200 → `pct enter 106`).
4. **Mirror the Fedora bases into our own registry.** Quay has now rotated a pin out from under us
   three times. The Containerfile has recommended this since the first one.
5. **Awaiting his decision:** the install-progress screen still leaks `bootc diagnostic:` and the
   payload ref — he has never confirmed he wants it gone. And KDE's own "Help Center" sits next to
   SP+ Help in the menu, which can drop an advisor into KDE documentation.
6. **`gh` is still not installed.** Proposal already put to him: user-local binary in
   `~/.local/bin`, device flow, never a PAT. Awaiting his yes.

## 10. NEXT ACTIONS, IN ORDER

1. **Ask Christopher whether to start the build**, since the bases are freshly re-pinned and
   nothing has been built from them. He wants the next ISO to be the final one.
2. **Build payload → installer → ISO** from `session/sp-plus-plan` at `22c3c12` or later, and
   **verify the payload ref INSIDE the ISO** before it moves.
3. **Re-run the hardware gate** on the new base, per the Containerfile rule.
4. **Do Phase 3** (§9.2) — it needs no hand-driving once a newer payload exists.
5. **Get the CT106 route** and do the social trim.
6. Hand him the ISO as soon as it exists; do not gatekeep it.

## 11. ARTIFACTS AND DIGESTS

- **New base pins, verified on 2026-09-09 before pinning:**
  `quay.io/fedora/fedora-kinoite@sha256:1424b842708911553486cc4003526a138704fd44c4531d926b96b9340561dd92`
  (44.20260909.1) and
  `quay.io/fedora/fedora-bootc@sha256:1bc549cb2909ebd1bb69e05088797dd602eee691f7deaa40f5b9914c3ce84b36`
  (44.20260909.0). Both amd64, both kernel 7.1.13-200.fc44. **Dead and gone from quay:**
  `dd672611…`, `6041ce7c…`, `e91da1af…`.
- `~/Downloads/SP-PLUS-1.0-alpha2.iso` — 5,451,438,080 bytes, sha256
  `d697fd741db742de69a4a52d5df0edb05b60b9d254fb3e3752a9b6e280550bec`. Installs end to end.
  **Not the release candidate**: built from the dead base, and it predates the Welcome no-show fix
  and the printer lane.
- Installed VM image digest
  `sha256:d4db4a1ffd9afb6740392a48fee6533ff0975cc0771bf0099512c041d140644d` (2026-09-04T22:43:57Z).
- Dell booted digest `sha256:fe211ce22324aa32f5f58b60f728e12e16825739cbe0a1d530b111667a895329`
  (2026-09-02T11:59:05Z) — newer than ghcr `latest`, which is why it correctly refuses to update.
- `/QEMU/base-archive/fedora-kinoite-dd672611.tar` — content-faithful copy of the first dead base.
  Content recoverable, identity not.
- `<scratchpad>/vmdrive.py` — drives the VM by QMP `input-send-event`. **It now measures the guest
  resolution on every call** rather than assuming 1280×800, because Christopher raised it to
  1920×1200 mid-session and every click was landing in the wrong place.

## 12. MACHINE / ENVIRONMENT NOTES

- Beelink sudo permits **`podman` ONLY** — not scripts, not `rm`, not `virsh -c qemu:///system`.
- Rootful podman: never blanket-prune; it holds the irreplaceable `dd672611` base.
- The harness blocks `sleep N && …`. Use `until <check>; do sleep 5; done`, or `run_in_background`.
- `pkill -f "<pattern>"` over SSH kills the SSH session itself when the pattern matches its own
  command line. Use a bracketed pattern: `pgrep -f "[w]test/welcome/welcome.py"`.
- To test an edited Welcome on the VM without touching the read-only `/usr`: copy it to
  `~/wtest/`, export the session env (`WAYLAND_DISPLAY=wayland-0`, `XDG_RUNTIME_DIR=/run/user/1000`,
  `DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus`), set a unique `SPPLUS_INSTANCE_NAME`
  and `SPPLUS_PRINTER_CONTROL`, then run it. **Kill the old instance first** — a stale one renders
  old markup and you will chase a fix that is already applied.
- Brave and Electron apps will not launch from a plain SSH env (they pick X11 and fail). Launch
  them through the Kickoff menu with `vmdrive.py` instead.

## 13. HONEST STATUS

The tree is clean, on the right branch, and preflight says "Safe to build" — but **nothing has
been built since any of tonight's changes**, so the printer lane, the Welcome no-show fix, the
theme copy fixes and both new base pins exist only in git. The alpha2 ISO on disk contains none of
them. Sleep is proven on a VM and unproven on real hardware, and the display half of it is a VM
bug I could not have fixed anyway. The update lane's shutdown-apply half remains the oldest
unproven thing in the project.
