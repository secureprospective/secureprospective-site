#!/usr/bin/env bash
# SP+ FIN PERMISSIONS GATE -- can Fin still be the tech buddy, and can it still
# wreck the advisor's work?
#
# WHY THIS GATE EXISTS. Fin holds unprompted root by design: a password prompt
# the advisor cannot answer stops every genuine repair. The guardrails are the
# consequence of that grant, and they have to fail in BOTH directions to be
# worth having -- an assistant that cannot fix a printer is the failure this
# product exists to remove, and one that silently overwrites a client file is
# worse than no assistant at all.
#
# A sweep on 2026-09-04 found the catalogue was built around DRAMATIC
# destruction -- mkfs, dd, shred, luksKillSlot -- and 9 of 10 realistic
# accidents went straight through: cp and mv overwrite silently by default, a
# redirect truncates, rsync --delete mirrors, and bash redirection walked around
# the workspace confinement entirely. None of those are malice. They are what a
# helpful assistant reaches for while tidying up.
#
# The rules are read out of the shipped extension and EXECUTED. An approximation
# written here would pass while the real rule did nothing.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPPLUS="$(dirname "$HERE")"
GUARD="$SPPLUS/config/fin-extensions/spplus-guardrails.ts"
PROBE="$HERE/fin-permissions-probe.cjs"

echo "=== SP+ FIN PERMISSIONS GATE ==="
[ -f "$GUARD" ] || { echo "  FAIL missing $GUARD"; exit 2; }
[ -f "$PROBE" ] || { echo "  FAIL missing $PROBE"; exit 2; }
if ! command -v node >/dev/null 2>&1; then
  echo "  SKIP node is not available; the permission surface was NOT exercised"; exit 0
fi

node "$PROBE" "$GUARD"
rc=$?

# --- the WORDS of the question, not just the rule behind it ------------------
#
# Christopher, 2026-09-12: "lets be sure that Fin always speaks about the
# permissions in plain language as well."
#
# Every label below is dropped straight into "This step ___, which cannot be
# undone. Allow it?" -- so a label is not a code comment, it is the sentence an
# advisor reads two seconds before approving something they did not type. One
# word they do not know and they are guessing. A sweep on 2026-09-12 found
# "turns off SELinux protection", which no advisor has ever met.
#
# The system prompt carries the same rule for the questions Fin asks in
# conversation, and that section is checked here too: a rule nobody wrote down
# is a rule the next model does not follow.
echo
echo "--- plain language ---"
PROMPT="$SPPLUS/config/fin-system-prompt.md"
words=0

# Words with no meaning to a financial advisor. Each was chosen because it has
# appeared, or nearly appeared, in a label.
JARGON='SELinux|sudo|chmod|chown|rsync|crontab|systemd|daemon|symlink|repository|repo|binary|PATH|stdout|shell script|boot loader|GRUB|partition table|package manager|sigstore|GPG key|regex|API'

while IFS= read -r label; do
  if printf '%s' "$label" | grep -qiE "$JARGON"; then
    echo "  FAIL a permission question says: \"$label\""
    words=$((words + 1))
  fi
done < <(grep -oE 'label: "[^"]+"' "$GUARD" | sed 's/label: "//; s/"$//')

[ "$words" -eq 0 ] && echo "  ok  every permission question is in words an advisor knows"

# A label has to say what HAPPENS. One that names a thing without a verb ("disk
# encryption keys") leaves the advisor approving a noun.
nov=0
while IFS= read -r label; do
  printf '%s' "$label" | grep -qE '^(adds|changes|could|creates|deletes|empties|erases|gives|installs|makes|mirrors|moves|overwrites|permanently|reinstalls|removes|runs|schedules|sends|sets|stops|trusts|turns|writes)\b' \
    || { echo "  FAIL a permission question does not say what happens: \"$label\""; nov=$((nov + 1)); }
done < <(grep -oE 'label: "[^"]+"' "$GUARD" | sed 's/label: "//; s/"$//')
[ "$nov" -eq 0 ] && echo "  ok  every permission question starts by saying what happens"

# The rule for the questions Fin asks itself, in the prompt that governs them.
prompt_fail=0
if [ -r "$PROMPT" ]; then
  grep -qi "^## Asking permission" "$PROMPT" \
    && echo "  ok  the system prompt tells Fin how to ask" \
    || { echo "  FAIL the system prompt has no rule about asking permission"; prompt_fail=1; }
  grep -qi "Never use a technical word in a permission question" "$PROMPT" \
    && echo "  ok  and forbids technical words in the question" \
    || { echo "  FAIL the prompt does not forbid technical words in a permission question"; prompt_fail=1; }
  grep -qi '"No" is a complete answer' "$PROMPT" \
    && echo "  ok  and treats a refusal as final" \
    || { echo "  FAIL the prompt does not say a refusal is final"; prompt_fail=1; }
else
  echo "  FAIL cannot read $PROMPT"; prompt_fail=1
fi

[ "$words" -eq 0 ] && [ "$nov" -eq 0 ] && [ "$prompt_fail" -eq 0 ] || rc=1
echo
[ $rc -eq 0 ] && echo "FIN PERMISSIONS GATE: PASS" || echo "FIN PERMISSIONS GATE: FAIL"
exit $rc
