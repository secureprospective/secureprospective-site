#!/usr/bin/env bash
# Pull the theme back OUT of the VM into the Beelink source tree, once the look
# has been approved. This is what makes an approved change survive a reboot: it
# lands in git and gets baked into the next cycle image.
set -euo pipefail
DST="$(cd "$(dirname "${BASH_SOURCE[0]}")/../sp-plus-calm" && pwd)"
RSH="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2235"
HOST=test@127.0.0.1

pull() { rsync -a --delete -e "$RSH" "$HOST:.local/share/$2/" "$DST/$1/"; echo "  pulled $2 -> $1"; }
pull aurorae        aurorae/themes
pull color-schemes  color-schemes
pull wallpapers     wallpapers
pull look-and-feel  plasma/look-and-feel
pull desktoptheme   plasma/desktoptheme

echo
echo "Now the gate must pass before any of this is committed:"
bash "$(dirname "${BASH_SOURCE[0]}")/validate-spplus-calm.sh"
