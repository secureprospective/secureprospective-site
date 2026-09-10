# SP+ RESUME — defense-in-depth build session, 2026-09-10 (second compact)

**Compact-safe. The session CONTINUES.** Read §1, then start at §9 item 1.
Do not re-derive, do not recap, do not re-test §6.

## 1. IN FLIGHT RIGHT NOW — one build, do not orphan it

**The Tier 1 payload build is RUNNING on the Beelink.** Started 23:15:40 UTC.

```
check alive : ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'pgrep -f "[b]uild-iso.sh tier1"'
progress    : L=$(ls -t ~/logs/sp-plus/build-tier1-*.log | head -1); grep -oE "STEP [0-9]+/[0-9]+" "$L" | tail -1
summary out : ~/logs/sp-plus/tier1-build.out
full log    : ~/logs/sp-plus/build-tier1-20260910T231540Z.log
```

**Use a BRACKETED pgrep pattern (`[b]uild-iso.sh`).** An unbracketed pattern matches the waiting
shell's own command line, so the waiter never sees the build exit and hangs forever. Two watchers
were lost that way this session.

It is a **full 210-step rebuild, not a cached one**, because `--build-arg SPPLUS_BUILD` was added
near the TOP of the Containerfile and invalidates every layer below it. Expect roughly an hour.
For later phases, put build metadata at the END of the file.

When it finishes it continues by itself into the installer and ISO steps and ends with either
`BUILD_ISO_OK` or a named failure. Nothing else is running: no agents, no dispatches, all three
libvirt domains are `shut off`.

## 2. WHAT WE ARE DOING

Christopher's goal, verbatim intent: run each roadmap phase **individually**, build an ISO for
each, install it in the VM, verify it, and only then move on. When all five are done, **leave the
final ISO in `chris@192.168.1.190:~/Downloads/`** so he can test it himself. Advisor function
must not be inhibited; where a control does bite, there must be a short reasonable way through.
Branch work, hoping to merge to main. Use Bee to preserve head-brain context.

- Repo: `beelink:~/work/secureprospective-advisor-os`
- Branch: **`session/sp-plus-defense-in-depth`**, head **`6bc59fd`**
- SSH: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Roadmap: `projects/sp-plus/docs/15-DEFENSE-IN-DEPTH-ROADMAP.md` §7 is the order

**The five moves:** 1 Phase 0 test lane · 2 Phase S signature · 3 Tier 1 batch ·
4 T2.2 Flathub filtering · 5 Tier 2 remainder one per build.

## 3. AGENTS + HARNESSES

| Thing | Where |
|---|---|
| One-shot ISO build | `projects/sp-plus/scripts/build-iso.sh <tag> [--skip-payload] [--skip-installer]` |
| Test VM | `projects/sp-plus/tests/spplus-testvm.sh {install,up,down,secboot,nuke,info}` |
| LUKS unlock | `projects/sp-plus/tests/vmunlock` — both are symlinked from `~/fleet/bin/` |
| Runtime posture gate | `projects/sp-plus/tests/runtime-posture-gate.sh` — 22 assertions |
| Signature gate | `projects/sp-plus/tests/signature-policy-gate.sh` — 10 assertions |
| Bee | `CT105:/root/run-bee.sh <brief.md> [timeout]`, `THINKING=high` |
| Bee brief used | `CT105:/root/.claude/briefs/bee-phase-s-signature-policy-20260910b.md` |
| Bee output | `CT105:/root/bee-runs/20260910T212925Z_bee-phase-s-signature-policy-20260910b/out` (13,351 B, ACCEPT) |

Bee's Phase S answer independently matched the implementation, including the exact policy JSON.
It did **not** catch the cosign-format problem in §5 — that came from running the gate.

## 4. GATES / STATUS

| Move | State |
|---|---|
| **1. Phase 0** — Secure Boot test lane | **DONE, committed `a4e342b`** |
| **2. Phase S** — signature policy | **BUILT AND VERIFIED, committed `6bc59fd`. NOT shippable — see §5** |
| **3. Tier 1** — invisible hardening | **BUILDING NOW.** Source uncommitted, see §8 |
| 4. T2.2 Flathub | not started |
| 5. Tier 2 remainder | not started |

