// GET  /api/auth/admin/invites — list all outstanding + historical invites.
// POST /api/auth/admin/invites — create one. Both admin-session gated.

import { randomUUID, randomBytes, createHash } from "node:crypto";
import { json, originAllowed, isJsonRequest, EMAIL_RE, type AuthEnv } from "../../../_lib/http";
import { requireAdminSession } from "../../../_lib/admin";
import { sendInviteEmail } from "../../../_lib/email";

interface Env extends AuthEnv {}

const INVITE_TTL_DAYS = 7;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  const admin = await requireAdminSession(env.BACKOFFICE_DB, request);
  if (!admin) return json({ error: "Not authorized." }, 403);

  const { results } = await env.BACKOFFICE_DB
    .prepare(
      "SELECT id, email, created_by, created_at, expires_at, redeemed_at FROM invites ORDER BY created_at DESC",
    )
    .all();

  return json({ invites: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);
  const admin = await requireAdminSession(env.BACKOFFICE_DB, request);
  if (!admin) return json({ error: "Not authorized." }, 403);

  let email: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    email = body.email;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email as string)) return json({ error: "A valid email is required." }, 400);

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
      .bind(id, email, tokenHash, admin.email, now, expiresAt)
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
  // so the console can show a "copy link" fallback while Brevo is unwired.
  return json({ ok: true, email, acceptUrl, emailSent, expiresAt }, 201);
};
