# SP+ rename log — 2026-08-25

The subproject formerly called **Advisor OS** / **Secureprospective Advisor OS** is now
**SP+**. This file is the authoritative old → new mapping. It exists because CT105
(ClaudeBox) holds hardcoded absolute paths and cannot discover a rename on its own.

Branch: `session/sp-plus-plan`, cut from `session/advisor-os-poc` at `48b033a`.

## Paths

| Old | New |
|---|---|
| `work/secureprospective-advisor-os/projects/advisor-os/` | `work/secureprospective-advisor-os/projects/sp-plus/` |
| `projects/advisor-os/config/advisor-os.service` | `projects/sp-plus/config/sp-plus.service` |
| `projects/advisor-os/config/advisor-os.conf` | `projects/sp-plus/config/sp-plus.conf` |
| `projects/advisor-os/runtime/advisor_rpc.py` | `projects/sp-plus/runtime/spplus_rpc.py` |
| `projects/advisor-os/SESSION-LOG-2026-08-25.md` | `projects/sp-plus/docs/SESSION-LOG-2026-08-25.md` |
| `projects/advisor-os/LIVE-TEST-LOG-2026-08-25.md` | `projects/sp-plus/docs/LIVE-TEST-LOG-2026-08-25.md` |
| `docs/ADVISOR_OS_LANDING_CONTENT.md` | `docs/SP_PLUS_LANDING_CONTENT.md` |
| `~/briefs/secureprospective-advisor-os-build-brief.md` | `~/briefs/sp-plus-build-brief.md` |

The outer repository directory `~/work/secureprospective-advisor-os/` was **not** renamed.
It is a git worktree of `secureprospective-site`, and worktrees store absolute paths; a
rename would need the whole cluster moved together. Left as-is deliberately.

`~/.pi/agent/memory/project_secureprospective_advisor_os.md` became
`~/.pi/agent/memory/project_sp_plus.md`, rewritten around the architecture of record, with
the `MEMORY.md` index link updated and a dated entry appended to
`~/.pi/agent/backbone/context.md`. This was done after Bee's research run finished, so
that nothing wrote into that directory while Bee was using it.

## Identifiers

| Old | New |
|---|---|
| `Secureprospective Advisor OS`, `Secure Prospective Advisor OS`, `Advisor OS` | `SP+` |
| `Advisor RPC` | `SP+ RPC` |
| `Advisor PWA` | `SP+ PWA` |
| `AdvisorOS` | `SPPlus` |
| `advisor-os` (paths, image names, service names) | `sp-plus` |
| `advisor_rpc` | `spplus_rpc` |
| `ADVISOR_OS_ROOT` | `SPPLUS_ROOT` |
| `ADVISOR_LISTEN_ADDRESS` | `SPPLUS_LISTEN_ADDRESS` |
| `ADVISOR_LISTEN_PORT` | `SPPLUS_LISTEN_PORT` |
| `ADVISOR_TEST_PORT` | `SPPLUS_TEST_PORT` |
| `ADVISOR_STATE_DIR` | `SPPLUS_STATE_DIR` |
| `ADVISOR_AI_ENDPOINT` | `SPPLUS_AI_ENDPOINT` |
| `ADVISOR_PRINTER_FIXTURE` | `SPPLUS_PRINTER_FIXTURE` |

## Deliberately not renamed

- The word **advisor** where it refers to the user rather than the product. The knowledge
  base directory `knowledge/advisor-help/` keeps its name, as do phrases like "the
  advisor's browser".
- `docs/from-tom/2026-08-25-advisor-os-artifact-cleanup.md` and the two dated session
  logs, which are historical records. Rewriting a dated log to say something it did not
  say at the time destroys the record. They are cross-referenced by this file instead.
- The `origin` remote and the outer repository name.

## Verification performed

- `git grep -nIE 'ADVISOR_|Advisor OS|advisor-os|advisor_os|AdvisorOS'` over
  `projects/sp-plus/` returns nothing.
- `python3 -m py_compile` on the runtime and tests: clean.
- `bash -n` on every script under `scripts/` and `installer/`: clean.
- `./scripts/test-host.sh`: 3 tests, passed.
