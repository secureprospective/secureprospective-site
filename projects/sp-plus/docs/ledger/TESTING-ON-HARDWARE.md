# Testing on hardware — the standing method

**Status: this is how we test from 2026-08-30 onward.** It replaces "build an ISO
and reinstall" as the default. Build an ISO when you are testing *the installer*
or shipping to an advisor. For everything else, use this.

Established 2026-08-29/30 after Christopher asked the question that ended the
old method: *"Why would we not test it on a working Dell machine that is up and
working now, why are we going through the ISO trouble and dont even know if its
a pile of garbage or the best thing ever?"*

He was right, and the cost difference is not marginal. An ISO cycle is a build,
a write, a reinstall, and a reconfigure — call it an hour and a machine you then
have to set up again. The loops below are 7 seconds and ~20 minutes.

---

## Why this works now

The OS is largely done. What changes week to week is the supporting software —
Welcome, the tuner, timers, config drop-ins. Almost none of that needs a new
operating system to test; most of it does not even need a new image.

That gives two loops. **Always use the cheapest one that can actually prove the
change.**

| | Loop A — file staging | Loop B — image switch |
|---|---|---|
| Time | seconds | ~20 min + a reboot |
| Proves | app logic, layout, messages | anything in `/usr`, packages, units, boot |
| Use for | `welcome.py`, `app.js`, `app.css`, `index.html` | new RPMs, systemd units, `/usr/lib` drop-ins, anything a build step produces |
| Risk | none; nothing on the machine changes | reboot required; rollback is the net |

Loop A found DN-41 and DN-42 in one sitting. Neither needed an image.

---

## Loop A — stage files into /tmp and run them

`/usr` is read-only on an image-mode system, so you do not patch in place. You
run a copy.

```bash
DELL=test@192.168.1.134          # confirm the IP first; see TRAP 3
KEY=/root/.ssh/spplus-test

ssh -i $KEY $DELL 'mkdir -p /tmp/spfix/welcome && cp -r /usr/libexec/sp-plus/welcome/app /tmp/spfix/welcome/'
scp -i $KEY welcome/welcome.py       $DELL:/tmp/spfix/welcome/welcome.py
scp -i $KEY welcome/app/app.css      $DELL:/tmp/spfix/welcome/app/app.css
scp -i $KEY welcome/app/index.html   $DELL:/tmp/spfix/welcome/app/index.html
```

Run the headless self-test against the staged copy:

```bash
ssh -i $KEY $DELL 'export QT_QPA_PLATFORM=wayland XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0
  cd /tmp/spfix/welcome && timeout 200 python3 welcome.py --self-test'
```

The shipped copy under `/usr` is untouched, so the advisor-facing app on the
desktop keeps working while you test. Nothing needs cleaning up but `/tmp`.

### Loop A also has to produce a picture

**A passing self-test does not mean a human can read the screen.** DN-42 shipped
with every automated verb green: the summary was rendering white-on-grey and
unreadable, and only Christopher clicking the button found it.

So for any change that alters what is drawn, render it and *look*:

```python
# /tmp/spfix/shot.py — runs the staged copy, drives it, grabs the widget
import os, sys, json
sys.argv = ['welcome.py']
os.environ.setdefault('QT_QPA_PLATFORM', 'wayland')
sys.path.insert(0, '/tmp/spfix/welcome')
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QTimer
import welcome as W
app = QApplication.instance() or QApplication([])
win = W.WelcomeWindow(screen=5, force=True)      # screen= is 1-based
win.resize(1366, 768); win.show()
def fire():
    # go() is 0-based: screen 5 in the UI is go(4)
    win.view.page().runJavaScript("window.spWelcome.go(4);"
        "window.spWelcome.checkResult(%s);" % json.dumps({...}))
    QTimer.singleShot(2500, grab)
def grab():
    win.view.grab().save('/tmp/spcaps/shot.png'); print('SAVED'); app.quit()
QTimer.singleShot(3000, fire)
app.exec()
```

`win.view.grab()` grabs the widget directly. It needs no compositor screenshot
protocol and no portal, which is why it works over SSH where `kscreen-doctor`
and portal-based capture do not.

**Render every state, not just the happy one.** DN-42's third fault — an empty
bordered box before any check had run — was only visible in the *empty* state.
Populated looked perfect.

---

## Loop B — build an image and bootc switch into it

For anything Loop A cannot reach. Nothing here touches an ISO.

### 1. Build on the Beelink

```bash
cd ~/work/secureprospective-advisor-os/projects/sp-plus
bash tests/config-preflight.sh          # must say "Safe to build"
podman build -f images/kde/Containerfile -t localhost/sp-plus-kde:testNN .
```

`images/kde/Containerfile` is the real payload owner. **`projects/sp-plus/Containerfile`
is dead** — editing it changes nothing that ships.

### 2. Verify the payload *inside the image*, before it goes anywhere

Rule 4 of the dispatch mandate applies to builds too: the artifact is the
evidence, never the exit code. `BUILD_RC=0` proves a build ran, not that your
change is in it.

