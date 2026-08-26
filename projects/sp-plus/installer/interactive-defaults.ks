# Bring up the virtual NIC for Anaconda and bootc payload access.
network --bootproto=dhcp --device=link --activate --onboot=on

# Storage is deliberately automatic. %pre selects the largest non-removable,
# writable disk and emits these commands before Anaconda parses %include. The
# installer never presents a storage choice, so the declared encrypted layout
# cannot be silently replaced by an operator's automatic-partitioning choice.
%pre --interpreter=/bin/bash --erroronfail --log=/tmp/spplus-ks-pre.log
set -euo pipefail

# The ISO is a read-only optical device and removable media are excluded. Pick
# the largest remaining writable disk: this is the appliance's internal disk on
# both QEMU virtio (vda) and QEMU SATA/Dell (sda). Refuse to guess if none exists.
disk="$(lsblk -dn -b -o NAME,TYPE,RM,RO,TRAN,SIZE \
    | awk '$2 == "disk" && $3 == 0 && $4 == 0 && $5 != "usb" { print $1, $6 }' \
    | sort -k2,2nr | head -n1 | awk '{ print $1 }')"
[ -n "$disk" ] || { echo "SP+ storage: no eligible writable non-removable disk" >&2; exit 1; }
printf 'SP+ storage: selected /dev/%s\n' "$disk" >&2

cat > /tmp/spplus-storage.ks <<EOF
zerombr
ignoredisk --only-use=$disk
clearpart --all --initlabel --drives=$disk
part /boot/efi --fstype=efi --size=1024 --ondisk=$disk
part /boot --fstype=xfs --size=16384 --ondisk=$disk
part /var/home --fstype=ext4 --size=16384 --ondisk=$disk --encrypted --luks-version=luks2
part / --fstype=ext4 --size=32768 --grow --ondisk=$disk --encrypted --luks-version=luks2
EOF
%end
%include /tmp/spplus-storage.ks

# No --passphrase is intentional: Anaconda must ask the operator for the LUKS
# passphrase. It is never stored in this kickstart, image, repository, build
# argument, or git history. /boot and the ESP remain unencrypted; root and
# /var/home are independently LUKS2 encrypted.
bootc --source-imgref containers-storage:localhost/sp-plus-kde:spike --target-imgref ghcr.io/secureprospective/sp-plus-kde:edge

# Explicitly settle account spokes without embedding a password. The advisor
# account is usable after a password is assigned, and its persistent home is
# created below on /var/home. The root account remains deliberately locked.
rootpw --lock
user --name=advisor --groups=wheel --shell=/bin/bash --homedir=/var/home/advisor --lock

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
