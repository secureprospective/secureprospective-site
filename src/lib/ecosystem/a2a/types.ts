/**
 * Agent-to-Agent (A2A) Protocol types (component 4, §5.4).
 *
 * EXPLICITLY DORMANT — Year-2 scope per the original Hermes blueprint.
 *
 * Per §5.4: "Stub types only (AgentCard, Task, Message, Artifact per the A2A
 * spec) — this is explicitly Year-2 scope in the original blueprint, not
 * Phase 1. Don't over-build; a clean types file + a one-paragraph README
 * explaining it's intentionally dormant is enough."
 *
 * Per §0.5: "A2A protocol — confirmed as agent-to-agent internal coordination
 * (supply chain, IT ops), not a customer-facing commerce channel. Staying
 * dormant in component 4 was the right call already." — do not re-litigate
 * without new evidence.
 *
 * The types below mirror the public A2A protocol spec
 * (github.com/a2aproject/A2A) at the surface level needed to seed future
 * work. They are intentionally not wired into any other component — no
 * consumer in the ecosystem references them yet. When A2A work begins in
 * earnest, this is the seed.
 */

// ─────────────────────────────────────────────────────────────────────
// AgentCard — what an agent advertises about itself
// ─────────────────────────────────────────────────────────────────────

export interface AgentCard {
  /** Unique name for the agent (human-readable, not a URL). */
  name: string;
  /** Short description of what the agent does — shown to other agents. */
  description: string;
  /** Base URL where the agent's A2A endpoint lives. */
  url: string;
  /** Optional provider/organization. */
  provider?: {
    organization: string;
    url?: string;
  };
  /** Card schema version. */
  version: string;
  /** Backward-compat capability advertisement. */
  capabilities: AgentCapabilities;
  /** Skills the agent can perform — what tasks it knows how to execute. */
  skills: AgentSkill[];
  /** Default input modalities (e.g. "text", "file", "data"). */
  defaultInputModes?: string[];
  /** Default output modalities. */
  defaultOutputModes?: string[];
}

export interface AgentCapabilities {
  /** Server pushes intermediate updates (streaming). */
  streaming?: boolean;
  /** Server sends task-state push notifications when state changes. */
  pushNotifications?: boolean;
  /** State transition history is queryable. */
  stateTransitionHistory?: boolean;
}

export interface AgentSkill {
  /** Skill identifier — unique within the agent. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** What this skill does. */
  description: string;
  /** Tags for discovery / matching. */
  tags?: string[];
  /** Example inputs that would invoke this skill. */
  examples?: string[];
  /** Input modalities this skill accepts. */
  inputModes?: string[];
  /** Output modalities this skill produces. */
  outputModes?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Task — unit of work between two agents
// ─────────────────────────────────────────────────────────────────────

export type TaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "canceled"
  | "failed";

export interface TaskStatus {
  state: TaskState;
  /** Optional human-readable status message. */
  message?: string;
  /** ISO timestamp of the status update. */
  timestamp?: string;
}

export interface Task {
  /** Server-assigned task id. */
  id: string;
  /** Session id grouping related tasks. */
  sessionId?: string;
  /** Current status. */
  status: TaskStatus;
  /** Conversation history — inputs and agent responses. */
  messages?: Message[];
  /** Outputs produced by the task. */
  artifacts?: Artifact[];
}

// ─────────────────────────────────────────────────────────────────────
// Message + parts — communication within a task
// ─────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "agent";

export interface Message {
  role: MessageRole;
  /** Content parts — text, files, or structured data. */
  parts: MessagePart[];
  /** Optional message id (server-assigned). */
  messageId?: string;
  /** Optional reference to the task this message belongs to. */
  taskId?: string;
  /** ISO timestamp. */
  timestamp?: string;
}

export type MessagePart = TextPart | FilePart | DataPart;

export interface TextPart {
  type: "text";
  text: string;
}

export interface FilePart {
  type: "file";
  /** URI to fetch the file content, or inline bytes (base64). */
  uri?: string;
  /** Inline base64 content (alternative to uri). */
  bytes?: string;
  /** MIME type. */
  mimeType?: string;
  /** Display name. */
  name?: string;
}

export interface DataPart {
  type: "data";
  /** Structured JSON payload — schema is app-specific. */
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// Artifact — output produced by a task
// ─────────────────────────────────────────────────────────────────────

export interface Artifact {
  /** Server-assigned artifact id. */
  artifactId: string;
  /** Optional name. */
  name?: string;
  /** Optional description. */
  description?: string;
  /** Content parts — same shape as messages. */
  parts: MessagePart[];
  /** Index for ordering multiple artifacts. */
  index?: number;
}

// ─────────────────────────────────────────────────────────────────────
// Protocol envelope — request/response shapes (subset)
// ─────────────────────────────────────────────────────────────────────

export type A2ARequestMethod =
  | "tasks/send"
  | "tasks/sendSubscribe"
  | "tasks/get"
  | "tasks/cancel"
  | "tasks/pushNotification/set";

export interface A2ARequest {
  jsonrpc: "2.0";
  method: A2ARequestMethod;
  params: Record<string, unknown>;
  id?: string | number;
}

export interface A2AResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: A2AError;
  id?: string | number;
}

export interface A2AError {
  code: number;
  message: string;
  data?: unknown;
}

// Standard JSON-RPC error codes per the A2A spec.
export const A2A_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  TASK_NOT_FOUND: -32001,
  TASK_NOT_CANCELABLE: -32002,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  UNSUPPORTED_OPERATION: -32004,
} as const;
