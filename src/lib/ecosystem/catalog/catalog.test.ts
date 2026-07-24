import { describe, it, expect } from "vitest";
import {
  loadBusinessConfig,
  listBusinessIds,
  BusinessConfigError,
} from "./index";

/**
 * Ported from /tmp/opencode/smoke-catalog.mjs (session 1 of ai-ecosystem-scaffold).
 * Component 10 (§5.10): permanent Vitest home for the catalog loader checks.
 */
describe("listBusinessIds", () => {
  it("returns 2 ids", () => {
    expect(listBusinessIds().length).toBe(2);
  });
  it("includes secureprospective", () => {
    expect(listBusinessIds()).includes("secureprospective");
  });
  it("includes techfreedomministries", () => {
    expect(listBusinessIds()).includes("techfreedomministries");
  });
});

describe("loadBusinessConfig('secureprospective')", () => {
  const sp = loadBusinessConfig("secureprospective");
  it("id matches", () => expect(sp.id).toBe("secureprospective"));
  it("name matches", () => expect(sp.name).toBe("SecureProspective"));
  it("category matches", () => expect(sp.category).toBe("technical_consulting"));
  it("voice non-empty", () => expect(sp.voice.length).toBeGreaterThan(0));
  it("voice matches CLAUDE.md ground truth", () => {
    expect(sp.voice).toBe("no fear/surveillance framing; confident, direct, ledger/vault mood");
  });
  it("serviceAreaRadius null (national)", () => expect(sp.serviceAreaRadius).toBeNull());
  it("contact.email = locked value", () => {
    expect(sp.contact.email).toBe("secureprospective@gmail.com");
  });
  it("domain matches", () => expect(sp.domain).toBe("secureprospective.com"));
  it("tagline matches locked H2", () => {
    expect(sp.tagline).toBe("Make AI native. Drop the prefix.");
  });
  it("method.movements has 4 entries", () => {
    expect(sp.method?.movements?.length ?? 0).toBe(4);
  });
  it("method.movements = [Diagnose, Position, Shape, Transform]", () => {
    expect(sp.method?.movements).toEqual(["Diagnose", "Position", "Shape", "Transform"]);
  });
  it("method.loopCloser present", () => {
    expect(sp.method?.loopCloser?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("loadBusinessConfig('techfreedomministries')", () => {
  const tfm = loadBusinessConfig("techfreedomministries");
  it("id matches", () => expect(tfm.id).toBe("techfreedomministries"));
  it("name matches", () => expect(tfm.name).toBe("Tech Freedom Ministries"));
  it("category = ministry", () => expect(tfm.category).toBe("ministry"));
  it("voice matches §6 spec verbatim", () => {
    expect(tfm.voice).toBe("positive/hopeful/scripture-forward");
  });
  it("serviceAreaRadius null", () => expect(tfm.serviceAreaRadius).toBeNull());
  it("contact.email is the real confirmed address (LEAD #2, resolved)", () => {
    expect(tfm.contact.email).toBe("techfreedomministries@gmail.com");
  });
  it("domain matches", () => expect(tfm.domain).toBe("techfreedomministries.org"));
  it("method omitted (no ground truth)", () => expect(tfm.method).toBeUndefined());
  it("tagline omitted (no ground truth)", () => expect(tfm.tagline).toBeUndefined());
});

describe("Unknown id throws BusinessConfigError", () => {
  it("throws BusinessConfigError", () => {
    expect(() => loadBusinessConfig("nonexistent-business")).toThrow(BusinessConfigError);
  });
  it("error.name set", () => {
    try {
      loadBusinessConfig("nonexistent-business");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect((e as BusinessConfigError).name).toBe("BusinessConfigError");
    }
  });
  it("error msg names the bad id", () => {
    try {
      loadBusinessConfig("nonexistent-business");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("nonexistent-business");
    }
  });
  it("error msg lists registered ids", () => {
    try {
      loadBusinessConfig("nonexistent-business");
      expect.unreachable("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("secureprospective");
      expect(msg).toContain("techfreedomministries");
    }
  });
});

describe("Cached validation", () => {
  it("second call returns same ref (registry cached)", () => {
    const sp1 = loadBusinessConfig("secureprospective");
    const sp2 = loadBusinessConfig("secureprospective");
    expect(sp2).toBe(sp1);
  });
});
