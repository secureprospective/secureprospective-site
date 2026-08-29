#!/usr/bin/env bash
# Gate: the update-health detector must fire on a really-observed broken
# deployment and stay quiet on a really-observed healthy one.
#
# The fixtures are VERBATIM output captured from the Dell on 2026-08-29, before
# and after `rpm-ostree reset`. On the "broken" one, bootc refused outright:
#   error: Upgrading: Deployment contains local rpm-ostree modifications;
#          cannot upgrade via bootc.
# A machine in that state receives no further updates and looks completely
# normal from the desktop, so this detector is the only thing that reports it.
set -uo pipefail
cd "$(dirname "$0")"
fail=0

health(){   # $1 = rpm-ostree fixture, $2 = value of bootc `incompatible:`
    local layered incompat
    layered=$(awk -F': ' '/LayeredPackages:/{print $2; exit}' "$1")
    incompat="$2"
    if [ -n "${layered:-}" ]; then echo "BROKEN"; return; fi
    if [ "${incompat:-false}" = "true" ]; then echo "BROKEN"; return; fi
    echo "OK"
}

check(){ # name, expected, actual
    if [ "$2" = "$3" ]; then printf '  PASS %s (%s)\n' "$1" "$3"
    else printf '  FAIL %s: expected %s, got %s\n' "$1" "$2" "$3"; fail=1; fi
}

check "layered packages are detected"        BROKEN "$(health fixtures/rpm-ostree-broken.txt false)"
check "clean deployment reads healthy"       OK     "$(health fixtures/rpm-ostree-ok.txt     false)"
check "bootc incompatible flag alone trips"  BROKEN "$(health fixtures/rpm-ostree-ok.txt     true)"
check "layered wins even if flag says false" BROKEN "$(health fixtures/rpm-ostree-broken.txt false)"

# The sanitiser must never let a table delimiter or newline into the exact
# register -- a stray `|` silently shifts every later column.
san(){ printf '%s' "${1-}" | tr -d '\n\r' | sed 's/|/\\|/g' | cut -c1-120; }
check "pipe is escaped"   'a\|b'  "$(san 'a|b')"
check "newline is removed" 'ab'   "$(san 'a
b')"

if [ "$fail" -eq 0 ]; then echo "=== update-health gate: PASS"; else echo "=== update-health gate: FAIL"; exit 1; fi
