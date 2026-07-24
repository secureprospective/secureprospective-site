// Pages Function: /api/ecosystem/knowledge-graph
//
// Thin HTTP wrapper over src/lib/ecosystem/knowledge-graph's KnowledgeGraph
// class. Reads (GET) are open — this is the same structured business data
// (FAQs, services, pricing) the MCP tools expose publicly by design. Writes
// (POST/PATCH/DELETE) go through the same Cloudflare Access JWT contract as
// the MCP server (src/lib/ecosystem/mcp/auth.ts) and fail closed: until a
// real AccessJwtValidator is wired (see mcp/auth.ts + ARCHITECTURE.md §5.2,
// "CRITICAL security gate"), every write request is rejected with 401.
//
// NOT PUSHED to origin yet — held locally per Christopher's call (2026-07-24)
// until Cloudflare Access is actually configured on this account. See
// project_ai_ecosystem_wireframe memory / AI-ecosystem wiring handoff in
// this repo's CLAUDE.md for the full sequencing rationale.
//
// Spec: docs/ai-ecosystem/ARCHITECTURE.md §3 (deployment map), §5 component 1.

import {
  KnowledgeGraph,
  KnowledgeGraphError,
  type D1Database,
  type EntityType,
  type RelationType,
  type TraversalDirection,
} from "../../../src/lib/ecosystem/knowledge-graph";
import { BusinessConfigError, loadBusinessConfig } from "../../../src/lib/ecosystem/catalog";
import { McpAuthError, readAccessJwt } from "../../../src/lib/ecosystem/mcp/auth";

interface Env {
  ECOSYSTEM_DB?: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Write-path auth gate. No real Cloudflare Access validator exists yet
 * (step 4 of the wiring handoff) — this always rejects, so writes fail
 * closed rather than shipping open. Swap for a real CloudflareAccessValidator
 * once Access is configured; the readAccessJwt() call stays the same.
 */
async function requireWriteAuth(request: Request): Promise<void> {
  const jwt = readAccessJwt(request);
  if (!jwt) {
    throw new McpAuthError("Missing Cf-Access-Jwt-Assertion header.");
  }
  throw new McpAuthError(
    "Write auth not yet wired — no AccessJwtValidator configured (see ARCHITECTURE.md §5.2).",
  );
}

function getGraph(env: Env, businessId: string | null): KnowledgeGraph {
  if (!businessId) {
    throw new BusinessConfigError("'business' query param is required.");
  }
  if (!env.ECOSYSTEM_DB) {
    throw new KnowledgeGraphError("ECOSYSTEM_DB binding not configured.");
  }
  const business = loadBusinessConfig(businessId);
  return new KnowledgeGraph(env.ECOSYSTEM_DB, business);
}

function errorStatus(e: unknown): number {
  if (e instanceof McpAuthError) return 401;
  if (e instanceof BusinessConfigError) return 404;
  if (e instanceof KnowledgeGraphError) return 400;
  return 500;
}

// ─────────────────────────────────────────────────────────────────────
// GET — entity lookup, list-by-type, search, or relationship traversal
// ─────────────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const business = url.searchParams.get("business");

  try {
    const graph = getGraph(context.env, business);

    const id = url.searchParams.get("id");
    if (id) {
      const entity = await graph.getEntity(id);
      return entity ? json(entity) : json({ error: `No entity "${id}"` }, 404);
    }

    const related = url.searchParams.get("related");
    if (related) {
      const relationType = url.searchParams.get("relation") as RelationType | null;
      const direction = (url.searchParams.get("direction") as TraversalDirection) || "out";
      const results = await graph.getRelated(related, relationType ?? undefined, direction);
      return json({ related: results });
    }

    const search = url.searchParams.get("search");
    const type = url.searchParams.get("type") as EntityType | null;
    if (search) {
      const limit = Number(url.searchParams.get("limit")) || undefined;
      const results = await graph.searchEntities(search, { type: type ?? undefined, limit });
      return json({ entities: results });
    }

    if (type) {
      const limit = Number(url.searchParams.get("limit")) || undefined;
      const offset = Number(url.searchParams.get("offset")) || undefined;
      const results = await graph.getEntitiesByType(type, { limit, offset });
      return json({ entities: results });
    }

    return json({ error: "Provide one of: id, related, search, or type." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, errorStatus(e));
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST — create an entity or relationship (write, auth-gated)
// ─────────────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const business = url.searchParams.get("business");

  try {
    await requireWriteAuth(context.request);
    const graph = getGraph(context.env, business);
    const body = await context.request.json<Record<string, unknown>>();

    if (body.kind === "relationship") {
      const created = await graph.createRelationship({
        id: String(body.id),
        fromId: String(body.fromId),
        toId: String(body.toId),
        type: body.type as RelationType,
        data: body.data as Record<string, unknown> | undefined,
      });
      return json(created, 201);
    }

    const created = await graph.createEntity({
      id: String(body.id),
      type: body.type as EntityType,
      name: String(body.name),
      data: body.data as Record<string, unknown> | undefined,
    });
    return json(created, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, errorStatus(e));
  }
};

// ─────────────────────────────────────────────────────────────────────
// PATCH — update an entity (write, auth-gated)
// ─────────────────────────────────────────────────────────────────────

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const business = url.searchParams.get("business");
  const id = url.searchParams.get("id");

  try {
    await requireWriteAuth(context.request);
    if (!id) return json({ error: "'id' query param is required." }, 400);
    const graph = getGraph(context.env, business);
    const body = await context.request.json<Record<string, unknown>>();
    const updated = await graph.updateEntity(id, {
      name: body.name as string | undefined,
      data: body.data as Record<string, unknown> | undefined,
    });
    return updated ? json(updated) : json({ error: `No entity "${id}"` }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, errorStatus(e));
  }
};

// ─────────────────────────────────────────────────────────────────────
// DELETE — delete an entity or relationship (write, auth-gated)
// ─────────────────────────────────────────────────────────────────────

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const business = url.searchParams.get("business");
  const id = url.searchParams.get("id");
  const kind = url.searchParams.get("kind") ?? "entity";

  try {
    await requireWriteAuth(context.request);
    if (!id) return json({ error: "'id' query param is required." }, 400);
    const graph = getGraph(context.env, business);
    const deleted =
      kind === "relationship"
        ? await graph.deleteRelationship(id)
        : await graph.deleteEntity(id);
    return json({ deleted });
  } catch (e) {
    return json({ error: (e as Error).message }, errorStatus(e));
  }
};
