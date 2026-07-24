import { describe, it, expect } from "vitest";
import {
  OrchestrationError,
  AiGatewayRouter,
  OrchestratedComposer,
} from "./index";
import type { BusinessConfig } from "../catalog";

/**
 * Ported from /tmp/opencode/smoke-orchestration.mjs (session 3 of ai-ecosystem-scaffold).
 * Component 10 (§5.10): permanent Vitest home for the multi-model orchestration checks.
 *
 * Two layers exercised:
 *   1. OrchestratedComposer with an injected fake ModelRouter — verifies the integration point
 *      with the existing AnswerComposer seam (component 5).
 *   2. AiGatewayRouter with a mocked fetchImpl — verifies URL construction, auth-header rules,
 *      request-body shape, and multi-provider response parsing without any network.
 */

const spBusiness = {
  id: "secureprospective",
  name: "SecureProspective",
  category: "technical_consulting",
  voice: "ledger/vault mood; confident, direct",
  serviceAreaRadius: null,
  contact: { email: "test@example.com" },
} as BusinessConfig;

// Capturing fake ModelRouter — records the last generate() call + returns canned text.
function makeFakeRouter(response: unknown) {
  const calls: Array<{ messages: unknown; opts: unknown }> = [];
  return {
    calls,
    async generate(messages: unknown, opts: unknown) {
      calls.push({ messages, opts });
      if (response instanceof Error) throw response;
      return typeof response === "function" ? response(messages, opts) : response;
    },
  };
}

// Mocked fetch factory — returns a Response with a configurable body + status.
function makeMockFetch(body: unknown, status = 200) {
  const calls: Array<{ url: string; init: Record<string, unknown> }> = [];
  const fn = async (url: string, init: Record<string, unknown>) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
  (fn as unknown as { calls: typeof calls }).calls = calls;
  return fn;
}

// ─────────────────────────────────────────────────────────────────────
// Layer 1 — OrchestratedComposer
// ─────────────────────────────────────────────────────────────────────

