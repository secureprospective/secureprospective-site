/**
 * SP+ Session Meter — how long this conversation has been going, how full it is,
 * and when to save it.
 *
 * This is Fin's answer to the burn-rate extension on Bee. It is deliberately NOT
 * a port. Bee's version reports tokens per minute, a projected time to a full
 * context window, and a warning when the model is not the expected one. Every
 * one of those is the right readout for Christopher watching a dispatch, and
 * none of them mean anything to an insurance advisor, who has never heard of a
 * token and should not have to.
 *
 * Christopher's rule, 2026-09-11: "our explainations of the skills and
 * extentions and tips should be plain language and well defined."
 *
 * So the same underlying measurement is reported as the two facts an advisor can
 * act on: how long they have been at it, and how close the conversation is to
 * the point where Fin starts forgetting the beginning of it. When that gets
 * close, the meter says what to do about it in words, and what it says matches a
 * skill that exists -- asking Fin to save the session writes the conversation
 * into the notebook, so stopping costs nothing.
 *
 * WHY A WARNING AT ALL. A conversation that quietly runs out of room is the
 * worst failure this product has, because it does not look like a failure. Fin
 * simply starts being vague about something the advisor explained an hour ago,
 * and the advisor concludes it is not very good. A number on the screen that
 * goes amber is a cheap way to make an invisible limit visible.
 *
 * Everything here is wrapped. A fault in a status readout must never take down
 * the conversation it is reporting on.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

/** The key pi-statusline uses to place this in the footer. */
const STATUS_KEY = "session";

/** Percentages at which the wording changes. Chosen so the first nudge arrives
 *  with plenty of room left to act on it, rather than as an emergency. */
const GETTING_FULL = 70;
const NEARLY_FULL = 88;

const started = Date.now();

function minutesSoFar(): number {
	return (Date.now() - started) / 60000;
}

function fmtElapsed(mins: number): string {
	if (!Number.isFinite(mins) || mins < 1) return "just started";
	if (mins < 60) return `${Math.round(mins)} min`;
	const h = Math.floor(mins / 60);
	const m = Math.round(mins % 60);
	return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/**
 * Percentage of the conversation's room that is used.
 *
 * Read from pi's own context accounting rather than recomputed from token
 * counts: pi already knows, the field names differ between providers, and a
 * second implementation of the same number is a second thing to be wrong.
 */
function percentUsed(ctx: ExtensionContext): number | null {
	try {
		const usage = ctx.getContextUsage?.();
		const pct = (usage as { percent?: number } | undefined)?.percent;
		return typeof pct === "number" && Number.isFinite(pct)
			? Math.max(0, Math.min(100, pct))
			: null;
	} catch {
		return null;
	}
}

function render(ctx: ExtensionContext): string {
	const parts: string[] = [fmtElapsed(minutesSoFar())];
	const pct = percentUsed(ctx);

	if (pct === null) return parts.join(" · ");

	parts.push(`${Math.round(pct)}% full`);

	// The advice is the whole point of the readout. "88% full" on its own is a
	// number an advisor can do nothing with.
	if (pct >= NEARLY_FULL) {
		parts.push("ask me to save this session");
	} else if (pct >= GETTING_FULL) {
		parts.push("good point to save");
	}

	return parts.join(" · ");
}

function update(ctx: ExtensionContext): void {
	try {
		if (!ctx?.hasUI || typeof ctx.ui?.setStatus !== "function") return;
		ctx.ui.setStatus(STATUS_KEY, render(ctx));
	} catch {
		/* a missing readout is a nuisance; a thrown one ends the conversation */
	}
}

export default function sessionMeter(pi: ExtensionAPI): void {
	pi.on("session_start", (_e, ctx) => update(ctx));
	pi.on("turn_end", (_e, ctx) => update(ctx));

	// After a compaction the conversation genuinely has room again, and the
	// readout has to say so or the advice above becomes noise that gets ignored
	// exactly when it starts mattering.
	pi.on("session_compact", (_e, ctx) => update(ctx));

	pi.on("model_select", (_e, ctx) => update(ctx));
}
