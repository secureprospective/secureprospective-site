#!/usr/bin/env bash
# Fin skills gate.
#
# Christopher, 2026-09-11: "Unlike Bee, our explainations of the skills and
# extentions and tips should be plain language and well defined."
#
# Bee's skill descriptions are written for Christopher, who knows what a
# frontend audit or a context compaction is. Fin's are read by an advisor who
# types /skills and has to be able to tell, from one line, whether the thing is
# for them. So this gate checks the two properties that actually make that
# true: every skill says WHEN to use it, and none of them say it in developer
# words. It also holds the whole set to the two rules Fin is never allowed to
# break -- no compliance claims, and no personal detail in the notebook.
#
# Mutation-tested 2026-09-11: each assertion below has been turned red by
# editing the file it checks.
set -u

DIR="${1:-}"
if [ -z "$DIR" ]; then
    for c in /usr/share/sp-plus/fin/skills "$(dirname "$0")/../config/fin-skills"; do
        [ -d "$c" ] && DIR="$c" && break
    done
fi
[ -n "$DIR" ] && [ -d "$DIR" ] || { echo "FAIL: cannot find the Fin skills directory"; exit 1; }

fails=0
ok()   { printf '  ok  %s\n' "$1"; }
bad()  { printf 'FAIL  %s\n' "$1"; fails=$((fails + 1)); }

# Words that mean nothing to an insurance advisor. "Prompt" and "token" are the
# two that keep creeping in, because they are how we talk about the machine.
JARGON='\b(prompt|token|repo|repository|git|commit|CLI|stdout|regex|frontmatter|markdown file|API|JSON|extension)\b'

count=0
for skill in "$DIR"/*/; do
    name=$(basename "$skill")
    f="$skill/SKILL.md"
    count=$((count + 1))

    [ -r "$f" ] || { bad "$name has no SKILL.md"; continue; }

    head -1 "$f" | grep -q '^---$' || bad "$name does not start with a frontmatter block"

    declared=$(sed -n 's/^name:[[:space:]]*//p' "$f" | head -1)
    [ "$declared" = "$name" ] \
        && ok "$name declares the name its folder has" \
        || bad "$name declares the name '$declared'"

    desc=$(sed -n 's/^description:[[:space:]]*//p' "$f" | head -1)
    [ ${#desc} -ge 80 ] \
        && ok "$name has a description long enough to choose by" \
        || bad "$name has a ${#desc}-character description"

    # The description is the only thing an advisor sees in the skill list, and a
    # description that says what a thing IS without saying when to REACH FOR IT
    # is why skills sit unused.
    printf '%s' "$desc" | grep -qiE 'use (when|whenever|at|for|if)' \
        && ok "$name says when to use it" \
        || bad "$name never says when to use it"

    printf '%s' "$desc" | grep -qiE "$JARGON" \
        && bad "$name uses developer words in its description" \
        || ok "$name is described in plain language"

    # D15. Fin may help produce material; it may never say the material is
    # compliant, because that is the one sentence an advisor would rely on.
    grep -qiE 'is compliant|ensures? compliance|compliance[- ]approved|meets (all )?(the )?regulations' "$f" \
        && bad "$name makes a compliance claim" \
        || ok "$name makes no compliance claim"
done

[ "$count" -ge 1 ] || { echo "FAIL: no skills found in $DIR"; exit 1; }

# Every skill that writes into the notebook has to carry the privacy rule in its
# own text. A rule that lives only in one skill is a rule the other skills walk
# past, and the refusal the advisor then sees looks like a malfunction.
for s in notebook save-this-session voice; do
    f="$DIR/$s/SKILL.md"
    [ -r "$f" ] || { bad "$s is missing"; continue; }
    grep -qiE 'no names|No names, no email|keeps? names' "$f" \
        && ok "$s states the no-names rule" \
        || bad "$s never states the no-names rule"
done

# The email skill must say Fin does not send, because that boundary is enforced
# in the tool path and a skill that does not know about it will keep trying.
if [ -r "$DIR/email/SKILL.md" ]; then
    grep -qi 'does not send\|drafts; the advisor sends' "$DIR/email/SKILL.md" \
        && ok "email says Fin drafts and the advisor sends" \
        || bad "email does not say that Fin never sends"
    grep -qi 'voice.md' "$DIR/email/SKILL.md" \
        && ok "email reads the voice profile before writing" \
        || bad "email does not read the voice profile"
else
    bad "the email skill is missing"
fi

# The voice interview must ask about assessments, and must not turn into one.
if [ -r "$DIR/voice/SKILL.md" ]; then
    grep -qi 'Kolbe' "$DIR/voice/SKILL.md" \
        && ok "voice asks about working-style assessments by name" \
        || bad "voice does not name an assessment, so the question is unanswerable"
    grep -qi 'You are not assessing them' "$DIR/voice/SKILL.md" \
        && ok "voice forbids Fin from assessing the advisor itself" \
        || bad "voice does not forbid Fin from assessing the advisor"
else
    bad "the voice skill is missing"
fi

echo ""
if [ "$fails" -gt 0 ]; then
    echo "FIN SKILLS GATE FAIL: $fails assertion(s) red across $count skills"
    exit 1
fi
echo "FIN_SKILLS_GATE_OK $count skills, each named, each saying when to use it, none in developer words"
