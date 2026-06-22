# z.ai Collaboration Prompts — Templates for Reuse

**Purpose:** The z.ai prompts that worked in the SecureProspective session, saved as templates for future visual-design collaborations.

---

## Template 1: Forensic Visual Read (for a logo / brand asset)

Use when: describing a brand asset you can't see, to extract design-system-level intel.

**Key constraints to include:**
- Forbidden words: modern, professional, sleek, clean, premium, sophisticated, elegant, cutting-edge, innovative, high-quality
- Required: literal description, not interpretation
- Structure: composition / symbol / wordmark / actual rendered colors / mood (3 metaphors, no adjectives) / industry signal (top 3) / what it avoids / verdict
- Final rule: do not invent features you cannot see

---

## Template 2: Critical Visual Review (for a rough draft)

Use when: critiquing a draft page against locked design intent.

**Key constraints to include:**
- The locked design intent compactly (brand, mood, color, type, anti-list)
- Forbidden response patterns: flattery, hedging-without-specificity, generic vocabulary, observations-without-fixes, fixes-without-specific-values
- Structure: mood check / top 5 problems ranked / top 3 working / color audit / typography audit / remove one / add one / brutal one-sentence verdict
- Force ranked priorities and specific values (no "more spacing" — must be "add 24px between X and Y")

---

## Template 3: Design Elevation (refine draft into a winner)

Use when: asking z.ai to produce a refined HTML/CSS mockup on top of an existing draft.

**Key constraints to include:**
- Brand essence (locked, do not redefine)
- Mood anchor + invisible direction
- Color + typography locks (with role per color)
- Anti-list (locked, never violate)
- Current state strengths + weaknesses
- Prior critiques already addressed (don't repeat)
- Output format: HTML/CSS mockup + design notes (3-5 key moves + reasoning + what was avoided)
- Forbidden: redesigning brand, flattery, anti-list violations, copy changes to locked copy

---

## Workflow pattern (proven)

1. **Bird (text-only)** does strategy, structure, copy direction, code skeleton
2. **z.ai (multimodal)** does visual perception, design elevation, creative mockups
3. **Gemini (multimodal, second opinion)** provides alternative reads / mockups when z.ai's output needs comparison
4. **Christopher** directs, picks between options, makes final calls
5. **Bird** translates z.ai/Gemini HTML/CSS output back into Astro structure with discipline (tokens, anti-list, component pattern)

The bird-z.ai-Gemini triangle is the solo-mode design loop. Each lane does what it's best at; Christopher is the integrator.
