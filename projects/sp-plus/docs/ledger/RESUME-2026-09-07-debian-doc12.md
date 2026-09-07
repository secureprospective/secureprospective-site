# RESUME — SP+ Debian installer and support plan (doc 12)

**Written:** 2026-09-07, mid-session, before a context compaction. The session CONTINUES.
**Head brain:** ClaudeBox CT105. **Work host:** Beelink 192.168.1.190.

## 1. What we are doing

Executing the SP+ Debian plan: turning doc 11's direction into doc 12, a buildable plan for the
Debian live installer and the support infrastructure that path needs. **Documents only this
session — no code, no packages, no ISO.** That part is DONE, committed and pushed.

The live task now is Christopher's next ask: **doc 13, a standards-and-gates system for editing
and recompiling base ISOs.** Nothing of doc 13 is written yet.

- Repo: `~/work/secureprospective-advisor-os` on the Beelink.
- Branch: `session/sp-plus-debian-plan`, pushed, tracking `origin`. **Not merged. Do not merge.**
- SSH: `ssh -i /root/.ssh/beelink chris@192.168.1.190`.
- Remote is `github.com/secureprospective/secureprospective-site.git` (yes, the site repo — that
  is where this project lives; not a mistake).

## 2. Agents and harnesses

- Bee = Luna `gpt-5.6-luna`, dispatched with `~/fleet/bin/fleet-dispatch.sh bee <brief.md>`.
  It pins `--provider openai-codex --thinking max --no-session`. Do NOT write new
  `run-bee-<topic>.sh` scripts; the generic runner replaced them.
- Briefs live in `beelink:~/fleet/briefs/`. Output triple lands in `beelink:~/.pi/agent/` as
  `bee-<briefname>.{out,err,sentinel}` — note the doubled `bee-bee-` prefix when the brief name
  already starts with `bee-`.
- `pi -p` buffers stdout until exit. A 0-byte `.out` mid-run is normal, NOT a hang.
- Authoring scratch on CT105: `/root/fleet-briefs/`.

## 3. In-flight work

**NONE.** Both Bee dispatches completed and were verified PROMOTED. Nothing is running on either
machine. Nothing will be orphaned by compaction.

| Dispatch | Verdict | Output |
|---|---|---|
| `bee-spplus-doc12-2026-09-07.md` (first draft) | EXIT=0 PROMOTED, 46411 bytes | `beelink:~/.pi/agent/bee-bee-spplus-doc12-2026-09-07.out`; copy at CT105 `/root/fleet-briefs/doc12-draft.md` |
| `bee-spplus-doc12-prose-2026-09-07.md` (prose pass) | EXIT=0 PROMOTED, 38939 bytes | `beelink:~/.pi/agent/bee-bee-spplus-doc12-prose-2026-09-07.out`; copy at CT105 `/root/fleet-briefs/doc12-body.md` |

## 4. Gates and status

| Gate | Result |
|---|---|
| `git diff --cached --check` whitespace | PASS |
| Doc 12 §0: 14 fact rows, 0 `TODO` placeholders, every row sourced | PASS |
| Cross-reference vs doc 11 (grub-btrfs, snapshot boot, backports, Brave, Wayland) | PASS — every doc 12 mention is a negation |
| No duplicate D or Q identifiers in doc 06 | PASS |
| Every README `docs/*.md` link resolves | PASS |
| Prose pass integrity: 134 table rows before and after, headings byte-identical | PASS |
| Beelink filing gate `~/.reorg/tools/check-filing.sh` | PASS, exit 0, 23/23 entries |
| Christopher has read and approved doc 12 | **NOT DONE — this is the blocking gate** |
| D32 expert-AI panel | NOT RUN, deliberately deferred until after he reads doc 12 |

## 5. Artifacts that exist and work

Commit `HEAD` on `session/sp-plus-debian-plan`, 5 files, +718/-10:

- `projects/sp-plus/docs/12-DEBIAN-LIVE-INSTALLER-AND-SUPPORT-PLAN.md` — NEW, 657 lines
- `projects/sp-plus/docs/06-OPEN-QUESTIONS-AND-DECISIONS.md` — D32-D37, Q16-Q19, change-log row
- `projects/sp-plus/docs/11-PLATFORM-DIRECTION-AND-DEBIAN-ARCHITECTURE.md` — 3 lines changed
- `projects/sp-plus/README.md` — rows 9-12 added, row 6 range corrected to D1-D37 / Q1-Q19
- `HANDOFF.md` — rewritten

Verify with: `git -C ~/work/secureprospective-advisor-os show --stat HEAD`

## 6. Facts verified this session — do not re-verify before Phase 0

Checked live against `sources.debian.org` on 2026-09-07:

- calamares **3.3.14-1** (trixie); live-build **1:20250505+deb13u1**; timeshift **24.06.6-2**;
  cinnamon **6.4.10** (6.4.10-2+deb13u1 staged in trixie-proposed-updates);
  nodejs **20.19.2+dfsg-1+deb13u2**.
