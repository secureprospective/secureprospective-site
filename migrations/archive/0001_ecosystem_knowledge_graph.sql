-- migrations/0001_ecosystem_knowledge_graph.sql
-- Knowledge Graph schema for the AI-ecosystem wireframe.
-- Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 1).
-- Applies to a NEW D1 database. CT105 creates + binds it (see §3 deployment map).
-- Bird never runs `wrangler d1 migrations apply` — that arrow is CT105's.

-- Entities: nodes in the knowledge graph, partitioned by business.
-- `id` is the global PK (caller generates business-prefixed slugs; see ids.ts).
-- `data` holds type-specific fields as JSON
--   (e.g. {base_price, duration_minutes, active} for a service,
--          {question, answer, category, priority} for a FAQ).
CREATE TABLE IF NOT EXISTS entities (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Within a business, (type, name) is unique — prevents duplicate "HVAC Maintenance" rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_business_type_name
  ON entities(business_id, type, name);

-- Composite-FK target: required so relationships.(business_id, from_id/to_id) can
-- reference entities by (business_id, id). SQLite needs an explicit UNIQUE index on
-- the parent columns for composite FKs; the global PK on `id` alone is insufficient.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_business_id
  ON entities(business_id, id);

-- Common query: list entities by business + type (e.g. all FAQs for SP).
CREATE INDEX IF NOT EXISTS idx_entities_business_type
  ON entities(business_id, type);

-- Relationships: directed edges between entities.
-- `from_id` → `to_id`, with `type` as the edge label
--   (e.g. "has_answer_for", "relates_to", "offered_by", "priced_by", "demonstrated_by").
CREATE TABLE IF NOT EXISTS relationships (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  from_id     TEXT NOT NULL,
  to_id       TEXT NOT NULL,
  type        TEXT NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  -- Composite FKs: an edge's endpoints must exist AND belong to the same business.
  -- This is the write-path enforcement of the §0 wireframe rule (no cross-business
  -- leaks). The read-path enforcement is the JOIN in KnowledgeGraph.getRelated.
  -- Requires SQLite PRAGMA foreign_keys = ON (default off — set at connection setup).
  FOREIGN KEY (business_id, from_id) REFERENCES entities(business_id, id) ON DELETE CASCADE,
  FOREIGN KEY (business_id, to_id)   REFERENCES entities(business_id, id) ON DELETE CASCADE
);

-- Traversal: given an entity, find edges going OUT (most common pattern).
CREATE INDEX IF NOT EXISTS idx_rel_from_type
  ON relationships(from_id, type);

-- Traversal: given an entity, find edges coming IN (e.g. "which services reference this FAQ?").
CREATE INDEX IF NOT EXISTS idx_rel_to_type
  ON relationships(to_id, type);

-- Within a business, prevent duplicate edges of the same type between the same pair.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rel_business_from_to_type
  ON relationships(business_id, from_id, to_id, type);

-- Convenience: count by business.
CREATE INDEX IF NOT EXISTS idx_rel_business
  ON relationships(business_id);
