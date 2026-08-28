/**
 * SP+ Workspace Confinement — Fin writes in exactly one place.
 *
 * Christopher's rule, 2026-08-28: "restrict all write privileges to a Fin
 * directory under Documents. This will give the power of a harness to an advisor
 * but the safety knowing that they cant just ask for a 1 off application to be
 * written into a .env directory or something crazy."
 *
 * REPLACES the earlier denylist (spplus-protected-paths.ts), and the inversion is
 * the point. A denylist enumerates the sensitive places somebody thought of, so
 * it is wrong the moment an application stores something somewhere new. This
 * permits one directory and refuses everything else, which is wrong only in the
 * safe direction.
 *
 * WRITES ONLY. Reads are untouched: Fin cannot diagnose a broken mail profile it
 * is forbidden to look at. Whether a document's CONTENTS may be sent to a cloud
 * provider is a different control (DN-31 decisions 6-9) and is not implemented
 * here. Do not mistake this file for that one.
 *
 * WHY THIS IS STILL ONLY A FLOOR. This gates the write and edit TOOLS. The real
 * enforcement arrives with DN-31 amendment A1: once Fin runs as its own
 * unprivileged identity, the kernel refuses these writes on ordinary filesystem
 * permissions and no extension has to be trusted or even loaded. This file is
 * what protects the advisor until that lands, and a cheap second layer after.
 */

import { homedir } from "node:os";
import { isAbsolute, resolve, sep } from "node:path";
import { realpathSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Everything Fin writes lives here. Visible to the advisor, backed up with
 *  their documents, and obvious in a file manager -- not hidden in a dotfile. */
const WORKSPACE = resolve(homedir(), "Documents", "Fin");

/**
 * Resolve a path for containment testing WITHOUT trusting it.
 *
 * Lexical resolution alone is not enough: a symlink inside the workspace can
 * point anywhere, and `realpath` on a file that does not exist yet throws. So
 * resolve lexically, then canonicalise the nearest ancestor that DOES exist and
 * re-attach the remainder. That catches a symlinked parent directory, which is
 * the realistic escape.
 */
function canonical(target: string): string {
	let head = target;
	const tail: string[] = [];
	for (;;) {
		try {
			return resolve(realpathSync(head), ...tail);
		} catch {
			const parent = resolve(head, "..");
			if (parent === head) return target; // reached the root; nothing existed
			tail.unshift(head.slice(parent.length + 1));
			head = parent;
		}
	}
}

function insideWorkspace(target: string): boolean {
	const real = canonical(target);
	const root = canonical(WORKSPACE);
	return real === root || real.startsWith(root + sep);
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") {
			return undefined;
		}

		const raw = event.input.path as string;
		const target = isAbsolute(raw) ? resolve(raw) : resolve(ctx.cwd, raw);
		if (insideWorkspace(target)) return undefined;

		if (ctx.hasUI) {
			ctx.ui.notify(`Fin can only save files in Documents/Fin`, "warning");
		}
		// Says where Fin CAN write, so the model retries correctly instead of
		// hunting for another way in, and so the advisor learns the rule once.
		return {
			block: true,
			reason: `Fin saves everything in Documents/Fin and may not write to "${raw}". Put the file in Documents/Fin instead.`,
		};
	});
}
