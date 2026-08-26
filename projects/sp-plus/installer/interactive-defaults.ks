# Bring up the virtual NIC for Anaconda and bootc payload access.
network --bootproto=dhcp --device=link --activate --onboot=on
# The payload is embedded in /var/lib/containers/storage by image-builder.
# Keep /boot as a large real mount so bootc's temporary import directory is
# not created below the root filesystem while bootc validates an empty root.
# This is a POC layout; the scratch space must be replaced by a supported
# disk-backed installer temp path before release.
zerombr
clearpart --all --initlabel --drives=vda
part /boot/efi --fstype=efi --size=1024 --ondisk=vda
part /boot --fstype=ext4 --size=16384 --ondisk=vda
part / --fstype=ext4 --size=32768 --grow --ondisk=vda --encrypted --luks-version=luks2 --passphrase=advisor-poc
bootc --source-imgref containers-storage:localhost/sp-plus:poc --target-imgref localhost/sp-plus:poc
