# RESUME — SP+ 0.11 support simulation: CLOSED LOOP PROVEN, v0.11.5 SHIPPED
**Written:** 2026-09-13 ~02:40 EDT · supersedes the 00:10 version

## 1. WHAT WE ARE DOING
Christopher's framing: **the first real simulation of distribution support.**
"We failed now, but we need to loop till we know we have a solid update process.
Excellence is the standard, not the goal." Active goal (Stop hook enforces it):
get 0.11 uploaded to Cloudflare, update the Dell **as an advisor would**, and
verify everything is in working order.

- Repo (Beelink, ACTIVE): `~/work/secureprospective-advisor-os`, subdir `projects/sp-plus`
- Branch `session/sp-plus-defense-in-depth` @ **`b4ed090`**, pushed.
  **Never merge to main — main IS the live website.**
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Dell: `ssh dell@192.168.1.234` FROM THE BEELINK (key installed 2026-09-13).
  It is an **Inspiron 5737 LAPTOP**. The 3670 is the Proxmox host. Do not conflate.

## 2. IN FLIGHT RIGHT NOW
**A. The FIXED lane staging v0.11.5 on VM `spplus-v0.11.4`** (running, ssh port 2222).
- task `bu802f4w1` (may be gone after compaction — the VM work continues regardless)
- check: `ssh -i ~/.ssh/spvm -p 2222 test@127.0.0.1` then
  `systemctl is-active spplus-stage-update.service` and `sudo bootc status`
- expect: stages `sha256:384e2c8a…`, writes `/run/sp-plus/update-staged`,
  writes `/var/lib/sp-plus/last-check`
- **this is the "after" half of the before/after. The "before" is already PROVEN (§3).**

**B. Nothing else.** ghcr publish, R2 upload, builds: all finished and verified.

## 3. THE HEADLINE FINDING — PROVEN LIVE, DO NOT RE-LITIGATE
**Every SP+ machine silently stops updating forever once its update cache is empty —
which is the state every freshly installed machine starts in.**

Demonstrated 2026-09-13 ~02:2x on VM `spplus-v0.11.4`, genuinely behind, with
v0.11.5 published/signed/reachable, using ONLY shipped code:

    cachedUpdate before:  null
    stock lane runs    →  "already up to date, nothing staged"
    staged?               NOTHING
    cachedUpdate after:   null      ← never contacted the registry
    advisor panel says:   "This computer is up to date."

No error, no failed unit. `stage` decides from bootc's `cachedUpdate`, which only
`bootc upgrade --check` or a real `bootc upgrade` fills — and nothing shipped called
either. Closed loop.

**Also proven on a 1-minute-old fresh install from the 0.11 ISO:** shipped code says
`current | This computer is up to date.` with ZERO checks ever run.

## 4. THE FIX — BUILT, PUBLISHED, VERIFIED
`/var/lib/sp-plus/last-check` stamp, written only after bootc actually answers.
`status` gains a 4th state **`unknown`**. `stage` runs its own `--check` first.

| Artifact | Value |
|---|---|
| ghcr `:latest` | `sha256:384e2c8afbf1fdd485ea9555f258c1999decdf8e7158382e59955c4d304c3d3d` |
| signature | signed; policy ACCEPTS; **REFUSED under an unrelated key** (mutation-tested) |
| ISO v0.11.5 | 5,520,687,104 bytes, sha256 `74a8e71c0bf9f871e3e5efd2de4c72eff8e635594ea80ad71f4459dfebff7e82` |
| R2 | `spplus-releases/sp-plus/sp-plus-0.11.iso` = **v0.11.5, CONTENT-verified** (2 MB @ 3 GB offset) |
| Tom | CLEARED to publish, new sha256 sent, `~/fleet/briefs/ct105-spplus-011-release-verify.reply.md` |

Proven on a fresh v0.11.5 install: never checked → `unknown`; after a real check →
`current` + stamp. Fin defects B and C still fixed in the new image.

## 5. SIX CHECKS THAT COULD NOT DO THEIR JOB (the session's real theme)
1. `update-guard-gate.sh` asserted `no cached update → current` — **it PINNED the bug**
   and failed the build of the fix.
