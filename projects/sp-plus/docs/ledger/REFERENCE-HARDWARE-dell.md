# REFERENCE HARDWARE — the Dell, and what it means for acceptance

**Recorded 2026-08-29, from Christopher.**

The bare-metal test machine for build 40 is a **14-year-old Dell laptop: no
GPU, 8 GB RAM, spinning HDD.** Christopher: "its a real test of our work."

This is not an edge case to tolerate. It is the honest floor of what an
advisor may arrive with, and it should be treated as the reference target for
v1 acceptance. If SP+ is pleasant there, it is pleasant everywhere.

## What this hardware profile changes

**1. The hero canvas animation moves from polish to release-critical.**
`welcome/app/hero.js` runs a `requestAnimationFrame` loop at ~60fps, redrawing
roughly 2,600 `fillRect` calls plus a `Math.sin` each per frame - on the order
of 158,000 operations per second. With **no GPU**, QtWebEngine software-renders
every frame inside the `welcome.py` process. This was measured at 127% CPU in
the VM, which also has no GPU, so the VM is a fair proxy here.

Welcome AUTOSTARTS and opens on the screen that carries this canvas. So the
first thing a brand-new advisor experiences on a 14-year-old machine is an app
that opened itself and immediately pins a core. Fan noise and heat on first
boot read as "this computer is struggling," which is the exact opposite of the
product promise.

**2. The 8% installer bar gets materially worse.** A 5.4 GB image deploying to
a **spinning HDD** will take far longer than the VM's NVMe. The bar is already
stuck at 8% for the whole deploy; on this hardware the advisor may stare at a
frozen 8% for a very long time. Slow is forgivable. Slow and apparently frozen
is not. This raises the priority of `spplus-installer-progress-v3`.

**3. 8 GB RAM with QtWebEngine.** Welcome runs a full Chromium renderer.
Alongside Plasma 6, Brave and LibreOffice, memory headroom on this machine is
thin. Welcome closing properly and completely on exit stops being a tidiness
matter and becomes a resource matter.

**4. Anything measured only on the Beelink is not evidence for this machine.**
The Beelink has 30 GB RAM, NVMe and 16 cores. Timings taken there say nothing
about the Dell.

## Acceptance additions for build 40

- Welcome at rest must not hold a CPU core. Measure idle CPU on the hero screen
  specifically, since that is the autostart landing screen.
- The installer bar must advance visibly on a spinning disk, where the deploy
  is long.
- Welcome must fully exit, leaving no resident renderer.
- Secure Boot enabled on the Dell with **no MOK enrollment screen** - Gate 0.B,
  already in the plan.

---

## MEASURED CPU EVIDENCE — 2026-08-29, cycle39 guest

Taken with `/proc/<pid>/stat` utime+stime deltas over 5 seconds, NOT `ps pcpu`.
`ps pcpu` reports a LIFETIME AVERAGE and has already caused one wrong call in
this project; do not use it for "is it busy right now".

    welcome.py        110%   <- sustained, pinning a core
    kwin_wayland       71%   <- window being continuously repainted
    renderer pid 2819  21%
    renderer pid 5509  17%
    zygotes             0%

Interpretation: something is driving frames continuously. The renderers do the
canvas drawing, `welcome.py` software-composites them because the guest has no
GPU, and kwin composites the resulting window. This is consistent with
`app/hero.js`, which runs a `requestAnimationFrame` loop redrawing roughly
2,600 `fillRect` calls plus a `Math.sin` each per frame.

**NOT YET PROVEN.** The decisive test is to call `window.spHero.stop()` on a
running instance and re-measure. If `welcome.py` drops, hero.js is the cause.
That test was deliberately deferred so as not to corrupt a Bee run in progress.

## Second finding, same measurement

**Three Welcome instances were running simultaneously** - three zygote sets and
two live renderers. Each carries a full Chromium renderer. On the 8 GB Dell
that is a real memory problem, and it means something is launching Welcome
without the previous instance exiting. `WelcomeWindow.closeEvent` already
exists to make close mean exit; this evidence suggests it is either not always
reached or not sufficient.

Build 40 acceptance: after closing Welcome, no `welcome.py`, no
`QtWebEngineProcess`, and no zygote remains.

---

## PROVEN BY CONTROLLED A/B — 2026-08-29

Idle Welcome, no interaction, cycle39 guest, renderer process measured via
`/proc` deltas:

    with hero.js     renderer = 28% idle
    without hero.js  renderer =  0% idle

`app/hero.js` is the cause. Confirmed by experiment, not inference.

**Note the measurement trap that nearly hid this.** A first A/B measured
`welcome.py` and showed 0% in BOTH arms, which looks like "no problem". The
animation burns CPU in the RENDERER process; `welcome.py` only lights up when
the window is actually being composited. Measure the renderer, and measure with
the window genuinely visible, or this defect reads as absent.

Full cost when the window is visible on a GPU-less machine:

    welcome.py   110%
    kwin_wayland  71%
    renderer      28%

That is the Dell's exact configuration: no GPU, so every frame is
software-composited.

## The agent-hang connection

Two consecutive Bee runs (`spplus-welcome-tools-lane`,
`spplus-welcome-tools-live`) both ended `rc=143, bytes=0, REJECT` with no
report. Root cause: Bee launched Welcome in the FOREGROUND, Welcome never
exits, so the command never returned and the agent blocked until killed.
One Welcome instance was found running 55 minutes at 111% CPU.

So "Welcome does not exit" is simultaneously:
- a product defect on the advisor's machine, and
- the thing that has burned two agent dispatches.

Any brief that launches Welcome MUST background it under `timeout` and kill it
afterwards. This is now a standing rule for this app.

## Single-instance defect

`welcome.py` has NO single-instance guard - no `QLocalServer`, no
`QSharedMemory`, no lockfile. Three separate mechanisms can launch it:

1. `~/.config/autostart/org.secureprospective.spplus.welcome.desktop`,
   shipped via `/etc/skel`
2. KDE's `plasma-fallback-session-restore.desktop`, also in autostart, which
   restores Welcome if it was open at logout
3. The Applications menu entry

Nothing stops these stacking. Three simultaneous instances were observed, each
carrying its own Chromium renderer. On the 8 GB Dell that is a real memory
problem.
