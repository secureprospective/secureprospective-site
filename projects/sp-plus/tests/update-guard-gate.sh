#!/usr/bin/bash
# SP+ gate — the update helper must never call an older image an update.
#
# WHY THIS GATE EXISTS. On 2026-09-01 the advisor's Discover store offered a
# system update, and installing it failed with:
#
#   error: While checking against deployment timestamp: Upgrade target revision
#   ... is chronologically older than current revision ...; use
#   --allow-downgrade to permit
#
# The cause was that the registry tag held an image OLDER than the one the ISO
# installs, and Discover treated "the digest differs" as "an update exists".
# spplus-update-control decides on TIMESTAMPS instead. This gate holds that
# behaviour still, because it is the one property that keeps the advisor from
# being offered something the machine will then refuse.
#
# It uses the helper's `simulate` seam, which runs the real decide() against a
# supplied state. The registry-is-behind case cannot be produced on demand
# against a live registry, so simulating it is the only way to test it at all.
set -uo pipefail

HELPER=${SPPLUS_UPDATE_CONTROL:-/usr/libexec/spplus-update-control}
fails=0

BOOTED='{"digest":"sha256:aaa","version":"1","timestamp":"2026-09-01T21:31:12Z"}'
OLDER='{"digest":"sha256:bbb","version":"1","timestamp":"2026-09-01T11:22:43Z"}'
NEWER='{"digest":"sha256:ccc","version":"1","timestamp":"2026-09-02T08:00:00Z"}'
SAME='{"digest":"sha256:aaa","version":"1","timestamp":"2026-09-01T21:31:12Z"}'

field() {
    printf '%s' "$1" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get(sys.argv[1], ""))
except Exception: print("<unparseable>")' "$2"
}

expect_state() {
    local label=$1 state=$2 want=$3 got
    got=$(field "$state" state)
    if [ "$got" = "$want" ]; then
        echo "  ok   $label -> $got"
    else
        echo "  FAIL $label -> got '$got', want '$want'" >&2
        fails=$((fails + 1))
    fi
}

run() { "$HELPER" simulate "{\"booted\":$BOOTED,\"staged\":$1,\"cached\":$2}"; }

echo "update-guard-gate: $HELPER"

# 1. THE REGRESSION. Registry behind the machine must read as up to date.
out=$(run '{}' "$OLDER")
expect_state "registry older than machine" "$out" current
if printf '%s' "$out" | grep -q '"note"'; then
    echo "  ok   older-registry case is explained in a note"
else
    echo "  FAIL older-registry case carries no explanatory note" >&2
    fails=$((fails + 1))
fi

# 2. A genuinely newer image is still offered -- the guard must not be a wall.
expect_state "registry newer than machine" "$(run '{}' "$NEWER")" available

# 3. Something already downloaded is reported as ready to restart into.
expect_state "update already staged" "$(run "$NEWER" "$NEWER")" staged

# 4. Same digest, and no cachedUpdate at all, are both "current".
expect_state "identical digest" "$(run '{}' "$SAME")" current
expect_state "no cached update" "$(run '{}' '{}')" current

# 5. staged wins over everything: a staged update is never re-offered as new.
expect_state "staged outranks available" "$(run "$NEWER" "$OLDER")" staged

# 6. Every answer must be a single parseable JSON object carrying ok+state+reason.
for probe in "$(run '{}' "$OLDER")" "$(run '{}' "$NEWER")" "$(run "$NEWER" "$NEWER")"; do
    if ! printf '%s' "$probe" | python3 -c 'import json,sys
d=json.load(sys.stdin)
assert isinstance(d, dict), "not an object"
for k in ("ok","state","reason"): assert k in d, "missing "+k
' 2>/dev/null; then
        echo "  FAIL a response was not a JSON object with ok/state/reason" >&2
        fails=$((fails + 1))
    fi
done

# 7. The guard must be decided on timestamps, not on digest inequality alone.
#    Sharing a digest comparison but differing timestamps is covered above; this
#    asserts the source has not quietly reverted to a digest-only test.
if grep -q 'ct <= bt' "$HELPER"; then
    echo "  ok   timestamp comparison present in source"
else
    echo "  FAIL the timestamp comparison is gone from $HELPER" >&2
    fails=$((fails + 1))
fi

if [ "$fails" -eq 0 ]; then
    echo "UPDATE_GUARD_GATE_OK an older image is never offered as an update"
    exit 0
fi
echo "UPDATE_GUARD_GATE_FAIL $fails check(s) failed" >&2
exit 1
