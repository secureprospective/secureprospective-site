/**
 * functions/_lib/google-oauth.ts
 * -----------------------------------------------------------------------
 * InsuranceAgentKit — Google OAuth2 (authorization code + PKCE) against
 * Google's REST endpoints, using plain fetch(). No SDK.
 *
 * ============================= READ THIS =============================
 * This file handles authorization ① ONLY: SecureProspective's own,
 * server-side, `drive.file`-scoped access used to CREATE the agent's
 * brain folder during setup.
 *
 * It has NOTHING to do with authorization ②, the agent's claude.ai
 * Google Workspace connector. That token is held by Anthropic, is
 * scoped far more broadly, is authorized only in a browser at
 * claude.ai/settings/connectors, and cannot be created, read, injected,
 * or revoked from this codebase. If you are here because you want
 * Claude to see the folder: this file is not what you want. Read
 * LEVEL 3 of research/tom-findings-wizard-design.md.
 * =====================================================================
 *
 * STATUS: MOCKUP. Never executed. No Google Cloud project, no OAuth
 * client, no network access existed where this was written.
 *
 * CONFIDENT / STANDARD — every endpoint and parameter below is taken
 * from Google's own docs:
 *   https://developers.google.com/identity/protocols/oauth2/web-server
 *     - auth:   https://accounts.google.com/o/oauth2/v2/auth
 *     - token:  https://oauth2.googleapis.com/token
 *     - revoke: https://oauth2.googleapis.com/revoke
 *     - params: client_id, redirect_uri, response_type, scope,
 *               access_type, prompt, state, include_granted_scopes,
 *               login_hint, code_verifier / code_challenge
 *
 * NEEDS VERIFICATION AGAINST A REAL CLIENT:
 *   * The exact error-body shape Google returns on failure. The
 *     `{ error, error_description }` form is well established but the
 *     handling below should be exercised against real failures
 *     (expired code, reused code, wrong redirect_uri) before shipping.
 *   * Whether `include_granted_scopes=true` interacts badly with
 *     granular consent for this scope set. Harmless in principle; not
 *     tested.
 *   * That `prompt=consent` reliably re-issues a refresh_token on a
 *     repeat authorization for the SAME user. This is documented
 *     behaviour and widely relied on, but it is load-bearing for the
 *     wizard's re-run path, so test it explicitly.
 */

import { seal, open, randomToken, sha256Hex, type CryptoEnv } from './crypto-box';

/* ---------------------------------------------------------------- */
/* Configuration                                                     */
/* ---------------------------------------------------------------- */

export interface GoogleEnv extends CryptoEnv {
  GOOGLE_CLIENT_ID: string;      // Cloudflare Pages dashboard secret
  GOOGLE_CLIENT_SECRET: string;  // Cloudflare Pages dashboard secret
  PUBLIC_BASE_URL: string;       // e.g. 'https://secureprospective.com'
  KIT_DB: D1Database;
}

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

/**
 * Least-privilege by design.
 *
 * `drive.file` is classified NON-SENSITIVE by Google and grants
 * PER-FILE access — only files this app itself created. It does not
 * grant folder-wide or Drive-wide access. Two consequences:
 *
 *   GOOD: if this refresh token ever leaks, the blast radius is one
 *         agent's brain folder, not their entire Drive.
 *   COST: we are structurally blind to files created inside our folder
 *         by anything else — INCLUDING Claude. See the write-check in
 *         functions/api/wizard/verify.ts.
 *
 * `openid email` is NOT for login (we have our own session). It exists
 * so the callback can learn which Google account actually authorized —
 * the authoritative answer to "did he use the same account?".
 *
 * DO NOT widen this to `drive` or `drive.readonly`. Both are RESTRICTED
 * scopes requiring a third-party security assessment, and both would
 * hand this service read access to a licensed insurance professional's
 * entire Google Drive for no product benefit whatsoever.
 * Source: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
 */
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
].join(' ');

export function redirectUri(env: GoogleEnv): string {
  return `${env.PUBLIC_BASE_URL}/api/google/oauth/callback`;
}

/* ---------------------------------------------------------------- */
/* PKCE                                                              */
/* ---------------------------------------------------------------- */
// PKCE is optional for a confidential (server-side) client that holds a
// client_secret, but it is required by OAuth 2.1 and costs ~10 lines.
// Include it.

export async function makePkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomToken(32); // base64url, 43 chars — within spec's 43..128
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  let bin = '';
  for (const b of new Uint8Array(digest)) bin += String.fromCharCode(b);
  const challenge = btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return { verifier, challenge };
}

