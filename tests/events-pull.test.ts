import { describe, it, expect } from "vitest";

import { onRequestGet, onRequestPost } from "../functions/api/events/pull";

/*
 * The queue endpoint is the seam between the edge buffer and the ledger that
 * the reports are eventually built on, so the tests that matter are the ones
 * about not losing a row: an unacknowledged row must come back, and an
 * acknowledged one must not.
 */

const SITE = "https://secureprospective.com";
const TOKEN = "test-pull-token-0123456789";

interface Row {
  id: number;
  event: string;
  detail: string | null;
  path: string;
  ts: string;
  acked_at: string | null;
}

// A small stand-in for the table, which is enough because the endpoint's
// whole job is which rows it selects and which it marks.
function makeEnv(rows: Row[]) {
  const run = (sql: string, values: unknown[]) => {
    if (sql.startsWith("SELECT")) {
      const limit = values[0] as number;
      return { results: rows.filter((r) => r.acked_at === null).slice(0, limit) };
    }
    if (sql.startsWith("UPDATE")) {
      const [now, ...ids] = values;
      let changes = 0;
      for (const r of rows) {
        if (r.acked_at === null && (ids as number[]).includes(r.id)) {
          r.acked_at = now as string;
          changes += 1;
        }
      }
      return { meta: { changes } };
    }
    if (sql.startsWith("DELETE")) return { meta: { changes: 0 } };
    throw new Error(`unexpected sql: ${sql}`);
  };

  return {
    EVENTS_DB: {
      prepare: (sql: string) => ({
        bind: (...values: unknown[]) => ({
          all: async () => run(sql, values),
          run: async () => run(sql, values),
        }),
      }),
    },
    EVENTS_PULL_TOKEN: TOKEN,
  } as never;
}

function row(id: number, acked: string | null = null): Row {
  return { id, event: "tel_click", detail: null, path: "/contact/", ts: "2026-09-19T00:00:00.000Z", acked_at: acked };
}

function req(method: string, token: string | null, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(`${SITE}/api/events/pull`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const get = (env: unknown, token: string | null = TOKEN) =>
  (onRequestGet as never as (c: unknown) => Promise<Response>)({ request: req("GET", token), env });
const post = (env: unknown, body: unknown, token: string | null = TOKEN) =>
  (onRequestPost as never as (c: unknown) => Promise<Response>)({ request: req("POST", token, body), env });

describe("GET/POST /api/events/pull", () => {
  it("returns unacknowledged rows", async () => {
    const response = await get(makeEnv([row(1), row(2)]));
    expect(response.status).toBe(200);
    expect((await response.json()).rows).toHaveLength(2);
  });

  it("does not return a row that was already acknowledged", async () => {
    const response = await get(makeEnv([row(1, "2026-09-19T00:00:01.000Z"), row(2)]));
    const body = await response.json();
    expect(body.rows.map((r: Row) => r.id)).toEqual([2]);
  });

  // The property the whole write-then-ack order exists to protect.
  it("re-delivers a row that was pulled but never acknowledged, and stops once it is", async () => {
    const env = makeEnv([row(1), row(2)]);
    expect((await (await get(env)).json()).rows).toHaveLength(2);
    // Pulled, not acknowledged: it must come back.
    expect((await (await get(env)).json()).rows).toHaveLength(2);

    await post(env, { ack: [1, 2] });
    expect((await (await get(env)).json()).rows).toHaveLength(0);
  });

  it("reports how many rows the acknowledgement actually changed", async () => {
    const env = makeEnv([row(1), row(2)]);
    const body = await (await post(env, { ack: [1, 2, 99] })).json();
    expect(body.acked).toBe(2);
  });

  it("refuses a missing, wrong or malformed token", async () => {
    const env = makeEnv([row(1)]);
    expect((await get(env, null)).status).toBe(401);
    expect((await get(env, "wrong-token-of-same-length")).status).toBe(401);
    expect((await post(env, { ack: [1] }, null)).status).toBe(401);
  });

  it("refuses an acknowledgement body that is not a list of positive integers", async () => {
    const env = makeEnv([row(1)]);
    expect((await post(env, { ack: [] })).status).toBe(400);
    expect((await post(env, { ack: ["1"] })).status).toBe(400);
    expect((await post(env, { ack: [0] })).status).toBe(400);
    expect((await post(env, {})).status).toBe(400);
  });

  it("refuses everything when no token is configured at all", async () => {
    const env = { ...(makeEnv([row(1)]) as object), EVENTS_PULL_TOKEN: "" } as never;
    expect((await get(env)).status).toBe(401);
  });
});
