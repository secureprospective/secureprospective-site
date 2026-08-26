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

# G-B  the installed system must be scrubbed of installer-only kargs (DN-10)
# Two legitimate mechanisms exist. grubby does NOT exist in a bootc image (DN-12),
# so the supported mechanism is editing the BLS entries under /boot/loader/entries
# directly. Accept either, but REQUIRE that selinux=0 is what gets removed.
if grep -qE 'loader/entries|remove-args|--karg' "$KS"; then
  grep -qE 'selinux=0' "$KS" \
    && ok "kickstart strips selinux=0 from the INSTALLED system (DN-10)" \
    || bad "kickstart edits kargs but never names selinux=0" "SP+ would ship with SELinux DISABLED while /etc/selinux/config claims enforcing"
else
  bad "kickstart never strips installer kargs (DN-10)" "Anaconda copies the installer cmdline into the installed boot entry"
fi

# G-B2  the installed /etc must be labelled or every login fails under Enforcing (DN-16)
grep -qE 'setfiles|restorecon' "$KS" \
  && ok "kickstart relabels the installed tree from the target policy (DN-16)" \
  || bad "kickstart never relabels /etc" "unlabeled_t on /etc/passwd+nsswitch.conf denies ALL logins under Enforcing"


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

# A default/known credential on a sudo-capable account is never acceptable,
# even hashed, because it is identical on every machine SP+ ships.
if grep -qiE -- 'user --name=[^ ]+.*--groups=[^ ]*wheel' "$KS" \
   && grep -qiE -- '--(password|iscrypted)' "$KS" \
   && ! grep -qiE -- '--lock' "$KS"; then
  bad "a wheel/sudo account ships with a preset password" \
      "the advisor must set their own credential at first boot; a shared default is the same on every SP+ machine"
else
  ok "no sudo-capable account ships with a preset password"
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
