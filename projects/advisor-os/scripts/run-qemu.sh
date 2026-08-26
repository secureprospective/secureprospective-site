#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

MODE=${QEMU_MODE:-disk}
DISK=${QEMU_DISK:-$ROOT/artifacts/qcow2/disk.qcow2}
ISO=${QEMU_ISO:-$ROOT/artifacts/iso/advisor-os-installer-latest.iso}
if [[ ! -f "$ISO" && -f "$ROOT/artifacts/iso/advisor-os-installer.iso" ]]; then
  ISO=$ROOT/artifacts/iso/advisor-os-installer.iso
fi
if [[ "$MODE" == "iso" ]]; then
  [[ -f "$ISO" ]] || { echo "Missing $ISO. Run ./scripts/build-iso.sh first." >&2; exit 2; }
  command -v qemu-img >/dev/null || { echo 'qemu-img is required for ISO mode.' >&2; exit 2; }
  DISK=${QEMU_INSTALL_DISK:-$ROOT/artifacts/qemu-install.qcow2}
  [[ -f "$DISK" ]] || qemu-img create -f qcow2 "$DISK" "${QEMU_INSTALL_SIZE:-80G}" >/dev/null
else
  [[ -f "$DISK" ]] || { echo "Missing $DISK. Run ./scripts/build-qcow2.sh first." >&2; exit 2; }
fi
command -v qemu-system-x86_64 >/dev/null || { echo 'qemu-system-x86_64 is required.' >&2; exit 2; }
command -v swtpm >/dev/null || { echo 'swtpm is required for the virtual TPM test.' >&2; exit 2; }

OVMF_CODE=${OVMF_CODE:-/usr/share/OVMF/OVMF_CODE_4M.fd}
OVMF_VARS_TEMPLATE=${OVMF_VARS_TEMPLATE:-/usr/share/OVMF/OVMF_VARS_4M.fd}
[[ -f "$OVMF_CODE" && -f "$OVMF_VARS_TEMPLATE" ]] || { echo 'OVMF_CODE.fd and OVMF_VARS.fd are required.' >&2; exit 2; }

RUNTIME=$ROOT/artifacts/qemu-runtime
mkdir -p "$RUNTIME"
cp "$OVMF_VARS_TEMPLATE" "$RUNTIME/OVMF_VARS.fd"
rm -f "$RUNTIME/swtpm.sock"
swtpm socket --tpm2 --tpmstate dir="$RUNTIME" --ctrl type=unixio,path="$RUNTIME/swtpm.sock" --pid file="$RUNTIME/swtpm.pid" --daemon
trap 'if [[ -f "$RUNTIME/swtpm.pid" ]]; then kill "$(cat "$RUNTIME/swtpm.pid")" 2>/dev/null || true; fi; rm -f "$RUNTIME/swtpm.sock" "$RUNTIME/swtpm.pid"' EXIT

ACCEL=(-accel tcg)
if [[ -r /dev/kvm && -w /dev/kvm ]]; then ACCEL=(-enable-kvm -cpu host); fi
DISPLAY_ARGS=(-display gtk)
if [[ ${QEMU_HEADLESS:-0} == 1 ]]; then DISPLAY_ARGS=(-nographic -serial mon:stdio); fi

NIC=(-nic user,model=virtio-net-pci)
if [[ ${QEMU_RPC_FORWARD:-0} == 1 ]]; then
  NIC=(-nic user,model=virtio-net-pci,hostfwd=tcp:127.0.0.1:18765-127.0.0.1:8765)
fi

STORAGE=(-drive file="$DISK",if=virtio,format=qcow2)
if [[ "$MODE" == "disk" ]]; then
  STORAGE=(-drive file="$DISK",if=virtio,format=qcow2,snapshot=on)
else
  STORAGE+=(-cdrom "$ISO")
fi

qemu-system-x86_64 \
  "${ACCEL[@]}" -machine q35 -m "${QEMU_MEMORY:-8192}" -smp "${QEMU_CPUS:-4}" \
  -drive if=pflash,format=raw,readonly=on,file="$OVMF_CODE" \
  -drive if=pflash,format=raw,file="$RUNTIME/OVMF_VARS.fd" \
  "${STORAGE[@]}" \
  -chardev socket,id=chrtpm,path="$RUNTIME/swtpm.sock" \
  -tpmdev emulator,id=tpm0,chardev=chrtpm \
  -device tpm-tis,tpmdev=tpm0 \
  "${NIC[@]}" \
  "${DISPLAY_ARGS[@]}"
