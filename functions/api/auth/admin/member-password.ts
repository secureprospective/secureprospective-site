// POST /api/auth/admin/member-password — admin sets a new password directly
// for a member (support/reset path; there is no self-service forgot-password
// flow yet). Existing sessions for that member are invalidated so a stolen
// or shared old password stops working immediately.

import { json, originAllowed, isJsonRequest, MIN_PASSWORD_LENGTH, type AuthEnv } from "../../../_lib/http";
import { requireAdminSession } from "../../../_lib/admin";
import { hashPassword } from "../../../_lib/password";

interface Env extends AuthEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);
  const admin = await requireAdminSession(env.BACKOFFICE_DB, request);
  if (!admin) return json({ error: "Not authorized." }, 403);

  let id: unknown, newPassword: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    id = body.id;
    newPassword = body.newPassword;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (typeof id !== "string" || !id) return json({ error: "Member id required." }, 400);
  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 400);
  }

  const passwordHash = await hashPassword(newPassword);
  const result = await env.BACKOFFICE_DB
    .prepare("UPDATE users SET password_hash = ?1 WHERE id = ?2")
    .bind(passwordHash, id)
    .run();
  if (!result.meta.changes) return json({ error: "Member not found." }, 404);

  await env.BACKOFFICE_DB.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(id).run();

  return json({ ok: true });
};
