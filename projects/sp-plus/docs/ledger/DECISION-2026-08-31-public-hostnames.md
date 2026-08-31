# DECISION 2026-08-31 — public hostnames, OAuth callbacks, capability endpoint

**Revised the same day.** The first version of this document named the file
portal `files.secureprospective.com` and proposed an OAuth callback path that
does not exist. Both were corrected by ClaudeBox against the running services;
the corrections are recorded here rather than silently applied, because the
first version was circulated and may have been acted on.

## 1. Hostnames

| Service | Public hostname |
|---|---|
| File portal (Nextcloud) | `cloud.secureprospective.com` |
| Social scheduler (Postiz) | `social.secureprospective.com` |

`cloud.` is Christopher's call, changed from `files.` later on 2026-08-31 and
already applied to Nextcloud's `trusted_domains`. Anything still referring to
`files.secureprospective.com` — including the earlier revision of this file and
the inbox copy — is stale.

## 2. OAuth callbacks

**The path is Postiz's, not one we choose.** Postiz v2.23.0 builds every OAuth
redirect as `${FRONTEND_URL}/integrations/social/<platform>`, verified against
the running container rather than documentation. The earlier proposal of
`/api/auth/oauth/<platform>` was wrong and must not be filed.

```
https://social.secureprospective.com/integrations/social/linkedin
https://social.secureprospective.com/integrations/social/linkedin-page
https://social.secureprospective.com/integrations/social/facebook
https://social.secureprospective.com/integrations/social/instagram
https://social.secureprospective.com/integrations/social/x
```

Three details in the platform slugs that each cost a review cycle if missed:

- **X is `x`, not `twitter`.**
- **LinkedIn is two providers**, `linkedin` and `linkedin-page`. A personal
  profile and a company page are separate integrations with separate callbacks.
  Advisors will want the company page, so **both callbacks go on the one
  LinkedIn app** or the page flow dead-ends after approval.
- **Bluesky is not OAuth at all.** It authenticates with an app password through
  `createSession`; there is no callback and nothing to file. That is why it
  carries the first end-to-end test.

## 3. Why the hostname had to be settled first

OAuth callbacks are registered per developer app. LinkedIn and Meta re-trigger
review when a callback changes, and those reviews are multi-day — Meta also
requires business verification. The hostname is therefore an input to the
filings, not a deployment detail that can follow them. The same value is baked
into Postiz's `MAIN_URL`, which is compiled into the frontend as well as the
callbacks.

The applications are filed as a **multi-user scheduling service for contracted
producers**. That scoping is what the stricter review needs to see, and
re-scoping later means re-review.

## 4. Capability endpoint

Welcome renders no integration affordance that is not confirmed live, so it
reads a service-supplied list rather than hardcoding buttons. Path agreed as:

```
GET https://social.secureprospective.com/.well-known/sppl
GET https://cloud.secureprospective.com/.well-known/sppl
```

Not `/api/...` — that namespace belongs to Postiz and would collide.

```json
{
  "service": "social",
  "status": "ready" | "provisioning" | "unavailable",
  "platforms": [
    {"id": "bluesky",  "label": "Bluesky",  "state": "live"},
    {"id": "linkedin", "label": "LinkedIn", "state": "pending_review"}
  ]
}
```

Welcome's rules against it: render only `state:"live"`; hide `pending_review`
or mark it plainly unavailable, never as a clickable connect; treat an
unreachable endpoint as `unavailable` and defer the whole flow politely.
Provisioning state is keyed to the immutable D1 UUID, never to email.

`state` is derived at generation time from whether that provider's OAuth
credentials are actually present in the service config, so it cannot drift the
way a hand-maintained list would. **The known caveat, stated rather than
buried:** credentials present means we hold keys, not that the platform has
finished reviewing. Between a platform approving us and the keys being pasted
in, it reports `pending_review`. It never falsely reports `live`, which is the
direction that matters — the rule exists to prevent a dead-end connect button,
and a late `live` costs nothing but a delay.

**Not built yet.** It depends on the tunnel.

## 5. Tunnel-day ordering

An earlier restatement of this had the registration step backwards. Postiz has
zero accounts, and the first account is created *through* registration —
closing it first leaves no operator and no way to make one short of a database
edit. The correct sequence:

1. **Christopher creates the operator account** in a browser at
   `http://192.168.1.31:4007`, LAN-only, before the tunnel exists. This cannot
   be done headlessly and is his step.
2. Set `DISABLE_REGISTRATION=true` and restart.
3. Bring the tunnel up.

Also on tunnel day: `MAIN_URL` moves to the public hostname, and the `:8080`
port binding comes off the file portal.

## 6. LAN addresses changed

`.106` and `.107` sat inside the router's DHCP pool and another device took
`.107`, which presented as an sshd failure for half an hour. Both moved out:

| Service | Was | Now |
|---|---|---|
| Nextcloud | `192.168.1.107` | `192.168.1.30` |
| Postiz | `192.168.1.106` | `192.168.1.31` |

LAN only. Nothing advisor-facing depends on them, and after the tunnels nothing
should reference them.

## 7. Still blocking, and whose they are

- **A verified Brevo sender — Christopher's.** SMTP is the file portal's real
  critical path: steps 2 and 3 of that flow *are* the activation and reset
  emails. Nextcloud being up and hardened proves nothing about them, and the
  flow will not be reported as working until a real delivery test arrives.
- **The operator account above — Christopher's**, and it gates tunnel day.
- **The tunnel and the capability endpoint — ClaudeBox's.**
