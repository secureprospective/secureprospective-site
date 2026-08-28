#!/usr/bin/env bash
# Push the SP+ Calm theme SOURCE (Beelink) into the running test VM's per-user
# directories, where Plasma reads it live. No image build, no reboot.
#
# The VM is an immutable bootc system: /usr/share is read-only and cannot be the
# iteration surface. ~/.local/share IS writable and takes precedence, so a theme
# dropped there is what Plasma actually uses.
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../sp-plus-calm" && pwd)"
SSH=(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2235)
HOST=test@127.0.0.1

"${SSH[@]}" $HOST 'mkdir -p ~/.local/share/{aurorae/themes,color-schemes,wallpapers,plasma/look-and-feel,plasma/desktoptheme}'

push() { # push <src subdir> <dest under ~/.local/share>
  rsync -a --delete -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2235" \
    "$SRC/$1/" "$HOST:.local/share/$2/"
  echo "  pushed $1 -> ~/.local/share/$2"
}
push aurorae        aurorae/themes
push color-schemes  color-schemes
push wallpapers     wallpapers
push look-and-feel  plasma/look-and-feel
push desktoptheme   plasma/desktoptheme

echo "Source pushed. Apply it in the VM's OWN desktop session (not over ssh):"
echo "  plasma-apply-lookandfeel -a org.secureprospective.spplus.calm.dark"
echo "  # Aurorae-only change needs no relogin:  qdbus-qt6 org.kde.KWin /KWin reconfigure"
