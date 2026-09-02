# SP+ RESUME — update-lane repair, 2026-09-01/02 (mid-session, compact-safe)

## 1. WHAT WE ARE DOING

Christopher: *"fix the updating ... I need the system/application/Pi updates to be user
controlled to work like a fresh install of any distro ... seemless, no issues, no errors, needs
to just work. Discovery store needs to be flawless. This one is non-negotiable."* Later:
*"just make sure if they hit update in the notifications, it actually updates"* and
*"we need to get rid of that bluebuild its messing things up i think."*

**Repo (ACTIVE):** `~/work/secureprospective-advisor-os` on the **Beelink** — a git worktree,
branch `session/sp-plus-plan`, HEAD **`541f73c`**, tree CLEAN.
Work happens under `projects/sp-plus/`.
Other worktrees of the same repo: `~/work/secureprospective-site` (main),
`~/work/sp-plus-build` (detached at `3bdf319` — NOT our branch, do not edit there).

**Access:** CT105 -> Beelink `ssh -i /root/.ssh/beelink chris@192.168.1.190`.
Beelink -> test VM `ssh -p 2222 test@127.0.0.1` (user `test`, password `password`).

## 2. IN-FLIGHT RIGHT NOW — most perishable

**A full image build is running.** Started 19:36 CDT 2026-09-01 by Christopher.

- command: `sudo podman build --network=host --pull=missing -f images/kde/Containerfile
  --build-arg SPPLUS_RELEASE=1 --build-arg SPPLUS_BUILD=20260901 -t localhost/sp-plus-kde:test52 .`
  run from `~/work/secureprospective-advisor-os/projects/sp-plus`
- alive?  `ssh ... 'pgrep -af "podman build"'`
- log:    `~/logs/sp-plus/build-test52.log` on the Beelink (already correctly filed)
- pids at capture time: 3293173 (sudo) / 3293237 (podman)
- 168 steps. Expect 40-60 min. Started from a cold cache because the dated
  `SPPLUS_BUILD` invalidates it.
- **A background watcher is attached** (Claude task id `bmj0fzm3q`) which blocks until the build
  exits and then greps the log for the three new gates and for errors. If that watcher is lost
  to compaction, just re-check the log directly — nothing depends on the watcher itself.
- **Christopher asked to be pinged when the build finishes.** Do that.

**On success:** run `projects/sp-plus/scripts/publish-image.sh localhost/sp-plus-kde:test52 20260901`.
It needs `sudo`, which now requires a password — so it is a paste.md step for Christopher, not
something this session can run.

**The test VM `fedora-test` is running** and must not be rebooted casually: see §10.

## 3. GATES / STATUS

| Gate | State |
|---|---|
| `config-preflight.sh` | **30 passed, 1 failed** — the 1 was `git tree is dirty`, now committed. Re-run should be 31/31. |
| `tests/update-guard-gate.sh` (new) | PASS, all 8 checks, run against the real helper on the VM |
| `UPDATE_LANE_GATE_OK` (new, in image) | untested — first runs in the build now in flight |
| `WELCOME_UPDATE_WIRING_OK` (new, in image) | untested — same |
| `theme-fidelity-gate.sh`, `theme-wallpaper-roundtrip.sh` | NOT run this session |
| End-to-end "notification Update button actually updates" | **NOT PROVEN.** Blocked until a genuinely newer image exists in the registry. |

## 4. ARTIFACTS AND EXACT IDENTITIES

- Booted on the VM (the real SP+ image, from the ISO):
  `sha256:22f238593023eaf5a706721e5cf6d70fa0658ef2381e40cdb4a369816c3e2a51`,
  image timestamp **2026-09-01T21:31:12Z**, `BUILD_ID=dev`, `VERSION_ID=1`.
- `ghcr.io/secureprospective/sp-plus-kde:latest` = `sha256:85807fae75e4e6ca24f1c7fc799f51ae7fe791d267b8d7af27b4b2c8f3ef299e`,
  created **2026-09-01T11:22:43Z**. **This is a BlueBuild image, NOT SP+.**
