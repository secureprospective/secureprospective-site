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

# ------------------------------------------------------------ T2.2 (2026-09-11)
# Flathub restricted to its verified subset, with a vouched exception remote.
# The last assertion here is the one that matters: it resolves every application
# SP+ offers on its Optional Tools screen from the remote SP+ will actually ask,
# which is the difference between a control and a broken Install button. These
# four reach the network, so they are slower than everything above and they fail
# loudly rather than skipping if Flathub is unreachable.
fp_subset="$(remote "flatpak remotes --columns=name,subset" | tr -d '\r' | awk '$1=="flathub"{print $2}')"
if [ "$fp_subset" = verified ]; then record PASS "flathub restricted to verified" "subset=$fp_subset"
else record FAIL "flathub restricted to verified" "subset=${fp_subset:-<none>}"; fi

fp_opts="$(remote "flatpak remotes --columns=name,options" | tr -d '\r' | awk '$1=="flathub-vouched"{print $2}')"
case "$fp_opts" in
    *no-enumerate*) record PASS "vouched remote not browsable" "$fp_opts" ;;
    *)              record FAIL "vouched remote not browsable" "${fp_opts:-<remote absent>}" ;;
esac

fp_count="$(remote "timeout 240 flatpak remote-ls flathub-vouched --app --columns=application 2>/dev/null | grep -c ." | tr -d '\r')"
if [ -z "$fp_opts" ]; then
    record FAIL "vouched remote enumerates nothing" "remote absent, so nothing was measured"
elif [ "${fp_count:-x}" = 0 ]; then
    record PASS "vouched remote enumerates nothing" "0 applications listed"
else
    record FAIL "vouched remote enumerates nothing" "${fp_count:-<no answer>} listed"
fi

# Day one: every Optional Tool still resolves from the remote Welcome will ask.
tools_bad=""
for pair in us.zoom.Zoom:flathub-vouched org.signal.Signal:flathub-vouched \
            com.bitwarden.desktop:flathub org.gnome.Boxes:flathub; do
    app="${pair%%:*}"; rem="${pair##*:}"
    if ! remote "timeout 120 flatpak remote-info $rem $app >/dev/null 2>&1 && echo yes" | grep -q yes; then
        tools_bad="$tools_bad $app"
    fi
done
if [ -z "${tools_bad// /}" ]; then
    record PASS "optional tools all resolve" "4 of 4 from their shipped remote"
else
    record FAIL "optional tools all resolve" "unresolvable:$tools_bad"
fi


# ------------------------------------------------------------ T2.4 (2026-09-11)
# Kernel hardening arguments. The cmdline is read back, but a cmdline is
# configuration text, so each argument that has an observable effect is also
# measured by that effect. init_on_alloc and init_on_free have no sysfs or
# procfs readback at all, so the cmdline is the only evidence available for
# those two and this file says so rather than implying more.
cmdline="$(remote "cat /proc/cmdline" | tr -d '\r')"
for k in init_on_alloc=1 init_on_free=1 randomize_kstack_offset=on \
         slab_nomerge vsyscall=none pti=on; do
    case " $cmdline " in
        *" $k "*) record PASS "karg $k" "on the installed cmdline" ;;
        *)        record FAIL "karg $k" "absent from the installed cmdline" ;;
    esac
done

# doc 15 section 4 rejects nosmt. A later edit that quietly reinstates it should
# turn this gate red rather than pass unnoticed.
case " $cmdline " in
    *nosmt*|*mitigations=*) record FAIL "nosmt not reinstated" "cmdline carries a mitigations/nosmt argument" ;;
    *)                      record PASS "nosmt not reinstated" "no mitigations= on the cmdline" ;;
esac

# vsyscall=none removes the fixed-address executable page from every process.
# Measured in a real process map, not read back from the cmdline.
vsys="$(remote "grep -c vsyscall /proc/self/maps" | tr -d '\r')"
if [ "${vsys:-x}" = 0 ]; then
    record PASS "no vsyscall mapping" "0 vsyscall lines in a live process map"
