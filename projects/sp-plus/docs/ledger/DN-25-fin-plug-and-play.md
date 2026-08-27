# DN-25 — Fin must be plug and play

Status: OPEN. Queued for cycle33 on Christopher's instruction 2026-08-27
("dont fix it now, it needs to be fixed in the next cycle").

## What he said

"the ascii art on Fin looks good. how ever we need to open up Pi a bit more.
it needs to be plug and play"

This follows his earlier ruling that the old four-item menu was "waaay to
restrictive" and that Fin should be the real Pi TUI. The banner and the TUI are
confirmed good on cycle32 -- the shoal renders, dot-8 intact. The remaining
complaint is about how open and how frictionless Fin is.

## What is already NOT the problem

Worth recording so cycle33 does not chase it: Fin does not restrict Pi's tools.
The launcher passes no `--no-tools`, no `--tools` allowlist and no
`--exclude-tools`, so read, bash, edit and write are all live, and skills and
extension discovery are both enabled. The system prompt is permissive by design
and explicitly tells Fin to act rather than hand the advisor steps to type.

## The candidate gaps, none yet confirmed with Christopher

1. **The API key prompt.** First run asks the advisor to paste a key from their
   welcome email. That is the single largest departure from plug and play, and
   it is constrained: the ISO must never carry a credential, so the key has to
   arrive some other way. `/etc/sp-plus/fin.env` already exists as a per-machine
   path a deployment step could write.
2. **No memory between runs.** The launcher `exec`s pi with no `--continue`, so
   every start is a blank session. An advisor who asked something yesterday
   finds Fin has forgotten it.
3. **Model is fixed** to `claude-sonnet-5` with no `--models` cycling.
4. **Extension install on an immutable OS.** `pi install` writes to the global
   prefix under a read-only `/usr`. User-scope installs need to be shown to work
   before Fin can extend itself.

## The question to settle BEFORE building cycle33

"Plug and play" reads two ways and they are different builds: frictionless SETUP
(the advisor never sees a key prompt) versus a more capable AGENT (memory across
sessions, self-extension). Ask Christopher which he means, or whether he means
both, rather than guessing -- a build is roughly fifteen minutes and a guessed
fix teaches nothing.
