#!/usr/bin/env bash
# SP+ printer helper: find, choose, add -- the contract the Welcome card needs.
#
# WHY THIS GATE EXISTS (2026-09-09). The printer card used to do one silent
# check and, finding no queue, tell the advisor to "open printer settings" --
# naming an application it never opened. Christopher: "Why do we not have a
# 'find printer button' then they select the printer(s) on the network and then
# test page, dont hide everything." The card now owns all three steps, and
# spplus-printer-control is the privileged half.
#
# The helper cannot be exercised against real hardware in CI, so CUPS is stubbed
# and the gate asserts the decisions the helper itself makes -- the ones that go
# wrong quietly:
#
#   1. lpinfo lists the BACKENDS as well as the printers ("network socket").
#      Offering those puts rows in the list that can never print.
#   2. A queue name with a space in it is rejected by CUPS, which the advisor
#      would read as "the printer did not work".
#   3. Adding a second printer of the same model must not replace the first.
#   4. A failure must come back as ok:false WITH the reason, not as a crash and
#      not as a cheerful ok:true.
#
# Every check below can fail: each one is asserted against output, and the
# stubs can produce the wrong answer.
set -uo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
HELPER=$ROOT/config/spplus-printer-control
[ -x "$HELPER" ] || { echo "PRINTER_CONTROL_FAIL: no executable helper at $HELPER" >&2; exit 1; }

SANDBOX=$(mktemp -d)
trap 'rm -rf "$SANDBOX"' EXIT
BIN=$SANDBOX/bin
mkdir -p "$BIN"

# --- the stub CUPS ----------------------------------------------------------
cat > "$BIN/lpinfo" <<'STUB'
#!/usr/bin/env bash
# Shaped exactly like `lpinfo -l -v`: real devices, and the backends themselves.
cat <<'OUT'
Device: uri = socket
        class = network
        info = Unknown
        make-and-model = Unknown
        device-id = 
        location = 
Device: uri = ipp://front-office.local/ipp/print
        class = network
        info = HP LaserJet 400 M401
        make-and-model = HP LaserJet 400 M401
        device-id = MFG:HP;MDL:LaserJet 400;
        location = Front office
Device: uri = usb://Brother/HL-L2350DW?serial=U63
        class = direct
        info = Brother HL-L2350DW
        make-and-model = Brother HL-L2350DW
        device-id = MFG:Brother;MDL:HL-L2350DW;
        location = 
OUT
STUB

cat > "$BIN/lpstat" <<'STUB'
#!/usr/bin/env bash
# -p NAME asks whether one queue exists; the helper uses it to avoid colliding.
if [ "${1:-}" = "-p" ] && [ -n "${2:-}" ]; then
    [ -e "$SPPLUS_GATE_QUEUES/$2" ] && exit 0
    exit 1