2. `status` could not say "I don't know".
3. R2 verify grepped `/total size/`; rclone prints `Total size:` → could ONLY fail.
4. The lane gate tested `decide()` arithmetic, never the wiring.
5. `publish-iso-r2.sh` `DEFAULT_ISO` hardcoded to v0.11.4 — would have re-uploaded
   the image it was replacing.
6. Size check cannot tell v0.11.4 from v0.11.5 — **both are exactly 5520687104 bytes.**
All now fixed and mutation-tested.

## 6. HYPOTHESES — DO NOT RETEST
| Claim | Verdict |
|---|---|
| "The closed loop was refuted; the stock lane works" | **WRONG — I contaminated the VM** with my own `bootc upgrade`. Now PROVEN (§3). |
| "The Dell is I/O starved, let it finish" | **WRONG, cost ~2h.** `ssh -vv` shows auth SUCCEEDS and it hangs at **command execution** = cannot fork ≈ memory exhaustion. |
| "No SSH banner means sshd is down" | **BAD TEST.** `/dev/tcp` showed no banner for .222/.100 either, both fine. `ssh-keyscan` on .234 returns a host key. |
| "rpm-ostree cleanup -pbrm restores virgin conditions" | **FALSE.** Nor does `ostree refs --delete ostree/container/image`. Use a fresh install instead. |
| "The Dell greeter keyboard is dead" | **FALSE.** Journal shows it RECEIVED Enter and submitted an EMPTY password. The field comes up **without focus**. UNCONFIRMED by a human. |
| "cachedUpdate is only written by --check" | **FALSE** (Bee, bootc 1.16.10). A normal `bootc upgrade` writes it too. |
| "We have Cloudflare tokens with R2 scope" | REFUTED twice. A new R2 token was made; creds at `~/.config/sp-plus-r2/env`. |

## 7. NEXT ACTIONS, IN ORDER
1. **Confirm §2A finished** — fixed lane staged `384e2c8a…` on the v0.11.4 VM.
   That completes the before/after on ONE machine.
2. **Run the ADVISOR path on that VM** (never yet verified end to end): log in as
   `advisor` (graphical session exists on tty1), wait for the SP+ notification,
   **click "Restart now"**, confirm it boots `384e2c8a…`.
3. **Test the greeter focus bug in that VM** — click the password field vs type
   directly. This is the top product fix and needs no Dell.
4. **The Dell** — WEDGED, needs Christopher physically. `~/Downloads/paste.md` has
   the recovery batch (look at screen → hold power → boot → `free -h` → start sshd).
   Then run the real advisor update on it.
5. **Rotate the R2 token** (key was in a `ps` listing through the first upload).
6. **Answer "delete the old one"** — still unanswered. Nothing deleted.

## 8. PRODUCT DEFECTS FOUND, NO FIX YET
- **Greeter takes no visible input** → advisor locked out after an update, no recovery.
- **Staging wedges a low-RAM machine** → the Dell: on, network alive, cannot run a
  program, for hours, no warning, no progress, indistinguishable from dead hardware.
  Needs a pre-flight memory/space check, a warning, and progress.

## 9. ENVIRONMENT TRAPS HIT TONIGHT
- `/tmp` in the VM is **tmpfs** — a file scp'd there before a reboot is GONE. Use `/var/tmp`.
- `pgrep -f "<pattern>"` **matches my own ssh command string** — happened 5×. Anchor it.
- Nested ssh + heredoc + apostrophes breaks quoting. Write a file, `scp` it, run it.
- The **Beelink refuses password ssh** (`PasswordAuthentication no`).
- VM LUKS passphrase `spplustest`, typed via `virsh send-key KEY_S KEY_P …`.
- `run-bee.sh <fid>` expects the brief at `~/.pi/agent/bee-<fid>.md`, NOT a path arg.

## 10. HONEST STATUS
Parts 1 and 3 of the goal are done and are stronger than asked. **Part 2 is NOT done:
an advisor update has never been observed end to end on real hardware.** The VM
before/after is the closest substitute and is in flight. The Dell is wedged and
needs hands.
