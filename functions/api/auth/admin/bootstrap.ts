// POST /api/auth/admin/bootstrap — one-time only. Creates the first admin
// account (secureprospective@gmail.com, hardcoded — this endpoint cannot be
// used to make any other address an admin) and immediately becomes a no-op
// (409) once any admin row exists. Gated by ADMIN_BOOTSTRAP_KEY, a
// Cloudflare Pages secret, not a session — there is no admin session to
// check yet on a fresh database. After this runs once, log in normally at
// /members/login and use the /members/admin console for everything else.
// The account is created with must_change_password=1 — the one-time
// password passed in here only gets you as far as /members/change-password.

import { randomUUID } from "node:crypto";
import { json, originAllowed, isJsonRequest, MIN_PASSWORD_LENGTH, type AuthEnv } from "../../../_lib/http";
import { hashPassword, timingSafeStringEqual } from "../../../_lib/password";

interface Env extends AuthEnv {}

const BOOTSTRAP_ADMIN_EMAIL = "secureprospective@gmail.com";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originAllowed(request)) return json({ error: "Forbidden origin." }, 403);
  if (!isJsonRequest(request)) return json({ error: "JSON body required." }, 415);

  const key = request.headers.get("X-Admin-Key") ?? "";
  if (!env.ADMIN_BOOTSTRAP_KEY || !timingSafeStringEqual(key, env.ADMIN_BOOTSTRAP_KEY)) {
    return json({ error: "Not authorized." }, 401);
  }

  const existingAdmin = await env.BACKOFFICE_DB
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .first<{ id: string }>();
  if (existingAdmin) {
    return json({ error: "An admin account already exists. Bootstrap is one-time only." }, 409);
  }

  let password: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    password = body.password;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 400);
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  try {
    await env.BACKOFFICE_DB
      .prepare(
        "INSERT INTO users (id, email, password_hash, role, created_at, email_verified_at, must_change_password) VALUES (?1, ?2, ?3, 'admin', ?4, ?4, 1)",
      )
      .bind(id, BOOTSTRAP_ADMIN_EMAIL, passwordHash, now)
      .run();
  } catch {
    return json({ error: "Could not create the admin account." }, 409);
  }

  return json({ ok: true, email: BOOTSTRAP_ADMIN_EMAIL }, 201);
};
