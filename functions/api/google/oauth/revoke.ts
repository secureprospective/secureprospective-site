/**
 * functions/api/google/oauth/revoke.ts
 * -----------------------------------------------------------------------
 * Members-area "Let SecureProspective fix my folder" / manual revoke.
 *
 * Roadmap §1.2 (line ~109): support repair is a NAMED flow, not an
 * absence — the members area gets a button that runs the same OAuth
 * path, does the repair, and revokes again on completion. Every use is
 * audit-logged. This route is the revoke half of that flow, and the
 * standalone "revoke my SecureProspective access now" control.
 *
 * REVOCATION IS UNCONDITIONAL (see complete.ts). There is no "keep
 * access" branch anywhere.
 *
 * STATUS: RUNNABLE STRUCTURE, live-account path UNTESTED (needs Phase 0).
 *
 * TOOLKIT T1: requireSession() now comes from the real _lib/session.ts
 * (written in T1) instead of a local stand-in. json() is still a
 * stand-in; this route SHOULD use the house _lib/http.ts origin lock +
 * JSON-CSRF check once that module lands.
 */

import { revokeAndForget, type GoogleEnv } from '../../../_lib/google-oauth';
import { requireSession } from '../../../_lib/kit-session';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  const now = Math.floor(Date.now() / 1000);

  let revoked: boolean;
  try {
    revoked = await revokeAndForget(env, session.userId);
  } catch (e) {
    console.error('revoke: revocation failed', e);
    return json({ error: 'revoke_failed' }, 500);
  }

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
     VALUES (?, ?, 'google.revoked', ?)`,
  )
    .bind(session.userId, now, JSON.stringify({ source: 'members_area', revoked }))
    .run();

  return json({ ok: true, googleAccessRevoked: revoked });
};