else
    record FAIL "no vsyscall mapping" "${vsys:-<no answer>} vsyscall lines present"
fi

# slab_nomerge stops distinct caches sharing backing memory, which removes a
# route from a bug in one cache to objects in another.
#
# READ THIS BEFORE TRUSTING THE RESULT. This is a PROPERTY assertion, not
# evidence that the karg did anything. Fedora 44's kernel already reports zero
# aliases on every cache without slab_nomerge: measured on the pre-T2.4 t22
# install, where all six karg assertions went red and this one still passed.
# The karg's own evidence is the cmdline assertion above. What this guards is
# the property itself, so that a future kernel default that reinstates merging
# turns the gate red rather than passing quietly.
#
# The earlier version of this counted alias SYMLINKS under /sys/kernel/slab.
# That kernel publishes every cache as a directory and no symlinks at all, so
# it returned 0 on hardened and unhardened machines alike and could never fail.
aliases="$(remote "sudo sh -c 'cat /sys/kernel/slab/*/aliases 2>/dev/null' | awk '{t+=\$1} END{print t+0}'" | tr -d '\r')"
if [ "${aliases:-x}" = 0 ]; then
    record PASS "no merged slab caches" "0 aliases summed across every cache"
else
    record FAIL "no merged slab caches" "${aliases:-<no answer>} cache aliases present"
fi

# pti=on forces page table isolation regardless of what the CPU claims about
# its own errata.
#
# NOT measured by /sys/devices/system/cpu/vulnerabilities/meltdown. That file
# reports whether the CPU carries the Meltdown *bug*, not whether the mitigation
# is running: on a CPU without the bug it prints "Not affected" even with PTI
# force-enabled, which is exactly the false negative this gate first produced on
# an AMD Ryzen 9 6900HX whose dmesg said "force enabled on command line".
#
# The pti flag in /proc/cpuinfo is X86_FEATURE_PTI, which the kernel sets only
# when page table isolation is actually turned on. That is the effect, so that
# is what is measured.
pti="$(remote "grep -c '^flags.*[[:space:]]pti[[:space:]]' /proc/cpuinfo" | tr -d '\r')"
if [ "${pti:-0}" -gt 0 ] 2>/dev/null; then
    record PASS "page table isolation active" "X86_FEATURE_PTI set on $pti cpus"
else
    record FAIL "page table isolation active" "no pti flag in /proc/cpuinfo"
fi

# ------------------------------------------------------------ T2.6 (2026-09-11)
# Login and password policy. Six of these seven assertions measure behaviour on
# the running machine. The seventh is labelled POLICY READ where it sits, and is
# not evidence that the policy took effect. The T2.2 lesson applies directly --
# a config file is not behaviour, so do not add a config-read here unlabelled.

# umask in a real login shell, and the mode a file actually lands with.
um="$(remote "bash -lc umask" | tr -d '\r')"
if [ "$um" = 0027 ]; then record PASS "login shell umask 027" "umask=$um"
else record FAIL "login shell umask 027" "umask=${um:-<no answer>}"; fi

fmode="$(remote "rm -f /tmp/sp-umask-probe && bash -lc 'touch /tmp/sp-umask-probe' && stat -c %a /tmp/sp-umask-probe && rm -f /tmp/sp-umask-probe" | tr -d '\r' | head -1)"
if [ "$fmode" = 640 ]; then record PASS "new files group-read only" "mode $fmode"
else record FAIL "new files group-read only" "mode ${fmode:-<no answer>} want 640"; fi

