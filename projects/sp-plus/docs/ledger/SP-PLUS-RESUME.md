# SP+ RESUME — written 2026-09-01 ~10:45 CDT, mid-session, before compaction

## 1. WHAT WE ARE DOING

**The ask, in Christopher's own words:** *"the only ask is that all applications have a
way to be updated in SP+ ... so far we have been unable to get that done."*

**That objective is NOT met.** Read §5 before anything else — the work committed so far
solves adjacent problems, not the stated one.

- Repo: `/home/chris/work/secureprospective-advisor-os` (a **worktree**; do not cd to the
  original checkout). Branch `session/sp-plus-plan`. Project dir `projects/sp-plus`.
- Changes this session go into the **next ISO**. Christopher: *"when we are ready we will
  build the next ISO for testing."* **Do not build an ISO unasked.**
- Test rig: QEMU VM `fedora-test` (libvirt session, `virsh`). See §10 for how to reach it.

## 2. AGENTS + HARNESSES

None dispatched this session. All work was done directly in this session on the Beelink
and the VM. Bee/GPT were not used.

> Standing preference this session deviated from: `claude-drives-luna-does` says delegate
> execution. Christopher assigned the VM to me directly here, so hands-on was correct.

## 3. GATES / STATUS

| Gate | Where | State |
|---|---|---|
| `tests/config-preflight.sh` | Beelink | **30/30 PASS — "Safe to build."** |
| `tests/cycle36-source-gate.sh` | Beelink | PASS |
| `tests/fin-extension-gate.mjs` | Beelink | **49/49 PASS** against Pi 0.84.4 |
| `tests/field-inspect.sh` | VM | updated for the new store + releasever checks; **not re-run since edit** |
| `tests/bee-lane/spb-fin` | VM | pin string bumped to 0.84.4; **not run** |

Every gate added this session was mutation-tested (broken deliberately, seen to fail on
the right line, restored). Details in the commit messages.

## 4. ARTIFACTS THAT EXIST AND WORK

**Commits on `session/sp-plus-plan` (all committed, tree clean):**

| SHA | What |
|---|---|
| `eb5dd9a` | `$releasever` fix + stock Discover store (wrapper removed) |
| `be4ebcc` | DN-46 update policy: stage daily, apply at shutdown, never reboot |
| `2db728a` | Pi 0.84.3 → 0.84.4, single `ARG PI_VERSION`, pin gate |

**Local registry `spplus-reg` on :5000** (podman, must stay up — the VM pulls from it):
tags `test44 test45 test46 test47 test48 latest`. `test48` and `latest` are **mine**, built
this session; `latest` = image `localhost/sp-plus-kde:test48v4`.

**Podman images (11.1 GB each, mine):** `localhost/sp-plus-kde:test48`, `:test48v2`,
`:test48v3`, `:test48v4`. Delete when the VM no longer needs them.

**VM `fedora-test`** is booted on `10.0.2.2:5000/sp-plus-kde:test48`, which **contains all
three commits' changes**. It is a live, working test bed. It is NOT pointed at ghcr.

## 5. THE ACTUAL PROBLEM — STILL UNSOLVED

SP+ has three populations of software. Only two have an update route:

| Population | Update route | State |
|---|---|---|
| Flatpaks (Zoom, Bitwarden, advisor installs) | `spplus-flatpak-update.timer` daily + Discover | **works** |
| Firmware | fwupd, now visible in Discover | **works** (new this session) |
| **Everything baked into the bootc image** — Brave, **Pi/Fin**, kitty, micro, btop, starship, node, KDE stack | **none** | **NO UPDATE PATH** |

The image-resident applications change only when we rebuild and publish a new image.
**Bumping the Pi pin by hand this session was the demonstration of the gap, not a fix.**
A frozen browser and a frozen AI agent on an advisor's machine are both security-relevant.

**This is the next work.** Options not yet evaluated or costed:
- Move Brave (and possibly others) to Flatpak, so they self-update like Zoom.
- Establish a rebuild-and-publish cadence triggered by upstream releases of the pinned set.
- Something else. **Ask Christopher before picking** — this is a product decision and a
  guessed answer burns a 15-minute build (`no-workarounds-fix-it-or-ask`).

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Manual updating is blocked by polkit / sudo / a KDE kiosk lock."** No. There are no
  masked units, no custom polkit rules, no `[KDE Action Restrictions]`. `%wheel NOPASSWD:
  ALL` is in effect. Flatpak system installs need `active+local`, which the real session
  has.