- **grub-btrfs returns HTTP 404** — it is in NO Debian suite. This is what makes D33 a matter of
  fact rather than preference.
- **Node 22 is in neither trixie nor trixie-backports** — only sid and forky carry 22/24. This is
  what makes D34's vendoring the only honest route to Fin on Debian.
- The repo holds **no `.github/`** — `git ls-files | grep '^\.github/'` returns nothing. Ground
  for D35 and for deferring CI to Phase E.

## 7. Mistakes made this session — do not repeat

1. **My first Bee brief omitted the external fact base.** I sliced lines 36-101 out of the prior
   plan, but the verified fact table was at lines 13-18. Bee had no facts, so it reconstructed §0
   from doc 11 self-references with every URL as `TODO`. It flagged this honestly rather than
   inventing links. **Lesson: when a brief says "the table above", check that the table is in it.**
2. **A malformed heredoc committed while the tool reported failure.** `git commit -F -` with a
   heredoc containing an apostrophe: bash choked partway, but git had already read enough from
   stdin and committed with a message truncated mid-sentence. The tool call showed exit 2. Caught
   only by inspecting `git log`, not the exit code. Fixed with `--amend`.
3. **`ssh host 'python3 - <<PY ... PY'` breaks on any apostrophe** in the payload — the outer
   single quotes end early. Cost two failures. **Always write the script to a file, `scp` it,
   then run it.** That is now the standing pattern; both doc 06 and README edits used it.
4. **A verification grep of mine was case-sensitive** and reported 2 fact rows as unsourced when
   they were sourced as "Recorded" not "recorded". The gate under-reported. Same family as
   `LC_ALL=C` byte-grep silently matching nothing.

## 8. Decisions recorded this session (doc 06)

D32 stock Calamares 3.3 + `calamares-settings-spplus`, no installer code (durable → panel gate).
D33 no grub-btrfs, no snapshot boot menu; recovery is Timeshift restore.
D34 `sp-plus-fin` vendors pinned Node 22 + pinned pi, SHASUMS-verified, no npm on the machine.
D35 Beelink builds, R2 hosts, CI deferred to Phase E (tension with D20 recorded, not hidden).
D36 managed update is fail-closed; snapshot verification precedes any APT transaction.
D37 trust roots are Debian + SP+ only, enforced by APT pinning; backports per-package only.
Q16 dracut vs initramfs-tools · Q17 Firefox ESR vs Brave · Q18 Timeshift restore UX · Q19 R2 as
APT origin.

## 9. Ledger state

Everything is committed AND pushed. Nothing is written-but-uncommitted except this resume
document, which is being committed as part of this step.

## 10. Next actions, in order

1. **Wait for Christopher to read doc 12.** It is the blocking gate. Do not start Phase 0.
2. **Draft doc 13 — the ISO standards-and-gates system.** He asked for this explicitly. Framing,
   in his words: not rigorous gates that hinder forward movement, but a system that learns what
   is correct in order to shape more correctness during rebuild. The definition of done is
   *correct*, not an AI declaring done. Design spine already agreed in-session:
   - Every gate is a predicate over the **artifact**, never over an exit code or a log.
   - A gate is born from a real defect; the incident is attached to it as provenance.
   - Doc 05's 48 anti-patterns are the seed corpus — written as a postmortem, never made executable.
   - Gates carry a cost tier: cheap ones every rebuild, expensive ones at phase boundaries.
   - Doc 12 §5.7 is already the thesis in one line: *a phase is complete only when its listed
     gate has evidence.*
   - Evidence from this session to build on: the exit-code lie (§7.2 above), the case-sensitive
     gate (§7.4), and the fleet's own `lesson_gates_prove_not_empty_not_good` — all ten SP+
     shorts passed every gate and seven were rejected on sight.
   - Doc 13 must gate against what doc 12 actually specifies, so it comes AFTER he approves 12.
3. **Then the D32 panel gate**, then Phase 0 per doc 12 §5.

## 11. Environment notes

- Beelink is ACTIVE; CT105 is backup. Never rsync the tree.
- `paste.md` relay target is `chris@192.168.1.190:/home/chris/Downloads/paste.md`.
- Beelink filing gate: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190 '~/.reorg/tools/check-filing.sh'`.
  Use `ssh -n`; without it the check can swallow stdin.

## 12. Honest status

Doc 12 is written and every gate I could run mechanically passes. **What is NOT proven:** that
the document is *good* — Christopher has not read it. Its content came from Bee and was
editorially reviewed by me against doc 11, but a plan is only correct when the person who owns
the decisions says it is. Two of its factual rows (Calamares 3.3 module options, and
`calamares-settings-debian`'s licence and layout) are inherited from the prior session's
verification and were NOT re-checked live today — the six package versions were. Those two rows
carry "recorded 2026-09-07" rather than a URL, and they should be re-checked before Phase 0.

Doc 13 is entirely unwritten. The design spine in §10.2 is agreed in conversation only.
