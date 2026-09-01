#!/usr/bin/env bash
# Every theme on the Welcome look screen must actually apply its own wallpaper.
#
# Run this ON the SP+ target (VM or Dell), inside an account with a live Plasma
# session. It uses the real /usr/libexec/spplus-apply-theme, the same helper the
# Welcome app runs, and it reads the wallpaper back out of the live plasmashell
# configuration rather than trusting the helper's own exit code.
#
# It also performs Christopher's acceptance round trip: Breeze to Windows and
# back, twice, because a single successful apply proves nothing about a switch.
set -uo pipefail

APPLY=${SPPLUS_APPLY:-/usr/libexec/spplus-apply-theme}
APPLETSRC="$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"
PASS=0; FAIL=0

# Take the session environment from the running plasmashell rather than trusting
# whatever the caller happened to export. Over SSH there is no session bus and no
# Wayland socket in the environment, and spplus-apply-theme cannot talk to the
# shell without them: it fails, correctly and loudly, and a gate that supplied
# the wrong environment would be measuring its own setup instead of the product.
shell_pid=$(pgrep -u "$(id -u)" -x plasmashell | head -1)
if [ -z "$shell_pid" ]; then
  echo "THEME_WALLPAPER_ROUNDTRIP_FAILED no plasmashell for this user; run this in a desktop session" >&2
  exit 1
fi
while IFS= read -r -d "" entry; do
  case "$entry" in
    XDG_RUNTIME_DIR=*|DBUS_SESSION_BUS_ADDRESS=*|WAYLAND_DISPLAY=*|DISPLAY=*|XDG_SESSION_TYPE=*)
      export "${entry?}" ;;
  esac
done < "/proc/$shell_pid/environ"
echo "session: pid=$shell_pid type=${XDG_SESSION_TYPE:-unknown} display=${WAYLAND_DISPLAY:-${DISPLAY:-none}}"

# theme id -> wallpaper package the advisor must end up with
THEMES=(
  "org.secureprospective.spplus.windows11.light|Windows-modern"
  "org.secureprospective.spplus.windows11.dark|Windows-modern"
  "org.kde.breeze.desktop|SPPlus-Winter-River"
  "org.kde.breezedark.desktop|SPPlus-Still-Water"
  "Nordic|SPPlus-Moonrise-Range"
  "Catppuccin-Mocha|SPPlus-Night-Ridge"
  "Catppuccin-Latte|SPPlus-Blue-Horizon"
  "com.github.vinceliuice.Orchis|SPPlus-Paint-Tide"
)

ok(){ PASS=$((PASS+1)); printf '  PASS %s\n' "$1"; }
bad(){ FAIL=$((FAIL+1)); printf '  FAIL %s\n' "$1"; }

# The live wallpaper, as plasmashell records it. Deliberately reads the applet
# configuration rather than kdeglobals: kdeglobals is what a theme DECLARES,
# the applet is what the desktop is actually showing.
current_wallpaper(){
  grep -E '^Image=' "$APPLETSRC" 2>/dev/null | tail -1 | cut -d= -f2-
}

APPLY_LOG=""

apply_theme(){ # apply_theme <theme id>
  # The helper's own output is kept, not discarded. A gate that hides why an
  # apply failed turns a real defect into a bare "non-zero" and teaches nothing.
  APPLY_LOG="$("$APPLY" "$1" --layout 2>&1)"
}

check(){ # check <label> <theme id> <expected package>
  local label="$1" theme="$2" want="$3"
  if ! apply_theme "$theme"; then
    bad "$label: apply failed: $(printf '%s' "$APPLY_LOG" | tail -1)"
    return
  fi
  local got; got="$(current_wallpaper)"
  # plasmashell records a URI with no trailing slash, e.g.
  # file:///usr/share/wallpapers/SPPlus-Still-Water. Match the package as a
  # whole final path element so that a name which is a prefix of another
  # package cannot pass for it.
  case "$got" in
    */"$want"|*/"$want"/*|"$want") ok "$label: $want" ;;
    "")  bad "$label: no wallpaper recorded at all, wanted $want" ;;
    *)   bad "$label: wanted $want, desktop shows $got" ;;
  esac
}

echo "=== every theme applies its own wallpaper ==="
for row in "${THEMES[@]}"; do
  check "${row%%|*}" "${row%%|*}" "${row##*|}"
done

echo "=== acceptance round trip: Breeze to Windows and back, twice ==="
for pass in 1 2; do
  check "round $pass Breeze Dark"  org.kde.breezedark.desktop SPPlus-Still-Water
  check "round $pass Windows Dark" org.secureprospective.spplus.windows11.dark Windows-modern
  check "round $pass back to Breeze Dark" org.kde.breezedark.desktop SPPlus-Still-Water
  check "round $pass Breeze Light" org.kde.breeze.desktop SPPlus-Winter-River
  check "round $pass Windows Light" org.secureprospective.spplus.windows11.light Windows-modern
  check "round $pass back to Breeze Light" org.kde.breeze.desktop SPPlus-Winter-River
done

echo
if [ "$FAIL" -eq 0 ]; then
  echo "THEME_WALLPAPER_ROUNDTRIP_OK checks=$PASS"
  exit 0
fi
echo "THEME_WALLPAPER_ROUNDTRIP_FAILED passed=$PASS failed=$FAIL"
exit 1
