# Beelink LAN bridge — the one root step the rig profile needs

**Run once, by Christopher, at the Beelink's own keyboard.** After this,
`SP-Alpha-Rig` gets a real `192.168.1.x` address and every agent reaches it
with plain `ssh`. Nothing in the profile needs root again.

The commands are relayed through `paste.md` (`setup/paste-bridge.txt`).

---

## Why an agent does not do this unattended

It reconfigures `enp5s0` — the **only live NIC on Christopher's daily
driver**. `eno1` is present but unplugged and `wlp3s0` is unavailable, so
there is no fallback path: if the bridge comes up wrong, the Beelink is off
the network until someone is physically at it.

Which is exactly why it must be typed **at the physical console, not over
SSH.** Enslaving `enp5s0` drops every SSH session on the box, including the
one running the commands, halfway through. The machine would be left with the
old connection down and the new one never brought up.

---

## What it does

1. Creates bridge `br0` and enslaves `enp5s0` to it.
2. Stops the old `Wired connection 2` from auto-claiming the NIC.
3. Makes `qemu-bridge-helper` setuid and allows `br0` — this is what lets
   **session** libvirt (running as `chris`, not root) attach a guest to a
   system bridge. Without it, the domain fails to start with a permissions
   error that reads like a libvirt bug.

**The Beelink keeps its current IP — but only because `br0` is pinned to
`enp5s0`'s MAC.** A bare Linux bridge inherits its first port's MAC, but
NetworkManager does not rely on that: it assigns the bridge its own generated
MAC, DHCP sees a new client, and the box moves to a new lease. That happened on
the first attempt on 2026-09-05 — the Beelink jumped from `.190` to `.185`,
which breaks every reference to it in the homelab docs, in Tom's and Bee's
config, and in `rig.env`. `bridge.mac-address e8:ff:1e:d6:ab:d4` is what
prevents it. Do not drop that property.

**`nmcli` works unprivileged here; the QEMU helper steps do not.** polkit lets
`chris` reconfigure NetworkManager, so steps 1–5 succeed with no `sudo` and it
is easy to assume the whole file is unprivileged. Step 6 then fails with
`chmod: Operation not permitted`. Those lines need `sudo`.

Docker's `docker0` and `br-59c5046205e1` are untouched and do not conflict.

---

## Rollback

If the LAN does not come back, one command at the console restores the
original path:

```
nmcli con down br0; nmcli con mod "Wired connection 2" connection.autoconnect yes; nmcli con up "Wired connection 2"
```

Nothing is deleted by the setup, so this is always available.

---

## Then tell ClaudeBox

The domain edit is the agent's half and takes seconds:

```
virsh -c qemu:///session edit SP-Alpha-Rig
```

replacing

```xml
<interface type='user'>
  <mac address='52:54:00:b0:c4:9b'/>
  <model type='virtio'/>
</interface>
```

with

```xml
<interface type='bridge'>
  <mac address='52:54:00:b0:c4:9b'/>
  <source bridge='br0'/>
  <model type='virtio'/>
</interface>
```

Then a **full stop and start** — `virsh reboot` does not re-read the XML:

```
virsh -c qemu:///session shutdown SP-Alpha-Rig   # wait for it to go down
virsh -c qemu:///session start SP-Alpha-Rig
rig unlock                                        # LUKS, graphical prompt
rig state                                         # channel 1 should read LIVE
```
