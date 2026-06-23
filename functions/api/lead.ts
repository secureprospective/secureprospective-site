// Pages Function: POST /api/lead
// Captures a visitor lead (name + email) before the chat unlocks.
// Stored in the D1 binding LEADS_DB so Christopher has someone to contact back.

interface Env {
  LEADS_DB: D1Database;
}

const ALLOWED_HOSTS = new Set([
  "secureprospective.com",
  "www.secureprospective.com",
]);

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

// Conservative, permissive-enough email shape check.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!hostAllowed(request)) return json({ error: "Forbidden origin." }, 403);

  let name: unknown, email: unknown;
  try {
    ({ name, email } = (await request.json()) as { name?: unknown; email?: unknown });
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (typeof name !== "string" || !name.trim()) {
    return json({ error: "Name is required." }, 400);
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return json({ error: "A valid email is required." }, 400);
  }

  const cleanName = name.trim().slice(0, 120);
  const cleanEmail = email.trim().slice(0, 200);
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const ua = (request.headers.get("User-Agent") ?? "").slice(0, 300);

  try {
    await env.LEADS_DB.prepare(
      "INSERT INTO leads (name, email, ip, user_agent) VALUES (?, ?, ?, ?)"
    )
      .bind(cleanName, cleanEmail, ip, ua)
      .run();
  } catch {
    // Don't block the visitor from chatting if the write hiccups; just report.
    return json({ error: "Could not save details. Please try again." }, 502);
  }

  return json({ ok: true });
};
