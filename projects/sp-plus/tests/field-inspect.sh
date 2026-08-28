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

echo "=== 10a. SP+ GLOBAL THEMES (DN-28: stock + vendored set, Calm withdrawn) ==="
# DN-28 WITHDREW the custom SP+ Calm global theme. SP+ now ships stock and
# vendored themes, and the SP+ wallpapers are explicitly KEPT.
#
# This section used to assert Calm was installed and applied. Those assertions
# became false the moment DN-28 landed, and they reported five PROBLEMs against
# a correct cycle36 install on 2026-08-28. A test that asserts a withdrawn
# decision is not a failing test, it is a lying one. Retargeted to the shipped
# set.
#
# The build gates prove the FILES are installed. Only a booted machine can prove
# a look was APPLIED, which is the DN-24 distinction: naming a look-and-feel in
# kdeglobals is not applying it. Read the user's own config, not /etc.
SHIPPED_THEMES="org.secureprospective.spplus.windows11.light
org.secureprospective.spplus.windows11.dark
org.kde.breezedark.desktop
Nordic
Catppuccin-Mocha
org.kde.breeze.desktop
com.github.vinceliuice.Orchis
Catppuccin-Latte"

_present=0
_missing=""
for t in $SHIPPED_THEMES; do
  if [ -d "/usr/share/plasma/look-and-feel/$t" ]; then
    _present=$((_present+1))
  else
    _missing="$_missing $t"
  fi
done
if [ "$_present" -eq 8 ]; then
  r themes_installed "8/8" OK
else
  r themes_installed "$_present/8 missing:$_missing" PROBLEM
  PRODUCT_FAIL=1
fi

# BEHAVIOUR: run the real validator against the running root. It checks that
# every theme declares every component key AND that each value resolves to an
# asset actually present, which is what makes a switch change everything.
if [ -x /usr/libexec/spplus-validate-global-themes ]; then
  _vout="$(python3 /usr/libexec/spplus-validate-global-themes --root / 2>&1)"
  _verr="$(printf '%s' "$_vout" | sed -n 's/.*errors=\([0-9]*\).*/\1/p' | tail -1)"
  if [ "$_verr" = "0" ]; then
    r theme_validator_errors 0 OK
  else
    r theme_validator_errors "${_verr:-unparseable}" PROBLEM
    PRODUCT_FAIL=1
  fi
else
  r theme_validator_errors validator_missing PROBLEM
  PRODUCT_FAIL=1
fi

# DN-28: the withdrawn Calm theme must be GONE, not merely unused.
if [ -d /usr/share/plasma/look-and-feel/org.secureprospective.spplus.calm.dark ] \
   || [ -f /usr/share/color-schemes/SPPlusCalmDark.colors ]; then
  r calm_withdrawn no PROBLEM
  PRODUCT_FAIL=1
else
  r calm_withdrawn yes OK
fi

# DN-28 explicitly KEEPS the SP+ wallpapers.
r wallpaper_ladder "$(ls /usr/share/wallpapers/SPPlus-Calm/contents/images/ 2>/dev/null | wc -l)" ""
r paper_icons "$([ -d /usr/share/icons/Paper-Mono-Dark ] && echo yes || echo no)" \
  "$([ -d /usr/share/icons/Paper-Mono-Dark ] && echo OK || echo PROBLEM)"
# Papirus-Dark is a SEPARATE Fedora package. Three shipped themes name it, and
# its absence failed the cycle36 build at step 79.
r papirus_dark_icons "$([ -d /usr/share/icons/Papirus-Dark ] && echo yes || echo no)" \
  "$([ -d /usr/share/icons/Papirus-Dark ] && echo OK || echo PROBLEM)"
for face in "Noto Sans" "IBM Plex Sans" "JetBrains Mono"; do
  key="font_$(echo "$face" | tr 'A-Z ' 'a-z_')"
  if fc-list : family 2>/dev/null | grep -qi "$face"; then r "$key" present OK; else r "$key" MISSING PROBLEM; fi
done

