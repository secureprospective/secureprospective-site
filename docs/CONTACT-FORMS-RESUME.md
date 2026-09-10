# SECUREPROSPECTIVE CONTACT FORMS — RESUME
**Written:** 2026-09-10, mid-session, before a context compaction. **The session continues.**

## 1. WHAT WE ARE DOING
Marketing campaigns for Secure Prospective have launched, so secureprospective.com had to start
actually capturing inbound leads instead of handing every visitor a `mailto:` link. Built a real
contact form, consolidated the public address, hardened the capture endpoint, and wired an email
notification. It is built and proven end to end on a preview deployment. **It is not merged.**

- **Repo:** `/home/chris/work/secureprospective-site` (Astro, pnpm/npm, Cloudflare Pages)
- **Branch:** `session/contact-forms`, pushed, at `9957aff`. `main` is at `d5b0b75`.
- **Preview URL:** https://session-contact-forms.secureprospective-site.pages.dev
- **Cloudflare account:** `002dd2f758b67ac08d05a3809d65a25a`, Pages project `secureprospective-site`

## 2. AGENTS + HARNESSES
None dispatched. All work done directly in this session, using the Chrome side-panel browser
tools against the Cloudflare and Brevo dashboards. No subordinate agents to recover.

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| Desktop submission, preview | PASS, stored + delivered |
| Mobile submission at 390px, preview | PASS, stored + delivered |
| Negative cases (8) | PASS, see section 6 |
| Root mail DNS unchanged after Brevo setup | PASS, re-verified |
| Merge to `main` | NOT DONE, awaiting Christopher |
| Rate limiting on `/api/lead` | NOT DONE, offered, undecided |

## 4. ARTIFACTS THAT EXIST AND WORK

- **R2 bucket `secureprospective-leads`**, two proof objects under `leads/`:
  - `2026-09-10T18:15:08.116Z-99546a35.json`, 584 B (desktop test)
  - `2026-09-10T18:19:24.790Z-f6ec72fb.json`, 551 B (mobile test)
  - Both are TEST data. Christopher was asked whether to delete them; undecided.
- **Brevo transactional log:** 4 entries, two leads each Sent then Delivered, 13:15 and 13:19 CDT,
  `leads@notify.secureprospective.com` -> `info@secureprospective.com`.
- **Turnstile widget `SP Back Office`**, site key `0x4AAAAAAEKXjhwOTbviU_Ae`, now **3 hostnames**:
  `secureprospective.com`, `www.secureprospective.com`, `secureprospective-site.pages.dev`.
- **Turnstile widget `SP Contact Form`**, site key `0x4AAAAAAEvPtaln-Oque4ng`, **created but now
  unused** after the decision to reuse the back office widget. Safe to delete.
- **Brevo sender domain `notify.secureprospective.com`: Authenticated.** Four DNS records, all
  resolving, all under the `notify` label:
  - TXT `notify` = `brevo-code:d8f366b3f970b69164d7a7e5f411803c`
  - CNAME `brevo1._domainkey.notify` = `b1.notify-secureprospective-com.dkim.brevo.com`
  - CNAME `brevo2._domainkey.notify` = `b2.notify-secureprospective-com.dkim.brevo.com`
  - TXT `_dmarc.notify` = `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`
- **Zone file used for the import:** `<scratchpad>/brevo-notify.txt`

### Pages variables, current state
- **Production (8):** ADMIN_BOOTSTRAP_KEY, BREVO_PRIVATE_API_KEY, CF_API_TOKEN, KIT_TOKEN_KEY,
  NODE_VERSION, PUBLIC_BASE_URL, PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
- **Preview (4):** BREVO_PRIVATE_API_KEY, CF_API_TOKEN, PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
- **Bindings, both environments:** `SP_LEADS` -> `secureprospective-leads` added this session,
  alongside the pre-existing BACKOFFICE_DB, ECOSYSTEM_DB, KIT_DB, LEADS, SPPLUS_RELEASES.

## 5. THE CURRENT BUG
**There is no open bug.** Everything built this session has been observed working on the preview
deployment. Do not go looking for one.

The only known unproven surface is production itself, which has the variables but not yet the code.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Cloudflare Email Sending can deliver the notification."** It cannot. The dashboard states it
  requires the **Workers Paid plan**. Separately, Pages Functions have **no email binding at all** —
  the full binding list was read and ends at Workers AI. This is why the code uses Brevo's HTTP API.
- **"`secureprospective@gmail.com` and `info@secureprospective.com` are the same mailbox."** They
  are not. The gmail account is a **consumer** Gmail with no `info@` alias under "Send mail as" and
  no forwarding. `info@` lives on a separate Google Workspace tenant on the domain's MX.
- **"`info@secureprospective.com` might not exist."** It exists. SMTP RCPT probe against
  `smtp.google.com`: `info@` returns **250**, a deliberately bogus address at the same domain
  returns **550**. No message was sent; the probe stopped before DATA.
- **"The `/api/ask` 502 needs fixing."** Out of scope by Christopher's ruling — it is CCwork
  legacy, not SecureProspective. The endpoint and the chat widget were **deleted**, not repaired.
