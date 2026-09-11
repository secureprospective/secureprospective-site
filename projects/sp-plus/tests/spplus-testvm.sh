#!/usr/bin/env bash
# spplus-testvm.sh -- build and run a PERSISTENT SP+ test VM for QA.
#
# Unlike spplus-bench.sh (which measures then tears down), this leaves an
# installed, bootable, SSH-reachable VM with a REAL GRAPHICAL SESSION so that
# Discover, Flatpak and the update UX can be tested the way an advisor sees them.
#
#   spplus-testvm.sh install <iso> [name]   fresh unattended install, keeps the VM
#   spplus-testvm.sh up [name]              start it and answer the LUKS prompt
#   spplus-testvm.sh down [name]            graceful shutdown
#   spplus-testvm.sh nuke [name]            destroy + undefine + delete disk
#   spplus-testvm.sh secboot [name]         convert an installed VM to Secure Boot + vTPM
#   spplus-testvm.sh info [name]            ssh/vnc details
#
# Storage lives on /QEMU (root disk), per the 2026-09-03 storage change.
set -uo pipefail

URI="qemu:///session"
V() { virsh -c "$URI" "$@"; }
NAME_DEFAULT="spplus-test"
IMGDIR="/QEMU/images"
VCPUS=4
RAM_MIB=8192
DISK_GIB=60
LUKS_PASS="spplustest"
VM_USER="test"
VM_PASS="testtest"
SSH_PORT=2222
ISO_LABEL="Secureprospective-Advisor-POC"
OWNER_TITLE="spplus-testvm"          # only domains carrying this are ours
PUBKEY_FILE="${PUBKEY_FILE:-$HOME/.ssh/spvm.pub}"
INSTALL_TIMEOUT=5400
SP_KS="$HOME/work/secureprospective-advisor-os/projects/sp-plus/installer/interactive-defaults.ks"
SELFDIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
VMUNLOCK="${VMUNLOCK:-$SELFDIR/vmunlock}"
[ -x "$VMUNLOCK" ] || VMUNLOCK="$HOME/fleet/bin/vmunlock"
SECBOOT="${SECBOOT:-1}"              # after install, convert the domain to Secure Boot firmware
VTPM="${VTPM:-1}"                    # after install, attach an emulated TPM 2.0

