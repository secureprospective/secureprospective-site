// Session tokens: creation, cookie handling, and lookup. See password.ts's
// header comment — this file carries the same "invisible mistake" weight.
// Pattern copied from TFM's members build (reference_cloudflare_d1_auth_pattern),
// cookie name changed so a browser holding both a TFM and an SP session
// never collides.

import { randomBytes } from "node:crypto";
import { sha256Hex } from "./password";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  email_verified_at: string | null;
}

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;    // 30 days
const RENEW_THRESHOLD_SECONDS = 7 * 24 * 60 * 60; // renew if < 7 days left
const COOKIE_NAME = "sp_bo_session";

// New session: raw token to the browser, hash to the database.
export function newSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: sha256Hex(raw) };
}

export function sessionCookie(raw: string, maxAgeSeconds = SESSION_TTL_SECONDS): string {
  return [
    `${COOKIE_NAME}=${raw}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function sessionHashFromRequest(request: Request): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return sha256Hex(rest.join("="));
  }
  return null;
}

// The single code path every protected route calls. Returns null on any
// invalid/expired/missing session — callers must fail closed on null.
export async function getSession(
  db: D1Database,
  tokenHash: string | null,
): Promise<{ user: SessionUser } | null> {
  if (!tokenHash) return null;

  const row = await db
    .prepare("SELECT token_hash, user_id, expires_at FROM sessions WHERE token_hash = ?1")
    .bind(tokenHash)
    .first<{ token_hash: string; user_id: string; expires_at: string }>();
  if (!row) return null;

  if (row.expires_at <= new Date().toISOString()) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
    return null;
  }

  const user = await db
    .prepare("SELECT id, email, role, email_verified_at FROM users WHERE id = ?1")
    .bind(row.user_id)
    .first<SessionUser>();
  if (!user) return null;

  // Sliding renewal: activity with < 7 days left extends the session.
  const remaining = (new Date(row.expires_at).getTime() - Date.now()) / 1000;
  if (remaining < RENEW_THRESHOLD_SECONDS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
    await db.prepare("UPDATE sessions SET expires_at = ?1 WHERE token_hash = ?2").bind(expiresAt, tokenHash).run();
  }

  return { user };
}

export async function createSession(db: D1Database, userId: string): Promise<string> {
  const { raw, hash } = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)")
    .bind(hash, userId, expiresAt)
    .run();
  return raw;
}
