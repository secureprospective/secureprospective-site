/**
 * BusinessConfig — the per-business plug-in data store.
 *
 * One of these per business the wireframe serves. Loaded from
 * `config/businesses/<id>.json` by `loadBusinessConfig(id)`. Every other
 * component (agent, knowledge graph, MCP server, vector search, CRM) takes
 * a BusinessConfig as input — that's how the same code serves SP, TFM, and
 * future clients without per-business code changes.
 *
 * Canonical contract: `schema.json` (JSON Schema draft 2020-12). This file
 * mirrors it as TypeScript; keep them in sync when adding fields.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §9.
 */

export type BusinessCategory =
  | "technical_consulting"
  | "ministry"
  | (string & {}); // open union — future business shapes land without a type break

export interface BusinessContact {
  email: string;
  phone?: string;
  website?: string;
}

/**
 * Optional brand IP / methodology block. SP has the four-movement method;
 * TFM and future clients may have their own or none.
 */
export interface BusinessMethod {
  movements: string[];
  loopCloser?: string;
}

export interface BusinessConfig {
  /** Slug identifier; used as the loader key. Lowercase, no spaces. */
  id: string;
  /** Display name. */
  name: string;
  /** Business category — drives downstream entity-type choices. */
  category: BusinessCategory;
  /** Brand voice constraints the agent must obey. Free-text directive. */
  voice: string;
  /** Service-area radius in miles, or null if the business has no geographic constraint (national/remote). */
  serviceAreaRadius: number | null;
  /** Contact channels. Email is the minimum. */
  contact: BusinessContact;

  // Optional enrichments downstream components may consume.

  /** Canonical public domain (e.g. "secureprospective.com"). */
  domain?: string;
  /** Short positioning line for agent intros / MCP tool descriptions. */
  tagline?: string;
  /** Brand IP / methodology, if the business has one. SP's four movements; TFM omits. */
  method?: BusinessMethod;
}