# pwquality, measured by asking the live library to score real passwords rather
# than by reading minlen out of the file it was configured with.
have_pwscore="$(remote "command -v pwscore >/dev/null && echo yes || echo no" | tr -d '\r')"
weak="$(remote "echo 'short1' | pwscore 2>&1 >/dev/null | head -1" | tr -d '\r')"
case "$have_pwscore:$weak" in
    yes:*[Pp]assword*) record PASS "weak password rejected" "pwscore: $weak" ;;
    yes:) record FAIL "weak password rejected" "pwscore accepted a 6 character password" ;;
    no:*) record FAIL "weak password rejected" "pwscore is not installed, so nothing was measured" ;;
    *) record FAIL "weak password rejected" "unrecognised pwscore output: ${weak:-<none>}" ;;
esac

# This is the assertion that can tell T2.6 apart from the image before it.
# "short1" is rejected by STOCK Fedora pwquality too -- measured on the t24
# install, where the weak-password assertion above passed on an image that had
# never seen T2.6. It guards that pwquality is live, not that minlen was raised.
# An 11 character password is the discriminator: stock scores it 81 and accepts
# it, minlen = 12 must refuse it.
mid="$(remote "echo 'quilt-harb9' | pwscore 2>&1 >/dev/null | head -1" | tr -d '\r')"
case "$mid" in
    *[Pp]assword*) record PASS "minlen 12 enforced" "an 11 character password is refused" ;;
    "")            record FAIL "minlen 12 enforced" "an 11 character password was accepted; minlen is stock, not 12" ;;
    *)             record FAIL "minlen 12 enforced" "unrecognised pwscore output: $mid" ;;
esac

strong="$(remote "echo 'quilted-harbour-ledger' | pwscore 2>/dev/null" | tr -d '\r')"
if [ -n "$strong" ] && [ "$strong" -gt 0 ] 2>/dev/null; then
    record PASS "long passphrase accepted" "pwscore $strong, no class rules imposed"
else
    record FAIL "long passphrase accepted" "pwscore refused a 22 character passphrase"
fi

