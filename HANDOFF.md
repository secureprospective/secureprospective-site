# HANDOFF

**Baton:** ClaudeBox → open · 2026-09-08

## Where it stands

SP+ has two lanes and one unanswered question: continue on Fedora bootc, or move to Debian 13.
Full state for **both** lanes — what exists, what is verified, what is only planned, what was
learned and what it cost — is in:

`projects/sp-plus/docs/ledger/SP-PLUS-STATE-2026-09-08.md`

Read that first. It is the authoritative document and it is written so an agent can start cold.

Doc 12 (Debian plan) is at revision 2 after three independent audits, on branch
`session/sp-plus-debian-plan`. The Fedora base re-pin is staged on `session/sp-plus-base-repin`
and is **NOT BUILT and NOT GATED** — nothing may ship from it until a rebuild and a full hardware
gate run.

## Next move

Christopher decides Fedora vs Debian. Everything else waits on that. Claude's recommendation is
stay on Fedora, keep Debian as a triggered option; reasoning in §5 of the state document.

## Blocked on

- The lane decision.
- `gh` is not installed on the Beelink, so the Fedora base cannot be mirrored to ghcr yet.
- Pre-existing and unrelated: `test_tampered_playbook_is_blocked` fails. Not caused or fixed here.

## Tried and rejected, with why

- **Recovering the old Fedora base digest.** Not possible. containers-storage keeps layers
  decompressed; the original compressed blobs are gone. `skopeo copy --preserve-digests` refuses.
  Do not retry this — a content archive exists at `/QEMU/base-archive/`, and it is not the pin.
- **Blanket `podman system prune`.** Would delete the last live copy of the `dd672611` base.
  ~30 GB is left reclaimable deliberately.
- **One large dispatch brief.** Ten questions in one brief ran 100 minutes and nearly timed out.
  Split briefs ran 10 and 4 minutes. Split them.
- **Trusting a dispatcher agent's completion report.** One reported success in two seconds having
  never run a command. Check the tree.