Runtime posture gate on the Phase S install: **22 of 22**.
Signature policy gate: **9 of 10** — the tenth is §5.

## 5. THE OPEN FINDING — the fleet's signature is unreadable by the fleet

**Measured, certain, and it blocks shipping Phase S.**

cosign v3 does not write the attachment `containers/image` reads. It writes an OCI referrers
index pointing at an `application/vnd.dev.sigstore.bundle.v0.3+json` artifact, under a tag with
**no `.sig` suffix**. Evidence:

```
cosign verify --key cosign.pub ghcr.io/secureprospective/sp-plus-kde:latest      -> PASSES
sudo podman pull ghcr.io/... with the Phase S policy                             -> REFUSED
   "Source image rejected: A signature was required, but no signature exists"
GET /v2/secureprospective/sp-plus-kde/manifests/sha256-ca2fad9e....sig           -> 404
tags/list                                                                        -> sha256-ca2fad9e... (no .sig)
```

**The fix is built and tested**: `scripts/publish-image.sh` now signs with
`skopeo copy --sign-by-sigstore-private-key --sign-passphrase-file --sign-identity "$REPO:latest"`,
which produces the readable format from the same key file.

**What is NOT done, and needs Christopher:** the already-published image must be re-signed in the
readable format before the Phase S policy reaches any advisor machine. It adds a signature to an
existing digest, changes no image and moves no tag, but it writes to the production registry.
Until then Phase S is verified-but-not-shippable, and that is the honest state.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **`--registry-referrers-mode=legacy` does not fix the cosign format.** Tested. Per its own help
  text that flag governs *fetching* references, not writing them; signing with it produced the
  same suffix-less tag.
- **`skopeo --policy <file> inspect` DOES NOT ENFORCE THE POLICY.** Measured directly: it accepted
  a deliberately unsigned image. Use `podman pull --signature-policy`, which was mutation-tested
  in both directions and refuses correctly.
- **The registries.d scope granularity was not the problem.** Both `ghcr.io/secureprospective` and
  the full repo path behave identically. Do not chase this again.
- **The VM cannot reach the host at the host's own LAN address.** passt gives the guest the host's
  address; the host is reachable at the **default gateway** (`192.168.1.1`), confirmed by pulling
  from a registry there. Do not re-debug this.
- **`skopeo inspect`/`cosign verify` passing proves nothing about the fleet.** Only a pull through
  the shipped policy does.
- **A signature binds to the manifest DIGEST, not the tag.** Three fixtures pushed as one image
  shared a digest, so signing the good one signed both bad ones and the gate reported refusals as
  passes. Fixtures must be three distinct images. This is also the real residual risk of
  `signedIdentity: matchRepository`.
- **`spplus-update-control` lives at `/usr/libexec/spplus-update-control`**, not under
  `/usr/libexec/sp-plus/`.
- Everything in the previous resume's refuted list still holds: the alpha4 ISO size coincidence,
  the 2026-09-04 embedded-ref mismatch being absent from alpha4, `mokutil` being present,
  `lockdown=[none]` and `sig_enforce=N` being VM artefacts, and the serial-console LUKS failure.

## 7. DECISIONS

| # | Ruling |
|---|---|
| D43 | Fedora/KDE bootc is the sole target. Debian parked |
| D44 | **Nothing may break day one.** Printing, discovery, Wi-Fi, Brave, PWAs, audio, camera, mic, suspend, external display, Bluetooth |
| D45 | Brave is fixed for this lane |
| D46 | Every control ships with a posture-gate assertion, mutation-tested red before green |
| D47 | **PROPOSED, not yet ratified:** sshd ships **disabled**. It was development convenience going to production and no advisor workflow uses it. The QA kickstart re-enables it, so the test lane is unaffected |

**Awaiting Christopher:** the §5 re-sign, and D47.

## 8. LEDGER STATE

Committed on `session/sp-plus-defense-in-depth`:

