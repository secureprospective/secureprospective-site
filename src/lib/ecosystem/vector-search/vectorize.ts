/**
 * VectorizeBackend — semantic search via Cloudflare Vectorize.
 *
 * The canonical wireframe path (§5.8). Bird cannot reach a real Vectorize binding;
 * this file is verified by `tsc --noEmit` + a smoke test against a fake
 * VectorizeIndex + fake Embedder. CT105 wires the real binding at deploy time per
 * the §3 deployment map ("Vectors" row).
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 8), §2 (Vectorize row).
 */

import type {
  Embedder,
  SearchOptions,
  SearchResult,
  VectorizeIndex,
  VectorizeMatch,
  VectorSearchBackend,
} from "./types";

export class VectorizeBackend implements VectorSearchBackend {
  constructor(
    private readonly index: VectorizeIndex,
    private readonly embedder: Embedder,
  ) {}

  async search(query: string, opts: SearchOptions): Promise<SearchResult[]> {
    const topK = clampTopK(opts.topK);
    const vector = await this.embedder.embed(query);
    const queryOpts: Record<string, unknown> = {
      topK,
      returnMetadata: "all",
    };
    if (opts.namespace) queryOpts.namespace = opts.namespace;
    if (opts.filter) queryOpts.filter = opts.filter;
    const matches = await this.index.query(vector, queryOpts);
    return matches.map(toSearchResult);
  }
}

function toSearchResult(m: VectorizeMatch): SearchResult {
  const text =
    readStringMetadata(m.metadata, "text") ??
    readStringMetadata(m.metadata, "content") ??
    "";
  return {
    id: String(m.id),
    score: m.score,
    text,
    metadata: (m.metadata as Record<string, unknown> | null | undefined) ?? {},
  };
}

function readStringMetadata(
  meta: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!meta) return undefined;
  const v = meta[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v.join(" ");
  return undefined;
}

function clampTopK(n: number | undefined): number {
  if (n === undefined || !Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(Math.trunc(n), 100));
}
