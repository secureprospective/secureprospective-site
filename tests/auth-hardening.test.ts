import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

import { hashPassword } from "../functions/_lib/password";
import { createSession, sessionCookie } from "../functions/_lib/session";
import { originAllowed } from "../functions/_lib/http";
import { onRequestGet as listGet } from "../functions/api/download/list";
import { onRequestGet as isoGet } from "../functions/api/download/iso";
import { onRequestGet as membersGet } from "../functions/api/auth/admin/members";
import { onRequestPost as changePasswordPost } from "../functions/api/auth/change-password";
import { onRequestPost as memberEditPost } from "../functions/api/auth/admin/member-edit";
import { onRequestGet as meGet } from "../functions/api/auth/me";
import { onRequest as archGate } from "../functions/members/sp-plus-security-architecture/_middleware";

/*
 * Hardening from the 2026-09-17 audit (docs/security/AUDIT-2026-09-17.md).
 * The database is real SQLite with the real migrations behind a thin D1
 * shaped adapter, so these run the handlers' actual SQL.
 */

const SITE = "https://secureprospective.com";

function d1(db: Database.Database) {
  // D1 binds numbered placeholders (?1, ?2, and ?4 twice); better-sqlite3 only
  // takes positional ones, so each ?N becomes ? with its value placed in order.
  const positional = (sql: string, args: unknown[]) => {
    const ordered: unknown[] = [];
    const text = sql.replace(/\?(\d+)/g, (_, n) => (ordered.push(args[Number(n) - 1]), "?"));
    return { text, values: /\?\d/.test(sql) ? ordered : args };
  };
  const exec = (sql: string, args: unknown[]) => {
    const { text, values } = positional(sql, args);
    return { s: db.prepare(text), values };
  };
  const stmt = (sql: string, args: unknown[] = []) => ({
    sql,
    args,
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async () => { const e = exec(sql, args); return e.s.get(...e.values) ?? null; },
    all: async () => { const e = exec(sql, args); return { results: e.s.all(...e.values) }; },
    run: async () => { const e = exec(sql, args); return { meta: { changes: e.s.run(...e.values).changes } }; },
  });
  return {
    prepare: (sql: string) => stmt(sql),
    batch: async (list: ReturnType<typeof stmt>[]) =>
      db.transaction(() => list.map((s) => { const e = exec(s.sql, s.args); return e.s.run(...e.values); }))(),
  };
}

let sqlite: Database.Database;
let env: Record<string, unknown>;
const PASSWORD = "correct horse battery";

async function addUser(id: string, email: string, role = "member", mustChange = 0) {
  sqlite
    .prepare("INSERT INTO users (id, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?)")
    .run(id, email, await hashPassword(PASSWORD), role, mustChange);
  const raw = await createSession(env.BACKOFFICE_DB as never, id);
  return sessionCookie(raw).split(";")[0];
}

function req(path: string, cookie?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("Cookie", cookie);
  return new Request(SITE + path, { ...init, headers });
}

const call = (fn: unknown, request: Request, extra: Record<string, unknown> = {}) =>
  (fn as (c: unknown) => Promise<Response>)({ request, env, ...extra });

beforeEach(() => {
  sqlite = new Database(":memory:");
  sqlite.exec(readFileSync("migrations/0002_backoffice_auth.sql", "utf8"));
  sqlite.exec(readFileSync("migrations/0003_must_change_password.sql", "utf8"));
  env = {
    BACKOFFICE_DB: d1(sqlite),
    SPPLUS_RELEASES: {
      get: async () => ({
        size: 10, httpEtag: '"e"', body: new ReadableStream(), range: undefined,
        writeHttpMetadata: () => {},
      }),
    },
  };
});

describe("one-time password sessions are held to change-password", () => {
  it("refuses downloads, admin APIs and the gated report, but allows /me", async () => {
    const cookie = await addUser("a1", "admin@example.com", "admin", 1);
    expect((await call(listGet, req("/api/download/list", cookie))).status).toBe(401);
    expect((await call(isoGet, req("/api/download/iso?v=0.11", cookie))).status).toBe(401);
    expect((await call(membersGet, req("/api/auth/admin/members", cookie))).status).toBe(403);
    expect((await call(archGate, req("/members/sp-plus-security-architecture/", cookie), { next: async () => new Response("doc") })).status).toBe(302);
    expect((await call(meGet, req("/api/auth/me", cookie))).status).toBe(200);
  });
});

describe("member-only ISO", () => {
  it("is never marked cacheable by shared caches", async () => {
    const cookie = await addUser("m1", "m@example.com");
    const res = await call(isoGet, req("/api/download/iso?v=0.11", cookie));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toMatch(/^private/);
  });
});

describe("architecture report gate", () => {
  it("redirects anonymous visitors and serves members privately", async () => {
    const next = async () => new Response("doc", { headers: { "Cache-Control": "public, s-maxage=60" } });
    const anon = await call(archGate, req("/members/sp-plus-security-architecture/"), { next });
    expect(anon.status).toBe(302);
    expect(anon.headers.get("Location")).toBe("/members/login");
    const cookie = await addUser("m1", "m@example.com");
    const ok = await call(archGate, req("/members/sp-plus-security-architecture/", cookie), { next });
    expect(ok.status).toBe(200);
    expect(await ok.text()).toBe("doc");
    expect(ok.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

describe("session revocation", () => {
  it("a password change ends every session the member holds", async () => {
    const cookieA = await addUser("m1", "m@example.com");
    const cookieB = sessionCookie(await createSession(env.BACKOFFICE_DB as never, "m1")).split(";")[0];
    const res = await call(changePasswordPost, req("/api/auth/change-password", cookieA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: PASSWORD, newPassword: "a brand new passphrase" }),
    }));
    expect(res.status).toBe(200);
    expect((await call(meGet, req("/api/auth/me", cookieB))).status).toBe(401);
    expect((sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id='m1'").get() as { n: number }).n).toBe(1);
  });

  it("rejects new passwords shorter than 12 characters", async () => {
    const cookie = await addUser("m1", "m@example.com");
    const res = await call(changePasswordPost, req("/api/auth/change-password", cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: PASSWORD, newPassword: "elevenchars" }),
    }));
    expect(res.status).toBe(400);
  });

  it("an admin role change signs the member out", async () => {
    const adminCookie = await addUser("a1", "admin@example.com", "admin");
    const memberCookie = await addUser("m1", "m@example.com");
    const res = await call(memberEditPost, req("/api/auth/admin/member-edit", adminCookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "m1", role: "admin" }),
    }));
    expect(res.status).toBe(200);
    expect((await call(meGet, req("/api/auth/me", memberCookie))).status).toBe(401);
    expect((await call(meGet, req("/api/auth/me", adminCookie))).status).toBe(200);
  });
});

describe("origin lock", () => {
  const withOrigin = (o: string) => new Request(SITE + "/api/auth/me", { headers: { Origin: o } });
  it("admits the site and its own previews only", () => {
    expect(originAllowed(withOrigin("https://secureprospective.com"))).toBe(true);
    expect(originAllowed(withOrigin("https://abc.secureprospective-site.pages.dev"))).toBe(true);
    expect(originAllowed(withOrigin("https://evil.pages.dev"))).toBe(false);
    expect(originAllowed(withOrigin("https://secureprospective-site.pages.dev.evil.com"))).toBe(false);
  });
});
