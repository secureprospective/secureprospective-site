# SP+ RESUME — 2026-08-31, mid-session (theme work + Welcome defects)

## 1. WHAT WE ARE DOING

Christopher's goal was met earlier: switching Windows -> Breeze -> Windows through the
Welcome app alone, without error. That is now ALSO proven on an ISO-installed VM. Current
work is three defects found during that verification, then a rebuild folding them in.
Two further Welcome upgrades are inbound from Claudebox and should go into the SAME build.

Repo: `/home/chris/work/secureprospective-advisor-os` (worktree; run everything from here,
never cd to the original checkout). Project subdir `projects/sp-plus`.

## 2. AGENTS + HARNESSES

- **Bee** = Pi on `gpt-5.6-luna`, thinking max. Never leave the model to pi's default.
- Three lanes, deliberately distinct:
  - `~/fleet/bin/run-bee-spplus.sh` — research. Forbids writing files.
  - `~/fleet/bin/run-bee-spplus-impl.sh` — implementation. Expects repo source edits.
  - `~/fleet/bin/run-bee-spplus-verify.sh` — **NEW this session.** Drives a live machine,
    writes report + artifacts under `~/fleet/runs`, must NOT edit repo source.
- Briefs live in `~/fleet/briefs/`, and are copied to `~/.pi/agent/spplus-brief-<id>.md`
  which is where the runner actually reads them. Copy to BOTH.
- Dispatch detached: `systemd-run --user --collect --unit=<name> --setenv=HOME=/home/chris`.
  systemd-run starts with an EMPTY environment; without `--setenv=HOME` scripts die
  instantly on `HOME: unbound variable`.
- Bee returns EVIDENCE, never a verdict. I make the call.

## 3. IN-FLIGHT RIGHT NOW (most perishable)

**a) `bee-welcome-defects.service`** — dispatched ~18:20Z, TMO=7200.
- Alive? `systemctl --user is-active bee-welcome-defects.service`
- Brief: `~/fleet/briefs/spplus-welcome-defects.md`
- Output: `~/fleet/runs/REPORT-welcome-defects.md` + `.DONE` sentinel.
- pi stdout/stderr: `~/.pi/agent/spplus-welcome-defects.{out,err}` — stdout stays 0 bytes
  until the process exits; that is NORMAL buffering, not a stall.
- Watcher: background shell `buyflinad` (may not survive compaction; the unit will).
- If it died without a sentinel, read the `.err` and the brief before re-dispatching.

**b) Backend recorder on the VM** — `~/spplus-observe.sh`, running detached on the guest,
appending `/home/test/observe.log` every 5s. READ-ONLY; it never applies anything.
- Alive? `ssh -p 2222 test@127.0.0.1 'pgrep -f "spplus-observe[.]sh"'`
- This is my independent evidence channel. Do not stop it while Bee is driving.

**c) The VM itself** — libvirt session domain `fedora-test`, running since 12:05.
**DO NOT REBOOT IT.** See section 10.

## 4. ARTIFACTS THAT EXIST AND WORK

- **ISO**: `~/Downloads/sp-plus-2026-08-31-1152.iso`
  - 5,498,066,944 bytes, sha256
    `de4db844d84f283fd7dcb2299603a1213b3b0407a54cd15a6004dfa75f4a499c`
  - `ISO 9660 ... 'Secureprospective-Advisor-POC' (bootable)`; structure verified
    (`/EFI/BOOT`, `/LiveOS/squashfs.img`, `/images/efiboot.img`, `/boot/grub2`).
  - Built 11:52 by `spplus-iso.service`. Installed to the VM successfully.
- **Round-trip evidence**: `~/fleet/runs/REPORT-vm-roundtrip.md` (9500 bytes), 8 screenshots
  in `~/fleet/runs/vm-roundtrip/`, 26 raw files in `.../raw-vm-roundtrip/`.
- **Guest**: `SP+ 1 (dev)`, variant Advisor, kernel `7.1.10-200.fc44`.
  All 8 theme previews on the installed system are **byte-identical sha256 to the repo**.

## 5. THE CURRENT BUGS

**BUG 1 — Welcome app crashes (open).**
Verbatim: `QThread: Destroyed while thread '' is still running` at 17:40:00.092Z, then
`SIGABRT` pid 6690 `python3.14` at 17:40:07, service
`app-org.secureprospective.spplus.welcome@autostart.service` `status=6/ABRT`, result
`core-dump`. Backtrace entirely in `viz::DirectRenderer::DrawFrame` ->
`viz::Display::DrawAndSwap` -> `DisplayScheduler::OnBeginFrameDeadline` inside
`libQt6WebEngineCore`. Occurred 8s after the Nordic apply restarted plasmashell.

Leading hypothesis: this VM's software GPU. Every Welcome launch here logs
`ContextResult::kTransientFailure: Failed to send GpuControl.CreateCommandBuffer`.
**CAVEAT — this is NOT established.** A plasmashell restart is also a compositor teardown
and that IS our code's doing. n=1. Bee's investigation B is running 10 applies, then 10
more under `QTWEBENGINE_CHROMIUM_FLAGS=--disable-gpu`, to separate the two. The
`--disable-gpu` run is a DIAGNOSTIC, not a proposed fix.

**BUG 2 — a theme card can be silently unclickable (open).**
A drive at 17:43:06Z clicked a card, nothing happened, no receipt, no error, 2-minute
timeout. Hypothesis from source reading: `.work-area` is a grid `38px/minmax(0,1fr)/74px`
so the footer does NOT overlap, but above 900px wide `.screens` and `.screen` are
`overflow:hidden`, so content past the fold is CLIPPED and unreachable rather than
scrollable. That would breach the standing "Welcome must never scroll" rule.
**CAVEAT — unmeasured.** Bee's investigation A measures every card's rect, what
`elementFromPoint` returns at its centre, and `scrollHeight` vs `clientHeight`, at three
window sizes. Do not patch CSS before reading it.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **"The image is missing qdbus6."** No. The binary is **`qdbus-qt6`**, it ships, and the
   harness already uses the right name. My probe used the wrong name.
