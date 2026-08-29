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

# P-8b  the Print Screen portal grant must NOT sit behind the theme's early exit.
# This is the defect that made Flameshot intermittently broken out of the box for
# many cycles: spplus-first-login bailed out on a cosmetic wallpaper or
# look-and-feel failure BEFORE granting the screenshot permission, so whether the
# advisor met a permission prompt on their first Print Screen was decided by
# whether the wallpaper verified. Assert the grant is reached unconditionally by
# checking no `exit 1` stands between the theme gate and the grant.
FL="$C/spplus-first-login"
grant_line=$(grep -n '^if grant_screenshot_permission' "$FL" | cut -d: -f1)
if [ -z "$grant_line" ]; then
  bad "spplus-first-login never calls grant_screenshot_permission" "Print Screen will prompt the advisor"
elif head -n "$grant_line" "$FL" | grep -qE '^[[:space:]]*exit 1[[:space:]]*$'; then
  bad "an early exit precedes the screenshot grant" \
      "a cosmetic theme failure would skip it and Print Screen would prompt"
else
  ok "the screenshot portal grant is reached regardless of the theme result"
fi

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

# P-11  DN-29 source gate: all three home-creation layers and the image gate must
# remain wired. The actual payload owner is images/kde/Containerfile; the older
# projects/sp-plus/Containerfile is not used by the sanctioned SP+ build.
DN29CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN29HELPER="$REPO/projects/sp-plus/config/spplus-mkhomedir"
DN29UNIT="$REPO/projects/sp-plus/config/spplus-mkhomedir.service"
DN29KS="$REPO/projects/sp-plus/installer/interactive-defaults.ks"
DN29_OK=1
for needle in \
  'authselect create-profile sp-plus' \
  'pam_mkhomedir.so umask=0077 silent' \
  'authselect select custom/sp-plus' \
  'test -f /usr/lib64/security/pam_mkhomedir.so' \
  'COPY config/spplus-mkhomedir         /usr/libexec/spplus-mkhomedir' \
  'COPY config/spplus-mkhomedir.service /usr/lib/systemd/system/spplus-mkhomedir.service' \
  'DN29_HOME_GATE_OK' \
  'systemd-analyze verify /usr/lib/systemd/system/spplus-mkhomedir.service' \
  'systemctl enable spplus-mkhomedir.service'; do
  grep -qF "$needle" "$DN29CF" || { DN29_OK=0; echo "       missing payload assertion: $needle"; }
done
for needle in \
  'uid' '65000' '/var/home/$name' '/etc/skel' 'install -d -m 0700' \
  'chown -R' 'restorecon -RF'; do
  grep -qF "$needle" "$DN29HELPER" || { DN29_OK=0; echo "       missing helper behavior: $needle"; }
done
grep -qF 'Before=display-manager.service sddm.service graphical.target' "$DN29UNIT" \
  || { DN29_OK=0; echo '       first-boot unit is not ordered before display manager and graphical.target'; }
grep -qF 'WantedBy=graphical.target' "$DN29UNIT" \
  || { DN29_OK=0; echo '       first-boot unit is not enabled through graphical.target'; }
for needle in 'while IFS=: read -r name' 'mkdir -p "$home"' 'restorecon -RF "$home"'; do
  grep -qF "$needle" "$DN29KS" || { DN29_OK=0; echo "       missing installer fallback: $needle"; }
done
[ "$DN29_OK" -eq 1 ] \
  && ok "DN-29 all three home layers and build gate are wired" \
  || bad "DN-29 source gate failed" "keep PAM, first-boot, installer fallback, and their build assertions together"

# P-12  DN-28 source gate: the progress bar must stay WEIGHTED. DeployBootcTask is
# ~95% of the wall clock but one of ~11 tasks, so an equal-weight denominator gives
# it ~9% of the bar and the install looks hung on slow hardware. The weighting keys
# off the task's name, so the patch script must also refuse to run if that changes.
DN28P="$REPO/projects/sp-plus/installer/patch-anaconda-progress.py"
DN28_OK=1
for needle in \
  "SPPLUS_DEPLOY_TASK_NAME = 'Deploy bootc'" \
  'SPPLUS_DEPLOY_WEIGHT = 10000' \
  'SPPLUS_DEPLOY_WEIGHT if SPPLUS_DEPLOY_TASK in _spplus_name else 100' \
  'step_number=self._completed_steps + step * 100' \
  'sys.exit(1)'; do
  grep -qF "$needle" "$DN28P" || { DN28_OK=0; echo "       missing DN-28 weighting: $needle"; }
done
grep -qF 'queue.task_count * 100' "$DN28P" \
  && { DN28_OK=0; echo '       DN-28 regressed to the equal-weight denominator'; }
# The installer Containerfile asserts on the PATCHED anaconda source. Those
# assertions and the patch script must describe the same design -- on cycle43
# they did not, the stale gate still demanded 'queue.task_count * 100', and the
# build died at STEP 17/26 after the payload image had already been built.
DN28CF="$REPO/projects/sp-plus/installer/Containerfile"
for needle in 'SPPLUS_DEPLOY_WEIGHT = 10000' 'self._completed_steps + step * 100'; do
  grep -qF "$needle" "$DN28CF" \
    || { DN28_OK=0; echo "       installer gate is stale, does not assert: $needle"; }
done
grep -qF 'queue.task_count * 100' "$DN28CF" \
  && { DN28_OK=0; echo '       installer gate still demands the equal-weight denominator'; }
