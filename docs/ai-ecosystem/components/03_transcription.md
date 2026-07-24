# Component 3 — Call Transcription

**Status:** Dark stub (P3 — interface + Workers AI Whisper REST shape; no live audio source exists for SP or TFM).
**Last updated:** 2026-07-20 (fourth session, codeword "prove it").
**Spec source:** `docs/ai-ecosystem/ARCHITECTURE.md` §5.3 ("Call Transcription").

## What this component is

A transcribe-from-audio interface implemented via Cloudflare Workers AI Whisper, plus a downstream `extractQuestions` stub flagged as TODO. Per §5.3:

> Stub only — no live call-audio source exists yet for SP or TFM.
> Interface: `transcribe(audioUrl: string): Promise<{ text: string; speakers?: string[] }>` implemented via Workers AI Whisper.
> Downstream stub: `extractQuestions(transcript: string): Question[]` — leave as a TODO calling the agent component.

What's real: the interface, the Workers AI REST shape (URL, headers, body, response parsing), constructor validation, error paths. What's stubbed: actual audio I/O (CT105 wires real audio at production time), and `extractQuestions` (throws — body lands when a real audio source exists).

## What's implemented

| File | Role |
| ── | ── |
| `src/lib/ecosystem/transcription/types.ts` | `TranscriptionBackend` interface, `TranscriptionResult`, `TranscriptionSegment`, `ExtractedQuestion`, `WorkersAiWhisperConfig`, `TranscriptionError`, `DEFAULT_WHISPER_MODEL` |
| `src/lib/ecosystem/transcription/whisper.ts` | `WorkersAiWhisperBackend` implementing the interface via REST; fetches audio bytes from `audioUrl`, POSTs to `/accounts/<id>/ai/run/<model>` with octet-stream body, parses `{ result: { text } }` response |
| `src/lib/ecosystem/transcription/extract-questions.ts` | `extractQuestions()` — throws documented "unimplemented" error (TODO: wire to component 5 agent) |
| `src/lib/ecosystem/transcription/index.ts` | Barrel |
| `src/lib/ecosystem/transcription/transcription.test.ts` | 12 checks: constructor validation (3) + REST shape (5) + error paths (3) + extractQuestions (1) |

## Public API

```ts
interface TranscriptionBackend {
  transcribe(audioUrl: string): Promise<TranscriptionResult>;
}

interface TranscriptionResult {
  text: string;
  speakers?: string[];
  segments?: TranscriptionSegment[];
  durationMs?: number;
}

interface ExtractedQuestion {
  text: string;
  speaker?: string;
  startMs?: number;
  confidence?: number;   // 0–1 heuristic
}

class WorkersAiWhisperBackend implements TranscriptionBackend {
  constructor(config: { accountId, apiToken, model?, apiBaseUrl?, fetchImpl? });
  transcribe(audioUrl): Promise<TranscriptionResult>;
}

// Unimplemented — throws.
async function extractQuestions(transcript: string): Promise<ExtractedQuestion[]>;

const DEFAULT_WHISPER_MODEL = "@cf/openai/whisper-tiny-en";
```

## Decisions made

1. **Backend interface follows the established ecosystem pattern.** Same shape as `VectorizeBackend`/`AISearchBackend` (component 8), `ModelRouter` (component 7), `AnswerComposer` (component 5): constructor-injected, `fetchImpl` injectable for testing, real bindings = CT105's wiring lane.

2. **Workers AI Whisper REST shape captured verbatim.** Two-step request: (a) fetch audio bytes from the caller's URL, (b) POST the bytes to Workers AI Whisper with octet-stream Content-Type. This matches Cloudflare's documented Whisper endpoint shape. Workers AI Whisper does NOT return speaker labels or segment timing in the default response — `speakers` and `segments` stay `undefined` from this backend. If diarization is ever needed, a different backend (`AssemblyAIBackend`, `DeepgramBackend`) can be added behind the same interface.

3. **Default model = `@cf/openai/whisper-tiny-en`** — small English model. Fast, cheap, sufficient for transcribing SP/TFM call recordings where the audio is English business conversation. Override via `config.model` for the multilingual or large-v3 variants when accuracy matters more than latency/cost.

4. **`extractQuestions()` throws — does NOT return `[]`.** An empty-array return would let callers silently treat "not yet implemented" as "no questions found." Throwing surfaces the gap loud. The signature is stable so downstream code can be written against it; only the body changes when the wiring lands.

5. **No `audioUrl` validation beyond non-empty string.** Real URL validation (reachable, audio MIME type, size limit) belongs in CT105's wiring layer or the caller. The backend just attempts the fetch and surfaces non-ok as `TranscriptionError`.

## Hand-off to CT105

When a live audio source exists (recorded calls, voicemails dropped to R2, etc.):

- **Bind secrets:** `WORKERS_AI_ACCOUNT_ID` + `WORKERS_AI_API_TOKEN` (the same token used by component 5's `WorkersAiComposer`, just needs Workers AI: Read scope).
- **Wire audio source:** wherever call audio lands (R2 bucket, Twilio webhook, etc.), construct the audio URL and invoke `backend.transcribe(url)`.
- **Pick a model:** default `@cf/openai/whisper-tiny-en` is fine for English business calls. For multilingual (TFM ministry partners overseas?), switch to `@cf/openai/whisper-large-v3` (slower, more accurate, multilingual).
- **Implement `extractQuestions`:** invoke the agent (component 5) with a prompt template that asks for question extraction in `ExtractedQuestion[]` JSON shape. Use a structured-output composer variant.

## LOW-CONFIDENCE ITEMS

- **Workers AI Whisper response shape:** assumed `{ result: { text: "..." } }` based on the same Cloudflare REST convention used by component 5's `WorkersAiComposer` and component 8's `RestClientAiSearchClient`. CT105 should verify against current Workers AI Whisper docs at first real call — Whisper responses may include additional fields (vtt, srt, segments) that this parser doesn't surface.
- **Model id `@cf/openai/whisper-tiny-en`:** Cloudflare's model catalog rotates. Verify the canonical model id at wire time. (`whisper-1`, `whisper-tiny`, `whisper-large-v3-turbo` are all variants that have appeared in the catalog at different times.)
- **Audio size limits:** Workers AI has a request body size cap (50 MB by default for most models). Long calls may need chunking before POSTing. Not implemented — flag when a real audio source is wired.

## Verification

`npx vitest run src/lib/ecosystem/transcription` → 12/12 checks pass. All via injected `fetchImpl` fakes; no real audio I/O or Workers AI calls in tests.
