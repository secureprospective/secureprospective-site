#!/usr/bin/env bash
# SP+ FIELD INSPECTION - run identically on QEMU and on bare metal.
# Fixed section order, fixed key names, closed status vocabulary, volatile values
# quarantined at the end so two reports diff cleanly. See ledger OP-09.
# Status vocabulary: OK | PROBLEM | UNKNOWN | SKIPPED_NEEDS_ROOT
LC_ALL=C; export LC_ALL
r() { printf '%-34s %-22s %s\n' "$1" "$2" "$3"; }
have() { command -v "$1" >/dev/null 2>&1; }
ROOT=no; [ "$(id -u)" = 0 ] && ROOT=yes
SECURITY_FAIL=0

echo "############ SP+ FIELD INSPECTION v1 ############"
echo "# schema=1  run_as_root=$ROOT"
echo

echo "=== 1. IDENTITY ==="
r os_name "$(. /etc/os-release 2>/dev/null; echo "${NAME:-UNKNOWN}")" ""
r os_version "$(. /etc/os-release 2>/dev/null; echo "${VERSION_ID:-UNKNOWN}")" ""
r os_variant "$(. /etc/os-release 2>/dev/null; echo "${VARIANT_ID:-UNKNOWN}")" ""
r kernel "$(uname -r)" ""
r arch "$(uname -m)" ""
echo

echo "=== 2. SELINUX (DN-04: installed system MUST be Enforcing) ==="
if have getenforce; then
  ge=$(getenforce 2>/dev/null)
  if [ "$ge" = "Enforcing" ]; then r selinux_mode "$ge" OK; else r selinux_mode "$ge" PROBLEM; SECURITY_FAIL=1; fi
else
  r selinux_mode absent PROBLEM
  SECURITY_FAIL=1
fi
if grep -qw "selinux=0" /proc/cmdline 2>/dev/null; then
  r selinux_arg_leaked yes PROBLEM
  SECURITY_FAIL=1
else
  r selinux_arg_leaked no OK
fi
echo

echo "=== 3. BOOTC / IMAGE MODE ==="
if have bootc; then
  src=$(bootc status --json 2>/dev/null | grep -o '"image":"[^"]*"' | head -1 | cut -d'"' -f4)
  [ -n "$src" ] && r bootc_booted_image "$src" OK || r bootc_booted_image UNKNOWN UNKNOWN
  bootc status 2>/dev/null | sed 's/^/    /' | head -25
else
  r bootc_binary absent PROBLEM
fi
echo

echo "=== 4. ENCRYPTION (D34: LUKS2 on root + user data) ==="
if have lsblk; then
  lsblk -o NAME,TYPE,FSTYPE,SIZE,MOUNTPOINT 2>/dev/null | sed 's/^/    /'
  n=$(lsblk -o FSTYPE 2>/dev/null | grep -c crypto_LUKS)
  if [ "$n" -ge 1 ]; then r luks_containers "$n" OK; else r luks_containers 0 PROBLEM; SECURITY_FAIL=1; fi
else
  r luks_containers absent PROBLEM
  SECURITY_FAIL=1
fi
version_count=0
if [ "$ROOT" = yes ] && have cryptsetup; then
  for d in $(lsblk -pnro NAME,FSTYPE 2>/dev/null | awk '$2=="crypto_LUKS"{print $1}'); do
    version_count=$((version_count + 1))
    v=$(cryptsetup luksDump "$d" 2>/dev/null | awk '/^Version/{print $2}')
    if [ "$v" = "2" ]; then r "luks_version($d)" "luks$v" OK
    else r "luks_version($d)" "luks${v:-?}" PROBLEM; SECURITY_FAIL=1
    fi
  done
  if [ "$version_count" -eq 0 ]; then
    r luks_version absent PROBLEM
    SECURITY_FAIL=1
  fi
else
  r luks_version absent PROBLEM
  SECURITY_FAIL=1
fi
echo

echo "=== 5. SECURE BOOT / TPM ==="
if have mokutil; then
  sb=$(mokutil --sb-state 2>/dev/null | head -1)
  r secureboot "${sb:-UNKNOWN}" ""
