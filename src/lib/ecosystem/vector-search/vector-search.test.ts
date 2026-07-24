import { describe, it, expect } from "vitest";
import {
  VectorSearch,
  VectorSearchError,
  VectorizeBackend,
  AISearchBackend,
  RestClientAiSearchClient,
} from "./index";
import type { BusinessConfig } from "../catalog";

/**
 * Ported from /tmp/opencode/smoke-vector.mjs (session 2 of ai-ecosystem-scaffold).
 * Component 10 (§5.10): permanent Vitest home for the vector-search checks.
 *
 * Note on the `capture()` helper: TS strict mode narrows closure-captured
 * `let x: T | null = null` to `null` at read sites because it doesn't track
 * that the closure fires. The `{ current }` wrapper defeats the narrowing
 * while keeping the test readable.
 */

function capture<T>(): { current: T | null } {
  return { current: null };
}

// ─────────────────────────────────────────────────────────────────────
// Fakes
// ─────────────────────────────────────────────────────────────────────

const fakeEmbedder = {
  async embed(text: string): Promise<number[]> {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    return [
      (h & 0xff) / 255 - 0.5,
      ((h >> 8) & 0xff) / 255 - 0.5,
      ((h >> 16) & 0xff) / 255 - 0.5,
      (h >>> 24) / 255 - 0.5,
    ];
  },
};

function makeFakeIndex(cannedMatches: unknown[]) {
  const calls: Array<{ vector: unknown; options: unknown }> = [];
  return {
    calls,
    async query(vector: unknown, options: unknown) {
      calls.push({ vector, options });
      return cannedMatches;
    },
    async upsert() {},
    async deleteByIds() {},
  };
}

function makeFakeAiClient(cannedChunks: unknown[]) {
  const calls: string[] = [];
  return {
    calls,
    async search(query: string) {
      calls.push(query);
      return { chunks: cannedChunks };
    },
  };
}

const SP = { id: "secureprospective", name: "SecureProspective" } as unknown as BusinessConfig;
const TFM = { id: "techfreedomministries", name: "Tech Freedom Ministries" } as unknown as BusinessConfig;

// ─────────────────────────────────────────────────────────────────────
// 1. VectorSearch — input validation
// ─────────────────────────────────────────────────────────────────────