say() { printf '[testvm %s] %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
now() { date +%s.%N; }

assert_ours() {   # never touch a domain we did not create
  local dom="$1" t
  V dominfo "$dom" >/dev/null 2>&1 || return 0
  t="$(V dumpxml "$dom" 2>/dev/null | sed -n 's|.*<title>\(.*\)</title>.*|\1|p')"
  [ "$t" = "$OWNER_TITLE" ] || { echo "refusing: domain '$dom' is not ours (title='$t')" >&2; exit 3; }
}

# ------------------------------------------------------------- LUKS autotyper
# The SP+ image draws its unlock prompt on the GRAPHICAL console under Plymouth
# (it boots `rhgb quiet` and defines no serial console), so the passphrase must
# be sent as keystrokes to the video console. Feeding the serial line -- what
# this script did until 2026-09-10 -- types into nothing: sshd never starts and
# the VM looks hung. There is no way to see the prompt from the host, so this
# retries on a timer instead of waiting for a cue. Attempts are bounded because
# each wrong-moment send is a failed cryptsetup attempt.
LUKS_TRIES="${LUKS_TRIES:-8}"
feed_luks() {
  local dom="$1"
  ( sleep 60
    for _ in $(seq 1 "$LUKS_TRIES"); do
      DOM="$dom" "$VMUNLOCK" "$LUKS_PASS" >/dev/null 2>&1 || true
      sleep 45
    done ) &
  LUKS_PID=$!
}
stop_luks() { [ -n "${LUKS_PID:-}" ] && kill "$LUKS_PID" 2>/dev/null; LUKS_PID=""; }

wait_off() {
  local dom="$1" limit="$2" t0; t0=$(date +%s)
  while true; do
    [ "$(V domstate "$dom" 2>/dev/null)" = "shut off" ] && return 0
    [ $(( $(date +%s) - t0 )) -ge "$limit" ] && return 1
    sleep 5
  done
}

# ------------------------------------------------------- kickstart media
make_ks_iso() {
  local dir="$1"
  local ks="$dir/ks.cfg"
  local base="$dir/base.ks"
  mkdir -p "$dir"
  [ -f "$SP_KS" ] || { echo "cannot find $SP_KS" >&2; exit 2; }
  local pubkey=""
  [ -f "$PUBKEY_FILE" ] && pubkey="$(cat "$PUBKEY_FILE")"
  # Ship the SHIPPED kickstart verbatim; only add what an unattended run needs.
  sed -e "s|^autopart .*|& --passphrase=${LUKS_PASS}|" "$SP_KS" > "$base"

  # The shipped kickstart in the working tree names whichever payload was built
  # LAST, not the one inside the ISO being installed. scripts/build-iso.sh drops
  # a payload.env beside each ISO recording the ref it actually verified into
  # that ISO, so follow the media rather than the tree. Without this an install
  # of an older ISO silently deploys a newer payload and reports success.
  local sidecar="$(dirname "$ISO")/payload.env"
  if [ -f "$sidecar" ]; then
    # shellcheck disable=SC1090
    . "$sidecar"
    [ -n "${SP_PAYLOAD:-}" ] || { echo "payload.env at $sidecar names no SP_PAYLOAD" >&2; exit 2; }
    local treeref
    treeref="$(grep -oE 'containers-storage:[^ ]+' "$base" | head -1)"
    if [ "$treeref" != "containers-storage:${SP_PAYLOAD}" ]; then
      say "kickstart ref follows the ISO: ${treeref:-<none>} -> containers-storage:${SP_PAYLOAD}"
      sed -i -E "s|containers-storage:[^ ]+|containers-storage:${SP_PAYLOAD}|" "$base"
    fi
    grep -q "containers-storage:${SP_PAYLOAD}" "$base" \
      || { echo "failed to pin the kickstart to ${SP_PAYLOAD}" >&2; exit 2; }
  else
    echo "REFUSING TO INSTALL: no payload.env beside $ISO." >&2
    echo "That file is written by scripts/build-iso.sh once it has verified the" >&2
    echo "ISO carries the payload it names. Without it this harness would take" >&2
    echo "the payload ref from the working tree, which is rewritten by every" >&2
    echo "build and may name an image this ISO does not contain. Rebuild the" >&2
    echo "ISO with scripts/build-iso.sh <tag>." >&2
    exit 2
  fi
  {
    echo "# DELTA: non-interactive display mode + locale, required by an unattended run"
    echo "cmdline"
    # DELTA: POWER OFF when the install finishes. Without this Anaconda stops at
    # "Installation complete. Press ENTER to quit:", the VM later reboots with the
    # ISO and OEMDRV still attached, and a SECOND unattended install begins --
    # zerombr/clearpart re-partition the disk and destroy the install that just
    # succeeded. Observed 2026-09-03: ESP GUID changed from dbffd483 to 2c88529a
    # and the VM fell through to the UEFI shell with no bootable filesystem.
    echo "poweroff"
    echo "keyboard --xlayouts=us"
    echo "lang en_US.UTF-8"
    echo "timezone America/New_York --utc"
    echo "# DELTA: the account an operator would create in the user spoke"
    echo "user --name=${VM_USER} --password=${VM_PASS} --plaintext --groups=wheel"
    # DELTA: NO `sshkey` LINE. Anaconda's sshkey command is a SILENT NO-OP on
    # bootc -- measured 2026-09-03: it parses the key, runs SetSshKeysTask, logs
    # "Thread Done" with no error, and writes nothing, because the account is
    # materialised at FIRST BOOT from 01_users.cfg roughly two minutes AFTER the
    # key is written. The key goes in via %post below, into /etc, which exists
    # during %post and is carried into the deployment. Same mechanism as
    # installer/operator-key.ks.example, so this install also PROVES that file.
    # The shipped kickstart follows, verbatim except the autopart passphrase.
    cat "$base"
    echo "# DELTA: passwordless sudo so QA automation is not blocked on a prompt"
    cat <<'POSTBLOCK'
%post --interpreter=/bin/bash --log=/root/spplus-testvm-post.log
echo 'test ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/99-spplus-testvm
chmod 0440 /etc/sudoers.d/99-spplus-testvm
systemctl enable sshd.service || true
%end
POSTBLOCK
    # The operator key, by the mechanism that actually works. Written here rather
    # than in the block above because it needs $pubkey interpolated.
    if [ -n "$pubkey" ]; then
      cat <<POSTKEY
%post --erroronfail --interpreter=/bin/bash --log=/root/spplus-testvm-key.log
set -euo pipefail
install -d -m 755 /etc/ssh/authorized_keys.d
printf '%s\\n' "${pubkey}" > /etc/ssh/authorized_keys.d/${VM_USER}
chmod 644 /etc/ssh/authorized_keys.d/${VM_USER}
printf 'AuthorizedKeysFile .ssh/authorized_keys /etc/ssh/authorized_keys.d/%%u\\n' \\
  > /etc/ssh/sshd_config.d/46-sp-plus-operator.conf
chmod 644 /etc/ssh/sshd_config.d/46-sp-plus-operator.conf
restorecon -RF /etc/ssh/authorized_keys.d /etc/ssh/sshd_config.d 2>/dev/null || :
test -s /etc/ssh/authorized_keys.d/${VM_USER}
echo "TESTVM OPERATOR KEY INSTALLED for ${VM_USER}"
%end
POSTKEY
    fi
  } > "$ks"
  ( cd "$dir" && xorrisofs -quiet -V OEMDRV -o oemdrv.iso ks.cfg ) \
    || { echo "failed to build oemdrv.iso" >&2; exit 4; }
  say "kickstart media: $dir/oemdrv.iso"
}

extract_boot_files() {
  local d="$1"
  mkdir -p "$d"
  xorriso -osirrox on -indev "$ISO" -extract /images/pxeboot "$d" >/dev/null 2>&1
  KERNEL="$d/vmlinuz"; INITRD="$d/initrd.img"
  [ -f "$KERNEL" ] && [ -f "$INITRD" ]
}

add_port_forward() {   # libvirt >=9 portForward; survives reboots, unlike hostfwd_add
  local dom="$1"
  V dumpxml "$dom" | grep -q "<portForward" && { say "port forward already present"; return 0; }
  local tmp; tmp="$(mktemp)"
  V dumpxml "$dom" > "$tmp"
  python3 - "$tmp" "$SSH_PORT" <<'PY'
import sys, xml.etree.ElementTree as ET
path, port = sys.argv[1], sys.argv[2]
t = ET.parse(path); r = t.getroot()
for iface in r.iter('interface'):
    if iface.get('type') == 'user':
        # portForward is ONLY supported on the passt backend of interface type='user'.
        # Without this the define fails: "The <portForward> element can only be used
        # with the 'passt' backend". passt also survives reboots, unlike the
        # qemu-monitor hostfwd_add trick, which is lost on every shutdown.
        if iface.find('backend') is None:
            ET.SubElement(iface, 'backend', {'type': 'passt'})
        pf = ET.SubElement(iface, 'portForward', {'proto': 'tcp'})
        ET.SubElement(pf, 'range', {'start': port, 'to': '22'})
        break
t.write(path)
PY
  V define "$tmp" >/dev/null && say "port forward added: 127.0.0.1:${SSH_PORT} -> guest 22" || { echo "PORT FORWARD FAILED -- ssh to the VM will not work" >&2; V define "$tmp"; }
  rm -f "$tmp"
}

# --------------------------------------------------- secure boot + vTPM
# WHY THIS IS A POST-INSTALL STEP AND NOT AN INSTALL FLAG.
# do_install boots the installer by DIRECT KERNEL LOAD (--boot kernel=,initrd=).
# Under enforcing Secure Boot the firmware verifies that kernel against db, and
# db holds Microsoft's keys. Fedora's kernel is signed by Fedora's key, which
# lives in shim's vendor cert, not in db -- so a direct-kernel install cannot
# boot with Secure Boot on. The INSTALLED system boots the real chain
# (shim, signed by Microsoft -> grub -> kernel, both verified by shim), which is
# exactly the path a Dell takes. So: install with the firmware off, then convert.
enable_secboot() {
  local dom="$1" tmp
  tmp="$(mktemp)"
  V dumpxml "$dom" > "$tmp"
  python3 - "$tmp" "${VTPM}" <<'PY'
import sys, xml.etree.ElementTree as ET
path, vtpm = sys.argv[1], sys.argv[2] == "1"
t = ET.parse(path); r = t.getroot()

os_el = r.find('os')
# Drop the concrete loader/nvram so libvirt re-selects from its firmware
# descriptors instead of reusing the non-secboot pair chosen at install.
for tag in ('loader', 'nvram'):
    for el in os_el.findall(tag):
        os_el.remove(el)
for el in os_el.findall('firmware'):
    os_el.remove(el)
os_el.set('firmware', 'efi')
fw = ET.SubElement(os_el, 'firmware')
# enrolled-keys pulls the varstore that already contains Microsoft's KEK and db.
# Without it the machine boots in Setup Mode and reports Secure Boot disabled.
ET.SubElement(fw, 'feature', {'enabled': 'yes', 'name': 'enrolled-keys'})
ET.SubElement(fw, 'feature', {'enabled': 'yes', 'name': 'secure-boot'})

# Secure Boot needs SMM, or the varstore is writable from the guest and the
# whole guarantee is theatre.
feats = r.find('features')
if feats is None:
    feats = ET.SubElement(r, 'features')
for el in feats.findall('smm'):
    feats.remove(el)
ET.SubElement(feats, 'smm', {'state': 'on'})

devs = r.find('devices')
for el in devs.findall('tpm'):
    devs.remove(el)
if vtpm:
    tpm = ET.SubElement(devs, 'tpm', {'model': 'tpm-crb'})
    ET.SubElement(tpm, 'backend', {'type': 'emulator', 'version': '2.0'})

t.write(path)
PY
  # libvirt copies the varstore template only when the target file is absent.
  rm -f "$HOME/.config/libvirt/qemu/nvram/${dom}_VARS.fd"
  if V define "$tmp" >/dev/null 2>&1; then
    say "secure boot firmware attached$( [ "$VTPM" = 1 ] && echo ' + vTPM 2.0')"
    rm -f "$tmp"
    return 0
  fi
  echo "SECURE BOOT CONVERSION FAILED -- domain left as it was" >&2
  V define "$tmp"
  rm -f "$tmp"
  return 1
}

# ------------------------------------------------------------------ install
do_install() {
  ISO="${1:?usage: spplus-testvm.sh install <iso> [name]}"
  local dom="${2:-$NAME_DEFAULT}"
  [ -f "$ISO" ] || { echo "no such ISO: $ISO" >&2; exit 2; }
  mkdir -p "$IMGDIR"
  local disk="$IMGDIR/${dom}.qcow2"
  local stamp; stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  local logdir="$HOME/logs/sp-plus/testvm/${stamp}"
  mkdir -p "$logdir"
  local raw="$logdir/install.serial"

  assert_ours "$dom"
  V destroy "$dom" >/dev/null 2>&1
  V undefine "$dom" --nvram >/dev/null 2>&1
  # Only ever delete inside our own image dir, and only our own name.
  case "$disk" in "$IMGDIR/${dom}.qcow2") rm -f "$disk" ;; *) echo "refusing to delete $disk" >&2; exit 3 ;; esac

  qemu-img create -q -f qcow2 "$disk" "${DISK_GIB}G"
  extract_boot_files "$logdir/isoboot" || { echo "could not extract kernel/initrd from ISO" >&2; exit 4; }
  make_ks_iso "$logdir/ksmedia"

  say "installing $dom from $(basename "$ISO") -- this takes ~9 minutes"
  virt-install --connect "$URI" --name "$dom" --metadata title="$OWNER_TITLE" \
    --memory "$RAM_MIB" --vcpus "$VCPUS" --cpu host-passthrough \
    --osinfo detect=off,require=off --machine q35 \
    --disk "path=$disk,bus=virtio,format=qcow2" \
    --disk "path=$ISO,device=cdrom,readonly=on" \
    --disk "path=$logdir/ksmedia/oemdrv.iso,device=cdrom,readonly=on" \
    --network user,model=virtio \
    --graphics spice,listen=127.0.0.1 --video qxl \
    --tpm none --serial "pty,log.file=$raw" \
    --check disk_size=off --noreboot \
    --boot "firmware=efi,firmware.feature0.name=secure-boot,firmware.feature0.enabled=no,firmware.feature1.name=enrolled-keys,firmware.feature1.enabled=no,kernel=$KERNEL,initrd=$INITRD,kernel_args=inst.stage2=hd:LABEL=${ISO_LABEL} selinux=0 ip=dhcp console=ttyS0,115200 inst.text inst.ks=hd:LABEL=OEMDRV:/ks.cfg" \
    >/dev/null 2>&1 || { echo "virt-install failed to define $dom" >&2; exit 5; }

  V start "$dom" >/dev/null || { echo "failed to start $dom" >&2; exit 5; }
  if ! wait_off "$dom" "$INSTALL_TIMEOUT"; then
    echo "INSTALL TIMED OUT after ${INSTALL_TIMEOUT}s -- serial log: $raw" >&2
    exit 6
  fi
  if ! grep -qE 'Installation complete|Congratulations|SP\+ post: all independent' "$raw"; then
    echo "INSTALL FINISHED WITHOUT A COMPLETION MARKER -- serial log: $raw" >&2
    echo "last 20 console lines:" >&2; tail -20 "$raw" >&2
    exit 7
  fi

  # Strip the direct-kernel install boot and both install CD-ROMs so the VM
  # boots the INSTALLED system from now on.
  virt-xml --connect "$URI" "$dom" --edit --boot kernel=,initrd=,kernel_args= >/dev/null
  virt-xml --connect "$URI" "$dom" --remove-device --disk 3 >/dev/null
  virt-xml --connect "$URI" "$dom" --remove-device --disk 2 >/dev/null
  add_port_forward "$dom"
  [ "$SECBOOT" = 1 ] && enable_secboot "$dom"
  say "INSTALL OK. serial log: $raw"
  echo "$logdir" > "$HOME/.spplus-testvm-lastlog"
  do_info "$dom"
}

