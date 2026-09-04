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
# 2026-09-04: this gate had been failing on a CLEAN tree for an unknown length of
# time, and so was being ignored -- which is worse than not having it. The parser
# matched any line containing the string "dnf install", INCLUDING comments, and
# fed the English prose after that phrase to dnf as package names. Eight comment
# lines in the Containerfile mention "dnf install" while explaining why something
# is ordered the way it is; Containerfile:2682 alone contributed "later pulled
# back in and restored the file". The gate therefore reported DO NOT BUILD on
# every run, for reasons that had nothing to do with the packages.
# Fixed by stripping comments BEFORE joining line continuations, and by asserting
# that known-good packages actually survive the parse -- a parser that quietly
# extracts the wrong tokens must fail loudly, not report a clean list.
#
# Run:  tests/pkg-preflight.sh [REPO_ROOT]
# Exit 0 = every package resolves (or the check was explicitly SKIPPED).
# Non-zero = do NOT build.
set -uo pipefail
REPO="${1:-$HOME/work/secureprospective-advisor-os}"
CF="$REPO/projects/sp-plus/images/kde/Containerfile"

echo "=== SP+ PACKAGE PREFLIGHT ==="
[ -f "$CF" ] || { echo "  FAIL Containerfile not found at $CF"; exit 2; }

BASE="$(grep -m1 '^FROM' "$CF" | awk '{print $2}')"
[ -n "$BASE" ] || { echo "  FAIL could not read FROM line from $CF"; exit 2; }
echo "  base image: $BASE"

PKGS="$(python3 - "$CF" <<'PY'
import sys, re

lines = open(sys.argv[1], encoding='utf-8').read().splitlines()

# Strip whole-line comments FIRST. This is the fix: a comment line that merely
# mentions "dnf install" while explaining something must never be parsed as an
# install command. Dropping the line before continuations are joined also keeps
# a trailing backslash attaching to the next REAL line, which is what the shell
# does anyway.
code = [ln for ln in lines if not ln.lstrip().startswith('#')]

raw = '\n'.join(code).replace('\\\n', ' ')

# Accepts "dnf install" and "dnf -y install".
CMD = re.compile(r'\bdnf\s+(?:-\S+\s+)*install\b')
# A plausible rpm name. Anything else -- paths, variables, redirections, prose
# punctuation -- is not a package and is dropped.
NAME = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._+-]*$')

names = []
for line in raw.splitlines():
    s = line.strip()
    if not CMD.search(s):
        continue
    # Installs that first add a third-party repo (Brave) cannot resolve against
    # the bare base image and are not what this gate is for.
    if 'yum.repos.d' in s:
        continue
    # A single RUN can carry more than one install; take them all.
    for seg in CMD.split(s)[1:]:
        seg = re.split(r'&&|\|\||[;|]', seg)[0]
        for tok in seg.split():
            if tok.startswith('-') or '=' in tok or '/' in tok or '$' in tok:
                continue
            if NAME.match(tok):
                names.append(tok)

print(' '.join(sorted(set(names))))
PY
)"
[ -n "$PKGS" ] || { echo "  FAIL no dnf install packages found in $CF"; exit 2; }

# The parse itself is gated. A silently wrong parser is how this file spent weeks
# reporting DO NOT BUILD; an empty or garbled list must fail here, not later.
for must in sddm bluez libreoffice-writer plasma-workspace konsole; do
  case " $PKGS " in
    *" $must "*) ;;
    *) echo "  FAIL parser did not find '$must' in the install list; the Containerfile"
       echo "       changed shape and this gate is no longer reading it correctly"
       exit 2 ;;
  esac
done
for never in the this that and file transaction blueman; do
  case " $PKGS " in
    *" $never "*)
       echo "  FAIL parser produced '$never', which is not a package. It is reading"
       echo "       prose or a removed package as an install argument."
       exit 2 ;;
  esac
done

echo "  parsed $(echo "$PKGS" | wc -w) packages, parser self-check OK"

if ! command -v podman >/dev/null 2>&1; then
  echo "  SKIP podman not available; packages were NOT resolved"
  exit 0
fi

# --assumeno resolves the full transaction and then declines it: nothing is
# downloaded or installed, but an unknown name still errors exactly as it would
# during the build.
OUT="$(sudo -n podman run --rm --network=host "$BASE" \
        dnf install --assumeno --setopt=install_weak_deps=False $PKGS 2>&1)"
RC=$?

if printf '%s\n' "$OUT" | grep -qiE 'sudo: a password is required|a terminal is required'; then
  echo "  SKIP rootful podman needs a password here; packages were NOT resolved"
  exit 0
fi

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
