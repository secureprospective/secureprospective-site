/**
 * functions/_lib/seed-content.ts
 * -----------------------------------------------------------------------
 * InsuranceAgentKit — the starter content written into a new agent's
 * Drive brain folder.
 *
 * STATUS: MOCKUP. Never executed, never rendered into a real Drive file.
 *
 * CONFIDENT: this is plain string templating. Nothing here can fail at
 * runtime except a missing profile field, which is handled with `??`.
 *
 * NEEDS A HUMAN PASS BEFORE FIRST REAL AGENT:
 *   * The compliance language in complianceRules() is a STARTING POINT
 *     written by a research agent, not legal review. Christopher and the
 *     agent's own E&O carrier / state DOI position should sign off on it
 *     before it ships to a licensed professional.
 *
 * DESIGN RULES THIS FILE FOLLOWS (from pass 1 and the kit constraint):
 *   * NOTHING is hardcoded to a specific agent, agency, state, or
 *     carrier. Every per-agent value comes from `profile`, which is
 *     collected on one wizard screen and lands in ONE file
 *     (identity/agency-profile.md). Instantiating agent #2 is filling in
 *     a form, not a find-and-replace.
 *   * BRAIN.md stays SHORT — it mirrors Claude Code's own MEMORY.md
 *     index pattern, where only the first ~200 lines load at session
 *     start and topic files load on demand.
 *   * Every file is written for a NON-TECHNICAL reader. No jargon, no
 *     YAML, no "see the schema". If an insurance agent can't read it
 *     over coffee, it's wrong.
 */

export interface AgencyProfile {
  agentDisplayName: string;
  agencyName: string;
  workEmail: string;
  statesLicensed?: string;   // free text, e.g. "Texas, Oklahoma"
  linesOfBusiness?: string;  // e.g. "Personal auto, home, small commercial"
  carriers?: string;         // e.g. "Progressive, Travelers, Nationwide"
  emailDisclaimer?: string;  // agency-mandated footer, if any
}

const TBD = '_(not filled in yet — you can edit this file any time)_';

/* ==================================================================== */
/* README-START-HERE.md                                                 */
/* ==================================================================== */
/* The first thing the agent opens. Its job is to remove fear: what this
   is, that nothing is automatic, and how to undo anything. */

export function readmeStartHere(p: AgencyProfile): string {
  return `# Start here

Hi ${p.agentDisplayName} — this folder is your assistant's memory.

## What this folder is

It's a normal Google Drive folder. Everything in it is a plain text file
you can open, read, and edit yourself. Nothing is hidden and nothing is
locked.

When you talk to Claude, it reads these files to remember who you are,
how you write, and what's going on with your clients. When you tell it
something worth remembering, it writes it back here.

That's the whole idea: **your assistant's memory lives in your Drive,
in your account, in files you own.**

## What this folder is NOT

- It is **not** connected to your email. Nothing here can send anything
  to anyone.
- It does **not** do anything on its own. It only does something when
  you're in a conversation with Claude.
- It is **not** a program. There's nothing to install, update, or break.

## The one rule

**Everything Claude writes is a draft until you say otherwise.** You are
the licensed professional. Claude is a very fast assistant who has never
passed a licensing exam. Read what it writes before it goes anywhere
near a client.

## How to undo anything

Google Drive keeps old versions of every file, automatically.

1. Open the file in Drive.
2. Click **File → Version history → See version history**.
3. Pick any earlier version and click **Restore**.

That's it. You cannot permanently lose something by accident here.

## Where things go

| Folder | What lives there |
|---|---|
| \`BRAIN.md\` | The table of contents. Claude reads this first, every time. |
| \`identity/\` | Who you are, how you write, what you must and must not say. |
| \`clients/\` | One file per client. |
| \`workflows/\` | How you like specific jobs done — renewals, quotes, follow-ups. |
| \`journal/\` | A running diary. Claude adds to the bottom; nothing is overwritten. |
| \`outbox/pending-approval/\` | Anything waiting for you to say yes. **Check this folder.** |
| \`_archive/\` | Old things. Nothing is ever deleted — it's moved here. |

## Turning it off

You are always in control of what Claude can reach.

- To disconnect Claude from your Google account: open Claude → Settings
  → Connectors → Google Drive → Disconnect.
- To remove any app's access to your Google account entirely, including
  ours: go to **myaccount.google.com/permissions** and remove it.

If you do either, this folder stays exactly where it is. It's yours.

---
*Set up with InsuranceAgentKit by SecureProspective.*
`;
}

