/**
 * SP+ Protected Paths — the write and edit boundary in front of Fin.
 *
 * Sibling to `spplus-guardrails.ts`, which covers the `bash` tool. This one
 * covers the `write` and `edit` tools, which bash rules never see.
 *
 * ADAPTED FROM Bee's protected-paths.ts. The mechanism is Bee's; the list is
 * not. Bee protects a developer's service-backed directories. This protects an
 * advisory practice's client records and credentials, which is a different set
 * with a different reason behind it.
 *
 * WHY THESE PATHS. DN-31 records that a file-type denylist is the wrong shape:
 * the most sensitive stores on an advisor's machine do not look like documents.
 * The mail store has no document extension. Neither does a password database, a
 * browser profile, or a saved share credential. So this list is built from the
 * sensitive stores outward rather than from document extensions inward.
 *
 * READS ARE NOT BLOCKED HERE, deliberately. Fin cannot diagnose a broken mail
 * profile it is forbidden to look at. What is gated is Fin REWRITING these
 * unasked. The separate question of whether their CONTENTS may be sent to a
 * cloud provider is DN-31 decisions 6 through 9 and is NOT implemented here.
 * Do not mistake this file for that control.
 */

import { homedir } from "node:os";
import { basename, isAbsolute, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	const home = homedir();
	const inHome = (relative: string) => resolve(home, relative);

	// Directories holding client records, credentials, or live service state.
	const protectedDirs = [
		// Client correspondence. DN-31 decision 6 treats mail as protected content.
		inHome(".thunderbird"),
		// Browser profiles carry saved logins, session cookies and history.
		inHome(".mozilla"),
		inHome(".config/BraveSoftware"),
		// Saved passwords.
		inHome(".local/share/keepassxc"),
		inHome(".local/share/kwalletd"),
		inHome(".config/kwalletrc"),
		// Keys.
		inHome(".ssh"),
		inHome(".gnupg"),
		// Fin's own provider credential. Never in the image; written per machine.
		inHome(".config/sp-plus"),
		// Network share credentials, stored cleartext and root-owned per DN-26.
		"/etc/sp-plus",
	];

	// Individual files that must never be rewritten by the assistant.
	const protectedFiles = [
		"/etc/sudoers",
		"/etc/shadow",
		"/etc/gshadow",
		"/etc/crypttab",
		"/etc/fstab",
	];

	// Basenames protected wherever on the machine they appear. A password
	// database or an environment file is sensitive by what it is, not by where
	// the advisor happened to save it.
	const protectedNames = [/^\.env(\..+)?$/i, /\.kdbx$/i, /^fin\.env$/i, /\.cred$/i];

	// Path segments protected wherever they appear.
	const protectedSegments = [`${sep}.git${sep}`, `${sep}node_modules${sep}`, `${sep}sudoers.d${sep}`];

	const violation = (target: string): string | null => {
		for (const file of protectedFiles) {
			if (target === file) return "a system file the machine depends on to start";
		}
		for (const dir of protectedDirs) {
			if (target === dir || target.startsWith(dir + sep)) return `inside ${dir}, which holds saved logins or client records`;
		}
		if (protectedNames.some((re) => re.test(basename(target)))) return "a stored password or key file";
		if (protectedSegments.some((segment) => `${target}${sep}`.includes(segment))) return "inside a managed directory";
		return null;
	};

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") {
			return undefined;
		}

		const raw = event.input.path as string;
		const target = isAbsolute(raw) ? resolve(raw) : resolve(ctx.cwd, raw);
		const why = violation(target);
		if (!why) return undefined;

		if (ctx.hasUI) {
			ctx.ui.notify(`Fin was stopped from changing ${raw}`, "warning");
		}
		return { block: true, reason: `"${raw}" is ${why}, so Fin will not rewrite it` };
	});
}