do_up() {
  local dom="${1:-$NAME_DEFAULT}"
  assert_ours "$dom"
  [ "$(V domstate "$dom" 2>/dev/null)" = "running" ] && { say "$dom already running"; do_info "$dom"; return 0; }
  local raw; raw="$HOME/logs/sp-plus/testvm/boot-$(date -u +%Y%m%dT%H%M%SZ).serial"
  mkdir -p "$(dirname "$raw")"
  virt-xml --connect "$URI" "$dom" --edit --serial "pty,log.file=$raw" >/dev/null
  V start "$dom" >/dev/null || { echo "failed to start $dom" >&2; exit 5; }
  feed_luks "$dom"
  say "started; answering LUKS prompt, waiting for sshd on 127.0.0.1:${SSH_PORT}"
  local t0; t0=$(date +%s)
  while [ $(( $(date +%s) - t0 )) -lt 600 ]; do
    # -i is not optional. Without it this probe offers only the default keys,
    # never succeeds, and `up` reports "SSH never came up" on a VM that is in
    # fact up -- which is how the 2026-09-10 "hang" read a second time, even
    # after the LUKS half of it was fixed.
    if ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
           -o ConnectTimeout=3 -o BatchMode=yes -p "$SSH_PORT" \
           -i "${PUBKEY_FILE%.pub}" \
           "${VM_USER}@127.0.0.1" true 2>/dev/null; then
      stop_luks; say "SSH IS UP after $(( $(date +%s) - t0 ))s"; do_info "$dom"; return 0
    fi
    sleep 5
  done
  stop_luks
  echo "VM started but SSH never came up. serial log: $raw" >&2
  tail -20 "$raw" >&2
  exit 8
}

