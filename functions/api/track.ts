// Pages Function: POST /api/track
//
// The website intent beacon. Cloudflare Web Analytics has no custom
// events, so today a visitor tapping the call button, copying the phone
// number, or being unable to submit the form at all leaves no trace.
// This endpoint is the narrow, allowlisted write surface that fixes it.
//
// It is deliberately NOT shaped like lead.ts. A lead is a person who
// chose to identify themselves, so lead.ts stores an IP, a user agent
// and free text, and it fails closed behind Turnstile. An intent event
// is anonymous and must stay that way, so this endpoint stores no
// identifier of any kind and requires no challenge. A challenge on a
// fire-and-forget beacon would be absurd, and would make `turnstile_fail`
// — the one event that matters most — impossible to report.
//
// Rows written here are a BUFFER. The permanent record is the Hermes
// ledger, which is what the dashboard and the periodic reports read.
// See migrations/0008_intent_events.sql.

import { originAllowed, isJsonRequest } from "../_lib/http";

interface Env {
  EVENTS_DB: D1Database;
}

// The event vocabulary. This allowlist is the gate that stops the
// endpoint becoming an open write surface, and it is also the reporting
// vocabulary: every name here becomes a series the dashboard can count
// over a week, a month or a year. Add names, never repurpose one, or
// the rename silently splits its own history.
//
// A value of null means the event carries no detail. Otherwise the set
// is exhaustive: `detail` is chosen from it, never free text from the
// page.
const EVENTS: Record<string, ReadonlySet<string> | null> = {
  turnstile_fail: new Set(["timeout", "blocked"]),
  tel_click: null,
  tel_copy: null,
  form_start: null,
  form_abandon: new Set(["name", "email", "route", "message"]),
  form_submit: new Set(["ok", "invalid", "error"]),
  mailto_click: null,
  outbound_click: new Set([
    "linkedin.com",
    "www.linkedin.com",
    "facebook.com",
    "www.facebook.com",
    "x.com",
    "calendly.com",
  ]),
  scroll_depth: new Set(["25", "50", "75", "100"]),
};

// A page-unload beacon may carry more than one pending event, so a small
// batch is allowed. The cap is what keeps a single request from being a
// cheap way to write a thousand rows.
const MAX_EVENTS = 10;

// Body cap. Ten events of this shape is a few hundred bytes; 4 KB is
// generous and still refuses anything trying to use this as storage.
const MAX_BODY_BYTES = 4096;

const PATH_MAX = 200;

interface Incoming {
  event?: unknown;
  detail?: unknown;
  path?: unknown;
}

// Path only, and normalised twice: once in the client and again here,
// because the client is the half an attacker controls. Query strings and
// fragments are where an identifier would otherwise smuggle itself in.
function normalisePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.split("?")[0].split("#")[0].trim();
  if (!raw.startsWith("/")) return null;
  if (raw.length > PATH_MAX) return null;
  // No control characters, no backslashes, no schemes. A path the site
  // could actually serve, or nothing.
  if (!/^[A-Za-z0-9/_\-.]*$/.test(raw.slice(1))) return null;
  return raw;
}

function validate(item: Incoming): { event: string; detail: string | null; path: string } | null {
  const event = typeof item.event === "string" ? item.event : "";
  if (!Object.prototype.hasOwnProperty.call(EVENTS, event)) return null;

  const allowed = EVENTS[event];
  let detail: string | null = null;
  if (allowed === null) {
    // An event that carries no detail may not acquire one.
    if (item.detail !== undefined && item.detail !== null) return null;
  } else {
    if (typeof item.detail !== "string" || !allowed.has(item.detail)) return null;
    detail = item.detail;
  }

  const path = normalisePath(item.path);
  if (path === null) return null;

  return { event, detail, path };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!originAllowed(request)) return new Response(null, { status: 403 });
  if (!isJsonRequest(request)) return new Response(null, { status: 415 });

  // Declared length first, so an oversized body is refused before it is
  // read rather than after.
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }

  const incoming: Incoming[] = Array.isArray(parsed) ? parsed : [parsed as Incoming];
  if (incoming.length === 0 || incoming.length > MAX_EVENTS) {
    return new Response(null, { status: 400 });
  }

  // All or nothing. A partially accepted batch would mean the caller
  // cannot tell what landed, and a silent drop is the failure mode this
  // whole build exists to remove.
  const rows = [];
  for (const item of incoming) {
    const row = validate(item ?? {});
    if (row === null) return new Response(null, { status: 400 });
    rows.push(row);
  }

  // The timestamp is the server's, never the client's: a wrong clock on
  // a visitor's phone must not be able to land in the record and skew a
  // monthly report.
  const ts = new Date().toISOString();

  try {
    const insert = env.EVENTS_DB.prepare(
      "INSERT INTO intent_events (event, detail, path, ts) VALUES (?, ?, ?, ?)",
    );
    await env.EVENTS_DB.batch(rows.map((r) => insert.bind(r.event, r.detail, r.path, ts)));
  } catch (err) {
    // The visitor gets 204 regardless: this is a beacon, the page has
    // already moved on, and there is no one to tell. The log line is the
    // only channel, and a gap in the ledger is the observable symptom.
    console.error("track: D1 write failed", err instanceof Error ? err.message : String(err));
  }

  return new Response(null, { status: 204 });
};
