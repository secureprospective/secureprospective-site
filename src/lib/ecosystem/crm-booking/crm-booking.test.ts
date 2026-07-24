import { describe, it, expect, beforeEach } from "vitest";
import {
  NullCrmAdapter,
  JobberAdapter,
  CrmError,
  DEFAULT_JOBBER_API_BASE,
} from "./index";
import type { BusinessConfig } from "../catalog/types";

/**
 * Component 6 (§5.6) — CRM/Booking checks. Light per §5/§8.
 * Verifies NullAdapter behavior + JobberAdapter constructor validation +
 * Jobber's documented "not yet implemented" stub errors.
 */

const BUSINESS = {
  id: "secureprospective",
  name: "SecureProspective",
} as BusinessConfig;

const CUSTOMER = {
  name: "Test Client",
  email: "test@example.com",
  phone: "+15551234567",
};

const BOOKING = {
  customer: CUSTOMER,
  serviceName: "AI-Native Diagnosis",
  startAt: "2026-08-01T10:00:00Z",
  endAt: "2026-08-01T11:00:00Z",
  notes: "Initial diagnostic sprint",
};

// ─────────────────────────────────────────────────────────────────────
// NullCrmAdapter
// ─────────────────────────────────────────────────────────────────────

describe("NullCrmAdapter", () => {
  let warnCalls: string[];
  let origWarn: typeof console.warn;

  beforeEach(() => {
    warnCalls = [];
    origWarn = console.warn;
    console.warn = (s: string) => warnCalls.push(s);
  });

  it("name = 'NullAdapter'", () => {
    expect(new NullCrmAdapter().name).toBe("NullAdapter");
  });

  it("createBooking returns success=false with explicit no-CRM-wired message", async () => {
    const adapter = new NullCrmAdapter();
    const r = await adapter.createBooking(BOOKING, BUSINESS);
    expect(r.success).toBe(false);
    expect(r.error).toContain("no real CRM");
  });

  it("syncCustomer returns success=false with explicit no-CRM-wired message", async () => {
    const adapter = new NullCrmAdapter();
    const r = await adapter.syncCustomer(CUSTOMER, BUSINESS);
    expect(r.success).toBe(false);
    expect(r.error).toContain("no real CRM");
  });

  it("logs to console.warn by default (no Logger injected)", async () => {
    const adapter = new NullCrmAdapter();
    await adapter.createBooking(BOOKING, BUSINESS);
    expect(warnCalls.length).toBe(1);
    expect(warnCalls[0]).toContain("NullCrmAdapter");
    expect(warnCalls[0]).toContain("createBooking");
    expect(warnCalls[0]).toContain(BUSINESS.id);
  });

  it("uses injected Logger when provided (does not touch console.warn)", async () => {
    const logged: Array<{ event: string; fields: Record<string, unknown> }> = [];
    const fakeLogger = {
      info(event: string, fields: Record<string, unknown>) {
        logged.push({ event, fields });
      },
    };
    const adapter = new NullCrmAdapter({ logger: fakeLogger as never });
    await adapter.syncCustomer(CUSTOMER, BUSINESS);
    expect(warnCalls.length).toBe(0);
    expect(logged.length).toBe(1);
    expect(logged[0].event).toBe("crm.syncCustomer");
    expect(logged[0].fields.adapter).toBe("NullAdapter");
    expect(logged[0].fields.businessId).toBe(BUSINESS.id);
    expect(logged[0].fields.email).toBe(CUSTOMER.email);
  });
});

// ─────────────────────────────────────────────────────────────────────
// JobberAdapter — constructor + stub behavior
// ─────────────────────────────────────────────────────────────────────

describe("JobberAdapter", () => {
  it("name = 'Jobber'", () => {
    const a = new JobberAdapter({ accessToken: "tok" });
    expect(a.name).toBe("Jobber");
  });

  it("throws CrmError without accessToken", () => {
    expect(() => new JobberAdapter({ accessToken: "" })).toThrow(CrmError);
  });

  it("uses DEFAULT_JOBBER_API_BASE when apiBaseUrl not specified", () => {
    expect(DEFAULT_JOBBER_API_BASE).toBe("https://api.getjobber.com");
  });

  it("createBooking returns success=false with TODO message", async () => {
    const a = new JobberAdapter({ accessToken: "tok" });
    const r = await a.createBooking(BOOKING, BUSINESS);
    expect(r.success).toBe(false);
    expect(r.error).toContain("not yet implemented");
    expect(r.error).toContain("TODO");
  });

  it("syncCustomer returns success=false with TODO message", async () => {
    const a = new JobberAdapter({ accessToken: "tok" });
    const r = await a.syncCustomer(CUSTOMER, BUSINESS);
    expect(r.success).toBe(false);
    expect(r.error).toContain("not yet implemented");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Interface contract — both adapters satisfy CRMAdapter
// ─────────────────────────────────────────────────────────────────────

describe("CRMAdapter contract", () => {
  it("NullCrmAdapter + JobberAdapter both expose createBooking + syncCustomer", () => {
    const adapters = [
      new NullCrmAdapter(),
      new JobberAdapter({ accessToken: "tok" }),
    ];
    for (const a of adapters) {
      expect(typeof a.name).toBe("string");
      expect(typeof a.createBooking).toBe("function");
      expect(typeof a.syncCustomer).toBe("function");
    }
  });
});
