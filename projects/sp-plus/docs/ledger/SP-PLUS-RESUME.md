# SP+ RESUME — 2026-09-01, cosmetic pass before the next ISO

## 1. WHAT WE ARE DOING

Working through Christopher's cosmetic list on SP+ so the next ISO can be
built. Updates (DN-47) and the 37-article help corpus were finished earlier
today; this window delivered LibreOffice/Office parity (DN-48), the Welcome
reorder + pinned Help application (DN-49), retirement of the old
proof-of-concept help PWA, and Brave's start page.

- Repo: `/home/chris/work/secureprospective-advisor-os`, project under
  `projects/sp-plus/`
- Branch: `session/sp-plus-plan`, tree CLEAN at `705578f`
- Test VM: `ssh -p 2222 test@127.0.0.1` (libvirt guest `fedora-test`,
  libreoffice-core-26.2.5.2-1.fc44)
- Local registry the VM pulls from: container `spplus-reg` on
  `localhost:5000` — MUST STAY UP
- **Nothing runs on the Beelink.** Standing, non-negotiable. All execution
  is on the VM or the Dell. The Beelink is only where we dispatch from.

## 2. AGENTS + HARNESSES

- Bee (`pi`, gpt-5.6-luna, high thinking) delivered the LibreOffice research
  and is FINISHED. Unit `bee-lo-parity2.service` is gone. Nothing is
  in flight.
- Findings archived: `~/fleet/runs/lo-parity-{ui,behaviour,keys}-20260901.md`
  (14 KB / 18 KB / 24 KB). Originals still at
  `~/.pi/agent/spplus-lo-parity-*.out`.
- Guard that kept Bee off this desktop: `~/fleet/bin/lo-parity-shims/`
  (PATH shims that refuse to launch LibreOffice, exit 126). It was never
  triggered — all three `.err` files are empty.

## 3. IN-FLIGHT WORK

**NOTHING IS RUNNING.** No dispatches, no builds, no background tasks.
Three things are UP and must stay up:

| Thing | How to check | Why |
|---|---|---|
| `fedora-test` VM | `ssh -p 2222 test@127.0.0.1 'echo ok'` | every gate runs here |
| `spplus-reg` registry | `podman ps \| grep spplus-reg` | the VM pulls images from it |
| image `localhost:5000/sp-plus-kde:test49` | `podman images \| grep test49` | base for all derived gate builds |

## 4. GATES / STATUS

`cd projects/sp-plus && bash tests/config-preflight.sh` → **31 passed, 0
failed, "Safe to build."**

| Gate | State |
|---|---|
| P-15f DN-48 LibreOffice parity (static) | PASS |
| P-16 DN-49 help app, pin, prompts, Brave start page | PASS |
| P-15e help corpus regenerates byte-identical | PASS |
| `tests/libreoffice-parity-gate.sh` (UNO read-back, on VM) | PASS, 58 checks |
| `tests/help-app-gate.sh` (real browser, on VM and in-image) | PASS, 91 checks |
| `tests/welcome-help-corpus-gate.sh` | PASS, 37 articles |
| `tests/welcome-help-search-gate.sh` | PASS |
| `tests/welcome-prompt-pin-probe.py` | PASS, 9 checks |
| `tests/help-search-coverage.mjs` | PASS, all 37 reachable |
| Real ISO build | **NEVER RUN.** Only derived builds so far. |

## 5. ARTIFACTS THAT EXIST AND WORK

Committed, all under `projects/sp-plus/`:

- `config/libreoffice/spplus-office-parity.xcd` — appearance + behaviour
- `config/libreoffice/spplus-office-keys.xcd` — 26 accelerators
- `config/spplus-help.service`, `config/spplus-pin-help`,
  `config/org.secureprospective.spplus.help.desktop`
- `helpapp/server.py` + `helpapp/app/{index.html,app.js,styles.css,
  manifest.webmanifest,sw.js,icon.svg}`
- `welcome/app/help-core.js` — shared search/render/prompt logic, loaded by
  BOTH Welcome and the Help app
- `welcome/app/help-data.json` — 37 articles, 7 categories, 122,756 chars

Base image for derived gate builds: `localhost:5000/sp-plus-kde:test49`.
All derived test images (`dn48check`, `dn49check`, `retirecheck`,
`bravecheck`, `bravemut`) were REAPED after use, as was `:test48`.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **"LibreOffice ships a Microsoft Office keyboard preset."** It does not.
   Bee confirmed against 26.2 source. The third-party maps on GitHub and
   the extension site are unmaintained, unreleased or unlicensed. SP+ owns
   its own map. Do not go looking again.
2. **"`/etc/skel` is how you ship LibreOffice defaults."** It reaches only
   accounts created after the image lands and can never be improved after.
   Replaced by the shared `.xcd` layer. The old file is retired and gated
   against returning.
3. **"ToolbarMode is a node under `org.openoffice.Office.UI`."** It is its
   own component, `oor:package="org.openoffice.Office.UI"`, node path
   `/org.openoffice.Office.UI.ToolbarMode`. Writing it the obvious way
   parses cleanly and addresses nothing.
4. **"Any `.xcd` in the registry dir wins over the defaults."** The
   directory loads in FILENAME order, so `writer.xcd` sorts after
   `spplus-` and reimposed `writer8`. Fixed with explicit `<dependency>`
   elements. Calc and Impress were unaffected, which is why only Writer
   failed and why this was invisible without read-back.
