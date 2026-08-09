/**
 * functions/api/google/oauth/callback.ts
 * -----------------------------------------------------------------------
 * The return leg of authorization ①. Google sends the agent's browser
 * back here with ?code & ?state (or ?error).
 *
 * STATUS: MOCKUP. Never executed.
 *
 * ================== WHY THIS ROUTE BREAKS THE HOUSE RULE ==============
 * Every other mutating endpoint in this codebase runs the origin lock +
 * JSON-content-type CSRF check from functions/_lib/http.ts. THIS ONE
 * CANNOT, and that is correct, not an oversight.
 *
 * Google's redirect is a top-level browser navigation from
 * accounts.google.com. It carries no Origin we control and no JSON
 * content type. Applying the origin lock here would reject every single
 * successful authorization.
 *
 * Its CSRF protection is instead:
 *   (a) a single-use, 10-minute `state` stored server-side in D1, and
 *   (b) that state being BOUND TO A user_id which must match the
 *       session cookie presenting it.
 *
 * (b) is the part that matters and the part that is easy to drop in a
 * refactor. Without it, an attacker can start their own Google
 * authorization, then trick a logged-in victim into loading the callback
 * URL, grafting the ATTACKER'S Google account onto the VICTIM'S install
 * — after which the victim's assistant writes their clients' notes into
 * a folder the attacker owns.
 *
 * >>> DO NOT "FIX" THIS FILE TO USE THE STANDARD CSRF HELPER. <<<
 * ======================================================================
 *
 * requireSession() now comes from the real _lib/session.ts. To be
 * explicit, because of the warning directly above: that swap does NOT
 * touch the CSRF posture. The state/user_id binding below is untouched,
 * and _lib/session.ts is cookie parsing plus a token lookup — it is not
 * the origin-lock helper this file must keep avoiding.
 *
 * The stand-in it replaced called decodeURIComponent() bare, so a
 * malformed percent-escape in the cookie threw a URIError and produced a
 * 500. That is bad anywhere; here it is worst, because it strands the
 * agent immediately after Google's consent screen with no route back and
 * a grant already issued.
 */

import {
  consumeOAuthState,
  exchangeCode,
  readIdTokenClaims,
  type GoogleEnv,
} from '../../../_lib/google-oauth';
import { seal } from '../../../_lib/crypto-box';
import { requireSession } from '../../../_lib/kit-session';

/** Redirect back into the wizard with a machine-readable outcome. The
 *  destination is HARDCODED and same-origin — never take it from a
 *  query parameter, or this becomes an open redirect. */
function backToWizard(env: GoogleEnv, params: Record<string, string>): Response {
  const q = new URLSearchParams(params).toString();
  return Response.redirect(`${env.PUBLIC_BASE_URL}/kit/wizard?${q}`, 302);
}

export const onRequestGet: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);

  // --- Did the agent decline, or did Google refuse? -------------------
  const err = url.searchParams.get('error');
  if (err) {
    // 'access_denied' has TWO very different causes and the UI must tell
    // them apart, because one is a shrug and the other is a hard
    // deployment blocker:
    //   1. The agent clicked Cancel.
    //   2. His Google WORKSPACE ADMIN restricts third-party OAuth apps.
    //      No wizard design fixes that — an admin has to mark the app
    //      Trusted in admin.google.com. Screen 5 is where we find out,
    //      which is the right place: nothing has been created yet.
    // Google's error param alone does not distinguish them; the UI
    // should present both possibilities and offer the admin-request
    // email template.
    return backToWizard(env, { google: 'error', reason: err });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return backToWizard(env, { google: 'error', reason: 'missing_params' });

  const session = await requireSession(request, env);
  if (!session) {
    // Session expired while he was on Google's consent screen — a real
    // scenario if he wandered off mid-flow. Send him to log in; the
    // wizard state survives and he can retry the connect step.
    return Response.redirect(`${env.PUBLIC_BASE_URL}/members?next=/kit/wizard`, 302);
  }

  // --- The CSRF check that actually matters ---------------------------
  const codeVerifier = await consumeOAuthState(env, state, session.userId);
  if (!codeVerifier) {
    return backToWizard(env, { google: 'error', reason: 'bad_state' });
  }

  // --- Exchange -------------------------------------------------------
  let tokens;
  try {
    tokens = await exchangeCode(env, code, codeVerifier);
  } catch (e) {
    // Most likely: redirect_uri_mismatch (the exact callback URL isn't
    // registered on the OAuth client for THIS environment — Preview and
    // Production are different URLs), or a reused/expired code.
    console.error('oauth exchange failed', e);
    return backToWizard(env, { google: 'error', reason: 'exchange_failed' });
  }

  if (!tokens.refresh_token) {
    // Should be impossible: we always send access_type=offline AND
    // prompt=consent. If this fires, prompt=consent was dropped from the
    // auth URL — the classic Google footgun where a repeat authorization
    // returns an access token and no refresh token, and provisioning
    // fails later with a far more confusing error than this one.
    return backToWizard(env, { google: 'error', reason: 'no_refresh_token' });
  }

  // --- Who actually authorized? ---------------------------------------
  // AUTHORITATIVE. This is defense #2 of the same-account problem: never
  // trust what the agent typed on the profile screen — record what
  // Google reports. Screen 7 then displays THIS address as the account
  // he must use at claude.ai.
  const claims = tokens.id_token
    ? readIdTokenClaims(tokens.id_token)
    : { sub: '', email: '', emailVerified: false };

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
      claims.email,
      claims.sub,
      tokens.scope,
      // AAD = user_id: binds this ciphertext to this row, so a token
      // cannot be moved between users even with DB write access.
      await seal(env, tokens.refresh_token, session.userId),
      now,
      now,
      session.userId,
    )
    .run();

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
     VALUES (?, ?, 'google.connected', ?)`,
  )
    .bind(session.userId, now, JSON.stringify({ email: claims.email, scope: tokens.scope }))
    .run();

  // The wizard UI compares google_email against stated_work_email and,
  // if they differ, says so loudly BEFORE anything is created — a
  // mismatch here is the leading indicator of the failure where Claude
  // later can't find the folder.
  return backToWizard(env, { google: 'connected' });
};
