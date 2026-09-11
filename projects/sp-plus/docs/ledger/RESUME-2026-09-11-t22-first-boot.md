# SP+ RESUME — defense-in-depth build session, 2026-09-11 (third compact)

**Compact-safe. The session CONTINUES.** Read §1, then start at §9 item 1.
Do not re-derive, do not recap, do not re-test §6.

## 1. IN FLIGHT RIGHT NOW

**Nothing is running.** All three libvirt domains are `shut off`, no build, no dispatch, no agent.
This is a clean compaction point. The T2.2 ISO finished at 00:53 and is on disk (§4).

The only thing waiting is a **re-install and re-verify of the T2.2 ISO on a FIRST boot** — §5
explains why the first boot specifically is the case that matters.

```
build a new ISO : cd ~/work/secureprospective-advisor-os/projects/sp-plus
                  nohup setsid bash scripts/build-iso.sh <tag> > ~/logs/sp-plus/<tag>-build.out 2>&1 &
check alive     : ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'pgrep -f "[b]uild-iso.sh <tag>"'
```

**Always use a BRACKETED pgrep pattern (`[b]uild-iso.sh`).** An unbracketed one matches the
waiting shell's own command line and hangs forever. Three watchers were lost that way.

## 2. WHAT WE ARE DOING

Christopher's goal, verbatim intent: run each roadmap phase **individually**, build an ISO for
each, install it in the VM, verify it, and only then move on. When all five are done, **leave the
final ISO in `chris@192.168.1.190:~/Downloads/`** so he can test it himself. Advisor function
must not be inhibited; where a control does bite there must be a short reasonable way through.
Branch work, hoping to merge to main. Use Bee to preserve head-brain context.

- Repo: `beelink:~/work/secureprospective-advisor-os`
- Branch: **`session/sp-plus-defense-in-depth`**, head **`3631799`**
- SSH: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Roadmap: `projects/sp-plus/docs/15-DEFENSE-IN-DEPTH-ROADMAP.md`, §7 is the order, §4 is Tier 2

**The five moves:** 1 Phase 0 test lane · 2 Phase S signature · 3 Tier 1 batch ·
4 T2.2 Flathub filtering · 5 Tier 2 remainder, one control per build.

## 3. HARNESSES

| Thing | Where |
|---|---|
| One-shot ISO build | `projects/sp-plus/scripts/build-iso.sh <tag>` |
| Test VM | `projects/sp-plus/tests/spplus-testvm.sh {install,up,down,secboot,nuke,info}` |
| Runtime posture gate | `projects/sp-plus/tests/runtime-posture-gate.sh` — **48 assertions** |
| Signature gate | `projects/sp-plus/tests/signature-policy-gate.sh` — 10 assertions |
| Bee | `CT105:/root/run-bee.sh <brief.md> [timeout]`, `THINKING=high` |

VM reach from CT105, used by every diagnostic in this session:

```
ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'ssh -n -o BatchMode=yes \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR \
  -i /home/chris/.ssh/spvm -p 2222 test@127.0.0.1 "<command>"'
```

`-o LogLevel=ERROR` is load-bearing: without it the host-key warning contaminates every value.

## 4. GATES / STATUS / ARTIFACTS

| Move | State |
|---|---|
| **1. Phase 0** Secure Boot test lane | **DONE**, committed `a4e342b` |
| **2. Phase S** signature policy | **DONE**, committed `6bc59fd`. Not shippable, §5 |
| **3. Tier 1** invisible hardening | **DONE**, committed `50de488` + ledger `3631799` |
| **4. T2.2** Flathub verified subset | **BUILT, one assertion still unproven.** §5 |
| 5. Tier 2 remainder | not started, plan in §9 |

**The T2.2 ISO, rebuilt with the unit fix:**

```
/home/chris/work/secureprospective-advisor-os/projects/sp-plus/artifacts/t22-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
bytes   5497700352
sha256  83c6b16243857147fe098641145d2602c6fb51db8bcf84d63eeaca0a243e4686
payload localhost/sp-plus-kde:t22  c8a708b8db7d1c7bcbb96c45ac1931a98449a51ea331b9a22321319e177f2584
log     ~/logs/sp-plus/build-t22-20260911T004604Z.log
```

