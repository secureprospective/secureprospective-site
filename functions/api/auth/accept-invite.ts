// GET  /api/auth/accept-invite?token=... — validates a token, returns the
//      associated email so the accept-invite page can display it (never
//      the token itself back, it already has that).
// POST /api/auth/accept-invite — redeems a token: sets the password,
//      creates the user (email_verified_at = now, invite-link possession
//      is treated as proof of email ownership), marks the invite redeemed,
//      and logs the new user straight into a session.

import { randomUUID, createHash } from "node:crypto";
import { json, originAllowed, isJsonRequest, MIN_PASSWORD_LENGTH, type AuthEnv } from "../../_lib/http";
import { hashPassword } from "../../_lib/password";
import { verifyTurnstile } from "../../_lib/turnstile";
import { createSession, sessionCookie } from "../../_lib/session";

interface Env extends AuthEnv {}

interface InviteRow {
  id: string;
  email: string;
  expires_at: string;
  redeemed_at: string | null;
}

async function loadValidInvite(db: D1Database, token: unknown): Promise<InviteRow | null> {
  if (typeof token !== "string" || !token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await db
    .prepare("SELECT id, email, expires_at, redeemed_at FROM invites WHERE token_hash = ?1")
    .bind(tokenHash)
    .first<InviteRow>();
  if (!row) return null;
  if (row.redeemed_at) return null;
  if (row.expires_at <= new Date().toISOString()) return null;
  return row;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);

  const token = new URL(request.url).searchParams.get("token");
  const invite = await loadValidInvite(env.BACKOFFICE_DB, token);
  if (!invite) return json({ error: "This invite link is invalid or has expired." }, 400);

  return json({ ok: true, email: invite.email });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);

  let token: unknown, password: unknown, turnstileToken: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    token = body.token;
    password = body.password;
    turnstileToken = body.turnstileToken;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const turnstileOk = await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    turnstileToken,
    request.headers.get("CF-Connecting-IP"),
  );
  if (!turnstileOk) return json({ error: "Verification failed. Please try again." }, 403);

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 400);
  }

  const invite = await loadValidInvite(env.BACKOFFICE_DB, token);
  if (!invite) return json({ error: "This invite link is invalid or has expired." }, 400);

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  try {
    await env.BACKOFFICE_DB.batch([
      env.BACKOFFICE_DB
        .prepare(
          "INSERT INTO users (id, email, password_hash, created_at, email_verified_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        )
        .bind(id, invite.email, passwordHash, now, now),
      env.BACKOFFICE_DB
        .prepare("UPDATE invites SET redeemed_at = ?1 WHERE id = ?2")
        .bind(now, invite.id),
    ]);
  } catch {
    // Most likely UNIQUE(email) — a user row somehow already exists for this
    // invite's email (e.g. a second tab redeeming concurrently).
    return json({ error: "Could not create account. The invite may already be used." }, 409);
  }

  const raw = await createSession(env.BACKOFFICE_DB, id);

  return new Response(JSON.stringify({ ok: true, user: { email: invite.email } }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie(raw) },
  });
};
