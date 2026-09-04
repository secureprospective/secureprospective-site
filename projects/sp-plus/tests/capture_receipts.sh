#!/usr/bin/env bash
# Capture the eight theme preview receipts required by PREVIEW-CAPTURE-CONTRACT.md.
#
# Composition, as specified by Christopher: the FILE MANAGER over the STOCK WALLPAPER with
# the MENU OPEN, now with Fin in a fixed right-hand rail beside it. Those four things are
# what actually carry a theme's identity -- the wallpaper, the panel with its launcher
# expanded, an ordinary window showing the widget style/decoration/icons, and the welcoming
# SP+ assistant. The Welcome app must not be in frame: it looks much the same under every
# theme and so demonstrates nothing about the choice being made.
#
# A receipt is evidence, not decoration, so a theme whose apply fails or whose Fin launch
# does not reach the welcoming state gets no image.
set +e

RECEIPTS=$HOME/receipts
mkdir -p "$RECEIPTS"

export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
# Receipts ship INSIDE the image, so by default they must be captured from the installed
# helper against the installed packages. Capturing from a staged tree would document code
# the advisor never runs. Both are overridable for a pre-ship dry run on staged changes.
export SPPLUS_IMAGE_ROOT=${SPPLUS_IMAGE_ROOT:-/}
APPLY_THEME=${SPPLUS_APPLY_THEME:-/usr/libexec/spplus-apply-theme}

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
FIN_KWIN_SCRIPT=${SPPLUS_FIN_KWIN_SCRIPT:-$SCRIPT_DIR/fin-placement.js}
FIN_KWIN_SCRIPT_NAME=spplus-fin-placement
FIN_READY_TIMEOUT=${SPPLUS_FIN_READY_TIMEOUT:-30}
FIN_GREETING='Fin, your SP+ assistant'
FIN_BANNER_MARK='><>'
FIN_ERROR_RE='(error|fatal|traceback|panic|exception|failed|failure|command not found|segmentation fault)'
FIN_CONTROL_DIR=
FIN_KITTY_SOCKET=
FIN_LAUNCH_PID=

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

  # Fin is a kitty window, but do not kill unrelated kitty terminals. Match the stable
  # launch identity and also the PID this run owns. The next receipt starts from a clean
  # desktop, and the EXIT trap uses this same path if a receipt fails halfway through.
  if [ -n "${FIN_LAUNCH_PID:-}" ] && kill -0 "$FIN_LAUNCH_PID" 2>/dev/null; then
    kill "$FIN_LAUNCH_PID" 2>/dev/null
  fi
  for pid in $(pgrep -f '[k]itty --class fin --title Fin' 2>/dev/null); do
    kill "$pid" 2>/dev/null
  done
  FIN_LAUNCH_PID=

  # Let the compositor reap the client before the next launch reuses the socket. This
  # is cleanup, not a readiness wait; Fin readiness is proved by wait_for_fin_greeting.
  sleep 2
  [ -n "${FIN_CONTROL_DIR:-}" ] && rm -f -- "$FIN_CONTROL_DIR/kitty.sock"
}

cleanup() {
  close_clutter
  [ -n "${FIN_CONTROL_DIR:-}" ] && rm -rf -- "$FIN_CONTROL_DIR"
}

kitty_control() {
  kitten @ --to "$FIN_KITTY_SOCKET" "$@"
}

fin_window_id() {
  kitty_control ls --match 'title:^Fin$' 2>/dev/null \
    | jq -r '.[]?.tabs[]?.windows[]? | select(.title == "Fin") | .id' \
    | head -1
}

