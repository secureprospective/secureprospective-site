/**
 * functions/api/wizard/capability-toggle.ts
 * -----------------------------------------------------------------------
 * R6(b) — the back-office off-switch card's "Turn off" action. Standing,
 * pressable any day — not the wizard's one-time drill (see
 * InsuranceAgentKit's FireDrillStep.jsx header comment for why that
 * rehearsal was cut).
 *
 * Reuses the exact mechanism `complete.ts`/`oauth/revoke.ts` already use —
 * `revokeAndForget()` — called directly with a KIT_DB user id derived the
 * same way `bridge.ts`/`capability-state.ts` do (BACKOFFICE_DB session →
 * stable hash), rather than depending on a `kit_session` cookie the
 * browser may not currently hold (he's on the back-office page, not
 * mid-wizard). This is the same mechanism, addressed a different way — not
 * a rebuild of it.
 *
 * "Turn on" (reconnect) is NOT a POST here — there is no server-side
 * action that re-grants Google access without the agent's own consent
 * screen. The card's "Reconnect" control instead links to
 * `/api/wizard/bridge?next=/api/google/oauth/start`, which mints a fresh
 * kit session and sends him straight into the real OAuth flow.
 */

import { getSession, sessionHashFromRequest } from '../../_lib/session';
import { sha256Hex } from '../../_lib/crypto-box';
import { revokeAndForget, type GoogleEnv } from '../../_lib/google-oauth';

interface CapabilityToggleEnv extends GoogleEnv {
  BACKOFFICE_DB: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<CapabilityToggleEnv> = async ({ request, env }) => {
  const backofficeSession = await getSession(env.BACKOFFICE_DB, sessionHashFromRequest(request));
  if (!backofficeSession) return json({ error: 'not_authenticated' }, 401);

  const kitUserId = await sha256Hex(`backoffice:${backofficeSession.user.id}`);
  const now = Math.floor(Date.now() / 1000);

  let revoked: boolean;
  try {
    revoked = await revokeAndForget(env, kitUserId);
  } catch (e) {
    console.error('capability-toggle: revocation failed', e);
    return json({ error: 'revoke_failed' }, 500);
  }

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
     VALUES (?, ?, 'google.revoked', ?)`,
  )
    .bind(kitUserId, now, JSON.stringify({ source: 'backoffice_card', revoked }))
    .run();

  return json({ ok: true, googleAccessRevoked: revoked });
};
