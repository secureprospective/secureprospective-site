import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/*
 * The Content-Security-Policy lives in public/_headers, which no test covered
 * until 2026-09-18. Item 8 of the 2026-09-17 audit was that script-src still
 * allowed 'unsafe-inline', which weakens the admin-console XSS fix: an injected
 * <script> would simply run. Dropping it is only safe while the build emits no
 * executable inline script, so these assert both halves.
 */

const headers = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");

function csp(): string {
  const line = headers
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("Content-Security-Policy:"));
  if (!line) throw new Error("no Content-Security-Policy in public/_headers");
  return line.slice("Content-Security-Policy:".length).trim();
}

function directive(name: string): string {
  const found = csp()
    .split(";")
    .map((d) => d.trim())
    .find((d) => d === name || d.startsWith(name + " "));
  if (!found) throw new Error(`no ${name} directive in the CSP`);
  return found;
}

describe("Content-Security-Policy", () => {
  it("has a policy at all, so a typo cannot silently empty these tests", () => {
    expect(csp()).toContain("default-src 'self'");
  });

  it("does not allow inline script", () => {
    expect(directive("script-src")).not.toContain("'unsafe-inline'");
  });

  it("does not allow eval or a wildcard script source", () => {
    const d = directive("script-src");
    expect(d).not.toContain("'unsafe-eval'");
    expect(d).not.toMatch(/\s\*(\s|$)/);
  });

  it("still allows the two third-party scripts the site genuinely loads", () => {
    const d = directive("script-src");
    expect(d).toContain("'self'");
    expect(d).toContain("https://challenges.cloudflare.com");
    expect(d).toContain("https://static.cloudflareinsights.com");
  });

  it("keeps the frame and object lockdown", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
  });

  it("documents why style-src is the one exception", () => {
    // Astro inlines critical CSS, so this cannot be dropped the same way.
    // Asserted so that removing it becomes a deliberate, test-breaking act.
    expect(directive("style-src")).toContain("'unsafe-inline'");
  });
});
