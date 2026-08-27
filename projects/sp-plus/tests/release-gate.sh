#!/usr/bin/env bash
# SP+ RELEASE GATE. Runs against a LIVE INSTALLED SP+ SYSTEM.
# Consumes a field-inspect.sh report and enforces the security properties SP+ SELLS.
# Exits non-zero if any is missing. An ISO that cannot pass this must not ship.
#
# Usage:
#   release-gate.sh report.txt              # judge an existing report
#   release-gate.sh --ssh 'ssh args...'     # run field-inspect remotely, then judge
#
# WHY THIS EXISTS: on 2026-08-26 SP+ installed with SELinux DISABLED while
# /etc/selinux/config said 'enforcing', and with ZERO encryption while the
# kickstart declared LUKS2. Both failed SILENTLY. Reading config files told you
# the opposite of the truth. Only an inspection of the running system caught it.
set -uo pipefail
REPORT=""
if [ "${1:-}" = "--ssh" ]; then
  shift
  REPORT=$(mktemp)
  # shellcheck disable=SC2086
  set +e
  ssh $@ 'bash -s' < "$(dirname "$0")/field-inspect.sh" > "$REPORT" 2>/dev/null
  inspect_status=$?
  set -e
  if [ "$inspect_status" -eq 255 ] || [ ! -s "$REPORT" ]; then
    echo "RELEASE GATE: could not run field-inspect on the target"; exit 2
  fi
  [ "$inspect_status" -eq 0 ] || echo "RELEASE GATE: field-inspect reported a security failure; judging its full report"
else
  REPORT="${1:?usage: release-gate.sh <report.txt> | --ssh <ssh args>}"
fi
[ -s "$REPORT" ] || { echo "RELEASE GATE: empty report"; exit 2; }

FAIL=0
val() { awk -v k="$1" '$1==k{$1="";sub(/^ +/,"");print;exit}' "$REPORT" | sed 's/ *\(OK\|PROBLEM\|UNKNOWN\|SKIPPED_NEEDS_ROOT\) *$//;s/ *$//'; }
req() { # req <key> <expected> <why it matters>
  local got; got="$(val "$1")"
  if [ "$got" = "$2" ]; then printf '  \033[32mPASS\033[0m %-22s = %s\n' "$1" "$got"
  else printf '  \033[31mFAIL\033[0m %-22s = %s   (required: %s)\n' "$1" "${got:-<absent>}" "$2"; printf '       %s\n' "$3"; FAIL=$((FAIL+1)); fi
}
atleast() {
  local got; got="$(val "$1")"
  if [ -n "$got" ] && [ "$got" -ge "$2" ] 2>/dev/null; then printf '  \033[32mPASS\033[0m %-22s = %s\n' "$1" "$got"
  else printf '  \033[31mFAIL\033[0m %-22s = %s   (required: >= %s)\n' "$1" "${got:-<absent>}" "$2"; printf '       %s\n' "$3"; FAIL=$((FAIL+1)); fi
}

echo "=== SP+ RELEASE GATE — security properties SP+ sells ==="
req selinux_mode        Enforcing         "SP+ claims mandatory access control. /etc/selinux/config LIES if the karg disables it (DN-10)."
req selinux_arg_leaked  no                "selinux=0 leaked from the installer into the installed boot entry (DN-10)."
atleast luks_containers 1                 "D34: LUKS2 on root + all user data. An interactive install can silently discard this (DN-11)."
req firmware            UEFI              "Secure Boot requires UEFI."
req default_target      graphical.target  "SP+ ships KDE Plasma; a text login is a broken advisor experience."

echo
echo "--- LUKS version check (must be luks2, never luks1) ---"
if grep -q 'luks_version' "$REPORT"; then
  while read -r line; do
    case "$line" in
      *luks2*OK) printf '  \033[32mPASS\033[0m %s\n' "$line" ;;
      *)         printf '  \033[31mFAIL\033[0m %s\n' "$line"; FAIL=$((FAIL+1)) ;;
    esac
  done < <(grep 'luks_version' "$REPORT" | grep -v skipped)
else
  printf '  \033[31mFAIL\033[0m no luks_version lines - encryption unverified\n'; FAIL=$((FAIL+1))
fi

# --- audit backdoor guard -----------------------------------------------------
# cycle35 ships Christopher's public key in /etc/skel so the post-boot sweep can
# read the advisor's own config, which the SELinux-confined guest agent cannot.
# That is an audit affordance and it must never reach an advisor. A build that
# still carries it is a test build by definition, whatever it is labelled.
CF="$(dirname "${BASH_SOURCE[0]}")/../images/kde/Containerfile"
if grep -q 'AUDIT_SSH_KEY_OK' "$CF" 2>/dev/null; then
  printf '  \033[31mFAIL\033[0m audit SSH key block is STILL IN THE CONTAINERFILE - test build only, must not ship\n'
  FAIL=$((FAIL+1))
else
  printf '  \033[32mPASS\033[0m no audit SSH key block in the Containerfile\n'
fi

echo
echo "--- informational (not gating) ---"
for k in secureboot tpm_device failed_units bootc_booted_image; do
  printf '  %-22s %s\n' "$k" "$(val "$k")"
done

echo
if [ "$FAIL" -eq 0 ]; then
  echo "RELEASE GATE: PASS - this build may ship."
  exit 0
fi
echo "RELEASE GATE: $FAIL FAILURE(S) - THIS BUILD MUST NOT SHIP."
exit 1
