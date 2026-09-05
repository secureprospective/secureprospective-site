# Session handoff — secureprospective.com rework

**Written 2026-09-05.** Self-contained: a session that has never seen this work can start
from this document alone.

**Why now.** Christopher's call, 2026-09-05: the website is Secure Prospective's only
outward appearance, and fixing what is already public costs very little compared with
repeating it across a social-media campaign. Solutions first, then the new channel. The
social project (`~/work/secureprospective-social`) is deliberately parked behind this.

---

## 1. What this site is

| Fact | Value |
|---|---|
| Repo | `~/work/secureprospective-site`, branch `main`, remote `github.com/secureprospective/secureprospective-site` |
| Stack | Astro 4.11.0, React islands, GSAP, CSS custom properties. No Tailwind, no font CDNs. |
| Hosting | Cloudflare Pages. **Production auto-deploys from `main` on push.** Branch pushes make previews. |
| State at handoff | Working tree clean, `origin/main..main` = 0 unpushed. |
| Pages on main | `index`, `the-method`, `the-work`, `services`, `the-operator`, `contact`, `404`, plus `members/*` |
| Worktrees | `secureprospective-site` (main) · `secureprospective-advisor-os` (`session/sp-plus-plan`) · `sp-plus-build` (detached) — **one repo, three worktrees, not three repos** |

**A local commit does not deploy. A push to `main` does.** Per standing rule, a production
deploy needs Christopher's explicit approval for that specific deploy. Preview branches are
the default.

## 2. Where the source material is

Two inventory reports, produced 2026-09-05 by Bee on gpt-5.6-luna, both citing `path:line`
throughout. Read them before making copy decisions; do not re-derive their findings.

- `~/fleet/runs/sp-identity-inventory-2026-09-05/REPORT-voice-identity.md` (39 KB) — voice,
  anti-voice, palette, type, form, motion, naming, gaps.
- `~/fleet/runs/sp-identity-inventory-2026-09-05/REPORT-icp-business.md` (49 KB) — business,
  ICP, proposition, direction, compliance, contradictions.

In-repo sources of truth they draw on: `docs/VOICE-AND-DIRECTION.md`, `PRODUCT.md`,
`DESIGN.md`, `docs/DESIGN_SYSTEM.md`, `src/styles/tokens.css`.

## 3. Corrections to the reports — verified in this session

**Both reports treat worktree HEAD dates as document recency. That is wrong, and it
inverts their headline finding.** Verified directly:

| Check | Result |
|---|---|
| `PRODUCT.md` last touched on `main` | `65aa7db`, **2026-08-26** |
| `PRODUCT.md` last touched on `session/sp-plus-plan` | `21dd25e`, **2026-08-05** |
| Merge base of the two branches | `771d96b`, 2026-08-15 |

The branch copy **predates the merge base**. So the "consulting firm, explicitly not an
insurance retailer" framing is the *older* text, and `main`'s "IMO first, primary audience
today; AI-native transformation must be earned through delivered work" is the *newer,
deliberate* position.

**Consequence: positioning is not in dispute and does not need relitigating.** Lane B
ranked this its #1 contradiction; it is not one. What remains true is that the branch is
456 commits ahead on other work and `main` is 30 commits ahead of the branch.

**`docs/SP_PLUS_LANDING_CONTENT.md` exists only on `session/sp-plus-plan`.** It carries the
banned/approved language table and the full SP+ disclaimer set. It is genuinely newer
material and it is **not on production**. Any public SP+ page has to bring it forward.

## 4. The work, ranked

### W1 — Remove the one banned term now live

`src/pages/the-work.astro:163` reads "The goal is not bulletproof perfection."
"bulletproof" is on the banned security-superlative list
(`SP_PLUS_LANDING_CONTENT.md:208-216`). The sentence uses it in negation, which is the
mildest possible form, but the rule has no negation exemption and this is the only hit in
visitor-facing copy. Rewrite without it.

