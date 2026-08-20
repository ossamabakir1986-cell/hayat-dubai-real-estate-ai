import { NextResponse } from "next/server";

export const runtime = "edge";

type Evidence = {
  id: string;
  title: string;
  kind: "knowledge-entry" | "official-document";
  authority?: string;
  status?: string;
  text: string;
};

const answerSchema = {
  type: "object",
  properties: {
    directAnswer: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    figures: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["label", "value", "explanation"],
      },
    },
    requirements: { type: "array", items: { type: "string" } },
    steps: { type: "array", items: { type: "string" } },
    cautions: { type: "array", items: { type: "string" } },
    sourceIds: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "limited"] },
    language: { type: "string", enum: ["en", "ar"] },
  },
  required: [
    "directAnswer",
    "keyPoints",
    "figures",
    "requirements",
    "steps",
    "cautions",
    "sourceIds",
    "confidence",
    "language",
  ],
};

function interactionText(result: Record<string, unknown>) {
  if (typeof result.output_text === "string") return result.output_text;
  const steps = Array.isArray(result.steps) ? result.steps : [];
  return steps
    .filter((step): step is Record<string, unknown> => Boolean(step) && typeof step === "object")
    .filter((step) => !step.type || step.type === "model_output")
    .flatMap((step) => Array.isArray(step.content) ? step.content : [])
    .filter((block): block is Record<string, unknown> => Boolean(block) && typeof block === "object")
    .map((block) => typeof block.text === "string" ? block.text : "")
    .join("");
}

function clientError(status: number) {
  if (status === 401 || status === 403) return "Hayat's Gemini connection needs to be reactivated. Verified library results are still shown below.";
  if (status === 429) return "The free Gemini allowance is temporarily busy or exhausted. Please try again shortly.";
  return "Hayat AI could not answer right now. Verified library results are still shown below.";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Hayat AI is not activated yet. Verified library search remains available." },
      { status: 503 },
    );
  }

  let payload: { question?: string; evidence?: Evidence[]; history?: { role: "user" | "assistant"; text: string }[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = payload.question?.trim().slice(0, 1200);
  const evidence = (payload.evidence || []).slice(0, 14);
  const history = (payload.history || []).slice(-6);
  if (!question || !evidence.length) {
    return NextResponse.json({ error: "A question and supporting evidence are required." }, { status: 400 });
  }

  const evidenceText = evidence
    .map(
      (item, index) =>
        `[${index + 1}] ${item.id} | ${item.kind} | ${item.title}\nAuthority: ${item.authority || "Not stated"}\nStatus: ${item.status || "Not stated"}\n${item.text}`,
    )
    .join("\n\n");

  const conversation = history.length
    ? history.map((message) => `${message.role === "user" ? "User" : "Hayat"}: ${message.text.slice(0, 900)}`).join("\n")
    : "No previous conversation.";

  const prompt = `You are Hayat, a warm, natural and evidence-bound AI assistant for Dubai real-estate professionals and clients.

Answer the user's exact question using ONLY the supplied controlled knowledge entries and official-document extracts. Cross-match the sources and give an actual, practical answer—not a list of search results.

Rules:
- Never invent a law, percentage, fee, deadline, form, requirement, authority, URL or Source ID.
- Every number and transaction-specific statement must be supported by the supplied evidence.
- Distinguish official rules from market practice, contractual terms and examples.
- If the evidence conflicts, is incomplete or may be outdated, say so clearly and lower confidence.
- Include only sourceIds that appear verbatim in the evidence.
- Answer Arabic questions in Arabic and English questions in English.
- Be comprehensive but easy to scan. Prefer a direct conclusion, actual figures, requirements, steps and cautions.
- Lead with the actual answer. If the evidence supplies a percentage, AED amount, deadline, form name or requirement, state it in the first sentence; never replace it with “check the authority” wording.
- Treat evidence labelled DIRECT CONTROLLED ANSWER as the primary synthesis, then cross-check it against the supplied official-document extracts.
- This is controlled information, not transaction-specific legal advice.
- Use the recent conversation only to understand follow-up questions. Factual claims must still come from the supplied evidence.

RECENT CONVERSATION:
${conversation}

USER QUESTION:
${question}

SUPPLIED EVIDENCE:
${evidenceText}`;

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: answerSchema,
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    console.error("Gemini Interactions API request failed", { status: response.status, detail });
    return NextResponse.json({ error: clientError(response.status) }, { status: response.status === 429 ? 429 : 502 });
  }

  const result = await response.json() as Record<string, unknown>;
  const text = interactionText(result);
  if (!text) return NextResponse.json({ error: "Gemini returned no usable answer." }, { status: 502 });

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Gemini returned an unreadable answer." }, { status: 502 });
  }
}
