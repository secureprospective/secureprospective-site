import type { ExtractedQuestion } from "./types";

/**
 * Extract questions from a transcript (component 3, §5.3).
 *
 * Per §5.3: "Downstream stub: `extractQuestions(transcript: string): Question[]`
 * — leave as a TODO calling the agent component."
 *
 * The right way to do this is to invoke the agent (component 5) with a
 * prompt that asks it to identify every question in the transcript, returning
 * the structured ExtractedQuestion shape per question. The agent already has
 * the routing + composition machinery (defaultHeuristicRouter + composer)
 * and can be given a custom prompt template for this task.
 *
 * UNIMPLEMENTED — this function throws on call. The signature is stable so
 * downstream code can be written against it; the body lands when component 3
 * gets wired to a real audio source (Year-2+ per §5.3 + §7).
 *
 * Wiring sketch (when this is implemented):
 *   1. Take the transcript text + speaker labels.
 *   2. Construct a prompt: "Extract every question asked in this transcript.
 *      Return JSON array of { text, speaker?, confidence? }."
 *   3. Invoke Agent.answer() with that prompt; the agent's composer forces
 *      JSON output (TemplatedComposer variant or WorkersAiComposer with a
 *      structured-output instruction).
 *   4. Parse + return ExtractedQuestion[].
 *
 * @throws Error always — unimplemented.
 */
export async function extractQuestions(
  _transcript: string,
): Promise<ExtractedQuestion[]> {
  throw new Error(
    "extractQuestions() is unimplemented (§5.3 downstream stub). " +
      "Wiring lands when component 3 is connected to a real audio source.",
  );
}