# faillock, measured by actually locking a throwaway account.
#
# READ THIS BEFORE CHANGING IT. Three earlier shapes of this probe measured
# nothing and still passed:
#   1. "sudo faillock --user X | grep -c ':'" counts the "X:" header line, so it
#      returned 1 on an account with zero recorded failures.
#   2. "sudo -k -S -u X true" authenticates the INVOKING user, never X, so it
#      never reaches X's auth stack.
#   3. "script -qec 'su X -c true'" exits 127: the image does not ship script(1).
# The working shape is su(1) under a real pty from python3, and the assertion is
# that exactly "deny" failures get recorded -- the count stops at the threshold
# because the account is locked, which is the effect, not the configuration.
#
# The probe travels as base64 so that no ssh, heredoc or shell quoting layer
# between here and the guest can mangle a backslash. Decode it to read it:
#   sed -n 's/^FAILLOCK_PROBE_B64=//p' this-file | base64 -d
FAILLOCK_PROBE_B64=IyEvYmluL2Jhc2gKIyBEcml2ZSByZWFsIGF1dGhlbnRpY2F0aW9uIGZhaWx1cmVzIGFnYWluc3QgYSB0aHJvd2F3YXkgYWNjb3VudCBhbmQgcmVwb3J0IGhvdwojIG1hbnkgcGFtX2ZhaWxsb2NrIGFjdHVhbGx5IHJlY29yZGVkLgojCiMgV0hZIE5PVCBgc3VkbyAtdSBYYDogaXQgYXV0aGVudGljYXRlcyB0aGUgSU5WT0tJTkcgdXNlciwgbmV2ZXIgWCwgc28gaXQgbmV2ZXIKIyByZWFjaGVzIFgncyBhdXRoIHN0YWNrIGFuZCByZWNvcmRzIG5vdGhpbmcuCiMgV0hZIE5PVCBgc2NyaXB0YDogdGhlIFNQKyBpbWFnZSBkb2VzIG5vdCBzaGlwIHV0aWwtbGludXgncyBzY3JpcHQoMSkuCiMgYHN1IFhgIGRvZXMgYXV0aGVudGljYXRlIGFzIFggdGhyb3VnaCAvZXRjL3BhbS5kL3N1IC0+IHN5c3RlbS1hdXRoIC0+CiMgcGFtX2ZhaWxsb2NrLCBhbmQgcGFtX3VuaXggcmVhZHMgdGhlIHBhc3N3b3JkIGZyb20gYSB0ZXJtaW5hbCwgbmV2ZXIgc3RkaW4sCiMgc28gdGhlIGF0dGVtcHQgaGFzIHRvIHJ1biB1bmRlciBhIHJlYWwgcHR5LiBweXRob24zIHNoaXBzIGluIHRoZSBpbWFnZS4KVT1zcC1mYWlsbG9jay1wcm9iZQpzdWRvIHVzZXJkZWwgLXIgIiRVIiA+L2Rldi9udWxsIDI+JjEKc3VkbyB1c2VyYWRkIC1NIC1zIC9iaW4vYmFzaCAiJFUiID4vZGV2L251bGwgMj4mMSB8fCB7IGVjaG8gIkZBSUxMT0NLX1JFQ09SREVEPS0xIjsgZXhpdCAxOyB9CnN1ZG8gdXNlcm1vZCAtcCAnJDYkc3Bwcm9iZSRpbnZhbGlkaGFzaHZhbHVlaGVyZScgIiRVIiA+L2Rldi9udWxsIDI+JjEKc3VkbyBmYWlsbG9jayAtLXVzZXIgIiRVIiAtLXJlc2V0ID4vZGV2L251bGwgMj4mMQoKcHl0aG9uMyAtICIkVSIgPDwnUFknCmltcG9ydCBvcywgcHR5LCBzeXMsIHRpbWUKdXNlciA9IHN5cy5hcmd2WzFdCmZvciBfIGluIHJhbmdlKDEyKToKICAgIHBpZCwgZmQgPSBwdHkuZm9yaygpCiAgICBpZiBwaWQgPT0gMDoKICAgICAgICBvcy5leGVjdnAoInN1IiwgWyJzdSIsIHVzZXIsICItYyIsICJ0cnVlIl0pCiAgICB0cnk6CiAgICAgICAgdGltZS5zbGVlcCgwLjMpCiAgICAgICAgb3Mud3JpdGUoZmQsIGIid3JvbmdwYXNzd29yZFxuIikKICAgICAgICB3aGlsZSBUcnVlOgogICAgICAgICAgICBpZiBub3Qgb3MucmVhZChmZCwgMTAyNCk6CiAgICAgICAgICAgICAgICBicmVhawogICAgZXhjZXB0IE9TRXJyb3I6CiAgICAgICAgcGFzcwogICAgb3Mud2FpdHBpZChwaWQsIDApClBZCgojIENvdW50IG9ubHkgcmVhbCByZWNvcmQgcm93czogZHJvcCB0aGUgIjx1c2VyPjoiIGhlYWRlciBhbmQgdGhlIGNvbHVtbiBoZWFkZXIuCm49JChzdWRvIGZhaWxsb2NrIC0tdXNlciAiJFUiIDI+L2Rldi9udWxsIFwKICAgIHwgZ3JlcCAtdkUgIl4ke1V9OlwkfF5XaGVuW1s6c3BhY2U6XV0rVHlwZSIgfCBncmVwIC1jICdbMC05XScpCmVjaG8gIkZBSUxMT0NLX1JFQ09SREVEPSRuIgo=
fl="$(remote "echo IyEvYmluL2Jhc2gKIyBEcml2ZSByZWFsIGF1dGhlbnRpY2F0aW9uIGZhaWx1cmVzIGFnYWluc3QgYSB0aHJvd2F3YXkgYWNjb3VudCBhbmQgcmVwb3J0IGhvdwojIG1hbnkgcGFtX2ZhaWxsb2NrIGFjdHVhbGx5IHJlY29yZGVkLgojCiMgV0hZIE5PVCBgc3VkbyAtdSBYYDogaXQgYXV0aGVudGljYXRlcyB0aGUgSU5WT0tJTkcgdXNlciwgbmV2ZXIgWCwgc28gaXQgbmV2ZXIKIyByZWFjaGVzIFgncyBhdXRoIHN0YWNrIGFuZCByZWNvcmRzIG5vdGhpbmcuCiMgV0hZIE5PVCBgc2NyaXB0YDogdGhlIFNQKyBpbWFnZSBkb2VzIG5vdCBzaGlwIHV0aWwtbGludXgncyBzY3JpcHQoMSkuCiMgYHN1IFhgIGRvZXMgYXV0aGVudGljYXRlIGFzIFggdGhyb3VnaCAvZXRjL3BhbS5kL3N1IC0+IHN5c3RlbS1hdXRoIC0+CiMgcGFtX2ZhaWxsb2NrLCBhbmQgcGFtX3VuaXggcmVhZHMgdGhlIHBhc3N3b3JkIGZyb20gYSB0ZXJtaW5hbCwgbmV2ZXIgc3RkaW4sCiMgc28gdGhlIGF0dGVtcHQgaGFzIHRvIHJ1biB1bmRlciBhIHJlYWwgcHR5LiBweXRob24zIHNoaXBzIGluIHRoZSBpbWFnZS4KVT1zcC1mYWlsbG9jay1wcm9iZQpzdWRvIHVzZXJkZWwgLXIgIiRVIiA+L2Rldi9udWxsIDI+JjEKc3VkbyB1c2VyYWRkIC1NIC1zIC9iaW4vYmFzaCAiJFUiID4vZGV2L251bGwgMj4mMSB8fCB7IGVjaG8gIkZBSUxMT0NLX1JFQ09SREVEPS0xIjsgZXhpdCAxOyB9CnN1ZG8gdXNlcm1vZCAtcCAnJDYkc3Bwcm9iZSRpbnZhbGlkaGFzaHZhbHVlaGVyZScgIiRVIiA+L2Rldi9udWxsIDI+JjEKc3VkbyBmYWlsbG9jayAtLXVzZXIgIiRVIiAtLXJlc2V0ID4vZGV2L251bGwgMj4mMQoKcHl0aG9uMyAtICIkVSIgPDwnUFknCmltcG9ydCBvcywgcHR5LCBzeXMsIHRpbWUKdXNlciA9IHN5cy5hcmd2WzFdCmZvciBfIGluIHJhbmdlKDEyKToKICAgIHBpZCwgZmQgPSBwdHkuZm9yaygpCiAgICBpZiBwaWQgPT0gMDoKICAgICAgICBvcy5leGVjdnAoInN1IiwgWyJzdSIsIHVzZXIsICItYyIsICJ0cnVlIl0pCiAgICB0cnk6CiAgICAgICAgdGltZS5zbGVlcCgwLjMpCiAgICAgICAgb3Mud3JpdGUoZmQsIGIid3JvbmdwYXNzd29yZFxuIikKICAgICAgICB3aGlsZSBUcnVlOgogICAgICAgICAgICBpZiBub3Qgb3MucmVhZChmZCwgMTAyNCk6CiAgICAgICAgICAgICAgICBicmVhawogICAgZXhjZXB0IE9TRXJyb3I6CiAgICAgICAgcGFzcwogICAgb3Mud2FpdHBpZChwaWQsIDApClBZCgojIENvdW50IG9ubHkgcmVhbCByZWNvcmQgcm93czogZHJvcCB0aGUgIjx1c2VyPjoiIGhlYWRlciBhbmQgdGhlIGNvbHVtbiBoZWFkZXIuCm49JChzdWRvIGZhaWxsb2NrIC0tdXNlciAiJFUiIDI+L2Rldi9udWxsIFwKICAgIHwgZ3JlcCAtdkUgIl4ke1V9OlwkfF5XaGVuW1s6c3BhY2U6XV0rVHlwZSIgfCBncmVwIC1jICdbMC05XScpCmVjaG8gIkZBSUxMT0NLX1JFQ09SREVEPSRuIgo= | base64 -d | bash" | sed -n 's/^FAILLOCK_RECORDED=//p' | tr -d '\r')"
if [ "${fl:-x}" = 10 ]; then
    record PASS "faillock locks after 10 tries" "$fl failures recorded, then the account stopped counting"
