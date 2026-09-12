# SP+ RESUME — Fin polish for the v0.11 ISO
**Written:** 2026-09-12, mid-session, before a context compaction.
**This is not a session close. The session continues.**

---

## 1. WHAT WE ARE DOING

Polishing Fin (the SP+ advisor assistant) so it is a finished product for new users, then
building an ISO. Fin and Bee are the same program — `pi`, the Earendil coding agent — but Bee
has a 15-file configuration and Fin had almost none. Christopher asked for four things, all
four are now built, gated and committed, and **none of them have been seen running yet.**

- **Repo:** `~/work/secureprospective-advisor-os` on the Beelink, project dir `projects/sp-plus`.
- **Branch:** `session/sp-plus-defense-in-depth` (carried over from the previous session; the
  Fin work was added to it rather than fragmenting the ISO work across two branches).
- **Beelink:** `ssh -i /root/.ssh/beelink chris@192.168.1.190`.

### CONSTRAINT ADDED 2026-09-12 — READ THIS FIRST

Christopher, verbatim: *"looks good. Be sure to make it beaufiful... dont touch beelink...
beelink is perfect and the VM is perfect for edit and seeing if it works."*

This came **immediately after** I proposed building the image on the Beelink and running Fin in
a container there. It is a refusal of that proposal.

