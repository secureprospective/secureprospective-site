# Plan: contact information + form input capture
**Date:** 2026-09-10 · **Repo:** ~/work/secureprospective-site · **Branch to cut from:** origin/main
**Trigger:** marketing campaigns launched; the public site must capture inbound leads now.

## Decisions taken (Christopher, 2026-09-10)
1. `info@secureprospective.com` is the canonical public address, sitewide.
2. Contact page gets a real on-page form; `mailto:` stays as a secondary fallback.
3. Leads are emailed to Christopher in addition to landing in R2.
4. The `/api/ask` 502 is in scope and gets fixed.

## Evidence gathered before planning
| Item | State |
|---|---|
| `src/pages/contact.astro` | No form. 3 `mailto:` route links + 1 address block. |
| Address split | `secureprospective@gmail.com` on `/`, `/contact/`, `/services/`, `/the-work/`; `info@secureprospective.com` on `/privacy/`, `/members/download/`. |
| MX `secureprospective.com` | `1 smtp.google.com` (Google Workspace routing present). |
| `POST /api/lead` (live) | `200 {"ok":true}`. Capture works. Fields: name, email only. Storage: R2 `ccwork-leads`, key `leads/<iso>-<rand>.json`. |
| `POST /api/ask` (live) | `502`, `content-type: text/plain`, body `error code: 502`. Bare Cloudflare edge error, **not** the function's own JSON 502s. So the Function is crashing or timing out, not returning a handled error. |
| Turnstile | `functions/_lib/turnstile.ts` exists, wired only to login + accept-invite. `/api/lead` is unprotected. |
| Brevo | `functions/_lib/email.ts` `SENDER` is still the literal placeholder `TODO-set-verified-sender@secureprospective.com`. Nothing can send until a verified sender exists in **SecureProspective's own** Brevo account. |
| Deploy | Beelink cannot `wrangler deploy` this project. Deploy = push to `main`, CF Pages auto-builds. |
| Git | Local branch `sp-plus-alpha-release`; `origin/main` is at `d5b0b75` and is **behind** local by 4 commits. |

## Blockers that need Christopher, not code
- **B1.** Is `info@secureprospective.com` an actually-monitored mailbox on the Workspace MX? The whole plan routes public contact to it. Confirm before ship.
- **B2.** Verified sender in SecureProspective's Brevo account (Settings -> Senders). Lead notification email cannot send without it. Must not reuse TFM's account or sender.
- **B3.** No Cloudflare account access from the Beelink for this Pages project, so `wrangler pages deployment tail` (the only direct way to read the `/api/ask` crash) has to run from CT105 or from Christopher's browser-authenticated session.
- **B4.** Per-deploy approval: merging to `main` publishes to production. Explicit go-ahead needed for that specific merge.

## Steps

### Phase 1 — Contact information consistency
1. Cut a branch from `origin/main` (not from `sp-plus-alpha-release`).
2. Replace `secureprospective@gmail.com` with `info@secureprospective.com` in
   `src/pages/contact.astro` (address block + 3 route `mailto:` hrefs),
   `src/pages/index.astro:133`, `src/pages/services.astro:139`, `src/pages/the-work.astro:351`.
3. Grep the whole tree afterwards for any remaining `gmail.com` on a visitor-facing surface, including `grafix/` asset source and `public/`.
4. Confirm the physical/locality line ("Montgomery, Texas") is what Christopher wants shown, and whether a phone number should appear at all.

### Phase 2 — Real contact form
5. Add a form to `/contact/`: **Name, Email, Route (operating / SP+ / prospective), Message.** Route pre-selects when a visitor clicks one of the three existing route lines, so the board stays the navigation and the form is the capture.
6. Design-system compliance: square corners, `--blue-brand` / `--ink` / `--yellow-accent` solid UI only, yellow never as text, 120-200ms transitions, no rounded pills, no shadows beyond the existing offset-block treatment, **zero em dashes** in any visible copy.
7. Accessibility + no-JS: real `<form>` element, labelled inputs, `aria-live` status region, visible error and success states. Submit via `fetch`; if JS fails, the `mailto:` fallback link remains on the page.
8. Keep the three `mailto:` links as the secondary path, relabelled so they read as an alternative rather than the primary action.

### Phase 3 — Capture endpoint hardening
9. Extend `functions/api/lead.ts` to accept and validate the new fields: `route` (enum, rejected if not one of the three), `message` (optional, length-capped), plus `source` (`contact-form` | `chat-gate`) and `page` so Christopher can tell which surface produced the lead. Existing chat-gate payloads must keep working unchanged.
10. Add Turnstile to `/api/lead` using the existing `verifyTurnstile` helper and the site key already in use on login. The endpoint is public, indexed by nothing but trivially discoverable, and a campaign makes it worth hitting. Fail closed.
11. Rate-limit per IP at the endpoint (simple, KV-free: reject implausible bursts) rather than relying on Turnstile alone.
12. No shortcuts: no swallowed errors, no `ok: true` when the R2 write failed, distinct status codes for validation vs. storage vs. verification failure.

### Phase 4 — Lead notification
13. Add `sendLeadNotification()` to `functions/_lib/email.ts` alongside the existing invite sender, reusing the same Brevo HTTP call shape.
14. Replace the placeholder `SENDER` with the address Christopher verifies in Brevo (B2).
15. Notification email must identify itself: which form, which page, which route, timestamp in local time, and the lead's details, so it is actionable without opening the bucket.
16. Failure to send must **not** fail the visitor's submission. The R2 write is the system of record; the email is best-effort and its failure is logged, not surfaced to the visitor.
17. Verify by triggering a real submission against a preview deployment and confirming arrival. This is a send *from the site*, not from Christopher's mail accounts, so the Thunderbird guardrail does not apply; it still gets confirmed with him before the first live send.

### Phase 5 — `/api/ask` 502
18. Reproduce locally with `wrangler pages dev` and a scoped token to get the actual exception, since the edge 502 hides it.
19. Candidate causes to test in order: (a) AI Search instance `ccwork-resume` no longer exists or the REST path `/ai-search/instances/{id}/search` changed; (b) model `@cf/google/gemma-4-26b-a4b-it` retired; (c) `CF_API_TOKEN` scope no longer covers AI Search Read; (d) subrequest/CPU timeout on the two chained fetches. Confirm the cause from evidence, do not guess-patch.
20. Whatever the cause, add an outer try/catch so the Function can never emit a bare edge 502 again, and make the widget degrade to a clear "Christopher will follow up at the address you gave" state. The lead is already captured at that point; the visitor must never see a raw error.

### Phase 6 — Verification before deploy
21. `pnpm run build` clean.
22. Preview deployment (separate project, per standing rule), then a live browser pass on `/contact/`: submit the form, confirm the R2 object appears with the new fields, confirm the notification email arrives, confirm the success state renders, confirm the chat widget no longer errors.
23. Test the negative cases, not just the happy path: missing email, bad email, missing Turnstile token, oversized message, cross-origin POST. Each must be rejected with the right status. A gate that cannot fail is not evidence.
24. Mobile viewport pass on `/contact/`.
25. Only then ask Christopher for explicit approval to merge to `main`.

## Out of scope this session
Member/back-office auth flows, SP+ ISO work, LinkedIn banner, and the AI-ecosystem scaffold.
