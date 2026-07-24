/**
 * ID helpers for the Knowledge Graph.
 *
 * `id` is the global PK on entities/relationships. These helpers guarantee
 * global uniqueness by prefixing with the business slug, even though the
 * schema itself treats `id` as an opaque string.
 *
 * Pattern: `<business_id>:<type>:<slug>` for entities, `<business_id>:rel:<slug>`
 * for relationships. Stable, debuggable in SQL, no UUID entropy required.
 */

import type { EntityType, RelationType } from "./types";

/**
 * Build an entity id from business + type + caller-supplied slug.
 * `slug` is lowercased and kebab-cased; non-[a-z0-9-] chars are replaced.
 *
 * Example: entityId("secureprospective", "service", "AI Diagnosis") →
 *   "secureprospective:service:ai-diagnosis"
 */
export function entityId(
  businessId: string,
  type: EntityType,
  slug: string,
): string {
  const cleanSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleanSlug) {
    throw new Error(
      `entityId: slug "${slug}" produced empty identifier after normalization`,
    );
  }
  return `${businessId}:${type}:${cleanSlug}`;
}

/**
 * Build a relationship id from business + caller-supplied slug.
 * Example: relId("secureprospective", "diag-service-to-pricing-faq") →
 *   "secureprospective:rel:diag-service-to-pricing-faq"
 */
export function relId(businessId: string, slug: string): string {
  const cleanSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleanSlug) {
    throw new Error(
      `relId: slug "${slug}" produced empty identifier after normalization`,
    );
  }
  return `${businessId}:rel:${cleanSlug}`;
}

/**
 * Convenience: deterministic relationship id from its endpoints + type.
 * Useful when callers want idempotent edge creation (re-creating the same
 * edge returns the same id, matching the `idx_rel_business_from_to_type`
 * unique index).
 *
 * Example: relIdFromEndpoints("secureprospective", "sp:service:x", "sp:faq:y", "has_answer_for")
 *   → "secureprospective:rel:sp:service:x__has_answer_for__sp:faq:y"
 *     (with `:` in ids replaced by `+` to keep ids filesystem-safe if ever needed)
 */
export function relIdFromEndpoints(
  businessId: string,
  fromId: string,
  toId: string,
  type: RelationType,
): string {
  // Replace ':' with '+' so the id has a clean structure when inspected.
  const safe = (s: string) => s.replace(/:/g, "+");
  return `${businessId}:rel:${safe(fromId)}__${type}__${safe(toId)}`;
}
