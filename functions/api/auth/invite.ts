// POST /api/auth/invite — admin-only. Creates a single-use invite for one
// email address and returns the accept-invite URL (and attempts to email
// it, non-fatally — see _lib/email.ts). There is no admin UI yet: this
// endpoint is called directly (curl/script) by whoever holds
// ADMIN_INVITE_KEY, a Cloudflare Pages secret. Back-office access is
// invite-only by design (2026-08-08 decision) — there is no public
// /register endpoint anywhere in this API.

import { randomUUID, randomBytes, createHash } from "node:crypto";
import { json, originAllowed, isJsonRequest, EMAIL_RE, type AuthEnv } from "../../_lib/http";
import { timingSafeStringEqual } from "../../_lib/password";
import { sendInviteEmail } from "../../_lib/email";

interface Env extends AuthEnv {}

const INVITE_TTL_DAYS = 7;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);

  const adminKey = request.headers.get("X-Admin-Key") ?? "";
  if (!env.ADMIN_INVITE_KEY || !timingSafeStringEqual(adminKey, env.ADMIN_INVITE_KEY)) {
    return json({ error: "Not authorized." }, 401);
  }

  let email: unknown, createdBy: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    email = body.email;
    createdBy = body.createdBy;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email as string)) return json({ error: "A valid email is required." }, 400);
  createdBy = typeof createdBy === "string" && createdBy.trim() ? createdBy.trim() : "unknown";

  const existingUser = await env.BACKOFFICE_DB
    .prepare("SELECT id FROM users WHERE email = ?1")
    .bind(email)
    .first<{ id: string }>();
  if (existingUser) return json({ error: "An account already exists for this email." }, 409);

  const id = randomUUID();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    await env.BACKOFFICE_DB
      .prepare(
        "INSERT INTO invites (id, email, token_hash, created_by, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
      )
      .bind(id, email, tokenHash, createdBy, now, expiresAt)
      .run();
  } catch {
    // UNIQUE(email) fired: an outstanding invite already exists for this address.
    return json({ error: "An invite already exists for this email. Revoke it first." }, 409);
  }

  const origin = new URL(request.url).origin;
  const acceptUrl = `${origin}/members/accept-invite?token=${rawToken}`;

  let emailSent = false;
  if (env.BREVO_PRIVATE_API_KEY) {
    const sent = await sendInviteEmail(env.BREVO_PRIVATE_API_KEY, email as string, acceptUrl);
    emailSent = sent.ok;
  }

  // The link is always returned in the response, regardless of emailSent,
  // so an admin can copy/paste it by hand while Brevo send is unwired/unreliable.
  return json({ ok: true, email, acceptUrl, emailSent, expiresAt }, 201);
};
