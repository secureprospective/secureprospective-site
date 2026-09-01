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

# P-15  DN-34 flatpak update gate. DN-26 moved Zoom to a Flatpak on the grounds
# that "a Flatpak updates on its own schedule". It does not: `flatpak preinstall`
# deploys MISSING refs and never advances an installed one, and Discover only
# updates while a human has it open and clicks. The product frame is that
# everything updates from stable with the advisor out of the loop, so the update
# has to be a timer in the image or DN-26's own rationale is false on a shipped
# machine -- Zoom refuses connections below its minimum client version.
DN34S="$REPO/projects/sp-plus/config/spplus-flatpak-update.service"
DN34T="$REPO/projects/sp-plus/config/spplus-flatpak-update.timer"
DN34P="$REPO/projects/sp-plus/config/spplus-flatpak-preinstall.timer"
DN34CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN34_OK=1
for f in "$DN34S" "$DN34T"; do
  [ -f "$f" ] || { DN34_OK=0; echo "       missing $f"; }
done
if [ -f "$DN34S" ] && [ -f "$DN34T" ]; then
  grep -q '^ExecStart=/usr/bin/flatpak update --system --noninteractive -y$' "$DN34S" \
    || { DN34_OK=0; echo "       update unit does not run a system-scope flatpak update"; }
  grep -q '^OnCalendar=daily$' "$DN34T" \
    || { DN34_OK=0; echo "       flatpak update timer is not daily"; }
  grep -q '^Persistent=true$' "$DN34T" \
    || { DN34_OK=0; echo "       flatpak update timer is not Persistent; a closed laptop would skip it"; }
  # flatpak takes an exclusive system installation lock. If preinstall and update
  # fire at the same offset one of them dies on the lock, silently.
  if [ -f "$DN34P" ]; then
    [ "$(grep '^OnBootSec=' "$DN34T")" != "$(grep '^OnBootSec=' "$DN34P")" ] \
      || { DN34_OK=0; echo "       update and preinstall share OnBootSec; they will collide on the flatpak lock"; }
  fi
fi
grep -qF 'COPY config/spplus-flatpak-update.service' "$DN34CF" \
  || { DN34_OK=0; echo "       Containerfile does not ship the flatpak update unit"; }
grep -qF 'DN34_FLATPAK_UPDATE_OK' "$DN34CF" \
  || { DN34_OK=0; echo "       Containerfile has no DN-34 build gate"; }
grep -qF 'systemctl enable spplus-flatpak-update.timer' "$DN34CF" \
  || { DN34_OK=0; echo "       flatpak update timer is shipped but never enabled"; }
[ "$DN34_OK" -eq 1 ] \
  && ok "DN-34 flatpak updates are daily, persistent, staggered, shipped and enabled" \
  || bad "DN-34 flatpak update gate failed" "a shipped Flatpak that never updates defeats DN-26"

# P-15b  DN-46 system updates. The stock bootc timer runs `bootc upgrade --apply`
# and reboots the machine on its own schedule, which cannot be allowed to happen
# during a client appointment. SP+ stages instead and lets the shutdown the
# advisor performs anyway apply it, so the checks here are about what must NOT be
# there as much as what must.
DN46S="$REPO/projects/sp-plus/config/spplus-stage-update.service"
DN46T="$REPO/projects/sp-plus/config/spplus-stage-update.timer"
DN46X="$REPO/projects/sp-plus/config/spplus-stage-update"
DN46N="$REPO/projects/sp-plus/config/spplus-update-notify"
DN46NT="$REPO/projects/sp-plus/config/spplus-update-notify.timer"
DN46CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN46_OK=1
for f in "$DN46S" "$DN46T" "$DN46X" "$DN46N" "$DN46NT"; do
  [ -f "$f" ] || { DN46_OK=0; echo "       missing $f"; }
done
# The one thing that must never come back: an --apply anywhere on the staging
# path turns this straight back into an unannounced reboot.
for f in "$DN46S" "$DN46X"; do
  [ -f "$f" ] || continue
  # Comments in both files quote the stock unit's `bootc upgrade --apply` to
  # explain why SP+ does not use it, so only live lines count here.
  grep -v '^[[:space:]]*#' "$f" | grep -q -- '--apply' \
    && { DN46_OK=0; echo "       $(basename "$f") carries --apply; that reboots the advisor without asking"; }
done
if [ -f "$DN46T" ]; then
  grep -q '^OnCalendar=daily$' "$DN46T" || { DN46_OK=0; echo "       staging timer is not daily"; }
  grep -q '^Persistent=true$' "$DN46T" \
    || { DN46_OK=0; echo "       staging timer is not Persistent; a closed laptop would skip it"; }
