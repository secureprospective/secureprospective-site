# Archive — retired work

Nothing in this directory is live. It is kept because it records decisions and
schema that were real at the time, not because any of it still runs.

## AI ecosystem — retired

`ai-ecosystem/`, `PARKED-AI-ECOSYSTEM.md`, `from-hermes/CT105/`

The knowledge-graph / MCP / orchestration wireframe. Its D1 database was
`secureprospective-ecosystem` (`76a9973f-eef6-4d37-acd3-92e378e04151`), bound to the
Pages project as **`ECOSYSTEM_DB`**. Schema lived in
`migrations/archive/0001_ecosystem_knowledge_graph.sql`.

## InsuranceAgentKit — retired

Its D1 database was `secureprospective-insuranceagentkit-db`
(`fd1b7594-f676-46fc-bb75-4e14c7c890bb`), bound as **`KIT_DB`**, with a
`KIT_TOKEN_KEY` environment variable. Schema lived in
`migrations/archive/0004_insuranceagentkit.sql`, extended by `0005` and `0006` —
of which **0005 and 0006 were written but never applied**.

## What was verified before archiving (2026-09-18)

`ECOSYSTEM_DB`, `KIT_DB` and `KIT_TOKEN_KEY` had **zero references** anywhere in
`functions/`, `src/` or `tests/`. They were bound to the Pages project on both the
production and preview environments and used by nothing. The bindings were removed;
see the commit that added this file.

**The two D1 databases themselves were deliberately NOT deleted.** `KIT_DB` carries
real rows. Unbinding is reversible and loses nothing; dropping a database is neither.
Deleting them is a separate, explicit decision for Christopher.

## Live migrations

Only `0002_backoffice_auth.sql` and `0003_must_change_password.sql` are live. Both
target `BACKOFFICE_DB` (`secureprospective-backoffice-db`), which runs the members
area.

`0007_workspace_v1.sql` is still in `migrations/` but has **never been applied and has
no database or binding** — it belongs to the no-CRM workspace, which the backbone
records as retired on 2026-09-17. It was left in place rather than swept in here,
because it was not named in the retirement this commit acts on.
