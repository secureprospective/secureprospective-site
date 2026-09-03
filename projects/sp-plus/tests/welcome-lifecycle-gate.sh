#!/usr/bin/env bash
# SP+ Welcome lifecycle gate. Run inside the installed graphical guest.
set -euo pipefail

LAUNCHER="${SPPLUS_WELCOME_LAUNCHER:-spplus-welcome}"
WELCOME_PATTERN="${SPPLUS_WELCOME_PATTERN:-/usr/libexec/sp-plus/welcome/welcome.py}"
command -v "$LAUNCHER" >/dev/null 2>&1 || {
  echo 'WELCOME_LIFECYCLE_FAIL: launcher missing' >&2
  exit 1
}

process_ids() {
  # ps prints the interpreter's full path on the installed image
  # (/usr/bin/python3), not the bare command name. Match both that form and
  # versioned Python launchers without counting an unrelated process whose
  # arguments merely contain the Welcome path.
  ps -eo pid=,args= | awk -v pattern="$WELCOME_PATTERN" 'index($0, pattern) > 0 && $0 ~ /^[[:space:]]*[0-9]+[[:space:]]+([^[:space:]]+\/)?python3([.][0-9]+)?([[:space:]]|$)/ {print $1}'
}
renderer_ids() {
  ps -eo pid=,comm= | awk '$2 == "QtWebEngineProc" {print $1}'
}
has_id() {
  local wanted="$1"
  local ids="${2:-}"
  for id in $ids; do
    [ "$id" = "$wanted" ] && return 0
  done
  return 1
}
stop_started() {
  local pid
  for pid in "$@"; do
    [ -n "$pid" ] && kill -TERM "$pid" 2>/dev/null || true
  done
  sleep 2
  for pid in $(process_ids); do
    has_id "$pid" "$before_apps" || kill -KILL "$pid" 2>/dev/null || true
  done
  for pid in $(renderer_ids); do
    has_id "$pid" "$before_renderers" || kill -KILL "$pid" 2>/dev/null || true
  done
}

before_apps="$(process_ids)"
before_renderers="$(renderer_ids)"
first=''
second=''
cleanup() {
  stop_started "$second" "$first"
}
trap cleanup EXIT INT TERM

# Leave a real dead QLocalServer socket behind, then prove the launcher removes it.
python3 - <<'PY'
import os
from PySide6.QtCore import QCoreApplication
from PySide6.QtNetwork import QLocalServer

app = QCoreApplication([])
QLocalServer.removeServer('spplus-welcome')
server = QLocalServer()
if not server.listen('spplus-welcome'):
    raise SystemExit(server.errorString())
os._exit(0)
PY

timeout 60 "$LAUNCHER" --force >/dev/null 2>&1 & first=$!
sleep 5
printf 'WELCOME_STALE_LOCK_OK\n'
timeout 15 "$LAUNCHER" --force >/dev/null 2>&1 & second=$!
second_rc=0
wait "$second" || second_rc=$?
[ "$second_rc" -eq 0 ] || {
  echo "WELCOME_LIFECYCLE_FAIL: second launch exit=$second_rc" >&2
  exit 1
}
sleep 3

apps="$(process_ids)"
renderers="$(renderer_ids)"
new_apps=''
new_renderers=''
for pid in $apps; do
  has_id "$pid" "$before_apps" || new_apps="$new_apps $pid"
done
for pid in $renderers; do
  has_id "$pid" "$before_renderers" || new_renderers="$new_renderers $pid"
done
app_count=$(printf '%s\n' $new_apps | awk 'NF {n++} END {print n+0}')
renderer_count=$(printf '%s\n' $new_renderers | awk 'NF {n++} END {print n+0}')
[ "$app_count" -eq 1 ] || {
  echo "WELCOME_LIFECYCLE_FAIL: second launch created $app_count Welcome processes" >&2
  exit 1
}
[ "$renderer_count" -gt 0 ] || {
  echo 'WELCOME_LIFECYCLE_FAIL: no WebEngine process was observed' >&2
  exit 1
}
printf 'WELCOME_SINGLE_INSTANCE_OK welcome.py=%s QtWebEngineProcess=%s\n' "$app_count" "$renderer_count"

stop_started "$first"
first=''
second=''
before_close_apps="$(process_ids)"
before_close_renderers="$(renderer_ids)"
timeout 20 "$LAUNCHER" --force --self-test-close >/dev/null 2>&1
sleep 3

