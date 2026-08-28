#!/usr/bin/env bash
# SP+ CONFIG PAYLOAD PREFLIGHT. Static checks on the /etc/skel and helper payload
# that images/kde/Containerfile copies in and gates at build time.
#
# WHY THIS FILE EXISTS: these checks used to be hand-copied into each Bee build
# brief. On cycle34 a brief-local check ("! grep -q writer_OOXML") flagged a token
# that appeared only inside an explanatory XML comment, so the agent correctly
# refused to build against a check that was itself wrong. Checks belong in the repo
# next to what they check, so a brief can say "run this" and never drift.
#
# Run from anywhere:  tests/config-preflight.sh [REPO_ROOT]
# Exit 0 = safe to build. Non-zero = do NOT build.
set -uo pipefail
REPO="${1:-$HOME/work/secureprospective-advisor-os}"
C="$REPO/projects/sp-plus/config"
CF="$REPO/projects/sp-plus/images/kde/Containerfile"
FAIL=0; PASS=0
ok()  { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; printf '       %s\n' "$2"; FAIL=$((FAIL+1)); }

echo "=== SP+ CONFIG PAYLOAD PREFLIGHT ==="

# P-1  the tree must be clean and on the working branch, or the build is not reproducible
if [ -z "$(git -C "$REPO" status --porcelain)" ]; then
  ok "git tree is clean"
else
  bad "git tree is dirty" "commit or discard before building; the image records a commit"
fi
BR="$(git -C "$REPO" branch --show-current)"
[ "$BR" = session/sp-plus-plan ] \
  && ok "on branch session/sp-plus-plan" \
  || bad "on branch '$BR'" "SP+ work never happens on main"

# P-2  every COPY source in the Containerfile must exist in the build context
if python3 - "$CF" "$REPO/projects/sp-plus" <<'PY'
import sys, os, shlex
cf, ctx = sys.argv[1], sys.argv[2]
raw = open(cf).read().replace('\\\n', ' ')
missing = []
for line in raw.splitlines():
    s = line.strip()
    if not s.upper().startswith('COPY '):
        continue
    parts = [p for p in shlex.split(s)[1:] if not p.startswith('--')]
    for src in parts[:-1]:
        if not os.path.exists(os.path.join(ctx, src)):
            missing.append(src)
            print('       missing COPY source:', src)
sys.exit(1 if missing else 0)
PY
then
  ok "every Containerfile COPY source exists in the build context"
else
  bad "a Containerfile COPY source is missing" "the build will fail late; fix the path or add the file"
fi

# P-3  shell helpers must parse
SH_OK=1
for f in fin fin-tips spplus-first-login spplus-grant-admin sp-plus-starship.sh; do
  bash -n "$C/$f" 2>/dev/null || { SH_OK=0; echo "       bash -n failed: $f"; }
done
[ $SH_OK -eq 1 ] && ok "all shell helpers parse" || bad "a shell helper has a syntax error" "see above"

# P-4  sudoers must parse, or the installed system loses admin access entirely
# visudo lives in /usr/sbin, which is not on a non-root user's PATH. Calling it
# bare made this gate report "sudoers-sp-plus is invalid" and print DO NOT BUILD
# on a file that parses perfectly -- the reason was the caller's PATH, not the
# file. Resolve it explicitly. If it genuinely cannot be found the gate still
# fails closed, because an unparsed sudoers really can lock admin out, but it now
# says which of the two happened. 2026-08-28.
_visudo=""
for _v in visudo /usr/sbin/visudo /sbin/visudo; do
  command -v "$_v" >/dev/null 2>&1 && { _visudo="$_v"; break; }
done
if [ -z "$_visudo" ]; then
  bad "sudoers-sp-plus unverified" "visudo not found, so the sudoers file could not be parsed"
elif "$_visudo" -cf "$C/sudoers-sp-plus" >/dev/null 2>&1; then
  ok "sudoers-sp-plus parses"
