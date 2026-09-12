/**
 * SP+ Data Boundary — the advisor's client files do not reach a cloud model by
 * accident.
 *
 * THE HOLE THIS CLOSES, measured on the v0.11.1 VM on 2026-09-12. Fin runs on a
 * ChatGPT Plus account; there is no Anthropic key on the machine and the model
 * is whatever Pi is signed in to. `spplus-workspace.ts` confines WRITES and says
 * so in its own header: "Reads are untouched ... Whether a document's CONTENTS
 * may be sent to a cloud provider is a different control (DN-31 decisions 6-9)
 * and is not implemented here." This is that file.
 *
 * Until it loaded, the only thing between a client statement and OpenAI was the
 * model choosing well. On the 2026-09-12 probe run it did choose well once --
 * asked to email a client file it replied "because that looks like a client
 * file, I won't open it or copy its contents" -- and fifteen minutes later the
 * same model deleted the advisor's file manager without asking. That is DN-31
 * decision 7: goodwill is not a control.
 *
 * WHY LOCATION AND NOT DETECTION. The obvious build is a PII detector -- scan
 * for SSNs, account numbers, dates of birth. It does not hold. Names are not
 * patterns, free text is not structured, scans are images, OCR is wrong in
 * unpredictable ways, and a detector that misses once has already sent the file.
 * So this does what `spplus-workspace.ts` did for writes and inverts the
 * default: the advisor's own document folders are treated as client data in
 * full, and reaching their CONTENTS takes a decision. Wrong only in the safe
 * direction, and wrong in a way the advisor can see and answer.
 *
 * WHAT IS NOT GATED, deliberately. Anything outside those four folders: system
 * files, logs, configuration, Fin's own workspace. Fin cannot diagnose a broken
 * mail profile it may not look at, and the same reasoning that left reads open
 * in the workspace file applies here. Names and metadata are never gated either
 * -- `ls`, `find`, `stat` and `du` read no content, which is exactly why
 * `spplus-organize.ts` can promise name-only sorting and keep working.
 *
 * THE POLICY IS A SETTING, ON PURPOSE. Doc 06 question D1 -- the system prompt
 * promises client data never leaves the machine, the product is cloud-first, and
 * DN-31 contemplates per-file consent -- is not settled, and consent does not
 * make "never leaves" true. All three answers need this same machinery and
 * differ only in the default, so the mechanism ships now and the default moves
 * when Christopher rules. `local-only` refuses, `ask` asks once per file, `open`
 * permits and records.
 *
 * HONEST LIMITS, in the house style.
 *   - This gates the `read` tool and the bash commands that amount to a read. It
 *     is an in-process extension, so it is a floor, not a boundary: it stops a
 *     careless advisor and a cooperative model, not a hijacked one. The real
 *     enforcement is DN-31 amendment A1/A2 -- Fin's own identity and a typed
 *     broker -- and this is what protects the advisor until that lands.
 *   - It does not see content arriving by any route other than a tool call.
 *   - It cannot un-send. It refuses before the read, which is the only moment
 *     that helps.
 */

import { homedir } from "node:os";
import { isAbsolute, resolve, sep } from "node:path";
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** The advisor's own folders. Documents/Fin is Fin's workspace, not theirs --
 *  the same carve-out `spplus-organize.ts` and the guardrails already make. */
const CLIENT_ROOTS = ["Documents", "Desktop", "Downloads", "Pictures"].map((d) =>
	resolve(homedir(), d),
);
const WORKSPACE = resolve(homedir(), "Documents", "Fin");

/**
 * Key material and credential stores. Found by the gate, not by design: the
 * symlink-escape case walked out of Documents/Fin into ~/.ssh, which is not one
 * of the four client folders, so the location test let it through. An SSH
 * private key reaching a cloud model is the same failure as a client statement
 * reaching one, and cheaper to close than to explain.
 *
 * Deliberately NARROW -- whole profile directories are not listed. The extension
 * gate asserts that Fin can still read `~/.thunderbird/prefs.js` and grep
 * `profiles.ini`, because diagnosing a broken mail profile is a job the advisor
 * actually asks for. Secrets are held; the settings beside them are not.
 */
