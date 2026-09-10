# SP+ RESUME — 2026-09-10, alpha v0.10 release + overnight sweep

## 1. WHAT WE ARE DOING

SP+ **Alpha v0.10 is released** — Christopher tested the ISO on the Dell and approved it.
Two tracks are live right now: (a) getting the ISO uploaded to Cloudflare R2 so members can
download it from the back office, and (b) an all-night Bee sweep of the same build on a QEMU
rig, finding defects for the NEXT ISO.

- SP+ repo: `~/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`, tip `1477875`.
- Site repo: `~/work/secureprospective-site`, branch `sp-plus-alpha-release`, tip `d355461`,
  **pushed to origin** for CT105 to merge. Beelink never deploys; CT105 owns merge to `main`.
- Fedora bootc only. The Debian lane is a parked idea with no code — never mention it in status.

## 2. THE RELEASE ARTIFACT

- `~/Downloads/sp-plus-0.10-alpha.iso` — **5,452,943,360 bytes**
- sha256 `5e10d090d07b28b6809003b12fa5f65a8a0b51630121349916ec2d95ecc8d221`
  (`.sha256` sits beside it; `sha256sum -c` passes)
- Built from payload `localhost/sp-plus-kde:alpha3`, image id `6a0f241f013a`,
  timestamp `2026-09-10T01:09:07.624130591Z`.
- Installer image `localhost/sp-plus-installer:alpha3`.
- **Verified INSIDE the ISO before it moved**: embedded kickstart ref
  `containers-storage:localhost/sp-plus-kde:alpha3`, embedded image id `6a0f241f013a` — match.
- Bases (re-pinned `47fd412`, both had rotated off quay):
  kinoite `sha256:1424b842…61dd92`, fedora-bootc `sha256:1bc549cb…ce84b36`.

## 3. CLOUDFLARE — DONE, AND THE ONE THING BLOCKED

Account is **`002dd2f758b67ac08d05a3809d65a25a`** (SecureProspective). NOT the personal
`7ebaacec…` account, which wrangler defaults to and where R2 is not even enabled — that
misdirection cost time, do not repeat it.

Done:
- R2 bucket **`spplus-releases`** created (ENAM, Standard).
- Pages project `secureprospective-site` now binds **`SPPLUS_RELEASES` → `spplus-releases`
  on BOTH production and preview**; the pre-existing `LEADS` → `ccwork-leads` was preserved.
  Bindings take effect on the next deployment, so CT105's merge is what activates it.

**BLOCKED — the ISO is not uploaded.** Needs an R2 **Object Read & Write** token
(Access Key ID + Secret) that Christopher creates in the dashboard. Asked for; not yet supplied.
He was told to drop it at `~/.config/fleet/r2.env`.

Why every other route is dead — **do not retest these**:
- `wrangler r2 object put` hard-refuses >300 MiB. The ISO is 5.08 GiB.
- R2 multipart lives on the **S3 API only**. The v4 REST API has no mpu route:
  `?action=mpu-create` → `10015 No route matches this url`.
- CT105's `/root/.cf_token` CAN create buckets and list R2, but it is account-owned:
  `/user/tokens/verify` → `1000 Invalid API Token`, `/accounts/{acc}/tokens` → `9109` 403,
  `/r2/api_tokens` and `/r2/temp-access-credentials` → 404. So the S3 access key cannot be
  derived from it.
- `~/fleet/bin/r2-put-large` was written for the v4 mpu route and is therefore **useless as
  written**. Once real S3 keys exist, use **rclone v1.75** (`~/fleet/bin/rclone`) instead —
  it does multipart natively. Do not "fix" r2-put-large; delete or repurpose it.

**Cost note Christopher must weigh:** 5.08 GiB fits R2's 10 GB-month free tier and egress is
free, so this stays free. A SECOND release exceeds 10 GB. He does not use paid services, so
old ISOs get retired rather than accumulated.

## 4. AFTER THE TOKEN ARRIVES — the exact sequence

1. rclone copy the ISO to `spplus-releases/sp-plus/sp-plus-0.10-alpha.iso`,
   content-type `application/x-iso9660-image`.
2. Verify the OBJECT: size == 5452943360 and sha256 == the value in §2. Do not trust the upload.
3. In `~/work/secureprospective-site/functions/_lib/releases.ts` flip `published: false` →
   `true`. That is the whole change; the comment above it explains why it was held.
4. `npm run build`, commit, push the branch. CT105 merges.
5. Confirm the live download works end to end as a signed-in member before calling it done.

## 5. SITE CHANGES ALREADY MADE (committed + pushed)

`a2b26ac` — public build language → alpha release: `index.astro` hero `SP+ // ALPHA RELEASE`,
`STATE // ALPHA RELEASE`, proof badge `Active`→`Alpha`; `the-work.astro` status bar, honesty
line, figcaption; back-office copy; `releases.ts` given the real build metadata.
`d355461` — renamed to **Alpha v0.10**: id `0.10-alpha`, label `SP+ Alpha v0.10`, key
`sp-plus/sp-plus-0.10-alpha.iso`.

Site test suite: 3 files fail on a `better-sqlite3` native ABI mismatch in this clone's
`node_modules` (`ecosystem/agent`, `knowledge-graph`, `mcp`). **Pre-existing, unrelated** —
none of those modules were touched. 5 files / 128 tests pass. Build: 14 pages.

## 6. IN-FLIGHT RIGHT NOW — DO NOT ORPHAN

**The Bee sweep is RUNNING and is independent of this session.** Compaction cannot kill it.

