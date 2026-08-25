#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
PORT=${ADVISOR_TEST_PORT:-18765}
STATE_DIR=$(mktemp -d)
trap 'kill "$PID" 2>/dev/null || true; rm -rf "$STATE_DIR"' EXIT
ADVISOR_STATE_DIR="$STATE_DIR" ADVISOR_OS_ROOT="$ROOT" ADVISOR_LISTEN_PORT="$PORT" \
  python3 runtime/advisor_rpc.py >/tmp/advisor-os-rpc.log 2>&1 &
PID=$!
ready=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then ready=1; break; fi
  sleep .1
done
[[ $ready -eq 1 ]] || { cat /tmp/advisor-os-rpc.log >&2; exit 1; }
curl -fsS "http://127.0.0.1:$PORT/api/health" | grep -q '"ok": true'
curl -fsS -X POST -H 'Content-Type: application/json' -d '{"method":"diagnose_printer"}' "http://127.0.0.1:$PORT/api/rpc" | grep -q 'sanitized_request'
printf 'RPC smoke test passed.\n'
