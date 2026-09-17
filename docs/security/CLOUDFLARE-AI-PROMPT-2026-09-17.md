You are working on Cloudflare account `002dd2f758b67ac08d05a3809d65a25a`, zone `secureprospective.com`, Pages project `secureprospective-site`. Do the tasks in order. Do not create API tokens. Never print secret values; list secret names only. At the end, give me the REPORT block exactly as specified.

## Part A: fix the failed production build
1. In Pages project `secureprospective-site` → Settings → Variables and Secrets, set `NODE_VERSION` to `22` in the **Production** environment. If the **Preview** environment also has `NODE_VERSION`, set that to `22` too.
2. Retry the failed production deployment for commit `df07643` on branch `main`. Wait for it to finish and report its status. If it fails, give me the last 40 lines of its build log.

## Part B: remove stale preview deployments
3. Delete every **Preview** deployment of the project, except the newest deployment of branch `session/security-hardening`. Do not touch any **Production** deployment. Aliased branch previews count, including `session-advisor-os-poc`, `bee-impeccable-setup`, `session-contact-forms`, `session-watercolor-portrait` and `backup/beelink-main-20260917`. If a deployment refuses deletion because an alias points at it, delete it with the force/alias option. Report how many you deleted and list any that failed.

## Part C: lock preview deployments
4. On the Pages project, enable the Cloudflare Access policy for preview deployments ("Enable access policy" under Settings → General / Access policy). The policy must allow only the email `christopher@secureprospective.com` and `secureprospective@gmail.com`. Confirm that `https://secureprospective-site.pages.dev` and the production custom domains are NOT covered. Only preview hostnames `*.secureprospective-site.pages.dev` are covered.

## Part D: login rate limiting (free plan)
5. Create one WAF rate limiting rule on zone `secureprospective.com`:
   - Name: `members-auth-rate-limit`
   - Match: URI path starts with `/api/auth/` AND request method is `POST`
   - Counting characteristic: IP
   - Threshold: 5 requests per 10 seconds
   - Action: Block for 10 seconds
   If the free plan only allows different period/duration values, use the closest allowed values and tell me what you used.

## Part E: report only, change nothing
6. List all Cache Rules, Page Rules, and Configuration Rules on the zone, with their match expressions and settings. I specifically need to know whether any rule sets "Cache Everything" / "Eligible for cache" on HTML or overrides Edge TTL. HTML responses currently show `cache-control: public, max-age=14400` and `cf-cache-status: HIT`.
7. For the Pages project, list the variables, secrets (names only) and bindings (D1, R2, KV) for **Production** and for **Preview** separately. For each D1 and R2 binding, include the database/bucket name and ID, so I can see whether Preview points at the production databases.
8. Show the Preview branch control setting: are all branches deployed, or only some?
9. List the DNS records for `crm`, `pay`, `www.pay`, and any `*.crm` records, including type, content, and proxied status.
10. Report whether DNSSEC is enabled, the SSL/TLS mode, "Always Use HTTPS", and the minimum TLS version.
11. List account members, their roles, and whether each has two-factor authentication enabled.
12. List all API tokens on the account and user (name, permissions summary, last used, status). Do not create or edit any.

## REPORT (reply in exactly this shape)
```
A. NODE_VERSION prod=… preview=… | redeploy df07643: <success|failure> (+ log tail if failure)
B. previews deleted: N | kept: <id> | failed: …
C. preview Access policy: <enabled|not> | covered hostnames: … | allowed emails: …
D. rate limit rule: <created|failed> | settings used: …
E6. cache/page/config rules: …
E7. PRODUCTION vars/secrets/bindings: …
    PREVIEW vars/secrets/bindings: …
E8. preview branch control: …
E9. DNS crm/pay: …
E10. DNSSEC … | SSL mode … | Always HTTPS … | min TLS …
E11. members: …
E12. tokens: …
```
