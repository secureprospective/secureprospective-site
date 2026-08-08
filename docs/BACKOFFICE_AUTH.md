# Back-Office Access Point — Provisioning & Ops

Built 2026-08-08. Invite-only auth for `secureprospective.com/members`.
Pattern copied from TFM's members build (`reference_cloudflare_d1_auth_pattern`
in the backbone memory) — the code shape is shared, the runtime is not. This
D1 database, its Brevo sender, and its secrets belong to SecureProspective
only and must never be shared with TFM (`feedback_tfm_sp_data_separation`).

Scope of this build: the access point (login, invite-redemption, session
cookie), the database, and Turnstile-based threat protection. Everything
behind the login wall is a placeholder "under construction" screen —
`src/pages/members/index.astro` — until real back-office components get
built in a later session.

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
   - `ADMIN_INVITE_KEY` — a random 32+ byte string (`openssl rand -base64 32`).
     Whoever holds this can mint invites. Treat it like a password.
   - `BREVO_PRIVATE_API_KEY` — **deferred this session**, see below.
7. **Set the public Turnstile site key as a build-time env var**:
   `PUBLIC_TURNSTILE_SITE_KEY` (Production + Preview, does not need
   encryption — it's public by design, embedded in the page HTML).

## Brevo (deferred, 2026-08-08 decision)

TFM's own Brevo transactional send is unresolved in production
(`codeSent:false` even with a verified sender). Per Christopher's call this
session: build everything else first, wire Brevo last, once TFM's issue is
root-caused (or budget time to debug SP's send fresh, if that's faster).

Until `BREVO_PRIVATE_API_KEY` is set, `POST /api/auth/invite` still works —
it just returns `emailSent: false` and the `acceptUrl` in its JSON response.
Copy that URL and send it to the invitee by hand (any email client) until
Brevo is wired.

Before wiring: set a real verified sender in **SecureProspective's own**
Brevo account (`functions/_lib/email.ts`'s `SENDER` constant currently has a
`TODO-set-verified-sender@secureprospective.com` placeholder — do not deploy
with that unchanged, the send will just fail).

## Creating an invite (once provisioned)

```
curl -X POST https://secureprospective.com/api/auth/invite \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <ADMIN_INVITE_KEY>" \
  -d '{"email":"agent@example.com","createdBy":"christopher"}'
```

Returns `{ ok, email, acceptUrl, emailSent, expiresAt }`. The invite expires
in 7 days if unredeemed. Re-inviting the same email while an invite is still
outstanding 409s — no revoke endpoint exists yet (delete the row from
`invites` directly via `wrangler d1 execute` if a re-issue is needed before
this session builds admin tooling for it).

## Local dev testing

`_lib/http.ts`'s origin lock 403s `localhost` by design (matches TFM). For
local E2E testing against `wrangler pages dev`, temporarily add `localhost`
to `ALLOWED_HOSTS`, test, then revert before committing — never ship that
allowance to production.

## What's NOT built yet

- Any UI/tooling to create or revoke invites other than the raw curl call
  above — there's no admin panel.
- The real content behind `/members` — placeholder "under construction"
  only, per this session's locked scope.
- Password reset / forgot-password flow.
- Brevo invite-email delivery (see above).
