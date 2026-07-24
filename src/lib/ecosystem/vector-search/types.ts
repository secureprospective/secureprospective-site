/**
 * Vector Search types.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 8), §2 (storage mapping).
 *
 * Two backend shapes are supported, both behind one interface:
 *   - Vectorize (Cloudflare's vector DB) — the canonical wireframe path.
 *   - AI Search (Cloudflare's managed RAG) — what `functions/api/ask.ts` already
 *     uses successfully in production today. The "if simpler" option from §5.8.
 *
 * A business picks its backend at deploy time (different Cloudflare binding per
 * business); the core `VectorSearch.search()` API stays identical either way.
 * This split is the literal mechanism behind §0's wireframe rule: core logic
 * knows nothing about which managed service a specific business happens to use.
 */

// ─────────────────────────────────────────────────────────────────────
// Public result types
// ─────────────────────────────────────────────────────────────────────

/** A single search hit, normalized across backends. */
export interface SearchResult {
  /** Backend-specific id (Vectorize vector id, AI Search chunk id, or synthetic). */
  id: string;
  /** Similarity/relevance score. Direction normalized: higher = better. */
  score: number;
  /** The matched text passage. */
  text: string;
  /** Backend-specific metadata (entity_id, source, namespace, etc.). Empty object if none. */
  metadata: Record<string, unknown>;
}

/** Options accepted by VectorSearch.search() and the backend interface. */
export interface SearchOptions {
  /** Max results. Default 5; backends clamp to [1, 100]. */
  topK?: number;
  /** Optional metadata filter (Vectorize only — passed through). AI Search ignores it. */
  filter?: Record<string, unknown>;
  /**
   * Optional namespace override. Defaults to `business.id` at the VectorSearch layer
   * (business-implicit scoping, matching the knowledge-graph pattern). AI Search
   * ignores it — AI Search instances are already per-business at deploy time.
   */
  namespace?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Backend interface
// ─────────────────────────────────────────────────────────────────────

/**
 * Backend contract. Both `VectorizeBackend` and `AISearchBackend` implement this.
 * `VectorSearch` is constructed with one backend + a `BusinessConfig`; it adds
 * business-scoping and query validation on top. Backends must not assume a
 * specific business — that's the caller's responsibility.
 *
 * Contract: `query` is guaranteed non-empty (trimmed) when called via VectorSearch;
 * direct callers must satisfy the same precondition.
 */
export interface VectorSearchBackend {
  search(query: string, opts: SearchOptions): Promise<SearchResult[]>;
}

// ─────────────────────────────────────────────────────────────────────
// Embedder seam (VectorizeBackend only)
// ─────────────────────────────────────────────────────────────────────

/**
 * Embedder — turns text into a vector. Required by VectorizeBackend (Vectorize
 * stores vectors, not text); not required by AISearchBackend (AI Search embeds
 * internally as part of its managed pipeline).
 *
 * Real implementation wraps Workers AI (e.g. `@cf/baai/bge-base-en-v1.5` or the
 * `@cf/qwen/qwen3-embedding-0.6b` model already deployed in SP's AI Search instance).
 * For local testing, a deterministic fake embedder lets the flow run end-to-end
 * without a real binding — see `/tmp/opencode/smoke-vector.mjs`.
 */
export interface Embedder {
  embed(text: string): Promise<number[]>;
}

// ─────────────────────────────────────────────────────────────────────
// Minimal Cloudflare type stubs (dep-free; same tradeoff as knowledge-graph)
// ─────────────────────────────────────────────────────────────────────

/**
 * Minimal VectorizeIndex interface — only the surface VectorizeBackend uses.
 *
 * Tradeoff (same as knowledge-graph/types.ts → D1Database): installing
 * `@cloudflare/workers-types` as a devDep would (a) supply the full type here
 * AND (b) resolve pre-existing tsc errors in `functions/api/{ask,lead}.ts`.
 * Kept local to keep this component's diff small and dep-free; CT105 can bless
 * the devDep change at review time.
 *
 * API shape verified against Cloudflare's public Vectorize docs.
 */
export interface VectorizeMatch {
  id: string | number;
  score: number;
  metadata?: Record<string, unknown> | null;
}

export interface VectorizeVector {
  id: string;
  values: number[];
  namespace?: string;
  metadata?: Record<string, unknown>;
}

export interface VectorizeQueryOptions {
  topK?: number;
  namespace?: string;
  returnValues?: boolean;
  returnMetadata?: boolean | "all";
  filter?: Record<string, unknown>;
}

export interface VectorizeIndex {
  query(
    vector: number[] | VectorizeVector,
    options?: VectorizeQueryOptions,
  ): Promise<VectorizeMatch[]>;
  upsert(vectors: VectorizeVector[]): Promise<void>;
  deleteByIds(ids: (string | number)[]): Promise<void>;
  describe?(): Promise<{
    vectorCount?: number;
    dimensions?: number;
    processedUpTo?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// AI Search client seam (AISearchBackend)
// ─────────────────────────────────────────────────────────────────────

/**
 * Minimal AI Search client interface — abstracts the REST call shape used by
 * `functions/api/ask.ts` so AISearchBackend can be tested without network.
 *
 * Cloudflare AI Search REST: `POST /accounts/{id}/ai-search/instances/{name}/search`
 * with body `{ "query": "..." }`. Response shape (the fields AISearchBackend reads):
 *   `{ "result": { "chunks": [{ "text" | "content", "score"?, ... }] } }`
 *
 * The interface decouples AISearchBackend from transport — REST today, the AI Search
 * binding tomorrow if CT105 swaps it.
 */
export interface AiSearchChunk {
  text?: string | string[];
  content?: string;
  score?: number;
  id?: string;
  metadata?: Record<string, unknown>;
}

export interface AiSearchResponse {
  chunks: AiSearchChunk[];
}

export interface AiSearchClient {
  search(query: string): Promise<AiSearchResponse>;
}
