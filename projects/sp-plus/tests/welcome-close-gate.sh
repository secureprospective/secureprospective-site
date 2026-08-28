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
# Judge only the instance this gate started. "before" was already captured and
# then ignored, so on a real desktop the gate failed against the Welcome window
# the advisor is autostarted into -- a process it never launched and must not
# kill. Observed on the cycle36 UEFI guest: the gate's own instance exited
# cleanly and it still reported "welcome.py remains: 1902", which was the login
# autostart from four minutes earlier. 2026-08-28.
leaked=""
for pid in $after; do
  case " $before " in
    *" $pid "*) ;;
    *) leaked="${leaked:+$leaked }$pid" ;;
  esac
done
if [[ -n "$leaked" ]]; then
  echo "WELCOME_CLOSE_FAIL: welcome.py launched by this gate remains: $leaked" >&2
  exit 1
fi
printf 'WELCOME_CLOSE_OK the instance this gate launched exited (pre-existing=%s)\n' "${before:-none}"