# Per-user application. Absence here is the DN-24 failure, not a cosmetic nit.
#
# READ THE EFFECTIVE VALUE, NOT THE USER FILE. This section used to awk
# ~/.config/kdeglobals and ~/.config/kwinrc directly, and on 2026-08-28 it
# reported theme_applied_to_user=none against a cycle36 guest whose theme was
# applied perfectly in every component.
#
# KConfig cascades. Setting a key whose value already equals the current
# EFFECTIVE value writes nothing, because there is nothing to override, and SP+
# ships exactly these values in /etc/xdg/kdeglobals and /etc/xdg/kwinrc. So the
# user file is legitimately silent on the keys worth testing, while keys with no
# system default -- the fonts, the titlebar button layout -- do appear there.
# Absence from the user file means agreement, not failure. kreadconfig6 resolves
# the cascade, which is what Plasma itself reads.
effective() {
  # effective <file> <group> <key>
  kreadconfig6 --file "$1" --group "$2" --key "$3" 2>/dev/null
}
# These read the ADVISOR'S OWN session config. Run under sudo they read root's
# config instead and report false PROBLEMs against a correct machine -- observed
# 2026-08-28, where a root run said theme_cursor=none on a guest whose cursor
# theme was applied. Root cannot answer a per-user question, so say so rather
# than guess. Run this script as the advisor to judge the theme; elevate only
# for the storage and daemon checks.
if [ "$ROOT" = yes ]; then
  for _k in theme_applied_to_user theme_scheme_applied theme_icons_applied \
            theme_widget_style theme_plasma_theme theme_cursor \
            theme_decoration_theme theme_decoration_library; do
    r "$_k" run_as_user_not_root SKIPPED_NEEDS_USER_SESSION
  done
elif have kreadconfig6; then
  applied=$(effective kdeglobals KDE LookAndFeelPackage)
  scheme=$(effective kdeglobals General ColorScheme)
  icons=$(effective kdeglobals Icons Theme)
  style=$(effective kdeglobals KDE widgetStyle)
  deco_library=$(effective kwinrc org.kde.kdecoration2 library)
  deco_theme=$(effective kwinrc org.kde.kdecoration2 theme)
  plasma_theme=$(effective plasmarc Theme name)
  cursor=$(effective kcminputrc Mouse cursorTheme)

  if printf '%s\n' $SHIPPED_THEMES | grep -qx "$applied"; then
    r theme_applied_to_user "$applied" OK
  else
    r theme_applied_to_user "${applied:-none}" PROBLEM
    PRODUCT_FAIL=1
  fi

  # EVERY component must have moved, not just the colours. That is the whole
  # point of DN-28 and of spplus-apply-theme.
  for pair in "theme_scheme_applied:$scheme" "theme_icons_applied:$icons" \
              "theme_widget_style:$style" "theme_plasma_theme:$plasma_theme" \
              "theme_cursor:$cursor" "theme_decoration_theme:$deco_theme"; do
    _k="${pair%%:*}"; _v="${pair#*:}"
    if [ -n "$_v" ]; then r "$_k" "$_v" OK; else r "$_k" none PROBLEM; PRODUCT_FAIL=1; fi
  done

  # The one-line defect that made a whole cycle of themes silently fail: the
  # Plasma 5 plugin name. Plasma 6.7 needs the .v2 suffix. Other libraries are
  # legitimate, because the stock Breeze themes do not use Aurorae at all.
  if [ "$deco_library" = "org.kde.kwin.aurorae" ]; then
    r theme_decoration_library "$deco_library (Plasma 5 plugin; needs .v2)" PROBLEM
    PRODUCT_FAIL=1
  elif [ -n "$deco_library" ]; then
    r theme_decoration_library "$deco_library" OK
  else
    r theme_decoration_library none PROBLEM
    PRODUCT_FAIL=1
  fi
else
  r theme_applied_to_user kreadconfig6_missing PROBLEM
  PRODUCT_FAIL=1
fi

APPLETS="$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"
if [ -r "$APPLETS" ]; then
  grep -q 'SPPlus' "$APPLETS" && r wallpaper_applied yes OK || { r wallpaper_applied no PROBLEM; PRODUCT_FAIL=1; }
else
  r wallpaper_applied unreadable UNKNOWN
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
# Print Screen must reach the SP+ Spectacle wrapper. The old check here grepped
# for '^_launch=.*Print' anywhere in the file, which Spectacle's OWN bindings also
# match -- it passed while Print Screen was broken. Read the binding out of the
# right group, then prove a capture actually happens.
KGS="$HOME/.config/kglobalshortcutsrc"
group_launch() {
  awk -v grp="[services][$1]" '$0==grp{f=1;next} /^\[/{f=0} f&&/^_launch=/{print;exit}' "$2" 2>/dev/null
}
# Print Screen belongs to flameshot-capture.desktop (Exec=flameshot gui) as of
# 2026-08-28. The Spectacle wrapper stays installed as the portal-free fallback
# but is deliberately unbound.
if [ -r "$KGS" ]; then
  case "$(group_launch flameshot-capture.desktop "$KGS")" in
    _launch=Print*) r printscreen_bound_flameshot yes OK ;;
    '')             r printscreen_bound_flameshot group_absent PROBLEM; PRODUCT_FAIL=1 ;;
    *)              r printscreen_bound_flameshot not_print PROBLEM; PRODUCT_FAIL=1 ;;
  esac
else
  r printscreen_bound_flameshot unreadable UNKNOWN
fi

