#!/usr/bin/bash
# SP+ runtime posture gate — assert the SECURITY CONTROLS THAT ARE IN EFFECT on a
# booted machine, not the config text that was supposed to produce them.
#
# WHY THIS EXISTS. The 2026-09-03 pre-release audit found smbd listening on
# 0.0.0.0:445 with a read-write [homes] share on a machine whose build gate had
# reported WSDD_OK on every single build. The gate did this:
#
#     grep -q '^BindsTo=$' /usr/lib/systemd/system/wsdd.service.d/sp-plus.conf
#
# The file said what we wanted. The system did something else -- `systemctl show
# wsdd.service -p BindsTo` returned `BindsTo=smb.service`, and smb.service ran
# while reading `disabled`. A gate that greps the source of a control can only
# prove someone WROTE the control, never that it TOOK EFFECT.
#
# Everything below is measured over SSH against a real install.
#
# Usage:  tests/runtime-posture-gate.sh [ssh-target] [ssh-port] [identity]
# Default target is the spplus-test VM as built by fleet/bin/spplus-testvm.sh.
#
# Exit 0 = every assertion passed. Exit 1 = at least one control is not in
# effect. The failing assertions are printed with what was measured.
set -uo pipefail

TARGET="${1:-test@127.0.0.1}"
PORT="${2:-2222}"
IDENT="${3:-$HOME/.ssh/spvm}"

SSH=(ssh -n -o BatchMode=yes -o StrictHostKeyChecking=no
     -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10
     -i "$IDENT" -p "$PORT" "$TARGET")

FAIL=0
PASS=0

# say <PASS|FAIL> <name> <measured>
record() {
    if [ "$1" = PASS ]; then
        PASS=$((PASS + 1)); printf '  PASS  %-38s %s\n' "$2" "$3"
    else
        FAIL=$((FAIL + 1)); printf '  FAIL  %-38s %s\n' "$2" "$3"
    fi
}

remote() { "${SSH[@]}" "$*" 2>/dev/null; }

echo "SP+ runtime posture gate — $TARGET:$PORT"
if ! remote true; then
    echo "UNREACHABLE: cannot ssh to $TARGET:$PORT with $IDENT."
    echo "That is a harness problem, not a pass. Exiting non-zero."
    exit 2
fi
echo

# ---------------------------------------------------------------- listening set
# The single most valuable assertion here: what is this machine ANSWERING on.
listening="$(remote "ss -tulpnH 2>/dev/null | awk '{print \$1, \$5}'")"

for hostile in ':139' ':445' ':1716' ':5357'; do
    if printf '%s\n' "$listening" | grep -q "0\.0\.0\.0${hostile}\|\*${hostile}\|\[::\]${hostile}"; then
        record FAIL "no world-listener on ${hostile#:}" "$(printf '%s\n' "$listening" | grep "${hostile}" | tr '\n' ' ')"
    else
        record PASS "no world-listener on ${hostile#:}" "absent"
    fi
done

# The help app must stay on loopback. It is the one service SP+ adds itself.
help_bind="$(printf '%s\n' "$listening" | grep -E ':(8765|8766)' | tr '\n' ' ')"
if printf '%s\n' "$help_bind" | grep -q '0\.0\.0\.0\|\[::\]'; then
    record FAIL "help app is loopback-only" "$help_bind"
else
    record PASS "help app is loopback-only" "${help_bind:-not running}"
fi

# ------------------------------------------------------------------- smb / nmb
for u in smb nmb; do
    st="$(remote "systemctl is-enabled $u.service 2>&1")"
    [ "$st" = masked ] && record PASS "$u.service masked" "$st" \
                       || record FAIL "$u.service masked" "${st:-<empty>}"
    act="$(remote "systemctl is-active $u.service 2>&1")"
    [ "$act" = active ] && record FAIL "$u.service not running" "$act" \
                        || record PASS "$u.service not running" "$act"
done

# ---------------------------------------------------------------------- wsdd
# The property that the old text gate believed it was testing.
binds="$(remote "systemctl show wsdd.service -p BindsTo --value 2>&1")"
[ -z "$binds" ] && record PASS "wsdd BindsTo cleared" "<empty>" \
                || record FAIL "wsdd BindsTo cleared" "$binds"

# ------------------------------------------------------------------- firewall
zone="$(remote "sudo firewall-cmd --get-default-zone 2>&1")"
[ "$zone" = public ] && record PASS "firewall default zone" "$zone" \
                     || record FAIL "firewall default zone" "$zone"

ports="$(remote "sudo firewall-cmd --list-ports 2>&1")"
if printf '%s' "$ports" | grep -q '1025-65535'; then
    record FAIL "high port range closed" "$ports"
else
    record PASS "high port range closed" "${ports:-none}"
fi

# --------------------------------------------------------------- kde connect
kdc="$(remote "pgrep -c kdeconnectd 2>/dev/null || echo 0")"
[ "$kdc" = 0 ] && record PASS "kdeconnectd not running" "0 processes" \
               || record FAIL "kdeconnectd not running" "$kdc processes"

dbusfile="$(remote "ls /usr/share/dbus-1/services/ 2>/dev/null | grep -ci kdeconnect || echo 0")"
[ "$dbusfile" = 0 ] && record PASS "no kdeconnect D-Bus activation" "0 files" \
                    || record FAIL "no kdeconnect D-Bus activation" "$dbusfile files"

# ------------------------------------------------------------------- selinux
enf="$(remote "getenforce 2>&1")"
[ "$enf" = Enforcing ] && record PASS "selinux enforcing" "$enf" \
                       || record FAIL "selinux enforcing" "$enf"

# ---------------------------------------------------------------------- sshd
# `sshd -T` prints the EFFECTIVE config after every drop-in is merged, which is
# the whole point -- drop-in ordering is exactly what silently goes wrong.
sshd_eff="$(remote "sudo sshd -T 2>/dev/null")"
for kv in "passwordauthentication no" "permitrootlogin no" "kbdinteractiveauthentication no"; do
    key="${kv%% *}"
    got="$(printf '%s\n' "$sshd_eff" | grep -i "^$key " | head -1)"
    [ "$(printf '%s' "$got" | tr 'A-Z' 'a-z')" = "$kv" ] \
        && record PASS "sshd $kv" "$got" \
        || record FAIL "sshd $kv" "${got:-<not set>}"
done

echo
echo "passed=$PASS failed=$FAIL"
if [ "$FAIL" -gt 0 ]; then
    echo "POSTURE GATE FAILED — a control that the build believes it applied is not in effect."
    exit 1
fi
echo "RUNTIME_POSTURE_OK all $PASS controls measured in effect"