fi
# The marker must be keyed on the image digest. Every build in the SP+ 1 line
# reports version '1', so keying on the version announces one update and then
# silently swallows every one after it.
if [ -f "$DN46X" ]; then
  grep -q 'imageDigest' "$DN46X" \
    || { DN46_OK=0; echo "       staging script does not key the marker on imageDigest"; }
fi
# A .path unit on the marker drove the notifier into its start limit and killed
# the watcher, so a later update would never be announced. It must stay a timer.
[ -e "$REPO/projects/sp-plus/config/spplus-update-notify.path" ] \
  && { DN46_OK=0; echo "       the .path notifier is back; it hits its start limit and stops watching"; }
if [ -f "$DN46N" ]; then
  grep -qE '(^|[^-[:alnum:]])sudo([^-[:alnum:]]|$)|pkexec' "$DN46N" \
    && { DN46_OK=0; echo "       session notifier tries to escalate; it will never run in a session"; }
fi
grep -qF 'DN46_UPDATE_GATE_OK' "$DN46CF" \
  || { DN46_OK=0; echo "       Containerfile has no DN-46 build gate"; }
grep -qF 'systemctl enable spplus-stage-update.timer' "$DN46CF" \
  || { DN46_OK=0; echo "       staging timer is shipped but never enabled"; }
grep -qF 'systemctl --global enable spplus-update-notify.timer' "$DN46CF" \
  || { DN46_OK=0; echo "       notifier timer is shipped but never enabled for user sessions"; }
[ "$DN46_OK" -eq 1 ] \
  && ok "DN-46 updates stage daily, apply at shutdown, never reboot, announce once" \
  || bad "DN-46 update policy gate failed" "either updates stop arriving or the machine reboots on the advisor"

# P-16  DN-36 wifi powersave. The value reads BACKWARDS: NetworkManager's
# wifi.powersave is 0=default 1=ignore 2=disable 3=enable, so 2 disables power
# saving and 3 would enable it. A well-meaning "fix" to 3 would silently
# reintroduce the 71 ms / 125 ms LAN latency measured on the Dell's 7260.
DN36F="$REPO/projects/sp-plus/config/networkmanager/90-spplus-wifi-powersave.conf"
DN36CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN36_OK=1
if [ -f "$DN36F" ]; then
  grep -q '^wifi.powersave=2$' "$DN36F" \
    || { DN36_OK=0; echo "       wifi.powersave is not 2 (2=disable; 3 would ENABLE power saving)"; }
else
  DN36_OK=0; echo "       missing $DN36F"
fi
grep -qF 'COPY config/networkmanager/90-spplus-wifi-powersave.conf /usr/lib/NetworkManager/conf.d/' "$DN36CF" \
  || { DN36_OK=0; echo "       drop-in is not shipped into /usr/lib (it would not survive bootc upgrade)"; }
grep -qF 'DN36_WIFI_POWERSAVE_OK' "$DN36CF" \
  || { DN36_OK=0; echo "       Containerfile has no DN-36 build gate"; }
[ "$DN36_OK" -eq 1 ] \
  && ok "DN-36 wifi power saving is disabled in image content" \
  || bad "DN-36 wifi powersave gate failed" "the 7260 parks between beacons and the desktop stalls"

# P-17  DN-32 "Have Fin check my Computer" -- the button and its promise.
# The name is load-bearing. v1 SURVEYS and changes nothing, because ownership of
# a setting cannot be inferred from its value (D2, the sacredness rule). A button
# named "make my computer better" over a survey-only engine is a broken promise
# on the advisor's FIRST contact with Fin, so the wording and the engine are
# gated together: if anyone gives the tuner an apply path, this gate is where the
# button's wording has to be revisited.
DN32H="$REPO/projects/sp-plus/welcome/app/index.html"
DN32J="$REPO/projects/sp-plus/welcome/app/app.js"
DN32P="$REPO/projects/sp-plus/welcome/welcome.py"
DN32T="$REPO/projects/sp-plus/config/spplus-tune"
DN32_OK=1
grep -qF 'id="fin-check"' "$DN32H" \
  || { DN32_OK=0; echo "       the check button is not on the Fin screen"; }
# The wording is gated on its PROMISE, not on one exact string: copy passes
# rewrite this button legitimately, and pinning the literal made an honest
# rewording look like a regression. What must hold is that the button offers to
# LOOK at the computer and never to change it, because the engine behind it only
# surveys. Any verb that promises repair is the actual defect.
python3 - "$DN32H" <<'PYWORD' || { DN32_OK=0; echo "       the check button's wording overpromises for a survey-only engine"; }
import re, sys
html = open(sys.argv[1]).read()
m = re.search(r'id="fin-check"[^>]*>(.*?)</button>', html, re.S)
if not m:
    sys.exit(1)
