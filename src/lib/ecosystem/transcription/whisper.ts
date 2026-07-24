import {
  type TranscriptionBackend,
  type TranscriptionResult,
  type WorkersAiWhisperConfig,
  TranscriptionError,
  DEFAULT_WHISPER_MODEL,
} from "./types";

/**
 * Workers AI Whisper transcription backend (component 3, §5.3).
 *
 * REST shape against Cloudflare Workers AI:
 *   POST https://api.cloudflare.com/client/v4/accounts/<account_id>/ai/run/<model>
 *   Headers: Authorization Bearer <token>, Content-Type: application/octet-stream
 *   Body: raw audio bytes (fetched from audioUrl first)
 *   200 → { result: { text: "..." } } — Workers AI Whisper does NOT return
 *         speaker labels or segment timing in the default response shape.
 *
 * No hand-rolled dep is added — fetch is global on Workers and Node 18+.
 * `fetchImpl` is injectable for testing (matches the pattern from
 * `RestClientAiSearchClient` in component 8).
 *
 * Wiring (CT105's lane): bind `accountId` + `apiToken` from Pages secrets.
 * Bird verifies the REST shape via injected fakes; real audio I/O is
 * runtime-only.
 */
export class WorkersAiWhisperBackend implements TranscriptionBackend {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly model: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: WorkersAiWhisperConfig) {
    if (!config.accountId) throw new TranscriptionError("WorkersAiWhisperBackend: accountId required");
    if (!config.apiToken) throw new TranscriptionError("WorkersAiWhisperBackend: apiToken required");
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.model = config.model ?? DEFAULT_WHISPER_MODEL;
    this.apiBaseUrl = config.apiBaseUrl ?? "https://api.cloudflare.com";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async transcribe(audioUrl: string): Promise<TranscriptionResult> {
    if (!audioUrl || typeof audioUrl !== "string") {
      throw new TranscriptionError("audioUrl must be a non-empty string");
    }

    // Fetch the audio bytes first. Workers AI Whisper takes raw bytes, not URLs.
    const audioResp = await this.fetchImpl(audioUrl);
    if (!audioResp.ok) {
      throw new TranscriptionError(
        `Failed to fetch audio from ${audioUrl}: ${audioResp.status} ${audioResp.statusText}`,
      );
    }
    const audioBytes = await audioResp.arrayBuffer();

    // POST the bytes to Workers AI Whisper.
    const url = `${this.apiBaseUrl}/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;
    const resp = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: audioBytes,
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new TranscriptionError(
        `Workers AI Whisper request failed: ${resp.status} ${resp.statusText}${body ? ` — ${body}` : ""}`,
      );
    }

    const data = (await resp.json()) as { result?: { text?: string }; errors?: Array<{ message?: string }> };
    if (data.errors && data.errors.length > 0) {
      throw new TranscriptionError(`Workers AI Whisper returned errors: ${JSON.stringify(data.errors)}`);
    }
    const text = data.result?.text;
    if (!text) {
      throw new TranscriptionError("Workers AI Whisper returned no result.text");
    }
    return { text };
  }
}