else
  if [ -d /sys/firmware/efi ]; then
    v=$(od -An -t u1 /sys/firmware/efi/efivars/SecureBoot-* 2>/dev/null | awk '{print $5}')
    case "$v" in 1) r secureboot enabled OK;; 0) r secureboot disabled PROBLEM;; *) r secureboot UNKNOWN UNKNOWN;; esac
  else
    r firmware BIOS_or_no_efivars UNKNOWN
  fi
fi
[ -d /sys/firmware/efi ] && r firmware UEFI OK || r firmware legacy_BIOS PROBLEM
if ls /dev/tpm* >/dev/null 2>&1; then r tpm_device present OK; else r tpm_device absent UNKNOWN; fi
if have systemd-cryptenroll && [ "$ROOT" = yes ]; then
  for d in $(lsblk -pnro NAME,FSTYPE 2>/dev/null | awk '$2=="crypto_LUKS"{print $1}'); do
    t=$(cryptsetup luksDump "$d" 2>/dev/null | grep -c "systemd-tpm2")
    [ "$t" -gt 0 ] && r "tpm2_enrolled($d)" yes OK || r "tpm2_enrolled($d)" no UNKNOWN
  done
fi
echo

echo "=== 6. GRAPHICAL SESSION (SP+ ships KDE Plasma) ==="
dt=$(systemctl get-default 2>/dev/null)
r default_target "${dt:-UNKNOWN}" "$([ "$dt" = graphical.target ] && echo OK || echo PROBLEM)"
for u in sddm gdm plasma-workspace; do
  if systemctl list-unit-files 2>/dev/null | grep -q "^${u}.service"; then
    st=$(systemctl is-enabled ${u}.service 2>/dev/null)
    r "unit_${u}" "${st:-unknown}" ""
  fi
done
have startplasma-wayland && r plasma_binary present OK || r plasma_binary absent PROBLEM
echo

echo "=== 7. FAILED UNITS ==="
if have systemctl; then
  f=$(systemctl --failed --no-legend --no-pager 2>/dev/null | wc -l)
  [ "$f" -eq 0 ] && r failed_units 0 OK || r failed_units "$f" PROBLEM
  systemctl --failed --no-legend --no-pager 2>/dev/null | sed 's/^/    /'
fi
echo

echo "=== 8. NETWORK / TIME ==="
r hostname_set "$(hostnamectl --static 2>/dev/null || echo UNKNOWN)" ""
have nmcli && r nm_connectivity "$(nmcli -t -f CONNECTIVITY general 2>/dev/null)" ""
r ntp_sync "$(timedatectl show -p NTPSynchronized --value 2>/dev/null || echo UNKNOWN)" ""
echo

echo "=== 9. STORAGE LAYOUT ==="
df -hT -x tmpfs -x devtmpfs 2>/dev/null | sed 's/^/    /'
echo

echo "=== 10. HARDWARE (expected to differ QEMU vs Dell - not a defect) ==="
r cpu_model "$(awk -F: '/model name/{print $2; exit}' /proc/cpuinfo | sed 's/^ //')" ""
r cpu_threads "$(nproc)" ""
r mem_total "$(awk '/MemTotal/{printf "%.1f GB", $2/1048576}' /proc/meminfo)" ""
have lspci && r gpu "$(lspci 2>/dev/null | grep -iE 'vga|3d' | head -1 | cut -d: -f3- | sed 's/^ //')" ""
r virtualized "$(systemd-detect-virt 2>/dev/null || echo unknown)" ""
echo

echo "=== 11. VOLATILE (ignore in diffs) ==="
r captured_at "$(date -u +%FT%TZ)" ""
r uptime "$(uptime -p 2>/dev/null)" ""
r machine_id "$(cat /etc/machine-id 2>/dev/null)" ""
echo "############ END ############"
if [ "$SECURITY_FAIL" -ne 0 ]; then
  echo "FIELD INSPECTION: SECURITY GATE FAIL (SELinux/encryption properties require remediation)" >&2
  exit 1
fi
