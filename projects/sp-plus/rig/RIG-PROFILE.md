# SP-Alpha-Rig — Control Profile

**The one document that says how any agent takes control of the SP+ rig.**
ClaudeBox, Tom, and Bee all use this. There is no second way in, and no
per-agent variant — if a procedure is not here, it is not the profile.

Established 2026-09-05. Everything below was measured on the live VM, not
inferred from the build recipe.

---

## What the rig is

`SP-Alpha-Rig` is the standing SP+ VM on the Beelink. It is **both** the test
target for new work **and** the capture surface for content creation, which is
why it is a long-lived named rig rather than a throwaway `spplus-test`.

| | |
|---|---|
| Domain | `SP-Alpha-Rig` |
| libvirt | **`qemu:///session`** as `chris` — *not* `qemu:///system` |
| Host | Beelink, `chris@192.168.1.190` |
| Disk | `/QEMU/images/SP-Alpha-Rig.qcow2` (qcow2, discard=unmap) |
| Resources | 8 vCPU (host-passthrough), 8 GB, virtio disk + virtio-gpu |
| Guest | SP+ 1 (dev), Advisor variant, Fedora 44 kernel, **bootc** |
| Guest user | `sp`, home at **`/var/home/sp`** (ostree layout, not `/home/sp`) |
| Display | SPICE on `127.0.0.1` — host-local, never LAN-exposed |
| Framebuffer | 2048x1152 |
| sshd | `active`, key-only (`PasswordAuthentication no`) |
| Guest agent | qemu-ga 10.2.2, `guest-exec` works; SELinux-confined (see channel 2) |

**`qemu:///session` is the single most common way to lose an hour here.** A
default `virsh` on the Beelink as root, or any `sudo virsh`, talks to the
*system* libvirt, which has no domains at all. The rig then looks destroyed.
It is not. Use `rig`, or pass `-c qemu:///session` explicitly.

---

## The three channels

Control is layered deliberately, so that breaking the guest's network — which
routine SP+ testing *does* — never costs us the rig.

### Channel 1 — SSH — the working channel
Full shell as `sp`, with `sudo`, and `scp` both ways. This is where real work
happens: builds, package operations, log collection, driving the Welcome app.

```
rig run 'bootc status'
rig push ./theme.tar /tmp/theme.tar
rig sh
```

Requires the guest reachable on the LAN. See **Networking** below.

### Channel 2 — Guest agent — the bootstrap channel
Runs over the virtio serial channel. Survives *any* network breakage, needs no
credentials, works on a cold image.

**It is not a control channel, and must never be treated as one.** Measured on
this rig: the agent runs as `uid=0` but SELinux confines it to
`virt_qemu_ga_t`. It therefore **cannot**:

- `systemctl` anything — "Failed to retrieve unit state: Access denied"
- write to `/root`, or read most of `/proc`, `/etc/systemd`
- run `rpm-ostree` / `bootc`
- read `/home/sp/.config`, `.cache`, `.local`

It reliably **can**: read world-readable files, list directories, and report
OS / user / network facts. That is the whole list.

**`guest-ssh-add-authorized-keys` is advertised as enabled and does not
work.** It is in the agent's `supported_commands`, which is why it looks like
the obvious bootstrap route. Measured on this rig 2026-09-05:

    failed to create directory '/home/sp/.ssh': Permission denied

`/var/home/sp` is `drwx------ user_home_dir_t` and `virt_qemu_ga_t` cannot
write into it. Do not retry this expecting a different answer — key install
is a **channel 3** job (`rig bootstrap`), and that is why `rig bootstrap`
types rather than calls the agent.

A negative result from `rig ga` means *"the agent could not see it"*,
**never** *"it is not there"*. On 2026-09-05 a `/proc` scan through the agent
found no sshd and the conclusion drawn was that sshd was disabled. It was
not: sshd is `active`. The agent simply is not allowed to look.

### Channel 3 — Console — the recovery channel
Host-side framebuffer capture plus synthetic keyboard and mouse. Needs nothing
from the guest — no network, no agent, no login. Works at Plymouth, at the
LUKS prompt, at SDDM, and when the guest is wedged.

```
rig shot before-install     # -> a PNG path; this is the vision channel
rig click 886 775
rig line 'bootc status'
rig bootstrap               # installs the fleet SSH key, no password needed
rig unlock                  # LUKS passphrase at the graphical prompt
```

