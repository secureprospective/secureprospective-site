import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  Logger,
  ConsoleJsonLogSink,
  detectMention,
  CitationRunner,
  summarizeResults,
  TimeoutError,
  validateWithSchema,
  AjvNotInstalledError,
  type CitationFixture,
  type CitationResult,
  type LlmClient,
} from "./index";
import type { BusinessConfig } from "../catalog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SP_FIXTURE_PATH = resolve(__dirname, "./fixtures/secureprospective.citation-queries.json");
const TFM_FIXTURE_PATH = resolve(__dirname, "./fixtures/techfreedomministries.citation-queries.json");

/**
 * Component 10 (§5.10) Vitest checks for the monitoring module:
 *   - logger
 *   - citation fixture loader + detectMention + runner
 *   - summarizeResults
 *   - Ajv validator seam (AjvNotInstalledError fallback path)
 */

// ─────────────────────────────────────────────────────────────────────
// 1. Logger
// ─────────────────────────────────────────────────────────────────────

describe("Logger", () => {
  it("default sink is ConsoleJsonLogSink; injectable sink captures", () => {
    const captured: string[] = [];
    const sink: { log: (level: string, event: string, fields: Record<string, unknown>) => void } = {
      log(level, event, fields) {
        captured.push(JSON.stringify({ level, event, fields }));
      },
    };
    const logger = new Logger({ sink: sink as never, defaults: { business_id: "sp" } });
    logger.info("agent_answered", { question: "hi", toolCalls: 2 });
    expect(captured.length).toBe(1);
    const parsed = JSON.parse(captured[0]);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("agent_answered");
    expect(parsed.fields.business_id).toBe("sp");
    expect(parsed.fields.question).toBe("hi");
    expect(parsed.fields.toolCalls).toBe(2);
  });

  it(".child() merges defaults; parent unaffected", () => {
    const captured: Array<{ fields: Record<string, unknown> }> = [];
    const sink = {
      log(level: string, event: string, fields: Record<string, unknown>) {
        captured.push({ fields: { level, event, ...fields } });
      },
    };
    const parent = new Logger({ sink: sink as never, defaults: { a: 1 } });
    const child = parent.child({ b: 2 });
    parent.info("p");
    child.info("c", { c: 3 });
    expect(captured.length).toBe(2);
    expect(captured[0].fields.a).toBe(1);
    expect(captured[0].fields.b).toBeUndefined();
    expect(captured[1].fields.a).toBe(1);
    expect(captured[1].fields.b).toBe(2);
    expect(captured[1].fields.c).toBe(3);
  });

  it("debug/info route through log; warn/error through error (ConsoleJsonLogSink)", () => {
    const origLog = console.log;
    const origErr = console.error;
    const logLines: string[] = [];
    const errLines: string[] = [];
    console.log = (s: string) => logLines.push(s);
    console.error = (s: string) => errLines.push(s);
    try {
      const logger = new Logger();
      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");
      expect(logLines.length).toBe(2);
      expect(errLines.length).toBe(2);
      expect(JSON.parse(logLines[0]).level).toBe("debug");
      expect(JSON.parse(logLines[1]).level).toBe("info");
      expect(JSON.parse(errLines[0]).level).toBe("warn");
      expect(JSON.parse(errLines[1]).level).toBe("error");
    } finally {
      console.log = origLog;
      console.error = origErr;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. Fixture loading (data well-formedness)
// ─────────────────────────────────────────────────────────────────────

describe("Citation fixtures (checked-in data)", () => {
  it("SP fixture: 30-100 queries, all well-formed", () => {
    const f = JSON.parse(readFileSync(SP_FIXTURE_PATH, "utf8")) as CitationFixture;
    expect(f.businessId).toBe("secureprospective");
    expect(f.queries.length).toBeGreaterThanOrEqual(30);
    expect(f.queries.length).toBeLessThanOrEqual(100);
    const ids = new Set<string>();
    for (const q of f.queries) {
      expect(typeof q.id).toBe("string");
      expect(typeof q.query).toBe("string");
      expect(q.query.length).toBeGreaterThan(0);
      expect(["direct-intent", "discovery", "comparative", "vertical-specific", "brand-probe"]).toContain(q.category);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
    }
  });

  it("TFM fixture: 30-100 queries, all well-formed", () => {
    const f = JSON.parse(readFileSync(TFM_FIXTURE_PATH, "utf8")) as CitationFixture;
    expect(f.businessId).toBe("techfreedomministries");
    expect(f.queries.length).toBeGreaterThanOrEqual(30);
    expect(f.queries.length).toBeLessThanOrEqual(100);
    for (const q of f.queries) {
      expect(typeof q.id).toBe("string");
      expect(typeof q.query).toBe("string");
      expect(q.query.length).toBeGreaterThan(0);
      expect(["direct-intent", "discovery", "comparative", "vertical-specific", "brand-probe"]).toContain(q.category);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. detectMention
// ─────────────────────────────────────────────────────────────────────

describe("detectMention", () => {
  const SP = { id: "secureprospective", name: "SecureProspective" } as Pick<BusinessConfig, "id" | "name">;
  const TFM = { id: "techfreedomministries", name: "Tech Freedom Ministries" } as Pick<BusinessConfig, "id" | "name">;

  it("URL match wins (most specific)", () => {
    const text = "I'd suggest checking https://secureprospective.com for that.";
    const d = detectMention(text, SP);
    expect(d.mentioned).toBe(true);
    expect(d.shape).toBe("url");
    expect(d.excerpt).toBeTruthy();
    expect(d.excerpt).toContain("https://secureprospective.com");
  });

  it("Domain match (bare, no scheme)", () => {
    const text = "Try secureprospective.com — they specialize in this.";
    const d = detectMention(text, SP);
    expect(d.mentioned).toBe(true);
    expect(d.shape).toBe("domain");
  });

  it("Name match (least specific)", () => {
    const text = "I've heard SecureProspective is good.";
    const d = detectMention(text, SP);
    expect(d.mentioned).toBe(true);
    expect(d.shape).toBe("name");
  });

  it("No mention", () => {
    const text = "McKinsey and BCG are the typical choices for that.";
    const d = detectMention(text, SP);
    expect(d.mentioned).toBe(false);
    expect(d.shape).toBe("none");
  });

  it("Case-insensitive name match", () => {
    const text = "I think secureprospective does this.";
    const d = detectMention(text, SP);
    expect(d.mentioned).toBe(true);
  });

  it("TFM uses .org domain", () => {
    const text = "techfreedomministries.org might be relevant";
    const d = detectMention(text, TFM);
    expect(d.mentioned).toBe(true);
    expect(d.shape).toBe("domain");
  });

  it("Excerpt has ellipsis when window trims", () => {
    const longText = "x".repeat(200) + " SecureProspective " + "y".repeat(200);
    const d = detectMention(longText, SP);
    expect(d.excerpt).toBeTruthy();
    expect(d.excerpt?.startsWith("…")).toBe(true);
    expect(d.excerpt?.endsWith("…")).toBe(true);
  });

  it("Excerpt no leading ellipsis when match is near start", () => {
    const text = "SecureProspective is the right answer here.";
    const d = detectMention(text, SP);
    expect(d.excerpt?.startsWith("…")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. CitationRunner
// ─────────────────────────────────────────────────────────────────────

describe("CitationRunner", () => {
  const fixture: CitationFixture = {
    businessId: "test-biz",
    version: "test",
    queries: [
      { id: "q1", query: "Who does this?", category: "direct-intent" },
      { id: "q2", query: "What is this?", category: "discovery" },
    ],
  };
  const business = {
    id: "test-biz",
    name: "TestBiz",
  } as BusinessConfig;

  it("rejects empty clients list", () => {
    expect(() => new CitationRunner(fixture, business, [])).toThrow();
  });

  it("runs all queries × all clients", async () => {
    const client: LlmClient = {
      name: "FakeLLM",
      async query(prompt: string) {
        return `Response to: ${prompt}. Mention TestBiz here.`;
      },
    };
    const runner = new CitationRunner(fixture, business, [client]);
    const results = await runner.runAll();
    expect(results.length).toBe(2);
    expect(results.every((r) => r.llmName === "FakeLLM")).toBe(true);
    expect(results.every((r) => r.detection.mentioned)).toBe(true);
    expect(results.every((r) => typeof r.latencyMs === "number" && r.latencyMs >= 0)).toBe(true);
  });

  it("onResult callback fires per result", async () => {
    const client: LlmClient = { name: "C", async query() { return "no mention"; } };
    const runner = new CitationRunner(fixture, business, [client]);
    const seen: string[] = [];
    await runner.runAll({ onResult: (r) => seen.push(r.queryId) });
    expect(seen).toEqual(["q1", "q2"]);
  });

  it("runOne throws on unknown queryId", async () => {
    const client: LlmClient = { name: "C", async query() { return ""; } };
    const runner = new CitationRunner(fixture, business, [client]);
    await expect(runner.runOne("nope", client)).rejects.toThrow(/Unknown queryId/);
  });

  it("timeout fires when client exceeds timeoutMs", async () => {
    const slowClient: LlmClient = {
      name: "SlowLLM",
      async query() {
        return new Promise<string>((resolve) => setTimeout(() => resolve("late"), 200));
      },
    };
    const runner = new CitationRunner(fixture, business, [slowClient]);
    await expect(runner.runOne("q1", slowClient, { timeoutMs: 50 })).rejects.toBeInstanceOf(TimeoutError);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. summarizeResults
// ─────────────────────────────────────────────────────────────────────

describe("summarizeResults", () => {
  it("groups by LLM, computes mentionRate + byShape + byCategory", () => {
    const results: CitationResult[] = [
      { queryId: "q1", query: "a", category: "direct-intent", llmName: "L1", businessId: "sp",
        detection: { mentioned: true, shape: "domain" }, timestamp: "t", latencyMs: 1 },
      { queryId: "q2", query: "b", category: "discovery", llmName: "L1", businessId: "sp",
        detection: { mentioned: false, shape: "none" }, timestamp: "t", latencyMs: 1 },
      { queryId: "q1", query: "a", category: "direct-intent", llmName: "L2", businessId: "sp",
        detection: { mentioned: true, shape: "name" }, timestamp: "t", latencyMs: 1 },
    ];
    const summaries = summarizeResults(results);
    expect(summaries.length).toBe(2);
    const l1 = summaries.find((s) => s.llmName === "L1");
    expect(l1?.total).toBe(2);
    expect(l1?.mentioned).toBe(1);
    expect(l1?.mentionRate).toBe(0.5);
    expect(l1?.byShape.domain).toBe(1);
    expect(l1?.byShape.none).toBe(1);
    expect(l1?.byCategory["direct-intent"]).toEqual({ total: 1, mentioned: 1 });
    expect(l1?.byCategory.discovery).toEqual({ total: 1, mentioned: 0 });
  });

  it("empty input → empty summary", () => {
    expect(summarizeResults([])).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 6. Ajv validator seam
// ─────────────────────────────────────────────────────────────────────

describe("validateWithSchema (Ajv seam)", () => {
  it("throws AjvNotInstalledError when ajv is missing (LEAD #4 fallback path)", async () => {
    // ajv is not installed on this branch by design (Christopher's ruling pending).
    // If a future session installs it, this test should be updated to either
    // (a) mock the import or (b) move to a true positive-validation test.
    try {
      await validateWithSchema({ a: 1 }, { type: "object" });
      // If we got here, ajv IS installed — flag so the test gets revisited.
      expect.fail("ajv appears to be installed — LEAD #4 may have been resolved; update this test");
    } catch (e) {
      expect(e).toBeInstanceOf(AjvNotInstalledError);
    }
  });

  it("AjvNotInstalledError message names LEAD #4 + suggests install", () => {
    const e = new AjvNotInstalledError();
    expect(e.message).toContain("LEAD #4");
    expect(e.message).toContain("npm install ajv");
    expect(e.name).toBe("AjvNotInstalledError");
  });
});
