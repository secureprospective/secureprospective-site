# SP+ RELEASE RUNBOOK — build to advisor's machine

**Written 2026-09-13, from the v0.11.4 release.** This exists because the same
process was re-derived at least three times: once for the build contexts, once
for the two registry logins, once for the R2 credentials. **If you are about to
work out how to publish SP+, stop and read this instead.**

Every command runs on the **Beelink** (`~/work/secureprospective-advisor-os/projects/sp-plus`),
which is the ACTIVE repository. Never on main — main is the live website.

---

## 0. The shape of it

| Stage | Artifact it produces | Who consumes it |
|---|---|---|
| 1 Preflight | "Safe to build." | you |
| 2 Build | payload image + installer image + ISO | 3, 6 |
| 3 Install test | a VM that proves the fixes | you |
| 4 Publish | `ghcr.io/secureprospective/sp-plus-kde:latest` | **every installed machine** |
| 5 Sign + verify | a signature the FLEET POLICY accepts | every installed machine |
| 6 R2 upload | `sp-plus/sp-plus-<ver>.iso` in the releases bucket | new installs |
| 7 Manifest | a `RELEASES` entry committed to the SITE repo main | members download page |
| 8 Advisor update | a machine actually running the new image | the proof |

Stages 4 and 6 are independent: **ghcr is how existing machines update, R2 is how
new machines install.** Neither substitutes for the other.

---

## 1. Preflight — refuses to let you build a dirty tree

    bash tests/config-preflight.sh        # NOT scripts/ — it is tests/

Ends with "Safe to build." or "DO NOT BUILD." A dirty git tree is a FAIL, so
commit first. 41 checks as of this writing.

## 2. Build

    bash scripts/build-iso.sh v0.11.4

One script for payload → installer → ISO, because the three commands were
recorded in three ledger files with three different build contexts and two of
the three cannot work. **The context is `projects/sp-plus` for all of them.**
~52 minutes: payload ~38, installer ~1, ISO ~7, verification ~1.

The log is `~/logs/sp-plus/build-<tag>-<UTC timestamp>.log` — **timestamped, so
do not `tail -f` a guessed filename.** It ends with `BUILD_ISO_OK`, which is the
check that the ISO embeds the payload ref its kickstart names (the alpha1 crash).

## 3. Install test — the only thing that proves a fix

    bash tests/spplus-testvm.sh install <iso> spplus-<tag>    # ~9 min
    bash tests/spplus-testvm.sh up spplus-<tag>               # answers LUKS

Then, for anything first-login shaped (favourites, skel, defaults), **create a
NEW account** — the installer's own `test` account is not proof for everything,
and a config file is not behaviour:

    sudo useradd -m -G wheel -c "Advisor Test" advisor

The greeter is **plasma-login-manager, NOT sddm**. Autologin goes in
`/etc/plasmalogin.conf.d/99-test-autologin.conf`:

    [Autologin]
    User=advisor
    Session=plasma.desktop

An `/etc/sddm.conf.d` drop-in is silently ignored, and `systemctl restart sddm`
STARTS a second display manager that was not running — which then looks like a
defect you introduced. Screenshot from the host, not from inside:

    virsh -c qemu:///session screenshot spplus-<tag> shot.ppm

`qdbus` is NOT in the image. To open the launcher use `dbus-send`:

    sudo -u advisor env XDG_RUNTIME_DIR=/run/user/$(id -u advisor) \
      DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u advisor)/bus \
      dbus-send --session --print-reply --dest=org.kde.plasmashell \
      /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu

## 4. Publish to ghcr — TWO LOGINS, this is the trap

`scripts/publish-image.sh` pushes as **rootful podman** and signs as **your
user's skopeo**. They read DIFFERENT auth files. Logging in to one and not the
other gives `403 (Forbidden)` in the middle of a multi-gigabyte push:

    gh auth token | sudo -n podman login ghcr.io -u secureprospective --password-stdin
    gh auth token | podman login ghcr.io -u secureprospective --password-stdin

`gh` already holds `write:packages`, so **never hunt for a PAT.** Then:

    bash scripts/publish-image.sh localhost/sp-plus-kde:<tag> $(date -u +%Y%m%d)

⚠️ **The script is not re-runnable after a partial success.** It refuses to
publish an image that is not NEWER than the tag — so once `:latest` has moved,
a re-run fails that check. If it dies after the push but before signing, finish
by hand (stage 5) rather than re-running it.

## 5. Sign, then verify the way a MACHINE will

    DIGEST=$(skopeo inspect docker://ghcr.io/secureprospective/sp-plus-kde:latest \
             | python3 -c 'import json,sys;print(json.load(sys.stdin)["Digest"])')
    skopeo copy --preserve-digests \
      --sign-by-sigstore-private-key ~/.config/sp-plus-signing/cosign.key \
      --sign-passphrase-file ~/.config/sp-plus-signing/password \
      --sign-identity ghcr.io/secureprospective/sp-plus-kde:latest \
      docker://ghcr.io/secureprospective/sp-plus-kde@$DIGEST \
      docker://ghcr.io/secureprospective/sp-plus-kde:latest