5. **Three `.uno:` names from the research do not exist in 26.2**:
   `SpacePara1_5` (it is `SpacePara15`), `IncreaseIndent` and
   `DecreaseIndent` (they are `IncrementIndent` / `DecrementIndent`).
6. **`config/brave-policies.json` is dead in the live image.** It is copied
   to `/etc/brave/policies/managed/sp-plus.json` and then OVERWRITTEN later
   in the same build by a `RUN` that writes the policy in full. Change the
   policy in the RUN block. The file stays only for the proof-of-concept
   Containerfile at the repo root.
7. **A grep for a symbol matches the comment explaining its removal.**
   Cost two build failures today (`oor:finalized` / bogus command names in
   DN-48; `/api/knowledge/printer` in the retirement). Gates must strip
   comments or match the code form.
8. **`pkill -f <pattern>` matches the SSH command's own cmdline** and kills
   the shell running it (exit 255). Use a bracketed pattern:
   `pkill -f "server[.]py"`.
9. **`node --check` refuses a file without a `.js` extension.** Copy to a
   `.js` path first.

## 7. DECISIONS (Christopher's, do not relitigate)

- **Full Office hotkey map**, displacing LibreOffice defaults where they
  disagree. Ctrl+Q is the single exception: it keeps quitting, because
  rebinding it leaves no keyboard way out.
- **Free Plasma's Ctrl+F1–F4, F7, F9, F10, F12** for Office. Each keeps its
  `Meta+Fn` alternative, so nothing is lost.
- **"Know your way around" goes after "Bring Fin into your work."**
- **Help is a pinned, installable application**, not only a wizard step.
- **Retire the old proof-of-concept PWA**, conditional on a good working
  replacement — which was proven in the same image.
- **Brave opens on the Help app** (`http://127.0.0.1:8766/`).
- **`EmptyStringAsZero` deliberately NOT shipped** (my call, flagged to
  him, not overruled): it is real Excel behaviour but silently changes the
  result of a financial model. Parity stops where it changes arithmetic.

## 8. LEDGER STATE

Committed this window, tree clean:

- `4f47e94` DN-48 LibreOffice parity
- `a0b54f9` DN-48 `.containerignore` fix
- `13ff70e` DN-49 pinned help, reorder, prompts
- `a8cc182` retire the proof-of-concept PWA
- `705578f` Brave opens on Help

Nothing is written-but-uncommitted.

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher for the rest of the cosmetic list.** He said "we have
   more cosmetic fixes that need to be done before we release SP+" and has
   given six so far, all delivered.
2. **Build the ISO only when he says so.** Preflight is green and says
   "Safe to build". The new DN-48/DN-49 gates have run in DERIVED builds
   only; a real build is the first time they run in sequence.
3. **Decide the fwupd "Update Issue" dialog** (still open from the previous
   window). Discover's Refresh raises: `Failed to download metadata for
   lvfs: attempted previous download ... from just 213ms ago`. Cosmetic,
   nothing blocked, known upstream, same on stock Fedora 43 KDE. ASK, do
   not guess.
4. **Re-run `tests/field-inspect.sh` on the VM** — edited several windows
   ago and never re-run.
5. **`ghcr.io/secureprospective/sp-plus-kde:latest` is older than what the
   ISO installs**, so production machines would fail to update. ISO-44-QUEUE
   item 2. Not ours to fix silently; raise it.

## 10. OPEN, RAISED WITH HIM, AWAITING HIS CALL

- **22 of 37 guides carry no suggested Fin prompts.** The panel simply stays
  hidden on those. A gap in the manual, not in the code.
- **Brave may race the Help user service at first login**, showing Brave's
  own connection error until a reload. Chosen deliberately over a silent
  blank page. If he dislikes it, the fix is ordering, not a retry loop.

## 11. RELAY / ENVIRONMENT NOTES

- VM host key changed once after a redeploy. If SSH refuses:
  `ssh-keygen -f ~/.ssh/known_hosts -R '[127.0.0.1]:2222'`
- Qt gates need `QT_QPA_PLATFORM=offscreen`. `libEGL`/`libva`/dbus warnings
  on the VM are noise.
- `SPPLUS_WELCOME_SRC` **must include the trailing `/welcome`**. Getting
  this wrong cost a long false hunt for a nonexistent timing bug.
- Derived builds: `podman build --network host --tls-verify=false`, base
  `localhost:5000/...` (NOT `127.0.0.1:5000`).
- Running the shipped gates inside a built image needs a non-root user:
  `useradd -m adv` then `su adv -c ...`.

## 12. HONEST STATUS

Six cosmetic items are delivered and each was proven by running it, not by
reading the diff: the LibreOffice parity by UNO read-back (58 checks), the
Help app by driving a real browser (91 checks) including from inside a
built image, the pin logic against the VM's real Plasma task-bar config.
Every new gate was mutation-tested and fails on its own line.

**What is genuinely unproven:** none of this has been through a real ISO
build, so the DN-48 and DN-49 gates have never run in sequence in the real
Containerfile — only as derived builds reproducing those blocks. Nothing
has been seen by a human on real hardware. The Dell has not been touched
this window. Brave opening on Help has been verified as POLICY CONTENT read
back out of an image, not as a browser actually launching.
