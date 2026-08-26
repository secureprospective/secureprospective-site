#!/usr/bin/env bash
# Type a command into a QEMU guest's console via the monitor socket.
# Usage: vmtype.sh /path/to/monitor.sock 'command text'
# Removes the need to hand-type into a QEMU window that has no clipboard.
SOCK="$1"; shift; TXT="$*"
[ -S "$SOCK" ] || { echo "no monitor socket at $SOCK" >&2; exit 1; }
send() { echo "sendkey $1" | socat - UNIX-CONNECT:"$SOCK" >/dev/null 2>&1; sleep 0.03; }
i=0
while [ $i -lt ${#TXT} ]; do
  c="${TXT:$i:1}"; i=$((i+1))
  case "$c" in
    [a-z0-9]) send "$c" ;;
    [A-Z])    send "shift-$(printf '%s' "$c" | tr 'A-Z' 'a-z')" ;;
    ' ') send spc ;;      '.') send dot ;;        ',') send comma ;;
    '-') send minus ;;    '=') send equal ;;      '/') send slash ;;
    ';') send semicolon ;; "'") send apostrophe ;; '\') send backslash ;;
    '[') send bracket_left ;; ']') send bracket_right ;;
    '`') send grave_accent ;;
    '_') send shift-minus ;; '+') send shift-equal ;; ':') send shift-semicolon ;;
    '"') send shift-apostrophe ;; '|') send shift-backslash ;; '?') send shift-slash ;;
    '~') send shift-grave_accent ;;
    '!') send shift-1 ;; '@') send shift-2 ;; '#') send shift-3 ;; '$') send shift-4 ;;
    '%') send shift-5 ;; '^') send shift-6 ;; '&') send shift-7 ;; '*') send shift-8 ;;
    '(') send shift-9 ;; ')') send shift-0 ;;
    '{') send shift-bracket_left ;; '}') send shift-bracket_right ;;
    '<') send shift-comma ;; '>') send shift-dot ;;
    *) echo "WARN: unmapped char '$c'" >&2 ;;
  esac
done
send ret
echo "typed ${#TXT} chars + Enter into $SOCK"
