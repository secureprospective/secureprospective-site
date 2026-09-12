/**
 * SP+ Opening — what an advisor sees when Fin starts.
 *
 * Christopher, 2026-09-11: an information panel like Bee's, "Dont put it next
 * to the school of fish, do it below the fish. Keep to the asthetice os SP+,
 * but be mindfull of making it fun, cool, and attractive enough people will
 * want to keep it on screen." Suggestions on the page, with the voice interview
 * in the rotation. And: "Unlike Bee, our explainations of the skills and
 * extentions and tips should be plain language and well defined."
 *
 * WHY THIS REPLACES A PRINTED BANNER. The fish were printed to stdout by the
 * launcher before pi started, so they scrolled away with the first answer and
 * told the advisor nothing. This is a pi header instead: it renders inside the
 * interface, so it stays on screen, survives a resize, and can show live facts
 * rather than a fixed picture. The art itself is unchanged and still comes from
 * fin-banner, which is run once here rather than by the shell.
 *
 * WHY THE ART IS NOT COPIED INTO THIS FILE. fin-banner draws the shoal by
 * flipping braille cells dot by dot, and a hand-mirrored copy rots silently the
 * moment the art is edited. That reasoning is written down in fin-banner itself
 * and it still holds, so the art has exactly one source and this file asks it
 * for a picture.
 *
 * EVERY ROW EARNS ITS PLACE. Bee's panel shows a git branch, project trust and
 * a fleet of hosts. An advisor has no branch, cannot act on trust, and owns one
 * computer. What is here is what an advisor can act on: whether Fin is
 * connected, how much room is left in the conversation, whether their notebook
 * has anything in it, where their files go, what Fin can actually do in plain
 * words, and one thing worth trying today.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const BANNER = "/usr/libexec/sp-plus/fin-banner";
const SKILLS_DIR = "/usr/share/sp-plus/fin/skills";
const NOTEBOOK = join(homedir(), "Documents", "Fin", "Notebook");
const VOICE = join(NOTEBOOK, "voice.md");

const TITLE = "F I N";
const SUBTITLE = "YOUR SP+ ASSISTANT";
const TAGLINE = "Ask me to fix it, write it, or explain it.";

/**
 * COLOUR, and the one place the brand cannot be followed literally.
 *
 * The Secure Prospective palette -- INK #12325B, BODY #3A4048, GROUND #EEF0F3,
 * ACCENT #F5C542 -- is specified for a LIGHT ground. This panel has no ground of
 * its own: it sits on whatever colour the advisor's terminal is, and SP+ ships
 * both light and dark Looks. Painting body text in BODY would make it almost
 * invisible on a dark terminal, and painting it in GROUND would make it
 * invisible on a light one. Either way an advisor who picked the other Look
 * opens Fin to an unreadable page.
 *
 * So the text takes its colour from pi's own theme, which knows the ground, and
 * the brand is carried by the two things that can carry it safely: the shoal,
 * which paints itself, and the wordmark, in ACCENT gold and bold. Gold is the
 * one brand colour with enough contrast on both grounds, and using it only for
 * a short mark rather than for prose keeps the brand rule that yellow is never
 * body type.
 *
 * The status bar is the opposite case and does use the palette literally: every
 * segment there sets its own background as well as its foreground, so it
 * controls its own contrast and the ground underneath does not matter.
 */
const ACCENT = [245, 197, 66] as const;
const gold = (t: string) =>
	t.trim() === "" ? t : `\x1b[38;2;${ACCENT[0]};${ACCENT[1]};${ACCENT[2]}m${t}\x1b[39m`;
const bold = (t: string) => `\x1b[1m${t}\x1b[22m`;

/** Wrap prose to a width, so a suggestion is never cut off mid-word. */
function wrap(text: string, max: number): string[] {
	const out: string[] = [];
	let line = "";
	for (const word of text.split(" ")) {
		const next = line ? line + " " + word : word;
		if (next.length > max && line) {
			out.push(line);
			line = word;
		} else line = next;
	}
	if (line) out.push(line);
	return out;
}

/**
 * What each skill is FOR, in words an advisor would use.
 *
 * Keyed by skill name and driven by what is actually installed, so removing a
 * skill removes its line rather than leaving the panel advertising something
 * that is not there. A skill with no entry here falls back to its own name,
 * which looks wrong on purpose: a new skill should get a sentence written for
 * it rather than quietly inherit a developer's word.
 */
