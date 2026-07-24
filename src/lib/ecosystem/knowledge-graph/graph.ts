/**
 * KnowledgeGraph — business-scoped CRUD + traversal over D1 entities and relationships.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5 (component 1).
 *
 * Every method is scoped to the BusinessConfig passed at construction — `business_id`
 * is automatically applied to all inserts and filters. This is the wireframe's
 * business-agnosticism in practice: the same class serves SP and TFM with no code
 * changes, only different BusinessConfig instances.
 *
 * SQL lives in migrations/0001_ecosystem_knowledge_graph.sql.
 */

import type { BusinessConfig } from "../catalog/types";
import type {
  D1Database,
  Entity,
  EntityInput,
  EntityPatch,
  EntityType,
  ListOptions,
  RelatedEntity,
  RelationType,
  Relationship,
  RelationshipInput,
  TraversalDirection,
} from "./types";

/** Raw row shape from D1 (data is a JSON string; we deserialize on read). */
interface EntityRow {
  id: string;
  business_id: string;
  type: string;
  name: string;
  data: string | null;
  created_at: string;
  updated_at: string;
}

interface RelationshipRow {
  id: string;
  business_id: string;
  from_id: string;
  to_id: string;
  type: string;
  data: string | null;
  created_at: string;
}

export class KnowledgeGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeGraphError";
  }
}

