// Behaviour gate for how Fin RECALLS, as opposed to what it refuses to write.
//
// Why this exists. Until 2026-09-12 the notebook skill told Fin to read the
// index at the start of every conversation. On the v0.11.2 VM that produced,
// on an advisor's very first exchange, a red ENOENT naming a file path -- the
// index is only written after the first page is saved, and a new machine has
// no pages. It also spent roughly a thousand tokens of skill body plus a file
// read on every conversation, including the ones where the advisor asks why
// the printer is offline and leaves.
//
// Christopher's two real users are an advisor who pecks at Fin with short
// unrelated questions all day and a marketer who runs one long session. Neither
// saves anything. So recall became a small cached block on the system prompt and
// saving became automatic, and both of those are claims that need a gate.
//
// Usage: node tests/fin-notebook-recall-gate.mjs [path/to/spplus-notebook.ts]
import { createJiti } from '/home/chris/.local/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.mjs';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const INSTALLED = '/usr/share/sp-plus/fin/extensions/spplus-notebook.ts';
const SOURCE = resolve(HERE, '..', 'config', 'fin-extensions', 'spplus-notebook.ts');
const EXT = process.argv[2] || (existsSync(INSTALLED) ? INSTALLED : SOURCE);

const NB = resolve(homedir(), 'Documents', 'Fin', 'Notebook');
const jiti = createJiti(import.meta.url);

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  ok  ${m}`); };
const bad = (m) => { fail++; console.log(`FAIL  ${m}`); };
const is = (cond, m) => (cond ? ok(m) : bad(m));

async function load() {
  const handlers = {};
  const mod = await jiti.import(EXT, { default: true });
  mod({ on: (e, h) => { (handlers[e] ||= []).push(h); } });
  return handlers;
}
const fire = async (h, evt, ev, ctx = {}) => {
  let r;
  for (const fn of h[evt] || []) r = (await fn(ev, ctx)) ?? r;
  return r;
};
const primerOf = async (h) => {
  const r = await fire(h, 'before_agent_start', { type: 'before_agent_start', systemPrompt: 'BASE' });
  if (!r || typeof r.systemPrompt !== 'string') return null;
  return r.systemPrompt.slice('BASE'.length);
};

console.log(`\n=== SP+ FIN NOTEBOOK RECALL GATE ===\n\n  ${EXT}\n`);

// --- A. a brand new machine must not produce an error -----------------------
console.log('A. A NEW MACHINE');
rmSync(NB, { recursive: true, force: true });
let h = await load();
await fire(h, 'session_start', { type: 'session_start', reason: 'startup' });
is(existsSync(resolve(NB, 'README.md')),
   'the index exists before anything is told to read it');

let p = await primerOf(h);
is(p !== null, 'Fin is given a recall block without reading a file');
is(p !== null && /do not go looking/i.test(p),
   'and is told not to go hunting through an empty notebook');

// --- B. the cost, which is the whole point ----------------------------------
console.log('\nB. WHAT RECALL COSTS ON A CONVERSATION THAT DOES NOT NEED IT');
// The old design paid the skill body (~3.9 KB) plus a file read every time.
// Anything approaching that is a regression back to it.
const BUDGET = 1200;
is(p !== null && p.length <= BUDGET,
   `an empty-notebook block is ${p ? p.length : '?'} bytes, at or under the ${BUDGET} budget`);

// --- C. the advisor's voice, carried without a lookup -----------------------
console.log('\nC. THE VOICE PROFILE IS CARRIED, NOT FETCHED');
mkdirSync(resolve(NB, 'notes'), { recursive: true });
writeFileSync(resolve(NB, 'voice.md'),
  '---\ntitle: Voice\nkind: profile\n---\n\nShort sentences. Never an exclamation mark.\n');
writeFileSync(resolve(NB, 'notes', 'renewals.md'),
  '---\ntitle: Renewals\nkind: note\n---\n\nRenewals run in March.\n');
h = await load();
await fire(h, 'session_start', { type: 'session_start', reason: 'new' });
p = await primerOf(h);
is(p !== null && p.includes('Never an exclamation mark'),
   'the profile is in the block, so the first draft already sounds right');
is(p !== null && !/^---$/m.test(p),
   'and its frontmatter is stripped rather than billed every turn');
is(p !== null && /1 note\b/.test(p),
   'other pages are named and counted, not loaded');
is(p !== null && !p.includes('Renewals run in March'),
   'a note is NOT pasted into every conversation');

// --- D. stable bytes, or the prompt cache is wasted -------------------------
console.log('\nD. STABLE ACROSS TURNS');
const a = await primerOf(h), b = await primerOf(h);
is(a === b, 'the same bytes every turn, so the prompt cache holds');

// --- E. saving without being asked ------------------------------------------
console.log('\nE. THE SESSION SAVES ITSELF');
rmSync(resolve(NB, 'sessions'), { recursive: true, force: true });
const real = 'We built a seminar flyer for the March retirement workshop and set the type. '.repeat(4);
await fire(h, 'session_compact',
  { type: 'session_compact', compactionEntry: { summary: real }, reason: 'threshold' },
  { model: 'gpt-5.6-luna' });
let saved = existsSync(resolve(NB, 'sessions')) ? readdirSync(resolve(NB, 'sessions')) : [];
is(saved.length === 1, 'a real conversation is written down with nobody asking');
if (saved.length === 1) {
  const t = readFileSync(resolve(NB, 'sessions', saved[0]), 'utf8');
  is(/^kind: session$/m.test(t), 'filed as a session, so the index groups it correctly');
  is(/^written_by: Fin using gpt-5.6-luna$/m.test(t), 'stamped with the model that wrote it');
}

rmSync(resolve(NB, 'sessions'), { recursive: true, force: true });
await fire(h, 'session_compact',
  { type: 'session_compact', compactionEntry: { summary: 'hi' }, reason: 'threshold' }, { model: 'm' });
is(!existsSync(resolve(NB, 'sessions')),
   'a conversation with nothing in it is not filed as a memory');

console.log('\nF. THE NO-NAMES RULE STILL APPLIES TO WHAT FIN DID NOT CHOOSE');
await fire(h, 'session_compact',
  { type: 'session_compact',
    compactionEntry: { summary: 'We drafted a letter for Robert Hartley about the policy. '.repeat(4) },
    reason: 'threshold' }, { model: 'm' });
saved = existsSync(resolve(NB, 'sessions')) ? readdirSync(resolve(NB, 'sessions')) : [];
is(saved.length === 1, 'the page is still written, redacted rather than lost');
if (saved.length === 1) {
  const t = readFileSync(resolve(NB, 'sessions', saved[0]), 'utf8');
  is(!t.includes('Robert Hartley'), 'and the name the summary carried does not reach the disk');
}

// --- G. the skill must not send Fin back to the old behaviour ---------------
console.log('\nG. THE SKILL AGREES WITH THE EXTENSION');
const SKILL = existsSync('/usr/share/sp-plus/fin/skills/notebook/SKILL.md')
  ? '/usr/share/sp-plus/fin/skills/notebook/SKILL.md'
  : resolve(HERE, '..', 'config', 'fin-skills', 'notebook', 'SKILL.md');
const skill = readFileSync(SKILL, 'utf8');
is(!/Use at the start of a conversation/i.test(skill),
   'the description no longer fires the skill on a greeting');
is(/Do not open the notebook at the start of a conversation/i.test(skill),
   'and the body says so in as many words');
is(/automatically as a `session` page/i.test(skill),
   'the skill knows sessions are saved for it');
is(/do not offer to save the session/i.test(skill),
   'so Fin does not nag the advisor to file paperwork it already filed');

rmSync(NB, { recursive: true, force: true });
console.log(`\nRESULT pass=${pass} fail=${fail}`);
if (fail) { console.log('FIN NOTEBOOK RECALL GATE: FAIL'); process.exit(1); }
console.log('FIN_NOTEBOOK_RECALL_GATE_OK recall is cheap, the index self-heals, sessions save themselves');
