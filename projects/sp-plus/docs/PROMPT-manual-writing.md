# TASK: Write the complete SP+ advisor manual

You are writing the in-app help manual for **SP+**, a Linux operating system sold
to independent financial advisors. You will work through a ledger of 37 articles
plus 3 infrastructure tasks, one at a time, committing after each one, until the
ledger has no TODO rows left.

**This task is deliberately larger than one context window. It is designed to be
resumed. Follow the WORK LOOP exactly and you will never lose more than one
article's progress.**

---

## 0. ORIENTATION — read these first, in this order

Repository: `~/work/secureprospective-advisor-os/projects/sp-plus`
Branch: `session/sp-plus-plan`

1. `docs/HELP-CORPUS-LEDGER.md` — **your work queue and state. Read this first,
   always, including on resume.**
2. `docs/HELP-CORPUS-PLAN.md` — why this work exists and what the target is.
3. `knowledge/` — the existing corpus, 17 articles. Read two or three to absorb
   the voice. Do not read all of them.
4. `welcome/app/help-data.json` — the compiled corpus the app actually loads.

---

## 1. THE WORK LOOP — follow this literally

```
LOOP:
  1. Read docs/HELP-CORPUS-LEDGER.md.
  2. Find the FIRST row whose Status is TODO. That is your article.
     If there are no TODO rows left, go to SECTION 9 (FINISHING).
  3. Set that row's Status to DRAFTED and write the article (SECTION 4, 5, 6).
  4. Verify every factual claim in it (SECTION 3). Record what you checked in
     the Evidence column.
  5. Set Status to VERIFIED, or BLOCKED with a one-line reason if you genuinely
     cannot verify it.
  6. COMMIT: the article file AND the ledger row, in ONE commit.
     Message: "Manual: <ID> <article title>"
  7. Go to LOOP.
```

**Rules that make this resumable — do not deviate:**

- **One article per commit.** Never batch. A context exhaustion between commits
  costs at most one article.
- **Update the ledger in the same commit as the article.** A finished article with
  a stale ledger row will be rewritten by the next run and waste the work.
- **On resume, read the ledger and nothing else to find your place.** Do not
  re-read finished articles to "get context". The ledger is the state.
- **Never stop to ask permission to continue.** Finish the current article, commit,
  and start the next. Keep going until the ledger is clear or you are stopped.
- **Do not stop at a batch boundary.** Batches organise the reader, not you.
- If you find yourself running low on context: commit what is finished, make sure
  the ledger is accurate, and state plainly in your final message which ID you
  stopped after. The next run picks it up from the ledger.

---

## 2. WHO YOU ARE WRITING FOR

An independent financial advisor. They are not technical. They have used Windows
their whole career. Someone has handed them a computer that is not Windows, and
their honest internal state is suspicion that this thing is unfamiliar, fragile,
or a risk to their practice and their clients' data.

They are reading your page because something is confusing or broken, they are
mildly stressed, and they do not want to look foolish. They will not read a wall
of text and they will not run a command.

**What this means concretely:**

- Never tell them to open a terminal or type a command. SP+ is explicitly designed
  so an advisor never touches a command line. If the only fix is a command, the
  page says to ask the assistant (Fin) instead.
- Explain the *reason*, not only the instruction. "Type your PIN" is worse than
  "Type your PIN — this proves to the security chip that it's really you, which is
  what lets it unlock the disk."
- Name the worry and answer it. If a screen looks alarming, say so and say why it
  is normal.
- Assume they do not know our vocabulary. If a thing has a Windows name they know,
  give that name too.

---

## 3. THE ABSOLUTE RULE — VERIFY BEFORE YOU WRITE

**Every factual claim must be checked against the real system before it goes into
an article.**

Documenting something SP+ does not do is worse than leaving a gap. A gap is a
missing page. A false instruction sends an already-nervous advisor to a menu that
is not there, and proves to them that the product cannot be trusted. That is the
single worst outcome of this project.

How to verify, in order of preference:

1. **The running SP+ VM**, if it is up: `ssh -p 2222 test@127.0.0.1`.
2. **The built image**, which is always available:
   `sudo -n podman run --rm --entrypoint /bin/bash localhost/sp-plus-kde:spike -c '<command>'`
   Use this to confirm an application actually ships, a file exists, a service is
   enabled, or a menu entry is present. For example:
   `rpm -q thunderbird`, `test -x /usr/bin/okular`, `ls /usr/share/applications/`.
3. **The repository source** — `images/kde/Containerfile` is the authoritative list
   of what is installed and configured.

Record what you checked in the ledger's Evidence column, specifically: `verified:
rpm -q simple-scan in image` beats `verified`.

**If a capability does not exist, do not write the page as though it does.** Either
write the honest page ("SP+ does not include X; here is what to do instead"), or
mark the row BLOCKED with the reason. Never invent a menu path, a button label, or
a setting name. If you cannot confirm a label, describe the action rather than
quoting a label you are guessing at.

---

## 4. ARTICLE FORMAT

Plain Markdown. No frontmatter. The file paths are given in the ledger.

```markdown
# Title In Sentence Case

One or two opening sentences that say what this page is for and, where relevant,
reassure. If the situation is alarming, defuse it in the first line.

## A section heading that is a plain-language question or task

Body. Short paragraphs. Bold for the thing they must actually do.

## Another section

- Bullets for steps or options.
- Tables where a task/how mapping is genuinely clearer.

## Related pages

- [Another article title](relative/path.md)
```

**Length:** 2,000–3,500 characters. The existing corpus runs 2,100–3,600 and that
is the right size. Four to seven `##` sections. If a page wants to be longer than
3,500, it is two pages — but do not add pages that are not in the ledger; note it
in the Evidence column instead.

