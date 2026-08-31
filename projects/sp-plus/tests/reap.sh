#!/usr/bin/env bash
# SP+ REAPER — reclaim stale processes and storage. Run at the END of every
# build/test cycle and at session close. Standing rule: if we are not coming
# back to a process or a file, it gets cleaned up. Slop compounds; cleanup does not.
#
#   reap.sh            # report only, change nothing
#   reap.sh --apply    # actually reclaim
#
# SAFETY: never touches a VM whose disk is held open by a RUNNING qemu, never
# deletes evidence (logs, screendumps, reports), never touches the repo.
set -uo pipefail
APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1
D="~/work/sp-plus/iso"
say() { [ $APPLY -eq 1 ] && echo "  REAPED  $*" || echo "  would reap  $*"; }
FREED=0

echo "=== SP+ REAPER $([ $APPLY -eq 1 ] && echo '(APPLYING)' || echo '(dry run)') ==="

# 1. Orphaned swtpm: a TPM emulator whose qemu is gone is always garbage.
echo "--- orphaned swtpm ---"
n=0
for pid in $(pgrep -x swtpm 2>/dev/null); do
  dir=$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | grep -oE 'dir=[^ ]+' | cut -d= -f2)
  [ -n "$dir" ] || continue
  base=$(dirname "$dir")
  if ! pgrep -af qemu-system 2>/dev/null | grep -q "$(basename "$base")"; then
    say "swtpm pid=$pid ($dir)"; [ $APPLY -eq 1 ] && kill "$pid" 2>/dev/null; n=$((n+1))
  fi
done
[ $n -eq 0 ] && echo "  none"

# 2. Disk images in cycle dirs NOT held open by a running qemu.
#    Evidence (logs, png, reports) is KEPT. Only the bulky replayable blobs go.
echo "--- stale VM disk images (evidence preserved) ---"
live=$(pgrep -af qemu-system 2>/dev/null | grep -oE '/[^ ]+\.(qcow2|raw)' | sort -u)
n=0
while IFS= read -r img; do
  [ -n "$img" ] || continue
  if echo "$live" | grep -qxF "$img"; then continue; fi
  sz=$(du -m "$img" 2>/dev/null | cut -f1); sz=${sz:-0}
  say "$(printf '%6s MB  %s' "$sz" "$img")"
  FREED=$((FREED+sz)); n=$((n+1))
  [ $APPLY -eq 1 ] && rm -f "$img"
done < <(find "$D" -maxdepth 2 \( -name '*.qcow2' -o -name '*.raw' \) 2>/dev/null)
[ $n -eq 0 ] && echo "  none"

# 3. .ppm screendumps that already have a .png twin. The ppm is 3 MB, the png ~50 KB,
#    and the png is what the ledger references.
echo "--- redundant .ppm screendumps (png twin exists) ---"
n=0
while IFS= read -r ppm; do
  [ -n "$ppm" ] || continue
  [ -f "${ppm%.ppm}.png" ] || continue
  sz=$(du -m "$ppm" 2>/dev/null | cut -f1); sz=${sz:-0}
  say "$(printf '%6s MB  %s' "$sz" "$ppm")"
  FREED=$((FREED+sz)); n=$((n+1))
  [ $APPLY -eq 1 ] && rm -f "$ppm"
done < <(find "$D" -maxdepth 2 -name '*.ppm' 2>/dev/null)
[ $n -eq 0 ] && echo "  none"

# 4. Superseded frozen ISOs. The CURRENT build output is never touched.
echo "--- superseded ISO copies ---"
n=0
while IFS= read -r iso; do
  [ -n "$iso" ] || continue
  sz=$(du -m "$iso" 2>/dev/null | cut -f1); sz=${sz:-0}
  say "$(printf '%6s MB  %s' "$sz" "$iso")"
  FREED=$((FREED+sz)); n=$((n+1))
  [ $APPLY -eq 1 ] && rm -f "$iso"
done < <(ls -t "$D"/*.iso 2>/dev/null | tail -n +3)
[ $n -eq 0 ] && echo "  none"

echo
echo "TOTAL: ~${FREED} MB $([ $APPLY -eq 1 ] && echo 'reclaimed' || echo 'reclaimable — rerun with --apply')"
[ $APPLY -eq 1 ] && { echo "--- disk now ---"; df -h "$D" | tail -1; free -g | head -2; }
exit 0
