# Headbrain log — 2026-08-31

ClaudeBox (CT105) is down until Thursday night. Christopher: *"you are the headbrain till
then."* This log exists because CT105 cannot discover what changed while it was offline, so
everything decided in its absence is written down here in one place.

## Decisions taken

**D-13 — Primal is not shipped.** Settled by Christopher before CT105 went down. Noto Sans
Condensed Black is the permanent display face for the Welcome app, treated as the design
rather than a fallback. The dead `@font-face` pointing at a non-existent `fonts/Primal.ttf`
has been removed, and `PRIMAL-FONT.md` updated. Primal stays on the web login only, where a
wordmark subset is the right thing. Consequence accepted: the wizard and the web login are
not typographically identical; every colour token already matches, so type is the only seam.

**The two service screens collapse into one.** Christopher's call, replacing the File Portal
and Social screens with a single "Your SecureProspective services" page: two cards, each
opening a panel at about 75% of the screen with that service's features and a link out.
Nine screens become eight.

The reasoning is worth preserving because it governs future work here. The right design is
not known yet, by anyone — Christopher said so plainly. The file portal is in practice a
login and a file upload; the social scheduler is the one that, elaborated in a wrong
direction, does not degrade gracefully but simply fails. **The simple version is the
position that cannot be wrong**, so the surface stays small and detail is revealed on
demand. No OAuth handling in Welcome at all; accounts are connected on the site.

**Scope boundary: Welcome sets up and hands off.** It is not an administration console.
Two-factor enrolment, missed-post review and account administration belong to the services,
which already have interfaces for them. The test before specifying any step: would the
advisor otherwise do this inside the service's own interface? If so, Welcome points them
there. This cancelled a flow-completion brief that had overreached into all three.

**The test-member ask is withdrawn.** I had been reporting a provisioned test member and a
Bluesky credential as blockers. Christopher corrected the premise: the activation links and
accounts belong to newly contracted advisors, not to him; he tests with his own logins; and
the Welcome app must never carry, cache or pre-fill the operator's details. Bluesky-unproven
and SMTP-unproven are **unproven, not blocked** — a distinction I had collapsed.

**No ISO until the Welcome app is ready for hands-on testing.** The trigger for a build is
the feature being genuinely testable by Christopher, not fixes accumulating.

## Verified this session

Against CT105's live `/.well-known/sppl` on both hosts, measured from the SP+ VM:

- No-scroll gate 18/18 at 1280x800 and 1024x768.
- Hit test 10/10 controls at both viewports.
- Ten `pending_review` platforms proven inert under real CDP clicks — `aria-disabled`,
  `tabIndex=-1`, `onclick=null`, no state change before/after.
- Six failure fixtures all degrading correctly, with zero password inputs and zero forms.
- Clean shutdown, exit 0, no coredumps; the new `_service_workers` is registered in
  `_worker_sets()`.
- Theme round trip PASS, `t1` and `t3` identical.
- Capability endpoint latency 0.106-0.203s from the VM.

**A latency correction worth recording:** I first measured ~5.4s from the Beelink and
reported it. That was an artifact of cfgate's mitmproxy in the Beelink's TLS path — 5.05s of
it was connect. The real figure from the product target is ~0.1-0.4s, matching CT105's own
measurement. Measurements that feed product decisions are taken on the VM or the Dell.

## Defects found, not fixed

1. **`welcome-lifecycle-gate.sh` cannot fail.** Its matcher expects `PID python3` but the
   real process is `PID /usr/bin/python3`, so it reports zero Welcome processes and passes
   vacuously. An edit exists in `a0fd923` but was **not verified** — the pass was stopped
   before proving the gate can produce a negative. Treat as open until that is shown.
2. **The installed image is stale.** `/usr/libexec/sp-plus/welcome/welcome.py` predates
   today's fixes and coredumped on the QThread destructor path already fixed in source.
   Expected — no ISO has been built since — and the clearest argument for the next build.

## Still unproven

- **SMTP has no verified sender.** Activation and password-reset email cannot send. This is
  the critical path for the file portal, not the container.
- **No post has ever published through Bluesky.** It reports `live` because it structurally
  cannot require keys, not because anything was tested. `live` means connectable.
- **The VM's permanent port forward is written but never exercised.** The persistent XML has
  `<portForward>` with `<backend type='passt'/>`; the running domain is still on the
  memory-only `hostfwd_add`. passt is a different network stack, so first boot on it is a
  real test.
- **The Dell hardware gate is owed** by the D-02 pin bump.

## Left for CT105 on return

Unblocked by anything above, in priority order: **SMTP with a verified sender**; Nextcloud
branding, so the two services stop looking like different products; the flapping tunnel
connection, 3 of 4 healthy against one edge IP; and a backup restore rehearsal, since files,
database and keys must restore as one unit.