- **"`www.secureprospective.com` redirects to the apex, so the Turnstile hostname gap is moot."**
  It does not redirect. `curl https://www.secureprospective.com/contact/` returns **200**. That is
  why `www` had to be added to the widget's hostname list.
- **"The mobile notification email failed."** It did not. Brevo's log is simply delayed; the entry
  appeared on refresh. Check twice before calling a send failed.
- **"`resize_window` gives a mobile viewport for testing."** It does not in this side-panel setup —
  the page still reported `innerWidth` 1587. Mobile was tested by injecting a **390px iframe**,
  which gets a real viewport and fires the real media queries.

## 7. DECISIONS (Christopher's rulings this session)

- **D-1.** `info@secureprospective.com` is the canonical public address sitewide.
- **D-2.** Real on-page contact form; `mailto:` demoted to the secondary path.
- **D-3.** Leads are emailed to Christopher in addition to being stored.
- **D-4.** "Montgomery, Texas" removed from the contact page.
- **D-5.** The CCwork chat widget is **removed entirely**, not repaired or repurposed.
- **D-6.** Leads go to a new SP-named bucket, not the CCwork `ccwork-leads` one.
- **D-7.** **Reuse the back office Turnstile widget** rather than a second one, to keep the number
  of variables down. Accepted cost: login and the public form share one secret, so rotating either
  rotates both.
- **D-8.** Test on a preview deployment before anything touches production.
- **D-9 (standing).** Live deploys need per-deploy approval. The merge to `main` has NOT been given.

### Decisions I made and should not silently reverse
- **Manual DNS records, not Brevo-managed and not NS-delegated** — the automatic option grants
  Brevo write access to the zone; delegation hands it NS control of a subdomain. Neither is
  warranted for four static records on a domain carrying live business mail.
- **A sending subdomain, never the root.** The root carries Google Workspace mail under DMARC
  `p=reject`. Authenticating the root in Brevo would mean editing the SPF and DKIM records that
  real business mail depends on.

## 8. LEDGER STATE
All committed and pushed on `session/contact-forms`. Nothing uncommitted.

```
9957aff chore: redeploy preview to pick up environment variables
d3da4ae Reuse the back office Turnstile widget for the contact form
48c7fd9 Record contact form state and the three variables still outstanding
d86d0c5 Send the lead notification through Brevo rather than Cloudflare
f8d2267 Capture contact leads on the site instead of handing visitors a mailto
```

Key files: `src/pages/contact.astro`, `src/scripts/pages/contact-form.js`,
`src/styles/pages/contact.css`, `functions/api/lead.ts`, `functions/_lib/lead-notify.ts`,
`docs/CONTACT-FORMS-STATE.md`. Deleted: `src/components/ChatWidget.astro`, `functions/api/ask.ts`.

## 9. NEXT ACTIONS, IN ORDER

1. **Ask Christopher for the two open decisions** if he has not answered: (a) add a Cloudflare WAF
   rate-limiting rule on `/api/lead` before merging; (b) delete the two R2 test objects or keep them.
2. **If he approves the rate limit**, add it as a WAF rate-limiting rule at the rules level, not in
   the function code. Free tier includes one rule.
3. **Get explicit approval for the merge to `main`**, then merge. `main` auto-deploys to production.
4. **After the merge, verify production directly**: submit one real lead on
   `https://secureprospective.com/contact/`, confirm the R2 object appears and the Brevo log shows
   Sent then Delivered. Production already holds all required variables.
5. **Also verify `https://www.secureprospective.com/contact/`** submits successfully, since that
   hostname was the late Turnstile addition and has never been exercised.
6. **Delete the unused `SP Contact Form` Turnstile widget** once production is confirmed working on
   the back office widget.
7. **Update `docs/CONTACT-FORMS-STATE.md`** to reflect that it shipped, and update `~/NOW.md`.

## 10. RELAY / ENVIRONMENT NOTES
- Browser work runs through the Chrome side panel. Cloudflare dash and Brevo are both **already
  logged in**; Google Workspace admin is **not** (it prompted for a password, which I do not enter).
- **I do not type credentials into fields.** Every API key and secret this session was entered by
  Christopher. The permission classifier also blocks it independently. Do not attempt workarounds.
- The Cloudflare "Variables and secrets" dialog **failed silently several times** when driven by
  clicks. After any change through it, reload and confirm the row actually appears.
- Reading a truncated value out of a dashboard input: click its Copy button, then paste into a
  harmless text field (the DNS search box worked) and zoom to read it.

## 11. HONEST STATUS
The form is **proven working on preview**, both desktop and mobile, storage and email, with the
negative cases refusing correctly including a forged Turnstile token. That is real evidence, not
inference.

**Production is unproven.** It has never run this code. The likelihood of a problem is low because
preview and production share the same bindings, variable names and Turnstile widget, but "should
work" is not "observed working" and must not be reported as such. Item 4 above is what closes that
gap, and it can only run after Christopher approves the merge.

The `www` hostname is the thinnest ice: it was added late, and no submission has ever been made
through it. Item 5 exists for that reason.
