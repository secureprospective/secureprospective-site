// Members-only gate for the SP+ Security Architecture report (decision
// 2026-09-17: the report is for members, not the open web).
//
// Why this sits at the root rather than in functions/members/…: the page is a
// static asset, and the Pages asset server normalises paths that the Functions
// router does not. On the preview, "/members//sp-plus-security-architecture/",
// "/members%2Fsp-plus-…", "/%6dembers/…" and "//members/…" all skipped a
// folder-scoped middleware and served the report. So every request passes
// through here and the path is normalised the way the asset server would read
// it before deciding. The cost is one Function invocation per request.

import type { AuthEnv } from "./_lib/http";
import { getActiveSession } from "./_lib/session";

const GATED_SLUG = "sp-plus-security-architecture";

function normalisedPath(url: string): string {
  let path = new URL(url).pathname;
  // Decode until stable, so double encoding cannot hide the slug either.
  for (let i = 0; i < 5; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      break;
    }
    if (decoded === path) break;
    path = decoded;
  }
  return path.replace(/\\/g, "/").replace(/\/{2,}/g, "/").toLowerCase();
}

export const onRequest: PagesFunction<AuthEnv> = async ({ request, env, next }) => {
  if (!normalisedPath(request.url).includes(GATED_SLUG)) return next();

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
