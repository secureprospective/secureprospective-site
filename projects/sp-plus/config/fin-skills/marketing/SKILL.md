---
name: marketing
description: Build a one-page flyer, handout, event invitation, seminar sheet or simple design for the advisor's own practice, and export it as a PDF they can print or send. Use whenever the advisor asks for a flyer, handout, one-pager, brochure, invitation, poster, logo idea, social graphic, or help making something look presentable.
---

# Making something for the advisor's practice

The advisor is marketing a regulated financial practice. Two things are true at
once and both matter: they need something that looks professional without hiring
a designer, and anything a client might see carries rules that a nice-looking
flyer does not exempt them from. Read the compliance section before you write a
word of copy.

## What is already on this machine

Nothing needs installing. Verified present in SP+:

- **LibreOffice** — writes and converts documents. `soffice --headless
  --convert-to pdf <file>` turns HTML, ODT or DOCX into a PDF.
- **ImageMagick** — `magick` for resizing, cropping, converting and simple
  composition.
- **Ghostscript** — `gs` for combining or compressing PDFs.
- **224 font families**, including IBM Plex Sans, Liberation (metric-compatible
  with Arial/Times), Carlito (Calibri), Caladea (Cambria) and Noto.

If they want a full design application, tell them Welcome's **Optional Tools**
can add Inkscape, GIMP or Scribus. Do not install one to answer a one-off ask;
what is here already makes a good one-pager.

## How to build a one-pager

Write **HTML with inline CSS**, then convert it. It is the fastest path to
something that looks deliberate, and it is easy to adjust when they want a
change.

1. Ask what it is for, who reads it, and what the one action is. A flyer with
   two messages has none.
2. Write the file into **Documents/Fin** — that is the only place Fin writes.
3. Convert:
   `cd ~/Documents/Fin && soffice --headless --convert-to pdf flyer.html`
4. Tell them where it is and offer to change it. Do not describe the HTML.

Design notes that do more than fiddling:

- One typeface, two sizes, one accent colour. Restraint reads as competence.
- Real margins. Crowding is the single thing that makes a page look homemade.
- Their name, credential, firm and one contact route. A flyer nobody can act on
  is decoration.
- Left-aligned body text. Centred paragraphs are hard to read.

## Compliance — the part that is not optional

Advisor marketing is regulated communication. Under FINRA Rule 2210 and the SEC
Marketing Rule, material that goes to clients or the public is typically subject
to firm review, approval and retention, and the advisor is the one exposed if it
goes out without it. You are not the compliance department and you must not act
like one.

So, every time:

- **Say it plainly, at the end, in their words:** this is a draft, and their
  compliance officer or firm needs to approve it before it goes anywhere.
- **Never invent** a performance figure, a return, a rate, a ranking, an award,
  a credential, a testimonial or a client quote. If they want a number in it,
  they supply it and it stays exactly as given.
- **Never write a guarantee**, or anything that promises or implies a result.
  Not "secure your retirement", not "protect your family's future" as an
  outcome. Describe what they DO, not what will happen.
- **Do not write the disclosure text.** Ask them for their firm's approved
  wording and place it as given. A disclaimer you invented is worse than none,
  because it looks official.
- If they ask for something that reads as a promise or a claim, say why it is a
  problem in one sentence, and offer wording that says the same thing safely.

None of this means being unhelpful. Say what they do, who they help, and how to
reach them, in language a person would actually use, and let compliance do its
job on a draft that was written carefully in the first place.
