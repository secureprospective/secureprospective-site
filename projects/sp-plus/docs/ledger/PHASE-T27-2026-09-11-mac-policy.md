# T2.7 — MAC address policy, deliberately asymmetric

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Move:** doc 15 §7 item 5, Tier 2 remainder, one control per build
**Payload:** `localhost/sp-plus-kde:t28`

## The finding that unblocked this control

I had recorded T2.7 as blocked on a real dock. That was wrong, and measuring the
baseline is what showed it.

**Fedora already ships `wifi.cloned-mac-address=stable-ssid`** in
`/usr/lib/NetworkManager/conf.d/22-wifi-mac-addr.conf`. Wi-Fi MAC randomization has
therefore been live in SP+ since day one, by inheritance, on every image ever shipped,
without a single report of it breaking anything.

The dock risk that doc 15 named, and that Secureblue documents, lives entirely in the
**wired** half: USB Ethernet adapters failing to associate. That half can simply be
declined. Blocking the whole control on a dock test was blocking the safe half on the
risks of the half we were never going to ship.

## What shipped

`/usr/lib/NetworkManager/conf.d/23-spplus-mac-policy.conf`, mode 0644. Sorts after
Fedora's `22-` file, so SP+ owns the outcome rather than inheriting it.

| Link type | Value | Reasoning |
|---|---|---|
| Wi-Fi | `stable-ssid` | Constant per network, so a hotel portal and an office MAC allowlist both keep working, while the laptop is not trackable across networks by hardware address |
| Ethernet | `preserve` | Do not touch the address at all |

**`preserve` rather than `permanent` on the wired side is deliberate and the build gate
refuses `permanent`.** Many USB Ethernet adapters carry no EEPROM and are given a
kernel-assigned MAC at probe time. They have no permanent address, so forcing
`permanent` could fail to bring such a device up — the "safety" setting would itself
become the dock-breaking failure. `preserve` declines to act and therefore cannot fail.

Restating the Wi-Fi default in SP+'s own file is not redundancy. It makes the property
SP+'s, lets the posture gate assert it, and means an upstream default change turns the
gate red instead of silently removing a control nobody was watching.

## Assertions added

Four, and **deliberately asymmetric in their strength**, because the two halves carry
different risk:

- `wifi mac is per-network stable (config)` — effective-config read. A VM has no Wi-Fi
  radio, so this cannot be measured here and is labelled as a config read.
- `wired mac left alone (config)` — effective-config read.
- `no random mac anywhere` — nothing in the effective configuration may request a random
  address on either link type.
- `wired link uses its own hardware address` — **behavioural, measured on the live
  link.** If the wired interface is running on anything other than its own hardware
  address, the dock-breaking failure mode is already active on this machine. This is the
  assertion that guards the risk doc 15 actually named.

## What this control does not claim

Wi-Fi MAC stability defeats passive cross-network tracking by hardware address. It does
nothing about tracking by account, by browser fingerprint, or by any identifier above
layer 2, and it is not a privacy story on its own.

**The wired address is unchanged and identifiable.** That is a deliberate trade in
favour of the dock, and it should be stated plainly in the Security Evidence Report
rather than left for someone to discover.

## Mutation results

**75 of 75 green on a real t28 boot.** Three mutations on the live guest:

| Mutation | Result |
|---|---|
| A higher-priority conf.d section asking for `ethernet.cloned-mac-address=random` | 2 red. The Wi-Fi assertion correctly stayed green, so the two halves are distinguishable |
| Run the wired link on a foreign address with `ip link set` | 1 red, the behavioural assertion. The config assertions correctly stayed green, because the configuration was fine and the link state was not |

## Three assertion shapes that were wrong, two of which passed on a mutated machine

Every one was found by running the mutation, not by reading the code.

1. **`nmcli GENERAL.PERM-HWADDR` is not a field NetworkManager 1.56 has.** The query
   errored, the empty result compared unequal, and the assertion went red against a
   working control. A check that can never pass is as useless as one that can never fail.
2. **Treating "no permanent address" as a failure** is wrong on exactly the hardware
   this control protects. USB Ethernet adapters without an EEPROM report none, and so
   does virtio. `ethtool -P` is the interface that reports it, with the profile's own
   `cloned-mac-address` as the fallback when the device has none.
3. **Counting occurrences of the wanted value, then taking the LAST match.** Both passed
   on a machine whose effective policy was `random`. `NetworkManager --print-config`
   emits connection sections in **descending** precedence, so a `99-` file appears above
   a `23-` file and the **first** matching section wins. The count version and the
   `tail -1` version were both green on a mutated machine before this was read off the
   live output.
