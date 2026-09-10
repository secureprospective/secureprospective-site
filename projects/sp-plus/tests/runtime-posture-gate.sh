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
    if [ "$st" = masked ]; then record PASS "$u.service masked" "$st"
    else record FAIL "$u.service masked" "${st:-<empty>}"; fi
    act="$(remote "systemctl is-active $u.service 2>&1")"
    if [ "$act" = active ]; then record FAIL "$u.service not running" "$act"
    else record PASS "$u.service not running" "$act"; fi
done

# ---------------------------------------------------------------------- wsdd
# The property that the old text gate believed it was testing.
binds="$(remote "systemctl show wsdd.service -p BindsTo --value 2>&1")"
wact="$(remote "systemctl is-active wsdd.service 2>&1")"
wport="$(remote "ss -tulnH 2>/dev/null | grep -c ':5357' || true" | tail -1)"
wport="${wport:-0}"
if [ "$wact" != active ] && [ "$wport" = 0 ]; then
    record PASS "no WSD responder" "wsdd $wact, 0 sockets on 5357 (BindsTo=${binds:-<empty>})"
else
    record FAIL "no WSD responder" "wsdd $wact, $wport sockets on 5357"
fi

# ------------------------------------------------------------------- firewall
zone="$(remote "sudo firewall-cmd --get-default-zone 2>&1")"
if [ "$zone" = public ]; then record PASS "firewall default zone" "$zone"
else record FAIL "firewall default zone" "$zone"; fi

ports="$(remote "sudo firewall-cmd --list-ports 2>&1")"
if printf '%s' "$ports" | grep -q '1025-65535'; then
    record FAIL "high port range closed" "$ports"
else
    record PASS "high port range closed" "${ports:-none}"
fi

# --------------------------------------------------------------- kde connect
kdc="$(remote "pgrep -c kdeconnectd 2>/dev/null || true" | tail -1)"
kdc="${kdc:-0}"
if [ "$kdc" = 0 ]; then record PASS "kdeconnectd not running" "0 processes"
else record FAIL "kdeconnectd not running" "$kdc processes"; fi

dbusfile="$(remote "ls /usr/share/dbus-1/services/ 2>/dev/null | grep -ci kdeconnect || true" | tail -1)"
dbusfile="${dbusfile:-0}"
if [ "$dbusfile" = 0 ]; then record PASS "no kdeconnect D-Bus activation" "0 files"
else record FAIL "no kdeconnect D-Bus activation" "$dbusfile files"; fi

# ------------------------------------------------------------------- selinux
enf="$(remote "getenforce 2>&1")"
if [ "$enf" = Enforcing ]; then record PASS "selinux enforcing" "$enf"
else record FAIL "selinux enforcing" "$enf"; fi

# ---------------------------------------------------------------------- sshd
# `sshd -T` prints the EFFECTIVE config after every drop-in is merged, which is
# the whole point -- drop-in ordering is exactly what silently goes wrong.
sshd_eff="$(remote "sudo sshd -T 2>/dev/null")"
for kv in "passwordauthentication no" "permitrootlogin no" "kbdinteractiveauthentication no"; do
    key="${kv%% *}"
    got="$(printf '%s\n' "$sshd_eff" | grep -i "^$key " | head -1)"
    if [ "$(printf '%s' "$got" | tr 'A-Z' 'a-z')" = "$kv" ]; then
        record PASS "sshd $kv" "$got"
    else
        record FAIL "sshd $kv" "${got:-<not set>}"
    fi
done

# ------------------------------------------------------- boot chain (Phase 0)
# These four are downstream of the FIRMWARE, not of anything SP+ builds. They
# read as failures on a VM with no Secure Boot, which is what the test lane gave
# us until 2026-09-10 -- `lockdown=[none]` and `sig_enforce=N` were artefacts of
# the harness and were repeatedly mistaken for product defects. Asserting them
# here means the harness can no longer lie by omission: a lane that cannot boot
# securely now fails loudly instead of quietly measuring nothing.
sb="$(remote "sudo mokutil --sb-state 2>&1 | head -1")"
if printf '%s' "$sb" | grep -qi 'SecureBoot enabled'; then record PASS "secure boot enabled" "$sb"
else record FAIL "secure boot enabled" "${sb:-<no state>}"; fi

lock="$(remote "cat /sys/kernel/security/lockdown 2>/dev/null")"
if printf '%s' "$lock" | grep -q '\[integrity\]\|\[confidentiality\]'; then record PASS "kernel lockdown active" "$lock"
else record FAIL "kernel lockdown active" "${lock:-<absent>}"; fi

sigenf="$(remote "cat /sys/module/module/parameters/sig_enforce 2>/dev/null")"
if [ "$sigenf" = Y ]; then record PASS "module signature enforced" "sig_enforce=$sigenf"
else record FAIL "module signature enforced" "sig_enforce=${sigenf:-<absent>}"; fi

tpmv="$(remote "cat /sys/class/tpm/tpm0/tpm_version_major 2>/dev/null")"
if [ "$tpmv" = 2 ]; then record PASS "tpm 2.0 present" "tpm0 version $tpmv"
else record FAIL "tpm 2.0 present" "${tpmv:-<no tpm0>}"; fi

