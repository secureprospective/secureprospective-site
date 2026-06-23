// Pages Function: POST /api/lead
// Captures a visitor lead (name + email) before the chat unlocks.
// Stored as one JSON object per lead in the R2 binding LEADS so Christopher
// has someone to contact back. (R2 chosen over D1: uses existing token scope.)

interface Env {
  LEADS: R2Bucket;
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

  const now = new Date().toISOString();
  const lead = {
    name: name.trim().slice(0, 120),
    email: email.trim().slice(0, 200),
    created_at: now,
    ip: request.headers.get("CF-Connecting-IP") ?? "",
    user_agent: (request.headers.get("User-Agent") ?? "").slice(0, 300),
  };

  // Sortable key: timestamp first, short random suffix to avoid collisions.
  const key = `leads/${now}-${Math.random().toString(36).slice(2, 8)}.json`;

  try {
    await env.LEADS.put(key, JSON.stringify(lead, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch {
    return json({ error: "Could not save details. Please try again." }, 502);
  }

  return json({ ok: true });
};
