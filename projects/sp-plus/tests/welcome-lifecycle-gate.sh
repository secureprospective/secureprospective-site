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
  ps -eo pid=,args= | awk -v pattern="$WELCOME_PATTERN" 'index($0, pattern) > 0 && $0 ~ /^[[:space:]]*[0-9]+ python3 / {print $1}'
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
