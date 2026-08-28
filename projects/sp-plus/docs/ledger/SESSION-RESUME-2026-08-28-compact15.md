# SP+ RESUME — compact 15 — 2026-08-28 ~20:20 UTC

## 1. WHAT WE ARE DOING

Turning **SP+ Welcome** from a first-boot onboarding flow into a permanent
**first-class help application**, with **Fin** as the interpretive layer that turns an
advisor's plain language into real technical fixes. Governing goal: eliminate the IT
department above the hardware-and-network line.

- Repo: `/home/chris/work/secureprospective-advisor-os` **on the Beelink** (not CT105).
- Branch: `session/sp-plus-plan`. HEAD `77fb6e8`. Tree was clean at compaction.
- Beelink: `ssh chris@192.168.1.190` (key `/root/.ssh/beelink` for the Bee harness).
- **The repo is NOT on CT105.** Everything is done over SSH to the Beelink.

## 2. AGENTS + HARNESSES

**Christopher's standing order: he is the headbrain; ALL CODING GOES TO BEE.**
Do not write application code directly. Write the brief, dispatch, review the diff.

- `~/run-bee.sh <brief.md> [timeout]` — the dispatch harness. `MODEL` and `THINKING`
  are env overrides (**I added the `MODEL` override this session**; backup at
  `~/run-bee.sh.bak`). Default model `gpt-5.6-luna`.
- Briefs live in `/root/briefs/`. Runs land in `/root/bee-runs/<stamp>_<tag>/{out,err,verdict}`.
- **NEVER run two dispatches concurrently.** Six parallel ones hung and died at timeout
  on 2026-08-23.
- Models verified present on Bee: `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`.
- Context-window table has **no row for sol**. Do not guess one in.

## 3. IN-FLIGHT RIGHT NOW — most perishable

### Bee dispatch: the ask box (LIVE at compaction)

- **Started** 2026-08-28 20:16:21Z, timeout **2400s**, so it expires ~**20:56Z**.
- **Brief:** `/root/briefs/spplus-ask-box.md`
- **Run dir:** `/root/bee-runs/20260828T201621Z_spplus-ask-box/`
- **Alive?** `pgrep -af "run-bee.sh"` on CT105. Note: `pgrep "bin/pi"` on the Beelink
  **matches `pipewire`** and will lie to you. Anchor the pattern.
- **Recovery if killed:**
  `ssh chris@192.168.1.190 "grep -rl 'nrl-spplus-ask-box' ~/.pi/agent/sessions"`
- **CRITICAL:** Bee is editing the repo **directly on the Beelink** and was told **not
  to commit**. So its work appears as an **uncommitted dirty tree**, not as output.
  Check `git status` on the Beelink before assuming nothing happened. `out` carries a
  report plus a unified diff.
- **What to do with the result:** review the diff, verify the four hard gates below,
  then commit. Nothing ships to an ISO until Christopher has seen it.

### VM: `fedora-test` (Id 21) running on the Beelink

Christopher's, believed to be his cycle37 install. **Do not touch.** `spplus-uefi` is
gone entirely (it was transient).

## 4. ARTIFACTS THAT EXIST AND WORK

| Artifact | Path | Detail |
|---|---|---|
| **cycle37 ISO** | `/home/chris/Downloads/SP-PLUS-cycle37.iso` | 5,451,177,984 bytes |
| sha256 | | `373007fb9b36951deba6decd15559e249b1866b80a3ed1f6ff0d90136d53e385` |
| Build log | `~/sp-plus-build-cycle37-20260828T200143Z.log` | on the Beelink |
| Panel review | `projects/sp-plus/docs/ledger/reviews/DN-31-panel-gpt-5.6-sol.md` | 28,996 bytes, committed |
| Published page | https://claude.ai/code/artifact/7813970c-f724-4a8f-aa39-6f46276ba3d1 | "Fin On A Tuesday" |
| Page source | scratchpad `fin-on-a-tuesday.html` | republish same path to update |

Christopher's cycle34/35/36 ISOs are also in `~/Downloads`. **Do not delete them.**

## 5. GATES / STATUS

| Gate | State |
|---|---|
| `tests/preflight-gate.sh` | 10/10 |
| `tests/config-preflight.sh` | 13/13 "Safe to build" |
| `tests/fin-extension-gate.mjs` | **49/49**, run with `SPPLUS_EXT_DIR=$PWD/config/fin-extensions` |
| cycle37 build gates | all passed; `FIN_GUARDRAILS_OK`, `FLATPAK_PREINSTALL_OK`, `WELCOME_EGRESS_OK no ask box` |
| Runtime guardrail field test | **DOES NOT EXIST** — the dispatch hung and was killed |
| Release gate on installed cycle37 | **not run** |

**Reading build logs:** the log echoes the Containerfile source, so a naive grep matches
BOTH branches of every `if/else` and looks like everything passed twice. Grep for
**line-start** matches only: `grep -E "^(FIN_GUARDRAILS_OK|WELCOME_EGRESS_OK|...)"`.

## 6. THE CURRENT BUG

None blocking. Two failures happened and both are resolved:

1. **cycle37 build died** at the Fin step. `857b172` renamed
   `spplus-protected-paths.ts` → `spplus-workspace.ts` by sed on the full filename, but
   one Containerfile assertion greps the **bare name without `.ts`**, so it survived and
   asserted a deleted file. Fixed in `77fb6e8`. **Lesson: after any rename, grep the bare
   stem, not just the filename.**
