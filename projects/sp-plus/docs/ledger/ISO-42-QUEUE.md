# ISO 42 — batched fix queue

**Rule (Christopher, 2026-08-29):** fixes are grouped per build. No one-fix
"yay moment" builds. **The prior Dell tests run before another ISO is built.**

## Gate: what must happen BEFORE ISO 42 is built

1. Dell running cycle41 is up and reachable.
2. `briefs/spplus-dell-qc.md` runs end to end (Job A Welcome QC, Job B vitals).
3. Findings triaged into this queue.
4. Only then does a build get proposed.

## Already applied to the tree, NOT yet in any ISO

| # | Fix | Commit | Verified |
|---|-----|--------|----------|
| 1 | Anaconda bootc source: `network_required` honest about transport — local transports (`containers-storage:`, `oci:`, `oci-archive:`, `dir:`) return False | uncommitted | **NO — needs no-NIC boot test** |

### Fix 1 detail
`installer/patch-anaconda-network.py`, wired into the Containerfile ahead of
`patch-anaconda-progress.py`. Strict single-anchor match, read-back check, and
`py_compile` on the result; the build fails loudly if upstream changes.

**Why:** upstream `pyanaconda/modules/payloads/source/bootc/bootc.py` hardcodes
`network_required = True`. That feeds `NetworkSpoke.completed`, which only
clears with a real connection. With the payload already on the ISO as
`containers-storage:`, no network is needed — but Anaconda demands one, so on a
machine with no link **"Begin Installation" is greyed out with no way forward.**

**Evidence (ISO 41, QEMU `-nic none`, 2026-08-29):** completed the Installation
Destination spoke; its warning cleared. Network & Host Name stayed the only
marked spoke and the button stayed grey. Network is the gate, conclusively.

**Cannot reproduce in a normal VM** — a virtual NIC always has a link.

## Already IN cycle41 and proven

- Installer wireless firmware: 5 packages were missing (`iwlwifi-dvm`, `-mvm`,
  `-mld`, `iwlegacy`, `libertas`). Found by diffing installer vs payload image.
  Verified in the built image: **185 Intel blobs, 22 Marvell** (was 0).
  Build assertion added so it cannot silently regress.
- Kickstart no longer blocks on a link (`--device=link --activate` removed).
  A real improvement, but **not** the cause of the greyed button.

## Known-open, not yet fixed

| # | Item | Status |
|---|------|--------|
| A | Installer progress bar hangs at 8%, then sprints | Root-caused, brief written (`spplus-installer-progress-v3.md`), **never dispatched** |
| B | Welcome has no logging at all — zero `logging` calls | Flagged; a field failure leaves no trace to ask an advisor for |
| C | Office-folder SMB auth success path | Unproven — no test share existed |
| D | mDNS printer discovery | Unproven — QEMU NAT carries no multicast; needs the Dell |
| E | Secure Boot / no MOK screen (Gate 0.B) | Unproven on bare metal |
| F | Welcome UI polish | Deferred by decision: function before looks |

## Dell test, ready to fire

`/root/briefs/spplus-dell-qc.md` (8.8 KB). One placeholder: `__DELL_IP__`.

- **Job A** — all 8 bridge verbs both directions, lifecycle blockers measured
  with `/proc` deltas (`ps pcpu` explicitly banned), single instance across all
  3 launch paths, stale-lock recovery, clean exit, no plaintext credentials.
  Built around three anti-false-positive rules: never trust the UI's own status
  text, always test the failure path, say UNVERIFIED rather than guess.
- **Job B** — boot timing, per-process RAM on 8 GB, spinning-disk I/O, graphics
  and wifi drivers, install footprint, and **journal noise at `-p warning`** as
  the headline number. Then: what to improve in install, what to trim, or
  whether it is genuinely fine. Ends with concrete auto-tuner candidates, each
  with detection, action, proof it helped, and risk — separating what is safe to
  automate silently from what needs consent.

Dispatch (research harness, not the apply harness):

    sed -i "s/__DELL_IP__/<ip>/" /root/briefs/spplus-dell-qc.md
    THINKING=high /root/run-bee.sh /root/briefs/spplus-dell-qc.md 2700
