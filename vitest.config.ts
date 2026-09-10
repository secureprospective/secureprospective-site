import { defineConfig } from "vitest/config";

// Tests cover the code this site actually ships: the Pages Functions behind
// the contact form. The former AI-ecosystem library and its 200-odd tests were
// removed from this repo along with the chatbot lane; see
// docs/PARKED-AI-ECOSYSTEM.md for where that lives and how to bring it back.
//
// This config transforms with esbuild and does not typecheck. Run
// `npx tsc --noEmit` separately for type coverage.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    environment: "node",
    globals: false,
    reporters: ["default"],
    pool: "threads",
  },
});
