#!/usr/bin/env bash
# SP+ WELCOME SERVICES GATE -- the Office connection ("Your Services").
#
# WHY THIS FILE EXISTS: welcome.py --self-test drives five bridge verbs and
# service-capabilities is not one of them. Everything an advisor sees on the
# Your Services screens -- ready, still provisioning, unavailable, the portal
# answering with a marketing page instead of the record, no network at all --
# rested on reading the code. On 2026-09-04 the endpoints happened to be
# healthy, which is exactly the condition under which an untested failure path
# stays invisible.
#
# WHAT IT DOES: runs the REAL fetch_service_capability against a real HTTP
# server bound to 127.0.0.1 inside the SP+ image, once per scenario. Nothing is
# mocked, so redirects, oversized bodies, refused connections and stalled
# responses arrive the way the network delivers them.
#
# Run:  tests/welcome-services-gate.sh [IMAGE]
#       IMAGE defaults to the newest localhost/sp-plus-kde tag.
# Exit 0 = every scenario behaves as the contract says.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPPLUS="$(dirname "$HERE")"
DRIVER="$HERE/welcome-services-driver.py"

echo "=== SP+ WELCOME SERVICES GATE ==="
[ -f "$DRIVER" ] || { echo "  FAIL driver missing: $DRIVER"; exit 2; }
[ -f "$SPPLUS/welcome/welcome.py" ] || { echo "  FAIL welcome.py missing"; exit 2; }

if ! command -v podman >/dev/null 2>&1; then
  echo "  SKIP podman not available; the services contract was NOT exercised"; exit 0
fi

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  IMAGE="$(sudo -n podman images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' 2>/dev/null \
           | grep '^localhost/sp-plus-kde:' | sort -k2 -r | head -1 | awk '{print $1}')"
fi
if [ -z "$IMAGE" ]; then
  echo "  SKIP no localhost/sp-plus-kde image present; the contract was NOT exercised"; exit 0
fi
echo "  image: $IMAGE"

run_driver() {  # $1 = host dir to mount as /w
  sudo -n podman run --rm --network=none \
    -e QT_QPA_PLATFORM=offscreen \
    -e SPPLUS_WELCOME_PY=/w/welcome/welcome.py \
    -v "$1":/w:ro \
    -v "$DRIVER":/driver.py:ro \
    "$IMAGE" python3 /driver.py 2>&1 | grep -vE 'libEGL|libva|^$'
  return "${PIPESTATUS[0]}"
}

OUT="$(run_driver "$SPPLUS")"; RC=$?
printf '%s\n' "$OUT" | sed 's/^/  /'

if printf '%s\n' "$OUT" | grep -q 'a password is required'; then
  echo "  SKIP rootful podman needs a password here; the contract was NOT exercised"; exit 0
fi
if [ "$RC" -ne 0 ]; then
  echo "  FAIL one or more service scenarios do not match the contract"
  echo "DO NOT SHIP."
  exit 1
fi

# ---- MUTATION TEST -------------------------------------------------------
# A gate is worth exactly what it catches. Copy welcome.py, break the status
# validation on the copy, and require the gate to notice. If a knowingly broken
# module still passes, the scenarios above proved nothing.
MUT="$(mktemp -d)"; trap 'rm -rf "$MUT"' EXIT
cp -a "$SPPLUS/welcome" "$MUT/welcome"
python3 - "$MUT/welcome/welcome.py" <<'PY'
import io, sys
p = sys.argv[1]
s = io.open(p, encoding='utf-8').read()
old = "    if status not in {'ready', 'provisioning', 'unavailable'}:"
new = "    if False:  # MUTATION: accept any status"
assert s.count(old) == 1, 'mutation site not found -- validate_capability changed shape'
io.open(p, 'w', encoding='utf-8').write(s.replace(old, new))
PY
[ $? -eq 0 ] || { echo "  FAIL could not build the mutant; the gate cannot prove itself"; exit 2; }

MOUT="$(run_driver "$MUT")"; MRC=$?
if [ "$MRC" -eq 0 ]; then
  echo "  FAIL mutation test: a welcome.py that accepts ANY status value still"
  echo "       passed every scenario. The gate is not testing what it claims."
  exit 2
fi
echo "  mutation test OK: a broken validate_capability is caught"

echo "  PASS the Office connection behaves as the contract says in every scenario"
