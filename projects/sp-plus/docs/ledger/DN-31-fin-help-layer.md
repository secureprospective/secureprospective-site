# DN-31 — Welcome's second life: Fin as the interpretive help layer

Status: **AMENDED 2026-08-28** after panel review. See AMENDMENT 1 at the foot of this
file, which SUPERSEDES decisions 5, 7 and the liability premise. Drafted 2026-08-28,
reviewed by gpt-5.6-sol the same day, ruled on by Christopher the same day.
Extends: DN-26 (SP+ Welcome owns the first screen), DN-25 (Fin plug and play).
Depends on: `sudoers-sp-plus` (`%wheel ALL=(ALL) NOPASSWD: ALL`).

---

## Context for a reviewer with no prior exposure

SP+ is a Fedora Kinoite 44 bootc image-mode Linux distribution built for independent
financial advisors, who are non-technical users running a regulated practice. `/usr` is
read-only. `/etc` and `/var` are per-machine state. The product exists to remove the need
for an IT department.

Two components matter here:

- **SP+ Welcome** — a first-party application that owns the first screen after first
  login. A PySide6 shell wrapping a local HTML application. Seven screens, seventeen help
  articles, one working system integration (theme application) and nine labelled stubs.
- **Fin** — the advisor's assistant, a terminal application at `/usr/bin/fin`. Runs as
  the advisor. Ships a system prompt, a skills directory and a prompt catalogue.

## The governing goal

**Eliminate the IT department above the hardware and network or server line.** Anything
an advisor would otherwise call a technician about, short of a failed disk or a dead
switch, the machine should resolve for itself.

## The decisions

### 1. Welcome has a second life, and it starts at the second boot

First boot is onboarding, and it is out of scope for this record. From the second boot
onward, **Welcome is the permanent first-class help application** for the machine. The
onboarding content does not disappear. It recedes, and help comes forward.

### 2. Fin is the interpretive layer; Welcome is its front door

The advisor types plain, non-technical, frequently frustrated language into Welcome. That
input goes to Fin. Fin turns it into the actual technical situation and the actual fix.
Welcome does not implement a second assistant. It is a surface onto the same Fin the
advisor uses for document work.

### 3. The help documents are footnotes; Fin is the interpretation

Christopher's framing, recorded because it is load-bearing rather than decorative:
scripture carries depth that translates into plain language and bears many meanings
depending on who arrives and in what state; the footnotes anchor it.

Two engineering consequences follow, and they are the reason the metaphor is in a
decision record:

- **Fin's answers are anchored, not invented.** A response should trace to a written
  article. Where no article covers the question, that absence is a signal that a document
  must be written, and it should be captured rather than improvised over.
- **The same technical fact is delivered differently depending on the advisor's state.**
  A panicked user at 9am and a curious one on a Sunday get different registers of the same
  truth. This is the requirement generic help systems do not meet.

### 4. One knowledge source, two projections

**Problem found during review.** Fin ships skills at `/usr/share/sp-plus/fin/skills/`.
Welcome ships seventeen articles in `app/help-data.json`. These are two parallel bodies of
knowledge about the same machine, in different formats, in different directories,
maintained by different work. They will drift, and the drift becomes visible at the worst
moment: Fin confidently contradicting the article on the advisor's screen.

**Decision:** one source of truth, generated into two projections. The articles are what
the advisor reads. The skills are what Fin reads. Neither is authored twice.

### 5. Fin holds full root, and the guardrails go where the damage is

Fin runs as the advisor, who is in `wheel`, which already carries
`%wheel ALL=(ALL) NOPASSWD: ALL`. **This is existing shipped state, not a new grant.**
The reasoning is already written in `sudoers-sp-plus`: Fin cannot answer a password
prompt, the advisor often cannot either, and a prompt the user cannot satisfy buys no
security while stopping every genuine repair.

