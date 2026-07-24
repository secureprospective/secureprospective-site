import type { CRMAdapter, CRMResult, Booking, Customer } from "./types";
import type { BusinessConfig } from "../catalog/types";
import type { Logger } from "../monitoring/logger";

/**
 * NullAdapter (component 6, §5.6).
 *
 * Per §5.6: "ship a `NullAdapter` that logs instead of calling out." This is
 * the working default — every business gets a CRMAdapter that doesn't crash
 * and clearly tells you in the logs that no real CRM is wired.
 *
 * It returns success=false on every call (so callers don't accidentally treat
 * "logged, no-op" as "actually booked"). For demo / preview environments
 * where you want it to look like the booking succeeded, swap to a stub
 * adapter that returns success=true with a fake id.
 */
export class NullCrmAdapter implements CRMAdapter {
  readonly name = "NullAdapter";
  private readonly logger: Logger | null;

  constructor(opts: { logger?: Logger } = {}) {
    this.logger = opts.logger ?? null;
  }

  async createBooking(
    booking: Booking,
    business: BusinessConfig,
  ): Promise<CRMResult<{ bookingId: string }>> {
    this.log("createBooking", business.id, {
      customer: booking.customer.email,
      serviceName: booking.serviceName,
      startAt: booking.startAt,
    });
    return {
      success: false,
      error:
        "NullCrmAdapter is wired — no real CRM calls are being made. " +
        "Wire a real adapter (Jobber, etc.) before relying on booking results.",
    };
  }

  async syncCustomer(
    customer: Customer,
    business: BusinessConfig,
  ): Promise<CRMResult<{ customerId: string }>> {
    this.log("syncCustomer", business.id, { email: customer.email, name: customer.name });
    return {
      success: false,
      error:
        "NullCrmAdapter is wired — no real CRM calls are being made. " +
        "Wire a real adapter before relying on customer sync results.",
    };
  }

  private log(event: string, businessId: string, fields: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.info(`crm.${event}`, { adapter: this.name, businessId, ...fields });
    } else {
      // Logger not configured — fall back to plain console.warn so the no-op
      // is visible without forcing every consumer to wire a Logger.
      console.warn(
        `[NullCrmAdapter] ${event} (business=${businessId}) ${JSON.stringify(fields)} — no real CRM wired`,
      );
    }
  }
}
