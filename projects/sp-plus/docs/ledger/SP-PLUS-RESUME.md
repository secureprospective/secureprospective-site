# SP+ RESUME — written 2026-09-01 ~11:45 CDT, mid-session, before compaction

## 1. WHAT WE ARE DOING

Cleaning up the SP+ OS and Welcome app ahead of the next ISO. Two things are done
and committed this window (updates, help corpus); one is in flight (Bee's
LibreOffice/MS-Office parity research); the cosmetic list is still to come from
Christopher.

- Repo: `/home/chris/work/secureprospective-advisor-os` (a **worktree**; do not cd
  to the original checkout). Branch `session/sp-plus-plan`. Project dir
  `projects/sp-plus`.
- Changes accumulate for the **next ISO**. **Do not build an ISO unasked.**
- Test rig: QEMU VM `fedora-test` (libvirt session). See §10.

## 2. AGENTS + HARNESSES — ONE DISPATCH IS LIVE RIGHT NOW

**`bee-lo-parity2.service`** (systemd --user), started **2026-09-01 11:30:39 CDT**,
`TMO=7200` so it is killed by its own timeout at **13:30 CDT** at the latest.

- Runner: `~/fleet/bin/run-bee-lo-parity.sh` (written this session, see §10).
  Model gpt-5.6-luna, `THINK=high`, `CONC=3`, `FLOOR=6000`.
- Three briefs, all archived in `~/fleet/briefs/` and live at
  `~/.pi/agent/spplus-brief-lo-parity-{ui,behaviour,keys}.md`:
  - `lo-parity-ui` — make LibreOffice LOOK like MS Office
  - `lo-parity-behaviour` — make it ACT like MS Office
  - `lo-parity-keys` — hotkeys, AND the deployment mechanism question
- **Is it alive?** `systemctl --user is-active bee-lo-parity2`
- **Output lands at** `~/.pi/agent/spplus-lo-parity-<id>.out` (stdout is the
  findings channel; the briefs forbid writing files). Errors in `.err`.
- **Sentinels:** `~/.pi/agent/spplus-lo-parity-<id>.sentinel` per brief, and
  `~/.pi/agent/spplus-ALL.sentinel` when all three finish.
- **A watcher is already waiting on it** — background bash task `beovmqbe3`,
  output at `/tmp/claude-1000/-home-chris/33018ca6-b1dc-4bd0-8aa4-38a969ed6dae/tasks/beovmqbe3.output`.
  It blocks until `spplus-ALL.sentinel` exists, then prints the per-brief
  sentinels AND greps the `.err` files for refused LibreOffice launches. **Do not
  poll Bee; the watcher pings.** If compaction loses the watcher, re-create it
  with the same until-loop rather than polling in the foreground.
- **What to do with the result:** read the three `.out` files, cross-check against
  `~/fleet/runs/PARTIAL-lo-parity-keys-firstrun.md` (28,375 bytes, the keys
  findings from the aborted first run), then *I* do the implementation. Bee
  returns evidence, never a verdict.
- **If it was killed:** the reasoning is not recoverable from a `--no-session`
  pi run. Re-dispatch with the same runner and brief ids; the briefs are
  self-contained.

## 2b. THE FIRST DISPATCH WAS ABORTED — AND WHY IT MATTERS

The first dispatch (`bee-lo-parity`) **launched LibreOffice on the Beelink, on
Christopher's live desktop, while he was using it.** He stopped me: "why are you
opening libraoffice on my computer?" then "nothing runs on this machine -- this is
well established and why we have VM's and the Dell for a reason. -- Do not let it
happen again."

Cause was a line I wrote into my own brief: "Read-only inspection of an SP+ image
or a local LibreOffice is fine." **An inspection permission is an execution
permission.** Saved as memory `never-let-an-agent-touch-the-beelink-desktop.md`.

Three guards now, all in place and all verified:
1. Every brief opens with an ABSOLUTE CONSTRAINT block: nothing runs on the
   Beelink, no GUI app anywhere, execution only via
   `ssh -p 2222 test@127.0.0.1 '<cmd>'`, read-only even there.
2. The dispatch prompt repeats it as overriding the brief.
3. `~/fleet/bin/lo-parity-shims/` goes FIRST on the lane's PATH. `soffice`,
   `libreoffice`, `soffice.bin`, `oosplash`, `lowriter`, `localc`, `loimpress`,
   `lodraw`, `unoconv` all resolve to a stub that refuses and **exits 126**. The
   runner self-tests the shim and **refuses to dispatch** if it is missing or does
   not bite (proved by deleting it: `GUARD MISSING ... refusing to dispatch`).

