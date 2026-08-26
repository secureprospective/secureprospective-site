# SP+ — Maintenance and Release Model

**Document 4 of 6 in the SP+ planning set.**
Status: research baseline, 2026-08-25.

Building a distribution once is a project. Maintaining one is an obligation that does not
end. This document describes what Secure Prospective is signing up for, and how to make
that obligation small enough to actually meet.

The governing question for every decision here: **what happens in month 30, when the
person who built this is busy with something else and 400 advisors are running it?**

---

## 1. The maintenance obligation, stated honestly

Once an advisor installs SP+ and puts client PII on it, Secure Prospective owns:

- **Security updates**, indefinitely, on the timescale that CVEs are disclosed.
- **A working update channel.** If the registry goes away, every SP+ machine silently
  stops receiving patches while continuing to look fine.
- **Fedora major-version migration**, roughly every six months, forever. Fedora releases
  are supported for about thirteen months. A machine that misses two bumps is on an
  unsupported base.
- **Regression triage.** An update that breaks printing for one hardware model is an
  outage for those advisors.
- **An exit path.** If the program is discontinued, advisors must be told, given a
  migration plan, and not left on a frozen unpatched system with client data on it.

That last obligation should be written down before the first ISO ships, not after.

**The cost-control strategy is scope.** Every additional package, every out-of-tree
module, every third-party component, and every supported hardware model multiplies the
maintenance surface. The architecture in document 2 is chosen principally because it
minimizes this: deriving from official Fedora Atomic Desktop images means Fedora
maintains the desktop, the kernel, the graphics stack, and the security updates, and
SP+ maintains only its own delta.

---

## 2. Release channels

Three channels, all built from the same git tree, differing only in which commit they
track.

| Channel | Who runs it | Tracks | Cadence | Purpose |
|---|---|---|---|---|
| `edge` | Build machines and the internal team only | every commit to `main` | on push | Catch breakage immediately |
| `next` | Internal staff and volunteer advisors (the canary ring, 5–15 machines) | weekly promotion from `edge` | weekly | Catch regressions on real hardware and real workloads before members see them |
| `stable` | All members | promotion from `next` after a clean soak | every 2 weeks, or immediately for a critical CVE | What advisors run |

Rules:

- **Nothing reaches `stable` that has not soaked on `next` for at least seven days on at
  least five distinct hardware models**, except a security fix, which may be fast-tracked
  with a named person accepting the risk in writing.
- A `stable` release is a **digest**, not a tag. Advisor machines are pinned to a digest
  that is advanced deliberately, so a mistaken push cannot reach the fleet.
- The canary ring is a real commitment. Recruit it, thank it, and give it a direct
  reporting path.

---

## 3. Build and publish pipeline

```
git push ──► GitHub Actions
              │
              ├─ podman build images/kde   → sp-plus-kde
              ├─ podman build images/gnome → sp-plus-gnome
              ├─ bootc container lint
              ├─ package manifest (rpm -qa) + SBOM  → build artifacts
              ├─ boot smoke test in QEMU (UEFI + OVMF + swtpm)
              ├─ cosign sign  (key in CI secret store / OIDC keyless)
              └─ push to ghcr.io/secureprospective/…:edge@sha256:…
                        │
                        │  weekly promotion (retag digest, no rebuild)
                        ▼
                     …:next
                        │  soak ≥ 7 days, ≥ 5 hardware models, zero open regressions
                        ▼
                     …:stable      ──► advisor fleet via bootc-fetch-apply-updates
                        │
                        └─ quarterly: bootc-generic-iso from sp-plus-installer
                                      → signed ISO + SHA-256 + detached signature
```

**Promotion never rebuilds.** Promoting is retagging a digest that has already been
tested. Rebuilding at promotion time means shipping an artifact nobody tested.

**ISO cadence is quarterly, not per-release.** The ISO only needs to be new enough that
a fresh install does not take an hour of updates on first boot. Everything else comes
through the update channel. Decoupling ISO cadence from image cadence removes most of
the release burden.

---

## 4. Signing and trust

Four distinct signing concerns. Confusing them is common.