elif [ "${fl:-x}" = 0 ]; then
    record FAIL "faillock locks after 10 tries" "pam_faillock recorded nothing; the module is inert"
else
    record FAIL "faillock locks after 10 tries" "recorded ${fl:-<no answer>} failures, want exactly 10"
fi

# POLICY READ, NOT A MEASUREMENT. Waiting out a real 120 second unlock is not
# something a gate should do, so this pair reads the shipped policy instead.
# The behavioural half of faillock is the probe directly above, which does fail
# on a machine where the module is present but inert. A deny with no
# unlock_time, or even_deny_root, is a support call SP+ pays for.
# The even_deny_root count strips comments first: the shipped file carries a
# comment explaining why even_deny_root is absent, and an unstripped grep would
# match that comment and fail every time.
ul="$(remote "grep -E '^unlock_time' /etc/security/faillock.conf | tr -d ' '" | tr -d '\r')"
edr="$(remote "grep -v '^#' /etc/security/faillock.conf | grep -c even_deny_root" | tr -d '\r')"
if [ "$ul" = "unlock_time=120" ] && [ "${edr:-1}" = 0 ]; then
    record PASS "lockout policy clears itself (policy read)" "$ul, root not locked"
else
    record FAIL "lockout policy clears itself (policy read)" "${ul:-<none>}, even_deny_root count ${edr:-?}"
