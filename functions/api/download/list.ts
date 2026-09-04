import { json, originAllowed, type AuthEnv } from "../../_lib/http";
import { sessionHashFromRequest, getSession } from "../../_lib/session";
import { publishedReleases } from "../../_lib/releases";

interface Env extends AuthEnv {}

/**
 * GET /api/download/list
 *
 * The download page draws itself from this rather than from hardcoded
 * markup, so a new release is one commit to releases.ts and nothing in the
 * page changes. Session-gated like every other back-office route: an
 * unauthenticated caller learns nothing, not even the filenames.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);

  const session = await getSession(env.BACKOFFICE_DB, sessionHashFromRequest(request));
  if (!session) return json({ error: "Not authenticated." }, 401);

  return json({
    releases: publishedReleases().map((r) => ({
      id: r.id,
      label: r.label,
      filename: r.filename,
      size: r.size,
      sha256: r.sha256,
      released: r.released,
      note: r.note,
    })),
  });
};
