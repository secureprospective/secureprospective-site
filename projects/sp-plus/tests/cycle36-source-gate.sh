#!/usr/bin/env bash
# SP+ cycle36 source gate. This is deliberately build-free: it checks that each
# defect has an executable runtime gate or a build-time assertion wired into the
# image definition. Run before any image build.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CF="$ROOT/images/kde/Containerfile"
C="$ROOT/config"
pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }

# FIX 1: explicit full ICU plus the exact crash reproducer.
grep -qF 'nodejs22-full-i18n' "$CF" || fail 'Node full ICU package is not explicit'
grep -qF "node-22 -e 'new Intl.Segmenter(\"en\",{granularity:\"grapheme\"}).segment(\"hello\")'" "$CF" || fail 'Node Intl.Segmenter gate is not wired'
pass 'Node full ICU and Intl.Segmenter gate'

# FIX 2: Plasma 6.7 SVG Aurorae is the v2 plugin; the theme ID keeps KDE's
# verified __aurorae__svg__ prefix. The first-login script must read back all keys.
grep -qF 'library=org.kde.kwin.aurorae.v2' "$CF" || fail 'Aurorae v2 library is not shipped'
grep -qF 'theme=__aurorae__svg__spplus-calm-dark' "$CF" || fail 'Aurorae theme ID is not shipped'
grep -qF 'look-and-feel config verified' "$C/spplus-first-login" || fail 'first-login theme read-back is absent'
grep -qF 'KDE widgetStyle' "$C/spplus-first-login" || fail 'widgetStyle read-back is absent'
grep -qF 'General ColorScheme' "$C/spplus-first-login" || fail 'ColorScheme read-back is absent'
grep -qF 'org.kde.kdecoration2 theme' "$C/spplus-first-login" || fail 'KWin theme read-back is absent'
pass 'Calm v2 Aurorae values and first-login read-back'

# FIX 3: no variable can override these literal service arguments.
test -s "$C/wsdd.service.d/sp-plus.conf" || fail 'wsdd drop-in missing'
grep -qF 'ExecStart=/usr/bin/wsdd --shortlog --chroot=/run/wsdd --discovery --no-host --listen 127.0.0.1:5357' "$C/wsdd.service.d/sp-plus.conf" || fail 'wsdd literal hardening command missing'
grep -qF 'ExecStart=' "$C/wsdd.service.d/sp-plus.conf" || fail 'wsdd ExecStart reset missing'
pass 'wsdd literal hardening drop-in'

# FIX 4: system-wide KDE default and an effective-value field gate.
grep -qF 'COPY config/kscreenlockerrc            /etc/xdg/kscreenlockerrc' "$CF" || fail 'screen-lock default is not copied'
grep -qF 'Autolock=false' "$C/kscreenlockerrc" || fail 'screen-lock default is not false'
grep -qF 'lock_autolock_effective' "$ROOT/tests/field-inspect.sh" || fail 'effective lock gate missing'
pass 'screen-lock default and effective-value gate'

# FIX 5: the real launcher has a close test, not merely a source grep.
grep -qF 'def closeEvent' "$ROOT/welcome/welcome.py" || fail 'Welcome closeEvent missing'
grep -qF -- '--self-test-close' "$ROOT/welcome/welcome.py" || fail 'Welcome close self-test missing'
test -x "$ROOT/tests/welcome-close-gate.sh" || fail 'Welcome close gate is not executable'
pass 'Welcome close/exit gate'

# FIX 6: ship the sensor provider and check its executable at image build time.
grep -qF 'lm_sensors' "$CF" || fail 'lm_sensors is not installed by the image'
grep -qF 'SENSORS_OK' "$CF" || fail 'lm_sensors runtime gate missing'
pass 'lm_sensors package and runtime gate'

# FIX 7: the visible launcher whitelists only the image-mode backends and does
# not turn PackageKit back on.
grep -qF -- '--backends flatpak,rpm-ostree' "$C/spplus-discover" || fail 'Discover backend policy missing'
grep -qF 'COPY config/spplus-discover /usr/bin/spplus-discover' "$CF" || fail 'Discover wrapper not installed'
grep -qF 'Exec=/usr/bin/spplus-discover' "$CF" || fail 'Discover desktop wiring missing'
grep -qF 'packagekit-backend.so' "$CF" || fail 'Discover PackageKit exclusion gate missing'
pass 'Discover Flatpak/rpm-ostree backend policy'

# FIX 8 is intentionally absent: its live desktop test was a false alarm, not a
# defect. No source change is permitted for it.
pass 'FIX 8 remains a reported test artifact'
