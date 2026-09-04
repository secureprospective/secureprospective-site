# SP+ RESUME — 2026-09-04 (compact 8)

## 1. WHAT WE ARE DOING
Hardening the SP+ Welcome app before the next ISO. Christopher installed the
Alpha (20260904e) on a VM, found problems, and asked for a full sweep of the
Office connection, Fin integration, and Optional Tools — with real test
harnesses. Standing order: **truth first, even when it hurts. No shortcuts.**

Repo (ACTIVE): `chris@192.168.1.190:~/work/secureprospective-advisor-os`
Branch: `session/sp-plus-plan`. Tree clean as of this document.

## 2. HOW TO GET INTO THE TEST VM  ← the expensive thing to rediscover
`ssh spvm` from CT105. Already configured in `/root/.ssh/config`.

It works because of ONE command on the Beelink — QEMU adds a port forward to a
RUNNING user-mode (SLIRP) guest through the monitor:

    virsh qemu-monitor-command fedora-alphaTEST --hmp \
      "hostfwd_add hostnet0 tcp:127.0.0.1:2222-:22"

Then CT105 reaches it via ProxyCommand through the Beelink to localhost:2222.
**This is lost on VM reboot — re-run that one command, nothing else.**

Do NOT rebuild the reverse-tunnel approach: it was a dead end. The Beelink is
key-only (`PasswordAuthentication no`), so the guest could never authenticate,
and the whole thing was solving a problem QEMU already solves. My public key
(`/root/.ssh/beelink.pub`) is in the guest's `~test/.ssh/authorized_keys`.
The qemu guest agent is SELinux-confined (`virt_qemu_ga_t`) and can read 4 of
2153 processes and cannot write user homes — useless for real work.

VM: `fedora-alphaTEST` on the Beelink, user `test`, hostname `sp-plus`.
**`/var` is at ~95% (931 MB free)** from flatpak test installs. Reclaim with
`sudo flatpak uninstall --unused -y --system` (freed 1.8 GB once already).

## 3. COMMITS THIS SESSION (all on session/sp-plus-plan)
    baa8a92  drop blueman + GNOME disk notifier autostart
    a38e4ab  fix pkg-preflight (was failing on a CLEAN tree)
    74bb496  services gate for the Office connection (18 scenarios + mutation test)
    63150fe  Fin writes the computer-check verdict; ask box renders markdown
    34f358c  share probe classifies; all bridge verbs accounted for
    f0d67d8  Optional Tools rows know what is already installed
    4ec5fee  retire Thunderbird + Joplin, move Zoom to Optional Tools
    bff892d  mailto: opens Gmail or Outlook as a PWA

## 4. HYPOTHESES REFUTED — DO NOT RETEST
- **"The Welcome app leaks memory / does not close cleanly."** FALSE. No
  welcome.py, no QtWebEngineProcess, no orphaned renderer in the process table.
  closeEvent -> deleteLater -> quit with an aboutToQuit drain works. The
  "memory hogs" were the KDE session baseline (plasmashell 557 MB etc.).
- **"The Ask Fin bar is not using Fin."** FALSE. `fin --ask` execs `pi -p` and
  returned real model answers (`4,812` / `4812` / `**4812**`). Measured 8 times:
  5.4s–7.8s, all exit 0. It LOOKED fake because the box set `textContent` on
  markdown in a 76px-tall clamp. Fixed.
- **"Your Services takes eons."** NOT REPRODUCED, four ways:
  endpoints 0.2s · real `fetch_service_capability` 0.124–0.236s · COLD
  DNS/TLS flushed 0.146s/0.170s · title bridge **150 sent, 150 arrived, 0 lost**.
  The bridge-drop theory was the best one and it is dead. **Still need
  Christopher's repro: how many seconds, first check or RETRY.**
- **`response.read()` blocking** in the capability fetch — measured, not the cause.

## 5. FOUR GATES FOUND RED ON A CLEAN TREE
Verified each by stashing and re-running.
1. `pkg-preflight.sh` — parsed English prose out of comments containing the
   string "dnf install". FIXED (a38e4ab), with a mutation test.
2. `check-share-reachable` — pointed at 127.0.0.1:445 where nothing listens, so
   it tested the unreachable path twice. FIXED (34f358c).
3. Services / Office connection — no coverage at all. FIXED (74bb496).
4. **`welcome-help-corpus-gate.sh` — "walker produced nothing". STILL BROKEN,
   pre-existing, NOT fixed.** This is the next obvious cleanup.

## 6. DECISIONS (Christopher, 2026-09-04)
- Retire Thunderbird and Joplin outright.
- Take Zoom out of the ISO; offer it as Optional Tools **#1**, promoted as the
  way an expert can come in and fix the advisor's computer — not just meetings.
- mailto: must open **both** Gmail and Outlook as a PWA.
- He will test **Bluetooth on the Dell** after the next ISO (blueman was
  dropped; bluedevil is now the only stack — UNVERIFIED on real hardware).

## 7. NEXT ACTIONS, IN ORDER
1. **Get his "eons" repro** for Your Services; it is the only reported problem
   with no explanation.
2. **Build the next ISO.** Nothing in this session has been built. `pkg-preflight`
   says safe to build.
3. Fix `welcome-help-corpus-gate.sh` (gate #4 above).
4. Verify on a fresh install: the kdialog mailto chooser seen by a human;
   Zoom installs from Optional Tools; Bluetooth on the Dell.
5. Run `tests/runtime-posture-gate.sh` — must be 18/18. Still from RC1f.

## 8. HONEST STATUS
Everything this session is committed and source-gated. **NO ISO HAS BEEN BUILT
WITH ANY OF IT.** The Fin verdict, the markdown rendering, tool-status and the
share classification were all exercised against the real code on the real guest
over ssh. The mailto chooser dialog has never been seen by a human. Bluetooth
after dropping blueman is unverified on hardware. The Optional Tools Zoom row
has never been clicked.
