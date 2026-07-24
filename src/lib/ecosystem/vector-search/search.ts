/**
 * VectorSearch — business-scoped semantic search over a pluggable backend.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 8), §1 (end product).
 *
 * §5.8's literal signature is `search(query, businessId, topK)`. This implementation
 * binds `businessId` at construction (matching the KnowledgeGraph pattern at
 * `src/lib/ecosystem/knowledge-graph/graph.ts:81`): callers can't accidentally query
 * across business boundaries, and a wrong-business call returns [] not a leak.
 * See `docs/ai-ecosystem/components/01_knowledge_graph.md` decision 3 for the same
 * rationale applied to graph scoping.
 *
 * Construction picks the backend (Vectorize or AI Search — each business has its own
 * binding at deploy time). Per-call `search()` only takes query + topK + opts.
 */

import type { BusinessConfig } from "../catalog/types";
import type {
  SearchOptions,
  SearchResult,
  VectorSearchBackend,
} from "./types";

export class VectorSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VectorSearchError";
  }
}

export class VectorSearch {
  constructor(
    private readonly backend: VectorSearchBackend,
    private readonly business: BusinessConfig,
  ) {}

  /**
   * Semantic search scoped to this business.
   *
   * @param query  natural-language question or keyword phrase
   * @param topK   max results (default 5, clamped to [1, 100] by the backend)
   * @param opts   optional backend-specific overrides (filter, namespace).
   *               `namespace` defaults to `business.id`; pass an explicit value
   *               only to override the business-scoped default.
   */
  async search(
    query: string,
    topK: number = 5,
    opts: Omit<SearchOptions, "topK"> = {},
  ): Promise<SearchResult[]> {
    const q = typeof query === "string" ? query.trim() : "";
    if (q.length === 0) return [];
    return this.backend.search(q, {
      topK,
      namespace: this.business.id,
      ...opts,
    });
  }
}
