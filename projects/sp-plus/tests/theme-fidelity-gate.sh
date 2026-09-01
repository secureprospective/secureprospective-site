#!/usr/bin/env bash
# Does a global theme switch actually build the whole theme?
#
# The wallpaper round-trip gate proves one setting. This proves the rest: for
# every theme SP+ offers, every component the theme package DECLARES -- colour
# scheme, all five fonts, icon set, widget style, Plasma theme, window
# decoration, cursor, splash, Kvantum -- is read back off the live session and
# compared against that declaration, and the task bar is compared against the
# panel the theme's own layout script builds.
#
# The declarations are parsed here, independently. This gate never asks
# spplus-apply-theme whether it succeeded: a gate that repeats the helper's own
# verdict cannot catch the helper being wrong.
set -uo pipefail

# A desktop session is not inherited over SSH. Take it from the running shell.
shell_pid=$(pgrep -u "$(id -u)" -x plasmashell | head -1)
[ -n "$shell_pid" ] || { echo "THEME_FIDELITY_FAILED no plasmashell is running"; exit 1; }
while IFS= read -r -d "" entry; do
  case "$entry" in
    XDG_RUNTIME_DIR=*|DBUS_SESSION_BUS_ADDRESS=*|WAYLAND_DISPLAY=*|DISPLAY=*|XDG_SESSION_TYPE=*|XDG_CURRENT_DESKTOP=*)
      export "${entry?}" ;;
  esac
done < "/proc/$shell_pid/environ"

export SPPLUS_THEMES="${SPPLUS_THEMES:-org.secureprospective.spplus.windows11.light org.secureprospective.spplus.windows11.dark org.kde.breeze.desktop org.kde.breezedark.desktop Nordic Catppuccin-Mocha Catppuccin-Latte com.github.vinceliuice.Orchis}"
python3 "$(dirname "$0")/theme-fidelity-gate.py"
