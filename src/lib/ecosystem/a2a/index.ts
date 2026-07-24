/**
 * Component 4 — Agent-to-Agent (A2A) Protocol
 *
 * INTENTIONALLY DORMANT (Year-2 scope).
 *
 * This component ships types only, per the architecture doc §5.4. The A2A
 * protocol (public spec at github.com/a2aproject/A2A) describes agent-to-
 * agent coordination — supply-chain agents talking to inventory agents,
 * IT-ops agents talking to ticketing agents. It is NOT a customer-facing
 * commerce channel (confirmed in §0.5).
 *
 * Per §0.5: "A2A protocol — confirmed as agent-to-agent internal coordination
 * (supply chain, IT ops), not a customer-facing commerce channel. Staying
 * dormant in component 4 was the right call already."
 *
 * For "AI books on the customer's behalf" — the original blueprint's
 * scenario for A2A — component 6 (CRM/Booking) via direct MCP tool-calling
 * is the near-term mechanism. See docs/ai-ecosystem/components/06_crm_booking.md.
 *
 * What's here: type definitions matching the public A2A protocol surface.
 * What's NOT here: any wiring, any transport, any consumer. No other
 * component in the ecosystem imports from this directory yet.
 *
 * When Year-2 A2A work begins, this is the seed. Until then, leaving it
 * types-only is the explicit decision per §5.4 + §8 ("P3 dark stubs should
 * take a fraction of the effort P0 gets").
 */
export * from "./types";
