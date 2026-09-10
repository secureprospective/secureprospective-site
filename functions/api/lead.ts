// Pages Function: POST /api/lead
//
// The single capture point for inbound interest from secureprospective.com.
// A submission is written to R2 as one JSON object per lead (the system of
// record) and then announced to Christopher by email. The R2 write is what
// determines success; the notification is best effort on top of it.
//
// R2 is used rather than D1 because the existing Pages token scope already
// covers it, and a lead is a whole document rather than something the site
// ever queries.

import { verifyTurnstile } from "../_lib/turnstile";
import { sendLeadNotification, type SendEmailBinding } from "../_lib/lead-notify";

interface Env {
  SP_LEADS: R2Bucket;
  CONTACT_TURNSTILE_SECRET_KEY: string;
  LEAD_EMAIL?: SendEmailBinding;
}

const ALLOWED_HOSTS = new Set([
  "secureprospective.com",
  "www.secureprospective.com",
]);

const ROUTES = new Set(["operating", "sp-plus", "prospective"]);
const SOURCES = new Set(["contact-form"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MAX = 120;
const EMAIL_MAX = 200;
const MESSAGE_MAX = 4000;
const PAGE_MAX = 200;

function hostAllowed(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    const h = new URL(origin).hostname;
    return ALLOWED_HOSTS.has(h) || h.endsWith(".secureprospective-site.pages.dev");
  } catch {
    return false;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

interface Payload {
  name?: unknown;
  email?: unknown;
  route?: unknown;
  message?: unknown;
  source?: unknown;
  page?: unknown;
  turnstileToken?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!hostAllowed(request)) return json({ error: "Forbidden origin." }, 403);

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const name = readString(payload.name, NAME_MAX);
  const email = readString(payload.email, EMAIL_MAX);
  const route = readString(payload.route, 40);
  const message = readString(payload.message, MESSAGE_MAX);
  const page = readString(payload.page, PAGE_MAX);
  const source = readString(payload.source, 40);

  if (!name) {
    return json({ error: "Add your name so Christopher knows who he is answering." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "That email address does not look right." }, 400);
  }
  if (!ROUTES.has(route)) {
    return json({ error: "Choose which line you are on." }, 400);
  }
  if (!SOURCES.has(source)) {
    return json({ error: "Unrecognised submission source." }, 400);
  }

  // Turnstile fails closed: the endpoint is public and a live campaign makes
  // it worth scripting against, so an unverifiable submission is refused
  // rather than waved through.
  const verified = await verifyTurnstile(
    env.CONTACT_TURNSTILE_SECRET_KEY,
    payload.turnstileToken,
    request.headers.get("CF-Connecting-IP"),
  );
  if (!verified) {
    return json({ error: "Verification failed. Reload the page and try again." }, 403);
  }

  const createdAt = new Date().toISOString();
  // Timestamp first so the bucket lists in the order the leads arrived; the
  // random suffix keeps two submissions in the same millisecond apart.
  const key = `leads/${createdAt}-${crypto.randomUUID().slice(0, 8)}.json`;

  const lead = {
    name,
    email,
    route,
    message,
    source,
    page,
    created_at: createdAt,
    ip: request.headers.get("CF-Connecting-IP") ?? "",
    user_agent: (request.headers.get("User-Agent") ?? "").slice(0, 300),
    country: (request.cf?.country as string | undefined) ?? "",
  };

  try {
    await env.SP_LEADS.put(key, JSON.stringify(lead, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch (err) {
    console.error("lead: R2 write failed", err instanceof Error ? err.message : String(err));
    return json({ error: "Could not save your details. Please try again." }, 502);
  }

  // The lead is safely stored from here on, so nothing below may turn the
  // visitor's successful submission into a failure.
  if (env.LEAD_EMAIL) {
    const notified = await sendLeadNotification(env.LEAD_EMAIL, { ...lead, key });
    if (!notified.ok) {
      console.error("lead: notification failed", notified.error, "stored as", key);
    }
  } else {
    console.error("lead: no LEAD_EMAIL binding, stored only", key);
  }

  return json({ ok: true });
};
