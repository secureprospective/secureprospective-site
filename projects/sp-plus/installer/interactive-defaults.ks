# DHCP if a link exists, but NEVER block on one. The bootc payload comes from
# containers-storage on the ISO, so the install needs no network at all.
# '--device=link --activate' waited for a link that never came up on a Dell
# with no ethernet and no Intel wifi firmware, leaving the Network spoke
# incomplete and 'Begin Installation' permanently greyed out.
# The hostname is set HERE, not in the Containerfile. podman bind-mounts /etc/hostname
# during an image build, so writing it there goes to the bind mount, a build assertion
# reading it back passes, and nothing reaches the image -- every SP+ machine still
# called itself "localhost" on its login screen while the gate stayed green.
network --bootproto=dhcp --onboot=on --hostname=sp-plus

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

# DO NOT reintroduce a rootpw line here. See DN-27.
#
# SP+ used to write `rootpw --iscrypted <48 random bytes>` to make root inert.
# It also bricked installs. pyanaconda's check_admin_user_exists() begins:
#
#     # any root set from kickstart is fine
#     if self._rootpw_seen:
#         return True
#
# and the User Creation spoke is `mandatory = not CheckAdminUserExists()`.
# So declaring ANY rootpw -- even a random one nobody knows -- convinced
# Anaconda an admin already existed, made user creation optional, and let the
# install finish with zero usable accounts on the machine. Hit on a Dell,
# 2026-08-29, after a multi-hour install.
#
# Declaring no rootpw at all leaves root locked (stronger than a random hash)
# AND restores Anaconda's own guard, which then forces user creation.

cat > /tmp/spplus-storage.ks <<EOF
zerombr
ignoredisk --only-use=$disk
clearpart --all --initlabel --drives=$disk
autopart --type=lvm --fstype=xfs --encrypted --luks-version=luks2
EOF
%end
%include /tmp/spplus-storage.ks

# No --passphrase is intentional: Anaconda must ask the operator for the LUKS
# passphrase. It is never stored in this kickstart, image, repository, build
# argument, or git history. /boot and the ESP remain unencrypted; autopart's
# XFS layout keeps /boot disk-backed and avoids ext4's auto-created lost+found
# directory, which bootc rejects on an empty root. Root and /var/home are inside
# encrypted storage.
# The target image reference is the origin every installed machine checks for
# updates. It must be a tag that is actually published: an unpublished tag makes
# every update check fail, and KDE Discover surfaces the raw skopeo error
# ("manifest unknown", "docker://...") to the advisor as a fatal dialog. The tag
# ghcr.io/secureprospective/sp-plus-kde:edge was never published and returned
# HTTP 404; the published tags are latest and the dated/build-numbered ones.
bootc --source-imgref containers-storage:localhost/sp-plus-kde:alpha1 --target-imgref ghcr.io/secureprospective/sp-plus-kde:latest

# No account is declared here, deliberately. SP+ ships no human account at all:
# the person installing creates their own user in the installer's user spoke, the
# same as any other operating system. The generated root hash above is not a known
# credential to anyone.

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

# Give every account the installer created a persistent, correctly-owned home.
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

# Nothing to enable here any more: SP+ ships no human account, so there is no
# first-boot password prompt. The user creates their own account in the installer.

# DN-27. Last line of defence. If we still somehow reach the end of %post with
# no unlocked administrator, say so loudly rather than handing back a machine
# that looks installed and cannot be logged into. The advisor who owns this
# laptop cannot walk a rescue chroot.
spplus_admin_exists() {
    local name uid home shell found=0
    while IFS=: read -r name _ uid _ _ home shell; do
        [ "$uid" -ge 1000 ] 2>/dev/null || continue
        [ "$uid" -lt 65000 ] 2>/dev/null || continue
        case "$shell" in */nologin|*/false) continue ;; esac
        # must be able to actually authenticate
        case "$(awk -F: -v n="$name" '$1 == n { print $2 }' /etc/shadow 2>/dev/null)" in
            ''|'!'*|'*') continue ;;
        esac
        found=$((found + 1))
        printf 'SP+ accounts: administrator %s (uid %s, home %s)\n' "$name" "$uid" "$home" >&2
    done < /etc/passwd
    [ "$found" -gt 0 ]
}
if ! spplus_admin_exists; then
    post_failure "SP+ post FAILED: no unlocked account with uid>=1000 exists. This install would produce a machine nobody can log into (DN-27)."
fi

if [ "$post_failures" -gt 0 ]; then
    printf 'SP+ post: %s independent concern(s) failed; see %s/%%post-failed\n' \
        "$post_failures" "$post_state" >&2
    exit 1
fi
printf 'SP+ post: all independent post-install concerns completed\n'
%end