| What is signed | With what | Verified by | Purpose |
|---|---|---|---|
| The SP+ container image | cosign (keyless OIDC preferred, or a key in CI secrets) | `bootc` via a container signature policy shipped in the image | An attacker who compromises the registry cannot push an update to the fleet |
| The ISO | detached GPG signature + published SHA-256 | the downloading advisor, per written instructions | Download integrity |
| Remediation playbooks | a signing key held by Secure Prospective | the SP+ runtime, before execution | A modified playbook must not run |
| The kernel and modules | **Fedora's key, not ours** | shim → GRUB → kernel | Secure Boot without MOK enrollment. See document 2 §4 |

Non-negotiables:

- **The container signature policy must be in the image.** An image that accepts
  unsigned updates has no supply-chain protection at all, and this is trivially easy to
  forget.
- **Private keys never enter the image or the repository.** They live in the CI secret
  store and, for the ISO and playbook keys, in an offline backup held by a named person.
- **Key rotation must be planned before the first release.** A signing key that cannot
  be rotated without bricking the fleet is a single point of failure with a multi-year
  fuse. Ship a trust bundle that can hold two keys so rotation is an overlap, not a
  cutover.
- The checked-in SHA-256 manifest used during the 2026-08-25 POC is a **development
  stand-in** and must never be described as production signing.

---

## 5. Fedora major-version migration

This is the recurring event that will hurt, so it gets a standing procedure.

Fedora releases roughly every six months and supports each release for about thirteen
months. Fedora 44 shipped 2026-04-28 and reaches end of life around 2027-05-19. SP+
therefore has a mandatory base bump roughly annually, with a comfortable window rather
than an emergency.

**Fedora 45 is scheduled for 2026-10-20, about eight weeks out. Treat that as an asset,
not a problem.**

The naive reading is that SP+ ships on a base that goes one version stale within two
months. Christopher's reading, adopted here, is better: adoption will be slow at first,
so the fleet during the F45 window will be small, known, and mostly internal. That is
precisely the condition under which you *want* to run your first major-version migration.
The alternative — discovering how `bootc switch` behaves across a Fedora bump for the
first time with 400 advisors on the channel — is the version of this event that hurts.

So the F45 migration is not a chore deferred to next year. It is **a deliberate rehearsal,
scheduled into the first year's plan, run while the blast radius is small**, and its real
deliverable is a tested, written, repeatable procedure plus honest answers to the two
questions nobody can answer from documentation:

1. Does the LUKS2 TPM2 keyslot survive a Fedora major-version rebase, or does the
   bootloader change move PCR 7 and drop every advisor to a passphrase prompt? If it
   drops them, exactly what do they see, and does the knowledge-base article match it?
2. Does `/etc` three-way merge cleanly across the bump, and which SP+ files does it
   silently keep at their old contents?

Run it on the canary ring the week F45 ships. Write down what broke. That written
procedure is worth more than the release it produces.

**Standing procedure, starting when Fedora N+1 reaches Beta:**

1. Open an `edge-next-fedora` branch with the `FROM` line bumped to N+1. Build it. Do not
   promote it anywhere.
2. Work the build failures. Package renames and removals are the usual cause.
3. Boot it in QEMU. Then install it clean on every model in the hardware matrix.
4. **Test the in-place rebase**, which is the path real advisors take:
   `bootc switch ghcr.io/secureprospective/sp-plus-kde:N+1`. Confirm `/etc` merges
   cleanly, that user data survives, that the LUKS TPM binding survives (it may not, if
   the shim or GRUB changed and PCR 7 shifts — plan for a passphrase prompt and warn
   users in advance), and that rollback to N works.
5. Ship to `next` and soak for a full month, not a week.
6. Ship to `stable` with an in-product notice explaining what is happening and that a
   passphrase prompt may appear once.
7. Rebuild the ISO on N+1.

