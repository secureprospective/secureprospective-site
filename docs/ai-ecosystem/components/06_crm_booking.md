# Component 6 — CRM / Booking Integration

**Status:** Dark stub (P3 — interface + NullAdapter working default + Jobber stub marked TODO; no CRM credentials exist for SP or TFM).
**Last updated:** 2026-07-20 (fourth session, codeword "prove it").
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5.6 ("CRM/Booking Integration"), §0.5 ("Confirmed approach: direct MCP tool-calling (an agent invoking `createBooking()` through this component) is the correct near-term mechanism for 'AI books on the customer's behalf'").

## What this component is

A CRM-agnostic adapter interface for booking + customer-sync operations, with two implementations:
- **`NullCrmAdapter`** — the working default. Logs every call and returns `success=false` with a clear "no real CRM wired" message. Every business gets one without any configuration.
- **`JobberAdapter`** — stub for Jobber (field-service CRM named in the Hermes blueprint). Constructor + REST shape sketched; methods return documented "not yet implemented" errors. CT105 wires the real REST body construction + OAuth refresh when a Jobber account exists.

Per §0.5, this component **IS** the answer to "AI books on the customer's behalf": the agent (component 5) invokes `createBooking()` via MCP tool-calling through this component. Retail-shaped protocols (ACP, UCP) were investigated and rejected (no service/booking primitives).

## What's implemented

| File | Role |
| ── | ── |
| `src/lib/ecosystem/crm-booking/types.ts` | `CRMAdapter` interface, `CRMResult`, `Booking`, `BookingStatus`, `Customer`, `CustomerAddress`, `JobberConfig`, `CrmError`, `DEFAULT_JOBBER_API_BASE` |
| `src/lib/ecosystem/crm-booking/null-adapter.ts` | `NullCrmAdapter` — logs via injected `Logger` (or `console.warn` fallback), returns `success=false` on every call |
| `src/lib/ecosystem/crm-booking/jobber.ts` | `JobberAdapter` — constructor + REST shape via protected `call()` helper; `createBooking`/`syncCustomer` return documented TODO errors |
| `src/lib/ecosystem/crm-booking/index.ts` | Barrel |
| `src/lib/ecosystem/crm-booking/crm-booking.test.ts` | 11 checks: NullAdapter behavior (5) + Jobber constructor + stub errors (5) + interface contract (1) |

## Public API

```ts
interface CRMAdapter {
  readonly name: string;
  createBooking(booking: Booking, business: BusinessConfig): Promise<CRMResult<{ bookingId: string }>>;
  syncCustomer(customer: Customer, business: BusinessConfig): Promise<CRMResult<{ customerId: string }>>;
}

interface Booking {
  localId?: string;
  customer: Customer;
  serviceId?: string;
  serviceName?: string;
  startAt: string;        // ISO 8601
  endAt?: string;
  notes?: string;
}

interface Customer {
  localId?: string;
  name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
  notes?: string;
}

interface CRMResult<T = unknown> {
  success: boolean;
  externalId?: string;
  data?: T;
  error?: string;
}

// Default — works without any configuration.
new NullCrmAdapter({ logger? });

// Stub — REST shape sketched, methods return TODO errors.
new JobberAdapter({ accessToken, apiBaseUrl?, fetchImpl? });
```

## Decisions made

1. **`NullCrmAdapter` returns `success=false`, not a fake success.** A demo/preview environment might want NullAdapter to look like the booking succeeded — that should be a separate `StubCrmAdapter` (returns `success=true` with a fake id), not the default behavior of NullAdapter. The default must surface "no CRM wired" loudly so callers don't accidentally treat a no-op as a real booking. Loud > convenient.

2. **`NullCrmAdapter` logs via injected `Logger` (component 10) with `console.warn` fallback.** If a Logger is provided, calls go through it as structured `info` events (`crm.createBooking`, `crm.syncCustomer`) with the adapter name + business id + key fields. If not, falls back to `console.warn` so the no-op is still visible without forcing every consumer to wire a Logger.

