/**
 * Knowledge Graph types.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 1).
 * Storage: Cloudflare D1 (SQLite at the edge) — see
 *   migrations/0001_ecosystem_knowledge_graph.sql.
 * Adapted from the Hermes Neo4j blueprint at
 *   docs/from-hermes/CT105/COMPONENTS/01_KNOWLEDGE_GRAPH_DATABASE.md
 * (entity types preserved; storage layer swapped per §2 of the architecture doc).
 */

/** Entity types locked per §5. Open union — future businesses may add types. */
export type EntityType =
  | "service"
  | "faq"
  | "question"
  | "pricing"
  | "staff"
  | "case_study"
  | (string & {});

/**
 * Relationship types seeded from Hermes patterns. Open union — downstream
 * components (CRM, transcription) may add their own edge labels.
 *
 * Convention: relationship types read as `from_type TYPE → to_type`.
 *   has_answer_for:  service    → faq
 *   relates_to:      question   → service (or generic)
 *   offered_by:      service    → staff
 *   priced_by:       service    → pricing
 *   demonstrated_by: service    → case_study
 */
export type RelationType =
  | "has_answer_for"
  | "relates_to"
  | "offered_by"
  | "priced_by"
  | "demonstrated_by"
  | (string & {});

/** A row in the `entities` table. `data` is the deserialized type-specific JSON. */
export interface Entity {
  id: string;
  business_id: string;
  type: EntityType;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Input for createEntity. id/type/name required; data defaults to {}. */
export interface EntityInput {
  id: string;
  type: EntityType;
  name: string;
  data?: Record<string, unknown>;
}

/** Patch for updateEntity. At least one field must be present. */
export interface EntityPatch {
  name?: string;
  data?: Record<string, unknown>;
}

/** A row in the `relationships` table. */
export interface Relationship {
  id: string;
  business_id: string;
  from_id: string;
  to_id: string;
  type: RelationType;
  data: Record<string, unknown>;
  created_at: string;
}

/** Input for createRelationship. */
export interface RelationshipInput {
  id: string;
  fromId: string;
  toId: string;
  type: RelationType;
  data?: Record<string, unknown>;
}

/** Direction for getRelated traversal. */
export type TraversalDirection = "out" | "in" | "both";

/** Result of getRelated — the edge plus the entity on the other end. */
export interface RelatedEntity {
  relationship: Relationship;
  entity: Entity;
  /** Which side of the edge `entity` is on, relative to the queried entity. */
  direction: "out" | "in";
}

/** Options for getEntitiesByType. */
export interface ListOptions {
  limit?: number;
  offset?: number;
}

/**
 * Minimal D1Database interface — only the surface KnowledgeGraph uses.
 *
 * Tradeoff: installing `@cloudflare/workers-types` as a devDep would (a) supply
 * the full type and (b) resolve pre-existing tsc errors in functions/api/{ask,lead}.ts
 * (`PagesFunction`, `R2Bucket`). Kept local for now to keep this component's diff
 * small and dep-free; CT105 can bless the devDep change at review time.
 */
export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: unknown;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[][]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
