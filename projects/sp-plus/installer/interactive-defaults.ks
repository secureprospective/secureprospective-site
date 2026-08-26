# Bring up the virtual NIC for Anaconda and bootc payload access.
network --bootproto=dhcp --device=link --activate --onboot=on

# Storage is automatic and is never offered as an operator choice. %pre selects
# the largest non-removable, writable disk and emits the automatic storage
# commands before Anaconda parses %include. autopart keeps the Installation
# Destination spoke complete instead of classifying the install as custom.
%pre --interpreter=/bin/bash --erroronfail --log=/tmp/spplus-ks-pre.log
set -euo pipefail

# The ISO is a read-only optical device and removable media are excluded. Pick
# the largest remaining writable disk: this is the appliance's internal disk on
# both QEMU virtio and QEMU SATA/Dell. Refuse to guess if none exists.
disk="$(lsblk -dn -b -o NAME,TYPE,RM,RO,TRAN,SIZE \
    | awk '$2 == "disk" && $3 == 0 && $4 == 0 && $5 != "usb" { print $1, $6 }' \
    | sort -k2,2nr | head -n1 | awk '{ print $1 }')"
[ -n "$disk" ] || { echo "SP+ storage: no eligible writable non-removable disk" >&2; exit 1; }
printf 'SP+ storage: selected /dev/%s\n' "$disk" >&2

# A random root hash makes the Root Account spoke explicitly configured while
# shipping no usable root password. Root remains inaccessible until the field
# operator deliberately sets a password through the advisor account.
root_hash="$(head -c 48 /dev/urandom | base64 -w0 | openssl passwd -6 -stdin)"
[ -n "$root_hash" ] || { echo "SP+ accounts: failed to generate root hash" >&2; exit 1; }

cat > /tmp/spplus-storage.ks <<EOF
zerombr
ignoredisk --only-use=$disk
clearpart --all --initlabel --drives=$disk
autopart --type=lvm --fstype=xfs --encrypted --luks-version=luks2
rootpw --iscrypted $root_hash
EOF
%end
%include /tmp/spplus-storage.ks

# No --passphrase is intentional: Anaconda must ask the operator for the LUKS
# passphrase. It is never stored in this kickstart, image, repository, build
# argument, or git history. /boot and the ESP remain unencrypted; autopart's
# XFS layout keeps /boot disk-backed and avoids ext4's auto-created lost+found
# directory, which bootc rejects on an empty root. Root and /var/home are inside
# encrypted storage.
bootc --source-imgref containers-storage:localhost/sp-plus-kde:spike --target-imgref ghcr.io/secureprospective/sp-plus-kde:edge

# Explicitly settle the user spoke without embedding a password. The advisor
# account is usable after a password is assigned, and its persistent home is
# created below on /var/home. The generated root hash is not a known credential.
# The account is deliberately locked in the image. A first-boot systemd unit
# below prompts the advisor on the local console and sets the password they choose.
user --name=advisor --groups=wheel --shell=/bin/bash --homedir=/var/home/advisor --lock

# Anaconda copies the installer command line into the installed boot entry. Keep
# the installer-only SELinux and serial-console workarounds out of the target.
# This is intentionally decomposed: each concern records a durable failure and
# the later concerns still run if an earlier one fails.
%post --interpreter=/bin/bash --erroronfail
set -u
post_state=/var/lib/spplus
post_failures=0
post_failure() {
    local message="$1"
    post_failures=$((post_failures + 1))
    printf '%s\n' "$message" >&2
    if mkdir -p "$post_state" 2>/dev/null; then
        printf '%s\n' "$message" >> "$post_state/%post-failed"
    fi
}
if ! mkdir -p "$post_state"; then
    echo "SP+ post: cannot create $post_state; post state is not durable" >&2
    exit 1
fi