- The image that got staged onto the VM by mistake:
  `sha256:2da2777b4ef5732bfe4d4c28e6116cee8bcd62cca15c46a130946d62f90dd428` (11:19:56Z).
- Registry holds **21 non-signature tags, every one BlueBuild** (`20260826`..`20260901`,
  `-44` variants, commit-sha tags, `44`, `latest`) plus 34 `.sig` tags signed by BlueBuild's
  CI key, which we do not hold.
- Signing key (NEW, ours): `~/.config/sp-plus-signing/{cosign.key,cosign.pub,password}` on the
  Beelink, mode 0700 dir / 0600 key+password, **outside any git repo**. cosign binary at
  `~/vendor/cosign/cosign`.
- `gh` 2.99.0 at `~/.local/bin/gh` -> `~/vendor/gh/bin/gh`. Token scopes include
  `write:packages`, `delete:packages`, `repo`.
- Root podman **is logged in** to ghcr.io as `secureprospective` (done 19:32).

## 5. THE ROOT CAUSE (settled, with the evidence)

`ghcr.io/secureprospective/sp-plus-kde:latest` — the tag every installed machine updates from —
was being republished **daily at 06:00 UTC** by an abandoned **BlueBuild** GitHub Actions
workflow in the separate repo `secureprospective/sp-plus-kde`. The image it publishes is not
SP+. Running it:

```
ABSENT  /usr/libexec/spplus-stage-update
ABSENT  /usr/share/polkit-1/rules.d/49-sp-plus-updates.rules
ABSENT  /usr/libexec/spplus-tune
ABSENT  /usr/share/sp-plus
spplus files in /usr/libexec: 0
```

Two failures followed, both now fixed:

1. Discover's rpm-ostree backend offered it (digest differs => "update"), rpm-ostree refused:
   `error: While checking against deployment timestamp: Upgrade target revision ... with
   timestamp 'Tue 01 Sep 2026 11:22:43 AM UTC' is chronologically older than current revision
   ... with timestamp 'Tue 01 Sep 2026 09:31:12 PM UTC'; use --allow-downgrade to permit`
   The advisor saw only *"Update Issue -- There was an issue during the update or installation
   process."*

2. **`bootc upgrade` has NO downgrade guard.** At **18:40:45** `spplus-stage-update.timer`
   staged that older non-SP+ image over the running machine and reported success
   (`Removed layers: 218 / Added layers: 73`). One shutdown later the VM would have become a
   stock Kinoite desktop with no Welcome, no Fin, no help app. **Discarded** with
   `rpm-ostree cleanup -p`; verified `staged: NONE` afterwards.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

1. **"It is a permissions/polkit lockdown."** NO. DN-47 is correct. `sudo -n bootc status`
   works, `bootc upgrade --check` exits 0, `spplus-tune` reports `update health = OK`, fwupd and
   Flatpak both work, all five timers armed. Permissions were never the problem.
2. **"Removing Discover's rpm-ostree backend crashes Discover."** NO. The SIGABRT I saw was
   **my own fault**: my test script did not export `WAYLAND_DISPLAY`/`DISPLAY`, so Qt aborted in
   `init_platform` -> `createPlatformIntegration` before loading any plugin. Re-run with the
   display vars set: Discover stays up and its Updates page reads **"Up to date"**.
3. **"The build's DNS failure was transient."** NO — I said this and was wrong. It killed the
   build twice at STEP 4 with `Could not resolve host: mirrors.fedoraproject.org`. Rootless
   podman resolves fine; the host resolves fine (`/etc/resolv.conf` = 1.1.1.1, 8.8.8.8, not a
   systemd-resolved stub); `netavark` 1.14.0-2 and `aardvark-dns` 1.14.0-3 are both installed.
   The fault is in the **rootful bridge network** specifically, still undiagnosed.
   **`--network=host` is the working workaround** and the current build uses it.
