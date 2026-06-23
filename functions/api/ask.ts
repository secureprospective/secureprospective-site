// Pages Function: POST /api/ask
// Interactive-resume chatbot endpoint for the CCwork profile-cast RAG.
// Two-step, grounded: retrieve from AI Search (ccwork-resume) -> generate with Gemma 4 26B
// under a strict third-person, refuse-when-absent system prompt.
//
// Uses the Cloudflare REST API (proven path) rather than the AI Search binding.
// Server-side only: CF_API_TOKEN is a Pages secret and never reaches the client.

interface Env {
  CF_API_TOKEN: string;
}

const ACCOUNT_ID = "002dd2f758b67ac08d05a3809d65a25a";
const INSTANCE = "ccwork-resume";
const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const REFUSAL = "I don't have that information about Christopher.";

const SYSTEM_PROMPT =
  "You are an assistant that answers questions ABOUT Christopher, strictly in the " +
  "THIRD PERSON (\"Christopher holds...\", \"He led...\"). Use ONLY the provided context. " +
  "If the context does not contain the answer, reply EXACTLY: " + REFUSAL + " " +
  "Be concise and factual. Do not invent details.";

// Lock the endpoint to the live site so other origins can't drive the model.
const ALLOWED_HOSTS = new Set([
  "secureprospective.com",
  "www.secureprospective.com",
]);

function hostAllowed(request: Request): boolean {
  // Same-origin POSTs from our own pages are always fine; cross-origin must match.
  const origin = request.headers.get("Origin");
  if (!origin) return true; // same-origin / direct
  try {
    const h = new URL(origin).hostname;
    return ALLOWED_HOSTS.has(h) || h.endsWith(".secureprospective-site.pages.dev");
  } catch {
    return false;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!hostAllowed(request)) {
    return json({ error: "Forbidden origin." }, 403);
  }

  let question: unknown;
  try {
    ({ question } = (await request.json()) as { question?: unknown });
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (typeof question !== "string" || !question.trim()) {
    return json({ error: "Missing 'question'." }, 400);
  }
  const q = question.trim().slice(0, 500);

  const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;
  const auth = {
    Authorization: `Bearer ${env.CF_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  // 1. Retrieve grounded chunks.
  let chunks: string[] = [];
  try {
    const r = await fetch(`${base}/ai-search/instances/${INSTANCE}/search`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ query: q }),
    });
    const data: any = await r.json();
    for (const c of data?.result?.chunks ?? []) {
      let t = c.text ?? c.content;
      if (Array.isArray(t)) t = t.join(" ");
      if (t) chunks.push(String(t));
    }
  } catch {
    return json({ error: "Retrieval failed." }, 502);
  }

  // 2. No context -> deterministic refusal (don't even call the model).
  if (chunks.length === 0) {
    return json({ answer: REFUSAL });
  }

  // 3. Generate under the strict grounding prompt.
  const contextText = chunks.join("\n\n---\n\n");
  try {
    const r = await fetch(`${base}/ai/run/${MODEL}`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content:
              `Answer using ONLY the context below. If the answer is not in the ` +
              `context, reply EXACTLY: ${REFUSAL}\n\n` +
              `Context:\n${contextText}\n\nQuestion: ${q}`,
          },
        ],
      }),
    });
    const data: any = await r.json();
    const res = data?.result ?? {};
    // gemma-4-26b returns OpenAI-style choices; fall back to .response just in case.
    const answer =
      res?.choices?.[0]?.message?.content ??
      res?.response ??
      REFUSAL;
    return json({ answer: String(answer).trim() });
  } catch {
    return json({ error: "Generation failed." }, 502);
  }
};