# The advisor must never meet "Allow Apps to Take Screenshots?" on day one.
# Flameshot captures through xdg-desktop-portal, whose KDE backend BLOCKS on that
# dialog until a human answers. spplus-first-login pre-grants the permission; if
# the grant is missing, Print Screen appears to hang the first time it is pressed,
# which is exactly what cycle35 misdiagnosed as the portal wedging.
#
# The app id is the empty string because the portal cannot identify an
# unsandboxed app. That is what it writes itself when a human clicks Allow.
if [ "$ROOT" = yes ]; then
  r screenshot_portal_permission run_as_user_not_root SKIPPED_NEEDS_USER_SESSION
elif have gdbus; then
  _perm=$(timeout 15 gdbus call --session \
      --dest org.freedesktop.impl.portal.PermissionStore \
      --object-path /org/freedesktop/impl/portal/PermissionStore \
      --method org.freedesktop.impl.portal.PermissionStore.Lookup \
      screenshot screenshot 2>/dev/null)
  # Must be the app id the Print Screen shortcut actually runs under. Matching
  # a bare 'yes' passed on a guest where the grant sat on the empty app id and
  # 'flameshot-capture' was recorded as 'no', so Print Screen died with
  # "Unable to capture screen" while this check reported OK. 2026-08-28.
  case "$_perm" in
    *"'flameshot-capture': ['yes']"*) r screenshot_portal_permission granted OK ;;
    *"'flameshot-capture': ['no']"*)  r screenshot_portal_permission "denied for flameshot-capture -- Print Screen fails silently" PROBLEM; PRODUCT_FAIL=1 ;;
    *)  r screenshot_portal_permission "absent for flameshot-capture -- Print Screen will prompt" PROBLEM; PRODUCT_FAIL=1 ;;
  esac
else
  r screenshot_portal_permission gdbus_missing UNKNOWN
fi

# BEHAVIOUR, not presence: take a real capture and require a real file. Region
# mode needs a human, so the probe uses fullscreen; it exercises the identical
# KWin path, which is the thing that has to work.
if have spectacle; then
  # Spectacle needs the user's compositor. Run over a bare ssh pipe with no
  # WAYLAND_DISPLAY it ABORTS, and the probe then reported no_image against a
  # machine where Print Screen works perfectly -- observed 2026-08-28, where the
  # same binary produced a 113529-byte PNG once pointed at the session. That is
  # the same display artifact class as plasma-apply-lookandfeel --list dumping
  # core over ssh. A missing session is NOT a product failure, so say so instead
  # of crying wolf.
  _xdg="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
  _wl="${WAYLAND_DISPLAY:-$(ls "$_xdg" 2>/dev/null | grep -E '^wayland-[0-9]+$' | head -1)}"
  if [ -z "$_wl" ]; then
    r screenshot_capture_works no_session SKIPPED_NEEDS_SESSION
  else
    _shot="$(mktemp -u /tmp/spplus-printscreen-probe-XXXX.png)"
    if XDG_RUNTIME_DIR="$_xdg" WAYLAND_DISPLAY="$_wl" QT_QPA_PLATFORM=wayland \
         timeout 30 spectacle -f -b -n -o "$_shot" >/dev/null 2>&1 && [ -s "$_shot" ]; then
      r screenshot_capture_works "$(stat -c%s "$_shot") bytes" OK
    else
      r screenshot_capture_works no_image PROBLEM
      PRODUCT_FAIL=1
    fi
    rm -f "$_shot"
  fi
else
  r screenshot_capture_works spectacle_missing PROBLEM
  PRODUCT_FAIL=1
fi

# The portal must still answer afterwards. A screenshot request through
# xdg-desktop-portal wedged the KDE backend permanently in the cycle35 guest,
# which breaks Flatpak file pickers and screen sharing too, so this is worth
# watching on every field run even though SP+ no longer takes that path.
# Needs the user's session bus. As root there is none, and the probe then
# reports "wedged" against a healthy machine.
if [ "$ROOT" = yes ]; then
  r portal_responsive run_as_user_not_root SKIPPED_NEEDS_USER_SESSION
elif have gdbus; then
  if timeout 20 gdbus call --session --dest org.freedesktop.portal.Desktop \
       --object-path /org/freedesktop/portal/desktop \
       --method org.freedesktop.portal.Settings.ReadOne \
       org.freedesktop.appearance color-scheme >/dev/null 2>&1; then
    r portal_responsive yes OK
  else
    r portal_responsive wedged PROBLEM
  fi
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
  # NOT --type bool. kreadconfig6 in Plasma 6.7 exits 1 and prints nothing for
  # --type bool, so this reported lock_autolock_effective=unreadable against a
  # machine whose /etc/xdg/kscreenlockerrc plainly says Autolock=false. Verified
  # 2026-08-28: the identical command without --type bool returns "false" and
  # exits 0. The case below already accepts every spelling.
  lock_effective=$(kreadconfig6 --file kscreenlockerrc --include-globals --group Daemon --key Autolock --default true 2>/dev/null || echo unreadable)
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