label = re.sub(r'<[^>]+>', ' ', m.group(1)).upper()
if 'CHECK' not in label:
    print('       button label does not offer a check:', label.strip())
    sys.exit(1)
for verb in ('FIX', 'REPAIR', 'IMPROVE', 'OPTIMI', 'SPEED UP', 'TUNE', 'CLEAN UP', 'BETTER'):
    if verb in label:
        print('       button label promises to change the computer:', verb)
        sys.exit(1)
sys.exit(0)
PYWORD
# It must come BEFORE "OPEN FIN": it is the advisor's first experience of Fin.
python3 - "$DN32H" <<'PYCHK' || { DN32_OK=0; echo "       the check button is not the FIRST action on the Fin screen"; }
import sys
h=open(sys.argv[1]).read()
sys.exit(0 if 0 <= h.find('id="fin-check"') < h.find('id="fin-launch"') else 1)
PYCHK
grep -qF "spplus:check-computer" "$DN32J" \
  || { DN32_OK=0; echo "       the button does not invoke the check-computer verb"; }
grep -qF "checkResult: finishCheck" "$DN32J" \
  || { DN32_OK=0; echo "       checkResult is not registered on the spWelcome bridge"; }
grep -qF "parsed.path == 'check-computer'" "$DN32P" \
  || { DN32_OK=0; echo "       welcome.py does not handle the check-computer verb"; }
# returncode 10 is "this machine cannot update" -- a RESULT, never an error.
grep -qF "returncode == 10" "$DN32P" \
  || { DN32_OK=0; echo "       welcome.py does not treat exit 10 as the update-broken RESULT"; }
if [ -f "$DN32T" ]; then
  for verb in "dnf " "rpm-ostree install" "flatpak install" "kwriteconfig"; do
    if grep -Fq "$verb" "$DN32T"; then
      DN32_OK=0
      echo "       tuner gained an apply verb ($verb): the button name now overpromises"
    fi
  done
fi
[ "$DN32_OK" -eq 1 ] \
  && ok "DN-32 check button is first on the Fin screen, wired, and honest about doing nothing" \
  || bad "DN-32 check button gate failed" "the advisor's first contact with Fin must not overpromise"

# P-18  DN-37 capture path. /usr is read-only on an image-mode system, so the
# screenshot mode must never write beneath ROOT (/usr/libexec/sp-plus/welcome).
# It did, and raised "OSError: [Errno 30] Read-only file system" on every real
# installation -- working only in a dev checkout, which is exactly the class of
# bug that survives to a shipped ISO.
DN37P="$REPO/projects/sp-plus/welcome/welcome.py"
DN37_OK=1
grep -qF "SPPLUS_CAPTURE_DIR" "$DN37P" \
  || { DN37_OK=0; echo "       capture directory is not overridable"; }
if grep -qF "out = ROOT / 'screenshots'" "$DN37P"; then
  DN37_OK=0; echo "       capture writes under ROOT, which is read-only on an installed machine"
fi
[ "$DN37_OK" -eq 1 ] \
  && ok "DN-37 screenshot capture writes somewhere writable" \
  || bad "DN-37 capture path gate failed" "capture mode would crash on every real install"

# P-19  DN-38 headless self-test. Four consecutive QC dispatches tried to script
# the live page through someone else's compositor over ssh and produced 24
# UNVERIFIED results and no findings. The harness must (a) exist, (b) NOT contend
# for the single-instance socket -- that lock is what blocked all four -- and
# (c) name the verbs it does not automate rather than quietly skipping them.
DN38P="$REPO/projects/sp-plus/welcome/welcome.py"
DN38_OK=1
grep -qF "'--self-test'" "$DN38P" \
  || { DN38_OK=0; echo "       no --self-test mode"; }
grep -qF "if not args.self_test:" "$DN38P" \
  || { DN38_OK=0; echo "       self-test contends for the single-instance lock that blocked 4 QC runs"; }
grep -qF "REQUIRES_HUMAN" "$DN38P" \
  || { DN38_OK=0; echo "       self-test does not declare what it cannot automate"; }
grep -qF "EXPECT = {" "$DN38P" \
  || { DN38_OK=0; echo "       self-test has no expectations; an error path returning ok:false would read as a failure"; }
