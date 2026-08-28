#!/usr/bin/env bash
# SP+ Welcome live gate. Run inside a graphical installed SP+ session.
# It exercises the real launcher and real QWidget close path, not SIGTERM.
set -euo pipefail

command -v spplus-welcome >/dev/null 2>&1 || { echo 'WELCOME_CLOSE_FAIL: spplus-welcome missing' >&2; exit 1; }
command -v timeout >/dev/null 2>&1 || { echo 'WELCOME_CLOSE_FAIL: timeout missing' >&2; exit 1; }

before=$(pgrep -f '[w]elcome.py' || true)
if ! timeout --signal=TERM 15s spplus-welcome --force --self-test-close; then
  echo 'WELCOME_CLOSE_FAIL: launcher did not exit after its window close' >&2
  exit 1
fi
sleep 1
after=$(pgrep -f '[w]elcome.py' || true)
if [[ -n "$after" ]]; then
  echo "WELCOME_CLOSE_FAIL: welcome.py remains: $after" >&2
  exit 1
fi
printf 'WELCOME_CLOSE_OK no welcome.py process remains (before=%s)\n' "${before:-none}"
