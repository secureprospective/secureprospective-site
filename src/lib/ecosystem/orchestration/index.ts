/**
 * Multi-Model Orchestration — public barrel exports.
 *
 * Spec: docs/ai-ecosystem/ARCHITECTURE.md §5.7.
 *
 * Import shape mirrors the other ecosystem components:
 *   import { ModelRouter, AiGatewayRouter, OrchestratedComposer } from
 *     "../orchestration";
 */
export type {
  ChatMessage,
  GenerateOptions,
  GenerateResult,
  ModelProvider,
  ModelRouter,
  OrchestrationErrorKind,
  ProviderConfig,
} from "./types";
export { OrchestrationError } from "./types";
export { AiGatewayRouter } from "./gateway";
export type { AiGatewayRouterOptions } from "./gateway";
export { OrchestratedComposer } from "./composer";
export type { OrchestratedComposerOptions } from "./composer";
