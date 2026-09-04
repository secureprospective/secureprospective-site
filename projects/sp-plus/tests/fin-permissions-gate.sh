#!/usr/bin/env bash
# SP+ FIN PERMISSIONS GATE -- can Fin still be the tech buddy, and can it still
# wreck the advisor's work?
#
# WHY THIS GATE EXISTS. Fin holds unprompted root by design: a password prompt
# the advisor cannot answer stops every genuine repair. The guardrails are the
# consequence of that grant, and they have to fail in BOTH directions to be
# worth having -- an assistant that cannot fix a printer is the failure this
# product exists to remove, and one that silently overwrites a client file is
# worse than no assistant at all.
#
# A sweep on 2026-09-04 found the catalogue was built around DRAMATIC
# destruction -- mkfs, dd, shred, luksKillSlot -- and 9 of 10 realistic
# accidents went straight through: cp and mv overwrite silently by default, a
# redirect truncates, rsync --delete mirrors, and bash redirection walked around
# the workspace confinement entirely. None of those are malice. They are what a
# helpful assistant reaches for while tidying up.
#
# The rules are read out of the shipped extension and EXECUTED. An approximation
# written here would pass while the real rule did nothing.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPPLUS="$(dirname "$HERE")"
GUARD="$SPPLUS/config/fin-extensions/spplus-guardrails.ts"
PROBE="$HERE/fin-permissions-probe.cjs"

echo "=== SP+ FIN PERMISSIONS GATE ==="
[ -f "$GUARD" ] || { echo "  FAIL missing $GUARD"; exit 2; }
[ -f "$PROBE" ] || { echo "  FAIL missing $PROBE"; exit 2; }
if ! command -v node >/dev/null 2>&1; then
  echo "  SKIP node is not available; the permission surface was NOT exercised"; exit 0
fi

node "$PROBE" "$GUARD"
rc=$?
echo
[ $rc -eq 0 ] && echo "FIN PERMISSIONS GATE: PASS" || echo "FIN PERMISSIONS GATE: FAIL"
exit $rc
