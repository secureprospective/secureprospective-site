// Shared HTTP helpers for the back-office auth API. Import-only (the
// leading underscore on `_lib` keeps Pages Functions from exposing this
// directory as routes). Pattern copied from TFM's members build
// (reference_cloudflare_d1_auth_pattern) — the RUNTIME below is
// SecureProspective's own, never TFM's.

export interface AuthEnv {
  BACKOFFICE_DB: D1Database;
  // Private, server-side-only Brevo transactional-email key. Never prefixed
  // PUBLIC_, never committed, added as a Cloudflare Pages secret directly.
  // Wiring deferred this session — see docs/BACKOFFICE_AUTH.md.
  BREVO_PRIVATE_API_KEY?: string;
  // Turnstile secret key, verified server-side against every login and
  // invite-accept submission. Cloudflare Pages secret, never committed.
  TURNSTILE_SECRET_KEY: string;
  // Shared secret gating the admin-only invite-creation endpoint. Cloudflare
  // Pages secret. There is no admin UI yet — invites are created by whoever
  // holds this key, via a direct authenticated request.
  ADMIN_INVITE_KEY: string;
}

export function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// Origin lock, same spirit as functions/api/lead.ts. Empty Origin (curl,
// same-origin GETs) is allowed; a foreign Origin is rejected.
const ALLOWED_HOSTS = new Set([
  "secureprospective.com",
  "www.secureprospective.com",
]);

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    const h = new URL(origin).hostname;
    return ALLOWED_HOSTS.has(h) || h.endsWith(".pages.dev");
  } catch {
    return false;
  }
}

// CSRF complement to SameSite=Lax: state-changing calls must be JSON, which a
// hostile <form>/<img> cannot produce.
export function isJsonRequest(request: Request): boolean {
  return (request.headers.get("Content-Type") ?? "").startsWith("application/json");
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
