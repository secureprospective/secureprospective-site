import { describe, it, expect } from "vitest";

import { onRequestPost } from "../functions/api/track";

/*
 * The intent beacon is a public, unauthenticated write surface with no
 * Turnstile in front of it, which is a deliberate decision: a challenge on a
 * fire-and-forget beacon would make `turnstile_fail` impossible to report.
 * The allowlists are therefore the whole of the gate, and these tests are
 * what keep them honest.
 *
 * The last test is the important one. The property that keeps this endpoint
 * outside consent territory is that a stored row contains nothing that
 * identifies anyone, and that is a property of the code, not of an intention
 * written in a comment.
 */

const SITE = "https://secureprospective.com";

interface Bound {
  sql: string;
  values: unknown[];
}

function makeEnv() {
  const written: Bound[] = [];
  const prepare = (sql: string) => ({
    bind: (...values: unknown[]) => ({ sql, values }),
  });
  return {
    written,
    env: {
      EVENTS_DB: {
        prepare,
        batch: async (statements: Bound[]) => {
          written.push(...statements);
          return statements.map(() => ({ success: true }));
        },
      },
    } as never,
  };
}

function makeRequest(body: unknown, options: { origin?: string | null; contentType?: string | null } = {}) {
  const headers: Record<string, string> = {};
  const contentType = options.contentType === undefined ? "application/json" : options.contentType;
  if (contentType) headers["Content-Type"] = contentType;
  const origin = options.origin === undefined ? SITE : options.origin;
  if (origin) headers["Origin"] = origin;
  return new Request(`${SITE}/api/track`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function post(body: unknown, options?: Parameters<typeof makeRequest>[1]) {
  const { env, written } = makeEnv();
  const response = await (onRequestPost as never as (c: unknown) => Promise<Response>)({
    request: makeRequest(body, options),
    env,
  });
  return { response, written };
}

const VALID = { event: "tel_click", path: "/contact/" };

describe("POST /api/track", () => {
  it("accepts an allowlisted event and stores it", async () => {
    const { response, written } = await post(VALID);
    expect(response.status).toBe(204);
    expect(written).toHaveLength(1);
    expect(written[0].values).toEqual(["tel_click", null, "/contact/", expect.any(String)]);
  });

  it("accepts a small batch", async () => {
    const { response, written } = await post([
      { event: "scroll_depth", detail: "25", path: "/" },
      { event: "scroll_depth", detail: "50", path: "/" },
    ]);
    expect(response.status).toBe(204);
    expect(written).toHaveLength(2);
  });

  // The deliberate violation the convention requires: this is the gate that
  // stops the endpoint becoming an open write surface.
  it("rejects an event name that is not on the allowlist", async () => {
    const { response, written } = await post({ event: "arbitrary_event", path: "/" });
    expect(response.status).toBe(400);
    expect(written).toHaveLength(0);
  });

  it("rejects free text in detail", async () => {
    const { response, written } = await post({
      event: "form_abandon",
      detail: "christopher@example.com",
      path: "/contact/",
    });
    expect(response.status).toBe(400);
    expect(written).toHaveLength(0);
  });

  it("rejects a detail on an event that carries none", async () => {
    const { response } = await post({ event: "tel_click", detail: "anything", path: "/" });
    expect(response.status).toBe(400);
  });

  it("rejects an oversized body", async () => {
    const { response } = await post("x".repeat(5000));
    expect(response.status).toBe(413);
  });

  it("rejects a batch over the cap", async () => {
    const { response } = await post(Array.from({ length: 11 }, () => VALID));
    expect(response.status).toBe(400);
  });

  it("rejects a foreign origin", async () => {
    const { response } = await post(VALID, { origin: "https://evil.example" });
    expect(response.status).toBe(403);
  });

  it("rejects a non-JSON content type", async () => {
    const { response } = await post(VALID, { contentType: "text/plain" });
    expect(response.status).toBe(415);
  });

  it("rejects a path carrying a query string or an absolute URL", async () => {
    expect((await post({ event: "tel_click", path: "/contact/?email=someone@example.com" })).written).toHaveLength(1);
    expect((await post({ event: "tel_click", path: "https://secureprospective.com/contact/" })).response.status).toBe(400);
  });

  it("strips a query string rather than storing it", async () => {
    const { written } = await post({ event: "tel_click", path: "/contact/?utm_source=email" });
    expect(written[0].values[2]).toBe("/contact/");
  });

  // The property that keeps consent out of scope. Worth asserting directly
  // rather than trusting that nobody adds a column later.
  it("stores no IP, user agent or referrer even when the request carries them", async () => {
    const { env, written } = makeEnv();
    const request = new Request(`${SITE}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: SITE,
        "CF-Connecting-IP": "203.0.113.9",
        "User-Agent": "Mozilla/5.0 (a real device string)",
        Referer: "https://mail.google.com/",
      },
      body: JSON.stringify(VALID),
    });
    await (onRequestPost as never as (c: unknown) => Promise<Response>)({ request, env });

    const stored = JSON.stringify(written);
    expect(stored).not.toContain("203.0.113.9");
    expect(stored).not.toContain("Mozilla");
    expect(stored).not.toContain("mail.google.com");
    expect(written[0].values).toHaveLength(4);
  });

  it("still answers 204 when the database write fails", async () => {
    const env = {
      EVENTS_DB: {
        prepare: () => ({ bind: () => ({}) }),
        batch: async () => {
          throw new Error("D1 unavailable");
        },
      },
    } as never;
    const response = await (onRequestPost as never as (c: unknown) => Promise<Response>)({
      request: makeRequest(VALID),
      env,
    });
    // A beacon has nobody to tell. The gap in the ledger is the symptom.
    expect(response.status).toBe(204);
  });
});