# DN-16: Anaconda writes the installed /etc while the installer runs with
# selinux=0 (DN-09), so those files are created with NO SELinux context. Under
# Enforcing that breaks EVERY login: plasmalogin and local_login are denied read
# on /etc/nsswitch.conf and /etc/passwd (tcontext=unlabeled_t), which is the
# graphical login loop. Relabel from the TARGET policy's file_contexts.
# setfiles writes security.* xattrs directly, so it works even though SELinux is
# disabled in the installer kernel.
spplus_relabel_targets() {
    local fc=/etc/selinux/targeted/contexts/files/file_contexts
    local rc=0 path
    if [ ! -f "$fc" ]; then
        echo "SP+ post: no target file_contexts at $fc" >&2
        return 1
    fi
    for path in /etc /var; do
        [ -d "$path" ] || continue
        if ! setfiles -F "$fc" "$path" >/dev/null 2>&1; then
            echo "SP+ post: setfiles failed on $path" >&2
            rc=1
        fi
    done
    # The files whose absence of a label actually breaks login. Verify, do not
    # assume: an unlabeled file here means the relabel did not take (DN-16).
    for path in /etc/nsswitch.conf /etc/passwd /etc/shadow /etc/localtime; do
        [ -e "$path" ] || continue
        if ! ls -dZ "$path" 2>/dev/null | grep -qv '^?'; then
            echo "SP+ post: $path is STILL unlabeled after relabel" >&2
            rc=1
        fi
    done
    return $rc
}
if ! spplus_relabel_targets; then
    post_failure "SP+ post FAILED: could not label /etc and /var from the target policy (DN-16)"
fi

