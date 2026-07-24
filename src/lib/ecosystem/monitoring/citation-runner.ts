import type { BusinessConfig } from "../catalog";
import {
  type CitationFixture,
  type MentionDetection,
  detectMention,
} from "./citation-fixture";

/**
 * Citation-rate runner (component 10, §5.10 + §0.5).
 *
 * Scriptable runner that queries external LLMs (ChatGPT/Perplexity/Gemini/Claude)
 * with the fixture queries and logs whether/how the business gets mentioned.
 *
 * Lane rule applied: external LLM API calls need keys + network — that's
 * CT105's wiring lane at production time, and Christopher's manual lane for
 * one-off benchmark runs. Bird provides:
 *   - the runner shape (this file)
 *   - the LLMClient injection seam (real clients are constructed at run time
 *     from env vars; the runner itself is client-agnostic)
 *   - the result format + per-result mention detection
 *
 * Per §5.10: "manual/scriptable runner that queries ChatGPT/Perplexity/Gemini/
 * Claude." The CLI script under scripts/citation-benchmark.mjs wires real
 * clients from env vars (or falls back to printing the prompt list for manual
 * copy-paste when no keys are set).
 */

/** A single LLM backend the runner can query. Implementations live in the CLI. */
export interface LlmClient {
  /** Display name — appears in the result log so each row is attributable. */
  name: string;
  /** Query the LLM with a prompt; return the response text verbatim. */
  query(prompt: string): Promise<string>;
}

export interface CitationResult {
  queryId: string;
  query: string;
  category: string;
  llmName: string;
  businessId: string;
  detection: MentionDetection;
  timestamp: string;
  latencyMs: number;
}

export interface RunnerOptions {
  /** Per-LLM timeout in ms; default 30s. Throws TimeoutError on expiry. */
  timeoutMs?: number;
  /** Called for each completed result; useful for streaming progress. */
  onResult?: (r: CitationResult) => void;
}

export class CitationRunner {
  constructor(
    private readonly fixture: CitationFixture,
    private readonly business: BusinessConfig,
    private readonly clients: LlmClient[],
  ) {
    if (clients.length === 0) {
      throw new Error("CitationRunner requires at least one LlmClient");
    }
  }

  /**
   * Run all fixture queries against all clients. Returns one CitationResult
   * per (query × client) pair.
   */
  async runAll(opts: RunnerOptions = {}): Promise<CitationResult[]> {
    const results: CitationResult[] = [];
    for (const q of this.fixture.queries) {
      for (const client of this.clients) {
        const r = await this.runOne(q.id, client, opts);
        results.push(r);
        opts.onResult?.(r);
      }
    }
    return results;
  }

  /** Run a single query against a single client. */
  async runOne(
    queryId: string,
    client: LlmClient,
    opts: RunnerOptions = {},
  ): Promise<CitationResult> {
    const query = this.fixture.queries.find((q) => q.id === queryId);
    if (!query) {
      throw new Error(`Unknown queryId: ${queryId}`);
    }
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const start = Date.now();
    const response = await withTimeout(client.query(query.query), timeoutMs, client.name);
    const latencyMs = Date.now() - start;
    const detection = detectMention(response, this.business);
    return {
      queryId: query.id,
      query: query.query,
      category: query.category,
      llmName: client.name,
      businessId: this.business.id,
      detection,
      timestamp: new Date().toISOString(),
      latencyMs,
    };
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number, clientName: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(clientName, ms)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class TimeoutError extends Error {
  constructor(clientName: string, ms: number) {
    super(`LLM client '${clientName}' exceeded ${ms}ms timeout`);
    this.name = "TimeoutError";
  }
}

/**
 * Tally results into a per-LLM mention-rate summary. The number component 10's
 * spec describes ("logs whether/how SP or TFM gets mentioned") — this is the
 * structured rollup.
 */
export interface MentionSummary {
  llmName: string;
  businessId: string;
  total: number;
  mentioned: number;
  mentionRate: number;
  byShape: Record<string, number>;
  byCategory: Record<string, { total: number; mentioned: number }>;
}

export function summarizeResults(results: CitationResult[]): MentionSummary[] {
  const byLlm = new Map<string, CitationResult[]>();
  for (const r of results) {
    const arr = byLlm.get(r.llmName) ?? [];
    arr.push(r);
    byLlm.set(r.llmName, arr);
  }
  const summaries: MentionSummary[] = [];
  for (const [llmName, rows] of byLlm) {
    const total = rows.length;
    const mentionedRows = rows.filter((r) => r.detection.mentioned);
    const mentioned = mentionedRows.length;
    const byShape: Record<string, number> = {};
    for (const r of rows) {
      byShape[r.detection.shape] = (byShape[r.detection.shape] ?? 0) + 1;
    }
    const byCategory: Record<string, { total: number; mentioned: number }> = {};
    for (const r of rows) {
      const slot = byCategory[r.category] ?? { total: 0, mentioned: 0 };
      slot.total += 1;
      if (r.detection.mentioned) slot.mentioned += 1;
      byCategory[r.category] = slot;
    }
    summaries.push({
      llmName,
      businessId: rows[0]?.businessId ?? "",
      total,
      mentioned,
      mentionRate: total > 0 ? mentioned / total : 0,
      byShape,
      byCategory,
    });
  }
  return summaries;
}
