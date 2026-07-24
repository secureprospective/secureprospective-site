/**
 * Heuristic tool router — deterministic Phase 1 tool selection.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.5 ("decide which MCP tool(s) to call").
 *
 * Why heuristic (not LLM) for Phase 1:
 *   1. Deterministic → fully testable without an LLM binding.
 *   2. Zero-cost → no Workers AI call per question just to route.
 *   3. §2 explicitly says "No LangChain — unnecessary overhead for tool-call-based
 *      flows." A heuristic router is the lightest possible version of that.
 *   4. The ToolRouter contract is pluggable — swapping in an LLM-backed
 *      function-calling router later changes one constructor arg, nothing else.
 *
 * Heuristics are intentionally simple keyword patterns. They WILL misroute
 * edge cases; that's fine for a wireframe. The composer's job is to compose
 * a sensible answer from whatever the router picked, including when the
 * "wrong" tool was called.
 */

import type { McpToolCall } from "../mcp/types";
import type { ToolRouter } from "./types";

/**
 * Default heuristic router. Examines question text and returns 1+ tool calls.
 * Falls through to knowledge_query (the catch-all) when no pattern matches.
 */
export const defaultHeuristicRouter: ToolRouter = (question) => {
  const q = question.toLowerCase();
  const trimmed = question.trim();

  // Pricing intent — extract optional service name.
  if (/\b(how much|cost|price|pricing|fee|rate|\$)\b/.test(q)) {
    const serviceMatch = question.match(/(?:for|on)\s+([a-z][a-z\s-]{1,60})/i);
    const args: Record<string, unknown> = serviceMatch
      ? { service: serviceMatch[1].trim() }
      : {};
    return [{ name: "pricing_lookup", arguments: args }];
  }

  // Service catalog intent.
  if (
    /\b(list|catalog|what services|which services|what do you (do|offer)|offer)\b/.test(q)
  ) {
    return [{ name: "service_catalog", arguments: {} }];
  }

  // Common-questions intent (what do other customers ask).
  if (
    /\b(other (customers|clients|people)|common question|people (ask|often)|popular)\b/.test(q)
  ) {
    return [{ name: "question_search", arguments: { query: trimmed, topK: 10 } }];
  }

  // Explicit FAQ intent.
  if (/\bfaq|frequently asked/.test(q)) {
    return [{ name: "faq_search", arguments: { query: trimmed } }];
  }

  // Default: the catch-all knowledge_query (combines graph + semantic search).
  return [{ name: "knowledge_query", arguments: { query: trimmed } }];
};
