/**
 * McpServer — SDK-agnostic tool registry + dispatch.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 2), §0.5 (security research).
 *
 * Implements `AgentsSdkHandler` directly so the tool registry + dispatch logic is
 * testable without the `agents` runtime dep (LEAD #5 — same local-stub pattern as
 * KnowledgeGraph's `D1Database` and VectorSearch's `VectorizeIndex`).
 *
 * CT105's HTTP-layer wiring adapts this to the real Cloudflare Agents SDK API
 * (`createMcpHandler()` / `addMcpServer()` from package `agents`). The SDK owns
 * JSON-RPC parsing, transport, and auth integration; this class owns tool
 * registration + name→handler dispatch + result formatting. See `02_mcp_server.md`
 * → "Hand-off to CT105" for the exact adapter shape.
 */

import type {
  AgentsSdkHandler,
  McpTool,
  McpToolCall,
  McpToolContext,
  McpToolDefinition,
  McpToolResult,
} from "./types";

export class McpServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpServerError";
  }
}

export class McpServer implements AgentsSdkHandler {
  private readonly tools = new Map<string, McpTool>();

  /**
   * Register a tool. Throws McpServerError on duplicate name (a typo colliding
   * two tools is the kind of bug that silently breaks tool discovery).
   */
  registerTool(tool: McpTool): void {
    const name = tool.definition.name;
    if (this.tools.has(name)) {
      throw new McpServerError(`Tool already registered: "${name}"`);
    }
    this.tools.set(name, tool);
  }

  /** All registered tool definitions — the response shape for tools/list. */
  listTools(): McpToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * Dispatch a tools/call request to its handler.
   *
   * Returns a result (never throws) for handled failures:
   *   - unknown tool name → isError result with explanatory text
   *   - handler throws → isError result with the error message
   *
   * Auth/transport failures are NOT handled here — they surface as JSON-RPC
   * errors one level up (the SDK's job).
   */
  async dispatch(
    call: McpToolCall,
    ctx: McpToolContext,
  ): Promise<McpToolResult> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              `Unknown tool: "${call.name}". ` +
              `Available: ${Array.from(this.tools.keys()).sort().join(", ")}.`,
          },
        ],
      };
    }
    try {
      return await tool.handler(call.arguments ?? {}, ctx);
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Tool "${call.name}" failed: ${msg}`,
          },
        ],
      };
    }
  }
}
