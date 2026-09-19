// Pages Function: GET/POST /api/events/pull
//
// The seam between the edge buffer and the permanent record. Hermes holds
// the ledger that the dashboard and the weekly, monthly, quarterly and
// yearly reports read; D1 only holds rows long enough for Hermes to come
// and take them.
//
// Queue and acknowledge, the same shape the unsubscribe lane already uses:
//
//   GET   -> the oldest unacknowledged rows
//   POST  -> {"ack": [id, ...]}, once those rows are safely in the ledger
//
// The order is deliberate and must not be reversed. Hermes writes to the
// ledger FIRST and acknowledges second, so a crash between the two costs a
// duplicate rather than a loss, and the ledger de-duplicates by id. A loss
// is unrecoverable; a duplicate is a no-op.
//
// Unlike /api/track this is not public. It is guarded by a bearer token
// held as a Pages secret, because the rows are the business's own numbers
// and a queue endpoint that anyone can drain is a queue that loses data.

import { originAllowed } from "../../_lib/http";

interface Env {
  EVENTS_DB: D1Database;
  EVENTS_PULL_TOKEN: string;
}

// One pull's worth. Large enough that a quiet day is a single request,
// small enough that a backlog cannot produce a response nobody can parse.
const BATCH = 500;

const MAX_ACK = BATCH;

// How long an acknowledged row is kept as a replay buffer against a bad
// ledger write. Not a retention policy: the ledger is the archive, and
// nothing is ever reported out of this table.
const KEEP_ACKED_DAYS = 7;

// Constant-time, so a wrong token cannot be narrowed one character at a
// time by timing the answer.
function tokenMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function authorised(request: Request, env: Env): boolean {
  const expected = env.EVENTS_PULL_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  return tokenMatches(header.slice(7), expected);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return new Response(null, { status: 403 });
  if (!authorised(request, env)) return new Response(null, { status: 401 });

  const { results } = await env.EVENTS_DB.prepare(
    "SELECT id, event, detail, path, ts FROM intent_events WHERE acked_at IS NULL ORDER BY id LIMIT ?",
  )
    .bind(BATCH)
    .all();

  // `more` tells the puller whether to come straight back rather than wait
  // for its next tick, so a backlog drains instead of trickling.
  return new Response(JSON.stringify({ rows: results, more: results.length === BATCH }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return new Response(null, { status: 403 });
  if (!authorised(request, env)) return new Response(null, { status: 401 });

  let body: { ack?: unknown };
  try {
    body = (await request.json()) as { ack?: unknown };
  } catch {
    return new Response(null, { status: 400 });
  }

  const ids = Array.isArray(body.ack) ? body.ack : null;
  if (!ids || ids.length === 0 || ids.length > MAX_ACK) return new Response(null, { status: 400 });
  if (!ids.every((id) => Number.isInteger(id) && (id as number) > 0)) {
    return new Response(null, { status: 400 });
  }

  const now = new Date().toISOString();
  const placeholders = ids.map(() => "?").join(",");
  const acked = await env.EVENTS_DB.prepare(
    `UPDATE intent_events SET acked_at = ? WHERE acked_at IS NULL AND id IN (${placeholders})`,
  )
    .bind(now, ...(ids as number[]))
    .run();

  // Prune on the way out rather than on a schedule of its own. It runs on
  // a request that is already holding the database open, and a failure
  // here must not fail the acknowledgement: an unpruned row is clutter, a
  // lost acknowledgement is a duplicate in the ledger forever.
  let pruned = 0;
  try {
    const cutoff = new Date(Date.now() - KEEP_ACKED_DAYS * 86400000).toISOString();
    const result = await env.EVENTS_DB.prepare(
      "DELETE FROM intent_events WHERE acked_at IS NOT NULL AND acked_at < ?",
    )
      .bind(cutoff)
      .run();
    pruned = result.meta?.changes ?? 0;
  } catch (err) {
    console.error("events/pull: prune failed", err instanceof Error ? err.message : String(err));
  }

  return new Response(JSON.stringify({ acked: acked.meta?.changes ?? 0, pruned }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