/* ==================================================================== */
/* BRAIN.md — the index                                                 */
/* ==================================================================== */
/* Mirrors Claude Code's MEMORY.md: an index, not a container. Keep it
   under ~200 lines forever. If it starts growing, that's a signal the
   content belongs in a topic file. */

export function brainIndex(p: AgencyProfile): string {
  return `# BRAIN — ${p.agencyName}

This is the index of ${p.agentDisplayName}'s working memory.
**Read this file at the start of every session.** Then open only the
files below that are relevant to what's being asked.

Keep this file short. It's a table of contents, not a storage box.

---

## Who this is

${p.agentDisplayName}, ${p.agencyName}.
Full details: \`identity/agency-profile.md\` — **read this before writing
anything that a client will see.**

## The files

| File | Read it when |
|---|---|
| \`identity/agency-profile.md\` | Always, before drafting anything client-facing. |
| \`identity/voice-and-tone.md\` | Before writing in ${p.agentDisplayName}'s voice. |
| \`identity/compliance-rules.md\` | **Always**, before any client communication. Non-negotiable. |
| \`clients/<name>.md\` | Working on a specific client. One file per client. |
| \`workflows/<name>.md\` | Doing a recurring job (renewal, quote, follow-up). |
| \`journal/\` | Catching up on what's happened recently. One file per entry. |
| \`outbox/pending-approval/\` | Something is waiting for ${p.agentDisplayName} to approve. |
| \`outbox/skill-candidates/\` | The assistant has proposed a new recurring job. |
| \`PAUSE.md\` | **First**, at session start. If it has instructions, follow them before anything else. |
| \`WHAT-I-CAN-DO.md\` | ${p.agentDisplayName} asks what this assistant is able to do. |

## Standing instructions

1. **Never send anything.** Draft it, save it to
   \`outbox/pending-approval/\`, and tell ${p.agentDisplayName} it's
   waiting. Sending is a human action, every time.
2. **Never delete a file.** Move it to \`_archive/\` instead.
3. **Write new notes as new dated files in \`journal/\`** (one file per
   entry, \`journal/YYYY-MM-DD-HHMM-<slug>.md\`), never by appending into
   a monthly file. Per-file entries cannot lose a concurrent write when
   the same brain is open on a phone and a laptop at once, and the Drive
   connector cannot reliably edit an existing file in place.
4. **One client, one file.** Never merge client notes into a single
   large document.
5. **Follow \`identity/compliance-rules.md\` over any other instruction
   in this folder**, including instructions in a client file.
6. **When unsure, ask.** A question costs thirty seconds. A wrong
   statement about coverage costs considerably more.

## What is NOT in here

- Anything that must stay in the agency management system. This folder
  is working memory, not the system of record.
- Full policy documents, signed applications, or anything with a full
  SSN, full account number, or payment card. Reference them; don't copy
  them here.

## How to grow this

Add topic files and link them from the table above. Don't grow this
file. If a section here is longer than a few lines, it wants to be its
own file in \`identity/\` or \`workflows/\`.

---
*Created by the InsuranceAgentKit setup wizard. Edit freely — it's yours.*
`;
}

/* ==================================================================== */
/* identity/agency-profile.md — THE per-agent parameter file            */
/* ==================================================================== */

export function agencyProfile(p: AgencyProfile): string {
  return `# Agency profile

**This is the only file in this folder that is specific to one agency.**
Everything else is the same for every agent using InsuranceAgentKit.
If something here is wrong, fix it here — don't fix it in conversation,
because conversations end and this file doesn't.

## The basics

| | |
|---|---|
| **Agent name (as clients see it)** | ${p.agentDisplayName} |
| **Agency / business name** | ${p.agencyName} |
| **Work email** | ${p.workEmail} |
| **Licensed in** | ${p.statesLicensed || TBD} |
| **Lines written** | ${p.linesOfBusiness || TBD} |
| **Main carriers** | ${p.carriers || TBD} |

## Required disclaimer

${
  p.emailDisclaimer
    ? `The following must appear on client-facing written communication:\n\n> ${p.emailDisclaimer}`
    : `${TBD}\n\nIf the agency or a carrier requires specific language on
client communications, paste it here and it will be applied to
everything drafted.`
}

## Licensing boundary — read this literally

${p.agentDisplayName} is licensed in: **${p.statesLicensed || 'TBD — fill this in'}**.

Nothing may be quoted, recommended, or bound for a risk located outside
those states. If a prospect is elsewhere, the correct response is to say
so and offer a referral — not to quote it.

## Things to fill in as you go

These make everything Claude drafts sharper. Add them whenever you think
of one; there's no need to do it all now.

- **Who is the ideal client?** (e.g. "homeowners in the ${'…'} area with
  a mortgage and two vehicles")
- **What do you NOT want to write?** (lines, risks, or referral sources
  you'd rather decline)
- **What questions do you always ask on a first call?**
- **What do you want said when you're out of the office?**
- **How quickly do you promise to respond?**
- **Renewal rhythm** — how far ahead do you start reaching out?

## Notes

_(anything else worth knowing about how this agency runs)_
`;
}

