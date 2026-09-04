/**
 * SP+ Guardrails — the mechanical boundary in front of Fin's bash tool.
 *
 * Fin runs AS the advisor, who is in `wheel`, which carries
 * `%wheel ALL=(ALL) NOPASSWD: ALL`. Fin therefore holds unprompted root. That is
 * deliberate and is argued in `sudoers-sp-plus`: a password prompt the advisor
 * cannot answer buys no security and stops every genuine repair.
 *
 * This file is the consequence of that grant. DN-31 decision 7: a system prompt
 * is not a guardrail. Instructional text telling a model not to do something is
 * a request it can be argued around, and it fails silently on the one occasion
 * it matters. The boundary has to sit in the tool path.
 *
 * ADAPTED FROM Bee's permission-gate.ts, WITH ONE DELIBERATE INVERSION.
 * Bee blocks `sudo` outright. Fin MUST NOT. Fixing a printer, reading a service
 * log, installing a font and repairing a mount are all sudo, and they are Fin's
 * entire job. Blocking sudo here would leave the advisor with an assistant that
 * can diagnose everything and repair nothing, which is the failure this product
 * exists to remove. So privilege is not what we gate. Irreversibility is.
 *
 * WHAT THIS GATES, and the rule behind the list:
 *   1. Anything that destroys the advisor's own files. DN-31 decision 5,
 *      verified on a live guest: `bootc rollback` restores `/usr` and the
 *      deployment, and restores NOTHING under `/var` or `/home`. The advisor's
 *      documents have no undo. The image does.
 *   2. Anything that weakens the machine's own protection. Standing project
 *      rule: never weaken SELinux or the firewall.
 *   3. Anything that sends mail. DN-31 decision 10: Fin composes, the advisor
 *      sends. An advisor's regulatory exposure sits on what leaves the account.
 *   4. Anything that destroys the ability to boot or to decrypt the disk.
 *
 * FAILS CLOSED. With no UI there is nobody present to approve, so a match is
 * blocked outright rather than waved through.
 *
 * SCOPE LIMIT, stated so nobody mistakes this for a sandbox: this covers the
 * `bash` tool. `spplus-workspace.ts` covers the write and edit tools.
 * Neither is a substitute for a sandbox, and a sufficiently creative command
 * will get past both. This raises the floor; it does not close the room.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface Rule {
	/** Plain-English, advisor-readable. It is shown to a non-technical person. */
	label: string;
	pattern: RegExp;
}

