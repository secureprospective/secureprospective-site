import { json, originAllowed, type AuthEnv } from "../../_lib/http";
import { sessionHashFromRequest, getSession } from "../../_lib/session";
import { findRelease } from "../../_lib/releases";

interface Env extends AuthEnv {
  // R2 bucket holding the release ISOs. Bound in the Pages project as
  // SPPLUS_RELEASES. R2 is used rather than Google Drive because Drive
  // serves a virus-scan interstitial instead of the file for anything over
  // ~100 MB, and enforces an invisible per-file daily download quota that
  // turns into an error page for every advisor once it trips. R2 has no
  // egress fee and honours Range, which a 5.7 GB download needs.
  SPPLUS_RELEASES: R2Bucket;
}

/**
 * GET /api/download/iso?v=<release id>
 *
 * Streams the ISO straight from R2 through the Worker so the object stays
 * private -- there is no public bucket URL to share past the login. The
 * body is piped, never buffered: a 5.7 GB object would not fit in a
 * Worker's memory, and R2's body is already a ReadableStream.
 *
 * Range requests are honoured deliberately. At this size a dropped
 * connection is normal, and without Range the advisor restarts from zero
 * every time. R2's `range` option plus a 206 is what makes the browser's
 * own resume work.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);

  const session = await getSession(env.BACKOFFICE_DB, sessionHashFromRequest(request));
  if (!session) return json({ error: "Not authenticated." }, 401);

  const release = findRelease(new URL(request.url).searchParams.get("v"));
  if (!release) return json({ error: "No such release." }, 404);

  // The binding being absent is a deployment mistake, not a member error.
  // Say so plainly instead of throwing a 500 with a stack the advisor
  // cannot act on.
  if (!env.SPPLUS_RELEASES) {
    return json({ error: "Downloads are not configured on this deployment." }, 503);
  }

  const rangeHeader = request.headers.get("Range");
  const object = await env.SPPLUS_RELEASES.get(release.key, {
    range: rangeHeader ? request.headers : undefined,
    onlyIf: request.headers,
  });

  if (!object) return json({ error: "That build is no longer available." }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Content-Type", "application/x-iso9660-image");
  headers.set("Content-Disposition", `attachment; filename="${release.filename}"`);
  headers.set("Accept-Ranges", "bytes");
  // The ISO for a given release id never changes -- a new build is a new
  // id -- so it is safe to let the edge and the browser keep it.
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  // Printed on the page too, but a scripted download should not have to
  // scrape HTML to learn what to verify against.
  headers.set("X-SPPlus-Sha256", release.sha256);

  // `body` is null for a conditional miss (If-None-Match) or a HEAD-like
  // read; that is a 304, not a broken download.
  if (!("body" in object) || object.body === null) {
    return new Response(null, { status: 304, headers });
  }

  if (object.range && rangeHeader) {
    const r = object.range as { offset?: number; length?: number; suffix?: number };
    const size = object.size;
    let start: number;
    let end: number;
    if (typeof r.suffix === "number") {
      start = size - r.suffix;
      end = size - 1;
    } else {
      start = r.offset ?? 0;
      end = start + (r.length ?? size - start) - 1;
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  return new Response(object.body, { status: 200, headers });
};
