/**
 * functions/api/wizard/set-storage-mode.ts
 * -----------------------------------------------------------------------
 * Screen 2's write path for the two DELEGATED paths — native Google
 * connector, and local folder. Neither involves our server talking to
 * Google, so neither has an OAuth callback to hand off through. This
 * route exists because R2's blocker analysis
 * (research/wizard-reshape-r2-blocker.md) found no honest route to
 * `complete` for either path without it.
 *
 * NOT used by the scoped (drive.file OAuth) path — that one continues,
 * unchanged, through /api/google/oauth/start -> callback.ts, which sets
 * storage_location='drive'/drive_scope='scoped' itself (see the comment
 * in callback.ts) because that is the one moment the server independently
 * knows the grant succeeded.
 *
 * COHERENCE IS THIS ROUTE'S JOB. 0003's own migration header is explicit:
 * SQLite's per-column CHECKs cannot enforce the relationship between
 * storage_location and drive_scope, so the writing code must set both
 * together, from one decision, in one statement. This route is that one
 * writer for the two paths it owns; only two (storageLocation,
 * driveScope) pairs are accepted, everything else is rejected outright
 * rather than silently coerced.
 *
 * FORWARD-ONLY, DELIBERATELY CONSERVATIVE: only usable while step is
 * still 'registered' or 'profile_saved' — i.e. screen 2 has not been
 * answered yet. Once a path is chosen (scoped OR delegated), this route
 * refuses to change it. Switching storage location after commitment is a
 * real product question (what happens to an already-created scoped
 * folder if the agent then picks "local"?) that nothing in this reshape's
 * brief scopes an answer to — the safe default is to refuse rather than
 * guess at reversal semantics nobody has decided.
 */

import { requireSession } from '../../_lib/kit-session';
import { coherentPair } from '../../_lib/storage-mode-pair';

interface StorageModeEnv {
  KIT_DB: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const onRequestPost: PagesFunction<StorageModeEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  let body: { storageLocation?: unknown; driveScope?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const pair = coherentPair(body.storageLocation, body.driveScope);
  if (!pair) return json({ error: 'invalid_storage_mode' }, 400);

  const install = await env.KIT_DB.prepare(
    `SELECT step, agency_name FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{ step: string; agency_name: string | null }>();

  if (!install?.agency_name) return json({ error: 'profile_incomplete', step: 'profile' }, 409);

  if (!['registered', 'profile_saved'].includes(install.step)) {
    // Already past screen 2 — either the scoped OAuth path was taken, or
    // this route already ran once. Real UI never offers this call from
    // here (ConnectGoogleStep renders a settled view, not the picker),
    // so reaching this branch means a replay or a stale tab, not an
    // agent trying to change his mind through the normal flow.
    return json({ error: 'already_chosen', step: install.step }, 409);
  }

  const now = Math.floor(Date.now() / 1000);

  await env.KIT_DB.prepare(
    `UPDATE kit_installs
        SET storage_location = ?, drive_scope = ?,
            step = CASE WHEN step IN ('registered','profile_saved')
                        THEN 'storage_chosen' ELSE step END,
            updated_at = ?
      WHERE user_id = ?`,
  )
    .bind(pair.storageLocation, pair.driveScope, now, session.userId)
    .run();

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
     VALUES (?, ?, 'storage_mode.chosen', ?)`,
  )
    .bind(session.userId, now, JSON.stringify(pair))
    .run();

  return json({ ok: true, storageLocation: pair.storageLocation, driveScope: pair.driveScope });
};