**Acceptance:** the banned-term scan below returns nothing in `src/pages`.

```bash
grep -rniE "compliant|compliance-ready|bank-grade|military-grade|unhackable|bulletproof|autonomous repair|protect your client data|keeps you compliant" --include='*.astro' src/
```

### W2 — Clear em dashes from the members area

Zero em dashes in anything a visitor reads is a hard rule
(`docs/VOICE-AND-DIRECTION.md:42-51`). Public pages are clean. The members pages are not:

| File | Count |
|---|---|
| `src/pages/members/admin/index.astro` | 9 |
| `src/pages/members/download.astro` | 4 |
| `src/pages/members/index.astro` | 2 |
| `src/pages/members/login.astro` | 2 |
| `src/pages/members/accept-invite.astro` | 1 |
| `src/pages/members/change-password.astro` | 1 |

19 total. A logged-in advisor is a reader, so the rule applies. Rewrite the sentences —
do not swap in a hyphen and leave the comma-splice grammar behind.

**Acceptance:** `grep -rc '—' --include='*.astro' src/pages/` reports 0 everywhere.

### W3 — Write the dated SP+ capability matrix, then govern the SP+ copy from it

Both reports name this the largest live risk: the site presents SP+ as an inspectable
deliverable while the build record has open defects. `SP-PLUS-STATE.md:71-105` (on the
branch) records the LUKS prompt invisible, and the desktop, Fin icon and real Dell hardware
unproven; the cycle20 audit proved login, running system, SELinux state, service RPC and
the Fin TUI on an installed image.

Produce a dated matrix with five states — **proven / active / prospective / blocked /
embargoed** — and make every SP+ sentence on the site traceable to a row. Until it exists,
SP+ copy stays in active-build language. Never "shipped", never "compatible with every
machine", never "ready for general deployment".

**Acceptance:** the matrix is committed, dated, and every SP+ claim in `src/pages` maps to
a row that supports it.

### W4 — Make the SP+ commercial terms unambiguous

The current shape reads as "free" alongside a five-production-contract qualification
(`PRODUCT.md:55-57`, `101-118`). Both are true and together they can mislead. State both
plainly in one place: no software fee and no recurring invoice, **and** access is through a
fit review and five production contracts selected with Christopher. Do not imply zero
commercial consideration.

**Acceptance:** one passage on `/the-work` states both halves; no other page states one
half alone.

### W5 — Bring the compliance language forward from the branch

Port `docs/SP_PLUS_LANDING_CONTENT.md` (banned/approved table, disclaimers, warranty and
compatibility limits, AI-data disclosure) onto `main` and apply it to the live SP+ copy.
Its own header says counsel review is still outstanding and provider-retention language is
an open production decision — carry those caveats across rather than dropping them.

**Blocked on:** Christopher confirming whether counsel review has happened. Do not publish
final legal text on his behalf.

### W6 — Settle name governance

Human copy alternates `Secure Prospective` and `SecureProspective`; some SP+ material has
`Secureprospective`. The working standard the reports infer: spaced **Secure Prospective**
for human-facing prose, closed-up **SecureProspective** for domain, code and existing
lockups, lowercase for the domain itself. `Secureprospective` is drift in all cases.

**Needs a decision from Christopher, then one pass across the site.**

### W7 — Resolve the palette conflict in the docs

`docs/DESIGN_SYSTEM.md:8-18` still calls silver `#C0C0C0`. The live token is
`#E5E4E2` (`src/styles/tokens.css:1-10`), and the 2026-08-27 SP+ brand capture says the old
value is superseded. Update the doc, keep `#C0C0C0` only as marked historical evidence.
Code needs no change.

### W8 — Publish an asset source of truth

Logo and lockup assets live in several trees and the Shorts kit has no flat vector. Write
one manifest naming the current lockup and icon for site, desktop, PDFs and video.