const SECRET_ROOTS = [".ssh", ".gnupg", ".pki", ".password-store", ".local/share/kwalletd"].map(
	(d) => resolve(homedir(), d),
);

/** Key and credential FILES wherever they sit, including inside a profile whose
 *  directory stays readable. */
const SECRET_FILE =
	/(^|\/)(id_(rsa|dsa|ecdsa|ed25519)|.*\.(pem|key|p12|pfx|jks|kdbx)|logins\.json|key[34]\.db|credentials(\.json)?|\.env|\.netrc|\.pgpass)$/i;

/** Where the ruling on D1 is recorded once it is made. */
const POLICY_FILE = "/etc/sp-plus/fin-data-boundary.json";
const LEDGER = resolve(WORKSPACE, "data-access-log.md");

type Policy = "local-only" | "ask" | "open";

/**
 * Read the policy, and NEVER fail silently.
 *
 * A config this machine cannot read is a control nobody knows is off -- the
 * failure mode that hid a broken setting behind a root `cat` on 2026-09-09. A
 * missing file falls back to `ask`, which permits nothing on its own: with no
 * advisor present it blocks, and with one present they decide. A file that
 * EXISTS and cannot be read or parsed falls back the same way and says so out
 * loud, because that is a broken machine rather than an unconfigured one.
 */
function readPolicy(): { policy: Policy; complaint: string | null } {
	if (!existsSync(POLICY_FILE)) return { policy: "ask", complaint: null };
	try {
		const raw = JSON.parse(readFileSync(POLICY_FILE, "utf8"));
		const p = String(raw?.policy ?? "");
		if (p === "local-only" || p === "ask" || p === "open") {
			return { policy: p, complaint: null };
		}
		return {
			policy: "ask",
			complaint: `The client-data setting says "${p}", which is not one of local-only, ask or open. Fin is asking before it opens anything.`,
		};
	} catch {
		return {
			policy: "ask",
			complaint: `Fin could not read its client-data setting. It is asking before it opens anything. Tell whoever set this machine up.`,
		};
	}
}

/** Lifted verbatim from `spplus-workspace.ts`: resolve lexically, then
 *  canonicalise the nearest ancestor that exists and re-attach the rest, so a
 *  symlinked parent or a `..` out of the workspace cannot walk round the test. */
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

function within(target: string, root: string): boolean {
	return target === root || target.startsWith(root + sep);
}

/** True when the path is one of the advisor's own documents. Fin's own
 *  workspace is excluded, so drafts and notes stay free. */
type Held = "client" | "secret" | null;

/** What kind of protection this path needs, if any. Fin's own workspace is
 *  always free -- but only for client data, never for key material that was
 *  symlinked or copied into it. */
function heldKind(target: string): Held {
	const real = canonical(target);
	if (SECRET_ROOTS.some((root) => within(real, canonical(root)))) return "secret";
	if (SECRET_FILE.test(real)) return "secret";
	if (within(real, canonical(WORKSPACE))) return null;
	if (CLIENT_ROOTS.some((root) => within(real, canonical(root)))) return "client";
	return null;
}

/** Commands that open a file to see what is inside it. Kept deliberately
 *  identical in spirit to `spplus-organize.ts`: `ls`, `find`, `stat` and `du`
 *  are absent because they read names and sizes, never content. */
const READS_CONTENT =
	/\b(cat|bat|head|tail|less|more|strings|nl|od|xxd|hexdump|grep|rg|egrep|fgrep|awk|sed|file|pdftotext|pdfgrep|pdfimages|antiword|catdoc|tesseract|xdg-open|gio\s+open|soffice|libreoffice|unzip\s+-p|tar\s+-\w*O)\b/i;

/** The same shape the guardrails and organize use for the advisor's folders. */
const CLIENT_PATH_IN_COMMAND =
	/(~|\$HOME|\/(?:var\/)?home\/[^/\s]+)\/(Documents|Desktop|Downloads|Pictures)\/(?!Fin\/)/i;