The PREVIOUS t22 ISO (sha `92413e07…`) is the one whose first boot failed. It has been deleted;
do not go looking for it.

Last measured runs, on the Tier 1 install:

| Gate | Result |
|---|---|
| runtime posture | 44 of 44 |
| signature policy | 9 of 10, the tenth is §5 |
| failed units | 0 |
| `sp-plus.service` exposure | 1.1, was 7.7 |

On the FIRST t22 install the posture gate read **46 of 48**, with the two vouched-remote
assertions red. That is the bug §5 describes, now fixed but **not yet re-verified**.

## 5. THE TWO OPEN ITEMS

### 5a. The published image signature is unreadable by the fleet (blocks Phase S shipping)

cosign v3 does not write the attachment `containers/image` reads. It writes an OCI referrers
index pointing at an `application/vnd.dev.sigstore.bundle.v0.3+json` artifact under a tag with
**no `.sig` suffix**.

```
cosign verify --key cosign.pub ghcr.io/secureprospective/sp-plus-kde:latest   -> PASSES
podman pull under the Phase S policy                                          -> REFUSED
   "Source image rejected: A signature was required, but no signature exists"
```

The fix is built and tested: `scripts/publish-image.sh` now signs with
`skopeo copy --sign-by-sigstore-private-key --sign-passphrase-file --sign-identity`.
**Not done, and needs Christopher:** re-sign the already-published image. It adds a signature to
an existing digest, changes no image and moves no tag, but it writes to the production registry.

### 5b. T2.2 first-boot race — FIXED IN SOURCE, NOT YET RE-VERIFIED

**This is the thing to finish first.** On the very first boot of the first t22 install, the
vouched Flatpak remote did **not** get its no-enumerate flag, so the software centre would have
listed all 3,458 applications instead of the 2,186 verified ones.

Cause, measured in the first-boot journal:

```
20:41:04 Starting flatpak-add-fedora-repos.service ...
20:41:04 Starting spplus-flatpak-remotes.service ...
20:41:04 flatpak[1094]: system: Modified remote flathub-vouched to https://dl.flathub.org/repo/
20:41:04 flatpak[1087]: system: Added remote fedora to oci+https://registry.fedoraproject.org
```

Both units write `/var/lib/flatpak/repo/config`. Fedora's wrote last, from a copy read before the
change landed, and `xa.noenumerate` was lost. **Both units logged success and
`systemctl --failed` was empty.** On every SUBSEQUENT boot the flag sticks — verified by a full
reboot — so only a first boot exposes it.

Fix now in `config/spplus-flatpak-remotes.service`, uncommitted:
`After=flatpak-add-fedora-repos.service`, and the ExecStart now sets the flag, **reads it back**,
retries for twenty seconds, and **fails the unit** if it never takes.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

New this window:

- **`Subset=verified` in a `.flatpakrepo` file WORKS.** Confirmed: the remote showed
  `subset=verified`. The `flatpak remotes --columns=name,options` column does NOT show it; the
  `subset` column does. I misread that once.
- **`NoEnumerate=` in a `.flatpakrepo` file does NOT work.** The only keys the parser accepts are
  `Subset`, `Filter`, `NoDeps`, `DefaultBranch` — read out of the shipped libflatpak strings.
  That is the entire reason a convergence unit exists.
- **`flatpak remote-modify --filter` DOES NOT ENFORCE.** A filtered remote still enumerated all
  3,458 refs and still installed `org.videolan.VLC`, which the filter did not allow. Do not ship
  it as a control.
- **A DISABLED flatpak remote is fully inert** — `remote-info` blocked, install fails with
  "Can't fetch summary from disabled remote". Disabling is not a way to hide an install source.
  `--no-enumerate` is.
- **The verified subset removes Zoom, Signal, Slack and VLC.** Measured both directions: subset
  on, Zoom gone; subset off, Zoom back. 3,458 apps → 2,186.
