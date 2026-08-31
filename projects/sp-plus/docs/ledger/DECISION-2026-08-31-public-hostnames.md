# DECISION 2026-08-31 — public hostnames for the two hosted services

## The decision

| Service | Public hostname |
|---|---|
| File portal (Nextcloud) | `files.secureprospective.com` |
| Social scheduler (Postiz) | `social.secureprospective.com` |

Christopher chose the social hostname on 2026-08-31. `files.` was already an
established trusted domain and was not in question.

## Why it had to be decided before anything else

OAuth callbacks are registered per developer app. LinkedIn and Meta re-trigger
review when a callback changes, and those reviews are multi-day — Meta also
requires business verification. Filing the applications against the LAN address
`192.168.1.106`, or against a hostname chosen later, therefore does not merely
cost a configuration edit; it costs the review over again. The hostname is an
input to the filings, not a deployment detail that can follow them.

The same value is baked into Postiz's `MAIN_URL`, which is compiled into the
frontend as well as the callbacks. It is currently still the LAN address, so it
must be changed in `/opt/postiz/.env` and the service restarted when the
Cloudflare Tunnel lands, or logins fail in ways that are hard to read.

## Why `social.` rather than the alternatives

It is parallel to `files.`, it is self-describing, and it matches the
advisor-facing brand name — the service is presented as SecureProspective
Social, and the word Postiz never appears in the UI. The last point is not
cosmetic: these applications are being filed as a multi-user scheduling service
for contracted producers, which is the stricter review, and a hostname that
states the use case is read by a reviewer assessing exactly that. A generic
`app.` host says nothing about the use case at the moment when saying something
is worth the most.

## Callback shape this implies

```
https://social.secureprospective.com/api/auth/oauth/<platform>
```

## What this decision does not settle

The tunnel itself is not up for either service, and both hostnames are
unreachable until it is. Removing the `:8080` port binding is part of standing
up the file portal's tunnel. Registration on the social service is still open
(`DISABLE_REGISTRATION=false`), which is safe only while it stays LAN-only and
must be closed before the tunnel goes up — otherwise the first person to find
the URL becomes an operator.