do_down() { local dom="${1:-$NAME_DEFAULT}"; assert_ours "$dom"; V shutdown "$dom" >/dev/null 2>&1; say "shutdown signalled to $dom"; }

do_nuke() {
  local dom="${1:-$NAME_DEFAULT}"; assert_ours "$dom"
  V destroy "$dom" >/dev/null 2>&1; V undefine "$dom" --nvram >/dev/null 2>&1
  case "$IMGDIR/${dom}.qcow2" in "$IMGDIR/${dom}.qcow2") rm -f "$IMGDIR/${dom}.qcow2" ;; esac
  say "removed $dom"
}

do_info() {
  local dom="${1:-$NAME_DEFAULT}"
  echo "domain:   $dom  ($(V domstate "$dom" 2>/dev/null || echo undefined))"
  echo "disk:     $IMGDIR/${dom}.qcow2"
  echo "ssh:      ssh -p ${SSH_PORT} -i ${PUBKEY_FILE%.pub} ${VM_USER}@127.0.0.1   # password: ${VM_PASS}, passwordless sudo"
  echo "graphics: virsh -c ${URI} domdisplay ${dom}   -> $(V domdisplay "$dom" 2>/dev/null || echo n/a)"
  echo "luks:     ${LUKS_PASS}"
}

case "${1:-}" in
  install) shift; do_install "$@" ;;
  up)      shift; do_up "$@" ;;
  down)    shift; do_down "$@" ;;
  nuke)    shift; do_nuke "$@" ;;
  secboot) shift; assert_ours "${1:-$NAME_DEFAULT}"; enable_secboot "${1:-$NAME_DEFAULT}" ;;
  info)    shift; do_info "$@" ;;
  *) sed -n '2,15p' "$0" >&2; exit 2 ;;
esac