3. **`JobberAdapter`'s public methods return `success=false` TODO errors.** Could throw instead — but throwing would force callers to write try/catch around an adapter that's documented as not-yet-implemented. Returning `success=false` with a clear error message lets callers handle it the same way they handle a real CRM failure (which is the correct response shape). The TODO in the source file (`src/lib/ecosystem/crm-booking/jobber.ts`) is the wire-up target.

4. **Protected `call()` helper on `JobberAdapter`.** The REST shape (URL pattern, Authorization Bearer, JSON:API Accept header) is captured in the helper even though the public methods don't use it yet. When CT105 wires the real body construction, the helper becomes the single point of REST enforcement — and a future test can verify the wire-up against an injected `fetchImpl` without changing the public adapter contract.

5. **JSON:API body shape documented but not implemented.** Jobber uses `{ data: { type, attributes } }` envelopes. The actual attribute mapping (which Customer fields → which Jobber client attributes, which Booking fields → which Jobber job attributes) is business-policy territory that depends on what Jobber account SP or TFM actually has. Defer to wiring time; the spec doc captures the shape so the wiring PR is mechanical.

6. **OAuth refresh is out of scope for this component.** Jobber uses OAuth 2.0 with short-lived access tokens + long-lived refresh tokens. Token storage + refresh-on-401 belongs in CT105's wiring layer (Pages secrets or D1), not in this adapter. The adapter takes a pre-refreshed `accessToken`; if it 401s, the caller refreshes and retries.

7. **No `cancelBooking` / `listCustomers` / other operations yet.** §5.6 names two operations: `createBooking` + `syncCustomer`. The interface is closed until a real adapter surfaces the need. Adding methods is backward-compatible.

## Hand-off to CT105

When a real Jobber account exists for SP or TFM:

1. **Complete OAuth handshake** in Pages Functions (jobber-api OAuth flow). Store access + refresh tokens in Pages secrets (`JOBBER_ACCESS_TOKEN`, `JOBBER_REFRESH_TOKEN`).
2. **Implement the body construction + parsing in `jobber.ts`:**
   - `createBooking`: POST to `/api/jobs` with `{ data: { type: "job", attributes: { title, startAt, endAt, clientId, notes } } }`. Extract `data.id` from the response.
   - `syncCustomer`: POST to `/api/clients` (create) or GET `/api/clients?email=<email>` to find existing. Update via PATCH `/api/clients/<id>`.
3. **Wire OAuth refresh-on-401:** the adapter throws `CrmError` on non-ok; the caller (Pages Function or agent) catches, refreshes, retries. Or add a `RefreshOn401Decorator` wrapper that wraps any `CRMAdapter`.
4. **Wire the agent (component 5) to invoke via MCP tool-calling:** add `create_booking` + `sync_customer` tools to the MCP server (component 2) backed by this adapter. The agent routes booking-requests through those tools — per §0.5, this IS the mechanism for "AI books on the customer's behalf."
5. **Adversarial test before live:** confirm the agent refuses to book when the customer's request is ambiguous, refuses to overcharge stored payment methods, surfaces all required fields back to the user for confirmation. CRM write-access is high-stakes; the agent must not silently commit a customer to an engagement.

## LOW-CONFIDENCE ITEMS

- **Jobber API URL pattern:** `https://api.getjobber.com/api/<resource>` based on Jobber's public developer docs as of mid-2026. Jobber's API has had versioning churn (v1 → v2/graphql) — verify the canonical endpoint shape at wire time.
- **Jobber OAuth scope names:** the blueprint named an env var but didn't specify scopes. Likely `clients:write` + `jobs:write` for this component's operations. Confirm against Jobber's OAuth docs.
- **JSON:API vs GraphQL:** Jobber has been migrating toward GraphQL. The REST/JSON:API shape here may be deprecated by wire time — CT105 should check Jobber's current API surface before investing in the JSON:API body construction.

## Verification

`npx vitest run src/lib/ecosystem/crm-booking` → 11/11 checks pass. All adapter calls verified against injected fakes / no real Jobber API calls in tests.
