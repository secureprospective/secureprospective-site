// POST /api/auth/admin/member-remove — deletes a member account and its
// live sessions. Sessions are deleted explicitly rather than relied on to
// cascade via the schema's FK — D1/SQLite only enforces FK actions when
// `PRAGMA foreign_keys=ON` is set on the connection, which isn't guaranteed
// per-request, so this doesn't trust it.

import { json, originAllowed, isJsonRequest, type AuthEnv } from "../../../_lib/http";
import { requireAdminSession } from "../../../_lib/admin";

interface Env extends AuthEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);
  const admin = await requireAdminSession(env.BACKOFFICE_DB, request);
  if (!admin) return json({ error: "Not authorized." }, 403);

  let id: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    id = body.id;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (typeof id !== "string" || !id) return json({ error: "Member id required." }, 400);
  if (id === admin.id) return json({ error: "You cannot remove your own account." }, 400);

  await env.BACKOFFICE_DB.batch([
    env.BACKOFFICE_DB.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(id),
    env.BACKOFFICE_DB.prepare("DELETE FROM users WHERE id = ?1").bind(id),
  ]);

  return json({ ok: true });
};