- **"`rpmostreed OS operation Upgrade not allowed for user` is a product defect."** No —
  **my own test artifact.** I launched Discover over SSH, so it sat outside the active
  local session. Re-run from inside the desktop session, rpm-ostreed logs `Allowing active
  client`. Always launch GUI apps from inside the session (Welcome's OPEN DISCOVER button).
- **"`Error parsing image name docker://10.0.2.2:5000/sp-plus-kde ... manifest unknown`
  is a product defect."** No — also my rig. Discover mis-parsed the `:5000` **port** as a
  tag and queried `:latest`, which my local registry lacked. Pushing a `latest` tag made it
  vanish. ghcr has no port, so production is unaffected.
- **"The Discover wrapper was needed to keep PackageKit out."** No. PackageKit is not
  installed at all; the image-level assertion is the real guard. The wrapper's only live
  effect was hiding the **fwupd** backend (firmware updates).

## 7. DECISIONS (Christopher's, this session — do not relitigate)

- **Q4 auto-update reboot policy — DECIDED: stage silently, install on shutdown.**
  `bootc-fetch-apply-updates.timer` stays disabled (it runs `--apply` and reboots).
  Recorded in `docs/06-OPEN-QUESTIONS-AND-DECISIONS.md`, now marked CLOSED.
- **How far to open up manual updating — DECIDED: Flatpak + image + firmware, seamless.**
  **No rpm-ostree layering** — it permanently breaks `bootc upgrade` (verified 2026-08-29).
- **Changes accumulate for the next ISO**; build only when Christopher says so.

## 8. LEDGER STATE

Committed: all three commits above, plus doc updates to
`docs/06-OPEN-QUESTIONS-AND-DECISIONS.md` (Q4 closed) and
`docs/ledger/ISO-44-QUEUE.md` (items 1 and 4 marked done).

**Not committed / not written:** nothing. `git status` is clean. This resume doc is the
only pending write.

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher which route he wants for image-resident app updates** (§5) — Flatpak
   migration for Brave et al., a rebuild-on-upstream-release cadence, or another shape.
2. **Enumerate every image-resident application** from the Containerfile and state, per
   app, whether it can move to Flatpak. Brave and Pi/Fin are the two that matter most.
3. Implement the chosen route with a mutation-tested gate, in the DN-nn style.
4. Re-run `tests/field-inspect.sh` on the VM (edited but not re-run).
5. **Still outstanding and NOT ours to fix:** `ghcr.io/secureprospective/sp-plus-kde:latest`
   is OLDER than what the ISO installs, so a production machine shows a permanently failing
   update with a generic *"Update Issue"* dialog. Verbatim cause:
   `Upgrade target revision ... is chronologically older than current revision ... use
   --allow-downgrade to permit`. This is ISO-44-QUEUE item 2 and needs the tag published
   from the next ISO's image, or the error returns.
6. Cosmetic list Christopher has not yet given me, plus two I noticed: Discover renders
   **dark** against the light desktop after a reboot; the journal carries a Welcome JS
   error `Uncaught TypeError: Cannot read properties of null (reading 'style')`.

## 10. RELAY / ENVIRONMENT NOTES

**Reaching the VM.** libvirt session mode, user networking, no libvirt networks defined.
There is **no persistent hostfwd** — I added one at runtime through the QEMU monitor:

```bash
virsh qemu-monitor-command fedora-test --hmp \
  'hostfwd_add hostnet0 tcp:127.0.0.1:2222-10.0.2.15:22'
ssh -o StrictHostKeyChecking=no -p 2222 test@127.0.0.1
```
**This forward dies if the VM is restarted by libvirt** (it survives a guest reboot).
Re-add it with the same command. Key-based auth already works.

**Do not use `virsh qemu-agent-command` for admin** — the guest agent runs confined as
`virt_qemu_ga_t` and gets Permission denied on `bootc`, `rpm-ostree`, `systemctl`, even
`getenforce`.

**Driving the GUI.** Scripts in the scratchpad:
`vmclick.sh <x> <y>` (QEMU absolute input events, screen 2048x1152), `vmshot.sh <name>`
(virsh screenshot → png), `vmtype.sh "text"` (virsh send-key). Konsole's D-Bus
`runCommand` is **guarded** and returns Access denied — do not rely on it.

**Container builds need `--network host`** — the sanctioned build uses it
(`~/fleet/bin/sp-plus-iso-build.sh`). Without it, dnf inside the build cannot resolve
`mirrors.fedoraproject.org`. I lost ~10 minutes to this.

**Housekeeping:** `~/.npm` is new since the filing baseline — a regenerable npm cache
created by my local Pi version check. Safe to delete; re-baseline per the gate's own hint.

## 11. HONEST STATUS

**The session's stated objective is not met.** What is genuinely proven, by observation on
the VM and not by reading code:

- The `$releasever` fix: all five repos refresh; `rpm-ostree install --dry-run htop`
  resolves `htop-3.4.1-3.fc44`.
- The stock store: Discover Settings shows a **Firmware Updates** section with LVFS
  enabled; Bitwarden installed from Welcome with no password prompt.
- DN-46 end to end: new image pushed to the tracked tag → staged with no reboot → `booted`
  unchanged → notification appeared on screen → did not repeat over two further runs →
  staged deployment applied on the next restart. No failed units, system or user.
- Pi 0.84.4 installs and reports `0.84.4`; Fin guardrails gate 49/49 against it.

**Unproven:** none of this has been through a real ISO build. `config-preflight` says
"Safe to build" but a build has not been run, so the new `RELEASEVER_GATE_OK`,
`STORE_GATE_OK`, `DN46_UPDATE_GATE_OK` and `PI_PIN_GATE_OK` **have never executed inside an
actual image build**. They are syntax-checked and source-gated only. The Pi pin was
verified by a local npm install, not by the image's own build step.
