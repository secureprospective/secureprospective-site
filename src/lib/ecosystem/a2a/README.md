# src/lib/ecosystem/a2a/

**Intentionally dormant — Year-2 scope.** Per architecture doc §5.4 + §0.5.

The A2A protocol is for agent-to-agent internal coordination (supply chain, IT ops), not a customer-facing commerce channel. SP and TFM have no A2A use case in Phase 1.

For "AI books on the customer's behalf" — the scenario that originally motivated A2A in the Hermes blueprint — component 6 (CRM/Booking) via direct MCP tool-calling is the correct near-term mechanism. See `docs/ai-ecosystem/components/06_crm_booking.md`.

What's here: type definitions matching the public A2A protocol surface (github.com/a2aproject/A2A) — `AgentCard`, `Task`, `Message`, `Artifact`, plus the protocol envelope (`A2ARequest`, `A2AResponse`, `A2A_ERROR_CODES`). No transport, no wiring, no consumer.

When A2A work begins, this is the seed.