describe("Layer 1 — OrchestratedComposer", () => {
  it("happy path: real tool results → real composed answer; prompt structure correct", async () => {
    const router = makeFakeRouter({ text: "The cost is $5,000.", provider: "anthropic" });
    const composer = new OrchestratedComposer({ router: router as never });
    const results = [
      { isError: false, content: [{ type: "text" as const, text: "AI-Native Diagnosis: $5,000" }] },
    ];
    const out = await composer.compose("How much is the diagnosis?", results, spBusiness);
    expect(out).toBe("The cost is $5,000.");
    const c = router.calls[0];
    const messages = (c as { messages: Array<{ content: string; role: string }> }).messages;
    expect(messages[0].content).toContain("SecureProspective");
    expect(messages[0].content).toContain("ledger/vault");
    expect(messages[1].content).toContain("How much is the diagnosis?");
    expect(messages[1].content).toContain("AI-Native Diagnosis");
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("no-context path: empty tool results → deterministic refusal; router NOT called", async () => {
    const router = makeFakeRouter({ text: "should not be called" });
    const composer = new OrchestratedComposer({ router: router as never });
    const out = await composer.compose("anything", [], spBusiness);
    expect(out).toBe(`I don't have information about that for ${spBusiness.name}.`);
    expect(router.calls.length).toBe(0);
  });

  it("no-context path: all-error tool results → refusal; router NOT called", async () => {
    const router = makeFakeRouter({ text: "should not be called" });
    const composer = new OrchestratedComposer({ router: router as never });
    const results = [
      { isError: true, content: [{ type: "text" as const, text: "boom" }] },
      { isError: true, content: [{ type: "text" as const, text: "boom2" }] },
    ];
    const out = await composer.compose("q", results, spBusiness);
    expect(out.startsWith("I don't have information")).toBe(true);
    expect(router.calls.length).toBe(0);
  });

  it("mixed: errors skipped, successes used", async () => {
    const router = makeFakeRouter({ text: "mixed ok" });
    const composer = new OrchestratedComposer({ router: router as never });
    const results = [
      { isError: true, content: [{ type: "text" as const, text: "skip me" }] },
      { isError: false, content: [{ type: "text" as const, text: "  use me  " }] },
    ];
    await composer.compose("q", results, spBusiness);
    const userContent = (router.calls[0] as { messages: [{}, { content: string }] }).messages[1].content;
    expect(userContent).toContain("use me");
    expect(userContent).not.toContain("skip me");
  });

  it("whitespace-only content treated as no-context", async () => {
    const router = makeFakeRouter({ text: "should not be called" });
    const composer = new OrchestratedComposer({ router: router as never });
    const results = [{ isError: false, content: [{ type: "text" as const, text: "   " }] }];
    const out = await composer.compose("q", results, spBusiness);
    expect(out.startsWith("I don't have information")).toBe(true);
    expect(router.calls.length).toBe(0);
  });

  it("empty router text → composer refusal fallback", async () => {
    const router = makeFakeRouter({ text: "" });
    const composer = new OrchestratedComposer({ router: router as never });
    const results = [{ isError: false, content: [{ type: "text" as const, text: "ctx" }] }];
    const out = await composer.compose("q", results, spBusiness);
    expect(out.startsWith("I don't have information")).toBe(true);
  });

  it("generateOpts forwarded to router", async () => {
    const router = makeFakeRouter({ text: "ok" });
    const composer = new OrchestratedComposer({
      router: router as never,
      generateOpts: { temperature: 0.1, maxTokens: 50 },
    });
    await composer.compose("q", [{ isError: false, content: [{ type: "text" as const, text: "ctx" }] }], spBusiness);
    const opts = (router.calls[0] as { opts: { temperature?: number; maxTokens?: number } }).opts;
    expect(opts?.temperature).toBe(0.1);
    expect(opts?.maxTokens).toBe(50);
  });

  it("custom buildSystemPrompt override", async () => {
    const router = makeFakeRouter({ text: "ok" });
    const composer = new OrchestratedComposer({
      router: router as never,
      buildSystemPrompt: (b: BusinessConfig) => `CUSTOM ${b.id} ${b.voice.toUpperCase()}`,
    });
    await composer.compose("q", [{ isError: false, content: [{ type: "text" as const, text: "ctx" }] }], spBusiness);
    const sysContent = (router.calls[0] as { messages: [{ content: string }] }).messages[0].content;
    expect(sysContent).toBe("CUSTOM secureprospective LEDGER/VAULT MOOD; CONFIDENT, DIRECT");
  });

  it("constructor throws without router", () => {
    expect(() => new OrchestratedComposer({} as never)).toThrow();
  });

  it("multiple tool results concatenated with separator", async () => {
    const router = makeFakeRouter({ text: "ok" });
    const composer = new OrchestratedComposer({ router: router as never });
    const results = [
      { isError: false, content: [{ type: "text" as const, text: "first" }] },
      { isError: false, content: [{ type: "text" as const, text: "second" }] },
    ];
    await composer.compose("q", results, spBusiness);
    const userContent = (router.calls[0] as { messages: [{}, { content: string }] }).messages[1].content;
    expect(userContent).toContain("first");
    expect(userContent).toContain("second");
    expect(userContent).toContain("---");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Layer 2a — AiGatewayRouter URL + auth construction
// ─────────────────────────────────────────────────────────────────────

describe("Layer 2a — AiGatewayRouter URL + auth per provider", () => {
  it("workersai: URL has account+gateway+provider+ai-run; Authorization Bearer; no x-api-key", async () => {
    const fetchImpl = makeMockFetch({ result: { choices: [{ message: { content: "ok" } }] } });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [{ provider: "workersai", apiKey: "tok", model: "@cf/google/gemma-4-26b-a4b-it" }],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "hi" }]);
    const c = (fetchImpl as unknown as { calls: Array<{ url: string; init: { headers: Record<string, string> } }> }).calls[0];
    expect(c.url).toContain("/abc123/");
    expect(c.url).toContain("/gw-1/");
    expect(c.url).toContain("/workersai/");
    expect(c.url).toContain("/ai/run/@cf/google/gemma-4-26b-a4b-it");
    expect(c.init.headers["Authorization"]).toBe("Bearer tok");
    expect(c.init.headers["Content-Type"]).toBe("application/json");
    expect(c.init.headers["x-api-key"]).toBeUndefined();
  });

  it("anthropic: URL has /anthropic/ + /v1/messages; x-api-key; no Authorization", async () => {
    const fetchImpl = makeMockFetch({ content: [{ type: "text", text: "ok" }] });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [{ provider: "anthropic", apiKey: "sk-ant", model: "claude-sonnet-4-5" }],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "hi" }]);
    const c = (fetchImpl as unknown as { calls: Array<{ url: string; init: { headers: Record<string, string> } }> }).calls[0];
    expect(c.url).toContain("/anthropic/");
    expect(c.url).toContain("/v1/messages");
    expect(c.init.headers["x-api-key"]).toBe("sk-ant");
    expect(c.init.headers["Authorization"]).toBeUndefined();
  });

  it("google: URL has google-ai-studio + model in path; x-goog-api-key; no Authorization", async () => {
    const fetchImpl = makeMockFetch({ candidates: [{ content: { parts: [{ text: "ok" }] } }] });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [{ provider: "google", apiKey: "AIza", model: "gemini-2.0-flash" }],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "hi" }]);
    const c = (fetchImpl as unknown as { calls: Array<{ url: string; init: { headers: Record<string, string> } }> }).calls[0];
    expect(c.url).toContain("/google-ai-studio/");
    expect(c.url).toContain("/models/gemini-2.0-flash:generateContent");
    expect(c.init.headers["x-goog-api-key"]).toBe("AIza");
    expect(c.init.headers["Authorization"]).toBeUndefined();
  });

  it("openai: URL has /openai/ + /chat/completions; Authorization Bearer", async () => {
    const fetchImpl = makeMockFetch({ choices: [{ message: { content: "ok" } }] });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [{ provider: "openai", apiKey: "sk-oa", model: "gpt-4o-mini" }],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "hi" }]);
    const c = (fetchImpl as unknown as { calls: Array<{ url: string; init: { headers: Record<string, string> } }> }).calls[0];
    expect(c.url).toContain("/openai/");
    expect(c.url).toContain("/chat/completions");
    expect(c.init.headers["Authorization"]).toBe("Bearer sk-oa");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Layer 2b — request body shape + option forwarding
