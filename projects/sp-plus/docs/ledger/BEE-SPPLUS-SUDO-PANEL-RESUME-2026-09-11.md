# Bee — SPPLUS-SUDO-PANEL compact-safe resume

Captured 2026-09-11 on Beelink (`com`, 192.168.1.190). This is a continuation checkpoint, not session close. Read this first after Christopher says “we are back.”

## 1. WHAT WE ARE DOING

Christopher asked for a security design review of `~/Downloads/SPPLUS-SUDO-PANEL-BRIEF.md`, then required a second pass on any claim below 95% confidence. Bee completed both passes and wrote a standalone, corrected, fully sourced findings document in `~/fleet/inbox/` for Christopher to give to Claude; the current task is preserving that work across compaction, not implementing the proposal.

### Repositories and lanes

- Bee configuration repository: `/home/chris/.pi`, branch `main`, **local only; no remote**.
- Primary SP+ worktree, owned by another active session: `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-defense-in-depth`, observed HEAD `19b0d47` (`ledger(sp-plus): compact-safe resume, Bee panel refuted the PAM design`). It was clean when inspected. **Do not change or publish that session's unpublished history.** Its `.project.yaml` has stale branch information; actual git state is authoritative.
- Dedicated Bee documentation worktree created for this checkpoint: `/home/chris/work/sp-plus/bee/sudo-panel-handoff`.
- Dedicated branch: `bee/spplus-sudo-review-20260911`.
- Remote: `https://github.com/secureprospective/secureprospective-site.git`.
- Documentation branch base: fetched `origin/main`, commit `56b9e5a`. This isolates our two new documentation files from the other session's unpushed SP+ history. It does **not** contain the entire current SP+ implementation.
- Project copies live under `projects/sp-plus/docs/ledger/` in the dedicated worktree. That directory did not exist on the fetched main baseline; creating it is deliberate. No production code is changed and nothing is merged into main.
- Fetch and explicit `git pull --ff-only origin main` succeeded before writing project files; the inherited HANDOFF was read, not rewritten. Do not overwrite another agent's HANDOFF during this documentation-only compaction.

### Fleet access

- ClaudeBox: CT105, `192.168.1.105`, head brain. No SSH session or remote task was started by this review.
- Hermes: `192.168.1.222`; not used.
- Bird: `192.168.1.195`; not used.
- Test VM convention supplied by compact-safe: `ssh -p 2222 test@127.0.0.1`. **Not connected to or verified in this session.** Do not assume the already-running VM is ours or that this endpoint is available.

## 2. AGENTS + HARNESSES / IN-FLIGHT WORK

### This task

- No subagents, dispatches, builds, servers, test VMs, graphical applications, or background shell jobs were started.
- Research used `web_search`, `fetch_content`, `get_search_content`, and read-only source examination. Search workflow was `none`; no curator/browser was intentionally opened.
- Research tool calls had completed before checkpointing. Tool-managed caches under `.pi` are pre-existing/unowned working state; do not bulk stage or delete them.
- No `.out/.err/.sentinel` triple exists for this review because there was no dispatch. No BEE_TIMEOUT, PROMOTED, or REJECTED state applies.

### Current parent conversation transcript

- Session ID: `01a0910a-835a-7230-8282-0bac4d9b7435`.
- Started: `2026-09-11T15:16:20.447Z`.
- Transcript: `/home/chris/.pi/agent/sessions/--home-chris--/2026-09-11T15-16-20-447Z_01a0910a-835a-7230-8282-0bac4d9b7435.jsonl`.
- Check: `stat -c '%y %s %n' /home/chris/.pi/agent/sessions/--home-chris--/2026-09-11T15-16-20-447Z_01a0910a-835a-7230-8282-0bac4d9b7435.jsonl`.
- The parent transcript is live/dynamic; no fixed digest is asserted. The authored findings/resume, not search-response IDs, are the durable authority.

### Other work observed — do not reap or adopt

A process-name inventory found an existing `qemu-system-x86` PID `3558219`, PPID 1, started 2026-09-11 08:41:25 local, plus other Claude/Pi sessions and libvirt processes. None was launched by this review; ownership/workflow was not established and all were left untouched.

- Recheck the observed VM process identity only with `ps -p 3558219 -o pid,ppid,lstart,comm` (PID may later be reused; compare start time).
- Do not kill, attach to, reconfigure, or assume responsibility for it.
- Other project session documents already exist, including `projects/sp-plus/docs/ledger/RESUME-2026-09-11-compact-sudo-signing.md` in the primary SP+ worktree. They belong to other work and were not rewritten.

Reaping result: **0 processes killed, 0 bytes reclaimed; no task-owned orphan or replayable build artifact existed.**

## 3. GATES / STATUS

