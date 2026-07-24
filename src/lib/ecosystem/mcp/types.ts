/**
 * MCP Server types.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 2), §0.5 (security research),
 *   §2 (storage mapping).
 *
 * MCP (Model Context Protocol) is JSON-RPC 2.0 over a transport. A server exposes
 * "tools" — each with a name, description, JSON Schema for inputs, and an async
 * handler. Clients (AI agents, other MCP-aware software) call `tools/list` to
 * discover what's available, then `tools/call` with `{ name, arguments }` to invoke.
 *
 * Per §5.2 the routing is provided by Cloudflare's Agents SDK (`createMcpHandler` /
 * `addMcpServer()`, package `agents`) — bird does NOT hand-write JSON-RPC parsing.
 * The types below define the SDK-agnostic tool + dispatch surface that the real
 * SDK wraps at HTTP time. Same dep-free tradeoff as KnowledgeGraph's `D1Database`
 * and VectorSearch's `VectorizeIndex` — see `02_mcp_server.md` for the hand-off.
 */

import type { BusinessConfig } from "../catalog/types";
import type { KnowledgeGraph } from "../knowledge-graph/graph";
import type { VectorSearch } from "../vector-search/search";

// ─────────────────────────────────────────────────────────────────────
// Tool definitions (what tools/list returns)
// ─────────────────────────────────────────────────────────────────────

/**
 * JSON Schema for a tool's input. Constrained to the subset MCP exposes —
 * an object with named properties. Complex schema features ($ref, conditional
 * subschemas) are intentionally out of scope; tool params stay flat.
 */
export interface McpToolInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Static definition of a tool — what the SDK advertises via tools/list.
 * Mirrors the MCP protocol's Tool shape.
 */
export interface McpToolDefinition {
  /** Tool name. Unique within a server. Snake_case per MCP convention. */
  name: string;
  /** Human/AI-readable description — this IS the prompt the calling agent sees. */
  description: string;
  /** JSON Schema for the tool's input arguments. */
  inputSchema: McpToolInputSchema;
}

// ─────────────────────────────────────────────────────────────────────
// Tool calls + results (what tools/call sends + returns)
// ─────────────────────────────────────────────────────────────────────

/** Incoming tools/call request, post-JSON-RPC-unwrapping. */
export interface McpToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Context every handler receives. Constructed once at server startup (after
 * bindings are wired), passed to every dispatch. This is the seam where the
 * MCP layer meets the rest of the ecosystem — handlers stay thin and delegate
 * to KnowledgeGraph + VectorSearch.
 */
export interface McpToolContext {
  business: BusinessConfig;
  graph: KnowledgeGraph;
  vectorSearch: VectorSearch;
}

/**
 * One content item in a tool result. MCP supports text, image, etc.; we ship
 * text + json (the two the ecosystem actually produces). Embedded resources
 * (audio, etc.) are out of scope for Phase 1.
 */
export type McpContentItem =
  | { type: "text"; text: string }
  | { type: "json"; json: unknown };

/**
 * Tool result. `content` is mandatory (even on error — the protocol expects an
 * explanation). `isError: true` signals a handled error (bad params, lookup miss);
 * an unhandled throw surfaces as a JSON-RPC error one level up (SDK's job).
 */
export interface McpToolResult {
  content: McpContentItem[];
  isError?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Tool + handler shapes
// ─────────────────────────────────────────────────────────────────────

/**
 * Async handler for a tool call. Receives the (already JSON-parsed) arguments
 * and the shared context. Handlers do their own minimal param narrowing — strict
 * Ajv validation against `inputSchema` is deferred to component 10 (testing).
 */
export type McpToolHandler = (
  params: Record<string, unknown>,
  ctx: McpToolContext,
) => Promise<McpToolResult>;

/** A complete tool: static definition + async handler. */
export interface McpTool {
  definition: McpToolDefinition;
  handler: McpToolHandler;
}

// ─────────────────────────────────────────────────────────────────────
// Local minimal Agents SDK handler interface (dep-free stub)
// ─────────────────────────────────────────────────────────────────────

/**
 * Minimal interface mirroring the dispatch surface of Cloudflare's Agents SDK
 * MCP handler. Bird's `McpServer` class implements this directly so the tool
 * registry + dispatch can be tested without the `agents` runtime dep.
 *
 * CT105's HTTP-layer wiring (per §3 deployment map) adapts this to the real
 * `createMcpHandler()` / `addMcpServer()` API from package `agents` — typically
 * a thin wrapper that forwards `tools/list` and `tools/call` JSON-RPC methods
 * to `listTools()` and `dispatch()` here.
 *
 * See `02_mcp_server.md` → "Hand-off to CT105" for the exact wiring shape.
 */
export interface AgentsSdkHandler {
  registerTool(tool: McpTool): void;
  listTools(): McpToolDefinition[];
  dispatch(call: McpToolCall, ctx: McpToolContext): Promise<McpToolResult>;
}
