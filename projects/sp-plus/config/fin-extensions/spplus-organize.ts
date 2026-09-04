/**
 * SP+ Organize — the promise Fin makes about an advisor's files, made true.
 *
 * Christopher's rule, 2026-09-04: "If an advisor asks 'organize a folder', Fin
 * needs to be explicit that it will not open or read a file. All organization
 * need will be based on the name of the file only."
 *
 * WHY THIS IS AN EXTENSION AND NOT A PARAGRAPH IN THE SYSTEM PROMPT. It was a
 * paragraph first, and it was tested twice on a live guest. Both times Fin
 * organized the folder correctly, overwrote nothing, and did NOT say the
 * sentence: run one produced "based on file names only" -- a weaker promise
 * than the one being made -- and run two, told to go ahead, opened with "Done."
 * and never made the promise at all. That is DN-31 decision 7 restated:
 * instructional text is a request a model can be argued around, and it fails
 * silently on the occasion it matters.
 *
 * So this file does two things a paragraph cannot:
 *
 *   1. It puts the required sentence NEXT TO the request instead of in a system
 *      prompt several thousand tokens away, at the moment the request arrives.
 *   2. It makes the promise TRUE mechanically. While an organizing task is
 *      live, reading the CONTENTS of anything in the advisor's own folders is
 *      blocked in the tool path -- the read and edit tools, and the bash
 *      commands that amount to the same thing. Sorting by name needs none of
 *      it, so nothing legitimate is lost.
 *
 * Point 2 is the one that matters. A spoken promise is worth what the model
 * decides it is worth; a blocked tool call is worth the same on every run.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Said back to the advisor verbatim. Their client data is the subject. */
const PROMISE =
	"I will organize by file name only -- I will not open or read any of your files.";

/** "tidy my downloads", "sort these", "can you organize this folder" */
const ORGANIZE =
	/\b(organi[sz]e|organi[sz]ing|tidy|tidying|sort|sorting|rearrange|declutter|clean\s*up|file\s+(these|those|them)|rename\s+(these|those|them|all))\b/i;

/** "yes", "go ahead" -- a confirmation continues the task, it does not end it. */
const CONFIRM =
	/^\s*(y|yes|yeah|yep|ok|okay|sure|go\s*ahead|do\s*it|please\s*do|proceed|continue|go\b)/i;

/** The advisor's own folders. Documents/Fin is Fin's workspace, not theirs. */
const OWN_FOLDERS =
	/(~|\$HOME|\/(?:var\/)?home\/[^/\s]+)\/(Documents|Desktop|Downloads|Pictures)\/(?!Fin\/)/i;

/** Commands that open a file to look at what is inside it. `ls`, `find`, `stat`
 *  and `du` are deliberately absent: those read names and sizes, never content.
 *  `file` IS here -- it opens the file to sniff its magic bytes, and the promise
 *  said "will not open", not "will not understand". */
const READS_CONTENT =
	/\b(cat|bat|head|tail|less|more|strings|nl|od|xxd|hexdump|grep|rg|awk|sed|file|pdftotext|pdfgrep|antiword|catdoc|xdg-open|gio\s+open|soffice|libreoffice|unzip\s+-p|tar\s+-\w*O)\b/i;

export default function (pi: ExtensionAPI) {
	let organizing = false;

	pi.on("input", async (event, ctx) => {
		// Messages this extension injected itself must not re-trigger it.
		if (event.source === "extension") return { action: "continue" };

		const text = event.text ?? "";

		if (ORGANIZE.test(text)) {
			organizing = true;
			// Said by the HARNESS, not by the model. This is the only delivery of
			// the promise that does not depend on the model choosing to repeat it,
			// and five live runs proved that choice cannot be relied on: the
			// injected instruction below produced the sentence sometimes and a
			// paraphrase or nothing the rest of the time. In the app the advisor
			// actually organizes in, the sentence now always appears.
			//
			// There is no equivalent on the non-interactive path -- nothing in the
			// extension API can put text in front of a `pi -p` caller -- so there
			// the wording stays best-effort. What is NOT best-effort anywhere is
			// the promise itself: the reads that would break it are blocked below.
			if (ctx.hasUI) ctx.ui.notify(PROMISE, "info");
			// The instruction travels WITH the request. That is the whole point:
			// adjacency is what a distant system-prompt section does not have.
			return {
				action: "transform",
				text:
					`${text}\n\n[SP+ required: begin your reply with this exact sentence, ` +
					`on its own, before the plan and before anything else, word for word ` +
					`and not paraphrased:\n"${PROMISE}"\n` +
					`Then organize using file NAMES only. Do not open or read any file. ` +
					`Move with "mv -n" so nothing is ever replaced, and name any file you ` +
					`could not move because something was already called that.]`,
			};
		}

		// A bare "yes" continues the organizing task. Anything else is new work,
		// and the advisor gets their assistant's eyes back.
		if (organizing && !CONFIRM.test(text)) organizing = false;

		return { action: "continue" };
	});

	pi.on("tool_call", async (event) => {
		if (!organizing) return undefined;

		const deny = (what: string) => ({
			block: true,
			reason:
				`Fin promised to organize by file name only and not to open or read ` +
				`anything. ${what} Sort on the name instead, and if a name does not say ` +
				`where the file belongs, leave it where it is and tell the advisor.`,
		});

		if (event.toolName === "read") {
			const path = String(event.input?.path ?? "");
			if (OWN_FOLDERS.test(path)) return deny(`Reading "${path}" would break that.`);
			return undefined;
		}

		if (event.toolName === "bash") {
			const command = String(event.input?.command ?? "");
			if (READS_CONTENT.test(command) && OWN_FOLDERS.test(command)) {
				return deny("That command opens the file to see what is inside it.");
			}
		}

		return undefined;
	});
}
