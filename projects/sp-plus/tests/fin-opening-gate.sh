#!/usr/bin/env bash
# Fin opening page gate.
#
# The opening page is the first thing an advisor sees and the only place many of
# them will ever learn what Fin can do. So the assertions are about whether it
# TELLS THEM ANYTHING -- in their words, at their terminal width, in both the
# connected and the not-yet-connected state -- rather than about pixels.
#
# Run with --preview to print the page instead of testing it.
#
# Mutation-tested 2026-09-11: dropping the suggestion, the skill list, the
# first-run interview nudge, the wrapping, or the theme-aware colours each turns
# an assertion red.
set -u

PREVIEW=""
[ "${1:-}" = "--preview" ] && { PREVIEW=1; shift; }

EXT="${1:-}"
if [ -z "$EXT" ]; then
    for c in /usr/share/sp-plus/fin/extensions/spplus-opening.ts \
             "$(dirname "$0")/../config/fin-extensions/spplus-opening.ts"; do
        [ -r "$c" ] && EXT="$c" && break
    done
fi
[ -n "$EXT" ] && [ -r "$EXT" ] || { echo "FAIL: cannot find spplus-opening.ts"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node is not installed"; exit 1; }

# Where the skills live. Installed, if this is a built image or a booted machine;
# otherwise the checkout beside this script. Either way the blurb-coverage check
# below runs against a REAL set of skills, so this gate never passes by testing
# nothing.
SKILLS_DIR="${SKILLS_DIR:-}"
if [ -z "$SKILLS_DIR" ]; then
    for c in /usr/share/sp-plus/fin/skills "$(dirname "$0")/../config/fin-skills"; do
        [ -d "$c" ] && SKILLS_DIR="$c" && break
    done
fi
[ -n "$SKILLS_DIR" ] || { echo "FAIL: cannot find the Fin skills directory"; exit 1; }
export SKILLS_DIR
# Only a built image has the skills where the extension looks for them, and only
# there can the rendered page be required to list them.
export SKILLS_INSTALLED=0
[ -d /usr/share/sp-plus/fin/skills ] && SKILLS_INSTALLED=1

WORK=$(mktemp -d) || exit 1
trap 'rm -rf "$WORK"' EXIT
cp "$EXT" "$WORK/ext.ts"

# The page reads the advisor's notebook and remembers where the tip rotation
# got to, both under $HOME. Pointing HOME at the scratch directory keeps the
# gate from depending on whoever runs it, and from leaving a state file in a
# real home. It also lets the harness below turn the voice profile on and off,
# which is the only way to exercise the rotation at all.
mkdir -p "$WORK/home"
export HOME="$WORK/home"

cat > "$WORK/gate.mjs" <<'HARNESS'
import ext from "./ext.ts";

const hooks = {};
ext({ on: (n, f) => { hooks[n] = f; } });

const ROLES = ["accent", "text", "dim", "muted", "success", "warning", "error"];
const used = new Set();
const theme = { fg: (role, t) => { used.add(role); return t; } };

const page = async ({ model = { name: "Claude Sonnet 5", id: "claude-sonnet-5", provider: "anthropic" },
                      percent = 14, width = 96, mode = "tui" } = {}) => {
  let header = null;
  const ctx = { mode, model, getContextUsage: () => ({ percent }),
                ui: { setHeader: (f) => { header = f(null, theme); } } };
  await hooks.session_start({ reason: "startup" }, ctx);
  if (!header) return null;
  return header.render(width);
};

if (process.env.PREVIEW) {
  const lines = await page({ width: Number(process.env.COLS ?? 96) });
  console.log((lines ?? ["(no header rendered)"]).join("\n"));
  process.exit(0);
}

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${ok || !detail ? "" : "  <- " + detail}`);
  if (!ok) failures++;
};

const lines = await page();
const text = (lines ?? []).join("\n");

check("the page renders at all", Array.isArray(lines) && lines.length > 0);
check("it names itself", /F I N/.test(text));
check("it says what Fin is for in one line", /Ask me to fix it, write it, or explain it/.test(text));
check("it says whether Fin is connected", /Connected/.test(text));
check("it says where the advisor's files go", /Documents\/Fin/.test(text));
check("it says what is in the notebook", /Notebook/.test(text));
// Every installed skill must have a sentence written for it. Without this a new
// skill quietly appears on the advisor's opening page under its own directory
// name -- "save-this-session" -- which is exactly the developer word this page
// exists to avoid.
{
  const { readdirSync, readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("./ext.ts", import.meta.url), "utf8");
  const table = src.slice(src.indexOf("SKILL_BLURBS"), src.indexOf("};", src.indexOf("SKILL_BLURBS")));
  const installed = readdirSync(process.env.SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);
  check("there is at least one skill to describe", installed.length > 0);
  const undescribed = installed.filter((n) => !new RegExp(`["']?${n}["']?:`).test(table));
  check("every skill has a plain-language description", undescribed.length === 0,
    "no description for: " + undescribed.join(", "));
}

// The rendered section can only appear where the skills are actually installed.
if (process.env.SKILLS_INSTALLED === "1") {
  check("it lists what Fin can do", /WHAT I CAN DO/.test(text), "the skills section is missing");
} else {
  check("with no skills installed the page still renders", lines.length > 8,
    "the page collapsed when the skills directory was absent");
}
check("it offers something to try", /TRY THIS/.test(text));

// Christopher, 2026-09-11: the interview is in the suggestion cycle, and on a
// machine with no voice profile it is THE suggestion -- a rotation that might
// show it on the fourth launch is a rotation an advisor never sees it in.
check("with no voice profile it offers the interview first",
  /Teach me how you write/.test(text), "the first-run suggestion is not the interview");
check("and says why the interview is worth doing",
  /worth doing once/i.test(text));

// Plain language. This is the whole difference from Bee's panel.
check("nothing on the page is said in developer words",
  !/token|context window|branch|git|repo|trust|stdout|extension|skill file/i.test(text), text.slice(0, 200));

// Not connected is a state an advisor WILL see, because the key is not in the
// image. The page has to tell them what to do about it.
{
  const t = (await page({ model: null })).join("\n");
  check("when not connected it says so", /not yet/.test(t));
  check("when not connected it says how to fix it", /\/login/.test(t), t.slice(0, 200));
}

// A narrow terminal must not cut a suggestion in half.
{
  const t = (await page({ width: 52 })).join("\n");
  const overlong = t.split("\n").filter((l) => l.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").length > 52);
  check("nothing overflows a narrow terminal", overlong.length === 0, String(overlong.length) + " lines too wide");
  // A clip keeps the terminal safe and loses the end of the sentence, which is
  // where the actual instruction is. The whole suggestion has to survive.
  const plain = t.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").replace(/\s+/g, " ");
  check("a suggestion wraps rather than truncating",
    plain.includes("Teach me how you write, so everything I draft sounds like you."),
    plain.slice(plain.indexOf("Teach me"), plain.indexOf("Teach me") + 80));
}

// Christopher, 2026-09-12: the tips cover the commands, the skills and the work
// itself, and each says what the advisor gets out of it. These assertions are
// about the two ways a tip can actively mislead someone.
{
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("./ext.ts", import.meta.url), "utf8");
  const tips = [...src.matchAll(/\bact:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  const pays = [...src.matchAll(/\bpays:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  check("there is a rotation to rotate through", tips.length >= 8, tips.length + " tips");
  check("every tip says what it buys the advisor", pays.length === tips.length,
    tips.length + " tips but " + pays.length + " payoff lines");

  // A command that does not exist is worse than no tip: this page is the only
  // place many advisors will ever learn one, and typing it lands on an error.
  const known = new Set([...src.matchAll(/"(\/[a-z-]+)"/g)].map((m) => m[1]));
  const named = new Set(tips.concat(pays).flatMap((t) => [...t.matchAll(/\/[a-z-]+/g)].map((m) => m[0])));
  const unknown = [...named].filter((c) => !known.has(c));
  check("every command a tip names is a real command", unknown.length === 0,
    "not in the command list: " + unknown.join(", "));

  // Skills are loaded by the agent when the conversation calls for one. They
  // are not slash commands, and telling an advisor to type one sends them to an
  // error rather than to the skill.
  const { readdirSync } = await import("node:fs");
  const skills = readdirSync(process.env.SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => "/" + e.name);
  const asCommand = skills.filter((c) => named.has(c));
  check("no tip tells the advisor to type a skill as a command", asCommand.length === 0,
    "typed as commands: " + asCommand.join(", "));
}

// The rotation has to actually move, or "a different tip every time" is a claim
// rather than a behaviour. It only runs once Fin knows how the advisor writes,
// because until then the interview is deliberately the only tip -- so the voice
// profile goes in first and comes back out afterwards.
{
  const { mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const nb = process.env.HOME + "/Documents/Fin/Notebook";
  mkdirSync(nb, { recursive: true });
  writeFileSync(nb + "/voice.md", "kind: profile\n");

  const strip = (l) => l.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const shown = async () => {
    const line = (await page()).map(strip).find((l) => l.includes("\u00bb"));
    return (line ?? "").split("\u00bb")[1]?.trim() ?? "";
  };
  const seen = new Set();
  for (let i = 0; i < 4; i++) seen.add(await shown());

  check("the tip changes from one launch to the next", seen.size === 4,
    "four launches showed " + seen.size + " distinct tip(s): " + [...seen].join(" | "));
  check("a rotated tip still says what it buys",
    (await page()).map(strip).join("\n").split("\u00bb")[1]?.trim().split("\n").length >= 2,
    "the payoff line is missing once the rotation starts");

  rmSync(nb + "/voice.md");
}

// The disclaimer. Christopher asked for it below the tips between two solid
// lines, and for it to carry three ideas: guardrails exist, Fin can do damage,
// read the question when it asks. Each is checked separately, because losing
// any one of them turns a warning into reassurance.
{
  const strip = (l) => l.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const rendered = (await page()).map(strip);
  const joined = rendered.join("\n");
  const ruleAt = rendered.map((l, i) => [l, i]).filter(([l]) => /^\s*\u2501{10,}\s*$/.test(l)).map(([, i]) => i);

  check("the disclaimer sits between two solid lines", ruleAt.length === 2,
    ruleAt.length + " solid rule(s) found");
  check("it comes after the tip", ruleAt.length === 2 && ruleAt[0] > joined.split("\n").findIndex((l) => l.includes("\u00bb")),
    "the disclaimer is above the tip");
  // The disclaimer wraps, and every line carries the panel's own indent, so
  // the text has to be reflowed before a phrase can be matched across a
  // line break.
  const between = ruleAt.length === 2
    ? rendered.slice(ruleAt[0] + 1, ruleAt[1]).join(" ").replace(/\s+/g, " ").trim()
    : "";
  check("it says guardrails are set up", /guardrail/i.test(between), between.slice(0, 90));
  check("it does not claim they make Fin safe",
    !/\b(safe|secure|protected|cannot be harmed|will prevent)\b/i.test(between), between.slice(0, 90));
  check("it says Fin can do things that cannot be undone",
    /cannot be undone/i.test(between), between.slice(0, 90));
  check("it tells the advisor to read the question",
    /read the question/i.test(between), between.slice(0, 90));
  check("it says use at your own risk", /at your own risk/i.test(between), between.slice(0, 90));
  // D15. Nothing on any SP+ surface may claim compliance, and a disclaimer is
  // exactly where such a sentence would look at home.
  check("it makes no compliance claim",
    !/complian|regulat|approved by|meets the requirements/i.test(between), between.slice(0, 90));
}

// Colour has to come from the theme or the page is unreadable on whichever Look
// the advisor did not choose.
check("the page takes its colours from the theme", used.size >= 4, [...used].join(","));
check("it uses a distinct colour for labels and for values",
  used.has("accent") && used.has("text") && used.has("muted"), [...used].join(","));

// A maximised terminal is 200 columns or more. Letting the layout grow to fill
// it turns the section rules into stray lines running off into the dark and
// pushes the two skill columns so far apart they stop reading as a pair, so the
// composition stops growing and the rest of the terminal is left empty.
{
  const strip = (l) => l.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const wide = await page({ width: 200 });
  const art = wide.filter((l) => /[\u2800-\u28ff><]/.test(strip(l)));
  const panel = wide.filter((l) => !art.includes(l)).map(strip);
  const widest = panel.reduce((n, l) => Math.max(n, l.trimEnd().length), 0);
  check("the panel stops growing on a very wide terminal", widest <= 110,
    "widest composed line is " + widest + " columns");
  check("and still fills a normal one", (await page({ width: 96 }))
    .map(strip).some((l) => l.trimEnd().length > 70),
    "the panel collapsed at 96 columns");
}

// The bar and the number beside it have to mean the same thing. An earlier
// version filled the bar with what had been USED while labelling it with what
// was LEFT, so a fresh conversation showed an empty bar reading "100%", which
// an advisor reads as a fault rather than as good news.
{
  const strip = (l) => l.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const bar = async (percent) => {
    const line = (await page({ percent })).map(strip).find((l) => /room left/.test(l)) ?? "";
    return { full: (line.match(/\u2588/g) ?? []).length, empty: (line.match(/\u2591/g) ?? []).length, line };
  };
  const fresh = await bar(0);
  const tired = await bar(95);
  check("an empty conversation shows a full bar", fresh.full > 0 && fresh.empty === 0, fresh.line);
  check("a nearly full conversation shows a nearly empty bar", tired.full < fresh.full && tired.empty > 0, tired.line);
  check("the bar and its label agree", fresh.full > tired.full, fresh.line + " vs " + tired.line);
}

// Outside the interactive interface there is no header to set, and trying is a
// crash rather than a cosmetic problem.
check("it does nothing outside the interactive interface", (await page({ mode: "print" })) === null);

console.log("");
if (failures > 0) { console.log(`OPENING GATE FAIL: ${failures} assertion(s) red`); process.exit(1); }
console.log("FIN_OPENING_GATE_OK the page says what Fin is, what it can do, and what to try");
HARNESS

if [ -n "$PREVIEW" ]; then PREVIEW=1 node "$WORK/gate.mjs"; else node "$WORK/gate.mjs"; fi