function deserializeEntity(row: EntityRow): Entity {
  return {
    id: row.id,
    business_id: row.business_id,
    type: row.type,
    name: row.name,
    data: row.data ? (JSON.parse(row.data) as Record<string, unknown>) : {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function deserializeRelationship(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    business_id: row.business_id,
    from_id: row.from_id,
    to_id: row.to_id,
    type: row.type,
    data: row.data ? (JSON.parse(row.data) as Record<string, unknown>) : {},
    created_at: row.created_at,
  };
}

export class KnowledgeGraph {
  constructor(
    private readonly db: D1Database,
    private readonly business: BusinessConfig,
  ) {}

  private get bid(): string {
    return this.business.id;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Entity CRUD
  // ─────────────────────────────────────────────────────────────────────

  /** Insert an entity. Throws KnowledgeGraphError on uniqueness violations. */
  async createEntity(input: EntityInput): Promise<Entity> {
    const data = JSON.stringify(input.data ?? {});
    try {
      await this.db
        .prepare(
          `INSERT INTO entities (id, business_id, type, name, data)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(input.id, this.bid, input.type, input.name, data)
        .run();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      // SQLite's UNIQUE violation format: "UNIQUE constraint failed: <table>.<col>, ..."
      // May also include the index name depending on driver — match either.
      if (
        msg.includes("UNIQUE constraint") ||
        msg.includes("idx_entities_business_type_name") ||
        msg.includes("idx_entities_business_id")
      ) {
        throw new KnowledgeGraphError(
          `Entity violates uniqueness in business "${this.bid}": ` +
            `id="${input.id}", type="${input.type}", name="${input.name}". ` +
            `Underlying: ${msg.split("\n")[0]}`,
        );
      }
      throw e;
    }
    const created = await this.getEntity(input.id);
    if (!created) {
      throw new KnowledgeGraphError(
        `createEntity: insert reported success but row not found for id "${input.id}"`,
      );
    }
    return created;
  }

  /** Fetch an entity by id. Returns null if not found or belongs to a different business. */
  async getEntity(id: string): Promise<Entity | null> {
    const row = await this.db
      .prepare(
        `SELECT id, business_id, type, name, data, created_at, updated_at
         FROM entities WHERE id = ? AND business_id = ?`,
      )
      .bind(id, this.bid)
      .first<EntityRow>();
    return row ? deserializeEntity(row) : null;
  }

  /** List entities of a given type, scoped to this business. */
  async getEntitiesByType(
    type: EntityType,
    opts: ListOptions = {},
  ): Promise<Entity[]> {
    const limit = Math.max(0, Math.min(opts.limit ?? 100, 1000));
    const offset = Math.max(0, opts.offset ?? 0);
    const result = await this.db
      .prepare(
        `SELECT id, business_id, type, name, data, created_at, updated_at
         FROM entities
         WHERE business_id = ? AND type = ?
         ORDER BY name ASC
         LIMIT ? OFFSET ?`,
      )
      .bind(this.bid, type, limit, offset)
      .all<EntityRow>();
    return (result.results ?? []).map(deserializeEntity);
  }

  /**
   * Update an entity's name and/or data. `updated_at` is bumped automatically.
   * Patching `data` replaces it wholesale (merge at the caller layer if needed).
   */
  async updateEntity(id: string, patch: EntityPatch): Promise<Entity | null> {
    const sets: string[] = ["updated_at = datetime('now')"];
    const params: unknown[] = [];
    if (patch.name !== undefined) {
      sets.push("name = ?");
      params.push(patch.name);
    }
    if (patch.data !== undefined) {
      sets.push("data = ?");
      params.push(JSON.stringify(patch.data));
    }
    if (sets.length === 1) {
      // Only updated_at would change — no-op patch.
      return this.getEntity(id);
    }
    await this.db
      .prepare(
        `UPDATE entities SET ${sets.join(", ")}
         WHERE id = ? AND business_id = ?`,
      )
      .bind(...params, id, this.bid)
      .run();
    return this.getEntity(id);
  }

  /**
   * Delete an entity. Cascade-deletes any relationships referencing it (FK ON DELETE CASCADE).
   * Returns true if a row was deleted, false if the entity didn't exist.
   */
  async deleteEntity(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `DELETE FROM entities WHERE id = ? AND business_id = ?`,
      )
      .bind(id, this.bid)
      .run();
    const changes = (result.meta as { changes?: number } | undefined)?.changes ?? 0;
    return changes > 0;
  }

  /**
   * Free-text search across entity name + JSON data values, scoped to this business.
   * Uses SQLite LIKE on the serialized data column — fine for Phase 1 corpus sizes;
   * component 8 (Vectorize) is the production semantic-search path.
   */
  async searchEntities(
    query: string,
    opts: { type?: EntityType; limit?: number } = {},
  ): Promise<Entity[]> {
    const term = `%${query.toLowerCase()}%`;
    const limit = Math.max(1, Math.min(opts.limit ?? 20, 100));
    const sql = opts.type
      ? `SELECT id, business_id, type, name, data, created_at, updated_at
         FROM entities
         WHERE business_id = ? AND type = ?
           AND (LOWER(name) LIKE ? OR LOWER(data) LIKE ?)
         ORDER BY name ASC
         LIMIT ?`
      : `SELECT id, business_id, type, name, data, created_at, updated_at
         FROM entities
         WHERE business_id = ?
           AND (LOWER(name) LIKE ? OR LOWER(data) LIKE ?)
         ORDER BY name ASC
         LIMIT ?`;
    const stmt = this.db.prepare(sql);
    const result = opts.type
      ? await stmt.bind(this.bid, opts.type, term, term, limit).all<EntityRow>()
      : await stmt.bind(this.bid, term, term, limit).all<EntityRow>();
    return (result.results ?? []).map(deserializeEntity);
  }

  /**
   * Count entities, optionally filtered by type. Useful for stats endpoints.
   */
  async count(type?: EntityType): Promise<number> {
    const sql = type
      ? `SELECT COUNT(*) AS n FROM entities WHERE business_id = ? AND type = ?`
      : `SELECT COUNT(*) AS n FROM entities WHERE business_id = ?`;
    const stmt = this.db.prepare(sql);
    const row = type
      ? await stmt.bind(this.bid, type).first<{ n: number }>()
      : await stmt.bind(this.bid).first<{ n: number }>();
    return row?.n ?? 0;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Relationship CRUD
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Create a directed edge `fromId →(type)→ toId`. Both endpoints must already
   * exist in this business. Throws KnowledgeGraphError on:
   *   - missing endpoint (FK violation surfaces as KnowledgeGraphError)
   *   - duplicate edge (same from/to/type within this business)
   */
  async createRelationship(input: RelationshipInput): Promise<Relationship> {
    const data = JSON.stringify(input.data ?? {});
    try {
      await this.db
        .prepare(
          `INSERT INTO relationships (id, business_id, from_id, to_id, type, data)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(input.id, this.bid, input.fromId, input.toId, input.type, data)
        .run();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (
        msg.includes("UNIQUE constraint") ||
        msg.includes("idx_rel_business_from_to_type")
      ) {
        throw new KnowledgeGraphError(
          `Relationship ${input.fromId} →(${input.type})→ ${input.toId} already exists in business "${this.bid}".`,
        );
      }
      if (
        msg.includes("FOREIGN KEY") ||
        msg.includes("foreign key") ||
        msg.includes("foreign_key")
      ) {
        throw new KnowledgeGraphError(
          `createRelationship: endpoint missing in business "${this.bid}" ` +
            `(from=${input.fromId}, to=${input.toId}). Underlying: ${msg.split("\n")[0]}`,
        );
      }
      throw e;
    }
    const created = await this.getRelationship(input.id);
    if (!created) {
      throw new KnowledgeGraphError(
        `createRelationship: insert reported success but row not found for id "${input.id}"`,
      );
    }
    return created;
  }

  /** Fetch a relationship by id. Returns null if not found or wrong business. */
  async getRelationship(id: string): Promise<Relationship | null> {
    const row = await this.db
      .prepare(
        `SELECT id, business_id, from_id, to_id, type, data, created_at
         FROM relationships WHERE id = ? AND business_id = ?`,
      )
      .bind(id, this.bid)
      .first<RelationshipRow>();
    return row ? deserializeRelationship(row) : null;
  }

  /** Delete a relationship by id. Returns true if a row was deleted. */
  async deleteRelationship(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `DELETE FROM relationships WHERE id = ? AND business_id = ?`,
      )
      .bind(id, this.bid)
      .run();
    const changes = (result.meta as { changes?: number } | undefined)?.changes ?? 0;
    return changes > 0;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Traversal
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Find entities related to `entityId` via edges of (optionally) a specific type.
   *
   * Direction:
   *   "out"  (default) — edges where entityId is the `from_id`; returned entities are `to_id`s.
   *   "in"            — edges where entityId is the `to_id`; returned entities are `from_id`s.
   *   "both"          — union of both, with `direction` field on each result.
   *
   * Returns null (not an error) if the queried entity doesn't exist — callers
   * deciding between "no related entities" and "no such entity" should call
   * getEntity first.
   */
  async getRelated(
    entityId: string,
    relationType?: RelationType,
    direction: TraversalDirection = "out",
  ): Promise<RelatedEntity[]> {
    if (direction === "both") {
      const outResults = await this.getRelated(entityId, relationType, "out");
      const inResults = await this.getRelated(entityId, relationType, "in");
      return [...outResults, ...inResults];
    }

    const edgeCol = direction === "out" ? "from_id" : "to_id";
    const otherCol = direction === "out" ? "to_id" : "from_id";

    const typeClause = relationType ? "AND r.type = ?" : "";
    const params: unknown[] = [this.bid, entityId];
    if (relationType) params.push(relationType);

    const sql = `
      SELECT
        r.id AS r_id, r.business_id AS r_business_id, r.from_id AS r_from_id,
        r.to_id AS r_to_id, r.type AS r_type, r.data AS r_data, r.created_at AS r_created_at,
        e.id AS e_id, e.business_id AS e_business_id, e.type AS e_type,
        e.name AS e_name, e.data AS e_data, e.created_at AS e_created_at, e.updated_at AS e_updated_at
      FROM relationships r
      JOIN entities e ON e.id = r.${otherCol} AND e.business_id = r.business_id
      WHERE r.business_id = ? AND r.${edgeCol} = ? ${typeClause}
      ORDER BY r.created_at ASC
    `;

    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .all<{
        r_id: string;
        r_business_id: string;
        r_from_id: string;
        r_to_id: string;
        r_type: string;
        r_data: string | null;
        r_created_at: string;
        e_id: string;
        e_business_id: string;
        e_type: string;
        e_name: string;
        e_data: string | null;
        e_created_at: string;
        e_updated_at: string;
      }>();

    return (result.results ?? []).map((row) => ({
      relationship: {
        id: row.r_id,
        business_id: row.r_business_id,
        from_id: row.r_from_id,
        to_id: row.r_to_id,
        type: row.r_type,
        data: row.r_data ? (JSON.parse(row.r_data) as Record<string, unknown>) : {},
        created_at: row.r_created_at,
      },
      entity: {
        id: row.e_id,
        business_id: row.e_business_id,
        type: row.e_type,
        name: row.e_name,
        data: row.e_data ? (JSON.parse(row.e_data) as Record<string, unknown>) : {},
        created_at: row.e_created_at,
        updated_at: row.e_updated_at,
      },
      direction,
    }));
  }
}
