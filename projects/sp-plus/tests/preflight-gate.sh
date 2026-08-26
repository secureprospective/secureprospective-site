#!/usr/bin/env bash
# SP+ PRE-BUILD GATE. Static checks on the installer definition.
# Runs BEFORE the ISO is built. Exits non-zero to ABORT the build.
# Rationale: the security properties SP+ sells must be enforced mechanically,
# not asserted in prose that a human has to remember to read. See ledger DN-04,
# DN-09, DN-10, DN-11 and OP-16.
set -uo pipefail
REPO="${1:-$HOME/work/secureprospective-advisor-os}"
I="$REPO/projects/sp-plus/installer"
KS="$I/interactive-defaults.ks"; ISOY="$I/iso.yaml"; CF="$I/Containerfile"
FAIL=0; PASS=0
ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n'   "$1"; printf '       %s\n' "$2"; FAIL=$((FAIL+1)); }
echo "=== SP+ PRE-BUILD GATE ==="
for f in "$KS" "$ISOY" "$CF"; do
  [ -f "$f" ] || { bad "missing $(basename "$f")" "expected at $f"; }
done
[ $FAIL -gt 0 ] && { echo "ABORT: installer files missing"; exit 2; }

# G-A  selinux=0 MUST be on the installer cmdline (DN-09: removing it freezes systemd PID 1)
grep -q 'selinux=0' "$ISOY" \
  && ok "iso.yaml keeps selinux=0 on the INSTALLER cmdline (DN-09)" \
  || bad "iso.yaml has no selinux=0" "installer systemd PID 1 will freeze: 'Failed to allocate manager object'"

# G-B  the installed system must be scrubbed of installer-only kargs (DN-10).
# bootc images do not contain grubby: the kickstart must contain the explicit BLS
# scrubber, including the actual selinux=0 token it removes.
if grep -q 'spplus_strip_installer_kargs' "$KS" \
   && grep -q 'selinux=0' "$KS" \
   && grep -q 'console=ttyS0,115200' "$KS"; then
  ok "kickstart strips installer-only kargs from BLS entries (DN-10)"
else
  bad "kickstart does not explicitly strip installer kargs from BLS" "Anaconda copies the installer cmdline into the installed boot entry; SELinux would be DISABLED"
fi

# G-C  encryption is unconditional (D34/D36, DN-11)
grep -qE '(--encrypted|autopart[^\n]*--encrypted)' "$KS" \
  && ok "kickstart declares encryption (D34/D36)" \
  || bad "kickstart declares NO encryption" "D34 requires LUKS2 on root + all user data"
grep -qE 'luks-version=luks2|--luks-version=luks2' "$KS" \
  && ok "kickstart pins LUKS2 explicitly" \
  || bad "kickstart does not pin luks2" "LUKS1 is not acceptable for SP+"

# G-D  no hardcoded disk (T-09: the Dell presents sda, not vda)
if grep -qE -- '--ondisk=(vda|sda|nvme[0-9]n[0-9])' "$KS"; then
  bad "kickstart hardcodes a disk: $(grep -oE -- '--ondisk=[a-z0-9]+' "$KS" | sort -u | tr '\n' ' ')" \
      "T-09: breaks on other topologies. HW-00 (Dell) is SATA and presents sda"
else
  ok "no hardcoded --ondisk (T-09)"
fi

# G-E  NO SECRETS may ever enter the image (standing rule, all projects)
# Matches BOTH "--password foo" and "--password=foo". The original check only
# handled the space form and MISSED a literal default password shipped in the
# image on 2026-08-26. A gate must be tested against an artifact that HAS the
# defect (OP-16).
# Evaluate EACH credential-bearing line on its OWN merits. A previous version
# asked whether --iscrypted appeared ANYWHERE in the file, so an unrelated
# "rootpw --iscrypted" masked a literal "--password=spplus-advisor" on the user
# line. A flag must be computed from the datum, never from a neighbouring line.
literal=0
while IFS= read -r line; do
  case "$line" in \#*) continue ;; esac
  echo "$line" | grep -qiE -- '--(password|rootpw)[= ]' || continue
  echo "$line" | grep -qiE -- '--iscrypted' && continue
  echo "$line" | grep -qiE -- '--lock'      && continue
  bad "literal password on this kickstart line" "${line}"
  literal=1
done < "$KS"
[ "$literal" -eq 0 ] && ok "no literal password on any kickstart line"

# A default/known credential on a sudo-capable account is never acceptable.
# Evaluate each account line on its own: an unrelated rootpw hash or --lock on
# another line must not mask a preset credential on a wheel account.
advisor_line="$(grep -iE '^user[[:space:]].*--name=advisor([ =]|$)' "$KS" | head -1)"
if [ -z "$advisor_line" ] || ! printf '%s\n' "$advisor_line" | grep -q -- '--lock'; then
  bad "advisor account is not explicitly locked" "the advisor must choose a password at first boot; no shipped credential is permitted"
else
  ok "advisor account is explicitly locked until first boot"
fi
wheel_preset=0
while IFS= read -r line; do
  case "$line" in \#*) continue ;; esac
  printf '%s\n' "$line" | grep -qiE '^user[[:space:]].*--groups=[^ ]*wheel' || continue
  if printf '%s\n' "$line" | grep -qiE -- '--(password|iscrypted)([= ]|$)'; then
    bad "wheel account has a preset credential" "$line"
    wheel_preset=1
  fi
done < "$KS"
[ "$wheel_preset" -eq 0 ] && ok "no sudo-capable account ships with a preset password"
if grep -q 'spplus-firstboot-password' "$KS" \
   && grep -q 'advisor-password-set' "$KS" \
   && grep -q 'Before=display-manager.service' "$KS"; then
  ok "first-boot advisor password setup is installed before the display manager"
else
  bad "no complete first-boot advisor password setup" "a locked advisor account would otherwise have no supported way to set its own password"
fi
grep -qiE 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY' "$KS" "$CF" "$ISOY" 2>/dev/null \
  && bad "a PRIVATE KEY is present in the installer definition" "remove it and rotate the key" \
  || ok "no private key material in installer definition"

# G-F  the grey-screen regression (TMPDIR pointing pre-storage) must not return
if grep -rqE 'TMPDIR=/mnt/sysimage' "$I" 2>/dev/null; then
  bad "TMPDIR points into /mnt/sysimage" "that path does not exist pre-storage; GTK aborts and Anaconda paints uniform grey (stddev=0)"
else
  ok "no TMPDIR=/mnt/sysimage (grey-screen root cause stays fixed)"
fi

echo
echo "PRE-BUILD GATE: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || { echo "BUILD ABORTED - fix the failures above."; exit 1; }
echo "Gate clear. Proceeding to build."
