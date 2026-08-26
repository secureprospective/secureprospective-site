#!/usr/bin/env bash
# Compare two SP+ field reports. Usage: field-diff.sh REPORT_A REPORT_B
# Section 10 (hardware) and 11 (volatile) are EXPECTED to differ and are dropped.
set -e
[ $# -eq 2 ] || { echo "usage: $0 REPORT_A REPORT_B" >&2; exit 2; }
strip() { sed -n '/^############ SP+/,/^=== 10\./p' "$1" | grep -v '^=== 10\.'; }
A=$(mktemp); B=$(mktemp); trap 'rm -f $A $B' EXIT
strip "$1" > $A; strip "$2" > $B

echo "=== PROBLEMS in $(basename "$1") ==="
grep -E '\bPROBLEM$' "$1" || echo "  none"
echo
echo "=== PROBLEMS in $(basename "$2") ==="
grep -E '\bPROBLEM$' "$2" || echo "  none"
echo
echo "=== REGRESSIONS (OK in A, PROBLEM in B) ==="
comm -12 \
  <(grep -E '\bOK$' "$1" | awk '{print $1}' | sort -u) \
  <(grep -E '\bPROBLEM$' "$2" | awk '{print $1}' | sort -u) | sed 's/^/  /' || true
echo
echo "=== BEHAVIOURAL DIFF (hardware + volatile excluded) ==="
diff -u $A $B || true