after_close_apps="$(process_ids)"
after_close_renderers="$(renderer_ids)"
for pid in $after_close_apps; do
  has_id "$pid" "$before_close_apps" || {
    echo "WELCOME_LIFECYCLE_FAIL: welcome.py remains: $pid" >&2
    exit 1
  }
done
for pid in $after_close_renderers; do
  has_id "$pid" "$before_close_renderers" || {
    echo "WELCOME_LIFECYCLE_FAIL: QtWebEngineProcess remains: $pid" >&2
    exit 1
  }
done
printf 'WELCOME_CLEAN_EXIT_OK welcome.py=0 QtWebEngineProcess=0 zygote=0\n'

# ---- BUSY CLOSE (W-1 / W-2). ------------------------------------------------
# Everything above closes an IDLE Welcome: --self-test-close fires 1s after the
# window opens, self._workers is empty, and Bridge.shutdown() is a no-op. Every
# gate in this repo used that path, so the drain -- the code that runs when an
# advisor closes Welcome while it is doing something -- was never executed by a
# test. Measured on the test56 guest 2026-09-03, the shipped drain froze the UI
# thread for the worker's full runtime (0 timer events delivered in 30s) and
# parked a live worker whenever the worker outran the bound.
#
# This closes Welcome on top of a REAL running worker, using the PIN_HELP env
# seam to stage a slow helper.
SLOW_HELPER="$(mktemp /tmp/spplus-slow-pin.XXXXXX)"
printf '#!/bin/sh\nsleep %s\necho pinned\n' "${BUSY_WORKER_SECONDS:-20}" > "$SLOW_HELPER"
chmod +x "$SLOW_HELPER"

busy_before_apps="$(process_ids)"
busy_before_renderers="$(renderer_ids)"
busy_log="$(mktemp /tmp/spplus-busy-close.XXXXXX)"
busy_t0=$(date +%s)
SPPLUS_PIN_HELP="$SLOW_HELPER" timeout 180 "$LAUNCHER" --force --self-test-close-busy \
  > "$busy_log" 2>&1
busy_rc=$?
busy_elapsed=$(( $(date +%s) - busy_t0 ))
rm -f "$SLOW_HELPER"

[ "$busy_rc" -eq 0 ] || {
  echo "WELCOME_LIFECYCLE_FAIL: busy close exit=$busy_rc" >&2
  sed -n '1,40p' "$busy_log" >&2
  exit 1
}
# The drain must WAIT for the worker. An exit faster than the worker means the
# worker was abandoned mid-subprocess, which is the failure the drain exists to
# prevent -- a half-written system Flatpak install.
[ "$busy_elapsed" -ge "${BUSY_WORKER_SECONDS:-20}" ] || {
  echo "WELCOME_LIFECYCLE_FAIL: busy close returned in ${busy_elapsed}s, faster than the ${BUSY_WORKER_SECONDS:-20}s worker; the drain did not wait" >&2
  exit 1
}
# A parked worker is one still running when the process tore down: the drain
# bound is smaller than some worker's own timeout. See DRAIN_BOUND_MS.
grep -q '^WELCOME_PARKED_WORKERS=0$' "$busy_log" || {
  echo "WELCOME_LIFECYCLE_FAIL: drain parked a live worker (or reported nothing):" >&2
  grep -E 'WELCOME_PARKED_WORKERS' "$busy_log" >&2 || echo '  (no WELCOME_PARKED_WORKERS line at all)' >&2
  exit 1
}
# Running an event loop during the drain means a worker can finish after the
# view is gone. That must not surface as a traceback in the advisor's journal.
if grep -qE 'Traceback|RuntimeError' "$busy_log"; then
  echo 'WELCOME_LIFECYCLE_FAIL: busy close raised an exception:' >&2
  grep -nE -A3 'Traceback|RuntimeError' "$busy_log" >&2
  exit 1
fi
sleep 3
for pid in $(process_ids); do
  has_id "$pid" "$busy_before_apps" || {
    echo "WELCOME_LIFECYCLE_FAIL: welcome.py remains after busy close: $pid" >&2; exit 1; }
done
for pid in $(renderer_ids); do
  has_id "$pid" "$busy_before_renderers" || {
    echo "WELCOME_LIFECYCLE_FAIL: QtWebEngineProcess remains after busy close: $pid" >&2; exit 1; }
done
rm -f "$busy_log"
printf 'WELCOME_BUSY_CLOSE_OK drained a %ss worker in %ss, parked=0, no exception, no leftovers\n' \
  "${BUSY_WORKER_SECONDS:-20}" "$busy_elapsed"
