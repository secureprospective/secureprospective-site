# Fin roadmap — the agreed position, and the two decisions that gate it

**Date:** 2026-09-12
**Status:** agreed by Christopher, 2026-09-12. Analysis only; no implementation authorized.
**Synthesises:** `docs/from-claude/2026-09-12-fin-skills-and-extensions-roadmap.md` (Claude/Tom)
and `docs/from-bee/2026-09-12-fin-advisor-office-skills-extensions.md` (Bee).

---

## 1. The part that is live today, not roadmap

Fin runs on a ChatGPT Plus account. Confirmed on the running v0.11.1 VM: signed in as
`secureprospective@gmail.com`, model GPT-5.5, no Anthropic key present.

**No extension gates reading.** `spplus-workspace.ts` says so in its own header — reads are
untouched, and whether a document's contents may be sent to a cloud provider is "a different
control (DN-31 decisions 6-9) and is not implemented here."

Meanwhile `config/fin-system-prompt.md` tells the advisor that client data never leaves the
machine.

So an advisor who asks Fin to summarise a client statement has already sent it. On the
2026-09-12 probe run the only thing that prevented this was the model declining, in its own
words, because the file "looks like a client file". That is goodwill, not a control — and it
is the same goodwill that removed the file manager fifteen minutes later without asking.

For a careless advisor this is the highest-consequence gap in the product, and it is not a
future item.

## 2. What the 2026-09-12 guardrail work is, and is not

Three commits landed that day (`f912a3d`, `6c0032f`, `35bee63`), taking the extension gate
from 49 to 110 passing cases, each batch mutation-tested red.

They are a **floor, not a boundary**, which is what the code comments already claim. Every
one is a regular expression over command text, evaluated in the same process as the model.

That is the correct control for a careless advisor and a cooperative model. Its structural
limit was demonstrated twice the same day: **it matches spellings, not intent.** Four rules
guarded adding a software source; Fin reached a fifth route and added an unsigned repo,
which also disabled the machine's update path. Ten further open routes were then closed by
enumeration. Enumeration always loses eventually.

**The durable answer is the typed broker both reports reach independently.** Fin asks for
"restart printing"; a root-owned service decides. Fin stops composing arbitrary shell that a
pattern must judge. This is the same inversion `spplus-workspace.ts` already made for writes
and explains as the point: permit one thing and refuse everything else is wrong only in the
safe direction.

**Keep the regex floor** — it is shipped and it catches real accidents. **Build the broker**
— it is what holds as Fin grows.

## 3. Where the two reports agree

Taken as settled:

- Administration and advisory support are the two empty departments.
- `after-the-meeting` is the highest-leverage single skill.
- The redaction/PII boundary and client-facing output control are both P0, and neither exists.
- Five things are never built: anything that sends, a CRM, client-facing chat, local model
  inference, and browser automation of carrier portals.

## 4. Where they differ, and what is adopted

| Question | Adopted |
|---|---|
| Product thesis | **Bee's.** "Fin prepares the work of four missing staff; the advisor retains every professional, approval, and external-action decision." Tom's "Fin is the four missing staff" is the better pitch and grants more authority than should be written down. Keep it for the sales conversation, not the spec. |
| Class model | **Bee's third class.** Skill / extension / system service. This is the load-bearing addition; an in-process extension is not a hostile-process boundary. |
| Catalogue and sequencing | **Tom's.** 28 items against Bee's 44, tighter and more buildable. Sequence from Tom; put Bee's boundary architecture underneath it. |

## 5. The two decisions that gate everything else

**D1 — the privacy contradiction.** The system prompt promises client data never leaves the
machine; the product is cloud-first; DN-31 contemplates per-file consent. Consent does not
make "never leaves" true. Three ways out: change the promise to something true, handle client
documents locally and deterministically only, or make per-file consent a real gated mechanism
rather than a sentence. **No advisory or client-document skill can be scoped until this is
settled.**

**D2 — broker before skills.** Both reports say the boundary ships before any new capability.
That means the first wave contains nothing the advisor can see, which is the discipline, and
it is a deliberate cost to accept or reject.

Both are Christopher's calls. Neither is made by this document.

## 6. Standing

Nothing from either report has been implemented. The three guardrail commits are source-only
and rule-level; by the project's own standard they are not done until they run in an image,
and they additionally need probing against live Fin on the v0.11.2 VM — the 2026-09-12 lesson
being that reading the rules found nothing and running Fin found the hole.
