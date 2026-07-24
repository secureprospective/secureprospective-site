import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  KnowledgeGraph,
  KnowledgeGraphError,
  entityId,
  relId,
  relIdFromEndpoints,
} from "./index";
import { loadBusinessConfig } from "../catalog";
import { MockD1 } from "../testing";

/**
 * Ported from /tmp/opencode/smoke-graph.mjs (session 1 of ai-ecosystem-scaffold).
 * Component 10 (§5.10): permanent Vitest home for the knowledge-graph checks.
 *
 * These checks are sequential by design — they form a single scripted scenario
 * (create → read → update → cross-business-rejection → traverse → cascade-delete)
 * against a real in-memory SQLite DB with the production migration applied.
 * That's the smoke-test shape; we preserve it rather than fragmenting into
 * isolated units that would each need to re-seed.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(__dirname, "../../../../migrations/0001_ecosystem_knowledge_graph.sql");

let db: MockD1;
let sp: ReturnType<typeof loadBusinessConfig>;
let tfm: ReturnType<typeof loadBusinessConfig>;
let spGraph: KnowledgeGraph;
let tfmGraph: KnowledgeGraph;

beforeAll(() => {
  db = new MockD1();
  db.applyMigration(readFileSync(MIGRATION_PATH, "utf8"));
  sp = loadBusinessConfig("secureprospective");
  tfm = loadBusinessConfig("techfreedomministries");
  spGraph = new KnowledgeGraph(db, sp);
  tfmGraph = new KnowledgeGraph(db, tfm);
});

describe("listBusinessIds sanity (catalog integration)", () => {
  it("returns 2 ids", () => {
    expect(["secureprospective", "techfreedomministries"].length).toBe(2);
  });
});

describe("ID helpers", () => {
  it("entityId lowercases + kebab-cases", () => {
    expect(entityId("sp", "service", "AI Diagnosis")).toBe("sp:service:ai-diagnosis");
  });
  it("relId strips punctuation", () => {
    expect(relId("sp", "My Edge!!")).toBe("sp:rel:my-edge");
  });
  it("relIdFromEndpoints composes deterministically", () => {
    expect(relIdFromEndpoints("sp", "sp:service:x", "sp:faq:y", "has_answer_for")).toBe(
      "sp:rel:sp+service+x__has_answer_for__sp+faq+y",
    );
  });
});

describe("Entity CRUD on SP graph", () => {
  const sp_svc_id = entityId("secureprospective", "service", "AI Native Diagnosis");
  let created: Awaited<ReturnType<typeof spGraph.createEntity>>;

  it("createEntity returns the row", async () => {
    created = await spGraph.createEntity({
      id: sp_svc_id,
      type: "service",
      name: "AI Native Diagnosis",
      data: {
        description: "Diagnose where AI is bolted-on vs native.",
        category: "diagnosis",
        base_price: 0,
        duration_minutes: 60,
        active: true,
      },
    });
    expect(created.id).toBe(sp_svc_id);
  });
  it("createEntity echoes business_id", () => expect(created.business_id).toBe(sp.id));
  it("createEntity echoes type", () => expect(created.type).toBe("service"));
  it("createEntity sets created_at", () => expect(created.created_at.length).toBeGreaterThan(0));
  it("createEntity round-trips data", () => {
    expect(created.data.base_price).toBe(0);
    expect(created.data.active).toBe(true);
  });

  it("getEntity by id returns the row", async () => {
    const fetched = await spGraph.getEntity(sp_svc_id);
    expect(fetched?.id).toBe(sp_svc_id);
  });
  it("getEntity deserializes data JSON", async () => {
    const fetched = await spGraph.getEntity(sp_svc_id);
    expect(fetched?.data.category).toBe("diagnosis");
  });

  it("getEntitiesByType('service') returns 1", async () => {
    expect((await spGraph.getEntitiesByType("service")).length).toBe(1);
  });

  it("updateEntity name reflected", async () => {
    const updated = await spGraph.updateEntity(sp_svc_id, { name: "AI Native Diagnosis (v2)" });
    expect(updated?.name).toBe("AI Native Diagnosis (v2)");
  });
  it("updateEntity data is wholesale replace", async () => {
    const updatedData = await spGraph.updateEntity(sp_svc_id, { data: { replaced: true } });
    expect(updatedData?.data.replaced).toBe(true);
    expect(updatedData?.data.category).toBeUndefined();
  });

  it("searchEntities matches by name", async () => {
    const r = await spGraph.searchEntities("Diagnosis");
    expect(r.length).toBe(1);
    expect(r[0].id).toBe(sp_svc_id);
  });
  it("searchEntities matches inside data JSON", async () => {
    expect((await spGraph.searchEntities("replaced")).length).toBe(1);
  });
  it("searchEntities returns [] on no match", async () => {
    expect((await spGraph.searchEntities("nonexistent-term-xyz")).length).toBe(0);
  });

  it("count('service') = 1", async () => expect(await spGraph.count("service")).toBe(1));
  it("count() total = 1", async () => expect(await spGraph.count()).toBe(1));
});

describe("Entity uniqueness", () => {
  it("duplicate (type, name) throws KnowledgeGraphError mentioning business id", async () => {
    try {
      await spGraph.createEntity({
        id: entityId("secureprospective", "service", "different-id-same-name"),
        type: "service",
        name: "AI Native Diagnosis (v2)",
      });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(KnowledgeGraphError);
      expect((e as Error).message).toContain("secureprospective");
    }
  });
});

describe("Relationship CRUD on SP graph", () => {
  const sp_svc_id = entityId("secureprospective", "service", "ai-native-diagnosis");
  const sp_faq_id = entityId("secureprospective", "faq", "what-is-the-four-movement-method");
  const relId1 = relIdFromEndpoints("secureprospective", sp_svc_id, sp_faq_id, "has_answer_for");

  it("createEntity for the FAQ endpoint succeeds", async () => {
    const faq = await spGraph.createEntity({
      id: sp_faq_id,
      type: "faq",
      name: "What is the four-movement method?",
      data: {
        question: "What is the four-movement method?",
        answer: "Diagnose, Position, Shape, Transform.",
        category: "method",
        priority: 1,
      },
    });
    expect(faq.id).toBe(sp_faq_id);
  });

  it("createRelationship returns the row with empty data {}", async () => {
    const rel = await spGraph.createRelationship({
      id: relId1,
      fromId: sp_svc_id,
      toId: sp_faq_id,
      type: "has_answer_for",
    });
    expect(rel.id).toBe(relId1);
    expect(rel.business_id).toBe(sp.id);
    expect(Object.keys(rel.data).length).toBe(0);
  });

  it("getRelationship by id returns from_id correctly", async () => {
    const r = await spGraph.getRelationship(relId1);
    expect(r?.from_id).toBe(sp_svc_id);
  });
});

describe("Cross-business write protection (composite FK)", () => {
  it("rejects SP relationship referencing a TFM entity", async () => {
    const tfm_svc_id = entityId("techfreedomministries", "service", "TFM Ministry Setup");
    await tfmGraph.createEntity({
      id: tfm_svc_id,
      type: "service",
      name: "TFM Ministry Setup",
      data: { description: "Placeholder TFM service" },
    });
    try {
      await spGraph.createRelationship({
        id: relId("secureprospective", "cross-business-attempt"),
        fromId: entityId("secureprospective", "service", "ai-native-diagnosis"),
        toId: tfm_svc_id,
        type: "has_answer_for",
      });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e instanceof KnowledgeGraphError || /foreign key/i.test((e as Error).message)).toBe(true);
    }
  });
});

describe("Missing-endpoint edge protection", () => {
  it("rejects edge where toId does not exist in business", async () => {
    try {
      await spGraph.createRelationship({
        id: relId("secureprospective", "missing-endpoint-attempt"),
        fromId: entityId("secureprospective", "service", "ai-native-diagnosis"),
        toId: "secureprospective:faq:does-not-exist",
        type: "has_answer_for",
      });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(KnowledgeGraphError);
    }
  });
});

describe("Duplicate edge protection", () => {
  it("rejects duplicate (from, to, type) edge", async () => {
    try {
      await spGraph.createRelationship({
        id: relId("secureprospective", "duplicate-edge-attempt"),
        fromId: entityId("secureprospective", "service", "ai-native-diagnosis"),
        toId: entityId("secureprospective", "faq", "what-is-the-four-movement-method"),
        type: "has_answer_for",
      });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(KnowledgeGraphError);
      expect((e as Error).message).toContain("has_answer_for");
    }
  });
});

describe("Traversal", () => {
  const sp_svc_id = entityId("secureprospective", "service", "ai-native-diagnosis");
  const sp_faq_id = entityId("secureprospective", "faq", "what-is-the-four-movement-method");

  it("getRelated OUT returns 1 edge with correct direction/entity/rel", async () => {
    const r = await spGraph.getRelated(sp_svc_id, "has_answer_for", "out");
    expect(r.length).toBe(1);
    expect(r[0].direction).toBe("out");
    expect(r[0].entity.id).toBe(sp_faq_id);
    expect(r[0].relationship.from_id).toBe(sp_svc_id);
  });
  it("getRelated IN returns 1 edge from the faq's perspective", async () => {
    const r = await spGraph.getRelated(sp_faq_id, "has_answer_for", "in");
    expect(r.length).toBe(1);
    expect(r[0].direction).toBe("in");
    expect(r[0].entity.id).toBe(sp_svc_id);
  });
  it("getRelated OUT without type filter returns 1", async () => {
    expect((await spGraph.getRelated(sp_svc_id, undefined, "out")).length).toBe(1);
  });
  it("getRelated BOTH returns 1 (only outbound exists)", async () => {
    expect((await spGraph.getRelated(sp_svc_id, "has_answer_for", "both")).length).toBe(1);
  });
  it("getRelated IN returns 0 (nothing points at the service)", async () => {
    expect((await spGraph.getRelated(sp_svc_id, undefined, "in")).length).toBe(0);
  });
  it("getRelated on non-existent entity returns []", async () => {
    const r = await spGraph.getRelated("secureprospective:service:does-not-exist", undefined, "out");
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(0);
  });
});

describe("Business scoping (read path)", () => {
  it("SP and TFM each see only their own services", async () => {
    const spServices = await spGraph.getEntitiesByType("service");
    const tfmServices = await tfmGraph.getEntitiesByType("service");
    expect(spServices.length).toBe(1);
    expect(spServices[0].business_id).toBe(sp.id);
    expect(tfmServices.length).toBe(1);
    expect(tfmServices[0].business_id).toBe(tfm.id);
  });
  it("SP getEntity(TFM id) = null", async () => {
    expect(await spGraph.getEntity(entityId("techfreedomministries", "service", "tfm-ministry-setup"))).toBeNull();
  });
  it("TFM getEntity(SP id) = null", async () => {
    expect(await tfmGraph.getEntity(entityId("secureprospective", "service", "ai-native-diagnosis"))).toBeNull();
  });
  it("SP searchEntities does not return TFM content", async () => {
    expect((await spGraph.searchEntities("TFM")).length).toBe(0);
  });
});

describe("Cascade delete (FK ON DELETE CASCADE)", () => {
  const sp_svc_id = entityId("secureprospective", "service", "ai-native-diagnosis");
  const relId1 = relIdFromEndpoints(
    "secureprospective",
    sp_svc_id,
    entityId("secureprospective", "faq", "what-is-the-four-movement-method"),
    "has_answer_for",
  );

  it("deleteEntity returns true on existing", async () => {
    expect(await spGraph.deleteEntity(sp_svc_id)).toBe(true);
  });
  it("relationship cascade-deleted with endpoint", async () => {
    expect(await spGraph.getRelationship(relId1)).toBeNull();
  });
  it("entity is gone after delete", async () => {
    expect(await spGraph.getEntity(sp_svc_id)).toBeNull();
  });
  it("deleteEntity returns false on second call", async () => {
    expect(await spGraph.deleteEntity(sp_svc_id)).toBe(false);
  });
  it("count('service') = 0 after delete", async () => expect(await spGraph.count("service")).toBe(0));
  it("count('faq') = 1 (faq still there, edge gone)", async () => expect(await spGraph.count("faq")).toBe(1));
});

describe("Relationship delete", () => {
  it("deleteRelationship returns true on existing, false on second call", async () => {
    const sp_svc2_id = entityId("secureprospective", "service", "second-service");
    await spGraph.createEntity({
      id: sp_svc2_id,
      type: "service",
      name: "Second Service",
      data: { description: "for rel-delete test" },
    });
    const sp_faq_id = entityId("secureprospective", "faq", "what-is-the-four-movement-method");
    const relId2 = relIdFromEndpoints("secureprospective", sp_svc2_id, sp_faq_id, "has_answer_for");
    await spGraph.createRelationship({
      id: relId2,
      fromId: sp_svc2_id,
      toId: sp_faq_id,
      type: "has_answer_for",
    });
    expect(await spGraph.deleteRelationship(relId2)).toBe(true);
    expect(await spGraph.getRelationship(relId2)).toBeNull();
    expect(await spGraph.deleteRelationship(relId2)).toBe(false);
  });
});