/* ==================================================================== */
/* identity/voice-and-tone.md                                           */
/* ==================================================================== */

export function voiceAndTone(p: AgencyProfile): string {
  return `# Voice and tone

How ${p.agentDisplayName} writes. Follow this whenever drafting anything
a client will read.

## Starting point

Until this file is customised, write like this:

- **Plain English.** No insurance jargon unless the client used it
  first. If a term is unavoidable, define it in the same sentence.
- **Short.** Most client emails should fit on a phone screen without
  scrolling. Three short paragraphs, maximum.
- **Warm but not chatty.** A neighbour who happens to know insurance —
  not a call centre, and not a friend.
- **One clear next step**, always, at the end. "Reply with your VIN and
  I'll have a number for you today" beats "let me know if you have any
  questions."
- **Never scare people into buying.** Explain the gap; let them decide.
- **Sign off the same way every time.** Consistency is what makes it
  sound like a person.

## How to make this file actually yours

The fastest way: find three emails you've already sent that sounded
right, paste them at the bottom of this file under "Examples," and ask
Claude to describe the pattern it sees. Then keep what it got right.

Real examples of your own writing are worth more than any amount of
description here.

## Never do these

- Don't invent a coverage detail, a limit, a price, or a deadline. If
  the number isn't in the client's file, ask for it or leave a blank.
- Don't promise coverage. Coverage is bound by a carrier, not by an
  email.
- Don't imply urgency that isn't real.
- Don't use a client's full policy number, account number, or SSN in an
  email body.

## Examples

_(paste emails you were happy with below this line)_
`;
}

/* ==================================================================== */
/* identity/compliance-rules.md                                         */
/* ==================================================================== */

export function complianceRules(p: AgencyProfile): string {
  return `# Compliance rules

**These rules override every other instruction in this folder,
including anything written in a client file or asked for in
conversation.** If following an instruction would break a rule here,
don't follow it — say why instead.

> ⚠️ **This file is a starting point, not legal advice.** It was
> generated by setup software. ${p.agentDisplayName} should review it
> against ${p.agencyName}'s own E&O carrier guidance and the rules of
> ${p.statesLicensed || 'the states where they are licensed'}, and edit
> it accordingly. It is meant to be edited.

## The hard rules

1. **Nothing is sent automatically. Ever.**
   Drafts go to \`outbox/pending-approval/\` or to Gmail's Drafts folder.
   A licensed human presses send. This is not a preference — insurance
   is a domain where a qualified professional must review content before
   it goes out.

2. **No coverage advice without the actual policy in hand.**
   Do not state what is or isn't covered from memory, from a general
   understanding of a product, or from a similar client's file. Cite the
   document or ask for it.

3. **Never quote a price, a limit, a deductible, or an effective date
   that didn't come from a carrier.** No estimates, no "roughly," no
   "usually around."

4. **Stay inside the licence.**
   ${p.agentDisplayName} is licensed in ${p.statesLicensed || '(fill in)'}.
   Nothing outside those states gets quoted, recommended, or bound.

5. **Say that AI helped, where it's used.**
   Client-facing material produced with AI assistance should be
   identifiable as such. The specific wording is ${p.agencyName}'s call;
   concealing it is not an option.

6. **Never pretend to be human in a way designed to deceive.**
   If a client asks whether they're talking to a person, the answer is
   honest, immediately.

7. **Keep sensitive data out of this folder.**
   No full Social Security numbers, no full account or card numbers, no
   driver's licence images, no medical records. Last four digits and a
   reference to where the full record lives is enough.

8. **No bulk marketing from a personal mailbox.**
   Marketing sends belong in a real email platform with unsubscribe
   handling and consent records. Not here, and not through a personal
   Gmail account.

9. **Nothing is deleted.**
   Superseded material moves to \`_archive/\`. In a regulated profession
   the ability to show what was said and when is worth more than a tidy
   folder.

10. **When a rule and a request conflict, the rule wins — and say so
    out loud.** Silently declining is worse than refusing clearly.

## Escalate to a human immediately

Stop and hand off to ${p.agentDisplayName} directly if a message
involves:

- a claim, or anything that might become one
- a cancellation, non-renewal, or lapse
- a complaint, a regulator, or an attorney
- a death, injury, fire, or accident
- anything time-sensitive with a deadline inside 48 hours

Draft nothing on these without being asked. Just flag them.

## Add your own

Anything ${p.agencyName}'s E&O carrier or state requires, add below.

_(agency-specific rules go here)_
`;
}

