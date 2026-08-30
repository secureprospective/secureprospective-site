# DN-41 — Share check hangs on bad credentials; Fin summary is truncated prose

Found by the DN-38 headless self-test on the Dell (192.168.1.134), 2026-08-30,
on the first boot of image `test44` (`sha256:8b00f0ec…`). Both defects are in
the advisor-visible path.

## Defect A — infinite ask-password loop reported as a network timeout

`check-share-reachable` returned:

> The server did not answer in time. It may be busy or blocked by a firewall.

That message is false. Probing GVFS directly on the same host, with the same
SMB server, it answers in well under a second:

```
smb://127.0.0.1/Shared → Failed to mount Windows share: No such file or directory
smb://127.0.0.1/test   → Anonymous access denied
```

**Cause.** `ShareCheckWorker.run` connected `ask-password` and replied
`HANDLED` with the same credentials *every* time GVFS asked. GVFS re-emits
`ask-password` on each authentication failure, so the handler fed the same
rejected password back forever. The mount never settled, `_await_async` hit
`MOUNT_TIMEOUT` (25s), and the timeout branch — which assumes a slow or
firewalled server — produced the message. `_message_for_gerror`, written
precisely to classify this case, was never reached.

This is the field-critical case: an advisor mistypes the office password and is
told their firewall is broken.

**Fix.** Answer once; `ABORT` any re-ask. A rejected credential then surfaces as
a real `GError`. Because an aborted mount reports `FAILED_HANDLED`, which
`_message_for_gerror` reads as "the advisor cancelled", the run tracks the ask
count and maps `asks > 1 + FAILED_HANDLED` to the credentials message instead.

## Defect B — the Fin button's summary was chopped-off engineering caveats

`check-computer` passed, but the summary shown to the advisor was:

> Values in the tables above are read from the running system at generation
> A setting's stored value and its actual effect are not the same thing. KDE

Both cut mid-sentence.

**Cause.** The harvester took every line beginning `- ` from `THIS-MACHINE.md`.
The only such lines in that document are the two engineering caveats under
`## Notes`, and they are hard-wrapped, so `line[2:]` yields a fragment. The
real state — `## Update health`, and the hardware and image tables — is in
headings and table rows, which the harvester ignored entirely.

**Fix.** `ComputerCheckWorker._summarise_machine_doc` reads the
`## Update health` heading and named table rows (`DOC_FIELDS`). Verified
against the Dell's real document:

```
Updates: working
Image: 192.168.1.190:5000/sp-plus-kde:test44
Layered packages: none
Memory: 7808 MB
Root disk: /dev/sda — spinning HDD
Wi-Fi interface: wlp2s0 — power save: off
```

Edge cases exercised: broken health (`Updates: BROKEN`), empty document,
malformed tables, headings with no tables, and a notes-only document — the last
being the old bug's source, which now yields nothing rather than fragments.

## Defect C — the self-test expectation was unsatisfiable

`EXPECT['check-share-reachable']` was `True`, but the fixture deliberately
supplies a fake password, so `ok:true` was impossible: the check could only
ever fail. Its own comment said it tested reachability while its expectation
demanded a successful mount.

Both share cases return `ok:false`, so `ok` alone cannot distinguish a working
path from Defect A. Added `EXPECT_MESSAGE`, asserting that a *reachable* server
yields a credentials verdict and an *unreachable* one yields a network verdict.
That is the assertion that actually catches Defect A, and it is now the thing
standing guard over it.

## Verification

Run on the Dell against the patched source, image `test44` booted:

| Verb | Before | After |
|---|---|---|
| check-computer | PASS (bad summary) | PASS, six real facts |
| check-share-reachable | FAIL — "did not answer in time" | PASS — "username or password was not accepted" |
| check-share-unreachable | PASS | PASS |
| print-test | REPORTED | REPORTED |

Whole run: ~25s of dead hang → **7 seconds**.

Not covered: a real office server with real working credentials. The success
path still has never been exercised against live infrastructure.

---

# DN-42 — the summary was unreadable: white on grey

Reported by Christopher at the Dell, on the shipped build: *"I clicked 'Have
Fin check my computer' and it populated some text but i cant see most of it as
its white on grey."*

Three separate faults, none of which a green build could see.

**1. `.check-summary` had no CSS rule at all.** The `<ul>` shipped unstyled, so
it inherited `color:#fff` from `.fin-brief`.

**2. It overflowed the section it lived in.** `.fin-brief` is a flex column with
`min-height:440px` on a blue ground. Six rows plus two buttons exceed that at
1366x768, and the excess did not clip — it rendered *outside* the blue section,
over the silver `.screen` behind. Inherited white on `--silver`: exactly what
Christopher saw. First attempt at a fix made the panel legible but only moved
the overflow onto the OPEN FIN button, which was then pushed off the bottom.
The screenshot is what showed that; the passing self-test could not.

**3. `display:grid` overrides `[hidden]`.** The list carries the `hidden`
attribute until a check runs, but a `display` declaration beats the UA
stylesheet, so an empty bordered box rendered on arrival at the screen.

**Fix.** The list moved into the `.fin-ledger` column, which is white, already
half empty, and under no height pressure. It carries its own background and
colour so it cannot be broken by whatever it sits on, plus an explicit
`[hidden]` rule. Verified by screenshot on the Dell in both states: populated
(six readable rows, both buttons visible, nothing on grey) and empty (no box).

**Gate.** P-21 checks all of it: structural parsing, no `- ` harvester, the ask
counter and ABORT, `EXPECT_MESSAGE`, the CSS rule with its own background and
colour, the `[hidden]` rule, and that the list is inside `fin-ledger`.
Negative-tested by reintroducing each defect; each was caught with the right
diagnosis.

## The lesson

Every DN-41 verb passed while DN-42 made the result unreadable. A self-test
proves the payload is right; it says nothing about whether a human can read it.
Rendered output needs an eye or a screenshot, and this feature had never had
either until Christopher clicked the button.