# bootc/ostree stores kernel arguments in BLS entry options lines. grubby is not
# part of a bootc image, so edit each generated entry directly and fail if no
# entry was available to edit.
spplus_strip_installer_kargs() {
    local entry tmp found=0
    local -a entries
    shopt -s nullglob
    entries=(/boot/loader/entries/*.conf)
    ((${#entries[@]} > 0)) || {
        echo "SP+ post: no BLS entries found while stripping installer kargs" >&2
        return 1
    }
    for entry in "${entries[@]}"; do
        grep -q '^options[[:space:]]' "$entry" || continue
        found=1
        tmp="${entry}.spplus.$$"
        awk '
            $1 == "options" {
                printf "%s", $1
                for (i = 2; i <= NF; i++)
                    if ($i != "selinux=0" && $i != "console=ttyS0,115200" && $i != "console=tty0")
                        printf " %s", $i
                printf "\n"
                next
            }
            { print }
        ' "$entry" > "$tmp" || { rm -f "$tmp"; return 1; }
        if cmp -s "$tmp" "$entry"; then rm -f "$tmp"; else mv -f "$tmp" "$entry" || return 1; fi
    done
    ((found > 0)) || {
        echo "SP+ post: BLS entries have no options line" >&2
        return 1
    }
}
if ! spplus_strip_installer_kargs; then
    post_failure "SP+ post FAILED: could not strip installer kernel arguments from BLS"
fi

# Do not rely on systemctl talking to a running manager in the install chroot;
# the symlink is the installed system's authoritative default-target setting.
if ! ln -sfn /usr/lib/systemd/system/graphical.target /etc/systemd/system/default.target \
    || [ "$(readlink /etc/systemd/system/default.target 2>/dev/null)" != "/usr/lib/systemd/system/graphical.target" ]; then
    post_failure "SP+ post FAILED: could not set installed default.target to graphical.target"
fi

# Give every declared local account a persistent home. The advisor home is
# checked explicitly because SDDM otherwise accepts a password and loops back.
if ! getent passwd advisor >/dev/null 2>&1; then
    post_failure "SP+ post FAILED: advisor account is absent in installed passwd database"
else
    advisor_home="$(getent passwd advisor | cut -d: -f6)"
    if ! mkdir -p "$advisor_home" \
        || ! chown advisor:advisor "$advisor_home" \
        || ! chmod 700 "$advisor_home"; then
        post_failure "SP+ post FAILED: could not create advisor home $advisor_home"
    else
        command -v restorecon >/dev/null 2>&1 && restorecon -RF "$advisor_home" || true
    fi
fi
while IFS=: read -r name _ uid gid _ home shell; do
    case "$home" in
        /home/*)
            if ! mkdir -p "$home" || ! chown "$uid:$gid" "$home" || ! chmod 700 "$home"; then
                post_failure "SP+ post FAILED: could not create home $home for $name"
            else
                command -v restorecon >/dev/null 2>&1 && restorecon -RF "$home" || true
            fi
            ;;
    esac
done < /etc/passwd

# The shipped account has no credential. Before the display manager starts on
# first boot, this unit asks the advisor to choose one on the physical console.
if ! install -d -m 0755 /usr/libexec /etc/systemd/system/multi-user.target.wants; then
    post_failure "SP+ post FAILED: could not create first-boot password paths"
else
    if ! cat > /usr/libexec/spplus-firstboot-password <<'SPPLUS_PASSWORD_SCRIPT'
#!/bin/bash
set -u
# DN-17: this ran on a hardcoded /dev/tty1 and failed on every boot. Use whatever
# the system's ACTIVE console is, so it works on a laptop screen and on a serial
# console alike, and record WHY it failed instead of dying silently.
fail() {
    mkdir -p /var/lib/spplus 2>/dev/null
    printf '%s %s\n' "$(date -u +%FT%TZ)" "$1" >> /var/lib/spplus/firstboot-error
    exit 1
}
# Plymouth owns the framebuffer until it is told to stop (DN-15); the prompt is
# invisible underneath it and the machine looks bricked while it waits.
/usr/bin/plymouth quit --retain-splash 2>/dev/null
/usr/bin/plymouth quit 2>/dev/null
CON=/dev/console
[ -c "$CON" ] || fail "no $CON character device"
exec <"$CON" >"$CON" 2>&1 || fail "could not attach to $CON"
mkdir -p /var/lib/spplus || fail "could not create /var/lib/spplus"
for attempt in 1 2 3; do
    printf '\n'
    printf '  ============================================\n'
    printf '     SP+ first boot\n'
    printf '     Choose the password for the advisor account.\n'
    printf '  ============================================\n\n'
    printf '  New password: '
    IFS= read -r -s first || fail "console read failed (attempt $attempt)"
    printf '\n  Retype new password: '
    IFS= read -r -s second || fail "console read failed (attempt $attempt)"
    printf '\n'
    if [ -n "$first" ] && [ "$first" = "$second" ]; then
        printf 'advisor:%s\n' "$first" | /usr/sbin/chpasswd || fail "chpasswd failed"
        unset first second
        printf '%s\n' "$(date -u +%FT%TZ)" > /var/lib/spplus/advisor-password-set
        chmod 600 /var/lib/spplus/advisor-password-set
        printf '\n  Password set. Starting SP+.\n\n'
        exit 0
    fi
    printf '\n  Those did not match. Try again.\n'
done
fail "three mismatched attempts"
SPPLUS_PASSWORD_SCRIPT
    then
        post_failure "SP+ post FAILED: could not write first-boot password helper"
    elif ! chmod 0750 /usr/libexec/spplus-firstboot-password; then
        post_failure "SP+ post FAILED: could not install first-boot password helper"
    fi
    if ! cat > /etc/systemd/system/spplus-firstboot-password.service <<'SPPLUS_PASSWORD_UNIT'
[Unit]
Description=SP+ first-boot advisor password setup
ConditionPathExists=!/var/lib/spplus/advisor-password-set
After=local-fs.target systemd-user-sessions.service plymouth-quit-wait.service
Before=display-manager.service getty@tty1.service
Conflicts=getty@tty1.service

[Service]
Type=oneshot
ExecStart=/usr/libexec/spplus-firstboot-password
StandardInput=tty-force
StandardOutput=tty
StandardError=tty
# DN-17: /dev/console, not /dev/tty1 — the active console is the laptop screen on
# hardware and the serial line under test, and hardcoding tty1 failed both.
TTYPath=/dev/console
TTYReset=yes
TTYVHangup=yes

[Install]
WantedBy=multi-user.target
SPPLUS_PASSWORD_UNIT
    then
        post_failure "SP+ post FAILED: could not write first-boot password unit"
    elif ! ln -sfn /etc/systemd/system/spplus-firstboot-password.service \
        /etc/systemd/system/multi-user.target.wants/spplus-firstboot-password.service; then
        post_failure "SP+ post FAILED: could not enable first-boot password unit"
    fi
fi

if [ "$post_failures" -gt 0 ]; then
    printf 'SP+ post: %s independent concern(s) failed; see %s/%%post-failed\n' \
        "$post_failures" "$post_state" >&2
    exit 1
fi
printf 'SP+ post: all independent post-install concerns completed\n'
%end
