#!/usr/bin/env bash
# Capture the eight theme preview receipts required by PREVIEW-CAPTURE-CONTRACT.md.
#
# Composition, as specified by Christopher: the FILE MANAGER over the STOCK WALLPAPER with
# the MENU OPEN. Those three things are what actually carry a theme's identity -- the
# wallpaper, the panel with its launcher expanded, and an ordinary window showing the widget
# style, decoration and icons in normal use. The Welcome app must not be in frame: it looks
# much the same under every theme and so demonstrates nothing about the choice being made.
#
# A receipt is evidence, not decoration, so a theme whose apply fails gets no image.
set +e

RECEIPTS=$HOME/receipts
mkdir -p "$RECEIPTS"

export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
export SPPLUS_IMAGE_ROOT=$HOME/stage

session_env() {
  local pid
  pid=$(pgrep -x plasmashell | head -1)
  [ -z "$pid" ] && return 1
  eval "$(tr '\0' '\n' < "/proc/$pid/environ" \
        | grep -E '^(XDG_|QT_|KDE_|WAYLAND_|DISPLAY|DBUS_)' \
        | sed 's/^/export /; s/=/="/; s/$/"/')"
}

systemctl --user reset-failed plasma-plasmashell.service 2>/dev/null
systemctl --user start plasma-plasmashell.service
sleep 8
session_env || { echo "FATAL: no plasmashell; cannot capture receipts"; exit 1; }

# Anything left over from earlier work would appear in the frame and ruin the composition.
close_clutter() {
  # `local` matters here: bash function variables are global by default, and an earlier
  # version of this loop used `name`, clobbering the caller's $name so every screenshot
  # was written to btop.png.
  local proc pid
  systemctl --user stop welcome-probe 2>/dev/null
  for proc in dolphin konsole btop; do
    for pid in $(pgrep -x "$proc"); do kill "$pid" 2>/dev/null; done
  done
  sleep 2
}

capture() {
  local pkg=$1 name=$2 layout=$3 rc
  echo "=== $name  ($pkg)  $layout"

  python3 "$HOME/spplus-apply-theme" "$pkg" "$layout" > "/tmp/apply-$name.log" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "  APPLY FAILED rc=$rc — NO receipt written"
    tail -2 "/tmp/apply-$name.log" | sed 's/^/    /'
    return 1
  fi

  # The layout stage can restart the shell, so re-read the environment before driving it.
  session_env

  close_clutter
  systemd-run --user --collect --unit=probe-dolphin dolphin >/dev/null 2>&1
  sleep 9

  # Open the application menu. activateLauncherMenu is the shell's own exported method, so
  # this opens the real Kickoff for whichever theme is applied.
  qdbus-qt6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu \
    >/dev/null 2>&1
  sleep 4

  spectacle -b -n -f -o "$RECEIPTS/$name.png" >/dev/null 2>&1
  sleep 3

  # Close the menu again so it does not swallow the next theme's interactions.
  qdbus-qt6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu \
    >/dev/null 2>&1
  sleep 1

  if [ -s "$RECEIPTS/$name.png" ]; then
    echo "  OK  $(stat -c %s "$RECEIPTS/$name.png") bytes  lnf=$(kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage)"
  else
    echo "  CAPTURE FAILED — no image produced"
    return 1
  fi
}

capture org.secureprospective.spplus.windows11.dark  windows-dark      --layout
capture org.secureprospective.spplus.windows11.light windows-light     --layout
capture org.kde.breezedark.desktop                   breeze-dark       --layout
capture org.kde.breeze.desktop                       breeze-light      --layout
capture Nordic                                       nordic-dark       --layout
capture com.github.vinceliuice.Orchis                orchis-light      --layout
capture Catppuccin-Latte                             catppuccin-latte  --layout
capture Catppuccin-Mocha                             catppuccin-mocha  --layout

echo
echo "=== receipts produced ==="
ls -la "$RECEIPTS"/*.png 2>/dev/null | awk '{print $5, $9}'
echo "count: $(ls -1 "$RECEIPTS"/*.png 2>/dev/null | wc -l) / 8"
