#!/usr/bin/env bash
# SP+ Welcome all-stubs source gate. Runtime proof belongs to the live VM gate.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PY="$ROOT/welcome/welcome.py"
JS="$ROOT/welcome/app/app.js"
HTML="$ROOT/welcome/app/index.html"
pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }

for needle in \
  "class FinLaunchWorker" "FIN_DESKTOP" "GTK_LAUNCH" "start_new_session=True" \
  "class EmailLaunchWorker" "https://mail.google.com/" "https://outlook.office.com/mail/" \
  "class ShareCheckWorker" "Gio.MountOperation" "Gio.PasswordSave.PERMANENTLY" \
  "Gio.PasswordSave.NEVER" "class PrinterWorker" "getPrinters()" \
  "printFile(printer, CUPS_TEST_PAGE" "getJobAttributes(job_id)"; do
  grep -qF "$needle" "$PY" || fail "missing Python behavior: $needle"
done

grep -qF "parsed.path == 'launch-fin'" "$PY" || fail 'launch-fin bridge verb missing'
grep -qF "parsed.path == 'connect-email'" "$PY" || fail 'connect-email bridge verb missing'
grep -qF "parsed.path == 'check-share'" "$PY" || fail 'check-share bridge verb missing'
grep -qF "parsed.path == 'print-test'" "$PY" || fail 'print-test bridge verb missing'
grep -qF "send('spplus:launch-fin')" "$JS" || fail 'Fin title bridge missing'
grep -qF "send('spplus:connect-email?provider='" "$JS" || fail 'email title bridge missing'
grep -qF "send('spplus:check-share?server='" "$JS" || fail 'share title bridge missing'
grep -qF "send('spplus:print-test')" "$JS" || fail 'printer title bridge missing'
grep -qF 'finResult: finishFin' "$JS" || fail 'Fin callback missing'
grep -qF 'emailResult: finishEmail' "$JS" || fail 'email callback missing'
grep -qF 'shareResult: finishShare' "$JS" || fail 'share callback missing'
grep -qF 'printerResult: finishPrinter' "$JS" || fail 'printer callback missing'
# The password is read from the page only after the title event. It must never be
# encoded into the title query, where it would be visible as window metadata.
share_title=$(grep "send('spplus:check-share?server='" "$JS")
[[ "$share_title" != *password* ]] || fail 'share password is exposed in the title bridge'
grep -qF 'share-password' "$PY" || fail 'share password handoff is missing'
grep -qF 'Gio.PasswordSave.NEVER' "$PY" || fail 'secure-save opt-out is missing'
grep -qF 'No permanent mount was left behind' "$PY" || fail 'share check is not honest about temporary mounting'
grep -qF 'if state in (6, 7, 8)' "$PY" || fail 'printer failure states are not checked'
grep -qF "'jobs': 1" "$PY" || fail 'printer job count is not reported'

[ "$(grep -c 'data-stub=' "$HTML")" -eq 0 ] || fail 'Welcome still contains data-stub controls'
grep -qF 'id="fin-launch"' "$HTML" || fail 'Fin control missing'
grep -qF 'id="email-connect"' "$HTML" || fail 'email control missing'
grep -qF 'id="share-check"' "$HTML" || fail 'share control missing'
grep -qF 'id="printer-test"' "$HTML" || fail 'printer control missing'
grep -qF 'data-deferred="printer"' "$HTML" || fail 'printer deferral missing'
grep -qF 'data-deferred="email"' "$HTML" || fail 'email deferral missing'
grep -qF 'id="final-office"' "$HTML" || fail 'done office summary missing'
grep -qF 'SP+ never asks for or stores your email password.' "$HTML" || fail 'email password promise missing'
gn=$(grep -c 'id="ask-fin"' "$HTML")
[ "$gn" -eq 1 ] || fail 'ask-fin count changed'
[ "$(grep -c 'NO DATA SENT' "$HTML")" -eq 0 ] || fail 'stale NO DATA SENT copy remains'
pass 'all six Welcome stubs have bridge/UI source coverage'
