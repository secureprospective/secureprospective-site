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