describe("[1] VectorSearch input validation", () => {
  it("empty string → []", async () => {
    const backend = { async search() { return [{ id: "x", score: 1, text: "t", metadata: {} }]; } };
    const vs = new VectorSearch(backend as never, SP);
    const r = await vs.search("");
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(0);
  });
  it("whitespace-only → []", async () => {
    const backend = { async search() { return []; } };
    const vs = new VectorSearch(backend as never, SP);
    expect((await vs.search("   ")).length).toBe(0);
  });
  it("null → []", async () => {
    const backend = { async search() { return []; } };
    const vs = new VectorSearch(backend as never, SP);
    expect((await vs.search(null as unknown as string)).length).toBe(0);
  });
  it("undefined → []", async () => {
    const backend = { async search() { return []; } };
    const vs = new VectorSearch(backend as never, SP);
    expect((await vs.search(undefined as unknown as string)).length).toBe(0);
  });
  it("valid query passes through, trimmed", async () => {
    const received = capture<{ q: string }>();
    const capturingBackend = {
      async search(q: string) { received.current = { q }; return []; },
    };
    const vs = new VectorSearch(capturingBackend as never, SP);
    await vs.search("  hello world  ");
    expect(received.current?.q).toBe("hello world");
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. VectorSearch — business scoping
// ─────────────────────────────────────────────────────────────────────

describe("[2] VectorSearch business scoping (namespace = business.id by default)", () => {
  it("SP instance → namespace=secureprospective", async () => {
    const received = capture<{ opts: { namespace?: string } }>();
    const backend = { async search(_q: string, opts: { namespace?: string }) { received.current = { opts }; return []; } };
    const vsSP = new VectorSearch(backend as never, SP);
    await vsSP.search("question");
    expect(received.current?.opts.namespace).toBe("secureprospective");
  });
  it("TFM instance → namespace=techfreedomministries", async () => {
    const received = capture<{ opts: { namespace?: string } }>();
    const backend = { async search(_q: string, opts: { namespace?: string }) { received.current = { opts }; return []; } };
    const vsTFM = new VectorSearch(backend as never, TFM);
    await vsTFM.search("question");
    expect(received.current?.opts.namespace).toBe("techfreedomministries");
  });
  it("explicit namespace override wins", async () => {
    const received = capture<{ opts: { namespace?: string } }>();
    const backend = { async search(_q: string, opts: { namespace?: string }) { received.current = { opts }; return []; } };
    const vsSP = new VectorSearch(backend as never, SP);
    await vsSP.search("question", 5, { namespace: "custom-ns" });
    expect(received.current?.opts.namespace).toBe("custom-ns");
  });
  it("explicit filter passed through", async () => {
    const received = capture<{ opts: { filter?: { type?: string } } }>();
    const backend = { async search(_q: string, opts: { filter?: { type?: string } }) { received.current = { opts }; return []; } };
    const vsSP = new VectorSearch(backend as never, SP);
    await vsSP.search("question", 5, { filter: { type: "faq" } });
    expect(received.current?.opts.filter?.type).toBe("faq");
  });
  it("topK passed through", async () => {
    const received = capture<{ opts: { topK?: number } }>();
    const backend = { async search(_q: string, opts: { topK?: number }) { received.current = { opts }; return []; } };
    const vsSP = new VectorSearch(backend as never, SP);
    await vsSP.search("question", 7);
    expect(received.current?.opts.topK).toBe(7);
  });
  it("default topK = 5", async () => {
    const received = capture<{ opts: { topK?: number } }>();
    const backend = { async search(_q: string, opts: { topK?: number }) { received.current = { opts }; return []; } };
    const vsSP = new VectorSearch(backend as never, SP);
    await vsSP.search("question");
    expect(received.current?.opts.topK).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. VectorizeBackend — embedder + index + clamping
// ─────────────────────────────────────────────────────────────────────

describe("[3] VectorizeBackend embedder + index + clamping", () => {
  const matches = [
    { id: "v1", score: 0.95, metadata: { text: "first passage", entity_id: "sp:faq:1" } },
    { id: "v2", score: 0.80, metadata: { content: "second via content key" } },
    { id: "v3", score: 0.50, metadata: { text: ["part a", "part b"] } },
    { id: 42, score: 0.10, metadata: null },
  ];
  const embedder = { async embed() { return [0.1, 0.2]; } };

  it("embedder called with query + index.query called once with returnMetadata='all' + namespace", async () => {
    const index = makeFakeIndex(matches);
    const embedCalls: string[] = [];
    const embedder = { async embed(t: string) { embedCalls.push(t); return [0.1, 0.2]; } };
    const backend = new VectorizeBackend(index as never, embedder);
    await backend.search("hello", { topK: 4, namespace: "sp" });
    expect(embedCalls.length).toBe(1);
    expect(embedCalls[0]).toBe("hello");
    expect(index.calls.length).toBe(1);
    expect((index.calls[0] as { options: { returnMetadata?: string } }).options.returnMetadata).toBe("all");
    expect((index.calls[0] as { options: { namespace?: string } }).options.namespace).toBe("sp");
    expect(Array.isArray((index.calls[0] as { vector: unknown }).vector)).toBe(true);
    expect((index.calls[0] as { vector: unknown[] }).vector.length).toBe(2);
  });

  it("topK undefined → 5", async () => {
    const ix = makeFakeIndex(matches);
    const b = new VectorizeBackend(ix as never, embedder);
    await b.search("q", {});
    expect((ix.calls[0] as { options: { topK?: number } }).options.topK).toBe(5);
  });
  it("topK 0 → clamped to 1", async () => {
    const ix = makeFakeIndex(matches);
    const b = new VectorizeBackend(ix as never, embedder);
    await b.search("q", { topK: 0 });
    expect((ix.calls[0] as { options: { topK?: number } }).options.topK).toBe(1);
  });
  it("topK 1000 → clamped to 100", async () => {
    const ix = makeFakeIndex(matches);
    const b = new VectorizeBackend(ix as never, embedder);
    await b.search("q", { topK: 1000 });
    expect((ix.calls[0] as { options: { topK?: number } }).options.topK).toBe(100);
  });
  it("topK 3.7 → truncated to 3", async () => {
    const ix = makeFakeIndex(matches);
    const b = new VectorizeBackend(ix as never, embedder);
    await b.search("q", { topK: 3.7 });
    expect((ix.calls[0] as { options: { topK?: number } }).options.topK).toBe(3);
  });
  it("topK NaN → 5", async () => {
    const ix = makeFakeIndex(matches);
    const b = new VectorizeBackend(ix as never, embedder);
    await b.search("q", { topK: NaN });
    expect((ix.calls[0] as { options: { topK?: number } }).options.topK).toBe(5);
  });
  it("topK Infinity → 5", async () => {
    const ix = makeFakeIndex(matches);
    const b = new VectorizeBackend(ix as never, embedder);
    await b.search("q", { topK: Infinity });
    expect((ix.calls[0] as { options: { topK?: number } }).options.topK).toBe(5);
  });

  it("returns 4 results with correct mapping (text fallbacks, id coercion, metadata defaults)", async () => {
    const index = makeFakeIndex(matches);
    const backend = new VectorizeBackend(index as never, embedder);
    const results = await backend.search("hello", { topK: 4, namespace: "sp" });
    expect(results.length).toBe(4);
    expect(typeof results[0].id).toBe("string");
    expect(results[0].id).toBe("v1");
    expect(results[0].text).toBe("first passage");
    expect(results[0].score).toBe(0.95);
    expect((results[0].metadata as { entity_id: string }).entity_id).toBe("sp:faq:1");
    expect(results[1].text).toBe("second via content key");
    expect(results[2].text).toBe("part a part b");
    expect(results[3].id).toBe("42");
    expect(results[3].text).toBe("");
    expect(typeof results[3].metadata).toBe("object");
    expect(Object.keys(results[3].metadata as object).length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. AISearchBackend — chunk mapping + slicing
// ─────────────────────────────────────────────────────────────────────

describe("[4] AISearchBackend chunk mapping + slicing", () => {
  it("slices to topK and maps fields with content fallback + synthesized id", async () => {
    const chunks = [
      { text: "alpha", score: 0.9, id: "c1" },
      { content: "beta via content", score: 0.7, id: "c2" },
      { text: ["gamma", "gamma2"], score: 0.5 },
      { text: null, score: 0.3 },
      { text: "epsilon", score: 0.1 },
    ];
    const client = makeFakeAiClient(chunks);
    const backend = new AISearchBackend(client as never);
    const results = await backend.search("question", { topK: 3 });
    expect(client.calls.length).toBe(1);
    expect(client.calls[0]).toBe("question");
    expect(results.length).toBe(3);
    expect(results[0].text).toBe("alpha");
    expect(results[0].score).toBe(0.9);
    expect(results[1].text).toBe("beta via content");
    expect(results[2].text).toBe("gamma gamma2");
    expect(results[2].id).toBe("chunk-2");
  });

  it("missing score → 0", async () => {
    const cl = makeFakeAiClient([{ text: "no score" }]);
    const b = new AISearchBackend(cl as never);
    const r = await b.search("q", { topK: 5 });
    expect(r[0].score).toBe(0);
  });

  it("topK > available → returns all", async () => {
    const cl = makeFakeAiClient([{ text: "a" }, { text: "b" }]);
    const b = new AISearchBackend(cl as never);
    const r = await b.search("q", { topK: 100 });
    expect(r.length).toBe(2);
  });

  it("empty chunks → []", async () => {
    const cl = makeFakeAiClient([]);
    const b = new AISearchBackend(cl as never);
    const r = await b.search("q", { topK: 5 });
    expect(r.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. RestClientAiSearchClient — REST shape
// ─────────────────────────────────────────────────────────────────────

describe("[5] RestClientAiSearchClient REST shape + error path", () => {
  it("builds URL, headers, body correctly and parses chunks", async () => {
    const lastCall = capture<{ url: string; init: { headers: Record<string, string>; method: string; body: string } }>();
    const fakeFetch = async (url: string, init: { headers: Record<string, string>; method: string; body: string }) => ({
      ok: true,
      status: 200,
      async json() {
        lastCall.current = { url, init };
        return { result: { chunks: [{ text: "ok", score: 0.5 }] } };
      },
    });
    const client = new RestClientAiSearchClient({
      accountId: "acct-123",
      apiToken: "tok-abc",
      instanceName: "ccwork-resume",
      fetchImpl: fakeFetch as never,
    });
    const response = await client.search("what services");
    expect(lastCall.current?.url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acct-123/ai-search/instances/ccwork-resume/search",
    );
    expect(lastCall.current?.init.headers.Authorization).toBe("Bearer tok-abc");
    expect(lastCall.current?.init.headers["Content-Type"]).toBe("application/json");
    expect(lastCall.current?.init.method).toBe("POST");
    expect(JSON.parse(lastCall.current!.init.body).query).toBe("what services");
    expect(response.chunks.length).toBe(1);
    expect(response.chunks[0].text).toBe("ok");
  });

  it("non-ok response throws Error with status", async () => {
    const errFetch = async () => ({ ok: false, status: 502, statusText: "Bad Gateway" });
    const errClient = new RestClientAiSearchClient({
      accountId: "a", apiToken: "t", instanceName: "i", fetchImpl: errFetch as never,
    });
    await expect(errClient.search("q")).rejects.toThrow(/502/);
  });

  it("missing result.chunks → [] (no crash)", async () => {
    const emptyFetch = async () => ({
      ok: true,
      async json() { return {}; },
    });
    const emptyClient = new RestClientAiSearchClient({
      accountId: "a", apiToken: "t", instanceName: "i", fetchImpl: emptyFetch as never,
    });
    const emptyResp = await emptyClient.search("q");
    expect(emptyResp.chunks.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 6. Backend-agnostic VectorSearch
// ─────────────────────────────────────────────────────────────────────

describe("[6] Backend-agnostic VectorSearch (both backends return same shape)", () => {
  it("Vectorize backend → 1 SearchResult", async () => {
    const ix = makeFakeIndex([{ id: "v1", score: 0.9, metadata: { text: "from vectorize" } }]);
    const vsV = new VectorSearch(new VectorizeBackend(ix as never, fakeEmbedder), SP);
    const rV = await vsV.search("question", 3);
    expect(rV.length).toBe(1);
    expect(rV[0].text).toBe("from vectorize");
    expect(typeof rV[0].score).toBe("number");
    expect(rV[0].id).toBeTruthy();
  });
  it("AI Search backend → 1 SearchResult with same keys", async () => {
    const cl = makeFakeAiClient([{ id: "c1", score: 0.7, text: "from aisearch" }]);
    const vsA = new VectorSearch(new AISearchBackend(cl as never), SP);
    const rA = await vsA.search("question", 3);
    expect(rA.length).toBe(1);
    expect(rA[0].text).toBe("from aisearch");
    const ix = makeFakeIndex([{ id: "v1", score: 0.9, metadata: { text: "from vectorize" } }]);
    const vsV = new VectorSearch(new VectorizeBackend(ix as never, fakeEmbedder), SP);
    const rV = await vsV.search("question", 3);
    expect(JSON.stringify(Object.keys(rV[0]).sort())).toBe(JSON.stringify(Object.keys(rA[0]).sort()));
  });
});

// ─────────────────────────────────────────────────────────────────────
// 7. VectorSearchError
// ─────────────────────────────────────────────────────────────────────

describe("[7] VectorSearchError", () => {
  it("is an Error with name + message preserved", () => {
    const e = new VectorSearchError("boom");
    expect(e instanceof Error).toBe(true);
    expect(e instanceof VectorSearchError).toBe(true);
    expect(e.name).toBe("VectorSearchError");
    expect(e.message).toBe("boom");
  });
});
