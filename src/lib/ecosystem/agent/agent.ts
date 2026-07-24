/**
 * Agent — the §5.5 capstone. Ties components 1 + 2 + 8 + 9 together.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 5), §1 (end product),
 *   §8 handoff ("catalog → graph → vector search → MCP tool call → agent answer,
 *   end to end, on fake data. That single working thread is worth more than 10
 *   isolated stubs.").
 *
 * Flow per `answer(question)`:
 *   1. Route — `ToolRouter` picks which MCP tool(s) to call from the question.
 *   2. Invoke — calls each selected tool via the injected McpServer + McpToolContext.
 *   3. Compose — `AnswerComposer` synthesizes the final natural-language answer.
 *
 * All three pieces are pluggable. Phase 1 defaults:
 *   router   = `defaultHeuristicRouter` (deterministic, no LLM)
 *   composer = `TemplatedComposer` (deterministic, no LLM)
 *
 * The same Agent class accepts a `WorkersAiComposer` (real LLM via REST) and any
 * custom ToolRouter — no other code changes. That's the wireframe principle
 * applied to the orchestration layer.
 */

import type { McpServer } from "../mcp/server";
import type { McpToolCall, McpToolContext, McpToolResult } from "../mcp/types";
import type {
  AgentRequest,
  AgentResponse,
  AnswerComposer,
  ToolRouter,
} from "./types";
import { defaultHeuristicRouter } from "./router";
import { TemplatedComposer } from "./composer";

export class AgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentError";
  }
}

export class Agent {
  private readonly router: ToolRouter;
  private readonly composer: AnswerComposer;

  constructor(
    private readonly mcpServer: McpServer,
    private readonly ctx: McpToolContext,
    opts: {
      router?: ToolRouter;
      composer?: AnswerComposer;
    } = {},
  ) {
    this.router = opts.router ?? defaultHeuristicRouter;
    this.composer = opts.composer ?? new TemplatedComposer();
  }

  /**
   * Answer a single-turn question. Always returns a response (never throws) —
   * handler/tool failures surface as `noContext: true` with a deterministic
   * refusal in the answer, mirroring `ask.ts`'s REFUSAL gate.
   *
   * @throws AgentError only for programmer errors (empty question).
   */
  async answer(request: AgentRequest | string): Promise<AgentResponse> {
    const question =
      typeof request === "string" ? request : request?.question;
    if (typeof question !== "string" || question.trim().length === 0) {
      throw new AgentError("question is required and must be non-empty");
    }
    const q = question.trim();

    // 1. Route
    const toolCalls: McpToolCall[] = this.router(q);

    // 2. Invoke (sequentially — preserves deterministic ordering; parallelism is
    //    an optimization that doesn't change semantics for Phase 1).
    const toolResults: McpToolResult[] = [];
    for (const call of toolCalls) {
      const result = await this.mcpServer.dispatch(call, this.ctx);
      toolResults.push(result);
    }

    // 3. Check for usable context
    const hasUsable = toolResults.some(
      (r) => !r.isError && r.content.some((c) => c.type === "text" && c.text.trim().length > 0),
    );

    // 4. Compose
    const answer = await this.composer.compose(q, toolResults, this.ctx.business);

    return {
      answer,
      toolCalls,
      toolResults,
      noContext: !hasUsable,
    };
  }
}