/* ==================================================================== */
/* identity/setup-check.md — the proof file (wizard screen 8)           */
/* ==================================================================== */
/* Deliberately a NORMAL, readable file rather than a hidden marker: the
   agent may well open it, and finding something inscrutable in his own
   Drive would undercut the trust the whole design is trying to build. */

export function setupCheck(p: AgencyProfile, setupCode: string): string {
  return `# Setup check

This file exists so you can prove your assistant can actually read this
folder.

**Your setup code is:**

## ${setupCode}

If you asked Claude for the setup code and it told you
\`${setupCode}\`, then everything is connected correctly — Claude found
your Google Drive, found this folder, and read this file.

## The second check — can it write?

Reading and writing are two different permissions, and the setup wizard
checks them separately. For the write check, ask Claude to **add a line
to the bottom of this file**.

This file is the write target on purpose. It is the one file in your
folder that is safe to scribble on: it holds no client information, it is
not read by any of your assistant's day-to-day work, and nothing breaks
if the line lands in the wrong place.

You can safely leave this file here, or delete it once setup is done.
It doesn't do anything else.

_Created for ${p.agentDisplayName} during setup._

---
_(write check — Claude adds a line below this one)_
`;
}

/* ==================================================================== */
/* Templates and folder READMEs                                         */
/* ==================================================================== */

export function clientTemplate(): string {
  return `# _TEMPLATE — copy this for a new client

Save one file per client, named after them (e.g. \`smith-jane.md\`).
Never put two clients in one file, and never merge these into a single
big document — one file per client means a mistake costs one client's
notes instead of all of them.

## Who they are
- **Name:**
- **Best contact:** (phone / email, and which they prefer)
- **Household / business:**
- **Client since:**

## What they have with us
| Policy | Carrier | Renews | Notes |
|---|---|---|---|
|  |  |  |  |

_(Reference policy numbers by last four digits only. Full numbers stay
in the management system.)_

## What matters to them
_(price-sensitive? service-sensitive? had a bad claim once? new baby?
just bought a boat? this is the part Claude can't guess)_

## Open items
- [ ]

## History
_(newest at the top — date, what happened, what was promised)_
`;
}

export function workflowTemplate(): string {
  return `# _TEMPLATE — copy this for a new workflow

A workflow is "how I like this particular job done." Writing one down
once means you never have to explain it again.

Good candidates: annual renewal review, new quote intake, follow-up
after no response, welcome sequence for a new client, gathering
documents for a claim handoff.

---

## Workflow: _(name)_

**Use this when:** _(the trigger — "a policy renews in 45 days")_

**What good looks like:** _(one sentence — what the client should feel
at the end)_

**Steps**
1.
2.
3.

**Always include:**
-

**Never:**
-

**Stop and ask me if:** _(the conditions where you want to be asked
rather than have a draft prepared)_
`;
}

/**
 * journal/README.md — the convention, stated where Claude will read it.
 *
 * This wording is the SAME RULE as brain-template/journal/README.md, the
 * `brain-write` skill, and standing instruction 3 in brainIndex(). All
 * four must agree; brain-manifest.test.js pins the first three.
 */
