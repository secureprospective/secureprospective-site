# Contact form and lead capture: state
**Updated:** 2026-09-10 · Branch `session/contact-forms` (pushed, preview deploy only, NOT merged to main)

## Done and verified

| Thing | Evidence |
|---|---|
| Public address consolidated on `info@secureprospective.com` | SMTP RCPT probe: `info@` returns 250, a bogus address at the same domain returns 550. No message was sent. |
| Montgomery TX removed from the contact page | `src/pages/contact.astro` |
| Contact form built | Name, email, line, message, Turnstile. Route lines are anchors to `#contact-form` that pre-select the line, so choosing a line works with no JavaScript. mailto to `info@` kept as the secondary path. Rendered and inspected in a browser. |
| CCwork chatbot removed | `ChatWidget.astro` and `functions/api/ask.ts` deleted, `Layout.astro` updated. It had been returning a bare 502 in production. |
| `/api/lead` hardened | Route/message/source/page validation, Turnstile fails closed, distinct status codes, R2 write decides success, notification failure is logged and never fails the visitor. |
| R2 bucket `secureprospective-leads` | Created. `SP_LEADS` binding added to **both** Production and Preview. |
| Turnstile | Reuses the existing `SP Back Office` widget and its `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`, already set in Production. A second widget `SP Contact Form` (`0x4AAAAAAEvPtaln-Oque4ng`) was created earlier and is now unused; delete it or keep it dormant. |
| Brevo sender domain `notify.secureprospective.com` | **Authenticated.** Four records added by BIND import, all resolving. |
| Root mail DNS untouched | Re-checked after the import: SPF still `v=spf1 include:_spf.google.com ~all`, MX still `1 smtp.google.com`, `_dmarc` still `p=reject`. Every Brevo record sits under `notify`. |

## Decisions worth keeping

- **Cloudflare Email Sending was rejected**: it requires the Workers Paid plan. Pages Functions also have no email binding at all (the full binding list ends at Workers AI). Brevo's free tier is the path.
- **A sending subdomain, not the root.** The root carries live Google Workspace mail under DMARC `p=reject`; authenticating it in Brevo would mean editing the SPF and DKIM records real business mail depends on.
- **Manual DNS records, not Brevo-managed.** The automatic option grants Brevo write access to the zone and the delegated option hands it NS control of a subdomain. Neither is warranted for four static records.
- **Reuse the back office's Turnstile widget** rather than a second one, decided 2026-09-10 to keep the number of variables down. The cost is that the login page and the public contact form share one secret, so rotating either rotates both. The `SP Back Office` widget originally listed only `secureprospective.com` and `secureprospective-site.pages.dev`; `www.secureprospective.com` serves a live 200 rather than redirecting, so `www` had to be added to that widget's hostnames or the form would fail for anyone arriving on a www link.

## Remaining: three variables, then test

Entering credentials into fields is something I do not do, so these are Christopher's.

In **Workers & Pages -> secureprospective-site -> Settings -> Variables and secrets**, add all three to
**Production and Preview both** (the environment selector is at the top of Settings):

| Where | Type | Name | Value |
|---|---|---|---|
| Turnstile widget | - | hostname | Add `www.secureprospective.com` to the `SP Back Office` widget |
| Pages, Production | Secret | `BREVO_PRIVATE_API_KEY` | Brevo -> SMTP & API -> API keys -> generate a new key |
| Pages, Preview | Secret | `BREVO_PRIVATE_API_KEY` | the same key |
| Pages, Preview | Secret | `PUBLIC_TURNSTILE_SITE_KEY` | copy from Production, or Turnstile -> `SP Back Office` |
| Pages, Preview | Secret | `TURNSTILE_SECRET_KEY` | copy from Production, or Turnstile -> `SP Back Office` |

Production already has the Turnstile pair, so it needs only the Brevo key. Preview has just `CF_API_TOKEN`
and needs all three before the form can be tested there.

Once those are in, the remaining work is verification, and none of it has been done yet:

1. Redeploy the `session/contact-forms` preview so it picks the variables up.
2. Submit the form on the preview URL. Confirm the R2 object lands in `secureprospective-leads` with the new fields, and that the notification arrives at `info@secureprospective.com`.
3. Test the negative cases, not only the happy path: missing email, malformed email, missing Turnstile token, unknown route, oversized message, cross-origin POST. Each must be refused with the right status.
4. Mobile viewport pass on `/contact/`.
5. Only then ask for approval to merge to `main`. Merging publishes to production.

## Not done, and not claimed

Nothing on this branch has been tested end to end. The form has been seen rendering on a local dev
server; it has never successfully submitted, because Turnstile cannot issue a token without the site
key. Treat every capability above as built but unproven until step 2 passes.