/* ---------------------------------------------------------------- */
/* Step 1 — build the consent URL                                    */
/* ---------------------------------------------------------------- */

export function buildAuthUrl(
  env: GoogleEnv,
  opts: { state: string; codeChallenge: string; loginHint?: string },
): string {
  const p = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(env),
    response_type: 'code',
    scope: SCOPES,

    // REQUIRED to receive a refresh_token at all.
    access_type: 'offline',

    // NON-OBVIOUS AND LOAD-BEARING: Google issues a refresh_token only
    // on the FIRST authorization for a given client/user pair unless
    // re-consent is forced. Without this, a user who re-runs the wizard
    // gets an access token and no refresh token, and provisioning fails
    // later with a confusing error. This is the second most common
    // Google OAuth footgun after the 7-day Testing-mode trap.
    prompt: 'consent',

    include_granted_scopes: 'true',
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
  });

  // Pre-selects the account the agent told us about on the profile
  // screen. Advisory only — he can still pick a different one, which is
  // exactly why the callback records the account Google actually
  // reports, and why the setup-code round trip exists.
  if (opts.loginHint) p.set('login_hint', opts.loginHint);

  return `${AUTH_ENDPOINT}?${p.toString()}`;
}

/* ---------------------------------------------------------------- */
/* State — CSRF + binding the callback to one session                */
/* ---------------------------------------------------------------- */

const STATE_TTL_SECONDS = 600;

export async function createOAuthState(
  env: GoogleEnv,
  userId: string,
): Promise<{ state: string; codeChallenge: string }> {
  const state = randomToken(32);
  const { verifier, challenge } = await makePkce();
  const now = Math.floor(Date.now() / 1000);

  await env.KIT_DB.prepare(
    `INSERT INTO kit_oauth_states
       (state_hash, user_id, code_verifier_enc, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      await sha256Hex(state),
      userId,
      await seal(env, verifier, userId),
      now,
      now + STATE_TTL_SECONDS,
    )
    .run();

  return { state, codeChallenge: challenge };
}

/**
 * Consume the state. Single-use: deleted whether or not it validates.
 *
 * Returns the PKCE verifier, or null if the state is unknown, expired,
 * or belongs to a DIFFERENT session than the one presenting it. That
 * last check is what stops an attacker from completing their own Google
 * authorization inside someone else's install.
 */
export async function consumeOAuthState(
  env: GoogleEnv,
  state: string,
  sessionUserId: string,
): Promise<string | null> {
  const hash = await sha256Hex(state);
  const row = await env.KIT_DB.prepare(
    `SELECT user_id, code_verifier_enc, expires_at
       FROM kit_oauth_states WHERE state_hash = ?`,
  )
    .bind(hash)
    .first<{ user_id: string; code_verifier_enc: string; expires_at: number }>();

  await env.KIT_DB.prepare(`DELETE FROM kit_oauth_states WHERE state_hash = ?`)
    .bind(hash)
    .run();

  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) return null;
  if (row.user_id !== sessionUserId) return null;

  return open(env, row.code_verifier_enc, sessionUserId);
}

/* ---------------------------------------------------------------- */
/* Step 2 — exchange the code                                        */
/* ---------------------------------------------------------------- */

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;   // absent if the user had already consented
                            // and prompt=consent was not sent
  scope: string;
  token_type: 'Bearer';
  id_token?: string;        // present because we requested `openid`
}

export async function exchangeCode(
  env: GoogleEnv,
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(env),   // must match byte-for-byte
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    // Common causes worth recognising in logs:
    //   redirect_uri_mismatch -> the exact callback URL is not on the
    //     OAuth client's authorized redirect URI list. Remember Preview
    //     and Production are different URLs (see §2.13).
    //   invalid_grant -> code already used, or expired (~10 min).
    throw new Error(`google token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json<TokenResponse>();
}

/**
 * Read the verified Google account identity out of the ID token.
 *
 * The signature is deliberately NOT verified here. Google's own docs
 * permit skipping verification when the token was received directly
 * from the token endpoint over TLS in a request we initiated — which is
 * exactly this call site.
 *
 * !! IF YOU MOVE THIS PARSING ANYWHERE ELSE, SIGNATURE VERIFICATION
 * !! BECOMES MANDATORY. Do not copy this function into a context where
 * !! the token arrives from a client.
 *
 * Lower-risk alternative if that caveat makes you uncomfortable — one
 * extra round trip, no JWT handling at all:
 *   GET https://www.googleapis.com/oauth2/v3/userinfo
 *   Authorization: Bearer <access_token>
 *   -> { sub, email, email_verified, ... }
 */
export function readIdTokenClaims(
  idToken: string,
): { sub: string; email: string; emailVerified: boolean } {
  const payload = idToken.split('.')[1];
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const claims = JSON.parse(json) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
  };
  return {
    sub: claims.sub,
    email: claims.email ?? '',
    emailVerified: claims.email_verified === true,
  };
}

