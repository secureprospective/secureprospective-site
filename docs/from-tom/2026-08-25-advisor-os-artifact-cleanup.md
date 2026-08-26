# Advisor OS build-artifact cleanup + what the 2026-08-25 Pi build sessions actually did

**Date:** 2026-08-25
**Branch:** session/advisor-os-poc
**Status:** Informational — no review needed. No source code changed. POC status unchanged (installer at `275d9c3`, docs at `29b4952`).
**Author:** Beelink Claude Code session (invoked via `/tom-session-close`). Not Pi, not CT105, not Tom's usual graphics lane — this was a one-off investigation + disk cleanup that Christopher asked for.

## Why this note exists

Christopher was worried the two Pi build sessions earlier on 2026-08-25 had done
something that "almost broke the OS" — his words: "some sort of complete binary
written into a file system." He asked for a review of those sessions and the
OS-ISO build before any cleanup. This records what was found and what was removed,
so CT105 has the full picture on next startup.

## What the Pi sessions actually did (no OS was built from scratch)

Two Pi sessions, both driven by `openai-codex/gpt-5.6`:

| Session file | Time | Work |
|---|---|---|
| `~/.pi/agent/sessions/--home-chris--/2026-08-25T15-19-09-678Z_01a03980-*.jsonl` | 15:19–~18:45 | The build/ISO session (257 shell calls) |
| `~/.pi/agent/sessions/--home-chris--/2026-08-25T16-57-57-977Z_01a039db-*.jsonl` | 16:57–~19:35 | Documentation package only — benign, git commits + `/tmp` research workers |

The build session did **not** write an OS from scratch. It:

1. Pulled Fedora's official `quay.io/fedora/fedora-bootc:43` (later `:44`) base image.
2. Layered Advisor OS customizations on top via `projects/advisor-os/installer/Containerfile`
   (Brave + managed policy, the local Advisor RPC service, markdown knowledge, defaults),
   built with `docker build`.
3. Converted that container image into a `.qcow2` disk image and an installer `.iso`
   using the `ghcr.io/osbuild/image-builder-cli` container (osbuild / bootc image-builder).
4. Test-installed the ISO repeatedly in throwaway QEMU VMs (UEFI + swtpm + KVM),
   iterating ~8 times around an Anaconda disk-space quirk in the bootc import path.
   The Fedora 44 ISO eventually passed a full automated run: encrypted install,
   reboot, LUKS2 unlock, multi-user startup, `advisor-os.service` start, test-user login.

"A complete binary written into a file system" = step 3/4: `bootc install` unpacks the
whole OS (~3 GB: kernel, bootloader, every system file) onto a disk image. That is what
any OS installer does. It wrote into **image files inside `projects/advisor-os/artifacts/`**,
never a real disk.

## Host integrity — verified NOT touched

- `/boot`, `/etc/fstab`, partition table, bootloader: clean, standard Debian, unchanged.
- No bind mounts, stray loop devices, or device-mapper entries on the host.
- No systemd units, `/etc` changes, or cron entries referencing advisor/bootc.
- No ENOSPC / OOM in the journal for the build window. `/home` peaked ~80%, never full.
- `buzz-prod` container stack: untouched, still the only thing in `docker ps`.
- The build images ran in `--rm` containers / the image-builder's internal store and are
  already gone; `docker images` shows only the buzz-prod infra (1.1 GB total).

## Two things worth flagging to CT105 / Christopher (not damage, but poor practice)

1. **`bootc install to-disk --via-loopback --wipe` ran inside `docker run --privileged`, twice.**
   Both targeted `/output/advisor.raw` (a truncated file inside the bind-mounted
   `artifacts/` dir) and were deleted afterward. A privileged container with `--wipe`
   plus loop-device access is a foot-gun if a path ever resolves wrong — worth a guardrail
   if bootc-to-disk work continues on this machine.
2. **X11 XTEST keystroke injection into Christopher's live desktop session, 3 attempts**
   (`from Xlib.ext import xtest`), to drive a QEMU console window and pipe output back
   over a netcat socket. Non-destructive, but it means the session was typing into
   whatever window had focus on the physical screen.

Both are documented in `projects/advisor-os/LIVE-TEST-LOG-2026-08-25.md` and the Pi
session transcript.

## What was deleted (all git-ignored `projects/advisor-os/artifacts/`, ~67 GB, all regenerable)

| Removed | Size | Regenerate with |
|---|---|---|
| 9 × `qemu-*.qcow2` install-test disk images | ~49 GB | `scripts/run-qemu.sh` (fresh disk per run) |
| `advisor-os-payload.tar`, `advisor-os-installer.tar`, `.tmp-advisor-os-payload.tar*` | ~6 GB | `docker save` in `scripts/image-builder.sh` |
| `iso/advisor-os-installer.iso` (stale F43), `qcow2/disk.qcow2` (F43) | ~7 GB | `scripts/build-iso.sh` / `scripts/build-qcow2.sh` |
| `bootc-fedora-43-qcow2-x86_64/`, `bootc-fedora-43-bootc-generic-iso-x86_64/`, `bootc-fedora-44-bootc-generic-iso-x86_64/` (root-owned image-builder intermediates) | ~11.5 GB | `scripts/image-builder.sh` (Christopher ran the `sudo rm` for these) |

## What remains in `artifacts/` (4.5 GB, deliberately kept)

- `iso/advisor-os-installer-latest.iso` (4.7 GB) — the one F44 build that passed the full
  automated encrypted-install test. Git-ignored, lives only on Beelink. Rebuildable from
  source but the build is slow and was finicky, so it is kept for re-testing convenience.
- All `*.log`, `*.md` (`bootc-installer-plan.md`, `build-plan.md`), `*.stderr` — the
  record of what was tried and why it broke.
- `qemu-runtime/`, `test-logs/` — small.

## Git state — untouched, preserved exactly as the Pi handoff left it

```
 M projects/advisor-os/installer/iso.yaml      <- gpt's in-flight edit, NOT staged, NOT committed
 M projects/advisor-os/scripts/build-iso.sh    <- gpt's in-flight edit, NOT staged, NOT committed
?? grafix/hdri/                                <- Tom's untracked graphics work, left alone
?? grafix/render/                              <- Tom's untracked graphics work, left alone
```

This note is the only thing added to the tree. It was committed alone; nothing else was staged.

## Disk result

`/home`: 80% used (88 GB free) → **65% used (155 GB free)**. Root `/` was never a concern (6%).

## Open items / what Claude or Christopher should check

- Nothing blocking. The POC's own open items are unchanged: manual graphical KDE/Brave/PWA/
  printer acceptance, live SSH inventory on a fresh VM, and a release-clean replacement for
  the `bootc-wrapper.sh` `/boot`-over-`/var/tmp` bind workaround (that wrapper runs inside
  the guest Anaconda environment, not on the host).
- If bootc-to-disk build work resumes here, consider a guardrail around
  `--privileged` + `--wipe` and around X11 injection into the live session.