2. **"Welcome/plasmashell was not running on the VM."** No. The guest agent runs
   SELinux-confined and returns `Permission denied` **as root** for `/home/test/...` and
   cannot see other processes reliably. A SPICE screenshot proved both were running.
   Never trust an "absent" reading from the guest agent; confirm with a screenshot.
3. **"The em-dash gate failure was a content problem in index.html."** No. `grep -rqlP`
   was scanning binary PNGs; `orchis-light.png` contains the bytes E2 80 94 in its deflate
   stream. Fixed with `-I`. Reproduced in-image before and after.
4. **"The installer base pin was merely unresolvable."** No. It was garbage-collected on
   quay AND absent from root's podman store: unrecoverable, not recoverable.
5. **"Five of eight themes share one panel, so the paneling work failed."** No. FIVE ship
   their own layout (Windows x2, Breeze x2, Orchis) and apply it. Only THREE (Nordic,
   Catppuccin Mocha, Catppuccin Latte) declare no layout and take stock. No theme ever
   inherits the previous theme's panel, which was the actual defect.
6. **"Bee took a shortcut and called the apply helper directly."** No. Verified its helper:
   real CDP `Input.dispatchMouseEvent` press/release on the card and `#preview-apply`.

## 7. DECISIONS

- **2026-08-31 (new):** the three layout-less themes KEEP THE STOCK PANEL. We do not author
  SP+ layouts for them. Their authors declared no panel intent, so nothing is being
  overridden; stock is known good. Recorded in
  `docs/ledger/DECISION-2026-08-31-layoutless-themes-keep-stock-panel.md`.
- **D-02** stands: base images pinned by digest; a bump is deliberate and **owes a full
  re-run of the hardware gate**. The bump made today has NOT had that hardware gate.
- Orchis Light's top-panel/no-taskbar desktop is its author's intent. Record it, never
  "fix" it.

## 8. LEDGER STATE

Committed this session: `82626f6` (em-dash gate scoped to text), `aec0f43` (installer base
pin bump), `f6ce2dd` (panel-source wording + the decision doc). Earlier: `081c774`,
`87277a7`, `becc3dc`, `e86310f`, `418091d`, `6a85ae9`.
Nothing is written-but-uncommitted.

## 9. NEXT ACTIONS, IN ORDER

1. **Read** `~/fleet/runs/REPORT-welcome-defects.md` when the sentinel lands.
2. **Fix BUG 2** from the measurements, not from the hypothesis. If cards are clipped, the
   fix is layout so all eight fit one viewport, NOT enabling scroll (standing rule).
3. **Decide BUG 1** from the crash-rate comparison. If it only crashes with GPU
   compositing, it is likely VM-only and must still be checked on the Dell before it is
   dismissed. If it crashes under both, it is ours.
4. **Fold in the two Welcome upgrades from Claudebox** when they arrive.
5. **Then one build**, not one per fix. Builds are the bottleneck.
6. **Re-run the hardware gate on the Dell** — owed by the D-02 pin bump regardless.

## 10. RELAY / ENVIRONMENT NOTES

- **VM SSH:** `ssh -p 2222 test@127.0.0.1`. Key `chris@beelink` was already installed by
  the kickstart at 12:05; I added nothing.
- **The port forward is VOLATILE — held in QEMU's memory only.** Recreate after any VM
  restart with:
  `virsh -c qemu:///session qemu-monitor-command fedora-test --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2222-10.0.2.15:22'`
  `10.0.2.15` is QEMU user-mode NAT and is NOT routable from the Beelink.
- **Do not reboot the VM** — it destroys the forward and locks everything out.
- Read-only channels that work without network: `virsh screenshot fedora-test` (SPICE
  framebuffer) and `virsh qemu-agent-command` (guest agent, but SELinux-confined).
- Panel applets: parse with `~/panel-applets.py` on the guest. `dumpCurrentLayoutJS`
  returns a JS document, not JSON; brace-match from the first `{` after `var layout`.
- **The ISO build is rootful and needs Christopher's sudo** (per-tty tickets; my shell has
  no tty). Hand him:
  `sudo systemd-run --unit=spplus-iso --collect --setenv=HOME=/home/chris --property=TimeoutStartSec=7200 /home/chris/fleet/bin/sp-plus-iso-build.sh`

## 11. HONEST STATUS

The theme-switching goal is **met and independently verified on an ISO-installed system**,
not just on staged code: two round trips, t1 identical to t3, confirmed by a backend
recorder Bee did not control.

What is NOT proven:
- The Welcome crash is **unexplained**. One occurrence, two candidate causes, neither
  eliminated. Do not report it as VM-only.
- The unclickable-card bug is **unmeasured**; the clipping explanation is a hypothesis.
- The three fixes committed today (`82626f6`, `aec0f43`, `f6ce2dd`) are **in source only**.
  No ISO contains `f6ce2dd`. Written code is not working software.
- The F44 base pin bump has **never been through the Dell hardware gate**.

## 12. HOUSEKEEPING FOUND, NOT ACTIONED

`~/JoplinBackup` is the 23rd visible entry at `~` and makes the filing gate FAIL (target
22). It is NOT mine and it is LIVE: the Joplin backup plugin
(`io.github.jackgruber.backup`) references it and touched it at 13:46 today. Moving it
would break Christopher's note backups, so the fix is a Joplin plugin setting, not a `mv`.
Raised with him; left in place deliberately.
