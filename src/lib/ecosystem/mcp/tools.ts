/**
 * The five MCP tools §5.2 names for Phase 1.
 *
 * Each tool is backed by the knowledge graph (component 1) and/or vector search
 * (component 8) via the shared McpToolContext. Handlers stay thin: they translate
 * tool args → graph/vector calls, format results as MCP content items.
 *
 * Per §8: the goal is a working P0 slice (catalog → graph → vector → MCP → agent)
 * exercised end-to-end on fake data — NOT 10 isolated stubs. These handlers do
 * real graph/vector work; the smoke test wires a MockD1 + fake vector backend and
 * runs the full chain.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 2 — tool list).
 */

import type { Entity } from "../knowledge-graph/types";
import type { McpTool, McpToolResult } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asInt(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(Math.trunc(n), max));
}

function errorResult(text: string): McpToolResult {
  return { isError: true, content: [{ type: "text", text }] };
}

function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Pull a structured Q/A pair out of an FAQ entity's `data` JSON.
 * Per component 1's convention: `faq.data = { question, answer, category?, ... }`.
 */
function faqFromEntity(e: Entity): { question: string; answer: string } {
  const d = e.data ?? {};
  return {
    question: asString(d.question) || e.name,
    answer: asString(d.answer),
  };
}

// ─────────────────────────────────────────────────────────────────────
// 1. faq_search — semantic + keyword search over FAQs
// ─────────────────────────────────────────────────────────────────────

export const faqSearchTool: McpTool = {
  definition: {
    name: "faq_search",
    description:
      "Search frequently asked questions for this business. Use for general " +
      "questions about services, process, policies, or how the business works. " +
      "Returns matching Q&A pairs.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language question or search phrase.",
        },
        topK: {
          type: "number",
          description: "Maximum results to return (default 5, max 20).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  handler: async (params, ctx) => {
    const query = asString(params.query).trim();
    const topK = asInt(params.topK, 5, 1, 20);
    if (!query) return errorResult("'query' is required and must be non-empty.");

    // Graph keyword search returns structured Q&A pairs (primary path).
    const graphMatches = await ctx.graph.searchEntities(query, {
      type: "faq",
      limit: topK,
    });

    // Vector search catches semantic matches the keyword search misses (fallback).
    const semantic = await ctx.vectorSearch.search(query, topK);

    const seen = new Set<string>();
    const faqs: Array<{ question: string; answer: string }> = [];

    for (const e of graphMatches) {
      const f = faqFromEntity(e);
      if (!seen.has(f.question)) {
        seen.add(f.question);
        faqs.push(f);
      }
    }
    for (const s of semantic) {
      if (faqs.length >= topK) break;
      const key = s.text.slice(0, 80);
      if (s.text && !seen.has(key)) {
        seen.add(key);
        faqs.push({ question: "(semantic match)", answer: s.text });
      }
    }

    if (faqs.length === 0) {
      return textResult(`No FAQs found for "${query}" in ${ctx.business.name}.`);
    }

    const lines = [
      `Found ${faqs.length} FAQ${faqs.length === 1 ? "" : "s"} matching "${query}":`,
      "",
    ];
    faqs.forEach((f, i) => {
      lines.push(`${i + 1}. Q: ${f.question}`);
      lines.push(`   A: ${f.answer || "(no answer recorded)"}`);
      lines.push("");
    });
    return textResult(lines.join("\n"));
  },
};

// ─────────────────────────────────────────────────────────────────────
// 2. pricing_lookup — pricing for a named service, or all pricing
// ─────────────────────────────────────────────────────────────────────