## 5. Voice and visual reference — use this, do not re-research it

**Stance.** The reader is frightened, confused, busy and entitled to an honest explanation,
not a lead to be manipulated. Write beside the reader, never about them. Do not narrate the
reader's fear back to them as a technique.

**Sentence habits.** Short declaratives and precise contrasts. A blunt line, then a brief
explanation. Numbers as records, never as theatre — never more exact than the evidence.
Questions that open a decision, never rhetorical pressure. Uppercase register labels
(`STATE // OPERATING`, `DELIVERABLE 001`) are characteristic. No em dashes. Do not polish
into aphorisms.

**Lines that set the standard:** "Plain language is not a style preference, it is the
product." · "Credibility is spent, not claimed." · "The work is to be genuinely arresting
without ever being loud." · "The partnership comes first. The workstation follows." ·
"Output no one understands is output no one owns."

**Never sound like:** a competitor's strategy deck, a hype AI vendor, generic SaaS, a
compliance-certification seller, a security-superlative seller, or a fear marketer.

**Approved substitutions:** controls and evidence (not compliance) · strong encryption (not
bank-grade) · fixes only after you approve (not autonomous repair) · built to reduce
client-data risk (not we protect your client data) · evidence, not certification.

**Palette** — `src/styles/tokens.css` is the source of truth:
`--silver-base #E5E4E2` · `--blue-brand #0033A0` · `--gold-identity #D4AF37` ·
`--yellow-accent #FFD700` · `--ink #222222` · `--white #FFFFFF` ·
`--fineprint-gray #666666`. Fixed deck, no new hues. **Yellow is background and accent
only, never text on a light ground.**

**Type.** Primal display (self-hosted, uppercase identity face) + IBM Plex Sans body.
Display 72 / H1 48 / H2 36 / H3 24 / body-lg 20 / body 16 / caption 14, 8px rhythm,
12-column 1200px grid. Primal is banned in SP+ product creative — deliberate override, not
drift.

**Form.** Property Card System: flat faces, square corners (radius 0, buttons 2px),
hairline 1px dividers, uppercase labels, Card-Lift shadow `6px 6px 0` with zero blur. Mood
anchor, verbatim: **corporate badge × transit signage × financial ledger × storm shelter ×
vault.** An engineered refuge, not SaaS.

**Motion.** 120-200ms, state-based, ticker/transit-board energy. No bounce, no long reveal,
no parallax. Reduced-motion support required. Hero ambient field: 10×2px dashes, 28px row
pitch, alternating directions, quiet blue with occasional gold sparks, paused off-screen.

**Imagery.** No full-bleed lifestyle photography, no generic AI imagery. Cards, diagrams,
records, controlled texture.

## 6. What only Christopher can answer

W5 (counsel review), W6 (name governance), and the public-claims boundary all stop here
until he rules. The deeper ICP gaps — real advisor and client detail, objections, channels,
review authority, required disclosure — are tracked as the 32-question queue at
`~/work/secureprospective-social/context/interview-matrix.json`; run
`~/work/secureprospective-social/tools/interview-next.sh` to see what is due. The identity
reports already answer 21 of the 32 from existing material.

## 7. Constraints

- **Never push to `main` without Christopher's explicit approval for that deploy.** Push
  produces a live production deploy. Preview branches are the default.
- **Never invent a fact about the practice, the numbers, or the licensing.** The public
  figures are ~8 active producers, ~$18M current annual annuity volume assisted, ~$110M
  assisted over six years, and a Texas Life/Health/Annuity licence. Nothing beyond that is
  documented; do not extrapolate entity structure or other states.
- **Do not merge `session/sp-plus-plan` wholesale.** It is 456 commits of SP+ working-lane
  history and its `PRODUCT.md` is stale. Cherry-pick the documents you need.
- Gina's Financial is a separate business on a separate Cloudflare account. Never mix.