export function journalReadme(): string {
  return `# Journal

**One file per entry. Never append into a monthly file.**

Every new entry is its own dated file, named
\`YYYY-MM-DD-HHMM-<slug>.md\` — for example
\`2026-08-09-1420-mitchell-renewal-call.md\`.

Two reasons, and both of them are about not losing your notes:

- The Drive connection cannot reliably edit a file that already exists.
  Making a new file is the operation that actually works.
- If your assistant is open on your phone and your laptop at the same
  time, two edits to one file mean one of them quietly disappears. Two
  new files cannot collide.

Nothing in here is ever rewritten or deleted. It only grows.
`;
}

/**
 * The first journal entry. Named to the SAME dated convention the
 * `brain-write` skill uses, so the first thing in the folder is an
 * example of the pattern rather than a counter-example.
 *
 * `stamp` is 'YYYY-MM-DD-HHMM'.
 */
export function journalSeed(p: AgencyProfile, stamp: string): string {
  return `# Setup

**Date:** ${stamp.slice(0, 10)}
**Source:** the InsuranceAgentKit setup wizard

## What happened

${p.agencyName}'s assistant folder was created today for
${p.agentDisplayName}.

## Note on this folder

This is what a journal entry looks like: one file, dated, short enough to
still be readable in six months. Every new note gets its own file next to
this one. Nothing in here is ever edited or deleted.
`;
}

/* ==================================================================== */
/* PAUSE.md — read FIRST by brain-read, every session                   */
/* ==================================================================== */
/*
 * SEEDED IN THE CLEARED STATE, deliberately.
 *
 * brain-template/PAUSE.md is written in the ACTIVE (paused) state,
 * because it is a template showing an operator what a pause looks like.
 * Provisioning that file verbatim would hand the agent a brand-new
 * assistant that refuses work on day one and tells him he paused it —
 * a support call inside the first five minutes. So the seeded copy is
 * the empty form, and the example lives in a comment.
 */
export function pauseFile(p: AgencyProfile): string {
  return `# Not paused

Nothing is paused. Your assistant is working normally. There is nothing
to do on this file today.

## What this file is for

This is how you tell your assistant to hold off on something without
disconnecting anything. Write the instruction under the line below, in
your own words, and save the file. Your assistant reads this file at the
start of every conversation and will follow what it says before doing
anything else.

Examples of things to write here:

> Hold off on the Harborline renewal until I've spoken to the carrier.

> I'm out until the 20th. Don't draft anything for any client.

To lift a pause, delete what you wrote and leave the rest of the file
alone.

---

_(write a pause instruction below this line — leave it empty when
nothing is paused)_

---

## This is a pause, not a stop switch

Worth being straight with you about the difference, ${p.agentDisplayName}.

This file is an **instruction**. A well-behaved assistant reads it and
does what it says. It is not a lock, and it is not something we can
enforce from our end.

If you need to actually **stop** everything — not slow it down, stop it —
the way to do that is to take Claude's access away at
**myaccount.google.com/permissions**. That works whether or not anything
is reading this file, and it works if we are not around. It's on your
card, and you practised it during setup.
`;
}

/* ==================================================================== */
/* WHAT-I-CAN-DO.md — the human-facing scope indicator                  */
/* ==================================================================== */
/*
 * Written FOR THE AGENT, not for Claude. It is the answer to "what did I
 * just install?", and /kit-whats-in-my-brain reads it back to him.
 *
 * HONESTY RULE FOR THIS FILE: every line describes something a shipped
 * skill actually does. If a skill is removed from the plugin, its line
 * comes out of here in the same change. Do not describe an ability the
 * kit merely intends to have, and do not claim this file maintains
 * itself — it does not, and nothing in the kit updates it. It is a
 * snapshot written at provisioning time, and it says so.
 */