fi

# An empty password must not authenticate anyone.
#
# This scans the WHOLE of /etc/pam.d, not just system-auth and password-auth.
# The KDE greeter, which is the advisor's real login path, does not have its own
# auth lines -- /etc/pam.d/kde substacks password-auth -- but checking only the
# two common files would miss any service that grew its own pam_unix line.
#
# sssd-shadowutils is the one documented exception: it ships with nullok from
# Fedora, it belongs to the sssd authselect profile which SP+ does not use, and
# sssd.service and sssd-kcm.socket are both masked -- asserted separately above.
# It is named here rather than skipped silently so that a second file appearing
# with nullok turns this red instead of being absorbed into the exception.
nkfiles="$(remote "sudo grep -rlE '^auth.*pam_unix\.so.*nullok' /etc/pam.d/ 2>/dev/null | xargs -r -n1 basename | sort | paste -sd, -" | tr -d '\r')"
case "$nkfiles" in
    "")                  record PASS "empty passwords not accepted" "no nullok anywhere in /etc/pam.d" ;;
    sssd-shadowutils)    record PASS "empty passwords not accepted" "only in sssd-shadowutils, and sssd is masked" ;;
    *)                   record FAIL "empty passwords not accepted" "nullok present in: $nkfiles" ;;
esac
# ------------------------------------------------------------ T2.3 (2026-09-11)
# DNS over TLS, opportunistic. Measured through resolved's own D-Bus property
# and through a real query, never by reading the drop-in back.
#
# The drop-in being present proves nothing at all. systemd-resolved runs as its
# own user and SILENTLY IGNORES a drop-in it cannot read -- no log line, the old
# setting simply persists. That is why the mode is asserted here as well as in
# the build, and why the live property is the thing that decides this assertion.

dot="$(remote "sudo busctl get-property org.freedesktop.resolve1 /org/freedesktop/resolve1 org.freedesktop.resolve1.Manager DNSOverTLS 2>/dev/null | awk '{print \$NF}' | tr -dc 'a-z-'" | tr -d '\r')"
if [ "$dot" = opportunistic ]; then
    record PASS "DNS over TLS opportunistic" "resolved reports DNSOverTLS=$dot"
