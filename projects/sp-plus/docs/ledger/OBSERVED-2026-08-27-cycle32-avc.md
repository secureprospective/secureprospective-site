# OBSERVED 2026-08-27 — 10 SELinux AVC denials on a cycle32 boot

Bee's cycle32 verification run recorded 10 `avc:` denial lines in the boot journal.
They involve `bootupctl` and `lsblk` touching `/boot` paths that carry no SELinux
label. The full verbatim lines are in `REPORT-cycle32.md`.

## Why this is recorded and NOT yet fixed

Nothing observably failed because of them. The system installed, booted, unlocked
LUKS, reached a graphical session, ran every shipped application (`APPS_PASS=50
APPS_FAIL=0`), and reported no failed units and no coredumps. `bootupctl` is a
boot-loader update path, so the denials matter at UPDATE time rather than at first
boot, and a cycle32 machine has never been updated.

Fixing this means either relabelling `/boot` in the image or shipping a policy
module, and both are the kind of change that should be made deliberately with a
build to verify it -- not folded in alongside the DN-24 wallpaper fix.

## What would settle it

Run a `bootc upgrade` on the cycle32 machine and see whether the denials become a
real failure or stay cosmetic. That is the cheap experiment and it needs no new ISO.