- **Do NOT build, install, or change configuration on the Beelink.** No `podman build`, no
  package installs, no edits to `~/.pi/agent/*` (Bee's own config is explicitly "perfect").
- **The VM is the work surface** for building and for seeing whether it works.
- The Beelink is still the git repository host and the hypervisor. Reading the repo, committing
  to it, and `virsh` are the door to the VM and are not what he is refusing. **If in doubt on
  anything beyond that, ask him.**
- **"Be sure to make it beautiful"** is a live instruction about the opening page. It has only
  ever been rendered as plain text through a test harness. It has never been seen in a real
  terminal with real colours. That is the outstanding visual work.

---

## 2. AGENTS + HARNESSES

Nothing was dispatched. All work was done directly. No Bee, no Tom, no subagents.

---

## 3. GATES / STATUS

All six ship inside the image at `/usr/libexec/sp-plus/` and run during the build, so the same
proofs re-run on a booted machine. Every one was mutation-tested red before being trusted.

| Gate | Assertions | Mutations proven red | State |
|---|---|---|---|
| `tests/fin-notebook-gate.sh` | 36 | 9 | PASS |
| `tests/fin-skills-gate.sh` | 6 skills x 5 + 9 | 9 | PASS |
| `tests/fin-session-meter-gate.sh` | 14 | 5 | PASS |
| `tests/fin-opening-gate.sh` | 19 | 6 | PASS |
| statusline palette assertion (inline, Containerfile) | 2 | 1 | PASS |
| web-search disabled assertion (inline, Containerfile) | 1 | 1 | PASS |

**Not yet run:** the image build itself. Every Containerfile assertion added this session is
unproven until a build runs. `bash -n` on the reconstructed RUN block passes (147 command lines,
94 comment lines, RUN at Containerfile line 926–1166) but that only proves it parses.

Run a gate in a checkout with `cd projects/sp-plus && bash tests/<gate>.sh`.
`tests/fin-opening-gate.sh --preview` prints the page instead of testing it.

---

## 4. ARTIFACTS THAT EXIST AND WORK

Commits on `session/sp-plus-defense-in-depth`, newest first:

| SHA | What |
|---|---|
| `30c7193` | the opening page |
| `d96fad8` | plan mode, web fetch, subagents, usage, status bar, session meter |
| `74af0da` | four advisor skills |
| `9ae3d7e` | the notebook index rebuilds itself |
| `1500af7` | the notebook and its privacy guard |
| `e011329` | previous session's resume (Welcome punch items) |

Files created this session, all under `projects/sp-plus/`:

```
config/fin-extensions/spplus-notebook.ts        the privacy guard + self-rebuilding index
config/fin-extensions/spplus-session-meter.ts   the spend timer, in advisor language
config/fin-extensions/spplus-opening.ts         the opening page
config/fin-skills/notebook/SKILL.md
config/fin-skills/voice/SKILL.md
config/fin-skills/email/SKILL.md
config/fin-skills/save-this-session/SKILL.md
config/fin-pi-config/pi-statusline.json         SP+ palette, 3 segments
config/fin-pi-config/web-search.json            search off, fetch on
tests/fin-notebook-gate.sh
tests/fin-skills-gate.sh
tests/fin-session-meter-gate.sh
tests/fin-opening-gate.sh
```

Modified: `config/fin` (the launcher) and `images/kde/Containerfile`.

---

## 5. THE CURRENT STATE — no bug, an unseen build

There is no failing thing. The state is that **nothing has been run**. The next step is a build,
and the build has to happen somewhere that is not the Beelink.

### The VM landscape, measured 2026-09-12 (read-only `virsh -c qemu:///session list --all`)

| VM | State | Notes |
|---|---|---|
| `fedora-0.11` | **running** | Christopher's. Old v0.11 image. **NO network path by any route** — console only, via `virsh send-key` and `virsh screenshot`. |
| `SP-Alpha-Rig` | shut off | Has a control profile, `~/fleet/bin/rig`, passt port forward, no LAN exposure. |
| `spplus-test` | shut off | The designated disposable SP+ domain. |

`ss -ltnp` showed **nothing listening on 2222** right now, so the `ssh -p 2222 test@127.0.0.1`
path that `~/fleet/bin/run-bee.sh` documents is not currently up. It presumably comes up when
the relevant VM is started.

**The open question, and it is the first thing to resolve:** which VM does Christopher mean by
"the VM", and does a VM have enough to build a bootc image inside it (podman, disk, network)?
I had asked nothing yet when the compaction came. **Ask him rather than guessing** — starting
or altering the wrong VM is exactly the kind of thing he has just drawn a line around.

---

## 6. HYPOTHESES ALREADY REFUTED / FACTS ESTABLISHED — DO NOT RETEST

These cost real time. Every one was measured, not assumed.

1. **An extension loaded by absolute path CAN resolve `@earendil-works/*` imports.** I expected
   node resolution to walk up from the file's directory and fail. It does not: pi resolves its
   own packages. Proved by copying `plan-mode` to `/tmp/pmtest` (outside any `node_modules`) and
   running `pi --no-extensions --extension /tmp/pmtest/index.ts --help`, which registered the
   `--plan` flag with rc=0 and empty stderr. All five npm packages load the same way.
   **`--help` loads extensions and calls no model, so it is a free probe. Use it.**

2. **Vendoring the five packages makes the image SMALLER, not bigger.** Measured on CT105:
   pi 0.85.0 alone in a global prefix is 88 MB; pi plus the five in the SAME `npm install -g`
   command is 61 MB, because npm hoists dependencies they share. In a SEPARATE prefix they cost
   an extra 108 MB. **Do not "optimise" this by splitting the install.** An earlier plan to
   symlink-dedupe a nested pi is unnecessary and was abandoned.

3. **`pi-subagents` pulls `pi-coding-agent` through a caret range** and on its own resolves to a
   NEWER pi than the pin, shipping a second ~80 MB agent. Installing in one command with the
   pinned pi resolves it to the pinned copy. The Containerfile asserts exactly one copy exists.

4. **pi-statusline reads its config from `getAgentDir()`**, i.e. `~/.pi/agent/pi-statusline.json`.
   Seeded at `/etc/skel/.pi/agent/pi-statusline.json`. Config validated against the real
   extension with `PI_CODING_AGENT_DIR=/tmp/slagent pi --extension <statusline> --help`, rc=0.
   **An unknown key like `_comment` was removed before that test; do not add one back untested.**

5. **pi-web-access reads `~/.pi/web-search.json`** (not `~/.pi/agent/`). `{"webSearch":
   {"enabled": false}}` disables the `web_search` and `source_check` tools while leaving
   `fetch_content` and `get_search_content`. That is exactly the fetch-only behaviour chosen.

6. **Node 22 strips TypeScript types natively**, so the gates import the real `.ts` extensions
   directly with no build step. `import type` is erased, which is why the SP+ extensions that
   only import types work from any path.

7. **`plan-mode` and `burn` in Bee's `~/.pi/agent/extensions/` are unlicensed local copies.**
   plan-mode is available as `@narumitw/pi-plan-mode` (MIT, same author as pi-statusline) and
   that is what ships. `burn` was NOT vendored; `spplus-session-meter.ts` was written fresh.

8. **A line-based `grep` cannot see a phrase split by prose wrapping.** The skills gate failed on
   "no names" because the voice skill wrapped it across two lines. Cost one debugging cycle.
   When a gate greps for a phrase, keep that phrase on one line in the source.

9. **Bee's skills do not transfer to Fin.** `impeccable` is a frontend design tool,
   `find-the-feed` is research, `session-close` is git-shaped. Only `compact-safe` had an advisor
   equivalent. Reviewed and settled; do not re-survey them.

10. **The brand palette cannot be applied literally to the opening page.** The Shorts palette is
    specified for a LIGHT ground; the page sits on whatever colour the terminal is and SP+ ships
    both light and dark Looks. The page therefore takes text colour from pi's theme
    (`theme.fg("accent"|"text"|"dim"|"muted"|...)`) and carries the brand through the shoal and
    the gold wordmark only. The STATUS BAR is the opposite case and does use the palette
    literally, because each segment sets its own background. **Christopher has been told this and
    did not object.**

---

## 7. DECISIONS

Taken by Christopher this session:

- **Skills:** port `compact-safe`; add an email skill, a voice-interview skill that asks about
  business assessments, and a wiki/second-brain so sessions are saved.
- **Notebook:** everything markdown, advisor-facing, well indexed, timestamped, recording which
  model wrote each page. **Safeguards so it never records human names or PII.**
- **Opening page:** information panel like Bee's, **below** the fish, SP+ aesthetic, "fun, cool,
  and attractive enough people will want to keep it on screen". Suggestions on the page with the
  interview in the cycle. Explanations of skills, extensions and tips in **plain language**,
  unlike Bee's.
- **Palette:** the **Shorts** palette — INK `#12325B`, BODY `#3A4048`, GROUND `#EEF0F3`,
  ACCENT `#F5C542`. Yellow is an accent only and never type. (The site repo has a different
  palette; it lost.)
- **Web access: fetch only, no search.** Advisors have no search-provider key and never will.
- **2026-09-12: do not touch the Beelink. Use the VM. Make it beautiful.**

Judgment calls I made and flagged to him (he did not overrule):

- `compact-safe` was renamed **`save-this-session`** for the advisor-facing skill list.
- The spend timer is not a port of Bee's `burn`; same measurement, advisor words.

Standing constraints carried forward: never `git --no-verify`; no work on main; Beelink `sudo`
permits podman only; `spplus-test` and `SP-Alpha-Rig` are the domains available for destructive
work; signature-enforcement proving must NOT happen on `fedora-0.11`; D44 nothing may break day
one; D15 no compliance claims on any surface.

---

## 8. LEDGER STATE

Five commits, all with passing hooks, tree clean. Nothing written but uncommitted.

Not yet written: a ledger entry in `projects/sp-plus/docs/` describing the Fin polish as a whole.
Deliberate — it should be written after the build proves the Containerfile assertions, so it
records what shipped rather than what was intended.

---

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher which VM to use**, and whether it can build a bootc image (podman, disk,
   network). Do not start or modify a VM before he says which. `fedora-0.11` is his and has no
   network path; `spplus-test` is the disposable SP+ domain and is shut off.
2. **Build the image in that VM** and capture the build log. Watch for the new assertion echoes:
   `FIN_NOTEBOOK_OK`, `FIN_SKILLS_OK`, `FIN_PACKAGES_OK`, `SPPLUS_STATUSLINE_OK`,
   `SPPLUS_WEB_FETCH_ONLY_OK`, `FIN_FOOTER_OK`, `FIN_OPENING_OK`.
3. **Look at Fin running**, in a real terminal, with real colours — the opening page and the
   status bar. This is the "make it beautiful" step and it is the whole point of the VM.
   Screenshot it for Christopher.
4. **Iterate on the visual** until he is happy. Expect the shoal plus panel to be ~33 lines of
   header; check it does not swamp a normal terminal, and consider trimming if it does.
5. **Cut the ISO** and put it in the Beelink's `~/Downloads` as `SP-PLUS-cycle<N>.iso`.
6. **Write the ledger entry** describing what shipped.
7. Carried from before: publish v0.11 via `scripts/publish-image.sh` per the standing order; the
   disk-recovery-key ruling; the remaining day-one job audit.

---

## 10. RELAY / ENVIRONMENT NOTES

- Beelink: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`. **Read-only and repo/virsh only
  from now on.**
- **Never nest heredocs over ssh** — two hops, zero work, exit 0. Write the script locally, `scp`
  it, run it. Used throughout this session and it works.
- Editing repo files: write locally in the scratchpad, `scp` into place. Patch scripts that
  assert their anchors caught two wrong-indentation bugs.
- Commit with a message file: write it locally, `scp` to `/tmp/msg.txt`, `git commit -F`.
- Beelink `/tmp` is a 16 G tmpfs; a full tree copy fills it.
- The VM clock on `fedora-0.11` runs five hours behind UTC.
- Typed console commands into a VM lose keystrokes past ~100 characters.
- Relay for things Christopher must run himself:
  `scp -i /root/.ssh/beelink /root/paste.md chris@192.168.1.190:/home/chris/Downloads/paste.md`.

---

## 11. HONEST STATUS

**What is genuinely proven:** the four extensions and four skills exist, their gates pass, and
every gate has been shown to fail when the thing it checks is broken. The five npm packages load
under the real pi from their installed paths. The vendoring makes the image smaller. Both seeded
config files are accepted by the real extensions.

**What is NOT proven, and must not be described as working:**

- The image has never been built with any of this in it. Every Containerfile assertion added
  this session is untested.
- Fin has never been launched with these extensions. Nobody has seen the opening page in a real
  terminal, or the status bar at all.
- The notebook privacy guard has never blocked a real model, only synthetic tool-call events.
- The voice interview, the email skill and the session note have never been run by anybody.
- The header is roughly 33 lines tall. Whether that is "attractive enough people will want to
  keep it on screen" or simply too big is unknown until it is seen.

**ETA:** unknowable until the VM question is answered, because the build surface is undecided.