// ─────────────────────────────────────────────────────────────────────

describe("Layer 2b — request body shape + option forwarding", () => {
  it("body has model + messages + temperature + max_tokens", async () => {
    const fetchImpl = makeMockFetch({ result: { choices: [{ message: { content: "ok" } }] } });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [{ provider: "workersai", apiKey: "tok", model: "@cf/google/gemma-4-26b-a4b-it" }],
      fetchImpl: fetchImpl as never,
    });
    const msgs = [
      { role: "system" as const, content: "sys" },
      { role: "user" as const, content: "hi" },
    ];
    await router.generate(msgs, { temperature: 0.7, maxTokens: 100 });
    const body = JSON.parse((fetchImpl as unknown as { calls: Array<{ init: { body: string } }> }).calls[0].init.body);
    expect(body.model).toBe("@cf/google/gemma-4-26b-a4b-it");
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages.length).toBe(2);
    expect(body.messages[0].content).toBe("sys");
    expect(body.messages[1].content).toBe("hi");
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(100);
  });

  it("opts.model overrides body.model AND URL path", async () => {
    const fetchImpl = makeMockFetch({ result: { choices: [{ message: { content: "ok" } }] } });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [{ provider: "workersai", apiKey: "tok", model: "@cf/google/gemma-4-26b-a4b-it" }],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "x" }], { model: "@cf/mistral/mistral-7b-instruct" });
    const calls = (fetchImpl as unknown as { calls: Array<{ url: string; init: { body: string } }> }).calls;
    const body = JSON.parse(calls[0].init.body);
    expect(body.model).toBe("@cf/mistral/mistral-7b-instruct");
    expect(calls[0].url).toContain("/ai/run/@cf/mistral/mistral-7b-instruct");
  });

  it("opts.provider picks the right route", async () => {
    const fetchImpl = makeMockFetch({ content: [{ type: "text", text: "ok" }] });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [
        { provider: "workersai", apiKey: "wa-tok", model: "@cf/google/gemma-4-26b-a4b-it" },
        { provider: "anthropic", apiKey: "sk-ant", model: "claude-sonnet-4-5" },
      ],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "x" }], { provider: "anthropic" });
    const c = (fetchImpl as unknown as { calls: Array<{ url: string; init: { headers: Record<string, string> } }> }).calls[0];
    expect(c.url).toContain("/anthropic/");
    expect(c.init.headers["x-api-key"]).toBe("sk-ant");
  });

  it("default provider = first in the providers list", async () => {
    const fetchImpl = makeMockFetch({ content: [{ type: "text", text: "ok" }] });
    const router = new AiGatewayRouter({
      accountId: "abc123", gatewayId: "gw-1",
      providers: [
        { provider: "anthropic", apiKey: "sk-ant", model: "claude-sonnet-4-5" },
        { provider: "workersai", apiKey: "wa-tok" },
      ],
      fetchImpl: fetchImpl as never,
    });
    await router.generate([{ role: "user", content: "x" }]);
    const url = (fetchImpl as unknown as { calls: Array<{ url: string }> }).calls[0].url;
    expect(url).toContain("/anthropic/");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Layer 2c — Response parsing (multi-provider shapes)
// ─────────────────────────────────────────────────────────────────────

describe("Layer 2c — multi-provider response parsing", () => {
  it("workersai choices shape: text + provider + model + latencyMs", async () => {
    const fetchImpl = makeMockFetch({
      result: { choices: [{ message: { content: "workers ai says hi" } }] },
    });
    const router = new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "workersai", apiKey: "t", model: "m" }],
      fetchImpl: fetchImpl as never,
    });
    const out = await router.generate([{ role: "user", content: "x" }]);
    expect(out.text).toBe("workers ai says hi");
    expect(out.provider).toBe("workersai");
    expect(out.model).toBe("m");
    expect(typeof out.latencyMs).toBe("number");
    expect(out.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("workersai result.response alt shape", async () => {
    const fetchImpl = makeMockFetch({ result: { response: "alt shape" } });
    const router = new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "workersai", apiKey: "t" }],
      fetchImpl: fetchImpl as never,
    });
    const out = await router.generate([{ role: "user", content: "x" }]);
    expect(out.text).toBe("alt shape");
  });

  it("openai shape with usage", async () => {
    const fetchImpl = makeMockFetch({
      choices: [{ message: { content: "openai ok" }, finish_reason: "length" }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });
    const router = new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "openai", apiKey: "t", model: "gpt-4o-mini" }],
      fetchImpl: fetchImpl as never,
    });
    const out = await router.generate([{ role: "user", content: "x" }]);
    expect(out.text).toBe("openai ok");
    expect(out.finishReason).toBe("length");
    expect(out.usage?.promptTokens).toBe(10);
    expect(out.usage?.completionTokens).toBe(5);
    expect(out.usage?.totalTokens).toBe(15);
  });

  it("anthropic multi-text parts joined + stop_reason + model + computed usage total", async () => {
    const fetchImpl = makeMockFetch({
      content: [
        { type: "text", text: "claude part 1 " },
        { type: "text", text: "claude part 2" },
      ],
      stop_reason: "end_turn",
      model: "claude-sonnet-4-5",
      usage: { input_tokens: 8, output_tokens: 4 },
    });
    const router = new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "anthropic", apiKey: "t", model: "claude-sonnet-4-5" }],
      fetchImpl: fetchImpl as never,
    });
    const out = await router.generate([{ role: "user", content: "x" }]);
    expect(out.text).toBe("claude part 1 \nclaude part 2");
    expect(out.finishReason).toBe("end_turn");
    expect(out.model).toBe("claude-sonnet-4-5");
    expect(out.usage?.totalTokens).toBe(12);
  });

  it("google shape: candidates + finishReason + usageMetadata", async () => {
    const fetchImpl = makeMockFetch({
      candidates: [{
        content: { parts: [{ text: "gemini ok" }] },
        finishReason: "STOP",
      }],
      usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 2, totalTokenCount: 5 },
    });
    const router = new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "google", apiKey: "t", model: "gemini-2.0-flash" }],
      fetchImpl: fetchImpl as never,
    });
    const out = await router.generate([{ role: "user", content: "x" }]);
    expect(out.text).toBe("gemini ok");
    expect(out.finishReason).toBe("STOP");
    expect(out.usage?.totalTokens).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Layer 2d — Error paths
