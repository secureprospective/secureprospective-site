#!/usr/bin/env node
// scripts/citation-benchmark.mjs
//
// AI citation benchmark runner — component 10, §5.10 + §0.5.
//
// Modes:
//   1. AUTOMATED (LLM API keys in env): queries each configured LLM with every
//      fixture question, detects whether the target business is mentioned, and
//      writes a structured citation log to ./citation-results/<timestamp>.jsonl
//      plus a per-LLM summary to stdout.
//   2. MANUAL (no API keys): prints the fixture queries as a numbered list,
//      one block per LLM the user wants to test against, with instructions for
//      pasting them into ChatGPT / Perplexity / Gemini / Claude by hand and
//      logging responses via the --record flag.
//
// Supported env vars (CT105 wires these at production run time):
//   OPENAI_API_KEY     → queries ChatGPT (gpt-4o-mini default)
//   ANTHROPIC_API_KEY  → queries Claude (claude-3-5-sonnet default)
//   GEMINI_API_KEY     → queries Gemini (gemini-2.0-flash default)
//   PERPLEXITY_API_KEY → queries Perplexity (sonar default)
//
// Usage:
//   node scripts/citation-benchmark.mjs --business secureprospective
//   node scripts/citation-benchmark.mjs --business techfreedomministries --manual
//   node scripts/citation-benchmark.mjs --business secureprospective --record results.jsonl
//
// Lane rule: bird never calls real LLM APIs in CI / build; this script is the
// hand-off to Christopher / CT105 for actual benchmark runs. The fixture data
// and detection logic are in src/lib/ecosystem/monitoring/ — this file is just
// the CLI shell.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const FIXTURES_DIR = resolve(REPO_ROOT, "src/lib/ecosystem/monitoring/fixtures");
const RESULTS_DIR = resolve(REPO_ROOT, "citation-results");

// Parse args
const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
}
const businessId = arg("business");
const manualFlag = args.includes("--manual");
const recordPath = arg("record");

if (!businessId || !["secureprospective", "techfreedomministries"].includes(businessId)) {
  console.error("Usage: citation-benchmark.mjs --business <secureprospective|techfreedomministries> [--manual] [--record results.jsonl]");
  process.exit(1);
}

const fixture = JSON.parse(
  readFileSync(resolve(FIXTURES_DIR, `${businessId}.citation-queries.json`), "utf8"),
);

const BUSINESS_NAMES = {
  secureprospective: "SecureProspective",
  techfreedomministries: "Tech Freedom Ministries",
};

// ─────────────────────────────────────────────────────────────────────
// LLM clients (constructed from env vars; skipped if key absent)
// ─────────────────────────────────────────────────────────────────────

function makeOpenAiClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  return {
    name: `chatgpt (${model})`,
    async query(prompt) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
      const data = await r.json();
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

function makeAnthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
  return {
    name: `claude (${model})`,
    async query(prompt) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
      const data = await r.json();
      return (data.content ?? []).map((c) => c.text ?? "").join("\n");
    },
  };
}

function makeGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  return {
    name: `gemini (${model})`,
    async query(prompt) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
      const data = await r.json();
      return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("\n");
    },
  };
}