**The desktop route to a shell**, verified end to end on 2026-09-05: click
the start button at **919,1127**, then Konsole at **886,775**. That lands a
`bash` prompt as `sp` in `/var/home/sp` with no password anywhere — which is
what makes `rig bootstrap` possible on a key-only image.

**Opens no window on the Beelink.** Captures come from the host framebuffer,
so they work headless and never disturb whatever Christopher has on screen.

Three things worth knowing:
- The LUKS prompt is **Plymouth on the graphical console**, not the serial
  line. Typing at the serial console types into nothing and the VM looks hung.
  `rig unlock` sends to the framebuffer, which is why it works.
- `virsh` has no mouse verb. `rig click` / `rig move` go through QMP
  `input-send-event`, converting pixels to the absolute 0–32767 axis space
  QEMU expects. Callers think in screenshot pixels.
- **The framebuffer is 2048x1152, and QMP will not tell you that.**
  `query-display-options` returns `{"type":"none"}` with no geometry, so `rig`
  measures a real screenshot instead. Assuming 1920x1080 puts every click
  about 6% short and to the left — close enough to hit the wrong menu entry
  rather than to fail loudly.

---

## Networking — the one thing that needs a human

**As built, the rig has NO inbound path.** Its NIC is `<interface type='user'/>`
(slirp), so the guest sits on `10.0.2.15` — unreachable from the Beelink, let
alone from CT105 or Bee. Channel 1 does not exist until this is fixed.

The fix is a LAN bridge, so the rig gets its own `192.168.1.x` address and
every agent reaches it identically with plain `ssh`. That requires **root on
the Beelink**, once, and is relayed to Christopher through `paste.md` — see
`setup/bridge-setup.md`. It is not something an agent does unattended: it
reconfigures the primary NIC of Christopher's daily driver.

After the bridge exists the domain edit is ours, and `rig state` proves it.

**Do not work around this** by publishing a SPICE port, by binding the guest's
services to a host port, or by having the guest dial out to us. The advisor
services next door were broken once by exactly that kind of shortcut.

---

## Credentials

| What | Where | Notes |
|---|---|---|
| Beelink access | `~/.ssh/beelink` | already on CT105 |
| Guest access | `~/.ssh/spvm` (+ `.pub`, comment `claudebox-vm-test`) | fleet-wide, one keypair so agents are interchangeable |
| LUKS | `spplustest` | **dev image only.** A throwaway test credential, deliberately in the repo. Never reuse it on anything that holds real advisor data. |

`rig bootstrap` types `spvm.pub` into a Konsole in the logged-in session —
no password, no network. That property is what makes a freshly built image
controllable without anyone touching a keyboard.

SP+ is **deliberately key-only**: the image ships `PasswordAuthentication no`,
`KbdInteractiveAuthentication no`, `PermitRootLogin no` (drop-in
`45-sp-plus.conf`) and carries **no key of its own** — see
`installer/operator-key.ks.example` for the reasoning, which is sound and must
not be undone. There is no password fallback into this rig by design. The
console channel is the fallback.

For a **freshly installed** rig, prefer the designed hook: fill in
`operator-key.ks.example` at install time, which writes
`/etc/ssh/authorized_keys.d/<user>`. `rig bootstrap` is the retrofit for a VM
that is already running, and writes `~/.ssh/authorized_keys` instead.

---

## Using it

```
rig state                  # start here, always — says which channels are live
rig shot                   # look at it
rig run '<cmd>'            # do something
```

`rig` decides for itself whether it is on the Beelink or off-box and hops
accordingly, so **the same command works from CT105, from Tom, from Bee, and
from Christopher's own terminal**. A dispatch brief should say `rig run ...`
and never mention SSH hops.

Config lives in `rig.env` and every value is environment-overridable. Point
`RIG_DOM` elsewhere and the whole profile drives a different VM — that is how
this supersedes the older `~/fleet/bin/{vmshot,vmtype,vmunlock}`, which were
hardcoded to `DOM=spplus-test` and existed only on the Beelink.

---

## Deployment

The repo copy here is canonical. The Beelink gets a symlink, not a copy, so it
cannot drift:

```
ln -sfn ~/work/secureprospective-advisor-os/projects/sp-plus/rig/rig ~/fleet/bin/rig
```

Agents off-box run it from their own checkout, or over the hop.
