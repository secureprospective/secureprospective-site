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
PRODUCT_FAIL=0

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

echo "=== 10a. SP+ CALM THEME (DN-27: the shipped default look) ==="
# The build gates prove the FILES are installed. Only a booted machine can prove
# the look was APPLIED, which is the DN-24 distinction: naming a look-and-feel in
# kdeglobals is not applying it. Read the user's own config, not /etc.
CALM=org.secureprospective.spplus.calm.dark
r calm_lnf_installed "$([ -d /usr/share/plasma/look-and-feel/$CALM ] && echo yes || echo no)" \
  "$([ -d /usr/share/plasma/look-and-feel/$CALM ] && echo OK || echo PROBLEM)"
r calm_colors_installed "$([ -f /usr/share/color-schemes/SPPlusCalmDark.colors ] && echo yes || echo no)" \
  "$([ -f /usr/share/color-schemes/SPPlusCalmDark.colors ] && echo OK || echo PROBLEM)"
r calm_wallpaper_ladder "$(ls /usr/share/wallpapers/SPPlus-Calm/contents/images/ 2>/dev/null | wc -l)" ""
r paper_icons "$([ -d /usr/share/icons/Paper-Mono-Dark ] && echo yes || echo no)" \
  "$([ -d /usr/share/icons/Paper-Mono-Dark ] && echo OK || echo PROBLEM)"
for face in "Noto Sans" "IBM Plex Sans" "JetBrains Mono"; do
  key="font_$(echo "$face" | tr 'A-Z ' 'a-z_')"
  if fc-list : family 2>/dev/null | grep -qi "$face"; then r "$key" present OK; else r "$key" MISSING PROBLEM; fi
done
# Aurorae must carry no trace of the retired Mars-coral accent.
if grep -rqi 'ff704c\|c4462e\|9d3d2a' /usr/share/aurorae/themes/spplus-calm-*/ 2>/dev/null; then
  r calm_orange_residue found PROBLEM
else
  r calm_orange_residue none OK
fi
# Per-user application. Absence here is the DN-24 failure, not a cosmetic nit.
U_KDEGLOBALS="$HOME/.config/kdeglobals"
if [ -r "$U_KDEGLOBALS" ]; then
  applied=$(grep -m1 '^LookAndFeelPackage=' "$U_KDEGLOBALS" 2>/dev/null | cut -d= -f2)
  scheme=$(grep -m1 '^ColorScheme=' "$U_KDEGLOBALS" 2>/dev/null | cut -d= -f2)
  [ "$applied" = "$CALM" ] && r calm_applied_to_user "$applied" OK || { r calm_applied_to_user "${applied:-none}" PROBLEM; PRODUCT_FAIL=1; }
  [ "$scheme" = "SPPlusCalmDark" ] && r calm_scheme_applied "$scheme" OK || { r calm_scheme_applied "${scheme:-none}" PROBLEM; PRODUCT_FAIL=1; }
else
  r calm_applied_to_user unreadable UNKNOWN
  PRODUCT_FAIL=1
fi
KWINRC="$HOME/.config/kwinrc"
if [ -r "$KWINRC" ]; then
  calm_library=$(awk -F= '/^\[org\.kde\.kdecoration2\]/{f=1;next} /^\[/{f=0} f&&$1=="library"{print $2;exit}' "$KWINRC")
  calm_theme=$(awk -F= '/^\[org\.kde\.kdecoration2\]/{f=1;next} /^\[/{f=0} f&&$1=="theme"{print $2;exit}' "$KWINRC")
  [ "$(grep -m1 '^widgetStyle=' "$U_KDEGLOBALS" 2>/dev/null | cut -d= -f2)" = "Breeze" ] \
    && r calm_widget_style Breeze OK \
    || { r calm_widget_style "$(grep -m1 '^widgetStyle=' "$U_KDEGLOBALS" 2>/dev/null | cut -d= -f2)" PROBLEM; PRODUCT_FAIL=1; }
  [ "$calm_library" = "org.kde.kwin.aurorae.v2" ] \
    && r calm_decoration_library "$calm_library" OK \
    || { r calm_decoration_library "${calm_library:-none}" PROBLEM; PRODUCT_FAIL=1; }
  [ "$calm_theme" = "__aurorae__svg__spplus-calm-dark" ] \
    && r calm_decoration_theme "$calm_theme" OK \
    || { r calm_decoration_theme "${calm_theme:-none}" PROBLEM; PRODUCT_FAIL=1; }