/**
 * Skills that are installed and working but not listed on the panel.
 *
 * Christopher, 2026-09-12: "Cut these lines: Printer, writing, Saving."
 *
 * They are not removed, disabled or hidden from Fin -- ask for any of them and
 * they run exactly as before. They are only off THIS list, which is a list of
 * six things competing for the same glance. All three are carried by the
 * rotating tips instead, where they arrive one at a time with a reason attached,
 * which is a better place to learn something than a column of labels.
 *
 * Their descriptions stay in the table below on purpose: the gate holds every
 * INSTALLED skill to having one, so a skill that comes back onto the panel later
 * cannot come back under its directory name.
 */
const PANEL_HIDDEN = new Set(["printer", "email", "save-this-session"]);

const SKILL_BLURBS: Record<string, [string, string]> = {
	printer: ["Printing", "Fix a printer that has stopped working"],
	marketing: ["Design", "Make a flyer or handout and turn it into a PDF"],
	email: ["Writing", "Draft an email or letter that sounds like you"],
	voice: ["Your style", "Learn how you like things written"],
	notebook: ["Memory", "Keep notes so nothing is explained twice"],
	"save-this-session": ["Saving", "Write down where we got to before you stop"],
};

/**
 * TRY THIS -- a different one every time Fin opens.
 *
 * Christopher, 2026-09-12: the tips should cover "the commands, skills,
 * extentions, tips on addressing the things 'what i can do' actually can be
 * worked on", and each one should say what the advisor gets out of it -- his
 * example ended "Next Time Fin will be better."
 *
 * So every tip is two lines: something to DO, and what it BUYS. A tip without
 * the second line is a feature list, and an advisor has no reason to act on a
 * feature list.
 *
 * TWO RULES ABOUT WHAT MAY BE NAMED HERE.
 *
 * 1. A slash command named here must exist. This page is the only place many
 *    advisors will ever learn a command, so one that does nothing costs more
 *    trust than the tip could ever earn. The gate checks every command named
 *    below against COMMANDS, and COMMANDS was read off the agent's own list.
 * 2. Skills are NOT slash commands. The agent loads them on its own when the
 *    conversation calls for one, so a skill is reached by asking in a sentence.
 *    Telling an advisor to type "/save-this-session" would send them to an
 *    error, which is why the gate refuses any tip that does it.
 */
type Tip = { act: string; pays: string };

/** Slash commands that exist. Anything named in a tip must appear here. */
const COMMANDS = [
	"/login", "/model", "/thinking", "/new", "/resume", "/export",
	"/copy", "/compact", "/plan", "/hotkeys", "/settings", "/quit",
] as const;

const TIPS: Tip[] = [
	// --- the notebook, which is the thing that compounds ------------------
	{
		act: "Ask me to save this session before you stop for the day.",
		pays: "It goes in your notebook, so tomorrow I already know what we did and you explain it once.",
	},
	{
		act: "Ask me what we worked on last time.",
		pays: "I read my own notes back, so a job you started on Monday can be finished on Thursday.",
	},
	{
		act: "Tell me something about how your business runs, and ask me to note it down.",
		pays: "Renewal timing, which carrier portal is awkward, how you file things. I stop asking.",
	},
	// --- voice, which every piece of writing depends on --------------------
	{
		act: "Teach me how you write, so everything I draft sounds like you.",
		pays: "Worth doing once. Every email and handout I write afterwards starts in your voice.",
	},
	{
		act: "Tell me when a draft does not sound like you, and say what was off.",
		pays: "I change how I write for you permanently, rather than fixing that one draft.",
	},
	// --- the work itself ---------------------------------------------------
	{
		act: "Hand me your notes from a meeting and ask for the follow-up email.",
		pays: "You get a draft to edit instead of a blank page. I never send anything; that stays yours.",
	},
	{
		act: "Ask me to make a one-page handout for a seminar.",
		pays: "I lay it out and turn it into a PDF you can print or attach.",
	},
	{
		act: "Tell me your printer has stopped and let me look at it myself.",
		pays: "I can read the settings and fix them. Describing the problem is usually enough.",
	},
	{
		act: "Paste a long letter and ask what it does not answer.",
		pays: "The gaps are the part worth a phone call, and they are the easiest part to miss.",
	},
	// --- commands ----------------------------------------------------------
	{
		act: "Type /plan before a big job.",
		pays: "I lay out what I intend to do and wait for your yes before I touch anything.",
	},
	{
		act: "Type /thinking to change how hard I think.",
		pays: "Turn it up for something knotty, down for something quick. The level shows in the bar below.",
	},
	{
		act: "Type /new when you change subject.",
		pays: "A fresh start beats a long conversation that has drifted, and nothing saved is lost.",
	},
	{
		act: "Type /resume to go back to an earlier conversation.",
		pays: "Yesterday's is still there, exactly where you left it.",
	},
	{
		act: "Type /copy to put my last answer on your clipboard.",
		pays: "Faster than selecting it, and it keeps the formatting.",
	},
	{
		act: "Type /export to save this conversation as a file.",
		pays: "Useful when you want the whole thread somewhere else rather than a summary.",
	},
	{
		act: "Type /model to change which model I use.",
		pays: "Whichever one you pick shows in the bar below, so you always know who you are talking to.",
	},
	{
		act: "Type /hotkeys to see the keyboard shortcuts.",
		pays: "A minute now, and you stop reaching for the mouse.",
	},
	{
		act: "Type /login if I am ever signed out.",
		pays: "Takes a few seconds, and nothing you have saved is lost while you are signed out.",
	},
	{
		act: "Type /compact when a long conversation starts to drag.",
		pays: "I keep the thread but shorten it, so we carry on instead of starting over.",
	},
	{
		act: "Type /settings to change how I look and behave.",
		pays: "The colours and the bar along the bottom are yours to set, not mine.",
	},
	{
		act: "Type /export before a conversation you might need on paper.",
		pays: "You get the whole thread as a file, rather than my summary of it.",
	},
	// --- what Fin can reach ------------------------------------------------
	{
		act: "Give me a web address and ask me to read the page.",
		pays: "I can pull out the three things that matter so you do not read all of it.",
	},
	{
		act: "Ask me to tidy a folder by file name.",
		pays: "I sort and rename without opening anything, so nothing private is read to do it.",
	},
];