export const pricingLookupTool: McpTool = {
  definition: {
    name: "pricing_lookup",
    description:
      "Look up pricing for a specific service by name, or list all pricing " +
      "entries for this business. Use when a customer asks about cost, fees, " +
      "or rates.",
    inputSchema: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description:
            "Service name (or partial name) to look up. Omit to list all pricing.",
        },
      },
      additionalProperties: false,
    },
  },
  handler: async (params, ctx) => {
    const serviceQuery = asString(params.service).trim();

    if (!serviceQuery) {
      // List all pricing entities.
      const pricing = await ctx.graph.getEntitiesByType("pricing", { limit: 100 });
      if (pricing.length === 0) {
        return textResult(`${ctx.business.name} has no pricing entries published.`);
      }
      const lines = [`Pricing for ${ctx.business.name} (${pricing.length}):`, ""];
      pricing.forEach((p, i) => {
        const d = p.data ?? {};
        const amount = d.amount !== undefined ? String(d.amount) : "(unspecified)";
        const unit = asString(d.unit) || "";
        const notes = asString(d.notes) || "";
        lines.push(`${i + 1}. ${p.name}: ${amount}${unit ? " " + unit : ""}${notes ? " — " + notes : ""}`);
      });
      return textResult(lines.join("\n"));
    }

    // Find the named service, then walk priced_by edges.
    const serviceMatches = await ctx.graph.searchEntities(serviceQuery, {
      type: "service",
      limit: 5,
    });
    if (serviceMatches.length === 0) {
      return textResult(`No service matching "${serviceQuery}" found for ${ctx.business.name}.`);
    }

    const lines: string[] = [];
    for (const svc of serviceMatches) {
      const pricedBy = await ctx.graph.getRelated(svc.id, "priced_by", "out");
      if (pricedBy.length === 0) {
        lines.push(`• ${svc.name}: no pricing published.`);
      } else {
        for (const edge of pricedBy) {
          const d = edge.entity.data ?? {};
          const amount = d.amount !== undefined ? String(d.amount) : "(unspecified)";
          const unit = asString(d.unit) || "";
          const notes = asString(d.notes) || "";
          lines.push(`• ${svc.name}: ${amount}${unit ? " " + unit : ""}${notes ? " — " + notes : ""}`);
        }
      }
    }
    return textResult(lines.join("\n"));
  },
};

// ─────────────────────────────────────────────────────────────────────
// 3. service_catalog — list all services (optionally category-filtered)
// ─────────────────────────────────────────────────────────────────────

export const serviceCatalogTool: McpTool = {
  definition: {
    name: "service_catalog",
    description:
      "List all services offered by this business. Use to enumerate what the " +
      "business does at a high level, or to find a specific service by name.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum results (default 20, max 100).",
        },
      },
      additionalProperties: false,
    },
  },
  handler: async (params, ctx) => {
    const limit = asInt(params.limit, 20, 1, 100);
    const services = await ctx.graph.getEntitiesByType("service", { limit });

    if (services.length === 0) {
      return textResult(`${ctx.business.name} has no services in the catalog.`);
    }

    const lines = [
      `Services from ${ctx.business.name} (${services.length}):`,
      "",
    ];
    services.forEach((s, i) => {
      const d = s.data ?? {};
      const desc = asString(d.description) || "";
      const cat = asString(d.category);
      lines.push(`${i + 1}. ${s.name}${cat ? ` [${cat}]` : ""}`);
      if (desc) lines.push(`   ${desc}`);
    });
    return textResult(lines.join("\n"));
  },
};

// ─────────────────────────────────────────────────────────────────────
// 4. question_search — search recorded customer questions
// ─────────────────────────────────────────────────────────────────────