2. **Bee field-test dispatch hung.** 21 minutes on a job that should take two, zero
   bytes, and **no session transcript was ever created** so nothing was recoverable.
   Killed. Brief still at `/root/briefs/spplus-guardrail-fieldtest.md` — **rewrite it
   smaller before retrying.** Caveat: cause unknown. High thinking worked fine for the
   28KB panel review and the page build, so "high thinking hangs" is NOT established.

## 7. REFUTED / SETTLED — DO NOT RETEST

- **`bootc rollback` does NOT restore `/var` or `/home`.** VERIFIED on the live guest:
  the stateroot holds `deploy/`, `var/`, `backing/`, and **`var` is a SIBLING of
  `deploy/`**, so rollback never touches it. `/home` is a symlink to `/var/home`.
  Independently confirmed by gpt-5.6-sol from bootc/ostree docs. **`/etc` IS
  per-deployment and IS restored.** Root mounts `composefs ... ro`.
- **Welcome's "NO DATA SENT" claim is TRUE today.** Verified: the only fetch in the
  payload is the local `help-data.json`, there are no remote `src`/`href` in
  `index.html`, and `welcome.py` sets `LocalContentCanAccessRemoteUrls` **False**.
  It becomes false only when the ask box ships. **No pre-ISO fix was needed.**
  Earlier in-session I told Christopher it "might already be false" — that was wrong
  and has been corrected to him.
- **Fin already holds unprompted root.** `sudoers-sp-plus` ships
  `%wheel ALL=(ALL) NOPASSWD: ALL` and Fin runs as the advisor. This is EXISTING state,
  not a new grant. No work was ever required to enable it.
- **Fin is Pi, branded.** `config/fin` execs `/usr/bin/pi` with
  `--append-system-prompt --skill --prompt-template --approve`, plus (now) two
  `--extension` flags. Pi 0.84.3 ships in the image; `node` is present.

## 8. DECISIONS — Christopher's rulings, do not relitigate

1. **Fin loses root.** It runs as its own unprivileged identity with no sudo. His
   reason is **attribution, not containment**: Fin ran AS the advisor, so every Fin
   action was logged as the advisor's, meaning there was no paper trail at all.
2. **Privileged work goes behind a typed broker** exposing named operations, never
   `execute(command)`. Its call record IS the paper trail.
3. **The advisor KEEPS their own passwordless admin.** (My stated assumption, not
   contradicted. Fin was the ambiguous actor, not the human.)
4. **Fin is cloud-first**, local inference only if hardware cost allows.
5. **Read boundary:** system files/configs/logs free; document NAMES free; document
   CONTENTS per-file consent; **mail store protected, per-item consent always.**
   Fin must stay useful for chat, marketing, admin, brainstorming and one-off apps.
6. **All Fin writes confined to `~/Documents/Fin`.** Implemented.
7. **Light mode only. Never dark mode.** Applies to our first-party UI.
8. **Accept the light-app / dark-desktop mismatch deliberately.** Do not reinvent the
   wheel; focus on function and safety.
9. **No offline fallback required** — a network outage is past the hardware/network line.
10. **The liability-transfer premise is WITHDRAWN** (panel finding, he accepted it).
    Under Reg S-P the operator's click is not the consumer's consent. Needs a real
    compliance opinion, not a model review.

## 9. LEDGER STATE — all committed, tree clean at `77fb6e8`

`aac2690` DN-31 draft · `4c8855b` rollback verified on guest · `f2b5507` guardrail
extensions · `f9c305b` DN-31 amendment 1 · `bdcc11d` egress-truth build gate ·
`857b172` write confinement · `77fb6e8` rename fix.

`DN-31-fin-help-layer.md` (17,819 bytes) carries **AMENDMENT 1** at the foot, which
SUPERSEDES its own decisions 5 and 7 and the liability premise.

## 10. NEXT ACTIONS, IN ORDER

1. **Check the Bee ask-box dispatch** (§3). Read `out`, then `git status` on the
   Beelink for its uncommitted edits.
2. **Verify Bee's work against the four hard gates** before committing: one viewport at
   1366x768 with `scrollHeight === clientHeight`; **no em-dashes under `welcome/app/`**
   (the build greps U+2014); light mode only; `py_compile welcome.py` and
   `bash -n config/fin`.
3. **Confirm the header claim changed.** Adding `id="ask-fin"` trips the gate in
   `bdcc11d`, which FAILS THE BUILD while "NO DATA SENT" remains. Both or neither.
4. **Rewrite the guardrail field test brief smaller** and re-dispatch to Bee.
5. **Ask Christopher for the cycle37 install result** — Print Screen with no prompt,
   cursor surviving first login, `~/Documents/Fin` present, SELinux Enforcing, and
   whether it booted graphically.
6. Run the release gate against the installed cycle37.
7. Design the **broker operation list** from the seventeen help articles. That list is
   the product: every entry is a repair Fin can do, every omission is a phone call.

## 11. HONEST STATUS

- **The Welcome app has NOT changed since cycle36.** No file under `welcome/` differs.
  cycle37 carries defect fixes, Zoom and the Fin guardrails — **not** a new help
  experience. Do not let anyone believe otherwise.
- **Nothing from DN-31 is built.** No ask box, no broker, no identity split. It is all
  decisions plus two guardrail extensions.
- The guardrail extensions have **never run inside a real Fin session on an installed
  machine**. 49/49 is against their handlers on the Beelink only.
- The extensions are a **floor, not a boundary**. Fin still has root, so they stop
  accidents, not a hijacked model. Real enforcement arrives with the identity split.
- **Largest unhandled risk: indirect prompt injection.** A crafted email or document
  can carry instructions aimed at Fin. Unaddressed.
- cycle37 has been installed by Christopher but **no result has been reported**.