/**
 * The first run is not a rotation. Until Fin knows how the advisor writes,
 * everything it drafts is a guess, so that tip is THE tip rather than one of
 * nineteen.
 */
const FIRST_RUN_TIP: Tip = TIPS.find((t) => t.act.startsWith("Teach me how you write"))!;

/** Where the rotation keeps its place. One number; no advisor detail. */
const TIP_STATE = join(homedir(), ".pi", "agent", "fin-tip.json");

/**
 * Advance the rotation by one and remember where it got to.
 *
 * Picking at random would show the same tip twice in a row often enough to look
 * broken, and would leave some tips unseen for months. Stepping through in order
 * means an advisor who opens Fin every morning meets all nineteen inside a
 * month. A state file that cannot be read or written costs the rotation and
 * nothing else.
 */
function nextTip(): Tip {
	let i = 0;
	try {
		const raw = JSON.parse(readFileSync(TIP_STATE, "utf8")) as { next?: number };
		if (typeof raw.next === "number" && Number.isFinite(raw.next)) i = raw.next;
	} catch {
		/* first run, or a file we cannot read: start at the beginning */
	}
	i = ((i % TIPS.length) + TIPS.length) % TIPS.length;
	try {
		// The directory is created first. pi makes it on its own first run, so on
		// an advisor's machine it is already there -- but when it is not, the
		// write fails, the catch swallows it, and the rotation silently shows tip
		// one forever. The gate found exactly that.
		mkdirSync(dirname(TIP_STATE), { recursive: true });
		writeFileSync(TIP_STATE, JSON.stringify({ next: (i + 1) % TIPS.length }));
	} catch {
		/* a read-only home means the same tip every time, which is still a tip */
	}
	return TIPS[i]!;
}

/**
 * The disclaimer, below the tips and between two solid lines.
 *
 * Christopher, 2026-09-12, asked for this in roughly these words: Fin is
 * configured with guardrails for the advisor and their business; use at your
 * own risk, because Fin is a powerful agent capable of destructive actions;
 * read its questions when it asks for permission.
 *
 * WHAT IT DELIBERATELY DOES NOT SAY. It does not say Fin is safe, and it does
 * not say the guardrails will stop anything in particular. They gate the bash,
 * write and edit tools and they stop accidents, which the guardrail file itself
 * describes as "a floor, not a boundary". Claiming more here would be the one
 * sentence on this page an advisor might actually rely on, and D15 rules out
 * any claim of that shape on any SP+ surface.
 *
 * It is also the shortest wording that still carries all three ideas, because a
 * disclaimer nobody finishes reading is decoration.
 */
const DISCLAIMER =
	"Fin has guardrails set up for you and your business, but they are a floor, not a fence. " +
	"Fin can change this computer, and some changes cannot be undone. Read the question " +
	"whenever Fin asks to do something. Use Fin at your own risk.";

