# SP+ RESUME — 2026-08-29, compact #18

## 1. WHAT WE ARE DOING

Finish the 1st release of SP+, an immutable bootc/Fedora-Kinoite-44 workstation OS for
non-technical financial advisors. Right now: closing installer defects found on **real
bare metal** so a build is safe to put on the Dell, whose installs cost 1-3 hours each.

- Repo (Beelink): `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`. CT105 is where I run. I am headbrain.
- Build: `cd <repo> && bash /home/chris/sp-plus-iso-build.sh` — **run WITHOUT sudo**; it calls
  `sudo -n podman` internally. `sudo` is NOPASSWD for **podman only**. `sudo -n bash` FAILS.
- Output ISO (fixed filename, overwritten every build):
  `<repo>/projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso`

## 2. AGENTS + HARNESSES

- `/root/run-bee.sh <brief> [timeout]` — RESEARCH. Its prompt says **"write nothing to disk."**
- `/root/run-bee-apply.sh <brief> [timeout]` — APPLY. Identical except the prompt REQUIRES editing
  the checkout, running gates, and pasting real output; rejects an unapplied proposal.
  **Created this session.** Using the research harness for a fix lane wastes the whole run —
  that cost ~2 hours before it was caught.
- Both: `THINKING=high`, brief is a FILE, STDOUT is the findings channel, auto-REJECT under
  1500 bytes. Never run two dispatches at once.
- Briefs live in `/root/briefs/`, runs in `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`.
- Bee transcripts (recovery channel):
  `chris@192.168.1.190:/home/chris/.pi/agent/sessions/--home-chris--/*<tag>*.jsonl`

## 3. IN-FLIGHT WORK

**NOTHING IS RUNNING.** All dispatches finished, all VMs stopped, all waiters killed.
Nothing will be orphaned by compaction.

## 4. GATES / STATUS

| Gate | State |
|---|---|
| `tests/config-preflight.sh` | 14 passed, 0 failed — Safe to build (when tree is clean) |
| IWLWIFI_OK | PASS — installer carries Intel + Marvell wifi firmware |
| SPPLUS_NETWORK_PATCH OK | PASS |
| DN27_LOGIN_GATE_OK | PASS |
| DN28_PROGRESS_GATE_OK | PASS |
| **Welcome app** | 9 verbs wired, source gates pass. **Live QC never run.** |

## 5. ARTIFACTS

| File | Bytes | sha256 |
|---|---|---|
| `~/Downloads/SP-PLUS-cycle42.iso` | 5451386880 | `6d62711b3e062a5fc56e27a0366bdb24d93a0b08a223e6d0fb7f2498451a98ca` |
| `~/Downloads/SP-PLUS-cycle41.iso` | 5451386880 | `398cd42235d4bf81aa8aeacae9c09e057ca7c3ea01f2ec84b18e7a0424f932ff` |
| `~/Downloads/SP-PLUS-cycle40.iso` | 5450375168 | `7607f3348e364242b750b4bdb0918c2b02abea7fb40f907f41ca3d41c115b30d` |

**Screenshot evidence:** `chris@192.168.1.190:/home/chris/spplus-evidence/` (8 no-NIC pngs)
and `.../spplus-evidence/cycle42/` (14 install pngs). VM disks deleted; they are replayable.

## 6. THE CURRENT BUG — home directory is never created. BLOCKER.

Verbatim, from a tty3 login on a cycle42 install:

```
sp-plus login: advisor
-- advisor: /home/advisor: change directory failed: No such file or directory
Logging in with home = "/".
Unable to create log dir "/home/advisor/.cache/starship": PermissionDenied
uid=1000(advisor) gid=1000(advisor) groups=1000(advisor),10(wheel)
```

State on disk:
```
/home -> /var/home            (symlink, correct)
/var/home    drwxr-xr-x 2 root root 6      <-- EMPTY
/var/home/advisor             No such file or directory
```

**Authentication works. The account is correct and in wheel. It has no home.**
A text login survives this. A Plasma session almost certainly will not — the graphical greeter
did not respond to input during the test, which is consistent but **not yet proven** to be caused
by this.

**Leading hypothesis:** `%post` in `interactive-defaults.ks` does `mkdir -p "$home"` for every
`/home/*` account. `/home` is a symlink to `/var/home`, and on a bootc system **`/var` is
initialised fresh at first boot**, so anything `%post` writes into `/var` is discarded. The code
runs, reports success, and evaporates.

**CAVEAT ON THAT HYPOTHESIS — it is not proven.** I did not read the install-time logs to confirm
the mkdir actually ran and succeeded. It is also possible Anaconda never created the home and the
`%post` loop did not match. **Verify before fixing:** check `/var/log/anaconda/*` on the installed
system for the `%post` output, and confirm whether `/var` was reset.

**Fix direction (not yet applied):** stop creating homes at install time; create at first login via
`pam_mkhomedir` — `authselect enable-feature with-mkhomedir` plus `oddjob-mkhomedir`. Immune to the
`/var` reset because it runs after `/var` exists.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Removing `--device=link --activate` from the kickstart fixes the greyed-out Begin
  Installation."** REFUTED. Booted cycle41 with `-nic none`, completed the Destination spoke; its
  warning cleared, Network stayed the only marked spoke, button stayed grey. Real cause was
  Anaconda hardcoding `network_required = True`. The kickstart change is still a correct
  improvement, just not the cause.
- **"PATH resolution of the bootc wrapper"** and **"`scratch_bound` fallthrough"** as causes of the
  8% progress bar. Both REFUTED by real install logs.
