// POST /api/auth/admin/member-edit — change a member's email and/or role.
// A logged-in admin cannot demote their own account (would lock the console
// with no other admin to undo it — the DB has no other bootstrap path).

import { json, originAllowed, isJsonRequest, EMAIL_RE, type AuthEnv } from "../../../_lib/http";
import { requireAdminSession } from "../../../_lib/admin";

interface Env extends AuthEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);
  const admin = await requireAdminSession(env.BACKOFFICE_DB, request);
  if (!admin) return json({ error: "Not authorized." }, 403);

  let id: unknown, email: unknown, role: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    id = body.id;
    email = body.email;
    role = body.role;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (typeof id !== "string" || !id) return json({ error: "Member id required." }, 400);

  const current = await env.BACKOFFICE_DB
    .prepare("SELECT id, email, role FROM users WHERE id = ?1")
    .bind(id)
    .first<{ id: string; email: string; role: string }>();
  if (!current) return json({ error: "Member not found." }, 404);

  const nextEmail =
    typeof email === "string" && email.trim() ? email.trim().toLowerCase() : current.email;
  const nextRole =
    typeof role === "string" && (role === "admin" || role === "member") ? role : current.role;

  if (nextEmail !== current.email && !EMAIL_RE.test(nextEmail)) {
    return json({ error: "Invalid email." }, 400);
  }
  if (current.id === admin.id && nextRole !== "admin") {
    return json({ error: "You cannot remove your own admin role." }, 400);
  }

  try {
    await env.BACKOFFICE_DB
      .prepare("UPDATE users SET email = ?1, role = ?2 WHERE id = ?3")
      .bind(nextEmail, nextRole, id)
      .run();
  } catch {
    return json({ error: "Could not update member. Email may already be in use." }, 409);
  }

  return json({ ok: true, member: { id, email: nextEmail, role: nextRole } });
};