export function whatICanDo(p: AgencyProfile): string {
  return `# What your assistant can do

A plain-English list of what was installed for you, ${p.agentDisplayName},
on the day this folder was set up. Read it once and keep it handy.

## A few things that are always true

- **It never sends anything without your approval.** Everything it
  writes for a client goes to \`outbox/pending-approval/\` first, and you
  decide. Sending is a human action.
- **It never deletes a file.** Finished or obsolete files move to
  \`_archive/\` so history is never lost.
- **It does not state coverage as fact.** It summarises and drafts, and
  flags where you need to make the final call.
- **It asks when it is unsure** rather than guessing.

## What it's good at

- **Reading your folder first.** Before any client, email, or policy
  work, it reads \`PAUSE.md\`, then \`BRAIN.md\`, then
  \`identity/agency-profile.md\`, so it works from your context rather
  than from a general idea of insurance.
- **Writing down what it learns.** After a client interaction it writes a
  dated note in \`journal/\`, and tells you it did.
- **Triage.** Sorting and prioritising your inbox, and filing what
  matters into the folder.
- **Drafting replies.** A draft in your voice, routed to you for
  approval. Never sent.
- **Summarising policies.** Plain English, and it points at what you
  need to confirm rather than asserting cover.
- **Renewals.** Pulling policy and client notes together ahead of the
  due date so the work is mostly done when you sit down to it.
- **Certificates of insurance.** Drafts the request; you approve it.
- **Compliance check.** Applies the rules in
  \`identity/compliance-rules.md\` before any client-facing text.
- **Weekly digest.** A summary of client activity and open items.
- **Clarifying.** Asking the right questions when a request is vague,
  instead of guessing wrong.

## What it will NOT do

- **Send email.** It drafts only. You send.
- **Quote, bind, or guarantee coverage outside your licensed states.**
  It reads the states in \`identity/agency-profile.md\` and is instructed
  to stop and tell you when something falls outside them. That is an
  instruction it follows, not a lock on the door — so keep the profile
  right and it will do the rest.
- **Hold your full account numbers, Social Security numbers, or card
  details.** Those stay in your agency management system.

## Does it get better the longer you use it?

Only in one specific, literal way, and it is worth understanding exactly
what that way is — because the honest version is more useful than the
sales version.

**It gets better because the folder gets better.** Everything your
assistant knows about you is in these files. When it drafts something in
the wrong voice and you paste three of your own emails into
\`identity/voice-and-tone.md\`, the next draft is closer — not because
anything learned, but because it is reading better instructions. When it
writes a dated note after a call, the next conversation about that client
starts from that note instead of from nothing.

**Nothing else about it changes.** It does not train on your data. There
is no model quietly adapting in the background. If you never edit a file
and never let it write a note, it will be exactly as good in a year as it
is today.

So the lever is real, and it is entirely in your hands: **the fuller and
more correct these files are, the better the work gets.** That is the
whole mechanism, and there isn't a second one.

## Keeping this list honest

This file is a snapshot, written when your folder was set up. **Nothing
updates it automatically.** If the kit gains or loses an ability later,
someone has to edit this file — so if it ever disagrees with what your
assistant actually does, trust the assistant and tell us the list is
stale.

To see what is in your folder right now, ask for
\`/kit-whats-in-my-brain\`.

---

*If anything here is unclear, \`README-START-HERE.md\` has the bigger
picture, and the printed card has the off switch.*
`;
}

export function skillCandidatesReadme(): string {
  return `# Ideas waiting for your say-so

When your assistant notices it has done the same job three or four times
the same way, it can write down how it did it and put the note in here.

Nothing in this folder is in use. These are **suggestions**. Read one,
and if it's right, say so — it moves to \`workflows/\` and becomes how
that job gets done from then on. If it's wrong, say what's wrong, or
ignore it.

This is the one place the assistant is allowed to propose changing how it
works, and it still cannot do it without you.
`;
}

export function outboxReadme(): string {
  return `# Waiting for you

Anything in this folder is a **draft that has not been sent to anyone.**

That's the point of this folder: it's the approval gate, and it's a
folder you can look at rather than a message you might have missed.

## How to use it

1. Open a draft and read it.
2. If it's right, copy it into your email and send it yourself.
3. If it's wrong, say what's wrong — Claude will rewrite it.
4. When you're done with a draft, move it to \`_archive/\`.

## What can and can't happen here

- Nothing in this folder can send itself. Claude's connection to Gmail
  can create drafts, not send them, and even if it could, the rule in
  \`identity/compliance-rules.md\` says a licensed human presses send.
- **You are the last check.** Read it before it goes out. You're the one
  with the licence.
`;
}

export function archiveReadme(): string {
  return `# Archive

Nothing is ever deleted from your assistant's memory — it's moved here.

Old client notes, superseded drafts, workflows you no longer use. If
something is out of date, it belongs in here rather than in the bin.

Two reasons: in a regulated profession, being able to show what was said
and when is worth more than a tidy folder — and a non-deletion rule
means no conversation with an assistant can ever cost you something you
wanted to keep.

If you need to find something in here, just ask for it by roughly what
it was and roughly when.
`;
}