| Gate | Status | Evidence/qualification |
|---|---|---|
| Original four-question review | COMPLETE | Consolidated findings document |
| Recheck below-95% claims | COMPLETE as source review | Pinned implementations, corrections, explicit confidence register |
| Actual SP+ exploitation/behavior | NOT TESTED | No image identifier, deployed policy, or approval implementation inspected |
| Final inbox report | VERIFIED | 49,553 bytes; SHA256 below; all four answers and 24 source groups present |
| Home filing | PASS | Official `~/.reorg/tools/check-filing.sh`, exit 0; 23 visible entries matches current target 23 |
| Host graphical/testing restrictions | OBSERVED | No graphical program, synthetic input, root test, or VM test launched |
| Orphan cleanup | CLEAR for this task | No jobs started; unrelated VM/agents preserved |
| Three resume copies | Required checkpoint verification | Paths below; verify hashes and committed blobs, not just command exits |
| Config commit | Required checkpoint verification | Commit only named new files; preserve pre-existing dirty tree |
| Project persistence | Dedicated docs branch | Push only `bee/spplus-sudo-review-20260911`; never main/other session branch |
| Full replacement control compatibility | UNPROVEN | Recommendations are not validated day-one outcomes |

The last rows describing commit verification are intentionally resolvable through git after writing this document; do not invent commit hashes before the commits exist.

## 4. ARTIFACTS THAT EXIST AND WORK

### A. Authoritative complete findings delivered locally

- `/home/chris/fleet/inbox/bee-spplus-sudo-panel-findings-2026-09-11.md`
- **49,553 bytes; 657 lines; 6,598 whitespace-separated words.**
- SHA256: `947e3c210025ee2666642d5163f2feed66abda7fae06de3468049409b8913482`
- Includes complete answers, source/version scope, every material correction, conditional attack paths, confidence register, test matrix, and 24 grouped primary references.
- This document supersedes the two earlier chat answers. Do not reconstruct a shorter or less qualified review from memory.

Byte-identical committed preservation copies planned/created by this checkpoint:

- `/home/chris/.pi/agent/research/spplus-sudo-panel/findings-2026-09-11.md`
- `/home/chris/work/sp-plus/bee/sudo-panel-handoff/projects/sp-plus/docs/ledger/bee-spplus-sudo-panel-findings-2026-09-11.md`

The report itself records the delivery state at authoring (local inbox, no remote delivery then). The later documentation-branch push is a checkpoint preservation step recorded here; it is not evidence that Claude has read or approved the report.

### B. Input brief

- `/home/chris/Downloads/SPPLUS-SUDO-PANEL-BRIEF.md`
- **10,816 bytes.**
- SHA256: `c5afcf74a34e931e90e522cdde5b8a5f69029acd16d046dc9fc82620628e1972`
- Preservation copy: `/home/chris/.pi/agent/research/spplus-sudo-panel/input-brief.md` (same bytes).

### C. Three identical resume copies

1. Working: `/home/chris/.pi/agent/SPPLUS-SUDO-PANEL-RESUME.md`
2. Canonical Bee resume: `/home/chris/.pi/RESUME-SPPLUS-SUDO-PANEL.md`
3. Project: `/home/chris/work/sp-plus/bee/sudo-panel-handoff/projects/sp-plus/docs/ledger/BEE-SPPLUS-SUDO-PANEL-RESUME-2026-09-11.md`

Check sizes/digests after writing with `wc -c` / `sha256sum`; self-referential resume hashes are intentionally not embedded here.

There is **no SP+ image digest or tested ISO artifact from this review**. Do not substitute an unrelated session's build as if it were tested here.

## 5. THE CURRENT BUG / DESIGN DEFECT

No running feature was debugged. The supplied proposal is to preserve `%wheel ALL=(ALL) NOPASSWD: ALL` and insert a confirmation helper into sudo's PAM **auth** stack, silently allowing diagnostics and requiring a physical click for alterations.

Verified upstream implementation blockers:

1. With sudo 1.9.17p2/sudoers, `NOPASSWD` disables authentication and skips `pam_authenticate`; account/session processing is distinct. An auth-only hook does not enforce the proposal.
2. A normal Wayland dialog supplies no adequate physical-input guarantee against unrestricted host processes. Relevant mechanisms include KWin fake input, KDE portal preauthorization, and modern XWayland's XTEST/libei bridge.
3. Sudo approval plugins are an alternative integration point, but **`open() == 0` disables the plugin rather than denying the command** in 1.9.17p2. In contrast, `check() == 0` denies; `open() == -1` is fatal initialization error.

**Caveat:** Those are pinned upstream source findings, not reproduced exploits on SP+. Exact packages, downstream policy, confinement, and the approval UI have not been supplied/tested. “≥95% confidence” applies to narrowly scoped source behavior, not an invented exploit-success probability.

