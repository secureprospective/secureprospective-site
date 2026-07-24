// Pages Function: /api/ecosystem/mcp?business=<id>
//
// MCP server HTTP entry point. GET returns tools/list; POST { name, arguments }
// dispatches tools/call through the existing McpServer + STANDARD_TOOLS
// (src/lib/ecosystem/mcp). Two things are deliberately NOT done here, both
// tracked as open steps in this repo's CLAUDE.md "AI-Ecosystem Wiring Phase"
// handoff:
//
//   1. Auth fails closed. No Cloudflare Access application exists on this
//      account yet (CLAUDE.md Cloudflare Configuration lists "Access: None"),
//      so there is no real AccessJwtValidator to check a JWT against. Every
//      request is rejected with 401 until step 4 (real JWT verification) is
//      done — see requireAuth() below. Shipping this open, per §0.5 research
//      (41% of public MCP servers have zero auth), is the one thing this
//      endpoint must never do.
//
//   2. Vector search is a no-op. Component 8 (semantic search) was deferred —
//      no real business content corpus exists yet to index (Christopher's
//      call, 2026-07-24). Tool handlers still work: they fall back to the
//      knowledge-graph keyword search, which is the primary path anyway.
//
// NOT PUSHED to origin yet — held locally alongside knowledge-graph.ts until
// Cloudflare Access is configured. See project_ai_ecosystem_wireframe memory.
//
// Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 component 2, §0.5 (auth research),
// docs/ai-ecosystem/components/02_mcp_server.md "Hand-off to CT105".
//
// Uses the local McpServer class directly rather than the Cloudflare Agents
// SDK (`agents` package / `createMcpHandler`) — that dependency needs
// Christopher's sign-off before it's added to package.json (LEAD #5), and
// isn't required for this hand-rolled JSON contract to work correctly.
// Swapping in the real SDK later doesn't change McpServer.listTools()/
// dispatch(), the contract this file relies on.

import {
  McpAuthError,
  McpServer,
  readAccessJwt,
  STANDARD_TOOLS,
  type McpToolContext,
} from "../../../../src/lib/ecosystem/mcp";
import { KnowledgeGraph, type D1Database } from "../../../../src/lib/ecosystem/knowledge-graph";
import { VectorSearch, type SearchOptions, type SearchResult, type VectorSearchBackend } from "../../../../src/lib/ecosystem/vector-search";
import { BusinessConfigError, loadBusinessConfig } from "../../../../src/lib/ecosystem/catalog";

interface Env {
  ECOSYSTEM_DB?: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** No real content corpus indexed yet (component 8 deferred) — always empty. */
class NullVectorSearchBackend implements VectorSearchBackend {
  async search(_query: string, _opts: SearchOptions): Promise<SearchResult[]> {
    return [];
  }
}

/**
 * Fails closed until a real CloudflareAccessValidator exists (step 4 of the
 * wiring handoff). See file header — this is the load-bearing security gate.
 */
async function requireAuth(request: Request): Promise<void> {
  const jwt = readAccessJwt(request);
  if (!jwt) {
    throw new McpAuthError("Missing Cf-Access-Jwt-Assertion header.");
  }
  throw new McpAuthError(
    "MCP auth not yet wired — no AccessJwtValidator configured (see ARCHITECTURE.md §5.2).",
  );
}

function buildContext(env: Env, businessId: string): McpToolContext {
  if (!env.ECOSYSTEM_DB) {
    throw new Error("ECOSYSTEM_DB binding not configured.");
  }
  const business = loadBusinessConfig(businessId);
  return {
    business,
    graph: new KnowledgeGraph(env.ECOSYSTEM_DB, business),
    vectorSearch: new VectorSearch(new NullVectorSearchBackend(), business),
  };
}

function buildServer(): McpServer {
  const server = new McpServer();
  for (const tool of STANDARD_TOOLS) server.registerTool(tool);
  return server;
}

// GET — tools/list. Read-only metadata (tool names/descriptions/schemas),
// still gated behind requireAuth for consistency with tools/call.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAuth(context.request);
    const server = buildServer();
    return json({ tools: server.listTools() });
  } catch (e) {
    const status = e instanceof McpAuthError ? 401 : 500;
    return json({ error: (e as Error).message }, status);
  }
};

// POST { name, arguments } — tools/call.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const businessId = url.searchParams.get("business");

  try {
    await requireAuth(context.request);
    if (!businessId) {
      return json({ error: "'business' query param is required." }, 400);
    }
    const body = await context.request.json<{ name?: string; arguments?: Record<string, unknown> }>();
    if (!body.name) {
      return json({ error: "'name' is required in the request body." }, 400);
    }

    const ctx = buildContext(context.env, businessId);
    const server = buildServer();
    const result = await server.dispatch(
      { name: body.name, arguments: body.arguments ?? {} },
      ctx,
    );
    return json(result, result.isError ? 400 : 200);
  } catch (e) {
    const status =
      e instanceof McpAuthError ? 401 : e instanceof BusinessConfigError ? 404 : 500;
    return json({ error: (e as Error).message }, status);
  }
};
