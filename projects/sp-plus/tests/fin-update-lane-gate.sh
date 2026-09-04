#!/usr/bin/env bash
# SP+ FIN UPDATE LANE GATE.
#
# WHY THIS GATE EXISTS. On 2026-09-04 Fin was "updated" on the test VM, and the
# journal recorded the whole failure in nine seconds:
#
#   10:28:24  npm ... --prefix /usr       install -g @earendil-works/pi-coding-agent@0.85.0
#   10:28:33  npm ... --prefix /usr/local install -g @earendil-works/pi-coding-agent@0.85.0
#
# The first failed because /usr is read-only. The retry succeeded into
# /var/usrlocal and put a second `pi` ahead of the pinned one on PATH -- while
# `fin` goes on exec'ing /usr/bin/pi by absolute path. So `pi --version` said
# 0.85.0, Fin still ran 0.84.4, and 156 MB sat in /var on a disk at 95% full.
#
# Fin updates ARE OS image updates (decided 2026-09-01, update-lane ledger §7).
# This gate holds the three things that make that true in practice, and it runs
# the REAL regexes out of the extension rather than approximations of them.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPPLUS="$(dirname "$HERE")"
GUARD="$SPPLUS/config/fin-extensions/spplus-guardrails.ts"
FIN="$SPPLUS/config/fin"
PROMPT="$SPPLUS/config/fin-system-prompt.md"
fail=0
say(){ printf '  %-58s %s\n' "$1" "$2"; }
chk(){ if [ "$2" = "$3" ]; then say "$1" "PASS"; else say "$1" "FAIL (want=$2 got=$3)"; fail=1; fi; }

echo "=== SP+ FIN UPDATE LANE GATE ==="
for f in "$GUARD" "$FIN" "$PROMPT"; do
  [ -f "$f" ] || { echo "  FAIL missing $f"; exit 2; }
done

# --- 1. Fin runs the image's pi, by absolute path, every time ---------------
# A single PATH-relative `pi` anywhere in the launcher reopens the whole hole.
# `command -v pi` is the one deliberate PATH lookup: it is how the launcher
# FINDS a shadow copy in order to warn about it. Everything else must be
# /usr/bin/pi, because a single PATH-relative invocation reopens the whole hole.
bare=$(grep -nE '(^|[^/[:alnum:]_-])pi[[:space:]]' "$FIN" \
       | grep -v '/usr/bin/pi' | grep -v 'command -v pi' \
       | grep -vE '^\s*[0-9]+:\s*#' || true)
chk "every pi invocation in fin is an absolute image path" "" "$bare"
chk "fin reports the version it actually runs" "yes" \
    "$(grep -q -- '--version|-V' "$FIN" && grep -q '/usr/bin/pi --version' "$FIN" && echo yes || echo no)"
chk "fin warns when a second copy shadows it" "yes" \
    "$(grep -q 'readlink -f /usr/bin/pi' "$FIN" && echo yes || echo no)"

# --- 2. The system prompt says how Fin updates ------------------------------
for phrase in "part of SP+" "arrives inside a new version of SP+" "reaching for npm"; do
  chk "the prompt says: $phrase" "yes" \
      "$(grep -qF "$phrase" "$PROMPT" && echo yes || echo no)"
done

# --- 3. The guardrails stop the wrong path at the FIRST move ----------------
# The rules are read out of the extension and executed as written. An
# approximation here would pass while the shipped rule did nothing.
if ! command -v node >/dev/null 2>&1; then
  echo "  SKIP node is not available; the guardrail rules were NOT executed"
else
node - "$GUARD" <<'NODE'
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
// { label: "...", pattern: /.../flags }
const re = /\{\s*label:\s*"((?:[^"\\]|\\.)*)"\s*,\s*pattern:\s*\/((?:[^/\\\n]|\\.)+)\/([a-z]*)\s*\}/g;
const rules = [];
let m;
while ((m = re.exec(src)) !== null) rules.push({label: m[1], pattern: new RegExp(m[2], m[3])});
if (rules.length < 10) { console.log(`  FAIL only ${rules.length} rules parsed out of the extension`); process.exit(1); }
const hit = (cmd) => rules.find(r => r.pattern.test(cmd));
let bad = 0;
// The two commands the VM actually ran, verbatim from the journal.
const mustBlock = [
  "sudo /usr/sbin/node npm/bin/npm-cli.js --prefix /usr install -g --ignore-scripts --min-release-age=0 @earendil-works/pi-coding-agent@0.85.0",
  "sudo /usr/sbin/node npm/bin/npm-cli.js --prefix /usr/local install -g --ignore-scripts --min-release-age=0 @earendil-works/pi-coding-agent@0.85.0",
  "npm install -g @earendil-works/pi-coding-agent@latest",
  "npm update -g @earendil-works/pi-coding-agent",
  "sudo npm i -g --prefix /usr/local @earendil-works/pi-coding-agent",
  "pnpm add --global @earendil-works/pi-coding-agent",
];
// Ordinary work an advisor might genuinely need. A rule that catches these is
// a rule that gets in the way, which is how guardrails end up switched off.
const mustAllow = [
  "sudo dnf install -y hplip",
  "npm ls",
  "npm run build",
  "npm install --save-dev eslint",
  "cd ~/Documents/Fin && npm install",
  "sudo bootc upgrade",
  "spplus-update-control check",
];
for (const cmd of mustBlock) {
  const r = hit(cmd);
  if (!r) { console.log(`  FAIL not blocked: ${cmd.slice(0, 72)}`); bad = 1; }
}
for (const cmd of mustAllow) {
  const r = hit(cmd);
  if (r) { console.log(`  FAIL blocked ordinary work (${r.label}): ${cmd}`); bad = 1; }
}
if (!bad) console.log(`  ${String(rules.length).padEnd(2)} rules executed: ${mustBlock.length} update routes blocked, ${mustAllow.length} ordinary commands left alone   PASS`);
process.exit(bad);
NODE
[ $? -eq 0 ] || fail=1
fi

echo
[ $fail -eq 0 ] && echo "FIN UPDATE LANE GATE: PASS" || echo "FIN UPDATE LANE GATE: FAIL"
exit $fail
