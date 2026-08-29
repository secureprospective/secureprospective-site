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
| 1 | Anaconda bootc source: `network_required` honest about transport | uncommitted | **NO — needs no-NIC boot test** |
| 2 | Installer progress bar: 8% hang | **NOT STARTED** | NO |

### Fix 2 — the 8% progress bar. QUEUED FOR ISO 42.

**Confirmed on bare metal by Christopher, 2026-08-29, watching a cycle41 install
on the Dell.** Still hangs at 8%, then sprints to the finish. This is now the
third independent observation (QEMU installs, cycle39, and now real hardware on
a spinning disk). It is not a virtualisation artifact.

Why it matters, in Christopher's words: a system built for non-technical people
must not look broken while it is working. An advisor watching a dead bar on an
old laptop will assume it has hung and power the machine off mid-install.

**Two proven defects**, measured from `/var/log/anaconda/packaging.log` on a
real install. The emitted sequence was `0, 0, 99, 100` — only 7 samples across
a multi-minute deploy:

- **A. Hardcoded denominator.** `installer/bootc-wrapper.sh` sets
  `progress_image_bytes=5000000000` (5 GB). The real payload is ~11 GB, so the
  computed fraction saturates and pins at the 99 clamp.
- **B. Sampling is stdout-driven, not clock-driven.** The wrapper only samples
  when `bootc` happens to print a line. Between prints — which is most of the
  deploy — the bar does not move at all.

Both must be fixed together. Fixing only the denominator still leaves a bar
that lurches between long dead stretches.

**REFUTED, do not retest:** PATH resolution of the wrapper, and `scratch_bound`
fallthrough. I named both as leading suspects; real install logs disproved both.

Brief written and ready: `/root/briefs/spplus-installer-progress-v3.md` (6.6 KB),
never dispatched. Dispatch it under the **apply** harness so the fix lands:

    THINKING=high /root/run-bee-apply.sh /root/briefs/spplus-installer-progress-v3.md 2700

Verification must be a real install with the bar sampled over time — a source
change alone proves nothing here.


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

### Fix 3 — an install can produce a system nobody can log into. QUEUED, HIGH.

**Hit by Christopher on the Dell, 2026-08-29, cycle41.** The machine installed
and booted, and he could not log in.

**Cause, by design and unguarded.** The kickstart declares no account at all:
the operator is expected to create one in Anaconda's User Creation spoke. The
root password is a hash of 48 random bytes that is generated, used, and
discarded — nobody knows it, deliberately. So if the User Creation spoke is
skipped, the installed system has **zero loginable accounts** and the only
recovery is a rescue boot.

Anaconda's User Creation spoke is **optional**, and its default state reads
"No user will be created" — confirmed in a hub screenshot taken during the
no-NIC test.

**Why this is severe for SP+ specifically:** the target user is a financial
advisor with no terminal skills. A rescue-boot chroot is not a recovery path
they can walk. For them this is a bricked machine.

**Fix direction (needs a decision):**
- Make user creation **mandatory** — the install must not be startable without
  an account. Preferred: it fails safe and costs the user nothing.
- Or have `%post` detect zero UID>=1000 accounts and fail the install loudly,
  rather than completing into an unusable system.
- Do **not** solve it by shipping a default account with a known password. That
  reintroduces exactly what the random-root-hash design removed.

Relevant that the current design comment claims this is "the same as any other
operating system" — it is not. Most installers refuse to proceed without either
a user or a usable root password. SP+ has neither.

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
