# Handoff: Google Workspace SOP scaffold (Task C2)

**Date:** 2026-08-15
**By:** Tom (Beelink)
**Branch:** `session/workspace-sop-scaffold`, cut fresh from `origin/main` @ `7749b3c`

## What this closes

`docs/GOOGLE_WORKSPACE_PILOT.md` Phase 0 step 3, which required the portability scaffolding to
exist before real SOPs get written, so no business process ends up living only inside a chat
session. It had never been built. This builds the empty structure only.

## What was created

All new, all under `docs/google-workspace-sops/`. Nothing outside that directory was touched.

- `README.md`: what the directory is, which part of the portability rule it satisfies, the
  index table of the three SOPs, the surface seam rule stated once (Claude Code owns
  Worker/D1/repo, Claude with Workspace connectors owns Gmail/Calendar/Drive, neither does
  everything), and the standing safety rule (Gmail is draft-only, no auto-send, no bulk
  operations, no deletes, a human reviews before anything leaves).
- `_TEMPLATE.md`: reusable skeleton: Purpose, Trigger, Surface(s), Preconditions, Steps
  (numbered, each naming its surface), What "done" looks like, Failure modes, Export path,
  Last reviewed.
- `01-lead-intake.md`, `02-call-booking.md`, `03-weekly-no-touch.md`: three stubs mirroring the
  v1 loop in `docs/NO_CRM_ARCHITECTURE.md` section E. Purpose and Trigger are filled in for
  real; every remaining section is a TODO with a one-line note on what belongs there.

## What was deliberately not done

- No procedure detail invented for workflows nobody has run. The stubs stay stubs on purpose,
  and each says so at the top. Filling them in is a job for the first real run, not for now.
- No fourth SOP. No dashboard, no commission, nothing IMO-side.
- No code, no schema, no migrations, no D1 or connector calls. Markdown only.
- No credentials or placeholders that look like credentials. The only email address appearing
  anywhere in the directory is `secureprospective@gmail.com`.

## Notes for whoever picks this up

The surface seam is stated as a rule in the README rather than resolved per workflow, because
resolving it per workflow requires knowing who is holding the connector session at the time.
Tom's sessions do not hold the connector grant and cannot exercise Gmail, Calendar or Drive, so
none of the three workflows could be run here to fill the stubs in honestly.

Project rule checked: zero em dashes and zero en dashes across all five new files, verified by
grep after the last edit.
