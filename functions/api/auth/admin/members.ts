// GET /api/auth/admin/members — list every member account.

import { json, originAllowed, type AuthEnv } from "../../../_lib/http";
import { requireAdminSession } from "../../../_lib/admin";

interface Env extends AuthEnv {}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  const admin = await requireAdminSession(env.BACKOFFICE_DB, request);
  if (!admin) return json({ error: "Not authorized." }, 403);

  const { results } = await env.BACKOFFICE_DB
    .prepare("SELECT id, email, role, created_at, email_verified_at FROM users ORDER BY created_at DESC")
    .all();

  return json({ members: results });
};