Research fetch errors that were resolved, not product bugs:

- Initial sudo raw-source tag `SUDO_1_9_17p2` returned `HTTP 404: Not Found`; correct tag is `v1.9.17p2`.
- Correct KWin EIS location is `src/plugins/eis/`, not `src/backends/eis/`.
- Correct xdg-desktop-portal permission-store source is `document-portal/xdg-permission-store.c`.
- XWayland 24.1.0 source was retrieved from freedesktop GitLab; the guessed GitHub mirror tag failed.
- Documentation worktree baseline lacks `projects/sp-plus/docs/ledger`; initial `ls` returned “No such file or directory.” This is expected for the remote main baseline; create the path for our new docs, do not change branch to another agent's unpublished lane.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST AS OPEN QUESTIONS

These were settled by source review, **not host/VM exploitation**. Actual SP+ regression tests remain legitimate after target evidence is supplied.

- **“NOPASSWD still runs PAM auth so an auth helper can enforce it.”** Refuted for inspected upstream sudoers control flow. Trace `lookup.c` → `check.c` → PAM verify function. Account/session callbacks are separate.
- **“PAM is the only possible integration point.”** Refuted by sudo's approval-plugin API and dedicated privileged-service designs. A replacement design still requires engineering.
- **“Any approval callback returning zero safely denies.”** Refuted: `open()` zero disables; `check()` zero rejects. Preserve this distinction in every implementation discussion.
- **“A native Wayland dialog is immune to input originating from XWayland.”** Refuted as a general statement by XTEST → libei → compositor integration. First answer was incomplete; consolidated report is corrected.
- **“KWin desktop-interface declarations form a root-controlled allowlist.”** Refuted under normal inspected KService/Qt application lookup, which includes user application metadata. Actual downstream policy remains unknown.
- **“Portal attacks require an already authorized remote-control session.”** Too narrow. Source shows user-session permission setting plus KDE's preauthorization skip-dialog branch.
- **“A read-only program name implies safe diagnostics.”** Refuted as a general authorization model: options, pagers, interpreters, helpers, config, paths, secrets, and mutable dependencies matter.
- **“bootc rollback restores every security-relevant/customer state.”** Refuted by mutable/shared state semantics. `/etc` has distinct deployment/merge behavior; do not falsely claim it is shared identically to `/var`.
- **“Screen lock closes the unlocked LUKS mapping.”** False for ordinary desktop locking. No special key-eviction workflow was supplied.
- **“Same UID alone proves ptrace, host sudo, and all desktop access.”** Overbroad. MAC, Yama, dumpability, namespaces, `no_new_privs`, and bus restrictions may intervene.

Not refuted or confirmed for SP+, and **must remain conditional**:

- AT-SPI access to the actual approval control. Standard Qt action-to-button activation is source-verified; actual exposure is unknown.
- Process injection, agent replacement, forged approval IPC, clickjacking/covering, approval races.
- Reachability of KWin's direct `org.kde.KWin.EIS.RemoteDesktop.connectToEIS` on the shipped system. The exported handler has no in-handler authorization check in 6.5.0, but surrounding policy and packaging need inspection.
- Full compatibility/recovery coverage and reduced click fatigue from a broker/transaction redesign.

## 7. DECISIONS / OPERATOR RULINGS

No new D-numbers were assigned in this conversation. Preserve the actual instructions without inventing numbered project decisions:

1. Give best-effort judgment on the supplied brief, not code.
2. Recheck every claim below 95% confidence; separate established behavior from unverified SP+ applicability.
3. Be explicit and write complete findings in the existing `~/fleet/inbox/` for Christopher to give Claude; report the exact location/name.
4. Execute compact-safe now, not session-close.

Constraints from the brief remain in force: no memorized-password requirement, no production VM compartmentalization, no browser replacement/packaging change, no CI discussion as a substitute, no day-one functionality breakage. These are design constraints, not proof of any product claim.

Do not silently implement a sudo/PAM/portal change, start GUI programs, or run input-injection tests on the daily-driver host. Do not send email, force-push, skip hooks, or edit another agent's files.

## 8. LEDGER STATE

Before this checkpoint:

- The input brief and inbox report were outside git. They remain at their original paths and must not be moved.
- `/home/chris/.pi` had extensive pre-existing modified/untracked state, including HANDOFF, SYSTEM, memory, settings, dispatch artifacts, and research caches. **None is ours to stage, rewrite, clean, or delete.** The index was empty when inspected.
- Config HEAD observed before writing: `ec21c62` (`resume: refresh SecureProspective social ads`).
- Primary SP+ worktree HEAD observed: `19b0d47`; no remote branch of that name was advertised by `git ls-remote`. Do not publish its history on our authority.

Checkpoint commits should contain only:

