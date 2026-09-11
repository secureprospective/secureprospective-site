# SP+ defense-in-depth — RESUME (compact-safe, 2026-09-11 ~03:05 EDT)

## 1. WHAT WE ARE DOING

Running each Tier 2 defense-in-depth control through its own surgical
build / install / measure / mutate / commit loop, and leaving one final
verified ISO in `chris@192.168.1.190:~/Downloads/` for Christopher to test
independently. Five moves in doc 15 section 7 order; moves 1 through 4 are
done and committed, move 5 (the Tier 2 remainder) is in progress.

- Repo: `chris@192.168.1.190:~/work/secureprospective-advisor-os`
- Branch: `session/sp-plus-defense-in-depth`, head `0f9aeba`
- Reach the Beelink: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190 '<cmd>'`
- Reach the test VM (only while it is up):
  `ssh -n -o StrictHostKeyChecking=no -p 2222 -i /home/chris/.ssh/spvm test@127.0.0.1`
  password `testtest`, passwordless sudo, LUKS passphrase `spplustest`

## 2. AGENTS + HARNESSES

- `scripts/build-iso.sh <tag>` — payload, installer, ISO, and the check that the
  ISO carries the payload it names. Accepts `--skip-payload --skip-installer`,
  which still rebuilds the ISO (about 6 minutes).
- `tests/spplus-testvm.sh install <iso> spplus-test` then `... up spplus-test`.
  **Run each as its OWN command.** Chaining install with `| tail -N && ...`
  truncated the script's own post-install reconfiguration and left the boot
  media attached, costing two wasted cycles tonight.
- `tests/runtime-posture-gate.sh` — the spine. 58 assertions before T2.6,
  measured against the booted VM over the 2222 forward.
- No Bee dispatch is in flight. Nothing has been delegated.

## 3. GATES / STATUS

| Move | Control | State |
|---|---|---|
| 1 | Phase 0 Secure Boot lane | done, `a4e342b` |
| 2 | Phase S signature policy | done, `6bc59fd`, one open item |
| 3 | Tier 1 invisible hardening | done, `50de488` + `3631799` |
| 4 | T2.2 Flathub verified subset | done, `0cac9b1` + `b050e90` |
| 5 | T2.4 kernel hardening kargs | done, `cf84bc8` + `0f9aeba` |
| 5 | T2.6 login and password | **IN FLIGHT, see section 5** |
| 5 | T2.5 hardened_malloc scoped | not started |
| 5 | T2.7 MAC randomization | not started, needs a real dock |
| 5 | T2.3 DNS over TLS | not started, needs a real captive portal |
| 5 | T2.1 SELinux for Brave | not started, needs real carrier portals |

Last full green: **58 of 58 on the t24 install**, `RUNTIME_POSTURE_OK`.

## 4. ARTIFACTS THAT EXIST AND WORK

```
t24 ISO  projects/sp-plus/artifacts/t24-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/
         bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
bytes    5497708544
sha256   e16133c7c1112373452a678ea14c1137a083873706c3715f036bc6c1bb9ef352
payload  localhost/sp-plus-kde:t24  7ab3f824161a66555167fc342243a6cbc0b88f33fb216dd1525a9b0f3be3ab44
sidecar  .../payload.env  (SP_PAYLOAD + SP_PAYLOAD_ID)
```

Also present: `localhost/sp-plus-kde:t22` `c8a708b8db7d` (the pre-T2.4 mutation
image, still in podman storage). Its ISO was reaped tonight, 5.2 GB reclaimed;
rebuild it with `scripts/build-iso.sh t22 --skip-payload --skip-installer` if a
pre-T2.4 machine is needed again.

Ledgers written: `docs/ledger/PHASE-T22-2026-09-11-flathub.md`,
`docs/ledger/PHASE-T24-2026-09-11-kargs.md`.

## 5. IN FLIGHT RIGHT NOW

**One background job: the t26 ISO build.**

- Started 2026-09-11 about 03:02 EDT. Typical total 12 to 25 minutes.
- Task id `b6qtjs1zm`, output file
  `/tmp/claude-0/-root/a0322aee-765c-4f4c-93c5-c89868333d3c/tasks/b6qtjs1zm.output`
  (this file dies with the session; the build does not).
- Is it alive:
  `ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'pgrep -af build-iso.sh'`
- Its real log survives compaction:
  `ssh -n -i /root/.ssh/beelink chris@192.168.1.190 'ls -t ~/logs/sp-plus/build-t26-*.log | head -1'`
- Success looks like `BUILD_ISO_OK` plus a `payload sidecar written:` line.
- If it finished while the window was gone, just read that log; do not rebuild.

No VM is running. All three libvirt domains are `shut off`.

## 6. THE CURRENT STATE OF T2.6 (not a bug, an unfinished step)

T2.6 source is written and **uncommitted**:

```
 M projects/sp-plus/images/kde/Containerfile
 M projects/sp-plus/tests/runtime-posture-gate.sh
