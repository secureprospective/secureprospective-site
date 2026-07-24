// Throwaway diagnostic: confirms the ECOSYSTEM_DB D1 binding is actually reachable
// at runtime, rather than trusting a dashboard report. Delete after use.
// GET /api/_verify-ecosystem-db

interface Env {
  ECOSYSTEM_DB?: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.ECOSYSTEM_DB) {
    return new Response(
      JSON.stringify({ bound: false }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const tables = await context.env.ECOSYSTEM_DB
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  return new Response(
    JSON.stringify({ bound: true, tables: tables.results }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};