Verification is `podman pull --signature-policy`, never `cosign verify` (cosign
reads its own format and passed against a signature no SP+ machine could find)
and never `skopeo --policy inspect` (it does not enforce the policy at all).

**Mutation-test it or it is not evidence.** Point the same policy at an
unrelated public key and confirm the SAME digest is refused. Do NOT "mutation
test" by trying an older published tag — those are signed too, so accepting one
proves nothing. That mistake was made on 2026-09-13.

## 6. R2 upload — for NEW installs

Tool: `~/fleet/bin/r2-put-large <bucket> <key> <file>` (multipart; `wrangler r2
object put` refuses anything over 300 MiB and an ISO is ~5.2 GB).

**Credentials: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.**
As of 2026-09-13 **no credential on any of these machines has R2 access**:

- `~/.cloudflare_token` (Beelink and CT105): valid, but 403 on `/r2/buckets`
  AND on `/pages/projects`.
- the wrangler OAuth login in `~/.config/.wrangler/config/default.toml`:
  scopes are `workers:*`, `d1:write`, `pages:write` … **no `r2` scope at all**,
  and wrangler refuses OAuth in a non-interactive shell anyway.

So this stage needs, once: an interactive `wrangler login` on the Beelink that
includes R2, or an R2 "Object Read & Write" API token from the dashboard saved
to `~/.config/sp-plus-r2/env`. `scripts/publish-iso-r2.sh` reads that file,
uploads, verifies the object size against the build, and prints the manifest
entry for stage 7. **Account ID: `002dd2f758b67ac08d05a3809d65a25a`.**
**The bucket is `spplus-releases`** (confirmed 2026-09-13), on the
`secureprospective-site` Pages project, bound as `SPPLUS_RELEASES` in BOTH
Production and Preview. It is private: no public access, no custom domain, no
`r2.dev`. The Pages Function streams objects out of it through the binding,
which is a separate auth path from the upload token.

S3 endpoint: `https://002dd2f758b67ac08d05a3809d65a25a.r2.cloudflarestorage.com`,
region `auto`. The token wants **Account** type, **Object Read & Write**, scoped
to `spplus-releases` alone — that is the only permission level that can be
scoped to one bucket. The Secret Access Key is shown ONCE on the success screen
and cannot be retrieved later.

## 7. The release manifest — a real, small commit to the SITE repo main

`functions/_lib/releases.ts` on `main` of `secureprospective-site`. It is
committed on purpose: R2 does not return a whole-object sha256 for a multipart
upload, so the only trustworthy sha256 is the one the build computed.

**Upload to R2 FIRST.** `published: true` exposes the entry to members the
moment Pages deploys, and Pages deploys on push.

This is the ONLY thing that ever goes to main from a release. **Never merge the
SP+ branch into main** — main is the live website, and the branch is ~600
commits of OS work.

## 8. The advisor update — what stage 4 is actually for

The lane on an installed machine:

1. `spplus-stage-update.timer` fires, `spplus-update-control check` asks the
   registry and **refuses to call an older image an update** (different is not
   newer), then `stage` downloads it.
2. `spplus-update-notify` shows the advisor ONE notification per staged digest,
   with a button that restarts into it.
3. The advisor clicks it, enters the LUKS passphrase, and is on the new image.

Discover's rpm-ostree backend is deleted from the image so there is no second,
disagreeing updater. To verify afterwards: `sudo bootc status` — the booted
digest must equal the published one from stage 5.

**SP+ ships with sshd OFF.** A release machine has no open ports at all, so
remote verification needs `sudo systemctl start sshd` at its keyboard, and it
goes back off afterwards.

---

## The traps, in one place

| Trap | What it looks like | The fact |
|---|---|---|
| Two registry logins | `403 Forbidden` mid-push | rootful podman and user skopeo read different auth files |
| Re-running the publish | "REFUSING: not newer" | `:latest` already moved; finish by hand from stage 5 |
| `pgrep -f publish-image.sh` | "still running" forever | the pgrep matches its own ssh command string |
| Guessed log filename | monitor exits instantly, silent | `build-iso.sh` timestamps its log |
| `GATE FAIL` in a log filter | monitor fires on healthy steps | the string appears in the TEXT of every gate's own echo |
| sddm autologin | ignored, and starts a 2nd display manager | the greeter is plasma-login-manager |
| cosign verify | passes, fleet still refuses | cosign reads a format containers/image cannot find |
| Mutation test with an old tag | "policy accepted it, check is blind" | old tags are signed too; use a WRONG KEY |
| `ark --archive` | rc=1, looks like a defect | there is no such flag; it is `-t/--add-to` |

*Sibling docs: `docs/ledger/RESUME-*.md` for session state,
`docs/theme-manifests/PINNED-APPS-AND-FAVOURITES-RESTORE.md` for the favourites
storage model.*
