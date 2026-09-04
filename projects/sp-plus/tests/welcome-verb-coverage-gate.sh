#!/usr/bin/env bash
# SP+ WELCOME VERB COVERAGE GATE.
#
# WHY: on 2026-09-04 welcome.py's bridge answered 17 verbs from the page and
# --self-test drove five of them. The Office connection -- the whole "Your
# Services" screen -- had no coverage at all, and nothing anywhere said so. The
# gap was invisible because nothing was counting.
#
# This does not test behaviour. It asserts BOOKKEEPING: every verb the bridge
# accepts is either automated in SelfTest.SAFE (plus 'ask'), or named in
# REQUIRES_HUMAN with a reason. Adding a verb and no test now fails here, which
# is the only way a coverage promise survives contact with a future change.
set -uo pipefail
REPO="${1:-$HOME/work/secureprospective-advisor-os}"
W="$REPO/projects/sp-plus/welcome/welcome.py"

echo "=== SP+ WELCOME VERB COVERAGE GATE ==="
[ -f "$W" ] || { echo "  FAIL welcome.py not found at $W"; exit 2; }

python3 - "$W" <<'PY'
import ast, re, sys

src = open(sys.argv[1], encoding='utf-8').read()

# The verbs the bridge actually accepts, read from the dispatch chain.
verbs = set(re.findall(r"parsed\.path == '([a-z-]+)'", src))
if len(verbs) < 10:
    print('  FAIL only %d dispatch verbs found; on_title changed shape and this'
          ' gate is no longer reading it' % len(verbs))
    sys.exit(2)

tree = ast.parse(src)
selftest = next((n for n in ast.walk(tree)
                 if isinstance(n, ast.ClassDef) and n.name == 'SelfTest'), None)
if selftest is None:
    print('  FAIL SelfTest class not found'); sys.exit(2)

def literal(name):
    for node in selftest.body:
        if isinstance(node, ast.Assign) and getattr(node.targets[0], 'id', '') == name:
            return ast.literal_eval(node.value)
    return None

safe = set(literal('SAFE') or ())
human = dict(literal('REQUIRES_HUMAN') or {})
expect = dict(literal('EXPECT') or {})
if not safe or not human:
    print('  FAIL SAFE or REQUIRES_HUMAN is empty'); sys.exit(2)

# Some verbs are driven under a more specific name than the wire verb, because
# one wire verb has several distinct outcomes worth testing separately.
ALIASES = {
    'check-share': {'check-share-refused', 'check-share-unreachable',
                    'check-share-credentials'},
    'service-capabilities': {'service-capabilities-files',
                             'service-capabilities-social'},
}

covered_by = {}
missing = []
for verb in sorted(verbs):
    names = ALIASES.get(verb, {verb})
    hits = [n for n in names if n in safe or n in human or n == 'ask']
    if hits:
        covered_by[verb] = hits
    else:
        missing.append(verb)

# Every automated verb needs a stated expectation, or its result is unjudged.
unjudged = sorted(n for n in safe if n not in expect)

for verb in sorted(verbs):
    where = covered_by.get(verb)
    if not where:
        continue
    how = 'automated' if any(n in safe or n == 'ask' for n in where) else 'requires-human'
    print('  %-14s %-24s %s' % (how, verb, ', '.join(sorted(where))))

bad = False
if missing:
    bad = True
    print()
    print('  FAIL these bridge verbs have no test and no stated reason:')
    for verb in missing:
        print('       %s' % verb)
    print('       Add it to SelfTest.SAFE with an EXPECT entry, or to')
    print('       REQUIRES_HUMAN with the reason it cannot be automated.')
if unjudged:
    bad = True
    print()
    print('  FAIL automated with no EXPECT entry (result would go unjudged): %s'
          % ', '.join(unjudged))

stale = sorted(n for n in safe if not any(n in ALIASES.get(v, {v}) for v in verbs))
if stale:
    bad = True
    print()
    print('  FAIL SelfTest drives verbs the bridge no longer accepts: %s'
          % ', '.join(stale))

print()
print('  %d bridge verbs, %d automated, %d requires-human'
      % (len(verbs), len(safe) + 1, len(human)))
sys.exit(1 if bad else 0)
PY
RC=$?
if [ "$RC" -ne 0 ]; then echo "DO NOT SHIP."; exit "$RC"; fi
echo "  PASS every bridge verb is automated or named as requiring a human"
