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
  type: "OBJECT",
  properties: {
    directAnswer: { type: "STRING" },
    keyPoints: { type: "ARRAY", items: { type: "STRING" } },
    figures: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          value: { type: "STRING" },
          explanation: { type: "STRING" },
        },
        required: ["label", "value", "explanation"],
      },
    },
    requirements: { type: "ARRAY", items: { type: "STRING" } },
    steps: { type: "ARRAY", items: { type: "STRING" } },
    cautions: { type: "ARRAY", items: { type: "STRING" } },
    sourceIds: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "STRING", enum: ["high", "medium", "limited"] },
    language: { type: "STRING", enum: ["en", "ar"] },
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

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Hayat AI is not activated yet. Verified library search remains available." },
      { status: 503 },
    );
  }

  let payload: { question?: string; evidence?: Evidence[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = payload.question?.trim().slice(0, 1200);
  const evidence = (payload.evidence || []).slice(0, 14);
  if (!question || !evidence.length) {
    return NextResponse.json({ error: "A question and supporting evidence are required." }, { status: 400 });
  }

  const evidenceText = evidence
    .map(
      (item, index) =>
        `[${index + 1}] ${item.id} | ${item.kind} | ${item.title}\nAuthority: ${item.authority || "Not stated"}\nStatus: ${item.status || "Not stated"}\n${item.text}`,
    )
    .join("\n\n");

  const prompt = `You are Hayat AI, an evidence-bound assistant for Dubai real-estate professionals and clients.

Answer the user's exact question using ONLY the supplied controlled knowledge entries and official-document extracts. Cross-match the sources and give an actual, practical answer—not a list of search results.

Rules:
- Never invent a law, percentage, fee, deadline, form, requirement, authority, URL or Source ID.
- Every number and transaction-specific statement must be supported by the supplied evidence.
- Distinguish official rules from market practice, contractual terms and examples.
- If the evidence conflicts, is incomplete or may be outdated, say so clearly and lower confidence.
- Include only sourceIds that appear verbatim in the evidence.
- Answer Arabic questions in Arabic and English questions in English.
- Be comprehensive but easy to scan. Prefer a direct conclusion, actual figures, requirements, steps and cautions.
- This is controlled information, not transaction-specific legal advice.

USER QUESTION:
${question}

SUPPLIED EVIDENCE:
${evidenceText}`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: answerSchema,
          maxOutputTokens: 2400,
        },
      }),
    },
  );

  if (!response.ok) {
    const message = response.status === 429
      ? "The free Gemini allowance is temporarily busy or exhausted. Verified library results are still shown below."
      : "Hayat AI could not answer right now. Verified library results are still shown below.";
    return NextResponse.json({ error: message }, { status: response.status === 429 ? 429 : 502 });
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
  if (!text) return NextResponse.json({ error: "Gemini returned no usable answer." }, { status: 502 });

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Gemini returned an unreadable answer." }, { status: 502 });
  }
}
