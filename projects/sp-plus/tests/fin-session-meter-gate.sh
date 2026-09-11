#!/usr/bin/env bash
# Fin session meter gate.
#
# The meter exists to make an invisible limit visible, so the assertions are
# about the WORDS, not the arithmetic. A percentage an advisor cannot act on is
# the failure this extension was written to avoid.
#
# Mutation-tested 2026-09-11: moving either threshold, dropping either piece of
# advice, or reporting tokens instead of plain language turns an assertion red.
set -u

EXT="${1:-}"
if [ -z "$EXT" ]; then
    for c in /usr/share/sp-plus/fin/extensions/spplus-session-meter.ts \
             "$(dirname "$0")/../config/fin-extensions/spplus-session-meter.ts"; do
        [ -r "$c" ] && EXT="$c" && break
    done
fi
[ -n "$EXT" ] && [ -r "$EXT" ] || { echo "FAIL: cannot find spplus-session-meter.ts"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node is not installed"; exit 1; }

WORK=$(mktemp -d) || exit 1
trap 'rm -rf "$WORK"' EXIT
cp "$EXT" "$WORK/ext.ts"

cat > "$WORK/gate.mjs" <<'HARNESS'
import ext from "./ext.ts";

const hooks = {};
ext({ on: (n, f) => { hooks[n] = f; } });

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${ok || !detail ? "" : "  <- " + detail}`);
  if (!ok) failures++;
};

// Capture what the meter would put in the footer at a given fullness.
const readout = (percent) => {
  let shown = null;
  const ctx = {
    hasUI: true,
    ui: { setStatus: (_k, v) => { shown = v; } },
    getContextUsage: () => (percent === null ? undefined : { percent }),
  };
  hooks.turn_end({}, ctx);
  return shown ?? "";
};

check("the meter registers on session start", typeof hooks.session_start === "function");
check("the meter updates after every turn", typeof hooks.turn_end === "function");
check("the meter resets its advice after a compaction", typeof hooks.session_compact === "function");

const early = readout(12);
check("an early conversation reports how long it has been going", /just started|min|hr/.test(early), early);
check("an early conversation reports how full it is", /12% full/.test(early), early);
check("an early conversation gives no advice", !/save/.test(early), early);

const mid = readout(75);
check("a conversation past 70 percent suggests saving", /good point to save/.test(mid), mid);

const late = readout(92);
check("a conversation past 88 percent asks to be saved", /ask me to save this session/.test(late), late);

const boundary = readout(69);
check("69 percent is still quiet", !/save/.test(boundary), boundary);

const unknown = readout(null);
check("an unknown fullness still reports the elapsed time", /just started|min|hr/.test(unknown), unknown);
check("an unknown fullness claims no percentage", !/%/.test(unknown), unknown);

// The whole reason this is not a port of Bee's burn extension.
const all = [early, mid, late, unknown].join(" ");
check("nothing in the footer is said in developer words",
  !/token|ctx |\/min|context window/i.test(all), all);

// A readout must never be able to end a conversation.
let survived = true;
try {
  hooks.turn_end({}, { hasUI: true, ui: { setStatus: () => { throw new Error("boom"); } },
                       getContextUsage: () => ({ percent: 50 }) });
} catch { survived = false; }
check("a fault in the readout cannot break the conversation", survived);

let headless = true;
try { hooks.turn_end({}, { hasUI: false }); } catch { headless = false; }
check("the meter is silent when there is no screen", headless);

console.log("");
if (failures > 0) { console.log(`SESSION METER GATE FAIL: ${failures} assertion(s) red`); process.exit(1); }
console.log("SESSION_METER_GATE_OK the footer says how long, how full, and what to do about it");
HARNESS

node "$WORK/gate.mjs"
