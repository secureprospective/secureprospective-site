/**
 * SP+ Notebook — the advisor's second brain, and the guard that keeps names out
 * of it.
 *
 * Christopher's rule, 2026-09-11: "Keep everything in markdown, everything needs
 * to be advisor facing and well indexed, time stamped, even what model created
 * the markdown. The Note book needs safe gaurds, where it doesnt record human
 * names and PII."
 *
 * WHY THIS IS AN EXTENSION AND NOT A PARAGRAPH IN A SKILL. Same reason as
 * spplus-organize.ts, and the same evidence. DN-31 decision 7: a system prompt is
 * not a guardrail. A skill that says "do not write client names into the
 * notebook" is a request, and a request fails silently on the one occasion it
 * matters -- which here means an advisor's client list sitting in plain markdown
 * in their Documents folder, synced to wherever their Documents folder syncs. The
 * notebook is the one place in SP+ that accumulates, so it is the one place where
 * a leak compounds instead of passing.
 *
 * WHAT THIS IS NOT. This is not a promise that the notebook is anonymous. It
 * gates the write and edit TOOLS and the obvious shell redirection into the
 * notebook. It stops Fin from recording a name. It does not stop an advisor who
 * opens Kate and types one in themselves, and it is not a data-protection
 * control for anything that leaves the machine. Whether the CONTENTS of a
 * document may be sent to a cloud provider is DN-31 decisions 6-9 and is not
 * implemented here.
 *
 * WHERE CLIENT DETAIL IS ALLOWED TO GO. Everywhere else under Documents/Fin.
 * An advisor asking for a letter to a named client is doing something ordinary
 * and Fin must be able to do it. The draft goes in Documents/Fin/Drafts and is
 * untouched by this file. Only the notebook -- the durable, accumulating,
 * indexed store -- is held to the no-names rule. If that boundary is ever
 * removed, this whole file stops being worth loading.
 *
 * THE NAME CHECK IS A HEURISTIC AND ERRS TOWARD BLOCKING. Detecting a human name
 * in prose is not decidable, so this matches a common first name followed by a
 * capitalised word -- "Robert Hartley" -- and refuses the write. It will also
 * refuse "Grace Period" and "Frank Discussion". That is the intended direction of
 * error: the cost of a false positive is that Fin rewrites the phrase in lower
 * case and loses nothing, and the cost of a false negative is a client's name on
 * disk forever. Do not "fix" the false positives by loosening the match.
 */