# ------------------------------------------------------------ Tier 1 (2026-09-10)
# Every one of these is measured as an EFFECT on the running kernel or the
# running service manager. None of them greps the file that was supposed to
# produce it -- see the WSDD note at the top of this file for why.
#
# NOT asserted here, deliberately: sshd shipping disabled (D47). The QA
# kickstart re-enables sshd so that this very gate can connect, so a runtime
# assertion in this lane would measure the harness, not the image. It stays a
# build-time gate in the Containerfile.

# sysctls: key, expected value, human name
while IFS='|' read -r key want name; do
    [ -n "$key" ] || continue
    got="$(remote "sudo sysctl -n $key 2>/dev/null" | tr -d '\r')"
    if [ "$got" = "$want" ]; then record PASS "$name" "$key=$got"
    else record FAIL "$name" "$key=${got:-<absent>} want $want"; fi
done <<'SYSCTLS'
kernel.yama.ptrace_scope|1|ptrace scope restricted
kernel.kptr_restrict|2|kernel pointers hidden
kernel.dmesg_restrict|1|dmesg restricted
kernel.perf_event_paranoid|3|perf events restricted
kernel.kexec_load_disabled|1|kexec load disabled
kernel.unprivileged_bpf_disabled|1|unprivileged bpf disabled
net.core.bpf_jit_harden|2|bpf jit hardened
fs.suid_dumpable|0|suid dumps disabled
fs.protected_symlinks|1|protected symlinks
fs.protected_hardlinks|1|protected hardlinks
kernel.sysrq|0|sysrq disabled
vm.unprivileged_userfaultfd|0|unprivileged userfaultfd off
SYSCTLS

# core_pattern is a string, not a number, so it does not fit the loop above.
cp_="$(remote "sudo sysctl -n kernel.core_pattern 2>/dev/null" | tr -d '\r')"
if [ "$cp_" = '|/bin/false' ]; then record PASS "core dumps discarded" "core_pattern=$cp_"
else record FAIL "core dumps discarded" "core_pattern=${cp_:-<absent>}"; fi

# The limits.d drop-in is only real if a login shell inherits a zero hard limit.
hardcore="$(remote "bash -lc 'ulimit -Hc'" | tr -d '\r')"
if [ "$hardcore" = 0 ]; then record PASS "core rlimit zero in login shell" "ulimit -Hc = $hardcore"
else record FAIL "core rlimit zero in login shell" "ulimit -Hc = ${hardcore:-<unknown>}"; fi

# Identity services SP+ does not use. Masked, not merely disabled: masking is the
# state that survives a package deciding to enable itself on upgrade.
for unit in systemd-homed.service systemd-homed-activate.service sssd.service sssd-kcm.socket; do
    st="$(remote "systemctl is-enabled $unit 2>&1" | head -1 | tr -d '\r')"
    if [ "$st" = masked ]; then record PASS "$unit masked" "$st"
    else record FAIL "$unit masked" "${st:-<unknown>}"; fi
done

# Hypervisor guest agents. Both shipped setuid-root helpers and neither has any
# role on an advisor laptop. Their absence is measured on the filesystem.
for f in /usr/bin/vmware-user-suid-wrapper /usr/bin/qemu-ga; do
    if [ "$(remote "test -e $f && echo present || echo absent" | tr -d '\r')" = absent ]; then
        record PASS "guest agent absent $(basename "$f")" "$f not installed"
    else
        record FAIL "guest agent absent $(basename "$f")" "$f still present"
    fi
done

# SP+'s own unit is the one place upstream cannot break the sandboxing under us.
# systemd-analyze scores 0.0 (perfect) to 10.0 (no sandboxing at all).
sec="$(remote "systemd-analyze security sp-plus.service --no-pager 2>/dev/null | grep -i 'Overall exposure level'" | tr -d '\r')"
score="$(printf '%s' "$sec" | grep -oE '[0-9]+\.[0-9]+' | head -1)"
if [ -n "$score" ] && awk -v s="$score" 'BEGIN{exit !(s < 5.0)}'; then
    record PASS "sp-plus.service sandboxed" "exposure $score < 5.0"
else
    record FAIL "sp-plus.service sandboxed" "${sec:-<no score>}"
fi

# SUID inventory as evidence. This asserts the set has not GROWN behind us; it
# does not claim the allowlisted entries are safe. Removal is Tier 3.
suid_now="$(remote "find / /etc /var /var/home -xdev \\( -path /sysroot -o -path /ostree -o -path /var/lib/containers -o -path /var/lib/flatpak \\) -prune -o -perm /6000 -type f -print 2>/dev/null | sort -u" | tr -d '\r')"
suid_allow="$(remote "grep -v '^#' /usr/share/sp-plus/security/suid-allowlist.txt 2>/dev/null | grep -v '^\$' | sort" | tr -d '\r')"
if [ -z "$suid_allow" ]; then
    record FAIL "suid set within allowlist" "allowlist not found in image"
else
    extra="$(comm -23 <(printf '%s\n' "$suid_now") <(printf '%s\n' "$suid_allow") | tr '\n' ' ')"
    if [ -z "${extra// /}" ]; then
        record PASS "suid set within allowlist" "$(printf '%s\n' "$suid_now" | grep -c . ) files, none unexpected"
    else
        record FAIL "suid set within allowlist" "unexpected: $extra"
    fi
fi

echo
echo "passed=$PASS failed=$FAIL"
if [ "$FAIL" -gt 0 ]; then
    echo "POSTURE GATE FAILED — a control that the build believes it applied is not in effect."
    exit 1
fi
echo "RUNTIME_POSTURE_OK all $PASS controls measured in effect"
