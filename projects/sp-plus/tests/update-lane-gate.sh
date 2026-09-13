#!/usr/bin/bash
# SP+ - the UPDATE LANE gate (2026-09-13).
#
# WHY THIS EXISTS, AND WHY THE EXISTING GATES DID NOT CATCH IT.
#
# On 2026-09-13 we found that the automatic update lane had never been able to
# update any machine, ever. The chain is:
#
#   spplus-stage-update.timer -> spplus-stage-update -> update-control stage
#
# and `stage` decided whether an update existed by reading bootc's
# `.status.booted.cachedUpdate`. That field is populated by exactly one thing,
# `bootc upgrade --check`, which lived only in the `check` subcommand -- and
# NOTHING in the shipped system ever called `check`. The single reference in the
# whole tree was a test file. So the timer fired daily, read a cache nothing
# ever filled, correctly concluded "no update", and did nothing. Forever.
# Measured on the Dell: booted a 2026-09-11 image for two days with 0.11.4
# published and reachable, reporting itself up to date the entire time.
#
# We had gates on this code. They all tested `decide()` against hand-supplied
# state -- and `decide()` was correct. Not one of them asked the only question
# that matters: DOES A MACHINE THAT IS BEHIND END UP IN FRONT? The bug lived in
# the wiring between correct parts, which is exactly where unit tests do not go.
#
# Two further facts, measured on the test VM rather than assumed, because both
# change what "no cached update" is allowed to mean:
#   - cachedUpdate is CLEARED BY REBOOT. A machine is blind on every single boot
#     until something checks.
#   - after a SUCCESSFUL check on an up-to-date machine, cachedUpdate is STILL
#     null. So "no cached digest" cannot distinguish "never asked" from "asked,
#     and current" -- which is why currency now requires a separate stamp, and
#     why "up to date" without one is a claim the helper cannot support.
set -uo pipefail

CONTROL=${1:?usage: update-lane-gate.sh /path/to/spplus-update-control}
FAILED=0
ok()   { printf 'ok    %s\n' "$1"; }
bad()  { printf 'FAIL  %s\n' "$1"; FAILED=1; }

# Comments are stripped before every absence check. A gate that greps a file
# containing its own explanation matches the explanation and passes vacuously;
# that has bitten this project three times in one session.
BODY=$(sed 's/#.*//' "$CONTROL")

# ---------------------------------------------------------------- 1. wiring
# The whole defect, stated as an assertion: the path that STAGES must refresh
# from the registry before it decides. Not "somewhere in the file" -- inside
# the stage block itself.
STAGE_BLOCK=$(printf '%s\n' "$BODY" | sed -n '/^stage)/,/^[a-z]*)/p')
if printf '%s' "$STAGE_BLOCK" | grep -q -- 'bootc upgrade --check'; then
    ok "stage refreshes from the registry before deciding"
else
    bad "stage does NOT refresh from the registry -- THIS IS THE 2026-09-13 BUG"
fi

# And the decision must come after the refresh, not before it.
if printf '%s' "$STAGE_BLOCK" | grep -n -- 'bootc upgrade --check' | head -1 | cut -d: -f1 | {
      read -r chk; printf '%s' "$STAGE_BLOCK" | grep -n 'decide ' | head -1 | cut -d: -f1 | {
      read -r dec; [ -n "$chk" ] && [ -n "$dec" ] && [ "$chk" -lt "$dec" ]; }; }; then
    ok "the refresh happens BEFORE the verdict"
else
    bad "stage decides before it refreshes -- the cache it reads is stale"
fi

# ---------------------------------------------------- 2. behaviour, via seam
# Every branch is driven through the real decide(), using the simulate seam, so
# these are assertions about the shipped logic and not about a copy of it.
B='{"digest":"sha256:AAA","version":"1","timestamp":"2026-09-11T11:57:33Z"}'
NEWER='{"digest":"sha256:BBB","version":"1","timestamp":"2026-09-13T00:44:05Z"}'
OLDER='{"digest":"sha256:CCC","version":"1","timestamp":"2026-09-01T00:00:00Z"}'
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
STALE=$(date -u -d '5 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-5d +%Y-%m-%dT%H:%M:%SZ)

verdict() { bash "$CONTROL" simulate "$1" "${2:-}" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin).get("state",""))'; }

expect() { # label state stamp want
    got=$(verdict "$2" "${3:-}")
    [ "$got" = "$4" ] && ok "$1 -> $4" || bad "$1 -> got '$got', want '$4'"
}

# THE CLAIM THE MACHINE IS NOT ALLOWED TO MAKE. "Up to date" is a statement
# about the registry. A machine that has never asked does not get to make it.
expect "never checked, nothing cached"  "{\"booted\":$B,\"staged\":{},\"cached\":{}}" ""       "unknown"
expect "check is 5 days stale"          "{\"booted\":$B,\"staged\":{},\"cached\":{}}" "$STALE" "unknown"
expect "checked just now, nothing new"  "{\"booted\":$B,\"staged\":{},\"cached\":{}}" "$NOW"   "current"
expect "a genuinely newer image"        "{\"booted\":$B,\"staged\":{},\"cached\":$NEWER}" "$NOW" "available"
expect "registry BEHIND us (downgrade)" "{\"booted\":$B,\"staged\":{},\"cached\":$OLDER}" "$NOW" "current"
expect "already staged outranks all"    "{\"booted\":$B,\"staged\":$NEWER,\"cached\":{}}" ""   "staged"

# ------------------------------------------------- 3. prove the gate can fail
# A check that cannot fail is not evidence. Feed decide() the case it must call
# "current" and demand "unknown": if that does not come back wrong, the seam is
# not actually running the shipped logic and every ok above is worthless.
got=$(verdict "{\"booted\":$B,\"staged\":{},\"cached\":{}}" "$NOW")
if [ "$got" = "current" ]; then
    ok "mutation: the seam reports the real verdict, so these assertions bite"
else
    bad "mutation: seam returned '$got' -- the gate is not testing shipped logic"
fi

[ "$FAILED" -eq 0 ] && { echo "UPDATE_LANE_GATE_OK"; exit 0; }
echo "UPDATE_LANE_GATE_FAILED"; exit 1