- **`find / -xdev` on a booted SP+ machine cannot see `/var`.** Root is composefs with writable
  xfs at `/etc`, `/var`, `/var/home`. A setuid binary planted in `/usr/local/bin` (which is
  `/var/usrlocal`) left the posture gate green.
- **`find / -xdev` inside the BUILD container walks the ostree object store** and reports every
  allowlisted setuid file a second time under its content-addressed name. Prune `/sysroot` and
  `/ostree`.
- **Several hardening sysctls are mode 0600.** An unprivileged `cat` returns nothing, so the gate
  called a correctly set `net.core.bpf_jit_harden` absent. Read them through `sysctl`.
- **`--build-arg SPPLUS_BUILD` is a fixed literal `20260910`**, so it does NOT bust the cache
  between runs. A cached rebuild of the payload takes about 65 seconds.

Still holding from earlier windows: `--registry-referrers-mode=legacy` does not fix the cosign
format · `skopeo --policy FILE inspect` does not enforce policy, use `podman pull
--signature-policy` · registries.d scope granularity was never the problem · the VM reaches the
host at the **default gateway** `192.168.1.1`, not at the host's own LAN address, because passt
gives the guest that address · a signature binds to the manifest DIGEST so fixtures must be three
distinct images · `spplus-update-control` lives at `/usr/libexec/spplus-update-control`.

## 7. DECISIONS

| # | Ruling |
|---|---|
| D43 | Fedora/KDE bootc is the sole target. Debian parked |
| D44 | **Nothing may break day one.** Printing, discovery, Wi-Fi, Brave, PWAs, audio, camera, mic, suspend, external display, Bluetooth |
| D45 | Brave is fixed for this lane |
| D46 | Every control ships with a posture-gate assertion, mutation-tested red before green |
| D47 | **PROPOSED, not ratified:** sshd ships disabled. Enforced at BUILD time only — the QA kickstart re-enables it so the gate can connect, so a runtime assertion would measure the harness |
| D48 | **PROPOSED, not ratified:** the `flathub-vouched` remote. SP+ vouches by name for applications Flathub does not mark verified, currently Zoom and Signal. Adding a name to that map is a supply-chain decision |

Also settled by measurement, not by ruling: `kernel.yama.ptrace_scope` is **1**, not 2 or 3,
because Chromium and Brave ptrace their own children. `MemoryDenyWriteExecute` and `PrivateUsers`
are deliberately absent from `sp-plus.service`.

## 8. LEDGER STATE

Committed on `session/sp-plus-defense-in-depth`:

```
3631799 Tier 1 ledger
50de488 Tier 1: invisible hardening batch, measured in effect on a booted machine
de6a768 compact-safe resume, mid Tier 1 build
6bc59fd Phase S
a4e342b Phase 0
```

**Uncommitted — this is the whole of T2.2 and it is deliberate, because §5b is unproven:**

```
 M projects/sp-plus/config/flatpak/flathub.flatpakrepo      Subset=verified appended
 M projects/sp-plus/images/kde/Containerfile                the T2.2 block, gate FLATHUB_SUBSET_GATE_OK
 M projects/sp-plus/tests/runtime-posture-gate.sh           4 T2.2 assertions
 M projects/sp-plus/welcome/welcome.py                      FLATPAK_APP_REMOTE map
 M projects/sp-plus/installer/interactive-defaults.ks       build-iso.sh pinned it to :t22
 M projects/sp-plus/installer/payload-ref.txt               same
?? projects/sp-plus/config/flatpak/flathub-vouched.flatpakrepo
?? projects/sp-plus/config/spplus-flatpak-remotes.service   the fixed unit
```

Branch is not merged and must not be until Christopher says so.

## 9. NEXT ACTIONS, IN ORDER

1. **Install the new t22 ISO** and verify on a FIRST boot:
   `tests/spplus-testvm.sh install artifacts/t22-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso spplus-test`
   then `tests/spplus-testvm.sh up spplus-test`. **Run the posture gate BEFORE rebooting it** —
   the second boot masks the bug.
2. **Expect 48 of 48.** If the vouched assertions are still red, read
   `journalctl -u spplus-flatpak-remotes.service -b` first; the unit now fails loudly.
