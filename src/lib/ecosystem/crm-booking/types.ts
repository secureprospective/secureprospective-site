import type { BusinessConfig } from "../catalog/types";

/**
 * CRM / Booking integration types (component 6, §5.6).
 *
 * Interface-first. No real adapter is wired yet — per §5.6, "no CRM
 * credentials exist for SP or TFM." The NullAdapter is the working default
 * (logs instead of calling out); JobberAdapter is the stub for the blueprint's
 * named CRM target.
 *
 * Per §0.5: "Component 6 (direct MCP tool-calling for booking) is confirmed
 * as the correct near-term answer" for "AI books on the customer's behalf."
 * ACP/UCP retail protocols were investigated and rejected (no service/
 * booking primitives).
 */

// ─────────────────────────────────────────────────────────────────────
// Customer
// ─────────────────────────────────────────────────────────────────────

export interface Customer {
  /** Caller-provided id (stable across syncs); the CRM may assign its own. */
  localId?: string;
  /** Full name as the customer gave it. */
  name: string;
  /** Email address. */
  email: string;
  /** Phone (E.164 preferred, but accept any string the user typed). */
  phone?: string;
  /** Optional postal address. */
  address?: CustomerAddress;
  /** Free-form notes the business wants attached to this customer. */
  notes?: string;
}

export interface CustomerAddress {
  street: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Booking
// ─────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "canceled";

export interface Booking {
  /** Caller-provided id (stable across syncs). */
  localId?: string;
  /** Customer this booking is for. */
  customer: Customer;
  /** Service id from the business's catalog (component 9). */
  serviceId?: string;
  /** Service name (denormalized — the CRM may not understand our service ids). */
  serviceName?: string;
  /** Requested start time, ISO 8601. */
  startAt: string;
  /** Optional end time, ISO 8601. */
  endAt?: string;
  /** Free-form notes the customer or business added. */
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Adapter interface + result types
// ─────────────────────────────────────────────────────────────────────

export interface CRMResult<T = unknown> {
  success: boolean;
  /** Id assigned by the CRM system (null if not yet created / on error). */
  externalId?: string;
  /** Returned payload (typed by the caller). */
  data?: T;
  /** Error message on failure. */
  error?: string;
}

/**
 * CRM adapter interface — what every adapter (Null, Jobber, future HubSpot,
 * Salesforce, etc.) must satisfy. The agent (component 5) can invoke any of
 * these via MCP tool-calling.
 *
 * Per §5.6: interface-first. Methods cover the two operations the Hermes
 * blueprint named — createBooking + syncCustomer. Other operations
 * (cancelBooking, listCustomers, etc.) can be added when a real adapter
 * surfaces the need.
 */
export interface CRMAdapter {
  /** Adapter display name (e.g. "NullAdapter", "Jobber"). */
  readonly name: string;

  /**
   * Create a booking in the CRM. Idempotency is the caller's responsibility
   * (use localId); the adapter should not de-dupe automatically.
   */
  createBooking(booking: Booking, business: BusinessConfig): Promise<CRMResult<{ bookingId: string }>>;

  /**
   * Sync a customer record (create or update by email). Returns the CRM's
   * external id for the customer.
   */
  syncCustomer(customer: Customer, business: BusinessConfig): Promise<CRMResult<{ customerId: string }>>;
}

export class CrmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmError";
  }
}

// ─────────────────────────────────────────────────────────────────────
// Jobber configuration (stub target per §5.6)
// ─────────────────────────────────────────────────────────────────────

export interface JobberConfig {
  /** Jobber API base URL — defaults to the public API. */
  apiBaseUrl?: string;
  /** OAuth 2.0 access token (the env var the blueprint named). */
  accessToken: string;
  /** Optional fetch impl injection (testing). */
  fetchImpl?: typeof fetch;
}

export const DEFAULT_JOBBER_API_BASE = "https://api.getjobber.com";
