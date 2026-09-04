#!/usr/bin/env bash
# SP+ LibreOffice / Office parity gate.
#
# Runs a real headless LibreOffice against a throwaway profile and asks it,
# through the UNO configuration and accelerator APIs, what it actually
# resolved. A passing XML parse is not evidence: an unrecognised key node
# name or a misspelled .uno: command parses perfectly and silently does
# nothing. This is the check that would catch that.
#
# Headless and non-GUI by construction. It never runs on the Beelink.
set -uo pipefail

# ...and until 2026-09-04 it did run on the Beelink, against a stock
# LibreOffice with none of the SP+ registry in it, where it reported 7 failing
# key bindings that were simply not installed. A parity gate has to be run
# where the parity lives. If the SP+ registry is not on this machine, the gate
# re-runs itself inside the SP+ image, which is where those .xcd files are.
SPPLUS_REGISTRY=/usr/lib64/libreoffice/share/registry/spplus-office-parity.xcd
if [ ! -f "$SPPLUS_REGISTRY" ] && [ -z "${SPPLUS_LO_IN_IMAGE:-}" ]; then
    HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if ! command -v podman >/dev/null 2>&1; then
        echo "SKIP not an SP+ system and no podman; Office parity was NOT checked"; exit 0
    fi
    IMAGE="${SPPLUS_IMAGE:-$(sudo -n podman images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' 2>/dev/null \
            | grep '^localhost/sp-plus-kde:' | sort -k2 -r | head -1 | awk '{print $1}')}"
    if [ -z "$IMAGE" ]; then
        echo "SKIP no localhost/sp-plus-kde image; Office parity was NOT checked"; exit 0
    fi
    echo "checking Office parity inside $IMAGE"
    exec timeout 900 sudo -n podman run --rm --network=none \
        -v "$HERE:/t:ro,z" -e SPPLUS_LO_IN_IMAGE=1 "$IMAGE" \
        bash /t/libreoffice-parity-gate.sh
fi

PORT="${SPPLUS_LO_PORT:-2083}"
PROFILE="${SPPLUS_LO_PROFILE:-/tmp/spplus-lo-gate-profile}"
PROBE="${SPPLUS_LO_PROBE:-$(dirname "$0")/libreoffice-parity-probe.py}"
LOG="${SPPLUS_LO_LOG:-/tmp/spplus-lo-gate.log}"

[ -f "$PROBE" ] || { echo "probe not found: $PROBE" >&2; exit 2; }

cleanup() {
    [ -n "${SOFFICE_PID:-}" ] && kill "$SOFFICE_PID" 2>/dev/null
    # soffice re-parents itself; match the port so no other instance is hit.
    pkill -f "port=${PORT};urp" 2>/dev/null
    return 0
}
trap cleanup EXIT

pkill -f "port=${PORT};urp" 2>/dev/null
rm -rf "$PROFILE"

soffice --headless --norestore --nologo --nodefault --invisible \
    --accept="socket,host=127.0.0.1,port=${PORT};urp;" \
    -env:UserInstallation="file://${PROFILE}" >"$LOG" 2>&1 &
SOFFICE_PID=$!

# Poll for the bridge rather than sleeping a fixed interval: on the Dell
# this takes several times longer than on a fast machine, and a fixed wait
# is either a flake or wasted time.
ready=""
for i in $(seq 1 90); do
    if python3 - "$PORT" <<'PYEOF' 2>/dev/null
import sys, uno
ctx = uno.getComponentContext()
r = ctx.ServiceManager.createInstanceWithContext(
    "com.sun.star.bridge.UnoUrlResolver", ctx)
r.resolve("uno:socket,host=127.0.0.1,port=%s;urp;StarOffice.ComponentContext"
          % sys.argv[1])
PYEOF
    then ready="$i"; break; fi
    sleep 1
done

if [ -z "$ready" ]; then
    echo "FAIL: LibreOffice did not accept a UNO connection on port ${PORT}" >&2
    echo "--- soffice log ---" >&2
    tail -20 "$LOG" >&2
    exit 1
fi
echo "soffice accepted UNO after ${ready}s"

python3 "$PROBE" "$PORT"
