# Handoff

## Baton

ClaudeBox holds it. Date: 2026-08-25. (Bee completed a documentation pass and released the branch; gpt/other actors hold in-flight build work on this same branch.)

## Where it stands

SP+ documentation package is complete and pushed on `session/sp-plus-plan`: `docs/SP_PLUS_LANDING_CONTENT.md` (positioning copy blocks, 10-step user journey, master disclaimers in short/full pairs with counsel-review flags, approved-vs-banned language table, FAQ, regulatory appendix) and a 17-file plain-English knowledge base under `projects/sp-plus/knowledge/` (`advisor-help/`, `troubleshooting/`, `security/`, plus `README.md` voice rules for PWA builders). Zero em dashes enforced; all cross-links verified; gpt's uncommitted in-flight changes (`projects/sp-plus/installer/iso.yaml`, `projects/sp-plus/scripts/build-iso.sh`, untracked `grafix/`) were preserved untouched. Installer POC status is unchanged from `b8e9fac`: ISO installs encrypted and boots to login; live VM SSH inventory remains blocked.

## Next move

Wire the knowledge base into the PWA help surface: render `projects/sp-plus/knowledge/**/*.md` as articles following `knowledge/README.md` ordering, starting with `advisor-help/welcome.md`.

## Blocked on

Nothing blocking documentation. Separate standing blocker: live SSH access to the running snapshot-backed QEMU guest (see `~/.pi` local handoff on Beelink).

## Tried and rejected

Spawning subagents via the pi-subagents extension tool was unavailable this session; equivalent isolation achieved by dispatching two headless `pi --no-session -p` research workers inside one blocking bash call writing to /tmp. Backgrounding workers across separate bash calls fails because processes are reaped when the call ends.