[ "$DN38_OK" -eq 1 ] \
  && ok "DN-38 headless self-test exists, bypasses the lock, and is honest about coverage" \
  || bad "DN-38 self-test gate failed" "QC that cannot run is QC that does not happen"

# P-20  DN-40 GVFS. Welcome's office-folder check goes through GIO and needs the
# GVFS SMB backend to exist. It did not: verified on the Dell, `rpm -qa | grep
# gvfs` returned nothing and GIO answered NOT_SUPPORTED, "volume doesn't
# implement mount". A headline advisor feature that could never work.
DN40CF="$REPO/projects/sp-plus/images/kde/Containerfile"
DN40_OK=1
grep -qE 'dnf install .*gvfs-smb' "$DN40CF" \
  || { DN40_OK=0; echo "       gvfs-smb is not installed in the image; the office folder check cannot work"; }
grep -qF 'test -x /usr/libexec/gvfsd-smb' "$DN40CF" \
  || { DN40_OK=0; echo "       no build gate proving the SMB backend binary exists"; }
grep -qF 'DN40_GVFS_SMB_OK' "$DN40CF" \
  || { DN40_OK=0; echo "       Containerfile has no DN-40 gate"; }
[ "$DN40_OK" -eq 1 ] \
  && ok "DN-40 GVFS SMB backend is installed and gated" \
  || bad "DN-40 gvfs gate failed" "the office folder feature would ship unable to work"

# P-21  DN-41/DN-42 the Fin check summary. Three ways this went wrong, all of
# which shipped past a green build:
#   - the summary harvested every "- " line from THIS-MACHINE.md, which matched
#     only the wrapped caveats under ## Notes and showed advisors sentences cut
#     mid-clause;
#   - the list had NO css rule at all, so it inherited white from .fin-brief and
#     rendered white-on-grey where it overflowed that section -- Christopher hit
#     this on the Dell: "it populated some text but i cant see most of it";
#   - display:grid overrides [hidden], so the empty box showed before any check.
# A build cannot see any of these. These greps can.
DN41PY="$REPO/projects/sp-plus/welcome/welcome.py"
DN41CSS="$REPO/projects/sp-plus/welcome/app/app.css"
DN41HTML="$REPO/projects/sp-plus/welcome/app/index.html"
DN41_OK=1
grep -qF '_summarise_machine_doc' "$DN41PY" \
  || { DN41_OK=0; echo "       summary is not parsed structurally; it is scraping prose again"; }
grep -qE "^\s*if line\.startswith\('- '\)" "$DN41PY" \
  && { DN41_OK=0; echo "       the '- ' prose harvester is back; it only ever matched ## Notes"; }
grep -qF 'auth[' "$DN41PY" \
  || { DN41_OK=0; echo "       ask-password is not counted; a rejected password will loop to timeout"; }
grep -qF 'MountOperationResult.ABORTED' "$DN41PY" \
  || { DN41_OK=0; echo "       ask-password never aborts; same infinite retry loop as DN-41"; }
grep -qF "EXPECT_MESSAGE" "$DN41PY" \
  || { DN41_OK=0; echo "       self-test asserts only on ok, which cannot distinguish DN-41 from a pass"; }
grep -qF '.check-summary{' "$DN41CSS" \
  || { DN41_OK=0; echo "       .check-summary has no rule; it will inherit white and be unreadable"; }
grep -qF '.check-summary[hidden]{display:none}' "$DN41CSS" \
  || { DN41_OK=0; echo "       display:grid beats [hidden]; the empty box will show before any check"; }
grep -qE '\.check-summary\{[^}]*background:' "$DN41CSS" \
  || { DN41_OK=0; echo "       .check-summary has no background of its own; legibility depends on its parent"; }
grep -qE '\.check-summary\{[^}]*color:' "$DN41CSS" \
  || { DN41_OK=0; echo "       .check-summary has no colour of its own; it will inherit white again"; }
python3 - "$DN41HTML" <<'PYGATE' || DN41_OK=0
import re, sys
html = open(sys.argv[1]).read()
ledger = re.search(r'<section class="fin-ledger">.*?</section>', html, re.S)
if not ledger or 'id="check-summary"' not in ledger.group(0):
    print('       check-summary is not in the fin-ledger column; the blue brief '
          'has no room for it at 1366x768 and it will overflow onto the screen')
    sys.exit(1)
PYGATE
[ "$DN41_OK" -eq 1 ] \
  && ok "DN-41/42 check summary is structured, styled, hidden when empty, and in the ledger column" \
  || bad "DN-41/42 summary gate failed" "the advisor either cannot read the result or reads a fragment"