import { homedir } from "node:os";
import { isAbsolute, resolve, sep } from "node:path";
import { realpathSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** The notebook. Inside Documents/Fin so the workspace confinement in
 *  spplus-workspace.ts already applies; this narrows it further. */
const NOTEBOOK = resolve(homedir(), "Documents", "Fin", "Notebook");

/** Where Fin should put anything that legitimately names a person. */
const DRAFTS_HINT = "Documents/Fin/Drafts";

/* ------------------------------------------------------------------ paths -- */

/**
 * Resolve without trusting the path. Lifted deliberately from
 * spplus-workspace.ts rather than shared: these two files are loaded
 * independently by absolute path from a read-only /usr, and a shared helper
 * would mean one more thing that has to resolve at runtime for either to work.
 * The duplication is cheap and the coupling is not.
 */
function canonical(target: string): string {
	let head = target;
	const tail: string[] = [];
	for (;;) {
		try {
			return resolve(realpathSync(head), ...tail);
		} catch {
			const parent = resolve(head, "..");
			if (parent === head) return target;
			tail.unshift(head.slice(parent.length + 1));
			head = parent;
		}
	}
}

function insideNotebook(target: string): boolean {
	const real = canonical(target);
	const root = canonical(NOTEBOOK);
	return real === root || real.startsWith(root + sep);
}

/* -------------------------------------------------------------------- PII -- */

type Finding = { label: string; advice: string; sample: string };

/**
 * The classes that are reliably machine-detectable. Each carries the sentence
 * Fin is shown when it is blocked, because a refusal that does not say what to
 * do instead just gets retried with the same content.
 */
const PATTERNS: { label: string; advice: string; re: RegExp }[] = [
	{
		label: "an email address",
		advice: "Write who they are to the practice, not how to reach them.",
		re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
	},
	{
		label: "a Social Security number",
		advice: "A Social Security number must never be written to a file.",
		re: /\b\d{3}-\d{2}-\d{4}\b/g,
	},
	{
		label: "a phone number",
		advice: "Leave the number out; the notebook is not a contact list.",
		re: /(?:\+?1[\s.\-])?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/g,
	},
	{
		label: "a street address",
		advice: "Say the town or the region if it matters, never the street.",
		re: /\b\d{1,6}\s+(?:[A-Z][A-Za-z]*\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Place|Pl|Terrace|Ter|Parkway|Pkwy|Highway|Hwy|Way)\b\.?/g,
	},
	{
		label: "a date of birth",
		advice: "Record an age band if the age matters at all.",
		re: /\b(?:date of birth|d\.?o\.?b\.?|birth ?date|born on)\b/gi,
	},
	{
		// Policy, account, certificate and claim numbers all land here. Money is
		// excluded: a dollar sign or a grouping comma means it is an amount, and
		// amounts are exactly the thing an advisor's notes are for.
		label: "an account or policy number",
		advice: "Refer to it as \"the policy\" or \"the account\" instead.",
		re: /(?<![$\d,.])\b\d{7,}\b(?![\d,.])/g,
	},
];

/**
 * Common given names, lower-cased. Deliberately the common ones only: the list
 * exists to catch "Robert Hartley" in a sentence, not to be a census. A rare
 * name that slips through is caught by the reviewer this file is not -- which is
 * why the notebook skill also tells Fin to write about people by role.
 */
const FIRST_NAMES = new Set<string>(
	`james robert john michael david william richard joseph thomas christopher charles
	 daniel matthew anthony mark donald steven andrew paul joshua kenneth kevin brian
	 george timothy ronald edward jason jeffrey ryan jacob gary nicholas eric jonathan
	 stephen larry justin scott brandon benjamin samuel gregory alexander patrick frank
	 raymond jack dennis jerry tyler aaron jose adam nathan henry douglas zachary peter
	 kyle walter ethan jeremy harold keith christian roger noah gerald carl terry sean
	 austin arthur lawrence jesse dylan bryan joe jordan billy bruce albert willie gabriel
	 logan alan juan wayne roy ralph randy eugene vincent russell elijah louis bobby philip
	 johnny mary patricia jennifer linda elizabeth barbara susan jessica sarah karen nancy
	 lisa margaret betty sandra ashley dorothy kimberly emily donna michelle carol amanda
	 melissa deborah stephanie rebecca sharon laura cynthia amy kathleen angela shirley
	 anna brenda pamela nicole ruth katherine samantha christine emma catherine debra
	 virginia rachel carolyn janet maria heather diane julie joyce victoria kelly christina
	 joan evelyn lauren judith olivia frances martha cheryl megan andrea hannah jacqueline
	 ann jean alice kathryn gloria teresa doris sara janice julia marie madison grace judy
	 theresa beverly denise marilyn amber danielle abigail brittany rose diana natalie sophia
	 alexis lori kayla jane taylor audrey ella claire isabella chloe`
		.split(/\s+/)
		.filter(Boolean),
);

/**
 * A given name followed by a capitalised word. The second word must start with a
 * capital and continue in lower case, which is what keeps "Robert Hartley" in and
 * "Robert AND" or "Robert 401k" out.
 */
const NAME_BIGRAM = /\b([A-Z][a-z]+)\s+([A-Z][a-z]{1,})\b/g;

function findPii(text: string): Finding[] {
	const found: Finding[] = [];
	const seen = new Set<string>();

	for (const { label, advice, re } of PATTERNS) {
		re.lastIndex = 0;
		const m = re.exec(text);
		if (m && !seen.has(label)) {
			seen.add(label);
			found.push({ label, advice, sample: m[0].slice(0, 40) });
		}
	}

	NAME_BIGRAM.lastIndex = 0;
	for (let m = NAME_BIGRAM.exec(text); m; m = NAME_BIGRAM.exec(text)) {
		if (!FIRST_NAMES.has(m[1]!.toLowerCase())) continue;
		if (seen.has("a person's name")) break;
		seen.add("a person's name");
		found.push({
			label: "a person's name",
			advice:
				"Write about people by their role -- \"the client\", \"the carrier rep\" -- " +
				"or by a label like \"Client A\" that means nothing on its own.",
			sample: m[0],
		});
		break;
	}

	return found;
}

/* ------------------------------------------------------------ frontmatter -- */

/**
 * Stamp the header Christopher asked for. Done here rather than asked of Fin,
 * because a stamp the model has to remember is a stamp that is missing from the
 * one file somebody later needs to date. `created` survives a rewrite; `updated`
 * and `written_by` are refreshed every time, so the notebook records which model
 * last touched each page.
 */
function stamp(content: string, path: string, model: string): string {
	const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
	const fields = new Map<string, string>();
	let body = content;

	const fm = content.match(/^---\n([\s\S]*?)\n---\n?/);
	if (fm) {
		for (const line of fm[1]!.split("\n")) {
			const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
			if (kv) fields.set(kv[1]!, kv[2]!.trim());
		}
		body = content.slice(fm[0].length);
	}

	const file = path.split(sep).pop() ?? "note.md";
	const fallbackTitle = file
		.replace(/\.md$/i, "")
		.replace(/^\d{4}-\d{2}-\d{2}-/, "")
		.replace(/[-_]+/g, " ")
		.replace(/^\w/, (c) => c.toUpperCase());

	if (!fields.get("title")) fields.set("title", fallbackTitle);
	if (!fields.get("kind")) fields.set("kind", "note");
	if (!fields.get("created")) fields.set("created", now);
	fields.set("updated", now);
	fields.set("written_by", `Fin using ${model}`);

	// Fixed key order so a diff of two notebook pages is about the content.
	const ORDER = ["title", "kind", "created", "updated", "written_by"];
	const keys = [...ORDER, ...[...fields.keys()].filter((k) => !ORDER.includes(k))];
	const header = keys.map((k) => `${k}: ${fields.get(k)}`).join("\n");

	return `---\n${header}\n---\n\n${body.replace(/^\n+/, "")}`;
}

/* ------------------------------------------------------------- extension -- */

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		const model = ctx.model?.id || ctx.model?.name || "an unknown model";

		// The obvious way around a write-tool gate is a shell redirection, so the
		// same rule is applied to bash before anything else. This is a narrow
		// check on purpose: it catches `> ~/Documents/Fin/Notebook/x.md` and tells
		// Fin to use the write tool, which is where the real guard lives.
		if (event.toolName === "bash") {
			const cmd = String(event.input.command ?? "");
			if (/>>?\s*\S*Documents\/Fin\/Notebook\//.test(cmd)) {
				return {
					block: true,
					reason:
						"Notebook pages are written with the write tool, not with a shell " +
						"redirection, so that they get their timestamp header and their " +
						"privacy check. Use the write tool.",
				};
			}
			return undefined;
		}

		if (event.toolName !== "write" && event.toolName !== "edit") return undefined;

		const raw = String(event.input.path ?? "");
		const target = isAbsolute(raw) ? resolve(raw) : resolve(ctx.cwd, raw);
		if (!insideNotebook(target)) return undefined;

		// The notebook is markdown, all of it. Anything else is not readable by
		// the advisor in the editor they have, which defeats the point of it
		// being their notebook rather than Fin's cache.
		if (!/\.md$/i.test(target)) {
			return {
				block: true,
				reason:
					`The notebook holds markdown only, so "${raw}" cannot go there. ` +
					`Save it as a .md page, or put it in ${DRAFTS_HINT} if it is not a note.`,
			};
		}

		const text =
			event.toolName === "write"
				? String(event.input.content ?? "")
				: String(event.input.new_string ?? "");

		const found = findPii(text);
		if (found.length > 0) {
			const list = found
				.map((f) => `  - ${f.label} ("${f.sample}"). ${f.advice}`)
				.join("\n");
			if (ctx.hasUI) {
				ctx.ui.notify(
					"Fin kept a personal detail out of the notebook",
					"warning",
				);
			}
			return {
				block: true,
				reason:
					"The notebook is kept free of personal details, because it is a " +
					"permanent record that builds up over time. This page was not saved " +
					"because it contains:\n" +
					list +
					`\n\nRewrite the page without those details and save it again. If this ` +
					`is a letter or an email for a named person rather than a note, it ` +
					`belongs in ${DRAFTS_HINT}, where naming them is fine.`,
			};
		}

		// Clean. Stamp it. Only a full write can be stamped: an edit replaces a
		// fragment and the header may not be in the fragment, so the notebook
		// skill tells Fin to rewrite a page rather than patch it.
		if (event.toolName === "write") {
			event.input.content = stamp(text, target, model);
		}

		return undefined;
	});
}