**Unsetting DISPATCH/WAYLAND_DISPLAY is NOT a guard — tested, LibreOffice starts
fine with no display.** Only an unreachable binary works. Do not "simplify" the
shim away.

## 3. GATES / STATUS

| Gate | Where | State |
|---|---|---|
| `tests/config-preflight.sh` | Beelink | **31 passed, 0 failed** (only ever fails on a dirty tree) |
| `tests/welcome-help-corpus-gate.sh` | **VM** | **PASS — 37 articles opened** |
| `tests/welcome-help-search-gate.sh` | **VM** | **PASS** |
| `tests/cycle36-source-gate.sh` | Beelink | PASS (unchanged this window) |
| `tests/field-inspect.sh` | VM | edited in a previous window, **still not re-run** |

Every gate added this session was mutation-tested and each failed on its own line
before being restored. Details in the commit messages.

## 4. ARTIFACTS THAT EXIST AND WORK

**Commits on `session/sp-plus-plan`:**

| SHA | What |
|---|---|
| `eb5dd9a` | `$releasever` fix + stock Discover store |
| `be4ebcc` | DN-46 update policy: stage daily, apply at shutdown, never reboot |
| `2db728a` | Pi 0.84.3 -> 0.84.4, single `ARG PI_VERSION`, pin gate |
| `cd9abdb` | previous resume doc |
| **`5fdfe0f`** | **DN-47 update permissions + catalogue refresh (this window)** |
| **`ff3fa13`** | **Help corpus: 37 articles generated, gated (this window)** |

**VM `fedora-test`** is booted on **`sha256:21c42ef400934aaaaa90f5d9792612d59d9b6984143c1b305a27f75e462b4793`**,
the DN-47 image, applied through Discover itself. It is a live working test bed.

**Local registry `spplus-reg`** on :5000 (podman container, **must stay up — the VM
pulls from it**): tags `test44 test45 test46 test47 test48 test49 latest`.
`test48` currently serves the DN-47 content; `test49` is the same image.

**Podman images kept:** `localhost:5000/sp-plus-kde:test48`, `:test49` (11.1 GB
each, back the registry), `localhost/sp-plus-kde:spike` (7.38 GB — **cited as
evidence in `docs/HELP-CORPUS-REPORT.md`, do not reap**), and the two `:poc`
images. `test44/45/46` were reaped this window.

**Welcome source synced to the VM** at `~/sp-plus-welcome-src/welcome/` for gate
runs. Re-sync with
`rsync -a -e "ssh -p 2222" --delete welcome/ test@127.0.0.1:~/sp-plus-welcome-src/welcome/`.

## 5. THE CURRENT BUG — one, cosmetic, diagnosed but NOT fixed

Clicking **Refresh** in Discover raises a red dialog: *"Update Issue — There was an
issue during the update or installation process. Please try again later."*
Technical details, verbatim:

```
Failed to download metadata for lvfs: attempted previous download of
https://cdn.fwupd.org/downloads/firmware.xml.zst.jcat from just 213ms ago
```