# P-22  D-01 release identity. Fedora scheme: a round integer, no minor, with a
# dated mile marker. Both come from build args so a release never means editing
# prose. A hardcoded version is the failure this catches: it silently makes
# every build claim to be the same release, which destroys the one property
# promotion depends on -- that a mile marker names exactly one set of bits.
D01CF="$REPO/projects/sp-plus/images/kde/Containerfile"
D01_OK=1
grep -qE '^ARG SPPLUS_RELEASE=' "$D01CF" \
  || { D01_OK=0; echo "       no SPPLUS_RELEASE build arg; the release number is hardcoded"; }
grep -qE '^ARG SPPLUS_BUILD=' "$D01CF" \
  || { D01_OK=0; echo "       no SPPLUS_BUILD build arg; there is no dated mile marker"; }
grep -qF 'BUILD_ID=${SPPLUS_BUILD}' "$D01CF" \
  || { D01_OK=0; echo "       BUILD_ID is not in os-release; the machine cannot name its own build"; }
grep -qE 'VERSION_ID=\$\{SPPLUS_RELEASE\}' "$D01CF" \
  || { D01_OK=0; echo "       VERSION_ID is not from the build arg"; }
grep -qE 'VERSION_ID=[0-9]+\.[0-9]' "$D01CF" \
  && { D01_OK=0; echo "       VERSION_ID carries a minor version; D-01 is round integers only"; }
grep -qE 'PRETTY_NAME="SP\+ [0-9]+\.[0-9]' "$D01CF" \
  && { D01_OK=0; echo "       PRETTY_NAME carries a minor version; D-01 is round integers only"; }
[ "$D01_OK" -eq 1 ] \
  && ok "D-01 release identity is a build arg, round integer, with a dated BUILD_ID" \
  || bad "D-01 release identity gate failed" "a mile marker that does not name exactly one build breaks promotion and rollback"

# P-23  D-02 base images are pinned by digest. A floating :44 tag moves under us:
# on 2026-08-30 both bases had already drifted from the digest every tested SP+
# image was built from, so identical source produced different operating systems.
# That breaks D-01's central promise -- a mile marker names exactly one set of
# bits. It also decides when we meet an upstream Anaconda change: floating, the
# first symptom is a failed patch anchor at a moment Fedora chooses.
D02_OK=1
for _cf in "$REPO/projects/sp-plus/images/kde/Containerfile" \
           "$REPO/projects/sp-plus/installer/Containerfile"; do
  _from=$(grep -m1 '^FROM ' "$_cf")
  case "$_from" in
    *@sha256:*) : ;;
    *) D02_OK=0; echo "       $(basename $(dirname $_cf))/Containerfile FROM is not digest-pinned: $_from" ;;
  esac
done
# The Anaconda patches are what make a base bump fail loudly instead of silently
# installing wrong behaviour. A pin without them is half a gate.
# Must be INVOKED, not merely COPYed. A plain filename grep matches the COPY
# line and passes while the patch is never run -- caught by negative-testing
# this gate on 2026-08-30.
grep -qE '^[[:space:]]*&&[[:space:]]*/usr/libexec/patch-anaconda-network\.py' \
  "$REPO/projects/sp-plus/installer/Containerfile" \
  || { D02_OK=0; echo "       the network patch is not INVOKED at build time; drift will not be caught"; }
grep -qE '^[[:space:]]*&&[[:space:]]*/usr/libexec/patch-anaconda-progress\.py' \
  "$REPO/projects/sp-plus/installer/Containerfile" \
  || { D02_OK=0; echo "       the progress patch is not INVOKED at build time"; }
grep -qF 'SPPLUS_NETWORK_PATCH FAILED' "$REPO/projects/sp-plus/installer/patch-anaconda-network.py" \
  || { D02_OK=0; echo "       the network patch no longer fails loudly on an anchor miss"; }
[ "$D02_OK" -eq 1 ] \
  && ok "D-02 base images are digest-pinned and the Anaconda patches still fail loudly" \
  || bad "D-02 pin gate failed" "an unpinned base means a mile marker does not name one set of bits"

# P-24  DN-43 to DN-45 theme path. This gate is intentionally strict: missing
# applied-session receipts are a build failure, not a reason to ship swatches.
if "$REPO/projects/sp-plus/tests/theme-phase2-source-gate.sh"; then
  ok "DN-43/44/45 verified theme apply, panel, and preview source gate"
else
  bad "DN-43/44/45 theme source gate failed" "do not build until the apply path and every preview receipt are present"
fi

echo
echo "=== $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] || { echo "DO NOT BUILD."; exit 1; }
echo "Safe to build."
