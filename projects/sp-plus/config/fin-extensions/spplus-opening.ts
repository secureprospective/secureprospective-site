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
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
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
const SKILL_BLURBS: Record<string, [string, string]> = {
	printer: ["Printing", "Fix a printer that has stopped working"],
	marketing: ["Design", "Make a flyer or handout and turn it into a PDF"],
	email: ["Writing", "Draft an email or letter that sounds like you"],
	voice: ["Your style", "Learn how you like things written"],
	notebook: ["Memory", "Keep notes so nothing is explained twice"],
	"save-this-session": ["Saving", "Write down where we got to before you stop"],
};

/**
 * Things worth trying. Written as the advisor would say them, because the point
 * is that they can be said straight back to Fin without being translated first.
 */
const SUGGESTIONS: string[] = [
	"Teach me how you write, so my drafts sound like you.",
	"My printer has stopped working. Can you sort it out?",
	"Here are my notes from a meeting. Turn them into a follow-up email.",
	"Make me a one-page handout for a seminar next month.",
	"Explain this letter in plain English and tell me what it does not answer.",
	"Tidy up my Downloads folder, by file name only.",
	"What did we work on last time?",
	"Save this conversation so we can pick it up tomorrow.",
	"Read this page for me and pull out the three things that matter.",
	"Turn this long document into a one-page summary I can discuss.",
];

/** The suggestion that is always right when it is true. */
const FIRST_RUN_SUGGESTION =
	"Teach me how you write, so everything I draft sounds like you.";

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
	return names.map((n) => SKILL_BLURBS[n] ?? [n, n]);
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
		const suggestion = hasVoice
			? SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]!
			: FIRST_RUN_SUGGESTION;

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
				const lines = wrap(suggestion, Math.max(24, width - 10));
				rows.push(PAD + " " + bold(gold("»")) + "  " + val(lines[0]!));
				for (const l of lines.slice(1)) rows.push(PAD + "    " + val(l));
				if (!hasVoice) {
					rows.push(PAD + "    " + quiet("worth doing once; everything I write afterwards uses it"));
				}
				rows.push("");

				const out = [...art, ...rows].map((l) => clip(l, termWidth));
				return ["", ...out];
			},
			invalidate() {},
		}));
	});
}