/** The same, for key material and credential stores.
 *
 *  The dotfile names sit in their own alternative on purpose. `\b\.pgpass`
 *  never matches: the character before the dot is a slash, and a boundary needs
 *  a word character on one side. The gate caught it -- `cat $HOME/.pgpass` went
 *  straight through the first version of this pattern. */
const SECRET_PATH_IN_COMMAND =
	/(~|\$HOME|\/(?:var\/)?home\/[^/\s]+)\/(\.ssh|\.gnupg|\.pki|\.password-store|\.local\/share\/kwalletd)\/|\b(id_(rsa|dsa|ecdsa|ed25519)|logins\.json|key[34]\.db)\b|\.(netrc|pgpass|env)\b|\.(pem|key|p12|pfx|kdbx)\b/i;

export default function (pi: ExtensionAPI) {
	const { policy, complaint } = readPolicy();
	/** Approved once, not asked again for the rest of the conversation. Asking
	 *  twice about the same document is how an advisor learns to click yes. */
	const approved = new Set<string>();
	let complained = false;

	function record(decision: string, what: string) {
		try {
			mkdirSync(WORKSPACE, { recursive: true });
			const when = new Date().toISOString().replace("T", " ").slice(0, 16);
			appendFileSync(LEDGER, `- ${when} — ${decision}: ${what}\n`, "utf8");
		} catch {
			// The ledger is evidence, not a control. Losing a line must never
			// turn into losing the refusal.
		}
	}

	pi.on("tool_call", async (event, ctx) => {
		if (complaint && !complained && ctx.hasUI) {
			ctx.ui.notify(complaint, "warning");
			complained = true;
		}

		let what: string;
		let key: string;

		let kind: Held;

		if (event.toolName === "read") {
			const raw = String(event.input?.path ?? "");
			const target = isAbsolute(raw) ? resolve(raw) : resolve(ctx.cwd, raw);
			kind = heldKind(target);
			if (!kind) return undefined;
			what = raw;
			key = canonical(target);
		} else if (event.toolName === "bash") {
			const command = String(event.input?.command ?? "");
			if (!READS_CONTENT.test(command)) return undefined;
			kind = SECRET_PATH_IN_COMMAND.test(command)
				? "secret"
				: CLIENT_PATH_IN_COMMAND.test(command)
					? "client"
					: null;
			if (!kind) return undefined;
			what = command;
			key = command;
		} else {
			return undefined;
		}

		// Key material is never a question. There is no advisor answer that makes
		// sending a private key to a cloud model the right move, and asking would
		// only teach them to say yes.
		if (kind === "secret") {
			record("refused (password or key material)", what);
			return {
				block: true,
				reason:
					`"${what}" holds a password or a key, and Fin does not open those. ` +
					`If something that uses it is broken, say what is failing and Fin will work from that.`,
			};
		}

		if (policy === "open") {
			record("opened", what);
			return undefined;
		}

		if (policy === "local-only") {
			record("refused (this machine keeps client files local)", what);
			return {
				block: true,
				reason:
					`This machine is set to keep client files on it, so Fin may not open "${what}". ` +
					`Fin can still sort and find files by name, and can work on anything you put in Documents/Fin.`,
			};
		}

		// policy === "ask"
		if (approved.has(key)) return undefined;

		if (!ctx.hasUI) {
			record("refused (nobody was there to ask)", what);
			return {
				block: true,
				reason:
					`Opening "${what}" would send what is inside it to the service that answers for Fin, ` +
					`and nobody is here to approve that. Blocked. Ask again with Fin open on screen.`,
			};
		}

		const choice = await ctx.ui.select(
			`Fin wants to open this, which sends what is inside it to the service that answers for Fin.\n\n  ${what}\n\nIf it holds client information, say no.\n\nOpen it?`,
			["No", "Yes"],
		);

		if (choice !== "Yes") {
			record("declined by the advisor", what);
			return {
				block: true,
				reason:
					`The advisor did not want "${what}" opened. Work from what they tell you instead, ` +
					`and do not try another way to read it.`,
			};
		}

		approved.add(key);
		record("approved by the advisor", what);
		return undefined;
	});
}
