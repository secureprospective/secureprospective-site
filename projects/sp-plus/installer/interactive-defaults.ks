# Bring up the virtual NIC for Anaconda and bootc payload access.
network --bootproto=dhcp --device=link --activate --onboot=on
# The payload is embedded in /var/lib/containers/storage by image-builder.
# Keep /boot as a disk-backed filesystem so bootc's temporary import directory
# is not created below the installer RAM filesystem. XFS avoids ext4's
# auto-created lost+found directory, which bootc rejects on an empty root.
zerombr
clearpart --all --initlabel --drives=vda
part /boot/efi --fstype=efi --size=1024 --ondisk=vda
part /boot --fstype=xfs --size=16384 --ondisk=vda
part /var/home --fstype=ext4 --size=16384 --ondisk=vda --encrypted --luks-version=luks2
part / --fstype=ext4 --size=32768 --grow --ondisk=vda --encrypted --luks-version=luks2
bootc --source-imgref containers-storage:localhost/sp-plus-kde:spike --target-imgref ghcr.io/secureprospective/sp-plus-kde:edge

# Anaconda copies the installer command line into the installed boot entry. Keep
# the installer-only SELinux and serial-console workarounds out of the target.
# Also establish the desktop target and ensure accounts created by the GUI have
# their /home directories on the persistent /var/home filesystem.
%post
if ! command -v grubby >/dev/null 2>&1; then
    echo "SP+ post: grubby is required to remove installer kernel arguments" >&2
    exit 1
fi
grubby --update-kernel=ALL --remove-args="selinux=0 console=ttyS0,115200 console=tty0"
systemctl set-default graphical.target
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
