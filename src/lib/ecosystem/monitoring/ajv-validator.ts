/**
 * Optional JSON-Schema validator (component 10, §5.10 —Ajv integration).
 *
 * LEAD #4 (Christopher owns): the catalog loader currently uses a hand-rolled
 * structural validator (loader.ts:validate). This module provides the upgrade
 * path — strict Ajv-backed validation against schema.json — behind a lazy
 * import so the package.json runtime-dep add is Christopher's ruling.
 *
 * Behavior:
 *   - If `ajv` is installed: full JSON-Schema validation, returns structured errors.
 *   - If `ajv` is NOT installed: throws AjvNotInstalledError. Callers should
 *     catch and fall back to the existing hand-rolled validator (which is what
 *     loader.ts does today).
 *
 * Wiring (post-Christopher's-ruling):
 *   loader.ts:validate would become:
 *     try {
 *       const r = await validateConfigWithSchema(cfg, schema, id);
 *       if (!r.valid) throw new BusinessConfigError(...);
 *     } catch (e) {
 *       if (e instanceof AjvNotInstalledError) return handRolledValidate(cfg, id);
 *       throw e;
 *     }
 */

export interface ValidationSuccess {
  valid: true;
}
export interface ValidationFailure {
  valid: false;
  errors: string[];
}
export type ValidationResult = ValidationSuccess | ValidationFailure;

export class AjvNotInstalledError extends Error {
  constructor() {
    super(
      "ajv is not installed — LEAD #4 unresolved. Run `npm install ajv` to enable strict JSON-Schema validation, or continue with the hand-rolled fallback in catalog/loader.ts.",
    );
    this.name = "AjvNotInstalledError";
  }
}

/**
 * Validate a config object against a JSON Schema using Ajv (if available).
 *
 * @throws AjvNotInstalledError if the `ajv` package cannot be imported.
 * @throws Error if Ajv itself throws (malformed schema, etc).
 */
export async function validateWithSchema(
  cfg: unknown,
  schema: unknown,
): Promise<ValidationResult> {
  let AjvModule: { default?: new (opts?: unknown) => AjvLike; Ajv?: new (opts?: unknown) => AjvLike };
  try {
    // dynamic import — keeps ajv out of the bundle until called.
    // @ts-expect-error - ajv is the LEAD #4 optional runtime dep; the import
    // itself is the runtime availability check. When Christopher rules and
    // adds ajv to package.json, this directive becomes unused (tsc will flag
    // it) — the reminder that LEAD #4 is resolved and this can be cleaned up.
    AjvModule = await import("ajv");
  } catch {
    throw new AjvNotInstalledError();
  }

  const Ajv = AjvModule.default ?? AjvModule.Ajv;
  if (!Ajv) {
    throw new Error("ajv package present but no Ajv class exported — version mismatch");
  }
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(cfg) as boolean;
  if (!valid) {
    const errors = (validate.errors ?? []).map((e) => {
      const path = e.instancePath || "(root)";
      return `${path}: ${e.message ?? "invalid"}`;
    });
    return { valid: false, errors };
  }
  return { valid: true };
}

// Minimal shape we use from ajv (duck-typed — not importing the real type to
// avoid leaking the optional dep into the type graph).
interface AjvLike {
  compile(schema: unknown): {
    (data: unknown): boolean;
    errors?: Array<{ instancePath: string; message?: string }> | null;
  };
}
