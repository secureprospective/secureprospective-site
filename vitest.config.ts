import { defineConfig } from "vitest/config";

// Vitest configuration for the AI-ecosystem library + future site tests.
//
// Scope: src/lib/ecosystem/ test files (glob: ** slash *.test.ts).
// Does NOT typecheck (esbuild-only transform, same as the prior
// /tmp/opencode smoke-test pattern) — run `npx tsc --noEmit` separately
// for type coverage. Test files use explicit vitest imports rather than
// globals, so no tsconfig change is required.
//
// Component 10 spec: docs/ai-ecosystem/ARCHITECTURE.md §5.10.
export default defineConfig({
  test: {
    include: ["src/lib/ecosystem/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    environment: "node",
    globals: false,
    reporters: ["default"],
    pool: "threads",
  },
});