export const questionSearchTool: McpTool = {
  definition: {
    name: "question_search",
    description:
      "Search questions previously asked by customers of this business. Use to " +
      "find common questions, recurring themes, or to see what topics customers " +
      "ask about. Returns matching question records.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language search query.",
        },
        topK: {
          type: "number",
          description: "Maximum results (default 10, max 50).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  handler: async (params, ctx) => {
    const query = asString(params.query).trim();
    const topK = asInt(params.topK, 10, 1, 50);
    if (!query) return errorResult("'query' is required and must be non-empty.");

    const matches = await ctx.graph.searchEntities(query, {
      type: "question",
      limit: topK,
    });

    if (matches.length === 0) {
      return textResult(`No recorded customer questions match "${query}".`);
    }

    const lines = [
      `Found ${matches.length} matching question${matches.length === 1 ? "" : "s"} for "${query}":`,
      "",
    ];
    matches.forEach((q, i) => {
      const d = q.data ?? {};
      const text = asString(d.text) || q.name;
      const count = typeof d.occurrence_count === "number" ? d.occurrence_count : null;
      const source = asString(d.source);
      const meta: string[] = [];
      if (count !== null) meta.push(`asked ${count}×`);
      if (source) meta.push(`source: ${source}`);
      lines.push(`${i + 1}. ${text}${meta.length ? ` (${meta.join(", ")})` : ""}`);
    });
    return textResult(lines.join("\n"));
  },
};

// ─────────────────────────────────────────────────────────────────────
// 5. knowledge_query — free-form semantic+graph query (the catch-all)
// ─────────────────────────────────────────────────────────────────────

export const knowledgeQueryTool: McpTool = {
  definition: {
    name: "knowledge_query",
    description:
      "General-purpose knowledge query — use when no other tool fits. Combines " +
      "semantic search with structured knowledge-graph traversal. Returns relevant " +
      "entities and their relationships. Best for complex or exploratory questions.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language query.",
        },
        topK: {
          type: "number",
          description: "Maximum entities to return (default 5, max 20).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  handler: async (params, ctx) => {
    const query = asString(params.query).trim();
    const topK = asInt(params.topK, 5, 1, 20);
    if (!query) return errorResult("'query' is required and must be non-empty.");

    // Primary: graph keyword search (returns structured entities).
    const entities = await ctx.graph.searchEntities(query, { limit: topK });

    // Supplement: vector search for semantic-only hits.
    const semantic = await ctx.vectorSearch.search(query, topK);

    if (entities.length === 0 && semantic.length === 0) {
      return textResult(`No knowledge-graph matches for "${query}" in ${ctx.business.name}.`);
    }

    const lines: string[] = [];

    if (entities.length > 0) {
      lines.push(`Knowledge-graph entities (${entities.length}):`);
      lines.push("");
      for (const e of entities) {
        const d = e.data ?? {};
        const desc = asString(d.description) || asString(d.answer) || asString(d.text) || "";
        lines.push(`• [${e.type}] ${e.name}`);
        if (desc) lines.push(`  ${desc}`);

        // One-hop related entities (depth-1 traversal, outgoing edges only).
        try {
          const related = await ctx.graph.getRelated(e.id, undefined, "out");
          if (related.length > 0) {
            const rels = related.slice(0, 5).map((r) => `--${r.relationship.type}--> ${r.entity.name}`);
            lines.push(`  relations: ${rels.join("; ")}`);
          }
        } catch {
          // Traversal failure shouldn't fail the whole query.
        }
      }
    }

    if (semantic.length > 0) {
      const graphIds = new Set(entities.map((e) => e.id));
      const extra = semantic.filter((s) => !graphIds.has(s.id)).slice(0, topK);
      if (extra.length > 0) {
        if (lines.length > 0) lines.push("");
        lines.push(`Additional semantic matches (${extra.length}):`);
        extra.forEach((s, i) => {
          const snippet = s.text.slice(0, 200);
          lines.push(`${i + 1}. (score ${s.score.toFixed(2)}) ${snippet}${s.text.length > 200 ? "…" : ""}`);
        });
      }
    }

    return textResult(lines.join("\n"));
  },
};

// ─────────────────────────────────────────────────────────────────────
// Barrel — the standard 5-tool set
// ─────────────────────────────────────────────────────────────────────

export const STANDARD_TOOLS: McpTool[] = [
  faqSearchTool,
  pricingLookupTool,
  serviceCatalogTool,
  questionSearchTool,
  knowledgeQueryTool,
];
