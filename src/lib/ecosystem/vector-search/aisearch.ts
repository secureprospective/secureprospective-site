/**
 * AISearchBackend — semantic search via Cloudflare AI Search REST.
 *
 * This is the "if simpler" path from §5.8, and it's what `functions/api/ask.ts`
 * already uses successfully in production for SP's chatbot. AI Search handles
 * embedding+retrieval internally; no separate Embedder is needed.
 *
 * Pulling this logic up into a reusable backend means a future refactor of ask.ts
 * (per §3 "Existing chatbot" row — only after the agent core is proven independently)
 * becomes a one-line swap to `vectorSearch.search()`. ask.ts is NOT refactored here;
 * this file only provides the same retrieval logic in a reusable shape.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 8), §2 (AI Search row).
 */

import type {
  AiSearchChunk,
  AiSearchClient,
  SearchOptions,
  SearchResult,
  VectorSearchBackend,
} from "./types";

export class AISearchBackend implements VectorSearchBackend {
  constructor(private readonly client: AiSearchClient) {}

  async search(query: string, opts: SearchOptions): Promise<SearchResult[]> {
    // AI Search doesn't expose topK as a request param in the same way Vectorize does —
    // it returns its own ranked chunk list. We trim to topK after the fact.
    const topK = clampTopK(opts.topK);
    const response = await this.client.search(query);
    const results = (response.chunks ?? []).map((c, i) => toSearchResult(c, i));
    // AI Search is namespace-agnostic (instances are per-business at deploy time);
    // opts.namespace is intentionally ignored here.
    return results.slice(0, topK);
  }
}

function toSearchResult(c: AiSearchChunk, fallbackIdx: number): SearchResult {
  let text = c.text;
  if (Array.isArray(text)) text = text.join(" ");
  return {
    id: c.id ?? `chunk-${fallbackIdx}`,
    score: typeof c.score === "number" ? c.score : 0,
    text: typeof text === "string" ? text : (c.content ?? ""),
    metadata: c.metadata ?? {},
  };
}

function clampTopK(n: number | undefined): number {
  if (n === undefined || !Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(Math.trunc(n), 100));
}

// ─────────────────────────────────────────────────────────────────────
// REST client — generalizes what ask.ts does ad hoc
// ─────────────────────────────────────────────────────────────────────

/**
 * REST-backed AiSearchClient. Mirrors the call shape `functions/api/ask.ts` already
 * makes successfully in production (lines 73-90 of that file). Token stays server-side
 * (Pages secret); this class never reaches the client.
 *
 * Usage:
 *   const client = new RestClientAiSearchClient({
 *     accountId: "...",
 *     apiToken: env.CF_API_TOKEN,
 *     instanceName: "ccwork-resume",
 *   });
 *   const backend = new AISearchBackend(client);
 *   const vs = new VectorSearch(backend, loadBusinessConfig("secureprospective"));
 *   const results = await vs.search(question);
 */
export interface RestClientAiSearchOptions {
  accountId: string;
  apiToken: string;
  instanceName: string;
  /** Override fetch (defaults to global). Useful for testing or proxy injection. */
  fetchImpl?: typeof fetch;
}

export class RestClientAiSearchClient implements AiSearchClient {
  private readonly fetchImpl: typeof fetch;
  private readonly url: string;
  private readonly headers: Record<string, string>;

  constructor(opts: RestClientAiSearchOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai-search/instances/${opts.instanceName}/search`;
    this.headers = {
      Authorization: `Bearer ${opts.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  async search(query: string): Promise<{ chunks: AiSearchChunk[] }> {
    const r = await this.fetchImpl(this.url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ query }),
    });
    if (!r.ok) {
      throw new Error(
        `AI Search request failed: ${r.status} ${r.statusText}`,
      );
    }
    const data = (await r.json()) as {
      result?: { chunks?: AiSearchChunk[] };
    };
    return { chunks: data?.result?.chunks ?? [] };
  }
}
