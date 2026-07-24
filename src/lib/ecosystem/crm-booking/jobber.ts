import {
  type CRMAdapter,
  type CRMResult,
  type Booking,
  type Customer,
  type JobberConfig,
  CrmError,
} from "./types";
import type { BusinessConfig } from "../catalog/types";
import { DEFAULT_JOBBER_API_BASE } from "./types";

/**
 * Jobber CRM adapter — STUB (component 6, §5.6).
 *
 * Per §5.6: "one real adapter stub for Jobber (matches the blueprint's env
 * var) marked TODO." Jobber is the named target in the Hermes blueprint
 * (field-service CRM, popular with home-services businesses — a natural fit
 * for SP's insurance/consulting clients).
 *
 * What's sketched:
 *   - REST URL pattern: api.getjobber.com/api/clients, /api/jobs (Jobber's
 *     public API uses `/api/<resource>` plural paths; JSON:API shape).
 *   - Auth: OAuth 2.0 Bearer token (the blueprint's env var; CT105 wires
 *     the OAuth flow at production time).
 *   - Headers: Authorization + Accept JSON:API media type.
 *
 * What's NOT done (the TODOs):
 *   - JSON:API request body construction (Jobber uses sparse-fieldset +
 *     related-resource patterns; the body shape depends on what fields the
 *     business actually wants synced).
 *   - Response parsing (Jobber returns `{ data: { id, type, attributes } }`
 *     envelopes; the parser needs to extract the right ids).
 *   - Error mapping (Jobber's error codes → CrmError messages).
 *   - OAuth refresh logic (tokens expire; the adapter needs to refresh on
 *     401, which means persistent token storage — not in this file).
 *
 * Wiring (CT105's lane when a real Jobber account exists for SP or TFM):
 *   1. OAuth handshake → store access + refresh tokens in Pages secrets.
 *   2. Construct JobberAdapter with the access token + business's Jobber
 *      API base (multi-region accounts may have a different base).
 *   3. Wire the agent (component 5) to invoke createBooking() / syncCustomer()
 *      via MCP tool-calling per §0.5.
 */

interface JobberClientAttributes {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  // Jobber accepts more fields (address, company, custom fields) — add when wiring.
}

interface JobberJobAttributes {
  title?: string;
  startAt?: string;
  endAt?: string;
  notes?: string;
  clientId?: string;
}

export class JobberAdapter implements CRMAdapter {
  readonly name = "Jobber";
  private readonly apiBaseUrl: string;
  private readonly accessToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: JobberConfig) {
    if (!config.accessToken) {
      throw new CrmError("JobberAdapter: accessToken required (OAuth 2.0)");
    }
    this.accessToken = config.accessToken;
    this.apiBaseUrl = config.apiBaseUrl ?? DEFAULT_JOBBER_API_BASE;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async createBooking(
    _booking: Booking,
    _business: BusinessConfig,
  ): Promise<CRMResult<{ bookingId: string }>> {
    // TODO(§5.6 wiring): POST to /api/jobs with a JSON:API body. Body shape:
    //   { data: { type: "job", attributes: { title, startAt, endAt, clientId, notes } } }
    // Then parse the response and extract job id.
    return {
      success: false,
      error: "JobberAdapter.createBooking() not yet implemented — see TODO in src/lib/ecosystem/crm-booking/jobber.ts",
    };
  }

  async syncCustomer(
    _customer: Customer,
    _business: BusinessConfig,
  ): Promise<CRMResult<{ customerId: string }>> {
    // TODO(§5.6 wiring): POST to /api/clients (create) or PATCH /api/clients/<id>
    // (update by email match). Body shape:
    //   { data: { type: "client", attributes: { name, email, phone, notes } } }
    // Then parse the response and extract client id.
    return {
      success: false,
      error: "JobberAdapter.syncCustomer() not yet implemented — see TODO in src/lib/ecosystem/crm-booking/jobber.ts",
    };
  }

  /**
   * Internal: do a real Jobber API call. Exposed as protected so a future
   * wiring pass can test the REST shape against an injected fake fetch
   * without changing the public adapter contract.
   */
  protected async call<T>(
    method: string,
    path: string,
    body?: JobberClientAttributes | JobberJobAttributes,
  ): Promise<T> {
    const url = `${this.apiBaseUrl}/api/${path}`;
    const init: RequestInit = {
      method,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    };
    if (body) init.body = JSON.stringify({ data: { type: path, attributes: body } });
    const resp = await this.fetchImpl(url, init);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new CrmError(`Jobber ${method} ${path} failed: ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ""}`);
    }
    return (await resp.json()) as T;
  }
}
