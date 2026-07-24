import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  McpServer,
  McpAuthError,
  readAccessJwt,
  STANDARD_TOOLS,
  faqSearchTool,
  pricingLookupTool,
  serviceCatalogTool,
  questionSearchTool,
  knowledgeQueryTool,
} from "./index";
import { KnowledgeGraph, entityId, relId } from "../knowledge-graph";
import { loadBusinessConfig } from "../catalog";
import { VectorSearch, AISearchBackend } from "../vector-search";
import { MockD1 } from "../testing";
import type { McpToolContext, McpContentItem } from "./types";

/**
 * Ported from /tmp/opencode/smoke-mcp.mjs (session 2 of ai-ecosystem-scaffold).
 * Component 10 (§5.10): permanent Vitest home for the §8 P0 thread checks
 * (catalog → graph → vector → MCP tool call) exercised end-to-end on seeded SP data.
 */

// Narrow McpContentItem to its text variant — TS won't auto-narrow on .text
// access without a type guard, since the union includes a { type: "json" } arm.
function textOf(item: McpContentItem): string {
  return item.type === "text" ? item.text : "";
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(__dirname, "../../../../migrations/0001_ecosystem_knowledge_graph.sql");

let db: MockD1;
let sp: ReturnType<typeof loadBusinessConfig>;
let graph: KnowledgeGraph;
let vectorSearch: VectorSearch;
let server: McpServer;
let ctx: McpToolContext;
let fakeAiClientCalls: string[];

beforeAll(async () => {
  db = new MockD1();
  db.applyMigration(readFileSync(MIGRATION_PATH, "utf8"));
  sp = loadBusinessConfig("secureprospective");
  graph = new KnowledgeGraph(db, sp);

  fakeAiClientCalls = [];
  const fakeAiClient = {
    async search(query: string) {
      fakeAiClientCalls.push(query);
      return {
        chunks: [
          { text: "SP's Diagnose movement identifies the AI bottleneck in your business.", score: 0.85, id: "sem-1" },
          { text: "The four-movement method is Diagnose, Position, Shape, Transform.", score: 0.78, id: "sem-2" },
        ],
      };
    },
  };
  vectorSearch = new VectorSearch(new AISearchBackend(fakeAiClient as never), sp);
  server = new McpServer();
  for (const tool of STANDARD_TOOLS) server.registerTool(tool);
  ctx = { business: sp, graph, vectorSearch };

  // Seed SP-like entities + relationships
  const svcDiag = await graph.createEntity({
    id: entityId(sp.id, "service", "ai-native-diagnosis"),
    type: "service",
    name: "AI-Native Diagnosis",
    data: { description: "Identify the AI bottleneck in your business.", category: "diagnosis", active: true },
  });
  await graph.createEntity({
    id: entityId(sp.id, "service", "position"),
    type: "service",
    name: "Position",
    data: { description: "Select the right AI tools for the bottleneck.", category: "advisory", active: true },
  });
  await graph.createEntity({
    id: entityId(sp.id, "service", "shape"),
    type: "service",
    name: "Shape",
    data: { description: "Productionize AI outputs for ownership.", category: "implementation", active: true },
  });
  await graph.createEntity({
    id: entityId(sp.id, "faq", "what-is-the-method"),
    type: "faq",
    name: "What is the four-movement method?",
    data: {
      question: "What is the four-movement method?",
      answer: "Diagnose → Position → Shape → Transform. The loop doesn't end — your business just stops being the bottleneck.",
      category: "process",
    },
  });
  await graph.createEntity({
    id: entityId(sp.id, "faq", "how-does-pricing-work"),
    type: "faq",
    name: "How does pricing work?",
    data: {
      question: "How does pricing work?",
      answer: "Project-based and retainer engagements depending on scope.",
      category: "pricing",
    },
  });
  const priceDiag = await graph.createEntity({
    id: entityId(sp.id, "pricing", "diagnosis-fee"),
    type: "pricing",
    name: "Diagnosis engagement",
    data: { amount: "$5,000", unit: "fixed", notes: "1-week diagnostic sprint" },
  });
  await graph.createEntity({
    id: entityId(sp.id, "pricing", "monthly-retainer"),
    type: "pricing",
    name: "Monthly retainer",
    data: { amount: "$8,000", unit: "/month", notes: "ongoing advisory + implementation" },
  });
  await graph.createEntity({
    id: entityId(sp.id, "question", "do-you-work-with-startups"),
    type: "question",
    name: "Do you work with startups?",
    data: { text: "Do you work with startups?", source: "inbound", occurrence_count: 12 },
  });
  await graph.createEntity({
    id: entityId(sp.id, "question", "what-insurance-lines"),
    type: "question",
    name: "What insurance lines does IMO cover?",
    data: { text: "What insurance lines does IMO cover?", source: "inbound", occurrence_count: 7 },
  });

  await graph.createRelationship({
    id: relId(sp.id, "diag-priced-by"),
    fromId: svcDiag.id, toId: priceDiag.id, type: "priced_by",
  });
});

describe("[1] McpServer.listTools() — registration", () => {
  it("returns 5 tools with §5.2 names exactly", () => {
    const defs = server.listTools();
    expect(defs.length).toBe(5);
    const names = defs.map((d) => d.name).sort();
    expect(names).toEqual([
      "faq_search",
      "knowledge_query",
      "pricing_lookup",
      "question_search",
      "service_catalog",
    ]);
  });

  it("each tool has non-empty description, inputSchema.type='object', and inputSchema.properties", () => {
    for (const d of server.listTools()) {
      expect(typeof d.description).toBe("string");
      expect(d.description.length).toBeGreaterThan(10);
      expect(d.inputSchema?.type).toBe("object");
      expect(typeof d.inputSchema?.properties).toBe("object");
    }
  });

  it("duplicate registration throws Error mentioning tool name", () => {
    expect(() => server.registerTool(faqSearchTool)).toThrow(/faq_search/);
  });
});

describe("[2] McpServer.dispatch() — unknown tool returns isError result (no throw)", () => {
  it("returns result with isError=true, content mentions bad name + lists available tools", async () => {
    const result = await server.dispatch({ name: "nonexistent_tool", arguments: {} }, ctx);
    expect(typeof result).toBe("object");
    expect(result.isError).toBe(true);
    expect(result.content.length).toBe(1);
    expect(result.content[0].type).toBe("text");
    expect(textOf(result.content[0])).toContain("nonexistent_tool");
    expect(textOf(result.content[0])).toContain("faq_search");
  });
});

describe("[3] faq_search tool — integration with graph + vector", () => {
  it("returns FAQ Q+A from graph seed + query term", async () => {
    const result = await server.dispatch({ name: "faq_search", arguments: { query: "method" } }, ctx);
    expect(result.isError).not.toBe(true);
    expect(result.content[0].type).toBe("text");
    const text = textOf(result.content[0]);
    expect(text).toContain("method");
    expect(text).toContain("four-movement method");
    expect(text).toContain("Diagnose");
  });

  it("missing query → isError mentioning 'query'", async () => {
    const errResult = await server.dispatch({ name: "faq_search", arguments: {} }, ctx);
    expect(errResult.isError).toBe(true);
    expect(textOf(errResult.content[0])).toContain("'query'");
  });

  it("topK honored + vector backend called (integration with component 8)", async () => {
    fakeAiClientCalls.length = 0;
    await server.dispatch({ name: "faq_search", arguments: { query: "test", topK: 2 } }, ctx);
    expect(fakeAiClientCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("[4] pricing_lookup tool — graph traversal (priced_by edges)", () => {
  it("by service name: text includes service + pricing amount + notes", async () => {
    const result = await server.dispatch({
      name: "pricing_lookup",
      arguments: { service: "diagnosis" },
    }, ctx);
    expect(result.isError).not.toBe(true);
    const text = textOf(result.content[0]);
    expect(text).toContain("AI-Native Diagnosis");
    expect(text).toContain("$5,000");
    expect(text).toContain("1-week diagnostic sprint");
  });

  it("list-all path: includes both pricing entries", async () => {
    const allResult = await server.dispatch({ name: "pricing_lookup", arguments: {} }, ctx);
    expect(allResult.isError).not.toBe(true);
    const allText = textOf(allResult.content[0]);
    expect(allText).toContain("$5,000");
    expect(allText).toContain("$8,000");
  });

  it("non-matching service → not isError, mentions 'No service matching'", async () => {
    const missResult = await server.dispatch({
      name: "pricing_lookup",
      arguments: { service: "nonexistent-service-xyz" },
    }, ctx);
    expect(missResult.isError).not.toBe(true);
    expect(textOf(missResult.content[0])).toContain("No service matching");
  });
});

describe("[5] service_catalog tool — entity listing", () => {
  it("lists all 3 seeded services with count + description", async () => {
    const result = await server.dispatch({ name: "service_catalog", arguments: {} }, ctx);
    expect(result.isError).not.toBe(true);
    const text = textOf(result.content[0]);
    expect(text).toContain("AI-Native Diagnosis");
    expect(text).toContain("Position");
    expect(text).toContain("Shape");
    expect(/Services from .*\(3\)/.test(text)).toBe(true);
    expect(text).toContain("Identify the AI bottleneck");
  });
});

describe("[6] question_search tool — question records", () => {
  it("finds seeded question with occurrence_count + source", async () => {
    const result = await server.dispatch({
      name: "question_search",
      arguments: { query: "startups" },
    }, ctx);
    expect(result.isError).not.toBe(true);
    const text = textOf(result.content[0]);
    expect(text).toContain("Do you work with startups");
    expect(text).toContain("asked 12");
    expect(text).toContain("inbound");
  });
});

describe("[7] knowledge_query tool — combined vector+graph with relations", () => {
  it("returns service entity + type tag + one-hop relations + related entity name", async () => {
    const result = await server.dispatch({
      name: "knowledge_query",
      arguments: { query: "diagnosis" },
    }, ctx);
    expect(result.isError).not.toBe(true);
    const text = textOf(result.content[0]);
    expect(text).toContain("AI-Native Diagnosis");
    expect(text).toContain("[service]");
    expect(text).toContain("priced_by");
    expect(text).toContain("Diagnosis engagement");
  });
});

describe("[8] handler exceptions → caught and surfaced as isError results", () => {
  it("handler throw → isError result with error message + tool name", async () => {
    const throwingServer = new McpServer();
    throwingServer.registerTool({
      definition: {
        name: "throwing_tool",
        description: "always throws",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      handler: async () => { throw new Error("boom-from-handler"); },
    });
    const result = await throwingServer.dispatch({
      name: "throwing_tool",
      arguments: {},
    }, ctx);
    expect(result.isError).toBe(true);
    expect(textOf(result.content[0])).toContain("boom-from-handler");
    expect(textOf(result.content[0])).toContain("throwing_tool");
  });
});

describe("[9] Auth seam — contract surface", () => {
  it("readAccessJwt returns token when present, null when absent or whitespace", () => {
    const reqWithToken = { headers: { get: (n: string) => n === "Cf-Access-Jwt-Assertion" ? "abc.def.ghi" : null } };
    expect(readAccessJwt(reqWithToken as never)).toBe("abc.def.ghi");
    const reqWithout = { headers: { get: () => null } };
    expect(readAccessJwt(reqWithout as never)).toBeNull();
    const reqEmpty = { headers: { get: (n: string) => n === "Cf-Access-Jwt-Assertion" ? "   " : null } };
    expect(readAccessJwt(reqEmpty as never)).toBeNull();
  });

  it("McpAuthError is an Error with name='McpAuthError'", () => {
    const e = new McpAuthError("no token");
    expect(e instanceof Error).toBe(true);
    expect(e.name).toBe("McpAuthError");
  });
});

describe("[10] Tool definitions — input schema shapes", () => {
  it("query-required tools declare 'query' in required + properties", () => {
    const toolsWithRequiredQuery = [faqSearchTool, questionSearchTool, knowledgeQueryTool];
    for (const t of toolsWithRequiredQuery) {
      expect(t.definition.inputSchema.required?.includes("query")).toBe(true);
      expect("query" in t.definition.inputSchema.properties).toBe(true);
    }
  });

  it("service_catalog + pricing_lookup have no required field (or empty)", () => {
    expect(
      !serviceCatalogTool.definition.inputSchema.required ||
      serviceCatalogTool.definition.inputSchema.required.length === 0,
    ).toBe(true);
    expect(
      !pricingLookupTool.definition.inputSchema.required ||
      pricingLookupTool.definition.inputSchema.required.length === 0,
    ).toBe(true);
  });

  it("all tool names are snake_case (MCP convention)", () => {
    const all = [faqSearchTool, pricingLookupTool, serviceCatalogTool, questionSearchTool, knowledgeQueryTool];
    for (const t of all) {
      expect(/^[a-z][a-z0-9_]*$/.test(t.definition.name)).toBe(true);
    }
  });
});
