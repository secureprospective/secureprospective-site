/**
 * Answer composers.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.5 ("compose an answer"), §2 ("Workers
 *   AI + AI Gateway, no LangChain"), §3 ("Existing chatbot" row — agent must be
 *   proven independently before ask.ts refactors onto it).
 *
 * Two implementations ship:
 *
 *   - `TemplatedComposer` — deterministic, no LLM. Forwards tool result text with
 *     a business-voice intro. Used as the working default and the test path.
 *     Mirrors the spirit of `ask.ts`'s "no context → deterministic refusal" gate
 *     (lines 16, 93-95 of that file).
 *
 *   - `WorkersAiComposer` — real implementation, wraps a Workers AI text-generation
 *     call using the same REST pattern `ask.ts` already proves in production
 *     (lines 99-115 of that file). Real wiring is CT105's job (binding + model
 *     selection + AI Gateway routing per §2). The class shape is here so the
 *     contract is unambiguous.
 */

import type { BusinessConfig } from "../catalog/types";
import type { McpToolResult } from "../mcp/types";
import type { AnswerComposer } from "./types";

/**
 * Extract concatenated text content from a tool result, skipping errors.
 */
function extractText(results: McpToolResult[]): string[] {
  const out: string[] = [];
  for (const r of results) {
    if (r.isError) continue;
    for (const c of r.content) {
      if (c.type === "text" && c.text.trim().length > 0) {
        out.push(c.text.trim());
      }
    }
  }
  return out;
}

/**
 * Deterministic, LLM-free composer. Forwards tool result text framed by a
 * business-voice intro. Used as the default and the test path.
 *
 * Not a substitute for an LLM in production — it doesn't synthesize, rephrase,
 * or apply brand voice beyond a generic intro. But it IS a working answer
 * when no LLM binding is available, and it satisfies the §8 requirement that
 * the P0 slice produce a real answer end-to-end on fake data.
 */
export class TemplatedComposer implements AnswerComposer {
  async compose(
    question: string,
    toolResults: McpToolResult[],
    business: BusinessConfig,
  ): Promise<string> {
    const texts = extractText(toolResults);
    if (texts.length === 0) {
      // Mirrors ask.ts's REFUSAL constant — deterministic refusal when no context.
      return `I don't have information about that for ${business.name}.`;
    }
    const intro = `Based on what's available for ${business.name}:`;
    return `${intro}\n\n${texts.join("\n\n")}`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Workers AI composer — real impl shape (CT105 wires the binding)
// ─────────────────────────────────────────────────────────────────────

/**
 * REST-backed composer calling Cloudflare Workers AI.
 *
 * Mirrors the proven call shape from `functions/api/ask.ts` (lines 99-115) — same
 * endpoint pattern (`/accounts/{id}/ai/run/{model}`), same message structure.
 * The system prompt is built from `business.voice` so the same code serves SP
 * (ledger/vault mood) and TFM (scripture-forward) without per-business branches.
 *
 * CT105's wiring:
 *   - Pick the generation model (SP's AI Search instance uses `@cf/google/gemma-4-26b-a4b-it`
 *     per CLAUDE.md; same model is a reasonable default here).
 *   - Wire `accountId` + `apiToken` from Cloudflare Pages secrets.
 *   - Optional: route through AI Gateway for fallback (per §2 "Multi-model orchestration" row).
 */
export interface WorkersAiComposerOptions {
  accountId: string;
  apiToken: string;
  model?: string;
  /** Override fetch (defaults to global). Useful for testing or proxy injection. */
  fetchImpl?: typeof fetch;
}

export class WorkersAiComposer implements AnswerComposer {
  private readonly fetchImpl: typeof fetch;
  private readonly url: string;
  private readonly headers: Record<string, string>;
  private readonly model: string;

  constructor(opts: WorkersAiComposerOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.model = opts.model ?? "@cf/google/gemma-4-26b-a4b-it";
    this.url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai/run/${this.model}`;
    this.headers = {
      Authorization: `Bearer ${opts.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  async compose(
    question: string,
    toolResults: McpToolResult[],
    business: BusinessConfig,
  ): Promise<string> {
    const contextText = extractText(toolResults).join("\n\n---\n\n");
    if (contextText.length === 0) {
      return `I don't have information about that for ${business.name}.`;
    }

    const systemPrompt =
      `You answer questions about ${business.name}. ` +
      `Voice: ${business.voice}. ` +
      `Use ONLY the provided context. If the context does not contain the answer, ` +
      `reply: "I don't have information about that for ${business.name}." ` +
      `Be concise and factual. Do not invent details.`;

    const userPrompt =
      `Answer using ONLY the context below.\n\n` +
      `Context:\n${contextText}\n\nQuestion: ${question}`;

    const r = await this.fetchImpl(this.url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!r.ok) {
      throw new Error(`Workers AI request failed: ${r.status} ${r.statusText}`);
    }
    const data = (await r.json()) as {
      result?: {
        choices?: Array<{ message?: { content?: string } }>;
        response?: string;
      };
    };
    const res = data?.result ?? {};
    const answer =
      res?.choices?.[0]?.message?.content ?? res?.response ?? "";
    return String(answer).trim() || `I don't have information about that for ${business.name}.`;
  }
}