```bash
podman run --rm localhost/sp-plus-kde:testNN sh -c '
  ls -l /usr/libexec/gvfsd-smb
  grep -c "_await_async" /usr/libexec/sp-plus/welcome/welcome.py
  systemctl is-enabled spplus-flatpak-update.timer'
```

### 3. Push to the LAN registry

```bash
podman push --tls-verify=false \
  localhost/sp-plus-kde:testNN 192.168.1.190:5000/sp-plus-kde:testNN
curl -s http://192.168.1.190:5000/v2/sp-plus-kde/tags/list
```

The registry is a plain `registry:2` container on the Beelink:

```bash
podman run -d --name spplus-reg -p 5000:5000 docker.io/library/registry:2
```

The Dell trusts it over plain HTTP via
`/etc/containers/registries.conf.d/99-spplus-lan-test.conf` (`insecure = true`).
**That file is test-machine only.** A machine carrying it is not representative
of a shipped one; remove it before treating the Dell as a reference install.

This registry is *not* how SP+ is distributed. Distribution is an ISO on
Cloudflare, unlocked per advisor by contract. The registry only exists so
installed machines can be updated and tested. (Conflated twice in past sessions;
do not conflate it a third time.)

### 4. Switch, under systemd — not under your SSH session

```bash
ssh -i $KEY $DELL 'sudo -n systemd-run --unit=spplus-switch --collect \
  /usr/bin/bootc switch --transport registry 192.168.1.190:5000/sp-plus-kde:testNN'
```

Measured on the Dell: **16 min 20 s wall, 5 min 26 s CPU, 2 GB peak**, for only
1.5 GB of new layers (65 of 122 already on disk). It is slow because the disk is
a 5400 rpm HDD, not because anything is wrong.

A transient unit survives your SSH connection dropping *and* a context
compaction. Run it in the foreground and a dropped connection kills the switch
part-way. Check it with:

```bash
ssh -i $KEY $DELL 'systemctl is-active spplus-switch'
ssh -i $KEY $DELL 'sudo -n journalctl -u spplus-switch --no-pager -n 20'
```

### 5. Confirm the rollback net exists — the right way

```bash
ssh -i $KEY $DELL 'sudo -n ostree admin status; rpm-ostree status; rpm-ostree db diff'
```

You want a `(staged)` deployment *and* the current one still listed, plus
`ostree-finalize-staged.service` present. `rpm-ostree db diff` should show
exactly the packages you intended and nothing else — it is the cheapest way to
catch a Containerfile that pulled in more than you asked for.

### 6. Reboot, then verify what actually booted

```bash
ssh -i $KEY $DELL 'rpm-ostree status | head -20'    # the ● line is what booted
```

Never conclude the switch worked because it exited 0. Read the digest.

---

## Traps — each of these cost real time

**TRAP 1 — Do not gate on the number of boot entries.**
The obvious check, `ls /boot/loader/entries | wc -l` must be 2, is **wrong**, and
it was written into a resume document as a hard gate before being caught. The
staged deployment gets no BLS entry until shutdown, when
`ostree-finalize-staged.service` writes it. Before reboot there is exactly **one**
entry and that is correct. Gate on `ostree admin status` showing a `(staged)`
deployment and the booted one still present — those are trees on disk, which is
what the safety net actually is.

**TRAP 2 — `bootc switch` exiting 0 is not the machine being on the new image.**
It means a deployment is staged. Nothing has booted yet.

**TRAP 3 — The IP changes across reboots.**
The Dell came back on `.134` after being on `.124`. A full subnet sweep found no
Dell and produced a confident, wrong diagnosis ("WiFi didn't come back up") when
the machine was fine and simply had a new DHCP lease. **Ask, or scan, before
theorising.** `No route to host` is a symptom, not a diagnosis.

**TRAP 4 — Never run `rpm-ostree install` on a test machine.**
Runtime layering permanently breaks `bootc upgrade`. Verified. If you need a
package, it goes in the Containerfile and you take Loop B.

**TRAP 5 — `--pull=newer` invalidates the build cache.**
It re-pulls the base and every layer rebuilds. Use `--pull=missing` unless you
specifically want a newer base.

**TRAP 6 — Never restart the compositor to fix a test.**
No `kwin_wayland`, `plasmashell`, `startplasma`, `kglobalaccel`, or any
`plasma-*` user unit. It destroys the running session — the thing under test —
and needs a reboot Christopher has to unlock by hand.

---

## What this loop still cannot prove

Be honest about the edges, because a method that hides its gaps is worse than a
slow one.

- **The installer.** Kickstart, partitioning, LUKS, first-boot. ISO only.
- **A clean machine.** The Dell carries accumulated `/etc` state and hand-applied
  fixes. It proves the image works *here*, not on a fresh install.
- **`bootc rollback`.** Still never exercised. It is the safety net under
  everything above and under auto-updates, and it is unproven.
- **Any share with real credentials.** The failure paths are well covered; the
  success path has never run against real office infrastructure.
- **Other hardware.** One Dell is one Dell. See `HARDWARE-MATRIX.md`.