else
    record FAIL "DNS over TLS opportunistic" "resolved reports '${dot:-<no answer>}', want opportunistic"
fi

dsec="$(remote "sudo busctl get-property org.freedesktop.resolve1 /org/freedesktop/resolve1 org.freedesktop.resolve1.Manager DNSSEC 2>/dev/null | awk '{print \$NF}' | tr -dc 'a-z-'" | tr -d '\r')"
if [ "$dsec" = allow-downgrade ]; then
    record PASS "DNSSEC allow-downgrade" "resolved reports DNSSEC=$dsec"
else
    record FAIL "DNSSEC allow-downgrade" "resolved reports '${dsec:-<no answer>}', want allow-downgrade"
fi

# DNSOverTLS=yes would close the downgrade and break every captive portal. It is
# rejected by the day-one rule, so a machine that has acquired it must go red.
case "$dot" in
    yes|true) record FAIL "captive portals still usable" "DNSOverTLS=$dot fails closed on a portal" ;;
    *)        record PASS "captive portals still usable" "DoT is downgradeable, so a portal can still be reached" ;;
esac

# The drop-in must be readable by the daemon that needs it. A 0640 file here is
# the silent-disable failure described above, so this is a real control.
dm="$(remote "stat -c %a /usr/lib/systemd/resolved.conf.d/90-sp-plus-dot.conf 2>/dev/null" | tr -d '\r')"
dd="$(remote "stat -c %a /usr/lib/systemd/resolved.conf.d 2>/dev/null" | tr -d '\r')"
if [ "$dm" = 644 ] && [ "$dd" = 755 ]; then
    record PASS "resolved drop-in readable by resolved" "file $dm, dir $dd"
else
    record FAIL "resolved drop-in readable by resolved" "file ${dm:-<missing>}, dir ${dd:-<missing>}; resolved runs as its own user"
fi

# And a real query has to come back encrypted. This is the only assertion here
# that proves the control is doing work rather than merely being switched on.
enc="$(remote "resolvectl query --cache=no fedoraproject.org 2>&1 | grep -c 'encrypted transport: yes'" | tr -d '\r')"
if [ "${enc:-0}" -gt 0 ] 2>/dev/null; then
    record PASS "a real query is encrypted" "resolvectl reports encrypted transport"
else
    record FAIL "a real query is encrypted" "resolvectl reports plaintext; DoT is configured but not working"
fi

# ------------------------------------------------------------ T2.7 (2026-09-11)
# MAC address policy. The control is deliberately asymmetric and the assertions
# below are asymmetric to match: the WIRED half is the one that can break an
# advisor's dock, so it is measured on the live link rather than read from a
# file, while the Wi-Fi half is an effective-config read because a VM has no
# Wi-Fi radio to measure.

# TAKE THE FIRST MATCHING LINE, NOT A COUNT AND NOT THE LAST.
#
# Two earlier shapes of these two assertions passed on a mutated machine:
#   1. Counting occurrences of the wanted value stayed green while a
#      higher-priority conf.d section overrode it to random.
#   2. Taking the LAST matching line was exactly backwards.
# NetworkManager --print-config emits connection sections in DESCENDING
# precedence: a 99- file appears above a 23- file, and the first section that
# matches the device and sets the property is the one that takes effect.
# Verified by reading the live output with a 99- override in place. Both wrong
# shapes were found only because the mutation below was actually run.
nmwifi="$(remote "sudo NetworkManager --print-config 2>/dev/null | grep '^wifi.cloned-mac-address=' | head -1" | tr -d '\r')"
if [ "$nmwifi" = "wifi.cloned-mac-address=stable-ssid" ]; then
    record PASS "wifi mac is per-network stable (config)" "effective value is stable-ssid"