- **"bootc can report progress natively."** REFUTED — bootc 1.16.9 has no such facility.
- **`ps pcpu` for 'busy now'.** It is a LIFETIME AVERAGE. Cost a prior session a wrong conclusion.
  Use `/proc/<pid>/stat` fields 14+15 deltas.
- **Measuring `welcome.py` for the CPU spin.** Wrong process — the burn is in the RENDERER
  (`QtWebEngineProcess --type=renderer`). Measuring the parent reads 0% in both arms.
- **`pgrep -f <pattern>` / `pkill -f <pattern>` over SSH.** Matches your OWN command line. Killed my
  ssh session twice and left four waiters spinning forever this session. Kill by PID.
- **`ls` timestamps vs `date -u`.** `ls` prints LOCAL (CDT); comparing to a UTC clock made a fresh
  ISO look 5 hours stale. Use `stat -c %Y` and epoch arithmetic.

## 8. DECISIONS (Christopher)

- **Fixes are batched per build.** No single-fix "yay moment" builds.
- **The Dell tests run before another ISO is proposed.**
- **Test every ISO in QEMU before burning.** Dell installs burn too much wall clock.
- Welcome: function before UI polish.
- Email: Google Workspace + MS365 only. Thunderbird deferred.
- Fedora 45 / live-installer research: prompt written and handed to Gemini + GLM as a panel.
  Not yet returned.
- **Never ship a default account with a known password.**

## 9. LEDGER STATE — all committed, tree clean

```
408bd93 installer: run the DN-28 gate after the wrapper exists
ae776c5 installer: DN-27 no unloginable installs, DN-28 honest progress bar
baa3224 ledger: installs can produce a system with no loginable account
6fa7331 ledger: 8% progress bar confirmed on bare metal, queued for ISO 42
4fa4dfc ledger: ISO 42 batched fix queue; anaconda network_required patch
2c19d78 welcome: single instance, zero idle CPU, all six stubs real
```
Fix queue: `projects/sp-plus/docs/ledger/ISO-42-QUEUE.md`.
**The home-directory blocker is NOT yet written into that queue.** Do that first.

## 10. NEXT ACTIONS, IN ORDER

1. **Log the home-directory blocker** into `docs/ledger/ISO-42-QUEUE.md` as Fix 4, HIGH, with the
   verbatim error and the unproven caveat from section 6.
2. **Verify the hypothesis before fixing** — do not fix on a guess. See section 6.
3. **Apply the `pam_mkhomedir` fix**, with a build gate, in the same style as DN-27/DN-28.
4. **Fix DN-28 properly.** The sampler works; the deploy only spans 9%->11% of the bar then jumps
   to 98%. `SPPLUS_PROGRESS` runs 0-99 inside DeployBootcTask but that task is ~1 step of ~11 in
   Anaconda's overall accounting, so its whole sweep moves the bar ~2%. `patch-anaconda-progress.py`
   is not achieving the weighting it intends. Read what it actually does.
5. **Rebuild** and re-run ALL FOUR QEMU tests before Christopher burns anything.
6. **Then** the Dell: fill `__DELL_IP__` in `/root/briefs/spplus-dell-qc.md` and dispatch with
   `THINKING=high /root/run-bee.sh /root/briefs/spplus-dell-qc.md 2700` (RESEARCH harness — it is
   a test-and-report lane).
7. Triage the Gemini/GLM Fedora-45 installer answers when they come back. Leads, not findings.

## 11. QEMU TEST RECIPE (reuse this)

```
qemu-system-x86_64 -machine q35,accel=kvm -m 4096 -smp 2 \
  -drive if=pflash,format=raw,unit=0,readonly=on,file=/usr/share/OVMF/OVMF_CODE_4M.fd \
  -drive if=pflash,format=raw,unit=1,file=$W/vars.fd \
  -drive file=$W/disk.qcow2,if=virtio,format=qcow2 \
  -cdrom "$ISO" -boot d -nic none \
  -device qemu-xhci -device usb-tablet \
  -vga virtio -display none -monitor unix:$W/mon.sock,server,nowait
```
- Drive it via the monitor: `echo "sendkey alt-c" | socat - UNIX-CONNECT:$W/mon.sock`
- Screenshot: `echo "screendump $W/x.ppm" | socat - ...` then `convert x.ppm x.png`
- Anaconda mnemonics: **alt-c** Continue, **alt-d** Done, **alt-b** Begin Installation,
  **alt-s** Save Passphrase. Plain `ret` does NOT work on the language screen.
- `-nic none` is the whole point: it reproduces the Dell. A virtual NIC always has a link and
  hides both installer bugs.
- Test credentials used: user `advisor`, password/LUKS `spplustest2026`.

## 12. HONEST STATUS

**cycle42 is NOT safe to burn.** Two of four tests pass outright (no-NIC install, mandatory user
creation). The progress bar is improved but still looks hung on slow hardware. The home-directory
defect means an advisor gets a machine that authenticates and then cannot run a desktop.

Everything proven this session was proven on bare metal or in a no-NIC VM. **None of the three
installer defects found today reproduces in a normal VM** — a virtual NIC always has a link, and
firmware is never needed. That is the single most important lesson to carry forward.

**Welcome app: 9 verbs wired, source gates green, ZERO live QC.** Bee reported runtime evidence
for the stubs; Christopher independently confirmed the printer test physically printed. Everything
else in Welcome remains unverified on real hardware.
