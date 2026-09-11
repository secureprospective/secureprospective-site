# Tier 2 remainder — blocked, with the test that unblocks each

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Move:** doc 15 §7 item 5, "the rest of Tier 2, one control per build"

Four Tier 2 controls remain. **None of them is blocked on engineering effort.** Each is
blocked on a specific piece of the real world that a VM cannot stand in for, or on a
decision that is not an engineer's to make. Recording them here so the next session does
not rediscover the reason, and does not mistake a green VM for a shipped control.

The standing rule this enforces: **a control that passes its own assertion on a VM and
breaks an advisor's workday is rejected, not negotiated.** Marking these green off a VM
run would be the exact failure the roadmap was written to avoid.

---

## T2.5 — `hardened_malloc`, scoped

**Blocked on a trust-root decision, not on a test.**

`hardened_malloc` is **not present in any repository SP+ ships.** Measured on the t26
guest: `dnf repoquery hardened_malloc hardened-malloc` returns nothing across `fedora`,
`updates`, `updates-archive` and `fedora-cisco-openh264`. Secureblue obtains it from
their own build, not from Fedora.

**Where Secureblue gets it, confirmed:** their own Fedora COPR at
`copr.fedorainfracloud.org/coprs/secureblue/`. There is no official Fedora package.
The unofficial alternatives are third-party GitHub spec files, `divestedcg/rpm-hardened_malloc`
and a fork of it, both self-described as unofficial micro-architecture optimized builds.
Upstream is GrapheneOS `hardened_malloc`. A COPR is a personal build service repository:
it is not part of Fedora, carries no Fedora signing guarantee, and is maintained at one
project's discretion. Noted separately: Secureblue's own issue tracker records that the
config file which actually enables the allocator is **not** part of the RPM, so adopting
the package is not the whole job.

Shipping it therefore requires one of:

1. **Adding an external repository.** That is a second trust root in layer 1, which is
   the layer this whole roadmap exists to strengthen. Doc 15 already counts Brave's own
   repo as a trust-root cost; adding another is a durable decision.
2. **Vendoring and compiling it inside the Containerfile.** That makes SP+ the builder
   and maintainer of a memory allocator, with its own upstream to track.

Both are standard-setting decisions. **Christopher's call, with a panel, not mine.**

**The reason to think hard before saying yes.** Secureblue documents Electron
applications dying with `fatal allocator error` under global preload. SP+ is
Electron-heavy by design: Brave is a native Chromium RPM, and Zoom and Signal are the
two applications SP+ vouches for by name under D48. The scoped shape doc 15 asks for
would have to exclude most of what an advisor actually runs, which leaves a small
protected surface bought with a new trust root and a new upstream to track. That trade
looks poor from here, but the call is not mine to make.

Its named real-world test, unchanged and still required afterwards: Brave, every
installed PWA, Fin's Node runtime, and LibreOffice. Secureblue documents Electron
applications dying with `fatal allocator error` under global preload, which is why
doc 15 wrote "scoped" into the name of the control.

---

## T2.1 — SELinux confinement for Brave

**Blocked on real carrier portals.**

The test named in doc 15 is real carrier portals, every installed PWA, printing from the
browser, file downloads and uploads, and camera and microphone in a live video call. A
test VM has no carrier account, no real printer, no camera and no second party on the
call. A confinement policy that passes on a VM and blocks a carrier's document upload
costs an advisor a submission, which is the worst class of failure SP+ can produce.

**Unblocks when:** the Dell has a real advisor session against at least two carrier
portals, with an upload and a print from inside the browser.

---

## T2.3 — System DNS over TLS with DNSSEC

**Blocked on a real captive portal.**

Doc 15 is explicit that the captive-portal path is the gate and not an afterthought.
Advisors work from hotel and airport Wi-Fi, and a captive portal works by intercepting
plaintext DNS. A resolver that refuses to be intercepted does not fail loudly, it fails
as "the internet is broken" in a hotel room with nobody to call.

A VM on a NAT port-forward cannot produce a captive portal. Simulating one proves the
simulation, not the hotel.

**Unblocks when:** the Dell joins a genuine captive-portal network, twice, on different
vendors, and reaches the login page and then the internet.

---

## T2.7 — MAC randomization

**Blocked on real hardware that does not exist in the VM.**

Secureblue documents USB Ethernet adapters failing to associate under MAC randomization.
The named test is the Dell's built-in adapter **and a real dock**. The test VM has one
virtio NIC on a port forward, which exercises neither.

Docks are also already named in doc 15 Tier 3 as the reason USBGuard is rejected: an
advisor's dock is how the keyboard, the display and the network arrive. A control that
breaks a dock breaks the whole desk.

**Unblocks when:** the Dell is tested on its built-in adapter, on a real USB-C dock, and
on at least one USB Ethernet adapter.

---

## What this means for the ISO

The ISO produced at the end of this session carries **Phase 0, Phase S, Tier 1 including
T2.4 and T2.6, and T2.2**. It does **not** carry T2.1, T2.3, T2.5 or T2.7, and the
Security Evidence Report must not imply otherwise. Every control it does carry is
asserted at runtime by `tests/runtime-posture-gate.sh` and every one of those assertions
has been mutation-tested red on an image that lacks the control.
