// POST /api/auth/change-password — any authenticated user changes their own
// password. Requires the current password even though the caller already
// has a valid session (defense in depth: a hijacked session shouldn't be
// enough on its own to lock the real owner out). Clears
// must_change_password and rotates the session (old token deleted, new one
// issued) so a stolen one-time-password session doesn't survive the change.

import { json, originAllowed, isJsonRequest, MIN_PASSWORD_LENGTH, type AuthEnv } from "../../_lib/http";
import { hashPassword, verifyPassword } from "../../_lib/password";
import { sessionHashFromRequest, getSession, createSession, sessionCookie } from "../../_lib/session";

interface Env extends AuthEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);

  const tokenHash = sessionHashFromRequest(request);
  const session = await getSession(env.BACKOFFICE_DB, tokenHash);
  if (!session) return json({ error: "Not authenticated." }, 401);

  let currentPassword: unknown, newPassword: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    currentPassword = body.currentPassword;
    newPassword = body.newPassword;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 400);
  }

  const row = await env.BACKOFFICE_DB
    .prepare("SELECT password_hash FROM users WHERE id = ?1")
    .bind(session.user.id)
    .first<{ password_hash: string }>();
  if (!row) return json({ error: "Account not found." }, 404);

  if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword, row.password_hash))) {
    return json({ error: "Current password is incorrect." }, 401);
  }
  if (newPassword === currentPassword) {
    return json({ error: "New password must be different from the current one." }, 400);
  }

  const newHash = await hashPassword(newPassword);

  await env.BACKOFFICE_DB.batch([
    env.BACKOFFICE_DB
      .prepare("UPDATE users SET password_hash = ?1, must_change_password = 0 WHERE id = ?2")
      .bind(newHash, session.user.id),
    env.BACKOFFICE_DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash),
  ]);

  const raw = await createSession(env.BACKOFFICE_DB, session.user.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie(raw) },
  });
};
