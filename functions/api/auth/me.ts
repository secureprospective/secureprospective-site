import { json, originAllowed, type AuthEnv } from "../../_lib/http";
import { sessionHashFromRequest, getSession } from "../../_lib/session";

interface Env extends AuthEnv {}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);

  const session = await getSession(env.BACKOFFICE_DB, sessionHashFromRequest(request));
  if (!session) return json({ error: "Not authenticated." }, 401);

  return json({
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      mustChangePassword: Boolean(session.user.must_change_password),
    },
  });
};
