import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { Agent, AgentError, TemplatedComposer, defaultHeuristicRouter } from "./index";
import { McpServer, STANDARD_TOOLS } from "../mcp";
import { KnowledgeGraph, entityId, relId } from "../knowledge-graph";
import { loadBusinessConfig } from "../catalog";
import { VectorSearch, AISearchBackend } from "../vector-search";
import { MockD1 } from "../testing";
import type { McpToolContext } from "../mcp/types";

/**
 * Ported from /tmp/opencode/smoke-agent.mjs (session 2 of ai-ecosystem-scaffold).
 * Component 10 (§5.10): permanent Vitest home for the §8 P0 thread checks
 * (catalog → graph → vector → MCP tool call → AGENT ANSWER), end-to-end.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(__dirname, "../../../../migrations/0001_ecosystem_knowledge_graph.sql");

let sp: ReturnType<typeof loadBusinessConfig>;
let graph: KnowledgeGraph;
let ctx: McpToolContext;
let server: McpServer;
let agent: Agent;

beforeAll(async () => {
  const db = new MockD1();
  db.applyMigration(readFileSync(MIGRATION_PATH, "utf8"));
  sp = loadBusinessConfig("secureprospective");
  graph = new KnowledgeGraph(db, sp);
  const fakeAiClient = {
    async search() {
      return { chunks: [
        { text: "SP's Diagnose movement identifies the AI bottleneck.", score: 0.85, id: "sem-1" },
      ]};
    },
  };
  const vectorSearch = new VectorSearch(new AISearchBackend(fakeAiClient as never), sp);
  server = new McpServer();
  for (const t of STANDARD_TOOLS) server.registerTool(t);
  ctx = { business: sp, graph, vectorSearch };

  const svcDiag = await graph.createEntity({
    id: entityId(sp.id, "service", "ai-native-diagnosis"),
    type: "service", name: "AI-Native Diagnosis",
    data: { description: "Identify the AI bottleneck in your business.", category: "diagnosis" },
  });
  await graph.createEntity({
    id: entityId(sp.id, "service", "position"),
    type: "service", name: "Position",
    data: { description: "Select the right AI tools.", category: "advisory" },
  });
  const priceDiag = await graph.createEntity({
    id: entityId(sp.id, "pricing", "diagnosis-fee"),
    type: "pricing", name: "Diagnosis engagement",
    data: { amount: "$5,000", unit: "fixed", notes: "1-week diagnostic sprint" },
  });
  const faqMethod = await graph.createEntity({
    id: entityId(sp.id, "faq", "what-is-the-method"),
    type: "faq", name: "What is the four-movement method?",
    data: { question: "What is the four-movement method?", answer: "Diagnose → Position → Shape → Transform." },
  });
  await graph.createRelationship({
    id: relId(sp.id, "diag-priced"),
    fromId: svcDiag.id, toId: priceDiag.id, type: "priced_by",
  });
  await graph.createRelationship({
    id: relId(sp.id, "diag-faq"),
    fromId: svcDiag.id, toId: faqMethod.id, type: "has_answer_for",
  });

  agent = new Agent(server, ctx);
});

describe("[1] defaultHeuristicRouter — routing decisions", () => {
  const cases = [
    { q: "How much does AI-Native Diagnosis cost?", expect: "pricing_lookup" },
    { q: "what's the price for diagnosis", expect: "pricing_lookup" },
    { q: "What services do you offer?", expect: "service_catalog" },
    { q: "list your services", expect: "service_catalog" },
    { q: "What do other customers ask about?", expect: "question_search" },
    { q: "Show me the FAQ", expect: "faq_search" },
    { q: "frequently asked questions", expect: "faq_search" },
    { q: "Tell me about your method", expect: "knowledge_query" },
    { q: "random unrelated text", expect: "knowledge_query" },
  ];
  for (const c of cases) {
    it(`'${c.q}' → ${c.expect}`, () => {
      const calls = defaultHeuristicRouter(c.q);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].name).toBe(c.expect);
    });
  }

  it("pricing router extracts service name", () => {
    const priced = defaultHeuristicRouter("How much for AI-Native Diagnosis?");
    expect(priced[0].name).toBe("pricing_lookup");
    expect(typeof priced[0].arguments.service).toBe("string");
    expect((priced[0].arguments.service as string).length).toBeGreaterThan(0);
  });

  it("router never returns [] (always at least one call)", () => {
    expect(defaultHeuristicRouter("").length).toBeGreaterThanOrEqual(1);
  });
});

describe("[2] Agent.answer — pricing question (full §8 thread)", () => {
  it("routes to pricing_lookup and composes answer with seeded price + business name", async () => {
    const response = await agent.answer("How much does AI-Native Diagnosis cost?");
    expect(typeof response).toBe("object");
    expect(response).not.toBeNull();
    expect(response.toolCalls.some((c) => c.name === "pricing_lookup")).toBe(true);
    expect(response.answer).toContain("$5,000");
    expect(response.answer).toContain("SecureProspective");
    expect(response.noContext).toBe(false);
    expect(response.toolResults.length).toBeGreaterThan(0);
  });
});

describe("[3] Agent.answer — service catalog question", () => {
  it("routes to service_catalog and lists seeded services", async () => {
    const response = await agent.answer("What services do you offer?");
    expect(response.toolCalls[0]?.name).toBe("service_catalog");
    expect(response.answer).toContain("AI-Native Diagnosis");
    expect(response.answer).toContain("Position");
    expect(response.noContext).toBe(false);
  });
});

describe("[4] Agent.answer — knowledge question", () => {
  it("answer includes FAQ content (Diagnose)", async () => {
    const response = await agent.answer("What is the four-movement method?");
    expect(response.answer).toContain("Diagnose");
    expect(response.noContext).toBe(false);
  });
});

describe("[5] Agent.answer — true no-context path", () => {
  it("all-error tool results → noContext=true with refusal answer + toolCalls still recorded", async () => {
    const throwingServer = new McpServer();
    throwingServer.registerTool({
      definition: {
        name: "always_errors",
        description: "test tool",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      handler: async () => ({
        isError: true,
        content: [{ type: "text", text: "tool is broken" }],
      }),
    });
    const errorAgent = new Agent(throwingServer, ctx, {
      router: () => [{ name: "always_errors", arguments: {} }],
    });
    const response = await errorAgent.answer("anything");
    expect(response.noContext).toBe(true);
    expect(response.answer).toContain("SecureProspective");
    expect(response.answer.toLowerCase()).toContain("don't have information");
    expect(response.toolCalls.length).toBe(1);
  });
});

describe("[6] Agent.answer — input validation", () => {
  it("empty question throws AgentError", async () => {
    await expect(agent.answer("")).rejects.toBeInstanceOf(AgentError);
  });
  it("whitespace-only throws AgentError", async () => {
    await expect(agent.answer("   ")).rejects.toBeInstanceOf(AgentError);
  });
  it("null question throws AgentError", async () => {
    await expect(agent.answer(null as unknown as string)).rejects.toBeInstanceOf(AgentError);
  });
});

describe("[7] Composer pluggability", () => {
  it("custom composer output used (overrides default)", async () => {
    const customComposer = {
      async compose(_q: string, toolResults: unknown[], business: { name: string }) {
        return `[CUSTOM] ${business.name}: ${toolResults.length} tool results`;
      },
    };
    const customAgent = new Agent(server, ctx, { composer: customComposer as never });
    const response = await customAgent.answer("How much does diagnosis cost?");
    expect(response.answer.startsWith("[CUSTOM]")).toBe(true);
    expect(response.answer).toContain("SecureProspective");
  });
});

describe("[8] Router pluggability", () => {
  it("custom router wins over default heuristic + still produces an answer", async () => {
    const customRouter = () => [{ name: "service_catalog", arguments: {} }];
    const customAgent = new Agent(server, ctx, { router: customRouter });
    const response = await customAgent.answer("anything at all");
    expect(response.toolCalls[0]?.name).toBe("service_catalog");
    expect(response.answer.length).toBeGreaterThan(0);
  });
});

describe("[9] TemplatedComposer — standalone behavior", () => {
  const tc = new TemplatedComposer();
  it("empty results → refusal", async () => {
    const empty = await tc.compose("any question", [], sp);
    expect(empty).toContain("don't have information");
  });
  it("error-only results → refusal", async () => {
    const errs = await tc.compose("q", [{ isError: true, content: [{ type: "text", text: "boom" }] }], sp);
    expect(errs).toContain("don't have information");
  });
  it("real result forwards text + business-voice intro", async () => {
    const ok = await tc.compose("q", [{
      isError: false,
      content: [{ type: "text", text: "Useful answer here." }],
    }], sp);
    expect(ok).toContain("Useful answer here.");
    expect(ok).toContain("SecureProspective");
  });
});

describe("[10] Response carries tool-call trace (observability)", () => {
  it("toolCalls + toolResults arrays populated and well-formed", async () => {
    const response = await agent.answer("How much for diagnosis?");
    expect(Array.isArray(response.toolCalls)).toBe(true);
    expect(response.toolCalls.length).toBeGreaterThan(0);
    expect(response.toolCalls.every((c) => typeof c.name === "string" && typeof c.arguments === "object")).toBe(true);
    expect(response.toolResults.length).toBe(response.toolCalls.length);
    expect(response.toolResults.every((r) => Array.isArray(r.content))).toBe(true);
  });
});
