/**
 * Call Transcription types (component 3, §5.3).
 *
 * Per §5.3: "Stub only — no live call-audio source exists yet for SP or TFM."
 * The interface is real and stable; the implementations are shape-only — no
 * live audio source exists to wire today.
 *
 * The `Question` shape referenced by `extractQuestions` matches the entity
 * shape used by the knowledge graph (component 1) for type=question entities.
 */

/** Output of a successful transcription. */
export interface TranscriptionResult {
  /** The full transcribed text. */
  text: string;
  /** Optional speaker labels (diarization), if the backend supports it. */
  speakers?: string[];
  /** Optional segment-level timing + speaker mapping. */
  segments?: TranscriptionSegment[];
  /** ISO duration of the source audio, if known. */
  durationMs?: number;
}

export interface TranscriptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  speaker?: string;
}

/**
 * A question extracted from a transcript — shape matches what becomes a
 * knowledge-graph `question` entity (component 1) once persisted.
 */
export interface ExtractedQuestion {
  text: string;
  /** Where in the transcript this question appeared. */
  speaker?: string;
  /** Approximate timestamp in the source audio. */
  startMs?: number;
  /** Heuristic confidence 0–1 of "this is really a question." */
  confidence?: number;
}

/**
 * Backend interface for transcription providers. Same shape as the rest of
 * the ecosystem: backend is constructor-injected, real bindings = CT105.
 *
 * The canonical Phase-1 implementation is Workers AI Whisper per §5.3.
 */
export interface TranscriptionBackend {
  transcribe(audioUrl: string): Promise<TranscriptionResult>;
}

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

/** Workers AI Whisper configuration. The model defaults to the small English variant. */
export interface WorkersAiWhisperConfig {
  /** Cloudflare account id. */
  accountId: string;
  /** API token with Workers AI: Read scope. */
  apiToken: string;
  /** Whisper model id; defaults to the small English model. */
  model?: string;
  /** Optional override of the API base (testing). */
  apiBaseUrl?: string;
  /** Optional fetch impl injection (testing). */
  fetchImpl?: typeof fetch;
}

export const DEFAULT_WHISPER_MODEL = "@cf/openai/whisper-tiny-en";
