#!/usr/bin/env bash
# Fin notebook gate.
#
# Proves the notebook guard actually refuses what it claims to refuse. It drives
# the REAL extension through the REAL tool_call handler with synthetic events --
# not the helper functions -- because the thing that has to work is the block
# decision, not a regex in isolation.
#
# Mutation-tested 2026-09-11: deleting any single PATTERNS entry, or the name
# bigram loop, or the .md check, turns exactly one assertion red.
#
# Runs anywhere node 22+ and the extension file are present: the build image, a
# checkout, or a booted machine. It needs no pi and no network.
set -u

EXT="${1:-}"
if [ -z "$EXT" ]; then
    for c in /usr/share/sp-plus/fin/extensions/spplus-notebook.ts \
             "$(dirname "$0")/../config/fin-extensions/spplus-notebook.ts"; do
        [ -r "$c" ] && EXT="$c" && break
    done
fi

if [ -z "$EXT" ] || [ ! -r "$EXT" ]; then
    echo "FAIL: cannot find spplus-notebook.ts (pass its path as \$1)"
    exit 1
fi

command -v node >/dev/null 2>&1 || { echo "FAIL: node is not installed"; exit 1; }

WORK=$(mktemp -d) || exit 1
trap 'rm -rf "$WORK"' EXIT
cp "$EXT" "$WORK/ext.ts"

cat > "$WORK/gate.mjs" <<'HARNESS'
import { homedir } from "node:os";
import { join } from "node:path";
import ext from "./ext.ts";

const NB = join(homedir(), "Documents", "Fin", "Notebook");
let handler = null;
ext({ on: (name, fn) => { if (name === "tool_call") handler = fn; } });
if (!handler) { console.log("FAIL: the extension registered no tool_call handler"); process.exit(1); }

const ctx = { cwd: homedir(), hasUI: false, model: { id: "claude-sonnet-5" } };
const call = async (toolName, input) => {
  const event = { toolName, input };
  const out = await handler(event, ctx);
  return { blocked: Boolean(out && out.block), reason: (out && out.reason) || "", input };
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${ok || !detail ? "" : "  <- " + detail}`);
  if (!ok) failures++;
};

const page = (body) => `# A note\n\n${body}\n`;

// 1. Outside the notebook the guard is silent. Fin must stay able to write a
//    letter that names the person it is addressed to.
check("a draft naming a client outside the notebook is allowed",
  !(await call("write", { path: join(homedir(), "Documents", "Fin", "Drafts", "letter.md"),
                          content: page("Dear Robert Hartley, your policy 100482213 is renewed.") })).blocked);

// 2. The notebook is markdown only.
check("a non-markdown file in the notebook is refused",
  (await call("write", { path: join(NB, "notes.txt"), content: page("nothing sensitive here") })).blocked);

// 3-8. Each detectable class, one at a time.
for (const [label, body] of [
  ["an email address",           "Reach them at robert.hartley@example.com when ready."],
  ["a Social Security number",   "The number on file is 123-45-6789 for the application."],
  ["a phone number",             "Best contact is 555-201-9944 in the afternoon."],
  ["a street address",           "The meeting is at 1420 Maple Street next Tuesday."],
  ["a date of birth",            "Their date of birth is on the application already."],
  ["an account or policy number","The policy is 100482213 and renews in March."],
]) {
  const r = await call("write", { path: join(NB, "topics", "renewal.md"), content: page(body) });
  check(`the notebook refuses ${label}`, r.blocked, r.reason.slice(0, 60));
}

// 9. A person's name.
{
  const r = await call("write", { path: join(NB, "topics", "meeting.md"),
                                  content: page("Robert Hartley wants to revisit the annuity.") });
  check("the notebook refuses a person's name", r.blocked);
  check("the refusal tells Fin what to write instead", /role|Client A/.test(r.reason), r.reason.slice(0, 60));
}

// 10. The classes that must NOT trip, or the notebook becomes unusable for the
//     one thing an advisor's notes are actually for.
for (const [label, body] of [
  ["a dollar amount",  "The premium came to $1,250,000 across the two contracts."],
  ["a year",           "The contract was issued in 2019 and reviewed in 2026."],
  ["a role, not a name","The client asked about the surrender period this quarter."],
  ["a product name",   "Compared a Fixed Indexed Annuity against a Multi Year Guarantee."],
]) {
  const r = await call("write", { path: join(NB, "topics", "ok.md"), content: page(body) });
  check(`the notebook accepts ${label}`, !r.blocked, r.reason.slice(0, 70));
}

// 11. An edit carries the same rule as a write.
check("an edit that introduces a name is refused",
  (await call("edit", { path: join(NB, "topics", "meeting.md"),
                        old_string: "the client", new_string: "Robert Hartley" })).blocked);

// 12. Shell redirection into the notebook is refused.
check("a shell redirection into the notebook is refused",
  (await call("bash", { command: `echo hi > ${join(NB, "sneak.md")}` })).blocked);
check("ordinary shell commands are untouched",
  !(await call("bash", { command: "systemctl status cups" })).blocked);

// 13. A clean page is stamped, and the stamp says which model wrote it.
{
  const r = await call("write", { path: join(NB, "sessions", "2026-09-11-printer.md"),
                                  content: page("Sorted out why nothing was printing.") });
  const c = String(r.input.content);
  check("a clean notebook page is saved", !r.blocked);
  check("the page is stamped with a title", /^title: /m.test(c));
  check("the page is stamped with a kind", /^kind: /m.test(c));
  check("the page is stamped with a created time", /^created: \d{4}-\d{2}-\d{2}T/m.test(c));
  check("the page is stamped with an updated time", /^updated: \d{4}-\d{2}-\d{2}T/m.test(c));
  check("the page records the model that wrote it", /^written_by: Fin using claude-sonnet-5$/m.test(c), c.slice(0, 120));
  check("the body survives the stamp", c.includes("Sorted out why nothing was printing."));
}

// 14. Rewriting a page keeps its original created time. A notebook whose pages
//     all claim to have been created today is not a record of anything.
{
  const first = await call("write", { path: join(NB, "topics", "voice.md"), content: page("first pass") });
  const created = String(first.input.content).match(/^created: (\S+)/m)[1];
  await new Promise((r) => setTimeout(r, 1100));
  const second = await call("write", { path: join(NB, "topics", "voice.md"),
                                       content: String(first.input.content).replace("first pass", "second pass") });
  const c2 = String(second.input.content);
  check("rewriting a page preserves its created time", c2.includes(`created: ${created}`), c2.slice(0, 120));
  check("rewriting a page moves its updated time", !c2.includes(`updated: ${created}`));
}

console.log("");
if (failures > 0) { console.log(`NOTEBOOK GATE FAIL: ${failures} assertion(s) red`); process.exit(1); }
console.log("NOTEBOOK_GATE_OK the notebook refuses names and personal detail, and stamps every page");
HARNESS

node "$WORK/gate.mjs"
