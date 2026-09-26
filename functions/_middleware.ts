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

// Astro names a shared CSS chunk after one of the pages in it, so the homepage
// ships /_astro/sp-plus-security-architecture.<hash>.css -- a public stylesheet
// whose own filename contains the gated slug. A substring match cannot tell it
// apart from the report, so the gate 302'd it to the login page and every
// visitor without it already cached got the homepage unstyled. Fingerprinted
// build assets are public by construction; exempt them.
const PUBLIC_ASSET_PREFIXES = ["/_astro/", "/fonts/", "/assets/"];

function isPublicAsset(path: string): boolean {
  // Never exempt a path containing a ".." segment. This check runs on the
  // normalised path, which collapses slashes and decodes escapes but does NOT
  // resolve dot segments, so "/_astro/../sp-plus-security-architecture/" would
  // otherwise walk straight out of the asset directory and skip the gate. That
  // URL is gated today and must stay gated.
  if (path.split("/").includes("..")) return false;
  return PUBLIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// Preview kill-switch, 2026-09-17. Preview deployments bind the SAME D1
// databases and R2 buckets as production, and the project deploys every branch
// automatically, so a pushed branch used to become a public site wired to real
// member accounts, sessions, leads and releases. On any deployment that is not
// production, the back office and its APIs are refused outright. Gated on
// CF_PAGES_BRANCH, which Cloudflare injects itself: there is nothing to set and
// nothing to forget to unset. Set PREVIEW_ALLOW_BACKOFFICE=1 on a specific
// preview to test the members area there deliberately.
function backOfficeDisabled(env: PreviewEnv, path: string): boolean {
  const branch = env.CF_PAGES_BRANCH;
  if (typeof branch !== "string" || branch === "" || branch === "main") return false;
  if (env.PREVIEW_ALLOW_BACKOFFICE === "1") return false;
  // The resume assistant touches no member data (AI binding + a quota KV), so
  // it runs on previews and can be tested there before it ships.
  if (path === "/api/chat") return false;
  return path.startsWith("/api/") || path === "/members" || path.startsWith("/members/");
}

interface PreviewEnv extends AuthEnv {
  CF_PAGES_BRANCH?: string;
  PREVIEW_ALLOW_BACKOFFICE?: string;
}

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

export const onRequest: PagesFunction<PreviewEnv> = async ({ request, env, next }) => {
  const path = normalisedPath(request.url);

  if (backOfficeDisabled(env, path)) {
    return new Response(
      JSON.stringify({ error: "The back office is disabled on preview deployments." }),
      { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  }

  if (!path.includes(GATED_SLUG) || isPublicAsset(path)) return next();

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