// ─────────────────────────────────────────────────────────────────────

describe("Layer 2d — error handling", () => {
  async function makeRouter(fetchImpl: unknown) {
    return new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "workersai", apiKey: "t" }],
      fetchImpl: fetchImpl as never,
    });
  }

  it("401 → auth error", async () => {
    const router = await makeRouter(makeMockFetch({ error: "bad key" }, 401));
    await expect(router.generate([{ role: "user", content: "x" }])).rejects.toThrow(OrchestrationError);
    try {
      await router.generate([{ role: "user", content: "x" }]);
    } catch (e) {
      expect((e as OrchestrationError).kind).toBe("auth");
    }
  });

  it("403 → auth error", async () => {
    const router = await makeRouter(makeMockFetch({ error: "forbidden" }, 403));
    await expect(router.generate([{ role: "user", content: "x" }])).rejects.toMatchObject({ kind: "auth" });
  });

  it("429 → provider error", async () => {
    const router = await makeRouter(makeMockFetch({ error: "slow down" }, 429));
    await expect(router.generate([{ role: "user", content: "x" }])).rejects.toMatchObject({ kind: "provider" });
  });

  it("500 → provider error", async () => {
    const router = await makeRouter(makeMockFetch({ error: "boom" }, 500));
    await expect(router.generate([{ role: "user", content: "x" }])).rejects.toMatchObject({ kind: "provider" });
  });

  it("network failure → transport error", async () => {
    const failingFetch = async () => { throw new TypeError("failed to fetch"); };
    const router = await makeRouter(failingFetch);
    await expect(router.generate([{ role: "user", content: "x" }])).rejects.toMatchObject({ kind: "transport" });
  });

  it("unparseable response → parse error", async () => {
    const router = await makeRouter(makeMockFetch({ some: "unknown shape" }));
    await expect(router.generate([{ role: "user", content: "x" }])).rejects.toMatchObject({ kind: "parse" });
  });

  it("empty messages → empty error", async () => {
    const router = await makeRouter(makeMockFetch({}));
    await expect(router.generate([])).rejects.toMatchObject({ kind: "empty" });
  });

  it("unknown provider in opts.provider → config error", async () => {
    const router = await makeRouter(makeMockFetch({}));
    await expect(
      router.generate([{ role: "user", content: "x" }], { provider: "madeup" }),
    ).rejects.toMatchObject({ kind: "config" });
  });

  it("constructor: missing accountId → config error", () => {
    expect(() => new AiGatewayRouter({
      gatewayId: "g", providers: [{ provider: "workersai", apiKey: "t" }],
    } as never)).toThrow();
  });

  it("constructor: missing gatewayId → config error", () => {
    expect(() => new AiGatewayRouter({
      accountId: "a", providers: [{ provider: "workersai", apiKey: "t" }],
    } as never)).toThrow();
  });

  it("constructor: empty providers → config error", () => {
    expect(() => new AiGatewayRouter({
      accountId: "a", gatewayId: "g", providers: [],
    })).toThrow();
  });

  it("OrchestrationError carries provider attribution + status code", async () => {
    const fetchImpl = makeMockFetch({ err: "x" }, 401);
    const router = new AiGatewayRouter({
      accountId: "a", gatewayId: "g",
      providers: [{ provider: "anthropic", apiKey: "t" }],
      fetchImpl: fetchImpl as never,
    });
    try {
      await router.generate([{ role: "user", content: "x" }]);
      expect.unreachable("should have thrown");
    } catch (e) {
      const err = e as OrchestrationError;
      expect(err.provider).toBe("anthropic");
      expect(err.status).toBe(401);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Layer 3 — integration with the existing Agent (component 5)
// ─────────────────────────────────────────────────────────────────────

describe("Layer 3 — OrchestratedComposer satisfies AnswerComposer contract", () => {
  it("has compose method and returns router-generated text", async () => {
    const router = makeFakeRouter({ text: "orchestrated answer via router" });
    const composer = new OrchestratedComposer({ router: router as never });
    expect(typeof composer.compose).toBe("function");
    const out = await composer.compose(
      "q",
      [{ isError: false, content: [{ type: "text", text: "ctx" }] }],
      spBusiness,
    );
    expect(out).toBe("orchestrated answer via router");
  });
});
