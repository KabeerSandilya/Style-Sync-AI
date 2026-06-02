import { GoogleGenAI } from "@google/genai";
import { GarmentInput, GenerationResult } from "./types";
import { buildGenerationPrompt } from "./prompts";

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[generateOutfits] GEMINI_API_KEY not configured.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/** Strip markdown code fences that Gemini sometimes wraps around JSON. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

export async function generateOutfits(garments: GarmentInput[]): Promise<GenerationResult> {
  const ai = getGenAIClient();
  if (!ai) throw new Error("Gemini API key is not configured.");

  const prompt = buildGenerationPrompt(garments);

  // Pass the prompt as a plain string — matches the pattern used by classify-garment.ts
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const rawText =
    response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) throw new Error("Empty response received from Gemini.");

  const jsonText = extractJson(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.error("[generateOutfits] Malformed JSON from Gemini:\n", jsonText.slice(0, 800));
    throw new Error("Gemini returned malformed JSON.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).outfits)
  ) {
    console.error("[generateOutfits] Unexpected response shape:", JSON.stringify(parsed).slice(0, 400));
    throw new Error("Invalid response structure: expected { outfits: [] }.");
  }

  const inputIds = new Set(garments.map((g) => g.id));
  const rawOutfits = (parsed as Record<string, unknown>).outfits as unknown[];

  console.log(`[generateOutfits] Gemini returned ${rawOutfits.length} raw outfit(s)`);

  const valid = rawOutfits
    .filter((o): o is { name: string; garmentIds: string[]; reason: string } => {
      if (typeof o !== "object" || o === null) return false;
      const obj = o as Record<string, unknown>;

      if (typeof obj.name !== "string" || obj.name.trim() === "") {
        console.warn("[generateOutfits] Skipping outfit — missing name:", obj);
        return false;
      }
      if (!Array.isArray(obj.garmentIds)) {
        console.warn("[generateOutfits] Skipping outfit — garmentIds not an array:", obj.name);
        return false;
      }
      if (obj.garmentIds.length < 2 || obj.garmentIds.length > 5) {
        console.warn(`[generateOutfits] Skipping outfit "${obj.name}" — ${obj.garmentIds.length} garments (need 2–5)`);
        return false;
      }
      if (typeof obj.reason !== "string") {
        console.warn(`[generateOutfits] Skipping outfit "${obj.name}" — missing reason`);
        return false;
      }

      // Validate that every referenced ID actually exists in the input
      const badIds = (obj.garmentIds as unknown[]).filter(
        (id) => typeof id !== "string" || !inputIds.has(id)
      );
      if (badIds.length > 0) {
        console.warn(
          `[generateOutfits] Skipping outfit "${obj.name}" — unknown garment IDs: ${JSON.stringify(badIds)}`
        );
        return false;
      }

      return true;
    })
    .map((o) => ({
      name: o.name.trim().slice(0, 100),
      garmentIds: o.garmentIds as string[],
      reason: o.reason.trim().slice(0, 500),
    }));

  console.log(`[generateOutfits] ${valid.length} outfit(s) passed validation`);

  return { outfits: valid };
}
