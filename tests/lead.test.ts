import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { onRequestPost } from "../functions/api/lead";

/*
 * The contact form is the site's only lead capture. These tests exercise the
 * gate in front of it: what it refuses, what it stores, and the guarantee that
 * once a lead is in R2 nothing downstream can turn the visitor's successful
 * submission into a failure.
 *
 * Turnstile's siteverify call and Brevo's send are both plain fetch() calls,
 * so fetch is the seam. A test that stubs the modules instead would pass while
 * the real request shape was wrong.
 */

const SITE = "https://secureprospective.com";

interface StoredObject {
  key: string;
  body: string;
}

function makeEnv(options: { brevo?: boolean } = {}) {
  const stored: StoredObject[] = [];
  return {
    stored,
    env: {
      SP_LEADS: {
        put: async (key: string, body: string) => {
          stored.push({ key, body });
        },
      },
      TURNSTILE_SECRET_KEY: "test-secret",
      ...(options.brevo ? { BREVO_PRIVATE_API_KEY: "test-brevo-key" } : {}),
    },
  };
}

function makeRequest(body: unknown, origin: string | null = SITE): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers.Origin = origin;
  return new Request(`${SITE}/api/lead`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// A submission that passes every check, so each test can vary one thing.
const validPayload = {
  name: "Dana Reyes",
  email: "dana@example.com",
  route: "sp-plus",
  message: "Looking at SP+ for four producers.",
  source: "contact-form",
  page: "/contact/",
  turnstileToken: "0.token",
};

function call(env: unknown, request: Request) {
  // The Pages Function signature carries more than these tests need; the
  // handler only reads `request` and `env`.
  return onRequestPost({ request, env } as never) as Promise<Response>;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("challenges.cloudflare.com")) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (url.includes("api.brevo.com")) {
      return new Response(JSON.stringify({ messageId: "abc" }), { status: 201 });
    }
    throw new Error(`unexpected fetch to ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/lead — what it refuses", () => {
  it("refuses an origin that is not ours", async () => {
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest(validPayload, "https://evil.example"));
    expect(res.status).toBe(403);
    expect(stored).toHaveLength(0);
  });

  it("refuses a body that is not JSON", async () => {
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest("not json at all"));
    expect(res.status).toBe(400);
    expect(stored).toHaveLength(0);
  });

  it("refuses a missing name", async () => {
    const { env } = makeEnv();
    const res = await call(env, makeRequest({ ...validPayload, name: "   " }));
    expect(res.status).toBe(400);
  });

  it("refuses a malformed email", async () => {
    const { env } = makeEnv();
    const res = await call(env, makeRequest({ ...validPayload, email: "dana@example" }));
    expect(res.status).toBe(400);
  });

  it("refuses a route that is not one of the three lines", async () => {
    const { env } = makeEnv();
    const res = await call(env, makeRequest({ ...validPayload, route: "anything-else" }));
    expect(res.status).toBe(400);
  });

  it("refuses an unrecognised source", async () => {
    const { env } = makeEnv();
    const res = await call(env, makeRequest({ ...validPayload, source: "scripted" }));
    expect(res.status).toBe(400);
  });

  // The gate that has to be able to fail. If Turnstile ever stopped being
  // checked, every test above would still pass and the endpoint would be open.
  it("refuses when Turnstile rejects the token", async () => {
    fetchMock.mockImplementation(async () =>
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), {
        status: 200,
      }),
    );
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest(validPayload));
    expect(res.status).toBe(403);
    expect(stored).toHaveLength(0);
  });

  it("refuses when the Turnstile call itself fails", async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error("network down");
    });
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest(validPayload));
    expect(res.status).toBe(403);
    expect(stored).toHaveLength(0);
  });
});

describe("POST /api/lead — what it stores", () => {
  it("accepts a valid submission and writes exactly one object", async () => {
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest(validPayload));
    expect(res.status).toBe(200);
    expect(stored).toHaveLength(1);
  });

  it("stores the lead under a sortable leads/ key", async () => {
    const { env, stored } = makeEnv();
    await call(env, makeRequest(validPayload));
    expect(stored[0].key).toMatch(/^leads\/\d{4}-\d{2}-\d{2}T[\d:.]+Z-[0-9a-f]{8}\.json$/);
  });

  it("keeps the fields Christopher needs to answer the lead", async () => {
    const { env, stored } = makeEnv();
    await call(env, makeRequest(validPayload));
    const lead = JSON.parse(stored[0].body);
    expect(lead.name).toBe("Dana Reyes");
    expect(lead.email).toBe("dana@example.com");
    expect(lead.route).toBe("sp-plus");
    expect(lead.message).toBe("Looking at SP+ for four producers.");
    expect(lead.created_at).toEqual(expect.any(String));
  });

  it("truncates an oversized message rather than refusing the lead", async () => {
    const { env, stored } = makeEnv();
    await call(env, makeRequest({ ...validPayload, message: "x".repeat(9000) }));
    expect(stored).toHaveLength(1);
    expect(JSON.parse(stored[0].body).message).toHaveLength(4000);
  });

  it("accepts a submission with no message at all", async () => {
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest({ ...validPayload, message: "" }));
    expect(res.status).toBe(200);
    expect(JSON.parse(stored[0].body).message).toBe("");
  });
});

describe("POST /api/lead — the lead survives a failing notification", () => {
  it("still succeeds when Brevo rejects the send", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("challenges.cloudflare.com")) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response("upstream refused", { status: 500 });
    });
    const { env, stored } = makeEnv({ brevo: true });
    const res = await call(env, makeRequest(validPayload));
    expect(res.status).toBe(200);
    expect(stored).toHaveLength(1);
  });

  it("still succeeds when no Brevo key is configured at all", async () => {
    const { env, stored } = makeEnv();
    const res = await call(env, makeRequest(validPayload));
    expect(res.status).toBe(200);
    expect(stored).toHaveLength(1);
  });

  it("reports the R2 failure when the lead cannot be stored", async () => {
    const env = {
      SP_LEADS: {
        put: async () => {
          throw new Error("R2 unavailable");
        },
      },
      TURNSTILE_SECRET_KEY: "test-secret",
    };
    const res = await call(env, makeRequest(validPayload));
    expect(res.status).toBe(502);
  });
});