function makePerplexityClient() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  const model = process.env.PERPLEXITY_MODEL ?? "sonar";
  return {
    name: `perplexity (${model})`,
    async query(prompt) {
      const r = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) throw new Error(`Perplexity ${r.status}: ${await r.text()}`);
      const data = await r.json();
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

const AVAILABLE_CLIENTS = [
  makeOpenAiClient(),
  makeAnthropicClient(),
  makeGeminiClient(),
  makePerplexityClient(),
].filter(Boolean);

// ─────────────────────────────────────────────────────────────────────
// Mode dispatch
// ─────────────────────────────────────────────────────────────────────

if (manualFlag || AVAILABLE_CLIENTS.length === 0) {
  if (AVAILABLE_CLIENTS.length === 0 && !manualFlag) {
    console.error("\nNo LLM API keys found in env. Set one or more of:");
    console.error("  OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY");
    console.error("…or run with --manual for a printable prompt list.\n");
  }
  console.log(`\n=== Citation benchmark — MANUAL MODE (${businessId}) ===\n`);
  console.log(`Business: ${BUSINESS_NAMES[businessId]}`);
  console.log(`Queries:  ${fixture.queries.length}`);
  console.log(`\nPaste each query below into ChatGPT / Perplexity / Gemini / Claude`);
  console.log(`and note whether the business is mentioned in the response.\n`);
  for (const q of fixture.queries) {
    console.log(`[${q.id}] (${q.category})`);
    console.log(`  ${q.query}\n`);
  }
  console.log(`\nTo record results from manual runs:`);
  console.log(`  node scripts/citation-benchmark.mjs --business ${businessId} --record results.jsonl`);
  console.log(`\nThen add one JSON line per response, e.g.:`);
  console.log(`  {"queryId":"sp-001","llmName":"chatgpt","response":"...full text..."}\n`);
  process.exit(0);
}

// Automated mode
console.log(`\n=== Citation benchmark — AUTOMATED (${businessId}) ===`);
console.log(`LLMs: ${AVAILABLE_CLIENTS.map((c) => c.name).join(", ")}`);
console.log(`Queries: ${fixture.queries.length}\n`);

const results = [];
for (const q of fixture.queries) {
  for (const client of AVAILABLE_CLIENTS) {
    process.stdout.write(`  ${q.id} × ${client.name} … `);
    const start = Date.now();
    try {
      const response = await withTimeout(client.query(q.query), 30_000);
      const detection = detectMention(response, { id: businessId, name: BUSINESS_NAMES[businessId] });
      const result = {
        queryId: q.id,
        query: q.query,
        category: q.category,
        llmName: client.name,
        businessId,
        detection,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
      results.push(result);
      console.log(`${detection.mentioned ? `MENTIONED (${detection.shape})` : "no mention"} (${result.latencyMs}ms)`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      results.push({
        queryId: q.id,
        query: q.query,
        category: q.category,
        llmName: client.name,
        businessId,
        detection: { mentioned: false, shape: "none", error: e.message },
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - start,
      });
    }
  }
}

// Write results
mkdirSync(RESULTS_DIR, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = resolve(RESULTS_DIR, `${businessId}-${ts}.jsonl`);
const lines = results.map((r) => JSON.stringify(r)).join("\n");
writeFileSync(outFile, lines);
console.log(`\nResults written: ${outFile}`);

// Summary
const summary = summarizeResults(results, businessId);
console.log(`\n=== Summary ===`);
for (const s of summary) {
  console.log(`\n${s.llmName}: ${s.mentioned}/${s.total} mentioned (${(s.mentionRate * 100).toFixed(1)}%)`);
  console.log(`  by shape: ${JSON.stringify(s.byShape)}`);
  console.log(`  by category:`);
  for (const [cat, counts] of Object.entries(s.byCategory)) {
    console.log(`    ${cat}: ${counts.mentioned}/${counts.total}`);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers — minimal ports from the library (kept inline so this script has
// zero build step; just `node scripts/citation-benchmark.mjs`)
// ─────────────────────────────────────────────────────────────────────

function withTimeout(p, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

function detectMention(responseText, business) {
  const domain = business.id === "secureprospective"
    ? "secureprospective.com"
    : business.id === "techfreedomministries"
      ? "techfreedomministries.org"
      : `${business.id}.com`;
  const url = `https://${domain}`;
  const name = business.name.toLowerCase();
  const text = responseText.toLowerCase();
  const urlIdx = text.indexOf(url);
  if (urlIdx >= 0) return { mentioned: true, shape: "url", excerpt: excerptAround(responseText, urlIdx, url.length) };
  const domIdx = text.indexOf(domain);
  if (domIdx >= 0) return { mentioned: true, shape: "domain", excerpt: excerptAround(responseText, domIdx, domain.length) };
  const nameIdx = text.indexOf(name);
  if (nameIdx >= 0) return { mentioned: true, shape: "name", excerpt: excerptAround(responseText, nameIdx, name.length) };
  return { mentioned: false, shape: "none" };
}

function excerptAround(original, matchStart, matchLen) {
  const window = 60;
  const start = Math.max(0, matchStart - window);
  const end = Math.min(original.length, matchStart + matchLen + window);
  return (start > 0 ? "…" : "") + original.slice(start, end) + (end < original.length ? "…" : "");
}

function summarizeResults(results, businessId) {
  const byLlm = new Map();
  for (const r of results) {
    if (!byLlm.has(r.llmName)) byLlm.set(r.llmName, []);
    byLlm.get(r.llmName).push(r);
  }
  const summaries = [];
  for (const [llmName, rows] of byLlm) {
    const total = rows.length;
    const mentioned = rows.filter((r) => r.detection.mentioned).length;
    const byShape = {};
    const byCategory = {};
    for (const r of rows) {
      byShape[r.detection.shape] = (byShape[r.detection.shape] ?? 0) + 1;
      const slot = byCategory[r.category] ?? { total: 0, mentioned: 0 };
      slot.total += 1;
      if (r.detection.mentioned) slot.mentioned += 1;
      byCategory[r.category] = slot;
    }
    summaries.push({ llmName, businessId, total, mentioned, mentionRate: total > 0 ? mentioned / total : 0, byShape, byCategory });
  }
  return summaries;
}
