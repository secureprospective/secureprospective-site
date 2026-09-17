// Members-only gate for the SP+ Security Architecture report (decision
// 2026-09-17: the report is for members, not the open web). The page is a
// static build, so the gate has to run in front of the asset: Pages runs this
// middleware for the path and everything below it before serving the file.
//
// Fails closed exactly like the APIs: no active session, or a session still
// holding an admin-chosen one-time password, goes to the login page.

import type { AuthEnv } from "../../_lib/http";
import { getActiveSession } from "../../_lib/session";

export const onRequest: PagesFunction<AuthEnv> = async ({ request, env, next }) => {
  const session = await getActiveSession(env.BACKOFFICE_DB, request);
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/members/login", "Cache-Control": "no-store" },
    });
  }

  const response = await next();
  // _headers gives HTML an s-maxage for the public pages. This one must never
  // sit in a shared cache, or the edge would serve it to the next visitor.
  const gated = new Response(response.body, response);
  gated.headers.set("Cache-Control", "private, no-store");
  return gated;
};