fi
if [ "${1:-}" = "-v" ]; then
    for q in "$SPPLUS_GATE_QUEUES"/*; do
        [ -e "$q" ] || continue
        printf 'device for %s: %s\n' "$(basename "$q")" "$(cat "$q")"
    done
    exit 0
fi
if [ "${1:-}" = "-d" ]; then
    if [ -e "$SPPLUS_GATE_QUEUES/.default" ]; then
        printf 'system default destination: %s\n' "$(cat "$SPPLUS_GATE_QUEUES/.default")"
    else
        printf 'no system default destination\n'
    fi
    exit 0
fi
exit 0
STUB

cat > "$BIN/lpadmin" <<'STUB'
#!/usr/bin/env bash
# -d NAME sets the default. -p NAME -E -v URI -m MODEL creates a queue, and
# fails the way CUPS does when SPPLUS_GATE_ADD_FAILS is set.
if [ "${1:-}" = "-d" ]; then printf '%s' "${2:-}" > "$SPPLUS_GATE_QUEUES/.default"; exit 0; fi
name=""; uri=""
while [ $# -gt 0 ]; do
    case "$1" in
        -p) name=$2; shift 2;;
        -v) uri=$2; shift 2;;
        -m) shift 2;;
        *) shift;;
    esac
done
if [ -n "${SPPLUS_GATE_ADD_FAILS:-}" ]; then
    echo "lpadmin: Printer drivers are deprecated" >&2
    echo "lpadmin: Unable to connect to the printer." >&2
    exit 1
fi
printf '%s' "$uri" > "$SPPLUS_GATE_QUEUES/$name"
STUB

printf '#!/usr/bin/env bash\nexit 0\n' > "$BIN/cupsenable"
printf '#!/usr/bin/env bash\nexit 0\n' > "$BIN/cupsaccept"
chmod +x "$BIN"/*

export SPPLUS_GATE_QUEUES=$SANDBOX/queues
mkdir -p "$SPPLUS_GATE_QUEUES"
export PATH=$BIN:$PATH

fail=0
say_fail() { echo "PRINTER_CONTROL_FAIL: $1" >&2; fail=1; }

json() { python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)))' 2>/dev/null; }
field() { python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get(sys.argv[1])))' "$1" 2>/dev/null; }

# --- 1. discover: real printers only, sanitised names ------------------------
found=$("$HELPER" discover)
if ! printf '%s' "$found" | json >/dev/null; then
    say_fail "discover did not print one JSON object: $found"
else
    uris=$(printf '%s' "$found" | python3 -c 'import json,sys; print(" ".join(p["uri"] for p in json.load(sys.stdin)["printers"]))')
    names=$(printf '%s' "$found" | python3 -c 'import json,sys; print(" ".join(p["name"] for p in json.load(sys.stdin)["printers"]))')
    case "$uris" in
        *"ipp://front-office.local/ipp/print"*) ;;
        *) say_fail "discover dropped the network printer: $uris";;
    esac
    if printf '%s' "$found" | python3 -c 'import json,sys; raise SystemExit(0 if any("://" not in p["uri"] for p in json.load(sys.stdin)["printers"]) else 1)'; then
        say_fail "discover offered a CUPS backend as if it were a printer: $uris"
    fi
    if printf '%s' "$names" | grep -qE '[^A-Za-z0-9_ -]'; then
        say_fail "discover produced a queue name CUPS will reject: $names"
    fi
    # Network before USB: the advisor came here for the one down the hall.
    first=$(printf '%s' "$found" | python3 -c 'import json,sys; print(json.load(sys.stdin)["printers"][0]["kind"])')
    [ "$first" = network ] || say_fail "discover did not put network printers first (first was '$first')"
    echo "PRINTER_DISCOVER_OK: $names"
fi

# --- 2. add: creates the queue and makes it the default ----------------------
added=$("$HELPER" add 'ipp://front-office.local/ipp/print' 'HP-LaserJet-400-M401')
name1=$(printf '%s' "$added" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["name"] if d.get("ok") else "")')
if [ -z "$name1" ]; then
    say_fail "add refused a good printer: $added"
else
    [ -e "$SPPLUS_GATE_QUEUES/$name1" ] || say_fail "add reported success but created no queue"
    [ "$(cat "$SPPLUS_GATE_QUEUES/.default" 2>/dev/null)" = "$name1" ] || say_fail "add did not make the new printer the default"
    echo "PRINTER_ADD_OK: $name1"
fi

# --- 3. a second printer of the same model must not replace the first --------
again=$("$HELPER" add 'ipp://back-office.local/ipp/print' 'HP-LaserJet-400-M401')
name2=$(printf '%s' "$again" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["name"] if d.get("ok") else "")')
if [ -z "$name2" ]; then
    say_fail "add refused the second printer: $again"
elif [ "$name2" = "$name1" ]; then
    say_fail "the second printer reused the first one's queue name ($name2)"
else
    [ -e "$SPPLUS_GATE_QUEUES/$name1" ] || say_fail "adding the second printer destroyed the first"
    echo "PRINTER_ADD_SECOND_OK: $name2"
fi

# --- 4. list: reports what exists, and which one is the default --------------
listed=$("$HELPER" list)
if printf '%s' "$listed" | python3 -c 'import json,sys; d=json.load(sys.stdin); raise SystemExit(0 if d.get("ok") and len(d.get("queues") or [])==2 and d.get("default") else 1)'; then
    echo "PRINTER_LIST_OK: $(printf '%s' "$listed" | field default)"
else
    say_fail "list did not report both queues and a default: $listed"
fi

# --- 5. a failure is reported as a failure, with the reason ------------------
SPPLUS_GATE_ADD_FAILS=1 "$HELPER" add 'ipp://nothing.local/ipp/print' 'Nothing' > "$SANDBOX/refused" 2>/dev/null
if python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); raise SystemExit(0 if d.get("ok") is False and "Unable to connect" in (d.get("reason") or "") else 1)' "$SANDBOX/refused"; then
    echo "PRINTER_ADD_FAILURE_OK: the reason CUPS gave is passed through"
else
    say_fail "a failed add was not reported honestly: $(cat "$SANDBOX/refused")"
fi

# --- 6. a made-up address is refused before it reaches lpadmin ---------------
if "$HELPER" add 'not-a-printer' 'X' | python3 -c 'import json,sys; raise SystemExit(0 if json.load(sys.stdin).get("ok") is False else 1)'; then
    echo "PRINTER_ADD_GUARD_OK: an address with no scheme is refused"
else
    say_fail "add accepted an address that is not a device URI"
fi

[ "$fail" = 0 ] || exit 1
echo 'PRINTER_CONTROL_OK: 6/6'