else
  r calm_widget_style unreadable UNKNOWN
  r calm_decoration_library unreadable UNKNOWN
  r calm_decoration_theme unreadable UNKNOWN
  PRODUCT_FAIL=1
fi
APPLETS="$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"
if [ -r "$APPLETS" ]; then
  grep -q 'SPPlus-Calm' "$APPLETS" && r calm_wallpaper_applied yes OK || { r calm_wallpaper_applied no PROBLEM; PRODUCT_FAIL=1; }
else
  r calm_wallpaper_applied unreadable UNKNOWN
  PRODUCT_FAIL=1
fi
STAMP="${XDG_STATE_HOME:-$HOME/.local/state}/sp-plus/first-login-theme-applied"
r first_login_stamp "$([ -e "$STAMP" ] && cat "$STAMP" || echo absent)" ""
echo

echo "=== 10b. SHARE DISCOVERY, STORE, AND WELCOME (DN-26) ==="
# wsdd has never been watched reaching active on a booted machine. The drop-in
# clears an upstream BindsTo=smb.service that would otherwise make it unstartable,
# and quotes OPTIONS so systemd does not split on spaces and drop --no-host,
# which would put wsdd in HOST mode advertising the advisor to the office network.
wsdd_state=$(systemctl is-active wsdd.service 2>/dev/null || echo unknown)
[ "$wsdd_state" = active ] && r wsdd_active "$wsdd_state" OK || { r wsdd_state_bad "$wsdd_state" PROBLEM; PRODUCT_FAIL=1; }
if [ "$ROOT" = yes ]; then
  # --no-host must be in the RUNNING process, not merely in the drop-in file.
  if pgrep -a -f '[w]sdd' >/dev/null 2>&1; then
    pgrep -a -f '[w]sdd' | grep -q -- '--no-host' \
      && r wsdd_no_host_live yes OK || { r wsdd_no_host_live NO PROBLEM; SECURITY_FAIL=1; PRODUCT_FAIL=1; }
  else
    r wsdd_no_host_live no_process PROBLEM
    SECURITY_FAIL=1; PRODUCT_FAIL=1
  fi
else
  # A user-context unit/environment check is not evidence about the running
  # command line. This security gate must fail closed instead of going green by
  # reporting SKIPPED_NEEDS_ROOT.
  r wsdd_no_host_live cannot_check_without_root PROBLEM
  SECURITY_FAIL=1; PRODUCT_FAIL=1
fi
r wsdd_listener "$(ss -lntup 2>/dev/null | grep -c '127.0.0.1:5357')" ""
r flathub_vendor_file "$([ -s /usr/share/flatpak/remotes.d/flathub.flatpakrepo ] && echo yes || echo no)" \
  "$([ -s /usr/share/flatpak/remotes.d/flathub.flatpakrepo ] && echo OK || echo PROBLEM)"
r flathub_remote_live "$(flatpak remotes --columns=name 2>/dev/null | grep -cx flathub)" ""
r discover_present "$(command -v plasma-discover >/dev/null && echo yes || echo no)" ""
r welcome_binary "$([ -x /usr/bin/spplus-welcome ] && echo yes || echo no)" ""
r welcome_desktop "$([ -f /usr/share/applications/org.secureprospective.spplus.welcome.desktop ] && echo yes || echo no)" ""
r welcome_autostart_skel "$([ -f /etc/skel/.config/autostart/org.secureprospective.spplus.welcome.desktop ] && echo yes || echo no)" ""
r fin_on_path "$(command -v fin >/dev/null && echo yes || echo no)" \
  "$(command -v fin >/dev/null && echo OK || echo PROBLEM)"