3. **Commit T2.2** with gate output, and write `docs/ledger/PHASE-T22-2026-09-11-flathub.md`.
4. **Move 5, Tier 2 remainder, one control per build.** Doc 15 §4. Proposed order and honesty
   about what this lane can prove:
   - **T2.4 kernel argument hardening** — DO IT FIRST. `init_on_alloc=1 init_on_free=1
     randomize_kstack_offset=on slab_nomerge vsyscall=none pti=on`, **excluding
     `mitigations=auto,nosmt`** per the roadmap. Ships as a second file in
     `/usr/lib/bootc/kargs.d/`, alongside the existing `10-sp-plus-splash.toml`. Assert the
     cmdline AND three real effects: no `[vsyscall]` mapping, zero alias symlinks under
     `/sys/kernel/slab`, and `Mitigation: PTI` in the meltdown vulnerability file.
   - **T2.6 login and password hardening** — `faillock`, `pwquality`, `UMASK 027`. Weigh a
     non-technical advisor locking themselves out; needs a stated recovery path.
   - **T2.5 `hardened_malloc` scoped** — test Brave, every PWA, Fin's Node runtime, LibreOffice.
   - **T2.7 MAC randomization** — the documented failure is USB Ethernet on a dock, which this
     VM CANNOT test. Ship Wi-Fi-only scope or record it blocked on hardware.
   - **T2.3 DNS over TLS** — the roadmap's own gate is a tested captive-portal path. A VM cannot
     produce one. Expect to record this blocked on hardware rather than ship it.
   - **T2.1 SELinux confinement for Brave** — largest job, and its gate is real carrier portals.
     Expect to record it blocked rather than ship it.
5. **Final ISO to `chris@192.168.1.190:~/Downloads/`** with its sha256, per the goal.

Carried over, untouched: `tests/libreoffice-parity-gate.sh` against a current ISO (15 of 68
failing on alpha3); render-check T-28 and T-30; alpha v0.10 R2 upload blocked on a token only
Christopher can mint.

## 10. RELAY / ENVIRONMENT NOTES

- **Beelink `sudo` permits `podman` ONLY.** Files under `/etc` and root-owned ISOs are written or
  deleted by mounting them into a throwaway alpine container:
  `sudo -n podman run --rm -v "$PWD/artifacts:/a:z" docker.io/library/alpine:latest sh -c "rm -rf /a/<dir>"`
- All SP+ execution runs on a VM, never on the Beelink desktop itself.
- `build-iso.sh` refuses to start under 40 G free. Now: **309 G on `/`, 135 G on `/home`**,
  20 G RAM free. Reclaimed this window: 10 G of superseded images plus the Tier 1 ISO.
- **Do not boot the 8 G test VM while an ISO build is running.** Crashing the host is failure.
- `localhost/sp-plus-base-pinned:kinoite44` exists so a prune cannot drop the pinned base digest.
- Commands for Christopher go to `chris@192.168.1.190:/home/chris/Downloads/paste.md`.
- Filing gate: **PASS**, 23 visible entries.

## 11. HONEST STATUS

1. **T2.2 is not proven.** The fix for §5b has never booted. Everything else about T2.2 measured
   green, including all four Optional Tools resolving, but the control it exists to deliver is
   exactly the one that failed.
2. **Tier 1 is proven on a VM only.** Removing the two guest agents is untested on real hardware.
3. **Suspend and resume have never been tested in this lane, under any phase.** It is on D44's
   list and it is the oldest unaddressed gap here.
4. **Phase S cannot ship** until the published image is re-signed. §5a.
5. **Three of the six remaining Tier 2 controls have gates this lane cannot satisfy** — real
   carrier portals, a real captive portal, a real dock. Do not let them be marked done on a VM
   pass. Recording them blocked with the named test is the honest outcome.
6. Four of the Tier 1 sysctl assertions passed BEFORE Tier 1, because they are Fedora defaults.
   They guard against regression; they are not evidence of anything SP+ changed, and must not be
   counted as such in the Security Evidence Report.
