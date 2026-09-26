import { describe, it, expect } from "vitest";

import { onRequestPost, tidy } from "../functions/api/chat";

/*
 * The resume assistant spends a free daily AI budget on every question, so
 * the caps are the part that must not regress. The model output rules are
 * enforced by tidy(), because GPT-OSS ignored "no em dashes" in testing.
 */

const SITE = "https://secureprospective.com";

function makeEnv(answer = "He builds AI systems.") {
  const store = new Map<string, string>();
  const calls = { search: 0, run: 0 };
  return {
    calls,
    store,
    env: {
      CHAT_KV: {
        get: async (k: string) => store.get(k) ?? null,
        put: async (k: string, v: string) => void store.set(k, v),
      },
      AI: {
        autorag: () => ({
          search: async () => {
            calls.search++;
            return { data: [{ filename: "01-overview.md", content: [{ type: "text", text: "Builds AI." }] }] };
          },
        }),
        run: async () => {
          calls.run++;
          return { response: answer };
        },
      },
    } as any,
  };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SITE, "CF-Connecting-IP": "203.0.113.9", ...headers },
    body: JSON.stringify(body),
  });
}

const call = (env: any, r: Request) => onRequestPost({ request: r, env } as any);

describe("POST /api/chat", () => {
  it("answers from the record", async () => {
    const { env, calls } = makeEnv();
    const res = await call(env, req({ question: "What does he build?" }));
    expect(res.status).toBe(200);
    expect((await res.json()).answer).toBe("He builds AI systems.");
    expect(calls).toEqual({ search: 1, run: 1 });
  });

  it("rejects a foreign origin before spending anything", async () => {
    const { env, calls } = makeEnv();
    const res = await call(env, req({ question: "hi there" }, { Origin: "https://evil.pages.dev" }));
    expect(res.status).toBe(403);
    expect(calls.run).toBe(0);
  });

  it("caps one visitor at 12 questions a day", async () => {
    const { env, calls } = makeEnv();
    for (let i = 0; i < 12; i++) expect((await call(env, req({ question: "question" }))).status).toBe(200);
    const res = await call(env, req({ question: "question" }));
    expect(res.status).toBe(429);
    expect(calls.run).toBe(12);
  });

  it("caps the whole site at 50 questions a day", async () => {
    const { env, calls } = makeEnv();
    for (let i = 0; i < 60; i++) await call(env, req({ question: "question" }, { "CF-Connecting-IP": `198.51.100.${i}` }));
    expect(calls.run).toBe(50);
  });

  it("never stores the IP or the question", async () => {
    const { env, store } = makeEnv();
    await call(env, req({ question: "secret question" }));
    const all = [...store.keys(), ...store.values()].join(" ");
    expect(all).not.toContain("203.0.113.9");
    expect(all).not.toContain("secret");
  });

  it("falls back to the phone number when the model fails", async () => {
    const { env } = makeEnv();
    env.AI.run = async () => { throw new Error("5035"); };
    const res = await call(env, req({ question: "anything" }));
    expect(res.status).toBe(503);
    expect((await res.json()).answer).toContain("832.303.2277");
  });
});

describe("tidy", () => {
  it("removes em dashes and odd hyphens", () => {
    expect(tidy("He builds—and runs—systems")).toBe("He builds, and runs, systems");
    expect(tidy("self‑hosted")).toBe("self-hosted");
    expect(tidy("**bold** text")).toBe("bold text");
  });
});