/* ---------------------------------------------------------------- */
/* Step 3 — mint an access token on demand                           */
/* ---------------------------------------------------------------- */

/**
 * Access tokens are deliberately NOT persisted. They live ~1 hour and
 * we need one for ~3 seconds, three or four times per install. Caching
 * them would buy one saved round trip and cost a second encrypted
 * secret at rest plus expiry-tracking logic.
 *
 * Throws TokenGoneError when the grant is dead. Callers must treat that
 * as "send the user back to the Connect Google screen", NOT as a 500 —
 * it is a normal state in this product, especially under the unconditional
 * revocation design (Phase D: §1.2 / Phase 6 revision 6 removed pass 2's
 * Option B retention — we revoke our own access on every completion).
 */
export class TokenGoneError extends Error {}

export async function accessTokenFor(
  env: GoogleEnv,
  userId: string,
): Promise<string> {
  const row = await env.KIT_DB.prepare(
    `SELECT google_refresh_token_enc FROM kit_installs WHERE user_id = ?`,
  )
    .bind(userId)
    .first<{ google_refresh_token_enc: string | null }>();

  if (!row?.google_refresh_token_enc) {
    throw new TokenGoneError('no google refresh token on file');
  }

  let refreshToken: string;
  try {
    refreshToken = await open(env, row.google_refresh_token_enc, userId);
  } catch {
    // Wrong key, tampered row, or an AAD mismatch (a token moved
    // between rows). All of them mean: unusable.
    throw new TokenGoneError('stored google token could not be opened');
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // `invalid_grant` here is the signature of THE 7-DAY TRAP:
    // if the Google Cloud OAuth consent screen is left in "Testing"
    // publishing status with External user type, Google revokes every
    // refresh token after 7 days. Publish the consent screen to
    // "In production" — with only non-sensitive scopes this does not
    // require the sensitive-scope verification review.
    if (body.includes('invalid_grant')) {
      throw new TokenGoneError(`refresh rejected: ${body}`);
    }
    throw new Error(`google token refresh failed: ${res.status} ${body}`);
  }

  const json = await res.json<{ access_token: string }>();
  return json.access_token;
}

/* ---------------------------------------------------------------- */
/* Step 4 — revoke                                                   */
/* ---------------------------------------------------------------- */

/**
 * !! ORDERING MATTERS AND IS EASY TO GET BACKWARDS IN A REFACTOR !!
 *
 * REVOKE FIRST, THEN NULL THE ROW. Deleting the database row does NOT
 * revoke the grant — it orphans a credential Google still honours.
 * Nothing can use it, but nothing can revoke it either, and it sits on
 * the agent's myaccount.google.com/permissions page forever, looking
 * alarming and unexplained to exactly the kind of user who will be
 * alarmed by it.
 *
 * Returns true if Google accepted the revocation. A false return is not
 * fatal — an already-dead token also fails here — but it should be
 * logged, because it is the only signal that a live grant may have been
 * orphaned.
 */
export async function revokeAndForget(
  env: GoogleEnv,
  userId: string,
): Promise<boolean> {
  const row = await env.KIT_DB.prepare(
    `SELECT google_refresh_token_enc FROM kit_installs WHERE user_id = ?`,
  )
    .bind(userId)
    .first<{ google_refresh_token_enc: string | null }>();

  let revoked = false;

  if (row?.google_refresh_token_enc) {
    try {
      const refreshToken = await open(env, row.google_refresh_token_enc, userId);
      const res = await fetch(REVOKE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: refreshToken }),
      });
      revoked = res.ok;
    } catch {
      revoked = false;
    }
  }

  await env.KIT_DB.prepare(
    `UPDATE kit_installs
        SET google_refresh_token_enc = NULL,
            google_revoked_at = ?,
            updated_at = ?
      WHERE user_id = ?`,
  )
    .bind(Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), userId)
    .run();

  return revoked;
}
