import { GoogleGenAI } from "@google/genai";
import { Occasion, OCCASIONS } from "../../types";

export type QueryClimate = "hot" | "cold" | "rainy" | "mild";

export interface QueryInterpretation {
  occasion: Occasion | null;
  keywords: string[];
  climate: QueryClimate | null;
}

const QUERY_CLIMATES: QueryClimate[] = ["hot", "cold", "rainy", "mild"];

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

export async function interpretStyleQuery(query: string): Promise<QueryInterpretation> {
  const ai = getGenAIClient();

  const prompt = `You are a fashion stylist interpreting a user's free-text description of their
plans so you can pick the right outfit for them.

USER QUERY: "${query}"

Map this to the closest occasion from this exact list (or null if none clearly applies):
${JSON.stringify(OCCASIONS)}

Also extract 3 to 6 short, lowercase keywords describing the ideal garment attributes for this
context (e.g. material, footwear type, silhouette, formality cues). Example: for "I'm going for a
run" you might return ["athletic", "breathable", "sneakers", "moisture-wicking"].

Also determine whether the query itself implies a specific weather/climate context (e.g. "a cold
place", "rainy day trip", "beach in the heat", "somewhere warm"). This should come ONLY from what
the user explicitly said, never from assumptions about their actual current location or today's
real weather. Return exactly one of "hot", "cold", "rainy", "mild", or null if the query says
nothing about climate.

Return ONLY a JSON object, no markdown, no prose, no code fences:
{
  "occasion": "one of the list above, or null",
  "keywords": ["keyword1", "keyword2"],
  "climate": "hot" | "cold" | "rainy" | "mild" | null
}`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 503) {
      console.warn("[interpretStyleQuery] gemini-2.5-flash unavailable (503), retrying with gemini-2.0-flash");
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
    } else {
      throw err;
    }
  }

  const rawText = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty response received from Gemini.");

  const jsonText = extractJson(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.error("[interpretStyleQuery] Malformed JSON from Gemini:\n", jsonText.slice(0, 800));
    throw new Error("Gemini returned malformed JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid response structure from Gemini.");
  }

  const obj = parsed as Record<string, unknown>;

  const occasion = OCCASIONS.includes(obj.occasion as Occasion) ? (obj.occasion as Occasion) : null;

  const keywords = Array.isArray(obj.keywords)
    ? obj.keywords
        .filter((k): k is string => typeof k === "string" && k.trim() !== "")
        .map((k) => k.trim().toLowerCase().slice(0, 30))
        .slice(0, 6)
    : [];

  const climate = QUERY_CLIMATES.includes(obj.climate as QueryClimate) ? (obj.climate as QueryClimate) : null;

  return { occasion, keywords, climate };
}