**Correction to the containment argument, and it changes where guardrails belong.**
Immutability protects the operating system, not the practice. `bootc rollback` restores
the deployment and `/usr`. It does not restore `/var` or `/home`, where every client
document lives. The blast radius that matters to an advisor is precisely the one the
architecture does not cover. Guardrails therefore concentrate on the advisor's files and
machine state, and stay relaxed about `/usr`. This is the opposite of where instinct puts
them.

**Verified 2026-08-28 on the running `spplus-uefi` guest.** Evidence, not recall:

- The stateroot `/ostree/deploy/default/` contains `deploy/`, `var/` and `backing/`.
  **`var` is a sibling of `deploy/`, not a child of any deployment.** A rollback selects a
  different entry under `deploy/`; `var` is not part of that selection and is untouched.
- `/home` is a symlink to `/var/home`, so **the advisor's documents live inside that shared
  `var`** and are equally unaffected by a rollback.
- `/etc` **is** per-deployment: `/ostree/deploy/default/deploy/<checksum>.0/etc` exists.
  So a rollback does restore that deployment's `/etc`, subject to the usual three-way merge
  of local changes. The record does not claim otherwise, but the asymmetry matters: `/etc`
  is partly protected, `/var` and `/home` are not at all.
- The root filesystem mounts as `composefs ... ro`, confirming the read-only image.

The practical consequence stands and is now evidence-backed: **rollback is not a recovery
path for anything the advisor owns.**

### 6. Fin is cloud-first, so the read boundary is a data-egress boundary

Fin uses cloud AI almost exclusively. Local inference when hardware pricing permits.
Everything the advisor types, and everything Fin reads on their behalf, leaves the
machine. The read rule is therefore not a permission model. It is an egress model.

| Class | Fin's access |
|---|---|
| System files, configs, logs, service state | **Full read, no prompt.** This is what fixing things requires. |
| Document **names** (pdf, xls, docx and similar) | **Readable, no prompt.** |
| Document **contents** | **Per file consent, every time.** |
| Mail store | **Protected content. Per item consent, at all times.** |

When the advisor says "read this," Fin asks to verify. The advisor agrees, and the
liability for that content sits with the advisor.

### 7. Enforcement is mechanical, never prompted

**A system prompt is not a guardrail.** Fin has root. Instructional text telling a model
not to read client documents is a request that can be argued around, and it fails silently
on the one occasion it matters. The boundary lives **in the read path**: document contents
cannot reach the provider unless a consent record exists for that file. Prompt text may
explain the rule to Fin. Only the tool layer can enforce it.

### 8. Consent must be specific, or the liability transfer is decorative

A single "allow Fin to read my files" checkbox becomes a thing the advisor clicks through
in week one and forgets forever. What makes the transfer real:

- Per file, at the moment of asking.
- Naming the file, and stating plainly that its contents will be sent off the machine.
- Written to a log the advisor can read afterward.

That log is also the only way the practice can answer a regulator asking what left the
machine.

### 9. Mail: standing grants scoped to an account, not a modal per message

**The contradiction this resolves.** Per item permission works for one PDF. It breaks on
automation. Advisors need Fin for marketing, administration and multi-account
administrative work, which means recurring unattended access to hundreds of items. Asking
every time either prevents the automation from existing, or trains the advisor to click
yes without reading. The second is worse than no prompt, because it looks like consent
while being reflex, and it collapses the liability transfer the whole model rests on.

**Resolution.** Consent for mail becomes a **standing grant**, not a dialog:

- Scoped to **one account**. Advisors keep separate accounts for separate duties, so the
  account is the natural unit.
- Names a **purpose** and an **expiry**.
- **Visible in one place** inside Welcome, showing what it has read.
- **Revocable in one click.**
- Ad hoc reads outside any grant still prompt per item.

Permission is then present at all times as a live, inspectable authorization, rather than
a dialog the advisor dismisses.