export default function (pi: ExtensionAPI) {
	const rules: Rule[] = [
		// --- 1. The advisor's own files, which no rollback can bring back ---
		{ label: "deletes a folder and everything inside it", pattern: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive)/i },
		{ label: "permanently shreds a file", pattern: /\bshred\b/i },
		{ label: "empties a file completely", pattern: /\btruncate\b[^\n]*-s\s*0\b/i },
		{ label: "deletes files it finds while searching", pattern: /\bfind\b[^\n]*(-delete\b|-exec\s+rm\b)/i },
		{ label: "erases a whole disk or partition", pattern: /\b(mkfs(\.\w+)?|wipefs|sgdisk|parted|fdisk)\b/i },
		{ label: "writes directly over a disk", pattern: /\bdd\b[^\n]*\bof=\s*\/dev\//i },

		// --- 2. The machine's own protection ---
		// SELinux and the firewall are not tuning knobs. Turning either off to
		// make something work is the documented wrong answer in this project.
		{ label: "turns off SELinux protection", pattern: /\bsetenforce\s+0\b|\bselinux\s*=\s*0\b|SELINUX\s*=\s*(disabled|permissive)/i },
		{ label: "turns off the firewall", pattern: /\bsystemctl\b[^\n]*\b(stop|disable|mask)\b[^\n]*\bfirewalld\b|\bfirewall-cmd\b[^\n]*(--set-default-zone\s*=\s*trusted|--zone\s*=\s*trusted)/i },
		{ label: "makes files readable by everyone on the machine", pattern: /\b(chmod|chown)\b[^\n]*777/i },
		{ label: "changes permissions on a whole folder tree", pattern: /\b(chmod|chown)\b[^\n]*(\s-R\b|--recursive)/i },
		{ label: "runs a script downloaded from the internet", pattern: /\b(curl|wget)\b[^\n]*\|\s*(sudo\s+)?(ba|z|k)?sh\b/i },

		// --- 3. Outgoing mail. Fin drafts; the advisor sends. DN-31 decision 10 ---
		{ label: "sends an email", pattern: /\b(msmtp|sendmail|swaks|mutt|mailx)\b/i },
		{ label: "sends an email", pattern: /(^|[\s;&|(])mail\s+/i },
		{ label: "sends an email", pattern: /\bthunderbird\b[^\n]*(-compose|--compose)/i },

		// --- 3b. Fin updates with SP+, never from a registry. 2026-09-04 ---
		// Asked to update itself, the obvious move is `npm install -g`. Here /usr is
		// read-only so that fails -- and the natural retry, the same install with a
		// writable prefix, SUCCEEDS and is worse. /usr/local shadows the pinned agent
		// on PATH while `fin` still execs /usr/bin/pi, so the advisor is told the
		// update worked while Fin goes on running the old build. That is exactly what
		// happened on the test VM on 2026-09-04, nine seconds between the two
		// attempts, leaving 156 MB in /var on a disk that was already 95% full.
		{ label: "installs a second copy of Fin outside the system update", pattern: /\b(npm|pnpm|yarn)\b[^\n]*\b(install|add|up|update|upgrade|i)\b[^\n]*pi-coding-agent/i },
		{ label: "installs software into the system folders from the internet", pattern: /\b(npm|pnpm|yarn)\b[^\n]*\b(install|add|i)\b[^\n]*(--prefix[=\s]*\/usr\b|--prefix[=\s]*\/usr\/local\b|(^|\s)-g(\s|$)|--global\b)/i },

		// --- 4. Booting, and getting back into an encrypted disk ---
		// Losing a LUKS keyslot on a machine whose owner cannot recite the
		// passphrase is unrecoverable, and the data is client records.
		{ label: "changes the disk encryption keys", pattern: /\bcryptsetup\b[^\n]*\b(luksErase|luksKillSlot|luksFormat|luksRemoveKey|erase)\b/i },
		{ label: "removes an installed system version", pattern: /\bostree\b[^\n]*\badmin\b[^\n]*\bundeploy\b|\brpm-ostree\b[^\n]*\bcleanup\b[^\n]*-\w*[rp]/i },
		{ label: "reinstalls the boot loader", pattern: /\b(grub2-install|bootctl\s+install|efibootmgr\b[^\n]*-B)\b/i },
		{ label: "removes a user account", pattern: /\buserdel\b|\bpasswd\b[^\n]*\s-d\b/i },

		// --- Process control. `pkill -F` reads a pidfile and is the safe form ---
		{ label: "stops programs by matching their name", pattern: /\bpkill\b(?![^\n]*\s-F\b)/ },
		{ label: "stops programs by matching their name", pattern: /\bkillall\b/i },

		// --- Credential and client-data stores, written from bash ---
		// Matching a WRITE verb together with a protected path keeps reads
		// working. Fin must still be able to look at these to diagnose; it is
		// rewriting them unasked that ends badly.
		{
			label: "changes a saved password, key or mail store",
			pattern: /(>{1,2}|\btee\b|\bdd\b|\bcp\b|\bmv\b|\brm\b|\bln\b|\bchmod\b|\bchown\b)[^\n]*(\/etc\/sp-plus\/|\.ssh\/|\.thunderbird|\.mozilla|kwalletd|\.kdbx|fin\.env|shadow\b)/i,
		},
	];

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return undefined;

		const command = event.input.command as string;
		const matched = rules.find((rule) => rule.pattern.test(command));
		if (!matched) return undefined;

		// Written for the advisor, not for a developer. They are being asked to
		// authorise something they did not type and may not recognise, so the
		// question says what it does in their language and shows the command.
		const reason = `This step ${matched.label}`;

		if (!ctx.hasUI) {
			return { block: true, reason: `${reason}. Blocked: nobody is here to approve it.` };
		}

		const choice = await ctx.ui.select(
			`⚠️  ${reason}, which cannot be undone.\n\n  ${command}\n\nAllow it?`,
			["No", "Yes"],
		);

		if (choice !== "Yes") {
			return { block: true, reason: `${reason}; the advisor declined.` };
		}

		return undefined;
	});
}
