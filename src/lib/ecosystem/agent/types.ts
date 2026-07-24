/**
 * Agent types.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 5), §1 (end product),
 *   §2 (storage mapping — "Workers AI + AI Gateway, no LangChain"), §3 ("Existing
 *   chatbot" deployment row — agent must be proven independently before ask.ts
 *   refactors onto it).
 *
 * The agent is the capstone of the P0 slice: it takes a user question, decides
 * which MCP tool(s) to call (via component 2), invokes them, and composes a
 * natural-language answer. §5.5 framing: "decide which MCP tool(s) to call, then
 * compose an answer."
 *
 * Two pluggable seams:
 *   - ToolRouter — decides which tool(s) to call from the question text. Phase 1
 *     ships a deterministic heuristic router; future versions can swap in an
 *     LLM-backed function-calling router with no other code changes.
 *   - AnswerComposer — synthesizes the final natural-language answer from tool
 *     results. Phase 1 ships a template-based composer (forwards tool result
 *     text framed by business voice); real impl wraps Workers AI (CT105 wiring).
 */

import type { BusinessConfig } from "../catalog/types";
import type {
  McpToolCall,
  McpToolContext,
  McpToolResult,
} from "../mcp/types";

// ─────────────────────────────────────────────────────────────────────
// Request + response shapes
// ─────────────────────────────────────────────────────────────────────

/**
 * Single-turn agent request. Multi-turn conversation state (history, carry-over)
 * is intentionally NOT modeled here — Phase 1 is single-turn; the chatbot widget
 * handles the conversational UI layer. Multi-turn is a P1+ follow-up.
 */
export interface AgentRequest {
  /** The user's natural-language question. Required, non-empty. */
  question: string;
}

/**
 * Agent response. Carries the answer plus the tool-call trace — useful for
 * observability, debugging, and "show your work" UI patterns.
 */
export interface AgentResponse {
  /** Final natural-language answer, respecting the business's voice. */
  answer: string;
  /** Tools the router selected, in invocation order. */
  toolCalls: McpToolCall[];
  /** Raw results from each tool call (parallel to toolCalls). */
  toolResults: McpToolResult[];
  /** True if no tool returned usable content (all errored or empty). */
  noContext: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Router seam
// ─────────────────────────────────────────────────────────────────────

/**
 * Decides which MCP tool(s) to call for a given question.
 *
 * Returns 1+ McpToolCalls. Multi-tool routing is supported (a question might
 * warrant both `service_catalog` and `pricing_lookup`); the composer merges
 * the results. Returning [] is allowed but discouraged — the agent will fall
 * back to a "no context" answer.
 *
 * Phase 1 ships `defaultHeuristicRouter` (deterministic, keyword-based). Real
 * implementations might use an LLM with function-calling; the contract is the
 * same. See `router.ts`.
 */
export type ToolRouter = (question: string) => McpToolCall[];

// ─────────────────────────────────────────────────────────────────────
// Composer seam
// ─────────────────────────────────────────────────────────────────────

/**
 * Synthesizes a natural-language answer from tool results.
 *
 * Contract:
 *   - Honors `business.voice` (brand-voice constraints in the system prompt).
 *   - Returns a deterministic refusal when tool results are empty/all-error
 *     (parallel to `ask.ts`'s REFUSAL constant — see lines 16, 94 of that file).
 *
 * Phase 1 ships `TemplatedComposer` (deterministic, no LLM). Real impl wraps
 * Workers AI via the same REST shape `ask.ts` already uses (lines 99-115 of
 * that file). See `composer.ts`.
 */
export interface AnswerComposer {
  compose(
    question: string,
    toolResults: McpToolResult[],
    business: BusinessConfig,
  ): Promise<string>;
}