### 10. Fin composes mail. Fin does not send it.

Reading mail and sending mail are different permissions, and the second is the dangerous
one. An advisor's regulatory exposure and reputation sit on what leaves their account.
**Fin writes the draft into the account. The advisor reads it and presses send.** One
click, and an entire category of unrecoverable mistake disappears.

### 11. Payroll is out of scope for now

Payroll is not email. It is financial transactions and employee personal data, and it
carries a different liability class from client correspondence. Keep it out until the mail
model is proven in the field.

---

## Gaps in the read rule, stated so they are chosen rather than discovered

**Filenames are client data.** `Robert Chen 2026 IRA rollover disclosure.pdf` carries a
client name, an account type and an event, and under decision 6 that string goes to a
cloud provider without a prompt. For an advisory practice the client list is itself
protected material. The trade may still be correct, because Fin cannot help with a file it
cannot name. **It must be chosen deliberately.**

**Extension matching misses the worst stores.** The rule names pdf, xls and docx. All of
the following are root-readable, highly sensitive, and do not look like documents:

- The Thunderbird mail store. Covered by decision 6, but by policy rather than by extension.
- The KeePassXC database.
- Browser profiles.
- `/etc/sp-plus/shares/*.cred`, which DN-26 puts on disk in cleartext.

A file-type denylist will not catch these. The classifier needs to be built from the
sensitive stores outward, not from the document extensions inward.

## Consequence for the shipped product, required before the next ISO

**Screen five of Welcome currently states that no data is sent.** With cloud Fin as the
help engine that statement is false. It must be rewritten before the next build ships.
This is a product-truth defect, not a wording preference.

## Open questions for the panel

1. Is "names yes, contents no" a coherent privacy boundary when filenames routinely carry
   client identity? What would a defensible alternative look like that does not cripple
   the assistant?
2. Is a scoped, expiring, revocable standing grant a real consent instrument for a
   regulated practice, or does it fail the same way blanket consent does?
3. Where should the sensitive-store classifier get its list, and how does it stay correct
   as applications are added to the image?
4. Full root plus a cloud model plus a non-technical operator. What is the failure mode we
   have not named?
5. Is generating articles and Fin skills from one source the right coupling, or does it
   over-constrain content written for two genuinely different readers?

## Status of implementation

**Nothing in this record is built.** Decision 5 describes existing shipped state. Every
other decision is unimplemented. The two items with a hard deadline of the next ISO are
the screen five correction and a decision on whether any of this ships disabled.

---

# AMENDMENT 1 — after panel review, 2026-08-28

Reviewer: `gpt-5.6-sol` at high thinking, dispatched via Bee. Full review retained at
`/root/bee-runs/20260828T190541Z_dn31-panel-review/out` on CT105 (28,996 bytes).
Christopher ruled on the outcome the same day.

The panel confirmed decision 5 independently, matching the live-guest measurement above.
It rejected the privilege model in decisions 5 through 10 and the liability premise
throughout. **Christopher accepted the correction.** The decisions below replace the
originals where they conflict.

## A1 — Fin runs as its own identity, and holds no sudo

**Superseded:** decision 5, "Fin holds full root."

Fin no longer runs as the advisor. It runs under a **distinct unprivileged identity** with
no entry in `sudoers` and no shell path to root.

**Christopher's reason, and it is a better one than the panel's.** The panel argued
containment. Christopher argued **attribution**: *"this creates a papertrail on who made
the mistake if a mistake happens."*

That is the defect the old design could not fix. Fin ran as the advisor, so every action
Fin took was recorded as the advisor taking it. The two were indistinguishable in the
record, which means there was no paper trail at all -- not a weak one, none. A separate
identity is the minimum condition for the question "who did this" to have an answer. Every
downstream control, audit, incident response and regulatory record depends on it.

