/**
 * functions/api/wizard/redeem-invite.ts
 * -----------------------------------------------------------------------
 * The missing front door. Every other wizard route (profile, status,
 * provision, verify, complete) requires a session cookie and 401s
 * without one — but nothing anywhere ever issued the first one.
 * `kit_invites` existed in the schema with no route consuming it. Found
 * live 2026-08-09 when the wizard was first deployed for real: a
 * brand-new visitor had no way to ever get in.
 *
 * Gate 2 (locked): "no real invite-gate at one-customer launch — single
 * hardcoded token, unadvertised path." This route is that gate: a raw
 * token in the URL, hash-compared against `kit_invites`, single-use.
 *
 * GET, not POST — this is a magic link clicked from an email, a
 * top-level navigation, not a same-origin fetch.
 *
 * Deliberately does NOT create a `kit_installs` row itself. `profile.ts`
 * already UPSERTs one on first save (`step = 'registered'` is its
 * default). This route's only job is: valid unconsumed token in, session
 * cookie + redirect to /kit/setup out.
 */

import { createSession } from '../../_lib/kit-session';
import { sha256Hex } from '../../_lib/crypto-box';

interface RedeemEnv {
  KIT_DB: D1Database;
}

export const onRequestGet: PagesFunction<RedeemEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get('t');

  if (!rawToken) {
    return new Response('Missing invite token.', { status: 400 });
  }

  const tokenHash = await sha256Hex(rawToken);
  const now = Math.floor(Date.now() / 1000);

  const invite = await env.KIT_DB.prepare(
    `SELECT token_hash, expires_at, consumed_at FROM kit_invites WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{ token_hash: string; expires_at: number; consumed_at: number | null }>();

  // Same posture as session.ts: unknown, expired, and already-consumed
  // all return the same generic failure. Which of the three it was is
  // not something a stranger holding a guessed URL should be able to
  // learn.
  if (!invite || invite.expires_at <= now || invite.consumed_at) {
    return new Response('This invite link is no longer valid. Contact SecureProspective for a new one.', {
      status: 403,
    });
  }

  const userId = crypto.randomUUID();

  const issued = await createSession(env, userId);

  await env.KIT_DB.batch([
    env.KIT_DB.prepare(
      `UPDATE kit_invites SET consumed_at = ?, consumed_by_user_id = ? WHERE token_hash = ?`,
    ).bind(now, userId, tokenHash),
    env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event) VALUES (?, ?, 'invite.redeemed')`,
    ).bind(userId, now),
  ]);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/kit/setup',
      'Set-Cookie': issued.cookie,
    },
  });
};