# Kitty's get-text reads the terminal's current screen buffer after Kitty has parsed and
# rendered it. Requiring the Kitty window lookup and both visible strings makes this a real
# readiness condition: a process existing, a title being present, or a fixed sleep alone is
# not enough. --extent screen is intentional; --extent all could find a banner in scrollback
# even after the frame had scrolled past it.
wait_for_fin_greeting() {
  local receipt_name=$1
  local deadline=$((SECONDS + FIN_READY_TIMEOUT))
  local window_id text

  while [ "$SECONDS" -lt "$deadline" ]; do
    window_id=$(fin_window_id)
    if [ -n "$window_id" ]; then
      if text=$(kitty_control get-text --match "id:$window_id" --extent screen 2>/dev/null); then
        if printf '%s\n' "$text" | grep -Eiq "$FIN_ERROR_RE"; then
          echo "  FIN FAILED: startup output contains an error marker"
          return 1
        fi
        if printf '%s\n' "$text" | grep -Fq "$FIN_GREETING" \
            && printf '%s\n' "$text" | grep -Fq "$FIN_BANNER_MARK"; then
          printf '%s\n' "$text" > "/tmp/fin-visible-$receipt_name.txt"
          return 0
        fi
      fi
    fi

    if [ -n "${FIN_LAUNCH_PID:-}" ] && ! kill -0 "$FIN_LAUNCH_PID" 2>/dev/null; then
      echo "  FIN FAILED: kitty exited before the banner and greeting appeared"
      return 1
    fi

    # Polling cadence only. The loop returns on the positive rendered-content condition;
    # this sleep is never used as proof that Fin is ready.
    sleep 0.2
  done

  echo "  FIN FAILED: timed out waiting for the visible banner and greeting"
  return 1
}

# Load a one-shot Plasma 6 KWin script over its scripting D-Bus interface. The script uses
# workspace.stackingOrder and the writable frameGeometry property, rather than wmctrl or a
# compositor-dependent launch position. It is unloaded after the geometry write.
place_fin() {
  local script_id

  [ -r "$FIN_KWIN_SCRIPT" ] || {
    echo "  FIN FAILED: KWin placement script is missing: $FIN_KWIN_SCRIPT"
    return 1
  }

  qdbus-qt6 org.kde.KWin /Scripting \
    org.kde.kwin.Scripting.unloadScript "$FIN_KWIN_SCRIPT_NAME" \
    >/dev/null 2>&1
  script_id=$(qdbus-qt6 org.kde.KWin /Scripting \
    org.kde.kwin.Scripting.loadScript "$FIN_KWIN_SCRIPT" "$FIN_KWIN_SCRIPT_NAME" \
    2>/dev/null | sed -n 's/[^0-9]*\([0-9][0-9]*\).*/\1/p' | head -1)

  case "$script_id" in
    ''|*[!0-9]*)
      echo "  FIN FAILED: KWin did not return a script id"
      return 1
      ;;
  esac

  if ! qdbus-qt6 org.kde.KWin "/Scripting/Script$script_id" \
      org.kde.kwin.Script.run >/dev/null 2>&1; then
    echo "  FIN FAILED: KWin placement script did not run"
    qdbus-qt6 org.kde.KWin /Scripting \
      org.kde.kwin.Scripting.unloadScript "$FIN_KWIN_SCRIPT_NAME" \
      >/dev/null 2>&1
    return 1
  fi

  qdbus-qt6 org.kde.KWin /Scripting \
    org.kde.kwin.Scripting.unloadScript "$FIN_KWIN_SCRIPT_NAME" \
    >/dev/null 2>&1
  return 0
}

launch_fin() {
  local receipt_name=$1
  local fin_log="/tmp/fin-$receipt_name.log"
  rm -f -- "$fin_log"

  # The product launch remains exactly:
  #   kitty --class fin --title Fin -e /usr/libexec/sp-plus/fin
  # The two Kitty options before it give this evidence harness a private read-only
  # control socket, so it can wait on Kitty's rendered screen instead of guessing.
  kitty -o allow_remote_control=socket-only --listen-on "$FIN_KITTY_SOCKET" \
    --class fin --title Fin -e /usr/libexec/sp-plus/fin \
    >"$fin_log" 2>&1 &
  FIN_LAUNCH_PID=$!
}

for required in qdbus-qt6 kitten jq; do
  command -v "$required" >/dev/null 2>&1 || {
    echo "FATAL: required capture tool is missing: $required"
    exit 1
  }
done
[ -r "$FIN_KWIN_SCRIPT" ] || {
  echo "FATAL: KWin placement script is missing: $FIN_KWIN_SCRIPT"
  exit 1
}
FIN_CONTROL_DIR=$(mktemp -d "${XDG_RUNTIME_DIR:-/tmp}/spplus-fin.XXXXXX") || {
  echo "FATAL: cannot create Fin control socket directory"
  exit 1
}
FIN_KITTY_SOCKET="unix:$FIN_CONTROL_DIR/kitty.sock"
trap cleanup EXIT

