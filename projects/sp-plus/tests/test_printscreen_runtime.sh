#!/usr/bin/env bash
# Runtime gate: Print Screen must actually belong to Flameshot in the LIVE
# session. Every gate before this one inspected stored configuration and passed
# on machines where Print Screen did nothing, because the config was always
# right -- Spectacle claims the key at runtime and KGlobalAccel gives a
# contested key to whoever registered first. Only the key lookup sees that.
#
# Run this in the guest against a settled Plasma session:
#   XDG_RUNTIME_DIR=/run/user/1000 bash tests/test_printscreen_runtime.sh
set -euo pipefail

KEY=16777225  # Qt::Key_Print

out=$(gdbus call --session --dest org.kde.kglobalaccel \
  --object-path /kglobalaccel \
  --method org.kde.KGlobalAccel.getGlobalShortcutsByKey "$KEY")

if [ -z "${out//[[:space:]]/}" ] || [[ "$out" == *"[],)"* ]]; then
    echo "FAIL: nothing owns the Print key. Print Screen does nothing." >&2
    echo "      got: $out" >&2
    exit 1
fi

# Spectacle legitimately still REGISTERS Print after we take it -- asserting it
# is absent fails on a correctly working machine. What matters is who is FIRST,
# because that is the action KGlobalAccel actually fires.
first=${out%%), (*}
if ! grep -q 'flameshot-capture.desktop' <<<"$first"; then
    echo "FAIL: Print is owned by something other than Flameshot." >&2
    echo "      owner: $first" >&2
    exit 1
fi

echo "PASS  Print Screen is owned by flameshot-capture.desktop in the live session"
