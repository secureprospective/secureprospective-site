// POST /api/auth/admin/invite-revoke — delete an outstanding (unredeemed)
// invite by id, so the same email can be re-invited if needed.

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
  if (typeof id !== "string" || !id) return json({ error: "Invite id required." }, 400);

  const result = await env.BACKOFFICE_DB
    .prepare("DELETE FROM invites WHERE id = ?1 AND redeemed_at IS NULL")
    .bind(id)
    .run();

  if (!result.meta.changes) return json({ error: "Invite not found or already redeemed." }, 404);
  return json({ ok: true });
};
