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
user --name=advisor --groups=wheel --shell=/bin/bash --homedir=/var/home/advisor --password=$6$spplus6$NZd8ZxrNGASEd/mYfwmWBttEe1UF7LCKx5EVmD8PIh/c1Qgo0I6M1.3CLvoORb5UUQVbRI55ucYG4iSG5YFLg0 --iscrypted

# Anaconda copies the installer command line into the installed boot entry. Keep
# the installer-only SELinux and serial-console workarounds out of the target.
%post
if ! command -v grubby >/dev/null 2>&1; then
    echo "SP+ post: grubby is required to remove installer kernel arguments" >&2
    exit 1
fi
grubby --update-kernel=ALL --remove-args="selinux=0 console=ttyS0,115200 console=tty0"
systemctl set-default graphical.target

if getent passwd advisor >/dev/null 2>&1; then
    advisor_home="$(getent passwd advisor | cut -d: -f6)"
    mkdir -p "$advisor_home"
    chown advisor:advisor "$advisor_home"
    chmod 700 "$advisor_home"
    command -v restorecon >/dev/null 2>&1 && restorecon -RF "$advisor_home" || true
fi
while IFS=: read -r name _ uid gid _ home shell; do
    case "$home" in
        /home/*)
            mkdir -p "$home"
            chown "$uid:$gid" "$home"
            chmod 700 "$home"
            command -v restorecon >/dev/null 2>&1 && restorecon -RF "$home" || true
            ;;
    esac
done < /etc/passwd
%end
