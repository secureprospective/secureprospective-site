// Pages Function: GET /api/ecosystem/catalog?business=<id>
//
// Read-only lookup of a business's public config (name, category, contact,
// method) from the static registry in src/lib/ecosystem/catalog. No bindings,
// no secrets, no writes — safe to be public with no auth.
//
// Omit ?business to list registered business ids instead of a single config.
//
// Spec: docs/ai-ecosystem/ARCHITECTURE.md §3 (deployment map, "Config" row) +
// §5 component 9 (Knowledge Catalog).

import {
  BusinessConfigError,
  listBusinessIds,
  loadBusinessConfig,
} from "../../../src/lib/ecosystem/catalog";

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const businessId = url.searchParams.get("business");

  if (!businessId) {
    return new Response(
      JSON.stringify({ businesses: listBusinessIds() }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }

  try {
    const config = loadBusinessConfig(businessId);
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    if (e instanceof BusinessConfigError) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    throw e;
  }
};