else
  bad "sudoers-sp-plus is invalid" "a bad sudoers file locks admin out of the installed machine"
fi

# P-5  LibreOffice defaults: well-formed XML, required filter NAMES present, and no
# internal type name used as an actual value. Comments are stripped first -- prose
# that MENTIONS an internal name is documentation, not a defect.
LOX="$C/skel/.config/libreoffice/4/user/registrymodifications.xcu"
if python3 -c "import sys,xml.dom.minidom as m; m.parse(sys.argv[1])" "$LOX" 2>/dev/null; then
  ok "registrymodifications.xcu is well-formed XML"
else
  bad "registrymodifications.xcu is not well-formed XML" "LibreOffice silently discards the whole user layer"
fi
LOX_OK=1
for s in "notebookbar.ui" "colibre" "Office Open XML Text" "Calc Office Open XML" "Impress Office Open XML"; do
  grep -qF "$s" "$LOX" || { LOX_OK=0; echo "       missing: $s"; }
done
[ $LOX_OK -eq 1 ] && ok "all required LibreOffice settings present" || bad "a LibreOffice setting is missing" "see above"
if python3 -c "
import sys, re
d = re.sub(r'<!--.*?-->', '', open(sys.argv[1]).read(), flags=re.S)
sys.exit(1 if 'writer_OOXML' in d else 0)" "$LOX"; then
  ok "no internal type name used as a filter value (comments excluded)"
else
  bad "an internal type name is used as a real value" "ooSetupFactoryDefaultFilter takes filter NAMES, not type names"
fi

# P-6  coaching tip catalogue shape
awk '!/^#/ && NF { if ($0 !~ /^[a-z0-9]+-[0-9]+/) exit 1; n++ } END { exit !(n==20) }' "$C"/fin-tip-catalogue/*.tips \
  && ok "tip catalogue has 20 well-formed tips" \
  || bad "tip catalogue is malformed or not 20 tips" "each line must be 'id<TAB>text'"

# P-7  /techhelp menu shape: exactly 4 options, #4 is the open-ended one, and none
# offers to fix connectivity (Fin is a cloud assistant and cannot help when offline)
F="$C/fin-prompts/techhelp.md"
N=$(grep -cE '^[1-4]\. ' "$F")
if [ "$N" -eq 4 ] && grep -E '^[1-4]\. ' "$F" | sed -n '4p' | grep -q '^4\. Something else' \
   && ! grep -qE '^[1-4]\. .*get online' "$F"; then
  ok "/techhelp has 4 options, #4 open-ended, no offline option"
else
  bad "/techhelp menu shape is wrong" "found $N numbered options"
fi

# P-8  desktop entries must validate or KDE ignores them without saying so
desktop-file-validate "$C/flameshot-capture.desktop" 2>/dev/null \
  && desktop-file-validate "$C/spplus-screenshot.desktop" 2>/dev/null \
  && ok "screenshot desktop entries validate" \
  || bad "a flameshot desktop entry is invalid" "KDE drops invalid entries silently"

# P-9  fastfetch config must carry escapes in the JSON backslash-u form, never as a
# raw ESC byte, which breaks the JSONC parser
if grep -qP '\x1b' "$C/skel/.config/fastfetch/config.jsonc"; then
  bad "fastfetch config contains a raw ESC byte" "use the JSON escape form instead"
else
  ok "fastfetch config has no raw ESC byte"
fi

# P-10  cycle36 source gate: every confirmed defect must have its actual fix and
# an executing assertion wired into the image or installed-system gate.
if "$REPO/projects/sp-plus/tests/cycle36-source-gate.sh"; then
  ok "cycle36 fixes have source/runtime gates"
else
  bad "cycle36 source gate failed" "do not build while any cycle36 fix or gate is absent"
fi

echo
echo "=== $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] || { echo "DO NOT BUILD."; exit 1; }
echo "Safe to build."
