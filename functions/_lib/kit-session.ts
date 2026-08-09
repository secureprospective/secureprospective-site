/**
 * functions/_lib/session.ts
 * -----------------------------------------------------------------------
 * InsuranceAgentKit — members-area session read/write.
 *
 * WHY THIS FILE EXISTS: every wizard route (start / callback / provision
 * / verify / complete / revoke) carried its own copy of a `requireSession`
 * stand-in whose comment said "the real project already has
 * functions/_lib/session.ts". It did not. Warden flagged the gap during
 * the Phase D review: six routes dynamically importing a module that was
 * never written, so every one of them would have thrown at request time.
 * This is that module.
 *
 * STATUS: RUNNABLE NOW. No live-account dependency — this is pure D1 +
 * WebCrypto, both of which already exist in the scaffolding. Covered by
 * session.test.ts against a fake D1 (`node _lib/session.test.ts`).
 *
 * THE ONE THING THAT NEEDS VERIFYING BEFORE THIS RUNS FOR REAL:
 *   -- VERIFY: the column names of SecureProspective's EXISTING `sessions`
 *   table. The D1 migration header (migrations/0002_insuranceagentkit.sql)
 *   states the kit_* tables were designed to "mirror the existing sessions
 *   / email_verification_codes tables", and that the house convention is
 *   store-the-hash-never-the-secret. This file assumes:
 *
 *       sessions(token_hash TEXT PRIMARY KEY,
 *                user_id    TEXT NOT NULL,
 *                created_at INTEGER NOT NULL,
 *                expires_at INTEGER NOT NULL)
 *
 *   If the live table differs, change SESSION_TABLE / the column names in
 *   the three statements below and nothing else — the logic is schema-shaped
 *   only at those points. `user_id TEXT` must also match `users.id`, the
 *   same open question the migration flags for the kit_* foreign keys.
 *
 * SECURITY POSTURE (deliberate, matches crypto-box.ts's honesty section):
 *   * The raw session token is never stored. Only sha256Hex(token) is,
 *     and it is the primary key — so lookup is a single indexed probe and
 *     no timing-comparison dance is needed.
 *   * Expiry is enforced in SQL AND re-checked in TypeScript. Belt and
 *     braces, because an expired session on this product means an agent's
 *     Google grant is reachable by whoever holds a stale cookie.
 *   * A missing, malformed, unknown, or expired cookie all return exactly
 *     `null`. Callers must not be able to distinguish them — "which of
 *     these is it" is an oracle, and none of the six callers has any use
 *     for the difference.
 */

import { randomToken, sha256Hex } from './crypto-box.ts';

export interface SessionEnv {
  KIT_DB: D1Database;
}

export interface Session {
  /** The owning user's id — the AAD for every sealed token in kit_installs. */
  userId: string;
  /** Epoch seconds. Already verified to be in the future. */
  expiresAt: number;
}

/** -- VERIFY against the live schema. See the header note. */
const SESSION_TABLE = 'sessions';

/** 30 days. The wizard is a one-sitting flow, but the members area
 *  (support-repair, revoke-my-access) is something an agent comes back
 *  to months later, and a re-login wall at that moment is exactly the
 *  friction this ICP abandons on. */
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export const SESSION_COOKIE_NAME = 'session';

/* ---------------------------------------------------------------- */
/* Cookie parsing                                                    */
/* ---------------------------------------------------------------- */

/**
 * Pull the session token out of a Cookie header.
 *
 * Exported and pure so it can be tested directly, and so the six routes
 * stop each hand-rolling the same regex slightly differently.
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`).exec(cookieHeader);
  if (!m) return null;
  let raw: string;
  try {
    raw = decodeURIComponent(m[1]);
  } catch {
    // A malformed percent-escape is not a session. Do not throw at the
    // edge of an auth check — that turns a bad cookie into a 500.
    return null;
  }
  return raw.length > 0 ? raw : null;
}

/* ---------------------------------------------------------------- */
/* Read                                                              */
/* ---------------------------------------------------------------- */

/**
 * Resolve a raw session token to a session, or `null`.
 *
 * This is the name the existing routes already dynamically import, so
 * its signature is fixed by them: `verifySessionToken(env, rawToken)`.
 */
export async function verifySessionToken(
  env: SessionEnv,
  rawToken: string | null | undefined,
  now: number = Math.floor(Date.now() / 1000),
): Promise<Session | null> {
  if (!rawToken) return null;

  const row = await env.KIT_DB.prepare(
    `SELECT user_id, expires_at FROM ${SESSION_TABLE} WHERE token_hash = ?`,
  )
    .bind(await sha256Hex(rawToken))
    .first<{ user_id: string; expires_at: number }>();

  if (!row) return null;
  if (typeof row.expires_at !== 'number' || row.expires_at <= now) return null;
  if (!row.user_id) return null;

  return { userId: row.user_id, expiresAt: row.expires_at };
}

/**
 * The one-liner every route actually wants: cookie -> session or null.
 * Replaces the six copy-pasted `requireSession` stand-ins.
 */
export async function requireSession(
  request: Request,
  env: SessionEnv,
): Promise<Session | null> {
  return verifySessionToken(env, parseSessionCookie(request.headers.get('cookie')));
}

/* ---------------------------------------------------------------- */
/* Write                                                             */
/* ---------------------------------------------------------------- */

export interface IssuedSession {
  /** Give this to the browser once. It is never recoverable afterwards. */
  token: string;
  session: Session;
  /** Ready-to-use `Set-Cookie` value. */
  cookie: string;
}

/**
 * Mint a new session row and the cookie that carries it.
 *
 * Note the asymmetry with `verifySessionToken`: writing is where the raw
 * token exists at all. It is returned to the caller and then forgotten —
 * only the hash reaches D1.
 */
export async function createSession(
  env: SessionEnv,
  userId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
  now: number = Math.floor(Date.now() / 1000),
): Promise<IssuedSession> {
  const token = randomToken(32);
  const expiresAt = now + ttlSeconds;

  await env.KIT_DB.prepare(
    `INSERT INTO ${SESSION_TABLE} (token_hash, user_id, created_at, expires_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(await sha256Hex(token), userId, now, expiresAt)
    .run();

  return {
    token,
    session: { userId, expiresAt },
    cookie: serializeSessionCookie(token, ttlSeconds),
  };
}

/** Log out / revoke one session. Idempotent by construction. */
export async function destroySession(
  env: SessionEnv,
  rawToken: string | null | undefined,
): Promise<void> {
  if (!rawToken) return;
  await env.KIT_DB.prepare(`DELETE FROM ${SESSION_TABLE} WHERE token_hash = ?`)
    .bind(await sha256Hex(rawToken))
    .run();
}

/* ---------------------------------------------------------------- */
/* Cookie serialization                                              */
/* ---------------------------------------------------------------- */

/**
 * HttpOnly so the token is unreachable from page JS; Secure because the
 * members area is HTTPS-only; SameSite=Lax rather than Strict because the
 * Google OAuth callback is a cross-site top-level GET redirect back into
 * our own origin — Strict would drop the cookie exactly there and the
 * whole connect-Google step would fail with a bare "not_authenticated".
 */
export function serializeSessionCookie(token: string, maxAgeSeconds: number): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

/** The clearing counterpart, for logout responses. */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
