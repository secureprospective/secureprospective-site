# Members-area security audit and hardening

**Date:** 2026-09-17
**Branch:** `session/security-hardening` (fast-forwarded into `main`, live) · `session/astro-7-upgrade` (not pushed)
**Status:** shipped and verified in production; Cloudflare items partly done, listed below

## What changed

Live on secureprospective.com (`92ce511`, verified against the running site, not the build):

- **Member-only ISO** was sent with `Cache-Control: public, immutable`, so a shared cache could hand it to an anonymous visitor. Now `private`.
- **`must_change_password` is enforced server-side.** It was checked only in page JavaScript, so a session opened with an admin-set one-time password could call the download and admin APIs directly. New `getActiveSession()` in `_lib/session.ts` fails closed; `me`, `change-password` and `logout` still work.
- **Password change ends every session for that user** (was: only the current one, leaving a stolen cookie valid up to 30 days). An admin email or role change ends that member's sessions too.
- **Origin lock narrowed** from any `*.pages.dev` to `*.secureprospective-site.pages.dev`. A foreign Pages origin now gets 403, previously it passed.
- **Password minimum raised** 8 → 12, server and UI.
- **Admin console XSS fixed**: emails and `created_by` went into `innerHTML`, and `EMAIL_RE` accepts `<img/src=x/onerror=…>@a.co`. All interpolated values now escaped.
- **`/api/auth/admin/bootstrap` deleted** along with `ADMIN_BOOTSTRAP_KEY` (route was spent; it returned 409 forever).
- **SP+ Security Architecture report is now members-only** (Christopher's call: it was public). Gated in `functions/_middleware.ts`.
- **Preview kill-switch**: any deployment whose `CF_PAGES_BRANCH` is not `main` refuses `/api/*` and `/members/*`. `PREVIEW_ALLOW_BACKOFFICE=1` opts one preview back in.

Cloudflare account, by API: preview auto-deploys turned off, all 120 stale preview deployments deleted, Access lock added to preview hostnames, `NODE_VERSION` 20 → 22 both environments, `ADMIN_BOOTSTRAP_KEY` removed, rate limit rule created on `/api/auth/*`. Christopher raised minimum TLS to 1.2 and enabled Always Use HTTPS in the dashboard.

## Why

Christopher asked for a full audit of the site, the members area and the infrastructure: "make sure our security is up to snuff and there isnt a way to break into the members area".

The worst finding was not in the code. Preview deployments bound the **same D1 databases and R2 buckets as production**, and the project deployed **every branch automatically**, so any pushed branch became a public, unauthenticated site wired to real member accounts, sessions, leads and release files. Two such previews were running an old setup wizard whose `dev-bypass` fakes a Google login on any non-main branch.

## Verification

- 39 tests pass, including 23 written for this work. All 23 fail against the pre-audit code; that was checked by stashing the fixes, not assumed.
- Build clean on Astro 4.16.19 (production) and on 7.3.3 (upgrade branch).
- Production, unauthenticated: foreign origin 403, bootstrap 404, `/api/auth/me` 401, ISO 401, architecture report 302 to login.
- The first gate on that report was bypassable via `/members//…`, `%2F`, `%6d` and `//members/…`, because the asset server normalises paths the Functions router does not. Replaced with a root middleware that normalises first; 18 variants now all 302 or 400 with nothing leaked.
- Kill-switch confirmed live on the preview: public pages 200, everything under `/api/` and `/members/` 503.
- TLS 1.1 handshake refused, TLS 1.2 serves, `http://` 301s.
- Old wizard preview URLs now 404.

## Open items / what Claude or Christopher should check

1. **The rate limit rule does not work.** It reads back enabled (5 req/10s per IP, block 10s, POST `/api/auth/*`) but 20+ request bursts all returned 200, fifteen minutes after creation. Either the Free plan needs different values or something else is wrong. Login has no lockout until this is settled.
2. **DNSSEC is still off.** No DS record published.
3. **Cache rules were never read** (token lacked Cache Rules Read). A `http_request_cache_settings` ruleset exists and HTML comes back `public, max-age=14400` with `cf-cache-status: HIT`, which the site's own `_headers` does not explain. If a rule forces caching on HTML, verify the gated report cannot be served from cache to an anonymous visitor.
4. **Preview still shares production databases and buckets.** Auto-deploys are off and previews are Access-locked, so nothing reaches them unattended, but separate preview D1/R2 is the real fix.
5. **Astro 7 is ready but unshipped**, on `session/astro-7-upgrade` (`2a5ddd5`, rebased on current main, carries `.node-version` 22). It clears 1 critical and 15 high dependency advisories. `NODE_VERSION=22` is now set, so it can deploy; it needs Christopher's per-deploy approval.
6. **`sp-unsub-mock`** answers on the live domain at `secureprospective.com/unsubscribe` and `unsubscribe.secureprospective.com`. A Worker named "mock" on production deserves a look. `sp-crm` (on `crm.secureprospective.com`) and `cap-shield` are also unreviewed.
7. **Never listed:** account members with 2FA status, and the API token inventory. Both are user-level dashboard pages.
8. **CSP still allows `'unsafe-inline'`** for scripts, which weakens the XSS fix. No CAA record on the zone.
9. **Token hygiene:** delete `shy-silence-0d89` (broad access, created during this session, never worked). `sp-plus-releases-2026-09-17` should stay R2-only.
10. **Not observed:** a logged-in member walking the site. Login, download, admin console and page transitions were never exercised with a real session.

Full audit with severities and evidence: `docs/security/AUDIT-2026-09-17.md`.
Cloudflare prompt used for the account work: `docs/security/CLOUDFLARE-AI-PROMPT-2026-09-17.md`.