# Print Screen must reach Flameshot, not Spectacle. cycle35 fix, unproven on hardware.
KGS="$HOME/.config/kglobalshortcutsrc"
if [ -r "$KGS" ]; then
  grep -q '^_launch=.*Print' "$KGS" 2>/dev/null && r printscreen_bound_flameshot yes OK || r printscreen_bound_flameshot no PROBLEM
else
  r printscreen_bound_flameshot unreadable UNKNOWN
fi
echo

echo "=== 10c. RUNTIME FIX GATES (cycle36) ==="
if have node-22; then
  if node-22 -e 'new Intl.Segmenter("en",{granularity:"grapheme"}).segment("hello")' >/dev/null 2>&1; then
    r node_intl_segmenter works OK
  else
    r node_intl_segmenter segfault_or_failed PROBLEM
    PRODUCT_FAIL=1
  fi
else
  r node_intl_segmenter node-22_missing PROBLEM
  PRODUCT_FAIL=1
fi
if [ -s /etc/xdg/kscreenlockerrc ]; then
  lock_effective=$(kreadconfig6 --file kscreenlockerrc --include-globals --group Daemon --key Autolock --default true --type bool 2>/dev/null || echo unreadable)
  case "$lock_effective" in
    false|False|FALSE) r lock_default_shipped present OK; r lock_autolock_effective false OK ;;
    *) r lock_default_shipped present OK; r lock_autolock_effective "${lock_effective:-unreadable}" PROBLEM; PRODUCT_FAIL=1 ;;
  esac
else
  r lock_default_shipped missing PROBLEM
  r lock_autolock_effective missing PROBLEM
  PRODUCT_FAIL=1
fi
if have sensors && sensors --version >/dev/null 2>&1; then
  r lm_sensors_runtime present OK
else
  r lm_sensors_runtime missing_or_broken PROBLEM
  PRODUCT_FAIL=1
fi
DISCOVER_WRAPPER=/usr/bin/spplus-discover
if [ -x "$DISCOVER_WRAPPER" ] \
   && grep -q -- '--backends flatpak,rpm-ostree' "$DISCOVER_WRAPPER" \
   && grep -q '^Exec=/usr/bin/spplus-discover %F$' /usr/share/applications/org.kde.discover.desktop 2>/dev/null \
   && test -e /usr/lib64/qt6/plugins/discover/flatpak-backend.so \
   && test -e /usr/lib64/qt6/plugins/discover/rpm-ostree-backend.so \
   && test ! -e /usr/lib64/qt6/plugins/discover/packagekit-backend.so; then
  r discover_backends flatpak,rpm-ostree OK
else
  r discover_backends mismatch PROBLEM
  PRODUCT_FAIL=1
fi
# The GUI close gate is intentionally explicit: field-inspect is also run over
# SSH, where no desktop environment is inherited. Run it from the real desktop
# session with SPPLUS_RUN_GUI_GATES=1; the standalone gate fails on any inability.
if [ "${SPPLUS_RUN_GUI_GATES:-0}" = 1 ]; then
  if /usr/libexec/sp-plus/welcome/welcome-close-gate.sh; then
    r welcome_close_gate exited OK
  else
    r welcome_close_gate resident_or_failed PROBLEM
    PRODUCT_FAIL=1
  fi
else
  r welcome_close_gate run_with_SPPLUS_RUN_GUI_GATES UNKNOWN
fi
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
  echo "FIELD INSPECTION: SECURITY GATE FAIL (SELinux/encryption/runtime security properties require remediation)" >&2
  exit 1
fi
if [ "$PRODUCT_FAIL" -ne 0 ]; then
  echo "FIELD INSPECTION: PRODUCT GATE FAIL (a shipped behavior is missing or unverified)" >&2
  exit 1
fi
