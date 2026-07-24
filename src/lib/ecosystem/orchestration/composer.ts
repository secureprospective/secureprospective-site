/**
 * Orchestrated composer — the integration point between the multi-model
 * orchestration layer (component 7) and the agent (component 5).
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.5 ("compose an answer"),
 *   §5.7 ("Multi-Model Orchestration"), §2 ("AI Gateway for multi-provider
 *   routing/fallback").
 *
 * What this composer is:
 *   - Implements the existing `AnswerComposer` seam from `agent/types.ts`.
 *   - Wraps ANY `ModelRouter` (the contract defined here in component 7).
 *   - When the agent picks `OrchestratedComposer` at construction time, the
 *     composer's LLM call goes through whatever router was injected —
 *     `AiGatewayRouter` for the canonical §5.7 path, or a fake for testing.
 *
 * What this composer is NOT:
 *   - Not a replacement for `WorkersAiComposer`. That composer is the proven
 *     single-model direct-REST path and stays untouched. This composer is a
 *     parallel option, mirroring how component 8 ships two backends
 *     (`VectorizeBackend` + `AISearchBackend`) behind one interface. CT105
 *     picks the right composer at construction time per deployment.
 *
 * The system-prompt construction and extractText logic mirror
 * `WorkersAiComposer` deliberately — same voice-handling rules, same refusal
 * gate when context is empty. The only difference is *who makes the LLM call*:
 * `WorkersAiComposer` does a direct fetch; `OrchestratedComposer` delegates
 * to the injected `ModelRouter`.
 */

import type { BusinessConfig } from "../catalog/types";
import type { McpToolResult } from "../mcp/types";
import type { ChatMessage, ModelRouter, GenerateOptions } from "./types";
import type { AnswerComposer } from "../agent/types";

/**
 * Extract concatenated text content from a tool result, skipping errors.
 * Mirrors `WorkersAiComposer`'s private helper line-for-line so the two
 * composers are observably identical on the no-context path.
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

export interface OrchestratedComposerOptions {
  /** The model router responsible for the actual LLM call. Required. */
  router: ModelRouter;
  /** Per-call overrides applied to every generate() call (e.g. temperature). */
  generateOpts?: GenerateOptions;
  /**
   * Override the system-prompt builder. Defaults to the same construction
   * `WorkersAiComposer` uses — business.name + business.voice + grounding rule.
   * Useful for tests that need to assert exact prompt content.
   */
  buildSystemPrompt?: (business: BusinessConfig) => string;
}

/**
 * Answer composer that delegates the LLM call to an injected `ModelRouter`.
 *
 * Construction picks the routing strategy (AI Gateway, fake, future direct
 * provider); the rest of the composer is router-agnostic. Same pluggable-seam
 * tradeoff as the agent's existing composer pair.
 */
export class OrchestratedComposer implements AnswerComposer {
  private readonly router: ModelRouter;
  private readonly generateOpts?: GenerateOptions;
  private readonly buildSystemPrompt: (business: BusinessConfig) => string;

  constructor(opts: OrchestratedComposerOptions) {
    if (!opts?.router) {
      throw new Error("OrchestratedComposer requires a ModelRouter");
    }
    this.router = opts.router;
    this.generateOpts = opts.generateOpts;
    this.buildSystemPrompt = opts.buildSystemPrompt ?? defaultSystemPrompt;
  }

  async compose(
    question: string,
    toolResults: McpToolResult[],
    business: BusinessConfig,
  ): Promise<string> {
    const contextText = extractText(toolResults).join("\n\n---\n\n");
    if (contextText.length === 0) {
      // Mirrors `WorkersAiComposer`'s refusal — same string, same gate.
      return `I don't have information about that for ${business.name}.`;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: this.buildSystemPrompt(business) },
      {
        role: "user",
        content:
          `Answer using ONLY the context below.\n\n` +
          `Context:\n${contextText}\n\nQuestion: ${question}`,
      },
    ];

    const result = await this.router.generate(messages, this.generateOpts);
    return (
      result.text.trim() ||
      `I don't have information about that for ${business.name}.`
    );
  }
}

/**
 * Default system-prompt builder. Mirrors `WorkersAiComposer`'s prompt
 * construction line-for-line so the two composers produce the same prompt
 * shape (the only difference is the routing layer underneath).
 */
function defaultSystemPrompt(business: BusinessConfig): string {
  return (
    `You answer questions about ${business.name}. ` +
    `Voice: ${business.voice}. ` +
    `Use ONLY the provided context. If the context does not contain the answer, ` +
    `reply: "I don't have information about that for ${business.name}." ` +
    `Be concise and factual. Do not invent details.`
  );
}