4. **"Our SP+ image is BlueBuild-derived."** NO. `images/kde/Containerfile` builds
   `FROM quay.io/fedora/fedora-kinoite@sha256:dd672611...` directly. Our image carries **zero**
   `blue-build` labels and no `base.name`/`source` labels.
5. **"Comments inside a RUN backslash continuation break the build."** NO. There are 20
   pre-existing instances in this Containerfile and it builds. podman strips them. I "fixed"
   a non-bug; harmless. (The **ordering** problem in that same patch was real — see §8.)
6. **The previously unexplained `30 passed / 1 failed` preflight** is `git tree is dirty`.
   Confirmed by seeing it named directly. Not a mystery, not flaky.
7. **"Fin/Pi has its own broken updater."** NO. Fin **is** Pi
   (`@earendil-works/pi-coding-agent`) pinned to `0.84.4`, installed at build time with npm
   removed afterwards; extensions are baked-in TypeScript. Nothing self-updates. Fin updates
   **are** OS image updates, so the guarded lane already covers Christopher's third item.

## 7. DECISIONS (Christopher's — do not relitigate)

- **OS lane belongs to SP+.** Discover's rpm-ostree backend is deleted; Discover keeps
  applications and firmware. A manual control lives in Welcome.
- **Publish the real image to `:latest` and cosign-sign it.**
- **Disable the BlueBuild workflow, keep the repo.** Done and pushed.
- **Generate a new SP+ signing key** rather than reuse BlueBuild's CI secret.
- **Third lane = Fin** (which resolves to Pi, above).
- **Authenticate GitHub with `gh auth login` device flow + 2FA, never PATs.** Saved to memory as
  `feedback-github-auth-use-gh-device-flow`. He is explicitly done with token hunting.

## 8. LEDGER / COMMITS

- `secureprospective/sp-plus-kde` — **`5e7fab5` pushed to main**: BlueBuild workflow disabled two
  ways (only `workflow_dispatch`, plus `if: false` on the job).
- `secureprospective-advisor-os` @ `session/sp-plus-plan` — **`541f73c`**, tree CLEAN:
  "Updates: one guarded lane, and it refuses to install an older image".
  New: `config/spplus-update-control`, `tests/update-guard-gate.sh`,
  `scripts/publish-image.sh`. Modified: `config/spplus-stage-update`,
  `config/spplus-update-notify`, `images/kde/Containerfile`, `welcome/welcome.py`,
  `welcome/app/{index.html,app.js,app.css}`, `tests/config-preflight.sh`,
  `tests/field-inspect.sh`.
- Two gate couplings had to be repaired and are worth remembering:
  `field-inspect.sh` asserted the rpm-ostree backend **must exist** (now must NOT);
  `config-preflight.sh` asserted `imageDigest` appears in `spplus-stage-update` (the digest now
  comes from the helper). Also: the Containerfile gate that forbids escalation in
  `spplus-update-notify` **matches comments too**, so that file must not even mention the tool
  names in prose.
- The Welcome gate had to move **after** the Welcome `COPY` at Containerfile line ~1520; the
  first draft put it at ~541 where those files do not exist yet.

## 9. NEXT ACTIONS, IN ORDER

1. **Check the build** (`pgrep -af "podman build"`, then the log). Confirm
   `UPDATE_GUARD_GATE_OK`, `UPDATE_LANE_GATE_OK`, `WELCOME_UPDATE_WIRING_OK` all appear and no
   `GATE FAIL`/`Error:`. **Ping Christopher with the result — he asked for this.**
2. **Publish**, via paste.md because it needs his sudo password:
   `scripts/publish-image.sh localhost/sp-plus-kde:test52 20260901`. The script refuses to
   publish an image missing SP+ files, refuses one carrying Discover's OS backend, and refuses
   one not newer than the tag. It signs by digest and verifies.
