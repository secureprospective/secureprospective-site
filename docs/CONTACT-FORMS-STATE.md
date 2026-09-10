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
| Turnstile widget `SP Contact Form` | Created. Site key `0x4AAAAAAEvPtaln-Oque4ng`. Hostnames: secureprospective.com, www.secureprospective.com, secureprospective-site.pages.dev. Separate from the `SP Back Office` widget. |
| Brevo sender domain `notify.secureprospective.com` | **Authenticated.** Four records added by BIND import, all resolving. |
| Root mail DNS untouched | Re-checked after the import: SPF still `v=spf1 include:_spf.google.com ~all`, MX still `1 smtp.google.com`, `_dmarc` still `p=reject`. Every Brevo record sits under `notify`. |

## Decisions worth keeping

- **Cloudflare Email Sending was rejected**: it requires the Workers Paid plan. Pages Functions also have no email binding at all (the full binding list ends at Workers AI). Brevo's free tier is the path.
- **A sending subdomain, not the root.** The root carries live Google Workspace mail under DMARC `p=reject`; authenticating it in Brevo would mean editing the SPF and DKIM records real business mail depends on.
- **Manual DNS records, not Brevo-managed.** The automatic option grants Brevo write access to the zone and the delegated option hands it NS control of a subdomain. Neither is warranted for four static records.
- **Its own Turnstile widget**, not the back office's, so the public marketing form and the login page can be rotated and read separately.

## Remaining: three variables, then test

Entering credentials into fields is something I do not do, so these are Christopher's.

In **Workers & Pages -> secureprospective-site -> Settings -> Variables and secrets**, add all three to
**Production and Preview both** (the environment selector is at the top of Settings):

| Type | Name | Value |
|---|---|---|
| Text | `PUBLIC_CONTACT_TURNSTILE_SITE_KEY` | `0x4AAAAAAEvPtaln-Oque4ng` |
| Secret | `CONTACT_TURNSTILE_SECRET_KEY` | Turnstile -> `SP Contact Form` -> Settings -> secret key |
| Secret | `BREVO_PRIVATE_API_KEY` | Brevo -> SMTP & API -> API keys -> generate a new key |

Note: Preview currently has only `CF_API_TOKEN`, so it needs all three; Production has the back office's
Turnstile pair already but those are a different widget and are not reused here.

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
