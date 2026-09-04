#!/usr/bin/env bash
# SP+ Help application gate.
#
# Starts the real help server against a throwaway profile and drives the real
# app in a real browser engine. Headless and offscreen by construction: it
# never opens a window on anyone's desktop.
#
# Fin is replaced by a test double unless SPPLUS_FIN says otherwise. The gate
# proves the round trip reaches Fin and comes back; whether the assistant
# gives a good answer is not something a build gate can decide.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${SPPLUS_HELP_APP_ROOT:-$HERE/../helpapp}"
DATA="${SPPLUS_HELP_DATA:-$HERE/../welcome/app/help-data.json}"
CORE="${SPPLUS_HELP_CORE:-$HERE/../welcome/app/help-core.js}"
PORT="${SPPLUS_HELP_PORT:-8766}"
PROBE="${SPPLUS_HELP_PROBE:-$HERE/help-app-probe.py}"
LOG="${SPPLUS_HELP_LOG:-/tmp/spplus-help-gate.log}"

for f in "$ROOT/server.py" "$DATA" "$CORE" "$PROBE"; do
    [ -e "$f" ] || { echo "missing: $f" >&2; exit 2; }
done

FIN="${SPPLUS_FIN:-}"
STUB=""
if [ -z "$FIN" ]; then
    STUB="$(mktemp -d)/fin-test-double"
    cat > "$STUB" <<'STUBEOF'
#!/usr/bin/bash
# TEST DOUBLE for Fin, used by the help gate. Deliberately labelled as one:
# it echoes the question back so the round trip can be proved, and it is not
# dressed up to look like a real assistant answer.
[ "${1:-}" = "--ask" ] || exit 1
echo "TEST FIXTURE FIN: received your question: ${2:-}"
STUBEOF
    chmod +x "$STUB"
    FIN="$STUB"
fi

cleanup() {
    [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
    [ -n "$STUB" ] && rm -rf "$(dirname "$STUB")"
    command -v we_cleanup >/dev/null 2>&1 && we_cleanup
    return 0
}
trap cleanup EXIT

SPPLUS_HELP_ROOT="$ROOT" SPPLUS_HELP_DATA="$DATA" SPPLUS_HELP_CORE="$CORE" \
SPPLUS_HELP_PORT="$PORT" SPPLUS_FIN="$FIN" \
    python3 "$ROOT/server.py" >"$LOG" 2>&1 &
SERVER_PID=$!

# Poll for the server rather than sleeping a fixed interval: the Dell is
# several times slower than a development machine, and a fixed wait is either
# a flake there or wasted time here.
ready=""
for i in $(seq 1 60); do
    if curl -fsS --max-time 2 -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null; then
        ready="$i"; break
    fi
    sleep 0.5
done
if [ -z "$ready" ]; then
    echo "FAIL: the help server never answered on port ${PORT}" >&2
    tail -20 "$LOG" >&2
    exit 1
fi

# The Fin round trip, through the same endpoint the app uses.
answer=$(curl -fsS --max-time 30 -X POST -H 'Content-Type: application/json' \
    -d '{"question":"gate round trip"}' "http://127.0.0.1:${PORT}/api/ask")
case "$answer" in
    *'"ok": true'*) ;;
    *) echo "FAIL: asking Fin did not succeed: $answer" >&2; exit 1 ;;
esac
echo "Fin round trip OK"

# An offline manual is the whole point of the pinned app, so the pieces that
# make it installable must actually be served.
for path in manifest.webmanifest sw.js icon.svg help-core.js help-data.json; do
    curl -fsS --max-time 5 -o /dev/null "http://127.0.0.1:${PORT}/${path}" \
        || { echo "FAIL: the app does not serve /${path}" >&2; exit 1; }
done
echo "installable assets OK"

# QtWebEngine is not installed outside the SP+ image, so the probe runs where it
# can import: this host if PySide6 is here, otherwise inside the image. The
# server it drives is the one this gate just started on 127.0.0.1, which is why
# this is the one place WE_NETWORK is not "none".
. "$HERE/lib/webengine.sh"
we_init; werc=$?
if [ $werc -eq 3 ]; then
    echo "SKIP the help app itself was NOT driven"; exit 0
elif [ $werc -ne 0 ]; then
    echo "FAIL could not set up a browser engine for the probe" >&2; exit 2
fi
we_where
WE_NETWORK=host
WE_ENV=( "SPPLUS_HELP_URL=http://127.0.0.1:${PORT}/" )
we_run 180 "$PROBE"
