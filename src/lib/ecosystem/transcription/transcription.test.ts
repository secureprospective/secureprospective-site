import { describe, it, expect } from "vitest";
import {
  WorkersAiWhisperBackend,
  TranscriptionError,
  DEFAULT_WHISPER_MODEL,
  extractQuestions,
} from "./index";

/**
 * Component 3 (§5.3) — Call Transcription checks. Light by design (§5 +
 * §8: dark stubs get a fraction of the test effort P0 gets). Verifies:
 *   - interface contract (constructor validation)
 *   - REST shape against injected fetchImpl (URL, headers, body, response parsing)
 *   - extractQuestions throws the documented "unimplemented" error
 */

describe("WorkersAiWhisperBackend — constructor validation", () => {
  it("throws TranscriptionError without accountId", () => {
    expect(() => new WorkersAiWhisperBackend({ accountId: "", apiToken: "t" })).toThrow(TranscriptionError);
  });
  it("throws TranscriptionError without apiToken", () => {
    expect(() => new WorkersAiWhisperBackend({ accountId: "a", apiToken: "" })).toThrow(TranscriptionError);
  });
  it("accepts minimal config; defaults model + apiBaseUrl", () => {
    const b = new WorkersAiWhisperBackend({ accountId: "a", apiToken: "t" });
    expect(b).toBeTruthy();
  });
});

describe("WorkersAiWhisperBackend.transcribe() — REST shape", () => {
  function makeMockFetch(opts: {
    audioStatus?: number;
    whisperStatus?: number;
    whisperBody?: unknown;
    whisperErrors?: Array<{ message: string }>;
  }) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fn = async (url: string, init?: RequestInit) => {
      calls.push({ url, init: init ?? {} });
      if (url === "https://example.com/audio.mp3") {
        return new Response(opts.audioStatus === 200 ? "fake-audio-bytes" : "", {
          status: opts.audioStatus ?? 200,
        });
      }
      return new Response(JSON.stringify(opts.whisperErrors ? { errors: opts.whisperErrors } : opts.whisperBody), {
        status: opts.whisperStatus ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    (fn as unknown as { calls: typeof calls }).calls = calls;
    return fn;
  }

  it("happy path: returns result.text from Workers AI", async () => {
    const fetchImpl = makeMockFetch({
      whisperBody: { result: { text: "hello world transcript" } },
    });
    const backend = new WorkersAiWhisperBackend({
      accountId: "acct-1",
      apiToken: "tok-1",
      fetchImpl: fetchImpl as never,
    });
    const r = await backend.transcribe("https://example.com/audio.mp3");
    expect(r.text).toBe("hello world transcript");
    expect(r.speakers).toBeUndefined();
  });

  it("URL has account id + model; Authorization Bearer; octet-stream body", async () => {
    const fetchImpl = makeMockFetch({ whisperBody: { result: { text: "t" } } });
    const backend = new WorkersAiWhisperBackend({
      accountId: "acct-1",
      apiToken: "tok-1",
      model: "@cf/openai/whisper-large-v3-turbo",
      fetchImpl: fetchImpl as never,
    });
    await backend.transcribe("https://example.com/audio.mp3");
    const calls = (fetchImpl as unknown as { calls: Array<{ url: string; init: RequestInit }> }).calls;
    const whisperCall = calls.find((c) => c.url.includes("/ai/run/"));
    expect(whisperCall?.url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acct-1/ai/run/@cf/openai/whisper-large-v3-turbo",
    );
    const headers = whisperCall?.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok-1");
    expect(headers["Content-Type"]).toBe("application/octet-stream");
    expect(whisperCall?.init.body).toBeTruthy();
  });

  it("uses default model when not specified", async () => {
    const fetchImpl = makeMockFetch({ whisperBody: { result: { text: "t" } } });
    const backend = new WorkersAiWhisperBackend({
      accountId: "a",
      apiToken: "t",
      fetchImpl: fetchImpl as never,
    });
    await backend.transcribe("https://example.com/audio.mp3");
    const calls = (fetchImpl as unknown as { calls: Array<{ url: string }> }).calls;
    expect(calls.some((c) => c.url.includes(DEFAULT_WHISPER_MODEL))).toBe(true);
  });

  it("audio fetch failure throws TranscriptionError", async () => {
    const fetchImpl = makeMockFetch({ audioStatus: 404 });
    const backend = new WorkersAiWhisperBackend({
      accountId: "a", apiToken: "t", fetchImpl: fetchImpl as never,
    });
    await expect(backend.transcribe("https://example.com/audio.mp3")).rejects.toThrow(TranscriptionError);
  });

  it("Workers AI non-ok throws TranscriptionError with status", async () => {
    const fetchImpl = makeMockFetch({ whisperStatus: 401, whisperBody: {} });
    const backend = new WorkersAiWhisperBackend({
      accountId: "a", apiToken: "t", fetchImpl: fetchImpl as never,
    });
    await expect(backend.transcribe("https://example.com/audio.mp3")).rejects.toThrow(/401/);
  });

  it("Workers AI errors[] in response throws TranscriptionError", async () => {
    const fetchImpl = makeMockFetch({
      whisperBody: {},
      whisperErrors: [{ message: "model not found" }],
    });
    const backend = new WorkersAiWhisperBackend({
      accountId: "a", apiToken: "t", fetchImpl: fetchImpl as never,
    });
    await expect(backend.transcribe("https://example.com/audio.mp3")).rejects.toThrow(/model not found/);
  });

  it("missing result.text throws TranscriptionError", async () => {
    const fetchImpl = makeMockFetch({ whisperBody: { result: {} } });
    const backend = new WorkersAiWhisperBackend({
      accountId: "a", apiToken: "t", fetchImpl: fetchImpl as never,
    });
    await expect(backend.transcribe("https://example.com/audio.mp3")).rejects.toThrow(/no result\.text/);
  });

  it("empty/invalid audioUrl throws TranscriptionError before any fetch", async () => {
    const backend = new WorkersAiWhisperBackend({ accountId: "a", apiToken: "t" });
    await expect(backend.transcribe("")).rejects.toThrow(TranscriptionError);
    await expect(backend.transcribe(null as unknown as string)).rejects.toThrow(TranscriptionError);
  });
});

describe("extractQuestions — §5.3 downstream stub", () => {
  it("throws documented 'unimplemented' error (TODO: wire to agent component)", async () => {
    await expect(extractQuestions("any transcript")).rejects.toThrow(/unimplemented/);
  });
});