```

What it ships, and why each number is what it is. **These are day-one-rule
decisions, not defaults — do not "strengthen" them without reading this.**

- `faillock deny=10 unlock_time=120 fail_interval=900 audit`. Ten tries, then a
  two minute wait that clears itself. The common `deny=3 unlock_time=0` needs an
  administrator and is exactly the shape SP+ cannot ship to an advisor.
- **`even_deny_root` is deliberately absent** so a lockout is always clearable
  from a console. A build gate fails if anyone adds it.
- `pwquality minlen=12`, all four credits 0, `minclass=1`, `maxrepeat=3`,
  usercheck/gecoscheck/dictcheck on. Length over composition: class rules
  produce `Summer2026!` on a sticky note. `enforce_for_root` absent, gated.
- `UMASK 027` in `/etc/login.defs`.
- authselect profile `custom/sp-plus` now selected `with-faillock without-nullok`
  alongside the existing `with-silent-lastlog with-mdns4 with-mkhomedir`.

Runtime assertions added (7): login-shell umask, actual file mode 640, pwscore
rejecting a weak password, pwscore accepting a 22 character passphrase, faillock
actually counting failures against a throwaway probe account, the unlock being
short and root-clearable, and no `nullok` on either common auth stack.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **Editing `/boot/loader/entries/*.conf` does not mutate the kargs.** All six
  T2.4 arguments were removed and confirmed gone from the file; after a reboot
  they were back and the gate still read 58 of 58. ostree regenerates the entry
  from the deployment. The kargs are self-healing. The only way to get a machine
  without them is to build one.
- **`/sys/devices/system/cpu/vulnerabilities/meltdown` is the wrong PTI
  evidence.** It reports the CPU *bug*, not the mitigation. It printed
  `Not affected` on an AMD Ryzen 9 6900HX whose own kernel log said
  `force enabled on command line`. Use the `pti` flag in `/proc/cpuinfo`.
- **Alias symlinks under `/sys/kernel/slab` cannot measure slab merging here.**
  This kernel publishes all 566 caches as directories and zero symlinks, so the
  count is 0 on hardened and unhardened machines alike. Sum the `aliases` files
  instead, and note that Fedora 44 reports 0 aliases without `slab_nomerge`, so
  it is a property guard, not proof the karg acted.
- **`flatpak remote-modify --filter` registers but does not enforce.** Still
  enumerated 3,458 apps and still installed VLC. A disabled remote is fully
  inert. `NoEnumerate=` is not a valid `.flatpakrepo` key. Only `--no-enumerate`
  applied at runtime hides a remote while leaving it usable by name.
- **A deleted flatpak remote never returns.** libflatpak records applied remotes
  in `xa.applied-remotes` and will not recreate one. Survives a reboot. Upgrades
  of existing installs ARE covered, because those do not yet list
  `flathub-vouched`.

## 8. THE MISTAKE I MADE TWICE TONIGHT

A "must be absent" build gate that greps the whole file matches the **comment
explaining why the setting is absent**, and fails the build on its own
documentation. It happened in T2.4 (`mitigations=`) and then again in T2.6
(`even_deny_root`). Both are fixed by filtering comment lines first, and both
corrected forms were re-proven able to fail on a real setting.

**Any new absence check must strip comments before grepping.**

## 9. DECISIONS AND OPEN RATIFICATIONS

- D47 sshd ships disabled — awaiting ratification.
- D48 the `flathub-vouched` remote, SP+ vouching by name for Zoom and Signal —
  mechanism built and measured, editorial commitment is Christopher's.
- Phase S: re-signing the published ghcr image in the readable format is
  **Christopher's call**. Until then Phase S is verified-but-not-shippable.

## 10. LEDGER STATE

Committed this session: `0cac9b1`, `b050e90`, `cf84bc8`, `0f9aeba`.
Uncommitted: the two T2.6 files above, deliberately, because T2.6 has not been
measured on a booted machine yet.

## 11. NEXT ACTIONS, IN ORDER

1. **Read the t26 build log** and confirm `BUILD_ISO_OK` and the sidecar line.
   Do not rebuild if it already succeeded.
2. **Install and boot t26** as two separate commands, never chained:
   `tests/spplus-testvm.sh install artifacts/t26-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso spplus-test`
   then `tests/spplus-testvm.sh up spplus-test`.
   Clear the host key first: `ssh-keygen -f /home/chris/.ssh/known_hosts -R "[127.0.0.1]:2222"`.
3. **Run the posture gate. Expect 65 of 65.** If the faillock probe assertion is
   red, read `sudo faillock --user sp-faillock-probe` on the guest before
   assuming the control failed; the probe account may not have been created.
4. **Mutation-test T2.6** against the t24 image, which has none of it: rebuild
   the t24 ISO is unnecessary, it still exists with its sidecar, so install t24
   and expect the seven T2.6 assertions red while the other 58 stay green.
5. **Commit T2.6** and write `docs/ledger/PHASE-T26-2026-09-11-login.md`.
6. Then T2.5 `hardened_malloc` scoped. Then record T2.7, T2.3 and T2.1 as
   **blocked with their named real-world test** rather than marking them green
   on a VM that cannot exercise a dock, a captive portal or a carrier portal.
7. Build the final ISO with every verified control, gate it, then copy it to
   `chris@192.168.1.190:~/Downloads/` with its sha256.

## 12. ENVIRONMENT NOTES

- **Never chain `tests/spplus-testvm.sh install` behind a pipe or `&&`.** Run it
  alone. Two cycles were lost to this tonight.
- Remote edits go through a **file scp'd to the Beelink**, never an ssh heredoc.
  Heredocs eat backslashes and silently mangle Python and shell patches.
- The ISO output directory belongs to root (rootful builder). To write or delete
  in it, use the container pattern:
  `sudo -n podman run --rm -v "$PWD/artifacts:/a:z" docker.io/library/alpine:latest sh -c "rm -rf /a/<dir>"`.
- Beelink `sudo` permits `podman` only.
- Never build while the test VM is running. Check with
  `virsh -c qemu:///session list --all` first.
- Disk and RAM at handoff: 306G free on `/`, 133G on `/home`, 20G RAM
  available, all domains shut off, filing gate PASS at 23 entries.

## 13. HONEST STATUS

T2.6 is **written and building, and has never run on a machine.** Every claim in
section 6 is a design intention, not a measurement. The faillock probe assertion
in particular is the most likely of the seven to need adjustment, because it
creates a throwaway account and drives failed authentications through `sudo -u`,
which may not traverse the same PAM stack a console login does. If it is red,
diagnose before weakening it.

Three of the six Tier 2 controls cannot be honestly closed on this VM lane at
all. The right outcome for T2.7, T2.3 and T2.1 is a recorded block naming the
real-world test each needs, not a green tick from a virtual machine.
