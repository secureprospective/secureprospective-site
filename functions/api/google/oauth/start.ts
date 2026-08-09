/**
 * functions/api/google/oauth/start.ts
 * -----------------------------------------------------------------------
 * Wizard screen 5 — "Connect Google Drive".
 *
 * Redirects the agent's browser to Google's consent screen for
 * authorization ① (SecureProspective's own `drive.file` grant).
 *
 * STATUS: MOCKUP. Never executed.
 *
 * CONFIDENT: the Pages Functions handler shape (onRequestGet, context
 * with { request, env }), and the Google auth URL parameters.
 *
 * NEEDS ADAPTING TO THE REAL REPO:
 *   * json() should come from the existing functions/_lib/http.ts.
 *
 * requireSession() now comes from the real _lib/session.ts, as the note
 * that used to sit here asked for. The stand-in it replaced decoded the
 * cookie with a bare decodeURIComponent(), which throws a URIError on a
 * malformed percent-escape — a 500 at the edge of an auth check.
 *
 * WHY THIS IS A FULL-PAGE REDIRECT AND NOT A POPUP OR AN IFRAME:
 *   Google serves X-Frame-Options: DENY on the authorization endpoint
 *   and has blocked OAuth in embedded webviews since Sept 2021. There is
 *   no way to embed this. Do not try; a future "let's make it feel more
 *   integrated" refactor will burn a day rediscovering it.
 */

import {
  buildAuthUrl,
  createOAuthState,
  type GoogleEnv,
} from '../../../_lib/google-oauth';
import { requireSession } from '../../../_lib/kit-session';
import { isDevBypass, type DevBypassEnv } from '../../../_lib/dev-bypass';
import { seal } from '../../../_lib/crypto-box';

export const onRequestGet: PagesFunction<GoogleEnv & DevBypassEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) {
    // Not logged in — bounce to the members area rather than erroring.
    // A non-technical user who has been away for a month and clicks an
    // old wizard link should land somewhere they recognise. Relative
    // Location, not PUBLIC_BASE_URL — this route must work identically
    // on Preview and Production without a per-environment secret for a
    // same-origin redirect.
    return new Response(null, { status: 302, headers: { Location: '/members?next=/kit/wizard' } });
  }

  // Preview-only, see _lib/dev-bypass.ts. Simulates a completed Google
  // connect with a real D1 write and a real (sealed) placeholder token,
  // so every downstream screen sees genuine server state instead of
  // mock data — without a live Google OAuth client existing yet.
  if (isDevBypass(env)) {
    const now = Math.floor(Date.now() / 1000);
    await env.KIT_DB.prepare(
      `UPDATE kit_installs
          SET google_email = ?, google_sub = ?, google_scope = ?,
              google_refresh_token_enc = ?, google_connected_at = ?,
              google_revoked_at = NULL,
              step = CASE WHEN step IN ('registered','profile_saved')
                          THEN 'google_connected' ELSE step END,
              updated_at = ?
        WHERE user_id = ?`,
    )
      .bind(
        'dev-bypass@example.com',
        'dev-bypass-sub',
        'dev-bypass-scope',
        await seal(env, 'dev-bypass-refresh-token', session.userId),
        now,
        now,
        session.userId,
      )
      .run();

    await env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
       VALUES (?, ?, 'google.connected', ?)`,
    )
      .bind(session.userId, now, JSON.stringify({ email: 'dev-bypass@example.com', bypass: true }))
      .run();

    return new Response(null, {
      status: 302,
      headers: { Location: '/kit/setup?google=connected' },
    });
  }

  // The agent should have completed the profile screen first, because
  // that is where we learn which Google account to pre-select. Not fatal
  // if missing — login_hint is advisory and the callback records the
  // account Google actually reports.
  const install = await env.KIT_DB.prepare(
    `SELECT stated_work_email FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{ stated_work_email: string | null }>();

  const { state, codeChallenge } = await createOAuthState(env, session.userId);

  const url = buildAuthUrl(env, {
    state,
    codeChallenge,
    loginHint: install?.stated_work_email ?? undefined,
  });

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event) VALUES (?, ?, 'google.auth_started')`,
  )
    .bind(session.userId, Math.floor(Date.now() / 1000))
    .run();

  return Response.redirect(url, 302);
};
