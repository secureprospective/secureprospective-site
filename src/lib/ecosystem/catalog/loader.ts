/**
 * BusinessConfig loader.
 *
 * `loadBusinessConfig(id)` is the single entry point every other component uses
 * to get the active business's config. Resolves against a static registry of
 * the JSON files under `config/businesses/` (imported as ESM, so the same code
 * works in the Astro build and in Cloudflare Pages Functions).
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §9.
 *
 * Design note — static registry vs. dynamic load:
 * A static registry means the catalog knows SP and TFM by name. That's plumbing,
 * not business logic — every other component stays agnostic and consumes configs
 * only via `loadBusinessConfig(id)`. Dynamic loading by path is fragile on
 * Workers (no FS). When a third business arrives, add one import line and one
 * registry entry here; no other code changes.
 */

import type { BusinessConfig } from "./types";

import secureprospective from "../../../../config/businesses/secureprospective.json";
import techfreedomministries from "../../../../config/businesses/techfreedomministries.json";

const REGISTRY: Record<string, BusinessConfig> = {
  secureprospective: secureprospective as BusinessConfig,
  techfreedomministries: techfreedomministries as BusinessConfig,
};

export class BusinessConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessConfigError";
  }
}

const REQUIRED_KEYS = [
  "id",
  "name",
  "category",
  "voice",
  "serviceAreaRadius",
  "contact",
] as const;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Minimal structural validator. Catches the common authoring mistakes (missing
 * keys, empty strings, wrong types, id mismatch) at first load rather than
 * letting malformed data silently reach downstream components.
 *
 * NOT a full JSON Schema implementation. Strict Ajv-backed validation against
 * `schema.json` is a component-10 TODO alongside the test runner.
 */
function validate(cfg: unknown, id: string): asserts cfg is BusinessConfig {
  if (!isObject(cfg)) {
    throw new BusinessConfigError(`config for "${id}" is not an object`);
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in cfg)) {
      throw new BusinessConfigError(
        `config for "${id}" is missing required key: ${key}`,
      );
    }
  }
  if (typeof cfg.id !== "string" || cfg.id !== id) {
    throw new BusinessConfigError(
      `config for "${id}" has wrong/missing "id" field (got "${String(cfg.id)}")`,
    );
  }
  if (typeof cfg.name !== "string" || cfg.name.length === 0) {
    throw new BusinessConfigError(`config for "${id}" has empty "name"`);
  }
  if (typeof cfg.category !== "string" || cfg.category.length === 0) {
    throw new BusinessConfigError(`config for "${id}" has empty "category"`);
  }
  if (typeof cfg.voice !== "string" || cfg.voice.length === 0) {
    throw new BusinessConfigError(`config for "${id}" has empty "voice"`);
  }
  if (
    cfg.serviceAreaRadius !== null &&
    typeof cfg.serviceAreaRadius !== "number"
  ) {
    throw new BusinessConfigError(
      `config for "${id}" has non-number, non-null "serviceAreaRadius"`,
    );
  }
  const contact = cfg.contact as unknown;
  if (!isObject(contact)) {
    throw new BusinessConfigError(`config for "${id}" is missing contact.email`);
  }
  const email = (contact as { email?: unknown }).email;
  if (typeof email !== "string" || email.length === 0) {
    throw new BusinessConfigError(`config for "${id}" is missing contact.email`);
  }
}

const VALIDATED = new Set<string>();

function ensureValidated(id: string): void {
  if (VALIDATED.has(id)) return;
  validate(REGISTRY[id], id);
  VALIDATED.add(id);
}

/**
 * Look up a business config by id. Throws BusinessConfigError on unknown id
 * or malformed config (validated once per worker isolate, then cached).
 */
export function loadBusinessConfig(businessId: string): BusinessConfig {
  if (!(businessId in REGISTRY)) {
    throw new BusinessConfigError(
      `Unknown business id: "${businessId}". Registered: ${Object.keys(REGISTRY).join(", ")}`,
    );
  }
  ensureValidated(businessId);
  return REGISTRY[businessId];
}

/** All registered business ids — useful for admin/index endpoints. */
export function listBusinessIds(): string[] {
  return Object.keys(REGISTRY);
}
