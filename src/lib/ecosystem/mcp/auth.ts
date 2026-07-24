/**
 * MCP Server auth — Cloudflare Access JWT validation seam.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.2 (component 2 — auth), §0.5 (research).
 *
 * §0.5 finding (load-bearing): a 2026 security scan of ~7,000 public MCP servers
 * found 41% require no auth at all and a third are SSRF-vulnerable. This endpoint
 * WILL be public/internet-facing (it's the whole point — external AI agents query
 * SP's structured knowledge here). Shipping without real auth is the exact failure
 * mode §0.5 names.
 *
 * The chosen mechanism (§5.2): validate the `Cf-Access-Jwt-Assertion` header
 * against Cloudflare Access. Simpler than `workers-oauth-provider` for a first
 * pass; still real cryptographic verification (not a shared-secret header).
 *
 * This file defines the CONTRACT — the actual signature verification needs the
 * Cloudflare Access JWKS (fetched from `https://<team>.cloudflareaccess.com/...`)
 * and is CT105's wiring job at deploy time. A test-only `FakeValidator` lives in
 * the smoke test, NOT in this library — same pattern as `Embedder` / `VectorizeIndex`.
 */

/**
 * Cloudflare Access JWT payload — the claims bird's downstream code actually reads.
 * Source: Cloudflare Access docs (verified). Other claims exist; these are the
 * ones the MCP layer cares about.
 */
export interface AccessClaims {
  /** Subject — typically the user's email or a Cloudflare-generated id. */
  sub: string;
  /** Audience tag — identifies which Access application this JWT was minted for. */
  aud: string | string[];
  /** Expiry (Unix seconds). Validators MUST reject expired tokens. */
  exp: number;
  /** Issued-at (Unix seconds). */
  iat: number;
  /** Issuer — `https://<team>.cloudflareaccess.com`. */
  iss: string;
  /** User email, when available. */
  email?: string;
  /** Per-claim amr/spo/from-headers metadata. */
  [claim: string]: unknown;
}

/**
 * Validates a raw JWT string from the `Cf-Access-Jwt-Assertion` header.
 *
 * Contract:
 *   - Returns the parsed claims on success.
 *   - Throws McpAuthError on ANY failure (missing/malformed/expired/wrong-audience/
 *     bad-signature). Callers convert that to a 401 response.
 *
 * Real implementation MUST verify the signature against the Cloudflare Access
 * JWKS — decoding without verifying is NOT validation. See:
 *   https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */
export interface AccessJwtValidator {
  validate(jwt: string): Promise<AccessClaims>;
}

export class McpAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpAuthError";
  }
}

/**
 * Read the `Cf-Access-Jwt-Assertion` header off a Request. Returns null if absent.
 * Throwing here would conflate "no token presented" (a 401) with "transport
 * malformed" (a 400); callers decide the response code.
 */
export function readAccessJwt(request: {
  headers: { get(name: string): string | null };
}): string | null {
  const raw = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!raw) return null;
  return raw.trim().length > 0 ? raw.trim() : null;
}