**Leading hypothesis:** Discover's fwupd backend fires two refresh requests for the
same LVFS remote in one pass and fwupd rejects the duplicate; Discover surfaces
that as its generic error. **Caveat on that hypothesis:** I did not read Discover's
backend source and did not instrument the D-Bus traffic, so "two requests" is
inferred from the 213ms figure, not observed. It is a known upstream nuisance —
same symptom on stock Fedora 43 KDE
(https://discussion.fedoraproject.org/t/fedora-43-kde-plasma-vlfs-failing-on-every-update/180133,
https://bugs.launchpad.net/bugs/1943833).

**Nothing is actually blocked** — `fwupdmgr refresh` handles it gracefully
("Metadata is up to date; use --force to refresh again"). It is a scary dialog on
a healthy machine. **Christopher has been told and has NOT yet ruled on whether to
paper over it.** Do not invent a workaround in SP+'s policy layer without asking.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Manual updating is blocked by polkit/sudo/a KDE kiosk lock."** Partly wrong,
  and the correction is now shipped — see DN-47. There are no masked units, no
  kiosk restrictions; `%wheel NOPASSWD: ALL` is in effect. What WAS blocked was
  narrow and specific: `rpmostree1.finalize-deployment` and `.deploy` returned
  `auth_admin_keep`. Everything else in all three lanes was already `yes` for an
  active local wheel session.
- **"The Flatpak and firmware lanes were blocked too."** No. `flatpak update
  --appstream` failing with `DeployAppstream not allowed for user` was **my SSH
  session**, which polkit correctly treats as neither active nor local. Measured
  with `pkcheck --process <plasmashell pid>`, both lanes were already `yes`.
- **"The Flathub catalogue was empty."** No. `appstreamcli status` reporting
  "Catalog XML: 2" counts FILES, not components. The catalogue holds **4,697
  components, 49 MB**. I misread it; do not go chasing an empty store.
- **"The Discover wrapper was needed to keep PackageKit out."** No. PackageKit is
  not installed at all. The wrapper's only live effect was hiding fwupd.
- **"`rpmostreed OS operation Upgrade not allowed for user` is a product defect."**
  No — launching Discover over SSH. Launch GUI apps from inside the session.
- **"`manifest unknown` for `docker://10.0.2.2:5000/sp-plus-kde`."** My rig only:
  Discover mis-parsed the `:5000` port as a tag. ghcr has no port.
- **"Unsetting DISPLAY stops an agent launching LibreOffice."** No — tested, it
  starts fine headless. See §2b.
- **"The help corpus gate is broken / has a timing bug."** **No — that was my own
  wrong env var.** `SPPLUS_WELCOME_SRC` already includes the `welcome/` segment:
  `APP="${SPPLUS_WELCOME_SRC:-$HOME/sp-plus-welcome-src/welcome}/app/index.html"`.
  Set it to `$HOME/sp-plus-welcome-src/welcome`, not `$HOME/sp-plus-welcome-src`.
  I burned time on this; do not repeat it. (I did also replace the gate's fixed
  sleeps with real readiness polling, which is a genuine improvement, but it was
  not the cause of the failure I was chasing.)
- **"The ledger's '7 categories vs the current hardcoded 6'."** Stale. Welcome
  already had all 7 blurbs at `app.js:676-682`.

## 7. DECISIONS (Christopher's — do not relitigate)

- **Q4 auto-update reboot policy — stage silently, install on shutdown.**
  `bootc-fetch-apply-updates.timer` stays disabled. CLOSED in
  `docs/06-OPEN-QUESTIONS-AND-DECISIONS.md`.
- **How far to open manual updating — Flatpak + image + firmware, seamless.**
  **No rpm-ostree layering**, ever: it permanently marks the deployment
  incompatible and kills `bootc upgrade`.
- **Fix at the RULES level, never per-app.** Verbatim: "So far we have been piece
  mealing it which is exactly the wrong way to do this. The system either updates
  like a normal Linux distro or it doesn't. Look at the permissions/rules level,
  not pecking at the apps like a bird." Memory:
  `fix-at-the-rules-level-not-per-app.md`.
- **Nothing runs on the Beelink.** See §2b.
- **The update work comes before the cosmetics**, and the cosmetics before the
  ISO. His sequencing, stated explicitly.
- **SP+ defaults, not a cage.** The advisor owns the machine; ship defaults they
  can still change.

## 8. LEDGER STATE

Committed and clean: everything above. `git status` is clean apart from this
resume doc.

Also updated this window: `docs/HELP-CORPUS-LEDGER.md` (G1/G2/G3 -> DONE) and
`docs/HELP-CORPUS-REPORT.md` (dated resolution appended, the other lane's findings
left intact rather than rewritten).

**Not committed / not written:** nothing else.

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for the watcher** (task `beovmqbe3`) to report Bee's three sentinels.
   Do not poll.
2. **Read the three `.out` files**, cross-check the keys findings against
   `~/fleet/runs/PARTIAL-lo-parity-keys-firstrun.md`, and check the `.err` files
   for any `REFUSED: launching LibreOffice` line (that would mean the agent tried).
3. **Report the findings to Christopher with a recommendation**, especially the
   deployment mechanism (`/etc/skel` vs a bundled `.xcd` vs `oor:finalized`) —
   today's `/etc/skel` route reaches only NEW accounts, which is a real defect.
4. **Implement the LibreOffice parity settings** with a mutation-tested gate in the
   DN-nn style. I do the work; Bee only researched it.
5. **Ask Christopher for the rest of the cosmetic list.** He has more to hand over.
6. **Decide the fwupd "Update Issue" dialog** (§5) — ask, do not guess.
7. Re-run `tests/field-inspect.sh` on the VM (edited two windows ago, never re-run).
8. **Still outstanding, not ours:** `ghcr.io/secureprospective/sp-plus-kde:latest`
   is OLDER than what the ISO installs, so a production machine shows a
   permanently failing update. `Upgrade target revision ... is chronologically
   older than current revision ... use --allow-downgrade to permit`.
   ISO-44-QUEUE item 2; needs the tag published from the next ISO's image.
9. Cosmetic items I noticed and Christopher has not yet ruled on: Discover renders
   **dark** against the light desktop; the journal carries a Welcome JS error
   `Uncaught TypeError: Cannot read properties of null (reading 'style')`.

## 10. RELAY / ENVIRONMENT NOTES

**Reaching the VM.** libvirt session mode, user networking, **no persistent
hostfwd** — it is added at runtime through the QEMU monitor and **dies whenever
libvirt restarts the VM** (it survives a guest reboot):

```bash
virsh -c qemu:///session qemu-monitor-command fedora-test --hmp \
  'hostfwd_add hostnet0 tcp:127.0.0.1:2222-10.0.2.15:22'
ssh -p 2222 test@127.0.0.1
```

**The VM's host key changes when it is redeployed.** Expect
`REMOTE HOST IDENTIFICATION HAS CHANGED`; clear it with
`ssh-keygen -f ~/.ssh/known_hosts -R '[127.0.0.1]:2222'`.

**Running the Welcome gates on the VM** (they need Qt WebEngine; PySide6 6.11.1 is
present there):

```bash
ssh -p 2222 test@127.0.0.1 'cd ~ && QT_QPA_PLATFORM=offscreen \
  SPPLUS_WELCOME_SRC=$HOME/sp-plus-welcome-src/welcome \
  bash welcome-help-corpus-gate.sh'
```

Note the trailing `/welcome` — see §6.

**Do not use `virsh qemu-agent-command` for admin** — the guest agent is confined
as `virt_qemu_ga_t` and gets Permission denied on `bootc`, `rpm-ostree`,
`systemctl`, even `getenforce`.

**Driving the GUI.** Scripts in the scratchpad: `vmclick.sh <x> <y>` (QEMU absolute
input, screen 2048x1152), `vmshot.sh <name>`, `vmtype.sh "text"`. Screenshots are
displayed at 2000x1125, so **multiply screenshot coordinates by 1.02** before
passing them to `vmclick.sh`. Konsole's D-Bus `runCommand` is guarded — Access
denied.

**Container builds need `--network host`** and, against the local registry,
`--tls-verify=false` with `localhost:5000/...` (not `127.0.0.1:5000`, which podman
insists on HTTPS for). A fast derived image
(`FROM localhost:5000/sp-plus-kde:test48` + a few COPYs) builds in about a minute
and is the right way to test an image change without a 15-minute full build.
**In a finished bootc image `/etc` has moved to `/usr/etc`**, so a derived build's
`test -e /etc/xdg/...` fails where the real build's would pass.

**`node --check` refuses a file without a `.js` extension** — copy the polkit rules
file to `/tmp/x.js` first. This cost a build iteration.

**Housekeeping:** `~/.npm` is new since the filing baseline — a regenerable npm
cache. Safe to delete; re-baseline per the gate's own hint.

## 11. HONEST STATUS

**Genuinely proven by observation, not by reading a diff:**

- DN-47: measured with `pkcheck` against the live plasmashell process, baseline
  `auth_admin_keep` -> `yes`. The DN-47 image was staged and then applied through
  Discover's own "Restart and Install Updates": restart confirmation, **no password
  prompt**, machine came back on `sha256:21c42ef4`. On the new boot, with the
  hand-placed `/etc` copy removed so only the shipped `/usr` one was live, all
  three rpm-ostree verbs read `yes`, four timers enabled, `bootc-fetch-apply-
  updates` still disabled, the flatpak unit pulled `appstream2` from Flathub, and
  **zero units failed**.
- Help: both Welcome gates PASS on the VM, 37 articles opened, search resolves the
  misspellings an anxious advisor actually types.

**Unproven, and it matters:** **none of this has been through a real ISO build.**
`config-preflight` says 31/31 but a build has not run, so `DN47_POLKIT_GATE_OK`,
`DN47B_METADATA_GATE_OK` and the tightened `WELCOME_HELP_OK` **have never executed
inside an actual image build** — they are syntax-checked and source-gated only. The
DN-47 changes were proved on the VM via a *derived* image, which does not exercise
the real Containerfile's gates.

**Bee's research is not back.** Nothing about LibreOffice parity is known yet
beyond the 28 KB partial in `~/fleet/runs/`. Do not report findings that have not
arrived.