3. **Prove the end-to-end claim that is still unproven**: with a genuinely newer image on
   `:latest`, run `sudo /usr/libexec/spplus-stage-update` on the VM, confirm it stages, confirm
   the notification appears with **Restart now**, click it, and confirm the machine reboots into
   the new digest. This is the one thing Christopher explicitly asked for that has not been
   demonstrated.
4. **Delete the BlueBuild tags** from ghcr (21 non-sig + 34 sig). Irreversible — confirm scope
   with Christopher first. Recommended: keep the package, replace `:latest`, delete the dated /
   commit-sha / `44` tags.
5. **Signature enforcement** — deliberately NOT shipped yet. `/etc/containers/policy.json` is
   still `insecureAcceptAnything` and no public key ships. Deployments use
   `ostree-unverified-registry:`, which bypasses policy entirely, so flipping the policy alone
   either does nothing or breaks pulls; it must land together with an installer change that
   makes new installs use a verified reference. Say this plainly rather than implying updates
   are verified.
6. **Optionally** replace the human-token path entirely with a GitHub Actions workflow that
   builds the real Containerfile and pushes with the automatic `GITHUB_TOKEN`. Christopher is
   receptive; it also removes the whole class of problem that caused tonight's PAT misery.
7. Diagnose the rootful podman bridge DNS failure properly (needs sudo).

## 10. RELAY / ENVIRONMENT NOTES

- **`paste.md` is the relay** for anything needing Christopher's password. Write `/root/paste.md`
  on CT105 then `scp` to `chris@192.168.1.190:/home/chris/Downloads/paste.md`. One batch,
  overwrite, plain commands + `#` comments only, never real secrets. A Stop hook enforces this:
  putting `sudo` commands in a chat code block without writing paste.md that turn is blocked.
- **`sudo -n` on the Beelink NO LONGER WORKS** — the cached timestamp expired. Anything rootful
  (podman build, podman push, publish-image.sh) must go through Christopher.
- **The VM's port-2222 forward is LIVE-ONLY.** It was added to the running qemu with
  `virsh qemu-monitor-command fedora-test --hmp "hostfwd_add hostnet0 tcp:127.0.0.1:2222-:22"`.
  **It does not survive a VM restart** — re-run that if the VM reboots.
- **The Discover fix on the VM is a live-only bind mount**:
  `/tmp/discover-nobackend` over `/usr/lib64/qt6/plugins/discover`. It dies on reboot. The real
  change is in the Containerfile. (It vanished once on its own mid-session, unexplained.)
- Still staged on the VM for the next window: `/tmp/suc` (spplus-update-control),
  `/tmp/ssu` (spplus-stage-update), `/tmp/ugg.sh` (the guard gate).
- **Screenshots** are taken from the host, not the guest: `virsh screenshot fedora-test /tmp/x.ppm`
  then convert with PIL. `grim` inside the guest fails ("compositor doesn't support the screen
  capture protocol"). Wake a blanked screen with `virsh send-key fedora-test KEY_LEFTSHIFT`.
- **Nested ssh + heredoc/quoting mangles commands and fails SILENTLY** (bit me three times
  tonight, including one reap that appeared to succeed and had not run). Write a script file,
  `scp` it, execute it. Always read back the result rather than trusting the exit code.

## 11. HONEST STATUS

The diagnosis is solid and the evidence is recorded, not inferred. The fix is committed and its
guard is tested on all branches. Discover's clean "Up to date" page, the two-button notification
and the Welcome control were each photographed on the real desktop.

**What is genuinely NOT proven:** that clicking **Restart now** installs a real update. It
cannot be proven until a newer image is on the registry, which needs the build to finish and
Christopher to run the publish. Do not describe that path as working until it has been done
against a real newer image.

**Also unproven:** the three new in-image gates have never executed — the build carrying them is
the one currently running. And nothing has been rebuilt or re-verified on the **Dell**, which is
still pointed at the same poisoned tag and is the other machine at risk from it.