**Bee config (`main`, local-only):**

- `agent/SPPLUS-SUDO-PANEL-RESUME.md`
- `RESUME-SPPLUS-SUDO-PANEL.md`
- `agent/research/spplus-sudo-panel/findings-2026-09-11.md`
- `agent/research/spplus-sudo-panel/input-brief.md`

**Dedicated project documentation branch:**

- `projects/sp-plus/docs/ledger/BEE-SPPLUS-SUDO-PANEL-RESUME-2026-09-11.md`
- `projects/sp-plus/docs/ledger/bee-spplus-sudo-panel-findings-2026-09-11.md`

Commit message: `docs: preserve Bee SP+ sudo review across compaction` (or equivalent scoped message). Commit IDs are discoverable with the exact file history commands below; do not amend merely to embed self-referential hashes.

No moves occurred, so there is no MOVED.md row to add. The dedicated worktree is new, not relocated. No unrelated HANDOFF was rewritten. This is a continuation checkpoint, not the end-work handoff protocol.

Verification commands:

```bash
git -C /home/chris/.pi log -1 --oneline -- RESUME-SPPLUS-SUDO-PANEL.md
git -C /home/chris/work/sp-plus/bee/sudo-panel-handoff log -1 --oneline
git -C /home/chris/work/sp-plus/bee/sudo-panel-handoff status --short
git -C /home/chris/work/sp-plus/bee/sudo-panel-handoff ls-remote --heads origin refs/heads/bee/spplus-sudo-review-20260911
```

A deliberately dirty config tree can coexist with a correctly committed resume; verify the named committed blobs rather than declaring the entire tree clean.

## 9. NEXT ACTIONS, IN ORDER

1. **Read** `/home/chris/.pi/RESUME-SPPLUS-SUDO-PANEL.md` and the complete inbox findings, not the older chat versions.
2. **Verify** the findings SHA256, equality of the three resume copies, the scoped config commit, and the documentation branch's remote commit. Recover from committed copies if an external file was lost; do not overwrite changed files without checking ownership.
3. **Confirm** no task-owned background work exists. Leave the unrelated VM and agent sessions alone. Compaction should orphan nothing from this review.
4. **Continue** from the completed review/handoff state: the artifact is ready for Claude. Do not re-research the established upstream facts or automatically start an implementation project.
5. **Use** any new operator/Claude feedback to identify a concrete follow-up. If asked to verify SP+ exploitability, first obtain the exact image/deployment identifier, packaged policies/versions, and an isolated authorized test instance. Then start with a harmless native Wayland fake-input test, followed by the other paths in the report. A failed single bypass does not prove a boundary.

If no new follow-up has been supplied, report that the checkpoint is restored and the review is ready; do not ask a generic “what were we doing?” or invent extra work.

## 10. RELAY / ENVIRONMENT NOTES

- The definitive filing contract is `/home/chris/INDEX.yaml`; the official gate is `/home/chris/.reorg/tools/check-filing.sh`. It passed during compact-safe. Do not replace it with a partial `find` test.
- The existing inbox is `/home/chris/fleet/inbox`; no new `flee` directory was created.
- Full report and source links are durable. Tool cache response IDs need not survive compaction to reconstruct the review.
- Pinned source versions: sudo 1.9.17p2; KWin/KDE portal 6.5.0; KService 6.18.0; Qt 6.9.2; xdg-desktop-portal 1.20.3; Flatpak 1.16.1; XWayland 24.1.0. These are not asserted SP+ deployment versions.
- No operator-run command batch is required. Do not overwrite `~/Downloads/paste.md` with unsolicited tests; if a future batch is requested, use plain commands/comments with target-machine header, no secrets.
- Do not merge the documentation branch or change another worktree's branch as part of resuming.
- The project branch's initially auto-configured upstream was `origin/main` because it was created from that ref. The checkpoint push should use explicit `HEAD:refs/heads/bee/spplus-sudo-review-20260911` and set upstream to that dedicated remote branch, never accidentally push to main.

## 11. HONEST STATUS

**OBSERVED:** Complete 49,553-byte standalone report written and checked; all four answers, corrections, confidence register, and 24 source groups present. Pinned upstream code supports the central concerns. No product code/configuration or live desktop input was changed. Filing passed. No task-owned jobs need recovery. A dedicated clean documentation worktree was created to avoid another session's unpublished history.

**INFERRED / CONDITIONAL:** Exact exploitability on SP+; approval UI exposure; process/bus confinement; a complete trusted path; broker/recovery compatibility and usability. These remain unproven. No confidence percentage converts a source review into an end-to-end test.

**ETA:** Review/handoff deliverable is complete. Checkpoint durability requires successful scoped commits, project push, and final blob/hash verification. SP+-specific testing has no honest ETA until the target and scope are supplied.
