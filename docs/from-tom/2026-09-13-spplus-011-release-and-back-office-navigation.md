# SP+ 0.11 published, and the back office fixed for client-side navigation

**Date:** 2026-09-13
**Branch:** `main` (Christopher directed both pushes explicitly; see Open items)
**Status:** Ready for review. Two commits are live on production. **One commit is
committed and NOT pushed**, awaiting his go-ahead: `bcda099`.

## What changed

### 1. The 0.11 release manifest was wrong, and it is the finding of the session
`functions/_lib/releases.ts` carried **v0.11.4's** sha256 `a793df68...`. R2 holds
**v0.11.5**. The two ISOs are exactly the same length, 5,520,687,104 bytes each, so
neither the object listing nor a size check could ever have caught it. An advisor
following the verification instructions on the download page would have been told a
perfectly good download was corrupt.

Corrected to `74a8e71c0bf9f871e3e5efd2de4c72eff8e635594ea80ad71f4459dfebff7e82`,
which I verified by running `sha256sum` over the local v0.11.5 build artifact myself
rather than trusting the brief or the repo, and flipped to `published: true`.
v0.11.5 is also the build carrying the fix for the empty-cache stranding defect, so
shipping v0.11.4's identity would have been wrong twice over.

### 2. The download page now documents the install
`src/pages/members/download.astro` gained three sections written for an advisor whose
only software experience is double-clicking an installer inside Windows: how to write
the ISO to a USB stick and boot from it, what the installer asks, and a warn-card
section on the disk passphrase, which is the only step on that page that can lose
somebody their data permanently. An "after it is installed" section explains the
self-update and that shutting down at the end of the day applies an update as well as
pressing Restart now. `certutil -hashfile` was added beside `Get-FileHash` so
verifying does not require knowing PowerShell.

### 3. The back office was broken by client-side navigation, and now is not
Reported symptom: open Download SP+, go to the members area, come back, blank page
until you refresh.

Cause: the site runs Astro View Transitions, so a click from another page swaps the
new document in without re-evaluating a module that already ran once in the session.
All six back-office pages did their work at module scope. Download and the members
landing page ship their `<main>` hidden and reveal it only after a session check, so
what a member saw was nothing at all.

The blank page was the visible half. The quiet half was worse: on login,
change-password and accept-invite it was the **submit handler** that never bound, so
the form would have fallen back to a plain GET and put a password in the URL bar.

Each page's script is now a `boot()` called **both** from module scope and from
`astro:page-load`, made idempotent by marking its own root element. Both calls are
needed and neither is sufficient: the listener cannot hear the very navigation that
first pulls its module into the session, because the module only evaluates part-way
through that swap, after the event has fired; and the direct call cannot hear any
later navigation, because the module never evaluates again. This second half is
`bcda099`, the unpushed commit, and it exists because verifying the first fix on
production found it failing roughly one arrival in six. An intermittent blank page is
worse than a deterministic one.

Turnstile had the same shape of fault and needed its own fix. It auto-renders when
its script loads, which on a client-side navigation happened for a document that is
now gone, so the widget in the new document would never be drawn and the missing-token
check would tell a member to complete a challenge that is not on their screen. Each
boot now renders it by hand only when the element is empty, since Turnstile renders
into a child div rather than an iframe and testing for an iframe would draw a second
widget over the first.

## Why
Christopher: publish SP+ 0.11 and document it for an advisor (brief at
`~/fleet/briefs/tom-spplus-site-and-standard.md`), then "something is weird ... it
doesn't open the page correctly, I have to refresh ... fix the website".

## Verification
Against **production**, not `dist/`, and in a browser rather than by reading diffs:

- `/members/download` returns 200 and carries all the new sections.
- Download to Contact to Download, three round trips, renders every time.
- Release card live: SP+ 0.11, 5.14 GB, 2026-09-13, sha256 `74a8e71c...`.
- **The `SPPLUS_RELEASES` binding resolves.** This was the open unknown nobody on
  either machine could close. A 16-byte Range request to `/api/download/iso?v=0.11`
  returned **206**, `Content-Range: bytes 0-15/5520687104`, and bytes
  `eb 63 90 90 ...`, an x86 boot sector. The ISO is real, it streams, and Range works,
  so a dropped 5.5 GB download resumes rather than restarting.
- The login submit handler intercepts on a client-side arrival; exactly one Turnstile
  widget and one token input exist on every path tested.
- Six consecutive client-side arrivals at `/members/download` after `bcda099`: all
  rendered, zero failures. That run was against a **preview build**, not production,
  because the commit is not pushed.
- Zero em dashes; no horizontal overflow at 390px; `astro build` clean.

## Open items / what Claude or Christopher should check

1. **`bcda099` is not pushed.** It is the hardening for the intermittent blank page.
   Production currently has the first fix only, which is right most of the time.
2. **The two pushes to `main` were on Christopher's explicit instruction**, each time
   for that specific deploy, overriding the brief's session-branch constraint. Noted
   because the brief says otherwise and a cold reader should not think it was ignored.
3. **The download page shows `5.14 GB` computed in binary units.** That is GiB
   labelled GB. Cosmetic, untouched, his call.
4. **The production Turnstile sitekey is a build-time variable the preview does not
   have**, so that path was exercised with Cloudflare's public test key. Same
   behaviour, different key. Worth one real login after the next deploy.
5. **The R2 token is still unrotated** and still exposed in a `ps` listing. Not
   touched, not propagated, referenced nowhere in this repo.
6. **"Delete the old one" is still unanswered** from an earlier session. Nothing has
   been deleted.
