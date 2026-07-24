import type { BusinessConfig } from "../catalog";

/**
 * AI citation benchmark fixture (component 10, §5.10 + §0.5).
 *
 * A checked-in list of 30-100 realistic customer questions per business. The
 * runner queries external LLMs (ChatGPT/Perplexity/Gemini/Claude) with these
 * and logs whether/how the business gets mentioned. This is the actual
 * measurement mechanism behind the "AI citation rate" success metric in the
 * original Hermes blueprint — without it the metric has no data.
 *
 * Fixture format:
 * {
 *   "businessId": "secureprospective",
 *   "version": "2026-07-20",
 *   "queries": [
 *     { "id": "sp-001", "category": "direct-intent",
 *       "query": "Who are the top AI-native consulting firms?" },
 *     ...
 *   ]
 * }
 *
 * Categories (used for slicing results, not for runner logic):
 * - direct-intent: customer ready to hire / buy
 * - discovery: customer exploring the concept
 * - comparative: customer comparing approaches / vendors
 * - vertical-specific: industry-named (insurance, ministry, etc.)
 * - brand-probe: directly naming the business or its competitors
 */

export type CitationQueryCategory =
  | "direct-intent"
  | "discovery"
  | "comparative"
  | "vertical-specific"
  | "brand-probe";

export interface CitationQuery {
  id: string;
  query: string;
  category: CitationQueryCategory;
}

export interface CitationFixture {
  businessId: string;
  version: string;
  queries: CitationQuery[];
}

/** How the business was mentioned in an LLM response (or "none"). */
export type MentionShape = "domain" | "name" | "url" | "none";

export interface MentionDetection {
  mentioned: boolean;
  shape: MentionShape;
  excerpt?: string;
}

/**
 * Detect whether the given business is mentioned in an LLM response.
 *
 * Looks for, in order of specificity:
 *   1. The business's domain (e.g. "secureprospective.com")
 *   2. The business's full URL (e.g. "https://secureprospective.com")
 *   3. The business's display name (e.g. "SecureProspective")
 *
 * Returns the highest-specificity match. Excerpt is a window of ±60 chars
 * around the first match for human auditing.
 */
export function detectMention(
  responseText: string,
  business: Pick<BusinessConfig, "id" | "name">,
): MentionDetection {
  const domain = (business.id === "secureprospective"
    ? "secureprospective.com"
    : business.id === "techfreedomministries"
      ? "techfreedomministries.org"
      : `${business.id}.com`).toLowerCase();
  const url = `https://${domain}`;
  const name = business.name.toLowerCase();

  const text = responseText.toLowerCase();

  // URL match (most specific)
  const urlIdx = text.indexOf(url);
  if (urlIdx >= 0) {
    return {
      mentioned: true,
      shape: "url",
      excerpt: excerptAround(responseText, urlIdx, url.length),
    };
  }

  // Domain match (may be a bare reference or a link without scheme)
  const domIdx = text.indexOf(domain);
  if (domIdx >= 0) {
    return {
      mentioned: true,
      shape: "domain",
      excerpt: excerptAround(responseText, domIdx, domain.length),
    };
  }

  // Name match (least specific — false-positive risk on common words)
  const nameIdx = text.indexOf(name);
  if (nameIdx >= 0) {
    return {
      mentioned: true,
      shape: "name",
      excerpt: excerptAround(responseText, nameIdx, name.length),
    };
  }

  return { mentioned: false, shape: "none" };
}

function excerptAround(original: string, matchStart: number, matchLen: number): string {
  const window = 60;
  const start = Math.max(0, matchStart - window);
  const end = Math.min(original.length, matchStart + matchLen + window);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < original.length ? "…" : "";
  return prefix + original.slice(start, end) + suffix;
}
