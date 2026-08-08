import { json, originAllowed, isJsonRequest, type AuthEnv } from "../../_lib/http";
import { sessionHashFromRequest, clearSessionCookie } from "../../_lib/session";

interface Env extends AuthEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);

  const tokenHash = sessionHashFromRequest(request);
  if (tokenHash) {
    await env.BACKOFFICE_DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() },
  });
};