function bannerLines(): string[] {
	try {
		return execFileSync(BANNER, { timeout: 1500, stdio: ["ignore", "pipe", "ignore"] })
			.toString()
			.replace(/\n+$/, "")
			.split("\n");
	} catch {
		return []; // no art is a small loss; a failed start is not
	}
}

/** Count the notebook without reading any of it. */
function notebookState(): { pages: number; latest: string } {
	let pages = 0;
	let latest = "";
	const walk = (dir: string) => {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			const full = join(dir, e.name);
			if (e.isDirectory()) walk(full);
			else if (/\.md$/i.test(e.name) && e.name.toLowerCase() !== "readme.md") {
				pages++;
				try {
					const d = readFileSync(full, "utf8").match(/^updated:\s*(\S{10})/m)?.[1];
					if (d && d > latest) latest = d;
				} catch {
					/* a page we cannot read is still a page */
				}
			}
		}
	};
	walk(NOTEBOOK);
	return { pages, latest };
}

function installedSkills(): [string, string][] {
	let names: string[];
	try {
		names = readdirSync(SKILLS_DIR, { withFileTypes: true })
			.filter((e) => e.isDirectory())
			.map((e) => e.name);
	} catch {
		return [];
	}
	// Presentation order, not directory order: the two an advisor is most
	// likely to want first, then the rest.
	const ORDER = ["printer", "email", "marketing", "voice", "notebook", "save-this-session"];
	names.sort((a, b) => {
		const ia = ORDER.indexOf(a);
		const ib = ORDER.indexOf(b);
		return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
	});
	return names.filter((n) => !PANEL_HIDDEN.has(n)).map((n) => SKILL_BLURBS[n] ?? [n, n]);
}

/* ------------------------------------------------------------- rendering -- */