**The advisor keeps their own passwordless administration.** `%wheel ALL=(ALL) NOPASSWD:
ALL` stays for the human. It was written to stop a repair dead-ending at a password a
non-technical owner cannot recall, and that reasoning is untouched by this change. Taking
it from the advisor would restore the original problem and would not add one line to the
paper trail, because the advisor was never the ambiguous actor. **Fin was.**

*Interaction with DN-13, flagged not resolved:* DN-13 holds that the `spplus` service
identity must never gain admin rights. Fin's identity must therefore be a **separate**
identity from `spplus`, and it does not "gain admin rights" -- it gains the ability to
*request* named operations from a broker that holds them. Confirm this reading against
DN-13 before implementing.

## A2 — Privileged work goes behind a typed broker

**Superseded:** decision 7, which put the boundary inside the authority it restrained.

The panel's structural finding, accepted: a gate that runs inside the process it governs
is not a control. With root and a shell, Fin could read a protected file with `sudo cat`,
copy it somewhere unprotected, or stop the gate.

Privileged operations move to a **root-owned broker** that Fin cannot modify. It exposes
**named, typed operations** -- "restart this allowlisted unit", "query printer status",
"mount this configured share" -- and **never `execute(command)`**. An operation that is not
on the list does not exist.

Each brokered call records the requesting identity, the operation, its parameters, the
result and the time. **That record is the paper trail A1 exists to produce.** The broker is
not primarily a permission wall; it is the instrument that makes attribution possible, and
the permission wall is a consequence of building it properly.

## A3 — The liability sentence is withdrawn

**Removed:** "the liability for that content sits with the advisor," and every variant.

Under Regulation S-P the operator's click is not the consumer's consent, because the
advisor is generally not the consumer whose information the file contains. Safeguarding and
breach-notification duties remain with the practice regardless of who clicked. Consent
remains worth collecting as an authorization control and as evidence. **It is not a
transfer of responsibility, and the product must never claim it is.**

This needs a real compliance opinion. It is outside what this project can settle from a
model review, and it should not be treated as settled by this record.

## A4 — The guardrail extensions are demoted, not removed

`config/fin-extensions/spplus-guardrails.ts` and `spplus-protected-paths.ts` (commit
`f2b5507`, 49/49 on `tests/fin-extension-gate.mjs`) were written before this amendment,
when Fin held root. Under A1 and A2 they are **no longer the boundary**. They remain as a
second layer that catches accidents and mistakes cheaply.

Their one inversion needs revisiting once the broker exists: they deliberately **do not**
gate `sudo`, because sudo was Fin's job. Under A1 Fin has no sudo at all, so that carve-out
becomes dead weight rather than a deliberate allowance.

## A5 — No offline fallback is required. Ruled.

The panel raised that cloud-first help fails during the network outages an advisor most
needs help with. **Christopher ruled this is not a product obligation.** An advisor facing
an outage either funds local inference hardware or calls someone, and a network-level
outage is on the far side of the hardware-and-network line this product deliberately draws.
They would have called for that class of problem regardless. Recorded so it is not
reopened as an oversight.

## Carried forward, unresolved

These panel findings were not ruled on and remain open:

1. **Indirect prompt injection.** A crafted email or document can carry instructions aimed
   at Fin. A1 and A2 shrink the blast radius enormously but do not address parsing
   untrusted content in a context that also holds tools. This is now the largest unhandled
   risk in the design.
2. **Filenames should be treated as content**, not metadata. The panel went further than
   the record's own flag and recommends local identifiers with the real name revealed only
   under the same authorization as contents.
3. **Egress.** A read gate is not an egress control. Data can leave by DNS, URL, telemetry,
   crash report or command argument.
4. **Decision 6 contradicts decision 9** on whether mail is per item or account scoped.
   Drafting error, still unfixed.
5. **Screen five may be false today.** Fin already uses cloud inference, so the "no data
   sent" claim may be wrong on the shipped product rather than only after this design lands.
