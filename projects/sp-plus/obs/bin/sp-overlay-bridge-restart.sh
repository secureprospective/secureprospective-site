#!/usr/bin/env bash
# Restart the overlay bridge detached from this ssh session.
set -u
ROOT=~/work/secureprospective-advisor-os/projects/sp-plus/obs/sp-overlay
LOG=~/logs/sp-plus/obs/bridge.log
pkill -f 'bridge/sp-overlay-bridge.py' 2>/dev/null
sleep 1
cd "$ROOT" || exit 1
setsid python3 bridge/sp-overlay-bridge.py >"$LOG" 2>&1 </dev/null &
disown
sleep 5
echo "pid: $(pgrep -f 'bridge/sp-overlay-bridge.py' | tr '\n' ' ')"