**The TPM/PCR interaction is the sharp edge.** A bootloader change alters PCR 7, which
invalidates the TPM keyslot, which drops the advisor to a passphrase prompt they have
never seen. The mitigation is: keep the passphrase keyslot valid forever, make sure the
recovery key is recorded at first boot, ship the knowledge-base article for that exact
screen, and consider re-enrolling TPM2 automatically after a successful passphrase
unlock following a major update.

**Skipping a release is not permitted.** Two-version rebases are less tested and the
failure lands on a non-technical user.

---

## 6. Monitoring and telemetry

SP+ handles client PII and its users have regulatory exposure. Telemetry is therefore
constrained, but flying blind across a fleet is also a failure mode.

**Recommended position:** minimal, opt-in, and legible.

- Default: **no telemetry.** The machine does not phone home.
- Opt-in during the first-boot wizard, in plain language: *"Send Secure Prospective a
  weekly report that this computer is up to date and its encryption is on. It contains
  no information about your clients, your files, or what you do on this computer."*
- If enabled, the payload is a small, human-readable, allowlisted document — image
  digest, update status, encryption status, Secure Boot status, hardware model, and a
  random install ID — and the advisor can view exactly what was sent in the PWA.
- Never collect: filenames, paths, browser history, application usage, client data,
  anything derived from `/home`.
- The same redaction gateway that governs the assistant's cloud requests governs this.

Without opt-in telemetry, the substitute is the canary ring and a support inbox. That is
workable for a fleet of dozens and inadequate for a fleet of hundreds.

---

## 7. Support model

| Tier | Who | Handles |
|---|---|---|
| 0 | The SP+ PWA and knowledge base | "Why is it asking for a recovery key", "my printer stopped", "how do I update" |
| 1 | The SP+ assistant with signed playbooks | Diagnose and offer a reversible fix, with approval |
| 2 | Secure Prospective support | Anything the assistant cannot resolve; has access to the evidence export the advisor generates |
| 3 | Remote support over Tailscale | Time-limited, user-approved, audited. Client present in the session |
| 4 | Engineering | Regressions, hardware matrix additions, image changes |

Tailscale is included in the image but **not enrolled and not enabled**. Enrollment
happens only when the advisor requests support. It must never route all internet traffic
by default, and it must never be co-enabled with Cloudflare WARP without an explicit
compatibility design.

---

## 8. Operating cost shape

Small, and worth stating so it is not a surprise.

- **Registry bandwidth** is the main variable cost. bootc updates transfer changed layers,
  not whole images, but a base-image bump is a large pull. With 400 machines and a
  bi-weekly stable release, plan for meaningful egress. GHCR is free for public images;
  a private registry or R2-backed mirror is the paid alternative.
- **ISO hosting** is small and bursty, and is a good fit for Cloudflare R2 behind the
  member portal.
- **CI minutes** are modest for image builds and significant for ISO builds, which need
  privileged or VM-based runners. A self-hosted runner is likely cheaper.
- **Human time** dominates everything above: the canary ring, the hardware matrix, the
  annual Fedora bump, and support. Budget it explicitly rather than assuming it is free.

---

## 9. Discontinuation plan

Written now, because writing it later is writing it under pressure.

If SP+ is discontinued, Secure Prospective commits to: 90 days' notice in the product and
by email; security updates for the notice period; a final release that disables the
auto-update timer and displays a persistent, honest notice; a written migration guide
covering data export and how to return to Windows or macOS; publication of the
Containerfiles so a third party could continue the image; and clear guidance that
advisors must migrate off, because an unpatched machine holding client PII is a
liability that grows every month.

---

## 10. Standing calendar

| When | What |
|---|---|
| Every push | `edge` build, lint, QEMU smoke, sign, publish |
| Weekly | Promote `edge` → `next`; review canary-ring reports |
| Bi-weekly | Promote `next` → `stable` after soak criteria are met |
| Monthly | Review the Fedora security advisories that touched the image; review support ticket themes |
| Quarterly | Rebuild and re-sign the ISO; re-run the full hardware matrix on the current stable |
| At each Fedora Beta | Open the N+1 branch and begin the migration procedure in §5 |
| Annually | Rotate signing keys through the overlap window; review the discontinuation plan; re-verify every claim in document 2 §0 |