**Cross-links:** use relative paths from the article's own location, exactly as the
existing corpus does — e.g. from `knowledge/advisor-help/welcome.md`, link to
`getting-around.md` and `../security/what-leaves-this-computer.md`. Every article
should end with a "Related pages" section of two to four genuinely relevant links.
**Only link to articles that exist in the ledger.** A link to a page that will
never exist is a dead end.

**Never use an em-dash character (—) anywhere in the corpus.** The build gate
rejects it. Use a plain hyphen or restructure the sentence.

---

## 5. VOICE

The register is a thoughtful colleague explaining something to someone who is
nervous and does not want to look foolish.

This is the target, from the existing corpus:

> **Read this calmly: your files are almost certainly fine.** This screen looks
> alarming and is nearly always routine. Here is what happened and exactly what to
> do.

> Think of it like a bank flagging a transaction as unusual. Annoying, but you
> want a bank that checks.

**Do:**
- Plain words. Short sentences. Active voice.
- Say why, not only what.
- Use an everyday analogy when a concept is genuinely unfamiliar.
- Be honest about limitations and frame them as our work, not their problem.

**Do not:**
- Exclamation marks, cheerfulness, or marketing voice.
- First-person-plural chattiness or philosophical asides.
- Jargon without a plain-language gloss.
- Hedging that leaves them unsure what to actually do.
- Any claim you have not verified.

---

## 6. WHAT EACH ARTICLE MUST COVER

Existing articles marked "needs re-verification" in the ledger are **not** to be
rewritten from scratch. Re-read them, verify every claim against the current image,
fix anything that has drifted, add a Related pages section if missing, and remove
any em-dashes. Then mark VERIFIED.

For the new articles, the ledger title says the subject. Two that need specific
care:

- **P7 "Something broke after an update: going back."** `knowledge/advisor-help/welcome.md`
  already promises the advisor "there is a built-in way back if anything ever
  misbehaves." SP+ is an image-based (bootc/rpm-ostree) system that keeps the
  previous version and can boot it. **Verify exactly how this works on the real
  system before writing it**, and write it as the calm, step-by-step page that the
  existing promise implies. This is the most important new page in the set.
- **F3 "Private and Shared."** This distinction is currently taught only on one
  screen of the Welcome app and appears nowhere in the manual. Private is the
  advisor alone; Shared is the advisor plus SecureProspective. Misfiling here has
  real consequences, so the page must be unambiguous without being frightening.

---

## 7. INFRASTRUCTURE TASKS (G1, G2, G3)

Do these **after** all article rows are VERIFIED, in this order.

**G1 — write `welcome/build-help-data.py`.** A deterministic generator that walks
`knowledge/`, reads every article, and emits `welcome/app/help-data.json`. The JSON
is a list of objects with keys `category`, `title`, `source`, `markdown` — match
the existing shape exactly, because `welcome/app/app.js` consumes it. Title comes
from the article's `# ` heading. Category comes from an explicit mapping in the
generator, not from the directory name. `source` must be the real repo-relative
path so that in-app cross-link resolution can work. After this exists,
`help-data.json` is **never hand-edited again**.

**G2 — the category list.** The categories are currently **hardcoded in
`welcome/app/app.js` around line 653**, not derived from the corpus. The plan wants
seven categories; there are six today. The help screen renders them in a
`.trail-grid` of **3 columns at `height:100%`**, so seven categories becomes three
rows and may break the app's absolute no-scroll rule.

Decide by testing, not by assuming: add the seventh category ("Your files"), render
the help screen at **1024x768 and 1280x800**, and confirm no scrolling. If it does
not fit, fold "Your files" into "Everyday work" instead and note that in the
ledger. Whichever you choose, the generator's mapping and `app.js` must agree.

**G3 — regenerate `help-data.json`** from the finished corpus and confirm the app
loads it: valid JSON, every article reachable, no article orphaned by a category
name mismatch.

---

## 8. CONSTRAINTS THAT DO NOT MOVE

- **No em-dash characters anywhere under `knowledge/` or `welcome/app/`.** Build
  gate.
- No claim that has not been verified against the image or a running machine.
- Never instruct the advisor to use a terminal or run a command.
- Do not reference or reuse any real person's account details. The manual is for a
  new advisor, not for the person who built the system.
- Do not add articles that are not in the ledger. If you believe one is missing,
  add a row with Status TODO and a note, then continue with your current article.
- Do not change `welcome/welcome.py`, the app's screens, or any file outside
  `knowledge/`, `welcome/build-help-data.py`, `welcome/app/help-data.json` and the
  `categories` object in `welcome/app/app.js`.
- Other agents may be working in this repository. Before each commit, `git pull
  --rebase` if there is a remote, and never revert a change you did not make. If
  you hit a conflict in a file outside your scope, leave their version.

---

## 9. FINISHING

When the ledger has no TODO or DRAFTED rows:

1. Confirm every article file referenced in the ledger exists and is non-empty.
2. Confirm no em-dash anywhere: `grep -rIlP '\xe2\x80\x94' knowledge/ welcome/app/`
   must return nothing.
3. Confirm every cross-link in every article resolves to a file that exists. List
   any that do not and fix them.
4. Run the generator and confirm `help-data.json` is valid JSON with the expected
   article count.
5. Write `docs/HELP-CORPUS-REPORT.md` containing: the final article count and total
   character count, the list of anything marked BLOCKED and why, every claim you
   could not verify, and any place where you found the product's real behaviour
   differed from what the existing corpus said.
6. Commit it.

**Report evidence, not a verdict.** Do not claim the manual is complete. State what
was written, what was verified and how, and what remains unproven. Someone else
decides whether it is finished.
