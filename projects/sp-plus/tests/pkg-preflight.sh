#!/usr/bin/env bash
# SP+ PACKAGE PREFLIGHT. Resolves every package the KDE Containerfile installs
# against the real base image repos, WITHOUT building anything.
#
# WHY THIS FILE EXISTS: cycle34 burned a full ~15 minute build to discover that
# "google-caladea-fonts" does not exist in Fedora 44 (the package is
# "caladea-fonts"). dnf reports that as "No match for argument" and fails the
# whole RUN layer. Resolving the list up front turns a 15 minute failure into a
# sub-minute one.
#
# Run:  tests/pkg-preflight.sh [REPO_ROOT]
# Exit 0 = every package resolves. Non-zero = do NOT build.
set -uo pipefail
REPO="${1:-$HOME/work/secureprospective-advisor-os}"
CF="$REPO/projects/sp-plus/images/kde/Containerfile"

echo "=== SP+ PACKAGE PREFLIGHT ==="

BASE="$(grep -m1 '^FROM' "$CF" | awk '{print $2}')"
[ -n "$BASE" ] || { echo "  FAIL could not read FROM line from $CF"; exit 2; }
echo "  base image: $BASE"

# Pull the package list out of every "dnf install" RUN block. Continuations are
# joined first; flags and shell operators are dropped, leaving bare package names.
PKGS="$(python3 - "$CF" <<'PY'
import sys, re
raw = open(sys.argv[1]).read().replace('\\\n', ' ')
names = []
for line in raw.splitlines():
    s = line.strip()
    if 'dnf install' not in s:
        continue
    # Skip installs that first add a third-party repo (Brave). Those packages
    # cannot resolve against the bare base image and are not what this gate is for.
    if 'yum.repos.d' in s:
        continue
    s = s.split('dnf install', 1)[1]
    s = s.split('&&')[0]
    for tok in s.split():
        if tok.startswith('-') or '=' in tok or tok in ('\\', '|', ';'):
            continue
        names.append(tok)
print(' '.join(sorted(set(names))))
PY
)"
[ -n "$PKGS" ] || { echo "  FAIL no dnf install packages found in $CF"; exit 2; }
echo "  resolving $(echo "$PKGS" | wc -w) packages"

if ! command -v podman >/dev/null 2>&1; then
  echo "  SKIP podman not available; cannot resolve packages here"
  exit 0
fi

# --assumeno resolves the full transaction and then declines it: nothing is
# downloaded or installed, but an unknown name still errors exactly as it would
# during the build.
OUT="$(sudo -n podman run --rm --network=host "$BASE" \
        dnf install --assumeno --setopt=install_weak_deps=False $PKGS 2>&1)"
RC=$?

BAD="$(printf '%s\n' "$OUT" | grep -E '^No match for argument:|^Problem|^Error: Unable to find a match' || true)"
if [ -n "$BAD" ]; then
  echo "  FAIL one or more packages do not resolve against $BASE"
  printf '%s\n' "$BAD" | sed 's/^/       /'
  echo "DO NOT BUILD."
  exit 1
fi

# rc 1 with no unresolved names is the expected "operation aborted" from --assumeno.
if [ $RC -ne 0 ] && ! printf '%s\n' "$OUT" | grep -qiE 'Operation aborted|cancelled by user|Exiting'; then
  echo "  FAIL dnf resolve failed for a reason other than the declined transaction"
  printf '%s\n' "$OUT" | tail -20 | sed 's/^/       /'
  echo "DO NOT BUILD."
  exit 1
fi

echo "  PASS every package resolves against $BASE"
echo "Safe to build."