const ANSI = /\x1b\[[0-9;]*[A-Za-z]/g;
const visible = (s: string) => s.replace(ANSI, "").length;

/**
 * Clip to the terminal width. pi hard-crashes if a rendered line is wider than
 * the terminal, so this is not cosmetic.
 */
function clip(s: string, max: number): string {
	if (visible(s) <= max) return s;
	let out = "";
	let w = 0;
	for (const part of s.split(/(\x1b\[[0-9;]*[A-Za-z])/)) {
		if (part.startsWith("\x1b")) {
			out += part;
			continue;
		}
		for (const ch of part) {
			if (w + 1 > max) return out + "\x1b[39m\x1b[22m";
			out += ch;
			w++;
		}
	}
	return out + "\x1b[39m\x1b[22m";
}

/** Pad to a visible width, ignoring the colour codes inside. */
function padTo(s: string, w: number): string {
	const gap = w - visible(s);
	return gap > 0 ? s + " ".repeat(gap) : s;
}

export default function opening(pi: ExtensionAPI) {
	pi.on("session_start", async (event, ctx) => {
		if (ctx.mode !== "tui") return;

		// Gathered once. A panel that re-reads the notebook on every redraw would
		// hit the disk every time the terminal is resized.
		const art = bannerLines();
		const book = notebookState();
		const skills = installedSkills();
		const hasVoice = existsSync(VOICE);
		const tip = hasVoice ? nextTip() : FIRST_RUN_TIP;

		ctx.ui.setHeader((_tui, theme) => ({
			render(termWidth: number): string[] {
				// The panel is a composed block, not a stretched one. Beyond this
				// the rules turn into stray lines and the columns drift so far
				// apart they stop reading as a pair, so the layout stops growing
				// and the rest of the terminal is simply left empty.
				const MAX = 98;
				const width = Math.min(termWidth, MAX);
				// Semantic, so the panel stays legible on a light Look and a dark
				// one, and re-tints if the advisor changes theme.
				const key = (t: string) => theme.fg("accent", t);
				const val = (t: string) => theme.fg("text", t);
				const dim = (t: string) => theme.fg("dim", t);
				const quiet = (t: string) => theme.fg("muted", t);

				const rows: string[] = [];
				const PAD = "  ";

				// A heading is a gold word with a rule running to the right edge.
				// The rule is what makes the panel read as designed rather than
				// as a list, and it costs one line instead of the three a box
				// would cost.
				const heading = (name: string) => {
					const used = visible(PAD + name) + 2;
					rows.push("");
					rows.push(PAD + bold(gold(name)) + " " + dim("─".repeat(Math.max(3, width - used - 2))));
				};

				/* ------------------------------------------------ identity -- */

				rows.push("");
				rows.push(
					PAD + bold(gold(TITLE)) + dim("  ·  ") + val(SUBTITLE),
				);
				rows.push(PAD + dim(TAGLINE));
				rows.push("");

				/* -------------------------------------------------- status -- */
				// No heading here on purpose. These four facts are about the
				// machine the advisor is sitting at, and a label over them only
				// tells them what they can already see.

				const LBL = 12;
				const row = (label: string, value: string) =>
					rows.push(PAD + key(label.padEnd(LBL)) + value);

				const m = ctx.model;
				const connected = m
					? val(m.name || m.id) + dim("  ·  ") + quiet(m.provider)
					: key("not yet") + dim("  ·  type ") + val("/login") + quiet(" to sign in");

				// The meter fills with what is LEFT, because the number beside it
				// counts what is left. An earlier version filled with what was
				// used, so a fresh conversation showed an empty bar labelled
				// "100%", which reads as broken.
				const pct = ctx.getContextUsage?.()?.percent ?? null;
				let meter = "";
				if (pct !== null) {
					const FILL = 12;
					const left = Math.max(0, Math.min(100, 100 - pct));
					const n = Math.max(0, Math.min(FILL, Math.round((left / 100) * FILL)));
					const bar = left <= 15 ? theme.fg("warning", "█".repeat(n)) : theme.fg("success", "█".repeat(n));
					meter = bar + dim("░".repeat(FILL - n)) + quiet("  " + Math.round(left) + "% room left");
				}

				// Wide terminals get the model and the meter on one line. Narrow
				// ones stack, because a clipped meter is worse than a second row.
				if (meter && width >= 86) {
					rows.push(PAD + key("Connected".padEnd(LBL)) + padTo(connected, 34) + meter);
				} else {
					row("Connected", connected);
					if (meter) row("Room left", meter);
				}

				const notebook =
					book.pages === 0
						? quiet("empty for now · I will start it as we go")
						: val(String(book.pages)) +
							quiet(book.pages === 1 ? " page" : " pages") +
							(book.latest ? dim("  ·  last changed " + book.latest) : "");
				row("Notebook", notebook);
				row("Your files", quiet("everything I write goes in ") + val("Documents/Fin"));

				/* -------------------------------------------------- skills -- */

				if (skills.length > 0) {
					heading("WHAT I CAN DO");

					// Two columns when there is genuinely room for two full
					// sentences side by side. The threshold is measured against
					// the longest blurb rather than guessed, so a long new blurb
					// pushes the panel back to one column instead of truncating.
					const widest = skills.reduce((n, [, b]) => Math.max(n, b.length), 0);
					const colWidth = 2 + LBL + widest + 2;
					const twoUp = width >= colWidth * 2;

					if (twoUp) {
						const half = Math.ceil(skills.length / 2);
						for (let i = 0; i < half; i++) {
							const L = skills[i]!;
							let line = PAD + " " + val(L[0].padEnd(LBL)) + dim(L[1]);
							const R = skills[i + half];
							if (R) line = padTo(line, colWidth) + val(R[0].padEnd(LBL)) + dim(R[1]);
							rows.push(line);
						}
					} else {
						for (const [label, blurb] of skills) {
							rows.push(PAD + " " + val(label.padEnd(LBL)) + dim(blurb));
						}
					}
				}

				/* ---------------------------------------------- suggestion -- */

				heading("TRY THIS");
				const actLines = wrap(tip.act, Math.max(24, width - 10));
				rows.push(PAD + " " + bold(gold("»")) + "  " + val(actLines[0]!));
				for (const l of actLines.slice(1)) rows.push(PAD + "    " + val(l));
				// The payoff is the half that makes the tip worth acting on, so it
				// always renders, wrapped like the rest rather than clipped.
				for (const l of wrap(tip.pays, Math.max(24, width - 10))) {
					rows.push(PAD + "    " + quiet(l));
				}
				rows.push("");

				// Two solid rules, so the disclaimer reads as a notice rather than
				// as one more section of the panel. It is the last thing on the
				// page because it is about everything above it.
				const solid = "━".repeat(Math.max(10, width - 4));
				rows.push(PAD + dim(solid));
				for (const l of wrap(DISCLAIMER, Math.max(24, width - 6))) {
					rows.push(PAD + quiet(l));
				}
				rows.push(PAD + dim(solid));
				rows.push("");

				const out = [...art, ...rows].map((l) => clip(l, termWidth));
				return ["", ...out];
			},
			invalidate() {},
		}));
	});
}
