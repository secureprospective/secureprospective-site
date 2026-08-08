# Back-Office Access Point — Provisioning & Ops

Built 2026-08-08. Invite-only auth for `secureprospective.com/members`, with
a real admin account (`secureprospective@gmail.com`) that has its own
console at `/members/admin` for inviting, removing, editing, and resetting
passwords for members. Pattern copied from TFM's members build
(`reference_cloudflare_d1_auth_pattern` in the backbone memory) — the code
shape is shared, the runtime is not. This D1 database, its Brevo sender,
and its secrets belong to SecureProspective only and must never be shared
with TFM (`feedback_tfm_sp_data_separation`).

Scope of this build: the access point (login, invite-redemption, session
cookie), the admin console, the database, and Turnstile-based threat
protection. Everything behind the plain member login wall
(`src/pages/members/index.astro`) is still a placeholder
"under construction" screen — real member-facing components are a later
session. The admin console itself (`/members/admin`) is real and functional
once provisioned.

## Cloudflare provisioning checklist (not yet done — see below)

CT105's stored API token (`/root/.cf_token`) is scoped to AI Search /
Workers AI / R2 only. It cannot create a D1 database or edit Pages project
settings. These steps need either a broader-scoped token or to be done by
hand in the dashboard:

1. **Create the D1 database:**
   `npx wrangler d1 create secureprospective-backoffice-db`
   (or via dashboard: Workers & Pages > D1 > Create database)
2. **Apply the migration:**
   `npx wrangler d1 execute secureprospective-backoffice-db --remote --file=migrations/0002_backoffice_auth.sql`
3. **Bind it in the Pages project** (`secureprospective-site`, Settings >
   Functions > D1 database bindings) — **both Production and Preview
   independently**, variable name `BACKOFFICE_DB`. Per the TFM lesson: a
   `wrangler.toml` `[[d1_databases]]` block only drives local `wrangler`
   CLI tooling, it does NOT propagate to a dashboard-managed git-connected
   Pages deploy.
4. **Confirm `nodejs_compat` compatibility flag** is set on the Pages
   project (Settings > Functions > Compatibility flags, Production +
   Preview). Required for `node:crypto` in the Functions runtime.
5. **Create a Turnstile widget** (Cloudflare dashboard > Turnstile > Add
   site), domain `secureprospective.com` (+ `.pages.dev` for previews).
   Managed challenge is fine. Note the **Site Key** and **Secret Key**.
6. **Set Pages secrets** (Settings > Environment variables, Production +
   Preview, "Encrypt" for the secret ones):
   - `TURNSTILE_SECRET_KEY` — from step 5
   - `ADMIN_BOOTSTRAP_KEY` — a random 32+ byte string
     (`openssl rand -base64 32`). One-time use: creates the first admin
     account, then every subsequent admin action goes through a normal
     login session, not this key. Treat it like a password, roll it after
     bootstrap if it ever leaked.
   - `BREVO_PRIVATE_API_KEY` — **deferred this session**, see below.
7. **Set the public Turnstile site key as a build-time env var**:
   `PUBLIC_TURNSTILE_SITE_KEY` (Production + Preview, does not need
   encryption — it's public by design, embedded in the page HTML).

## Bootstrapping the admin account

There is no public registration and no existing admin to send the first
invite, so the very first admin account is created by a one-time,
key-gated endpoint rather than through the normal invite flow:

```
curl -X POST https://secureprospective.com/api/auth/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <ADMIN_BOOTSTRAP_KEY>" \
  -d '{"password":"<choose a real password, 8+ chars>"}'
```

This hardcodes the email to `secureprospective@gmail.com` (the endpoint
refuses to create an admin under any other address) and 409s if an admin
already exists — it cannot be re-run to reset the password later. After
this runs once, log in normally at `/members/login` with that email and
password; `/members/admin` will be reachable.

## The admin console (`/members/admin`)

Once logged in as the admin, the console (session + `role='admin'` gated,
no separate key needed) supports:

- **Invite** — email in, creates an `invites` row, shows either "sent" (if
  Brevo is wired) or a copyable accept-link (if not).
- **Revoke** an outstanding invite.
- **Edit** a member — change email or promote/demote `role`
  (member ⇄ admin). An admin cannot demote themselves (no recovery path if
  the only admin locks themselves out).
- **Set password** — admin-triggered password reset for any member; also
  invalidates that member's existing sessions.
- **Remove** a member — deletes the account and its sessions outright (not
  a soft-delete). An admin cannot remove their own account.

All of this is real API + real D1 writes once provisioned — nothing here is
mocked.

## Brevo (deferred, 2026-08-08 decision)

TFM's own Brevo transactional send is unresolved in production
(`codeSent:false` even with a verified sender). Per Christopher's call this
session: build everything else first, wire Brevo last, once TFM's issue is
root-caused (or budget time to debug SP's send fresh, if that's faster).

Until `BREVO_PRIVATE_API_KEY` is set, invite creation still works — it just
shows `emailSent: false` and the raw accept-link in the console instead of
sending anything. Copy that link and send it to the invitee by hand until
Brevo is wired.

Before wiring: set a real verified sender in **SecureProspective's own**
Brevo account (`functions/_lib/email.ts`'s `SENDER` constant currently has a
`TODO-set-verified-sender@secureprospective.com` placeholder — do not deploy
with that unchanged, the send will just fail).

## Local dev testing

`_lib/http.ts`'s origin lock 403s `localhost` by design (matches TFM). For
local E2E testing against `wrangler pages dev`, temporarily add `localhost`
to `ALLOWED_HOSTS`, test, then revert before committing — never ship that
allowance to production.

## What's NOT built yet

- The real content behind the plain member `/members` view — placeholder
  "under construction" only, per this session's locked scope. (The admin
  console itself is the exception — it's real.)
- Password reset / forgot-password self-service for ordinary members (the
  admin console's "Set password" covers this manually for now).
- Brevo invite-email delivery (see above).
- Audit log of admin actions (invite/remove/edit/reset are not currently
  logged anywhere beyond D1's own row timestamps).
