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
cookie, forced password change), the admin console, the database, and
Turnstile-based threat protection. Everything behind the plain member login
wall (`src/pages/members/index.astro`) is still a placeholder "under
construction" screen — real member-facing components are a later session.
The admin console itself (`/members/admin`) is real and functional.

## Cloudflare provisioning — DONE (2026-08-08)

Provisioned via a temporary account-scoped API token (D1 Edit, Pages Edit,
Turnstile Edit, Account Settings Read), created by Christopher, used once
from CT105, then should be revoked/rolled from the dashboard once this
session's work is confirmed live — it should not be left standing.

- **D1 database** `secureprospective-backoffice-db` created
  (`fd3d4c74-1868-4695-a23e-b592637d8ec1`), migrations 0002 + 0003 applied.
- **Bound as `BACKOFFICE_DB`** in the Pages project, Production + Preview
  both. Existing bindings (`ECOSYSTEM_DB` D1, `LEADS` R2) were read first
  and echoed back into the same PATCH request so nothing existing was
  dropped — confirmed via a follow-up GET.
- **`nodejs_compat`** compatibility flag set, Production + Preview.
- **Turnstile widget** created for `secureprospective.com` +
  `secureprospective-site.pages.dev`, managed-challenge mode.
- **Production secrets set** via `wrangler pages secret put` (additive,
  doesn't touch other env vars — confirmed `CF_API_TOKEN`/`NODE_VERSION`
  survived): `TURNSTILE_SECRET_KEY`, `ADMIN_BOOTSTRAP_KEY`,
  `PUBLIC_TURNSTILE_SITE_KEY`.
- **Preview secrets — NOT set.** `wrangler pages secret put` only targets
  Production; setting Preview's secrets requires the raw Pages REST API,
  and doing that without knowing whether it deep-merges or replaces
  `env_vars` risked wiping Preview's `CF_API_TOKEN` (its value can't be
  read back to reconstruct it). Left alone deliberately — Preview auth
  fails closed (Turnstile/bootstrap both reject) until someone sets those
  three by hand in the dashboard. Low priority: Preview isn't customer
  traffic.
- **`BREVO_PRIVATE_API_KEY` — deferred**, see below.

## Bootstrapping the admin account

There is no public registration and no existing admin to send the first
invite, so the very first admin account is created by a one-time,
key-gated endpoint rather than through the normal invite flow. It sets
`must_change_password=1` on creation — the password passed in here is a
one-time password only, good for exactly one login:

```
curl -X POST https://secureprospective.com/api/auth/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <ADMIN_BOOTSTRAP_KEY>" \
  -d '{"password":"<a one-time password, 8+ chars>"}'
```

This hardcodes the email to `secureprospective@gmail.com` (the endpoint
refuses to create an admin under any other address) and 409s if an admin
already exists — it cannot be re-run to reset the password later. After
this runs once, log in normally at `/members/login` with that one-time
password; the login immediately redirects to `/members/change-password`
(current password + new password, min 8 chars, must differ from the old
one) before the console becomes reachable. That change also rotates the
session, so the one-time-password session doesn't linger.

## The admin console (`/members/admin`)

Once logged in as the admin, the console (session + `role='admin'` gated,
no separate key needed) supports:

- **Invite** — email in, creates an `invites` row, shows either "sent" (if
  Brevo is wired) or a copyable accept-link (if not).
- **Revoke** an outstanding invite.
- **Edit** a member — change email or promote/demote `role`
  (member ⇄ admin). An admin cannot demote themselves (no recovery path if
  the only admin locks themselves out).
- **Set password** — admin-triggered password reset for any member. Same
  one-time-password model as bootstrap: sets `must_change_password=1` and
  invalidates that member's existing sessions, so the admin-chosen
  password only gets them as far as `/members/change-password`.
- **Remove** a member — deletes the account and its sessions outright (not
  a soft-delete). An admin cannot remove their own account.

All of this is real API + real D1 writes — nothing here is mocked.

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
- Self-service forgot-password for ordinary members who aren't locked out
  (the admin console's "Set password" covers admin-initiated resets; there
  is no "email me a reset link" flow).
- Brevo invite-email delivery (see above).
- Preview-environment secrets (see Cloudflare provisioning above).
- Audit log of admin actions (invite/remove/edit/reset are not currently
  logged anywhere beyond D1's own row timestamps).