capture() {
  local pkg=$1 name=$2 layout=$3 rc image_ok
  echo "=== $name  ($pkg)  $layout"
  rm -f -- "$RECEIPTS/$name.png"

  python3 "$APPLY_THEME" "$pkg" "$layout" > "/tmp/apply-$name.log" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "  APPLY FAILED rc=$rc -- NO receipt written"
    tail -2 "/tmp/apply-$name.log" | sed 's/^/    /'
    return 1
  fi

  # The layout stage can restart the shell, so re-read the environment before driving it.
  session_env || {
    echo "  CAPTURE FAILED: no plasmashell session environment after apply"
    return 1
  }

  close_clutter
  systemd-run --user --collect --unit=probe-dolphin dolphin >/dev/null 2>&1
  sleep 9

  launch_fin "$name"
  if ! wait_for_fin_greeting "$name"; then
    rm -f -- "$RECEIPTS/$name.png"
    close_clutter
    return 1
  fi

  if ! place_fin; then
    rm -f -- "$RECEIPTS/$name.png"
    close_clutter
    return 1
  fi

  # Moving/resizing a terminal can change its rows. Prove the welcoming state is still
  # visible after KWin has placed it, immediately before opening the menu/capturing.
  if ! wait_for_fin_greeting "$name"; then
    rm -f -- "$RECEIPTS/$name.png"
    close_clutter
    return 1
  fi

  # Open the application menu. activateLauncherMenu is the shell's own exported method, so
  # this opens the real Kickoff for whichever theme is applied. Fin is already in the
  # right-hand rail, outside the menu's fixed left-side footprint.
  if ! qdbus-qt6 org.kde.plasmashell /PlasmaShell \
      org.kde.PlasmaShell.activateLauncherMenu >/dev/null 2>&1; then
    echo "  CAPTURE FAILED: could not open the application menu"
    rm -f -- "$RECEIPTS/$name.png"
    close_clutter
    return 1
  fi
  sleep 4

  image_ok=0
  if spectacle -b -n -f -o "$RECEIPTS/$name.png" >/dev/null 2>&1 \
      && [ -s "$RECEIPTS/$name.png" ]; then
    image_ok=1
  fi

  # Close the menu again so it does not swallow the next theme's interactions. The same
  # cleanup path closes Fin, so neither window can leak into the following receipt.
  qdbus-qt6 org.kde.plasmashell /PlasmaShell \
    org.kde.PlasmaShell.activateLauncherMenu >/dev/null 2>&1
  sleep 1
  close_clutter

  if [ "$image_ok" -ne 1 ]; then
    echo "  CAPTURE FAILED -- no image produced"
    rm -f -- "$RECEIPTS/$name.png"
    return 1
  fi

  echo "  OK  $(stat -c %s "$RECEIPTS/$name.png") bytes  lnf=$(kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage)"
  return 0
}

failures=0
capture org.secureprospective.spplus.modern.dark  modern-dark      --layout || failures=$((failures + 1))
capture org.secureprospective.spplus.modern.light modern-light     --layout || failures=$((failures + 1))
capture org.kde.breezedark.desktop                   breeze-dark       --layout || failures=$((failures + 1))
capture org.kde.breeze.desktop                       breeze-light      --layout || failures=$((failures + 1))
capture Nordic                                       nordic-dark       --layout || failures=$((failures + 1))
capture com.github.vinceliuice.Orchis                orchis-light      --layout || failures=$((failures + 1))
capture Catppuccin-Latte                             catppuccin-latte  --layout || failures=$((failures + 1))
capture Catppuccin-Mocha                             catppuccin-mocha  --layout || failures=$((failures + 1))

echo
echo "=== receipts produced ==="
find "$RECEIPTS" -maxdepth 1 -type f -name '*.png' -printf '%s %p\n' | sort
echo "count: $(find "$RECEIPTS" -maxdepth 1 -type f -name '*.png' -printf . | wc -c) / 8"
[ "$failures" -eq 0 ]
