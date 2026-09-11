---
name: notebook
description: Keep and look things up in the advisor's notebook, which is the running record of what you have worked on together, what they decided, and how they like things done. Use at the start of a conversation to find out what is already known, whenever the advisor says "remember this", "make a note" or "write that down", and whenever something gets settled that would be tedious to explain a second time.
---

# The notebook

The notebook is the advisor's own record, kept in plain text files they can open
and read. It is the reason they do not have to explain the same thing twice.

It lives in **Documents/Fin/Notebook**. Three kinds of page go in it, and the
`kind:` line at the top of each page says which:

| kind | What it holds | Where it goes |
|---|---|---|
| `profile` | How they like things written | `voice.md` |
| `session` | What you worked on, one page per conversation | `sessions/YYYY-MM-DD-topic.md` |
| `note` | Something learned or decided that stays true | `notes/topic.md` |

## Read it before you start

At the beginning of a conversation, read **Documents/Fin/Notebook/README.md**.
That is the index, and it is rebuilt automatically, so it is always a true list
of what is there. Open whatever looks relevant before asking the advisor
questions they have already answered. Being asked the same question twice is the
thing that makes an assistant feel like a stranger.

If the notebook is empty, that is the normal state of a new machine. Do not make
a ceremony of it.

## Writing a page

Write the whole page with the write tool. Do not patch a page with an edit; the
timestamp header is maintained for you on a full write, and a partial edit can
leave it stale.

You do not write the header yourself. Save the page with your content and the
title, kind, created date, updated date and the name of the model that wrote it
are added for you. If you do include a `kind:` or `title:` line, that is kept.

Keep a page short and specific. One subject per page, a heading, and prose a
person would say out loud. A note that needs to be read twice is a note that
will not be read at all.

## What never goes in the notebook

**No names and no personal details.** Not a client's name, not an email address,
not a phone number, not a street address, not a date of birth, not a policy or
account number. The notebook builds up over months in a folder that may well be
backed up or synced somewhere, and a record like that turns into a contact list
if nobody is strict about it.

Write about people by what they are to the practice: "the client", "the
carrier rep", "the advisor's assistant". If you genuinely need to tell two people
apart on the same page, call them "Client A" and "Client B", which means nothing
on its own.

This is enforced, not requested. If a page contains one of those details the save
is refused and you are told which kind was found. When that happens, rewrite the
sentence without the detail and save again. Do not argue with it and do not try
another route to the same file.

Amounts, dates, product names, carrier names, and what was decided are all fine.
Those are what the notes are for.

**Letters and emails are different.** Anything written *to* a named person
belongs in **Documents/Fin/Drafts**, where naming them is exactly right. The
notebook is for what you learned, not for what you sent.

## The index looks after itself

Never write or edit `README.md` in the notebook. It is regenerated from the
pages every time one changes. If the advisor asks for a table of contents, they
already have one; open it and show them.

## When the advisor asks for something to be remembered

Say, in one sentence, what you wrote down and where. "I've made a note about how
your renewals work, in your notebook." Do not read the file back to them and do
not describe the frontmatter. They asked you to remember something, not to
narrate a filing system.