- `a4e342b` Phase 0 — testvm Secure Boot + vTPM, two `up` defects, 4 gate assertions
- `6bc59fd` Phase S — policy, key, registries.d, advisor message, publish lane rewrite, gate

**Uncommitted, and it is the Tier 1 source the running build is consuming:**

```
 M projects/sp-plus/config/sp-plus.service          T1.5 sandboxing directives
 M projects/sp-plus/images/kde/Containerfile        the whole Tier 1 block
 M projects/sp-plus/scripts/build-iso.sh            --build-arg SPPLUS_BUILD
?? projects/sp-plus/config/coredump/                T1.8
?? projects/sp-plus/config/limits/                  T1.8
?? projects/sp-plus/config/security/                T1.10 suid allowlist
?? projects/sp-plus/config/sysctl/                  T1.1-T1.3, T1.8
```

Deliberately **not** committed until the build proves the gates pass. Do not commit it blind.

Branch is not merged and must not be until Christopher says so.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for the Tier 1 build** (§1). On `BUILD_ISO_OK`, note the ISO path, bytes and sha256.
2. **Install it**: `~/fleet/bin/spplus-testvm.sh install <iso> spplus-test`. It converts itself to
   Secure Boot automatically. Then `spplus-testvm.sh up spplus-test` (73 s to SSH, unattended).
3. **Run both gates**: `tests/runtime-posture-gate.sh` must stay 22/22, and
   `tests/signature-policy-gate.sh` must stay 9/10.
4. **Add Tier 1 assertions to the posture gate**, mutation-tested red before green: ptrace_scope,
   kptr_restrict, core_pattern, `systemd-analyze security sp-plus.service` below a threshold,
   homed and sssd masked, sshd not enabled, no SUID file outside the allowlist.
5. **Day-one regression pass** on the VM: graphical login renders, 0 failed units, cups/avahi/
   NetworkManager/bluetooth active, Brave present, the SP+ RPC still answers on loopback
   (`tests/test-rpc.sh`), and suspend/resume.
6. **Commit Tier 1** with the gate output in the message. Write
   `docs/ledger/PHASE1-2026-09-10-tier1.md`.
7. **Move 4: T2.2** — Flathub `--subset=verified`. Cheap now, a migration later.
8. **Move 5: Tier 2 remainder**, one control per build.
9. **Final ISO to `chris@192.168.1.190:~/Downloads/`** with its sha256, per the goal.

Carried over, still untouched: `tests/libreoffice-parity-gate.sh` against a current ISO
(15 of 68 failing on alpha3); render-check T-28 and T-30; alpha v0.10 R2 upload blocked on a token
only Christopher can mint.

## 10. RELAY / ENVIRONMENT NOTES

- **Beelink `sudo` permits `podman` ONLY.** Files under `/etc` are written by mounting them into a
  throwaway alpine container. Root-owned ISOs are deleted the same way.
- All SP+ execution runs on a VM, never on the Beelink desktop itself.
- The build script refuses to start with under 40 G free. Disk now: **302 G on `/`, 142 G on
  `/home`.** Reclaimed this session: 22 G of stale images, plus the throwaway signature fixtures.
- `localhost/sp-plus-base-pinned:kinoite44` exists so a prune cannot drop the pinned base digest.
- Commands for Christopher go to `chris@192.168.1.190:/home/chris/Downloads/paste.md`.
- Filing gate: **PASS**, 23 visible entries.

## 11. HONEST STATUS

1. **Tier 1 is unproven.** Nothing in it has run on a booted machine. The build gates check the
   files landed; they do not check the kernel accepted the sysctls or that the sandboxed service
   still answers. Step 5 above is what would catch a break, and it has not run.
2. **Phase S cannot ship** until the published image is re-signed. §5.
3. **`MemoryDenyWriteExecute` was deliberately left off** `sp-plus.service`. CPython does not need
   W+X but a C extension might, and the failure would be a runtime crash rather than a build
   error.
4. **Removing `open-vm-tools` and `qemu-guest-agent` is untested on real hardware.** It is the
   right call for an advisor laptop and it removed a setuid root binary, but only the VM has run it.
5. **Suspend and resume have never been tested in this lane at all**, under any phase.
