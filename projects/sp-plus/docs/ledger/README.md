# SP+ Maintenance Ledger

This directory is read FIRST by any agent starting SP+ work. It is the living record of build evidence, rejected approaches, open questions, and hardware coverage.

- `DO-NOT.md` records proven or predicted approaches that must not be repeated.
- `WORKS.md` records techniques that passed a gate, with reproducible evidence.
- `TODO.md` records open decisions and blocked work.
- `HARDWARE-MATRIX.md` records machines installed on and their test limits.
- `runs/` holds one append-only dispatch record per spike; `.gitkeep` preserves the directory before the first run.

The two standing rules:

1. **Before your first command:** read `DO-NOT.md` and `WORKS.md`. You may not re-attempt anything listed in DO-NOT without stating why the listing is wrong.
2. **Before you report:** append your result to the ledger — including failures, with the exact error text. A dispatch that reports without a ledger entry is rejected.

An entry is worthless without its error signature or its artifact digest. Record the exact command, output, environment, and verdict so the engineer maintaining SP+ in October can reproduce the decision.