[ "$DN28_OK" -eq 1 ] \
  && ok "DN-28 progress bar is weighted by real cost, not task count" \
  || bad "DN-28 source gate failed" "an unweighted bar reads as a hung install on slow hardware"

# P-13  DN-32 source gate: the tuner must stay survey-only and image-safe.
# Two failures this gate exists to stop, both of which cost real time already:
#   1. A package-install verb anywhere in the tuner. VERIFIED on the Dell
#      2026-08-29: layering `npm` made bootc refuse to upgrade at all and marked
#      the deployment incompatible, while the desktop looked completely normal.
#      A machine that silently stops receiving updates is the worst failure this
#      product has.
#   2. Testing the sysfs EDID node with `-s`. sysfs reports st_size 0 while the
#      node reads back 128 bytes, so the test is always false and every display
#      collapses into one scope -- the laptop-panel/dock confusion that keying by
#      EDID exists to prevent. This shipped in the first draft.
DN32T="$REPO/projects/sp-plus/config/spplus-tune"
DN32CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN32_OK=1
[ -f "$DN32T" ] || { DN32_OK=0; echo "       missing $DN32T"; }
if [ -f "$DN32T" ]; then
  bash -n "$DN32T" 2>/dev/null || { DN32_OK=0; echo "       spplus-tune does not parse"; }
  for verb in "dnf " "rpm-ostree install" "yum " "akmods" "flatpak install" "remote-add" "setenforce" "firewall-cmd"; do
    grep -qF "$verb" "$DN32T" \
      && { DN32_OK=0; echo "       tuner contains a forbidden verb: $verb"; }
  done
  grep -qF 'edid_len=$(wc -c < "$c/edid"' "$DN32T" \
    || { DN32_OK=0; echo "       tuner no longer reads EDID by byte count"; }
  grep -qF '[ -s "$c/edid" ]' "$DN32T" \
    && { DN32_OK=0; echo "       tuner tests sysfs EDID with -s; always false"; }
  grep -qF 'UPDATE_HEALTH="BROKEN"' "$DN32T" \
    || { DN32_OK=0; echo "       tuner lost the update-health detector"; }
fi
# The image must actually ship it, with its build gate. A tuner in the repo that
# no Containerfile copies is not in the product.
grep -qF 'COPY config/spplus-tune /usr/libexec/spplus-tune' "$DN32CF" \
  || { DN32_OK=0; echo "       payload Containerfile does not COPY spplus-tune"; }
grep -qF 'DN32_TUNE_GATE_OK' "$DN32CF" \
  || { DN32_OK=0; echo "       payload Containerfile has no DN-32 build gate"; }
# The fixture-backed unit gate must still pass.
if [ -x "$REPO/projects/sp-plus/tests/test-update-health.sh" ]; then
  "$REPO/projects/sp-plus/tests/test-update-health.sh" >/dev/null 2>&1 \
    || { DN32_OK=0; echo "       test-update-health.sh fails"; }
else
  DN32_OK=0; echo "       missing tests/test-update-health.sh"
fi
[ "$DN32_OK" -eq 1 ] \
  && ok "DN-32 tuner is survey-only, image-safe, shipped and gated" \
  || bad "DN-32 source gate failed" "the tuner must never layer packages and must read EDID by bytes"

# P-14  DN-30 update-health gate. A machine that has fallen off the update path
# looks entirely normal from the desktop -- verified on the Dell, where a layered
# `npm` made bootc refuse to upgrade while nothing on screen changed. The check
# must run DAILY and must be Persistent, because the machine most likely to be in
# a bad state is the laptop that was closed at the scheduled moment.
DN30S="$REPO/projects/sp-plus/config/spplus-update-health.service"
DN30T="$REPO/projects/sp-plus/config/spplus-update-health.timer"
DN30CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN30_OK=1
for f in "$DN30S" "$DN30T"; do
  [ -f "$f" ] || { DN30_OK=0; echo "       missing $f"; }
done
if [ -f "$DN30S" ] && [ -f "$DN30T" ]; then
  # ONE implementation of the rule. A second copy of the detection logic in the
  # unit would drift from the tuner's, and the two would disagree silently.
  grep -q '^ExecStart=/usr/libexec/spplus-tune$' "$DN30S" \
    || { DN30_OK=0; echo "       health unit does not reuse the tuner detector"; }
  grep -q '^OnCalendar=daily$' "$DN30T" \
    || { DN30_OK=0; echo "       health timer is not daily"; }
  grep -q '^Persistent=true$' "$DN30T" \
    || { DN30_OK=0; echo "       health timer is not Persistent; a closed laptop would skip it"; }
fi
grep -qF 'COPY config/spplus-update-health.service' "$DN30CF" \
  || { DN30_OK=0; echo "       Containerfile does not ship the health unit"; }
grep -qF 'DN30_HEALTH_GATE_OK' "$DN30CF" \
  || { DN30_OK=0; echo "       Containerfile has no DN-30 build gate"; }
grep -qF 'systemctl enable spplus-update-health.timer' "$DN30CF" \
  || { DN30_OK=0; echo "       health timer is shipped but never enabled"; }
[ "$DN30_OK" -eq 1 ] \
  && ok "DN-30 update-health check is daily, persistent, shipped and enabled" \
  || bad "DN-30 health gate failed" "a machine that cannot update must not fail silently"

echo
echo "=== $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] || { echo "DO NOT BUILD."; exit 1; }
echo "Safe to build."
