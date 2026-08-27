# Fin Coaching Tips — Discovery

## Recommendation

Keep coaching tips, but do not make them random rotating banners. Use a quiet, staged queue of “next useful things Fin can do,” supported by an always-available “What else can Fin help with?” option.

Random tips teach breadth poorly, may arrive before the advisor trusts Fin, and make the product feel like it is advertising itself.

## 1. What the advisor needs over time

### First week: confidence and immediate wins

The advisor needs to learn:

- They can speak normally.
- Fin works on real documents, not just questions.
- Fin produces useful work, not merely explanations.
- They can ask for revisions.
- Fin should show its plan before making broad changes.
- They remain responsible for reviewing the result.

The tasks should be small, visible, and reversible: explain a letter, summarize a statement, draft a follow-up, and make a checklist.

### Second week: combine information

Once trust exists, introduce:

- Comparing documents
- Extracting information from several files
- Creating tables and spreadsheets
- Preparing meeting briefs
- Finding inconsistencies
- Checking drafts against the advisor’s own checklist
- Renaming or organizing groups of documents

This is where Fin stops looking like a search box.

### Second month: repeatable work

Only after the advisor has seen several wins should tips introduce:

- Reusable templates
- Repeatable office procedures
- Meeting packet preparation
- Handoffs to an assistant
- Monthly housekeeping
- Larger batches of routine work

The progression should be based on active use as well as elapsed time. An advisor who opens Fin twice in a month should not suddenly receive advanced workflow suggestions.

## 2. Candidate tip copy

These are candidate strings, not promises. Each must correspond to a capability tested in the actual Fin build.

### First week

1. **“Give Fin a letter or statement and ask, ‘What are the three things I need to know?’”**

2. **“Fin can turn a long statement into a short list of names, dates, amounts, and next steps.”**

3. **“Ask Fin to explain a confusing carrier letter in plain English—and list what the letter still does not answer.”**

4. **“Give Fin your rough meeting notes and ask for a clear follow-up email in your usual voice.”**

5. **“Fin can pull every action item out of a meeting note and turn them into a checklist.”**

6. **“You do not have to get it right the first time. Tell Fin what to shorten, change, or add, and it will revise the work.”**

7. **“Before Fin changes a group of documents, ask it to show you what it plans to do and wait for your approval.”**

8. **“Ask Fin to make a one-page summary of a document you need to discuss with a client.”**

### Second week

9. **“Give Fin two versions of a document and ask it to show only what changed.”**

10. **“Give Fin several statements and ask it to put the important information into a spreadsheet.”**

11. **“Ask Fin to find every mention of a person, date, or amount across the documents you are reviewing.”**

12. **“Ask Fin to prepare a one-page brief for tomorrow’s meeting from the documents you choose.”**

13. **“When information is missing or does not agree, ask Fin to draft the questions you need to send.”**

14. **“Ask Fin to check a letter against your own review checklist before you send it.”**

15. **“Fin can give a group of documents consistent names and show you exactly what it changed.”**

### Second month

16. **“Describe a process you repeat, and Fin can turn it into a checklist for next time.”**

17. **“Ask Fin to make a reusable template for your follow-up letters, with the changing details left ready to fill in.”**

18. **“Ask Fin to prepare a complete meeting packet from the documents for one client.”**

19. **“Fin can prepare a handoff for your assistant: what is done, what is waiting, and what happens next.”**

20. **“Ask Fin to review a month’s work and point out unfinished items, duplicate documents, or dates that do not match.”**

Avoid copy such as “automate your workflow,” “run a batch,” “use a prompt,” or “query your files.” Those describe the technology instead of the benefit.

Also avoid implying that Fin makes suitability, legal, or compliance decisions. “Check against your checklist” is appropriate; “make sure this is compliant” is not.

## 3. When tips should appear

### First launch

Show one compact welcome tip after Fin’s initial greeting:

> **Try this first:** Give Fin a letter or statement and ask what you need to know and do next.

It should not be a modal dialog or tutorial that blocks work. Include:

- **Try it**
- **Not now**
- **Never show coaching tips**

### Later sessions

Use a staged queue:

- First launch: one basic tip
- Around the third active session: first-week tip
- Around the sixth session: second-week tip
- Around the tenth session or second month: advanced tip

Show no more than one tip in a session.

### After a completed task

This is the best location when Fin has a reliable explicit “finished” moment. Show a quiet line below the result, outside the work the advisor may copy:

> **Next time:** Fin can compare two versions of a document and show only what changed.

Do not have the model guess that every response is complete. If there is no explicit completion state, show the next tip at the beginning of a later session instead.

### On a schedule

Do not use clock-based reminders, desktop notifications, or tips that appear in the middle of active work. The schedule should be based on use milestones, not “every Tuesday” or “every five minutes.”

### Always available

Add a non-intrusive entry on the welcome/help surface:

> **What else can Fin help with?**

That opens the full capability list or lets the advisor request another example. This is more important than increasing the rotation rate.

### Turning tips off

Provide both:

- An inline **Never show coaching tips** choice
- A persistent setting under a clearly named area such as **Coaching tips: On / Off**

Also include **Show tips again** so turning them off is reversible.

## 4. Data the feature should keep

The feature needs very little state, all stored in the advisor’s home directory:

- First-run date
- Number of active Fin sessions
- Current coaching stage
- Tip identifiers already shown
- Tip identifiers dismissed or marked not useful
- Whether coaching tips are disabled
- A version number for the tip catalogue

It should not retain:

- Prompts or conversation text
- Client names
- File names or file contents
- Extracted values
- Fin’s answers
- Document hashes
- Usage analytics
- Any data sent to a remote service

The tip catalogue can ship with the immutable image. Per-advisor progress belongs in local user state. The feature should make no network requests and should not add telemetry. A reset/delete option should remove all coaching state.

## 5. The failure mode to design against

The week-one killer is:

> **“Fin is interrupting me and giving me homework before it has proved useful.”**

That happens when tips are:

- Shown at every launch
- Repeated after dismissal
- Presented as popups
- Generic rather than tied to real work
- Suggesting capabilities that fail
- Shown after an error or during a sensitive task
- Written in technical or patronizing language

Design against it by making the first tip immediately useful, keeping it to one per session, never blocking work, respecting dismissal permanently, and only advertising capabilities that have been verified on the shipped system.

The right product shape is therefore not “rotating tips.” It is **progressive capability discovery with a quiet fallback to on-demand examples**.