- Driver: `~/fleet/runs/spplus-alpha-sweep-2026-09-09/drive.sh`, detached via setsid.
- 12 phases, sequential, one VM, `TIMEOUT=5400` each, Bee on `gpt-5.6-luna --thinking max`.
- **Resumable by design**: a phase with a non-empty report in `reports/` is SKIPPED. Delete a
  report to force a re-run. This is deliberate — GPT agents run against a five-hour cooldown.
- Alive check: `pgrep -f gpt-5.6-luna` and `tail ~/fleet/runs/spplus-alpha-sweep-2026-09-09/logs/drive.log`
- Progress: `tail ~/fleet/runs/spplus-alpha-sweep-2026-09-09/PROGRESS.md` (Bee writes a row per step)
- Reports land in `reports/P<nn>.md`, copied from `~/.pi/agent/bee-spplus-sweep-p<nn>.out`.
- At write time: **P01 complete** (12,453 bytes), **P02 in flight** since 03:42Z.
- Recovery if a phase is killed: the pi session transcript is the only channel that survives;
  the runner gives each run a unique `--session-id fd-spplus-sweep-p<nn>-<stamp>-<pid>`.

## 7. THE RIG

- libvirt domain **`fedora-alpha-test`**, `qemu:///session`, 1280x800, 8 GiB, 4 vCPU.
- It is running the **released alpha3 image** — booted digest
  `sha256:2ee969adfc7a105a6b930db9cee7313f2965042bade7b5f077edcd785b1530cb`,
  timestamp matches the payload exactly.
- Guest: user `test` / `play123`, LUKS `play123`, hostname `sp-plus`.
- **SSH: `-p 2223` with `~/.ssh/spplus-testvm`, IdentitiesOnly=yes.** sshd is key-only by design.
- **That port forward was added to the RUNNING QEMU** via
  `qemu-monitor-command --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2223-:22'`.
  **It does not survive a VM restart.** Re-add it after any reboot — P11 reboots the guest and
  the brief tells Bee to ask rather than do it itself.

Tools (host-side, each scoped to one domain, none opens a window on the Beelink):
`vmshot`, `vmtype`, `vmunlock`, **`vmclick`** (new: QMP pointer/keyboard, measures the guest
resolution every call), **`vmdesktop`** (new: the guard, see §8).

## 8. REFUTED / LESSONS — DO NOT REPEAT

- **A screenshot always succeeds; it just returns the wrong screen.** A console login left on
  tty3 made every "desktop" screenshot a black `sp-plus login:` screen. Bee reported on it as
  the desktop and started clicking at nothing. P01 and P02 were discarded and re-run.
  Fixed mechanically: `vmdesktop` asks the GUEST via `loginctl` whether the graphical session
  is the active VT. Mutation-tested — red (`FAIL … tty2 is NOT active`, exit 1) before green.
  It is step zero in COMMON.md and in all 12 phase briefs.
- **`sleep N && cmd` is blocked by the harness.** Use `until <check>; do sleep N; done` or
  `run_in_background`.
- **`pgrep -f <pattern>` matches its own shell command line** and reads as "still running".
  Bracket the pattern or check `ss`/`ps` instead. This produced a false "STILL UP" during reap.
- The host memory reaper killed the first ISO build. Stopping the finished `spplus-alpha2-test`
  VM freed 5.5 GB (12→18 GB available) and the rebuild ran detached.

## 9. DECISIONS IN FORCE

- `published: false` stays until the object is really in the bucket — the Worker returns
  "That build is no longer available" for a missing object, which a member cannot tell apart
  from a pulled build.
- Beelink never deploys. CT105 owns merge to `main`; Pages auto-deploys from `main`.
- Bee may not: act on the Beelink, run any git command, touch another VM, rebuild/reinstall
  anything, or contact any outside service.

## 10. NEXT ACTIONS, IN ORDER

1. **Get the R2 token from Christopher**, then run §4 start to finish.
2. **Keep reporting the sweep** roughly every 20 minutes; read `PROGRESS.md`, and read the
   SCREENSHOTS, not only Bee's prose — that is how T-20 was caught.
3. **Re-add the port forward** when P11 reboots the guest and Bee asks.
4. When P12 lands, turn the defect list into TODO items for the next ISO.
5. Tell CT105 the branch is waiting, if it has not picked it up.

## 11. OPEN DEFECTS FOUND SO FAR

- **T-20 (logged, committed `1477875`)** — Welcome screen 03, choosing "Other account" makes
  the email card overflow: the https explanation is clipped mid-sentence and OPEN EMAIL SIGN-IN
  escapes the card onto the strip below. Evidence
  `~/logs/sp-plus/testvm/shots/p02-s03-other-url-20260910T034930Z.png`. **Fix in the next ISO.**
- From P01, not yet triaged: user unit `drkonqi-coredump-pickup.service` **failed**; missing
  `tss` user in tmpfiles/udev; tmpfiles "already exists, not a directory" for `/home`, `/srv`,
  `/root`; `spplus-flatpak-update.service` takes **1m23s**, the slowest unit at boot; Flatpak
  export directory absent (0 exports) — P07 should say whether that is expected.

## 12. HONEST STATUS

The ISO is built, verified inside, tested by Christopher on the Dell, and named. The site is
written and pushed. **Nobody can download it yet**, and that rests entirely on one dashboard
action only Christopher can take. The sweep has run about 15 real minutes of a night's work and
has already produced one shipping defect plus five things to triage; treat its "not fit to ship"
verdicts as input for the NEXT ISO, not as a reason to unpick the release Christopher just approved.