else
    record FAIL "wifi mac is per-network stable (config)" "effective value is '${nmwifi:-<unset>}'"
fi

nmeth="$(remote "sudo NetworkManager --print-config 2>/dev/null | grep '^ethernet.cloned-mac-address=' | head -1" | tr -d '\r')"
if [ "$nmeth" = "ethernet.cloned-mac-address=preserve" ]; then
    record PASS "wired mac left alone (config)" "effective value is preserve"
else
    record FAIL "wired mac left alone (config)" "effective value is '${nmeth:-<unset>}'"
fi

# Randomized WIRED addressing is what breaks docks and USB Ethernet adapters.
# Nothing in the effective configuration may ask for it.
nmrand="$(remote "sudo NetworkManager --print-config 2>/dev/null | grep -cE '^(ethernet|wifi)\.cloned-mac-address=random$'" | tr -d '\r')"
if [ "${nmrand:-1}" = 0 ]; then
    record PASS "no random mac anywhere" "nothing in the effective config asks for a random address"
else
    record FAIL "no random mac anywhere" "${nmrand} connection defaults request a random MAC"
fi

# THE BEHAVIOURAL ONE. If the wired link is running on anything other than its
# own hardware address, the dock-breaking failure mode is already live on this
# machine. Measured on the link, not read from a policy file.
#
# TWO EARLIER SHAPES OF THIS WERE WRONG, both in ways that looked like a failing
# control rather than a failing test:
#   1. nmcli GENERAL.PERM-HWADDR is not a field that exists in NetworkManager
#      1.56. The query errored, the empty result compared unequal, and the
#      assertion went red on a machine where the control was working. A check
#      that can NEVER pass is as useless as one that can never fail.
#   2. Treating "no permanent address" as a failure is wrong on exactly the
#      hardware this control protects. Many USB Ethernet adapters carry no
#      EEPROM and report none, and so does virtio. The absence of a permanent
#      address is a property of the device, not a fault in the policy.
# ethtool -P is the interface that actually reports it, and the profile's own
# cloned-mac-address is the fallback measurement when the device has none.
ethdev="$(remote "nmcli -t -f DEVICE,TYPE device status 2>/dev/null | grep ':ethernet$' | cut -d: -f1 | head -1" | tr -d '\r')"
if [ -z "$ethdev" ]; then
    record FAIL "wired link uses its own hardware address" "no ethernet device found, so nothing was measured"
else
    cur="$(remote "cat /sys/class/net/$ethdev/address 2>/dev/null" | tr -d '\r')"
    perm="$(remote "sudo ethtool -P $ethdev 2>/dev/null | cut -d' ' -f3" | tr -d '\r')"
    cloned="$(remote "nmcli -g 802-3-ethernet.cloned-mac-address connection show $ethdev 2>/dev/null" | tr -d '\r')"
    case "$perm" in
        ""|00:00:00:00:00:00)
            # The device reports no permanent address. Fall back to asserting
            # that no cloned address was applied, and SAY that is what happened.
            case "$cloned" in
                ""|preserve) record PASS "wired link uses its own hardware address" "$ethdev has no permanent address to compare; no cloned MAC applied, running $cur" ;;
                *)           record FAIL "wired link uses its own hardware address" "$ethdev carries cloned-mac-address=$cloned" ;;
            esac
            ;;
        "$cur")
            record PASS "wired link uses its own hardware address" "$ethdev is on its own $cur"
            ;;
        *)
            record FAIL "wired link uses its own hardware address" "$ethdev running $cur, hardware address $perm"
            ;;
    esac
fi

echo
echo "passed=$PASS failed=$FAIL"
if [ "$FAIL" -gt 0 ]; then
    echo "POSTURE GATE FAILED — a control that the build believes it applied is not in effect."
    exit 1
fi
echo "RUNTIME_POSTURE_OK all $PASS controls measured in effect"
