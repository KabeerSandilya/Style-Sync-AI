import { GoogleGenAI } from "@google/genai";
import { GarmentInput, GenerationResult } from "./types";
import { buildGenerationPrompt } from "./prompts";
import { inferOccasion } from "../recommendation/infer-occasion";

/**
 * Pure validation helper — no side effects, fully testable.
 * Returns true when the raw outfit object is structurally valid and safe to save.
 */
export function validateGeneratedOutfit(
  o: unknown,
  inputIds: Set<string>,
  garmentCategoryMap: Map<string, string>,
  existingFingerprints?: Set<string>,
): o is { name: string; garmentIds: string[]; reason: string } {
  if (typeof o !== "object" || o === null) return false;
  const obj = o as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.trim() === "") return false;
  if (!Array.isArray(obj.garmentIds)) return false;
  const ids = obj.garmentIds as unknown[];
  if (ids.length < 2 || ids.length > 5) return false;
  if (typeof obj.reason !== "string") return false;

  // All referenced IDs must exist in the garment input
  const badIds = ids.filter((id) => typeof id !== "string" || !inputIds.has(id as string));
  if (badIds.length > 0) return false;

  // Category exclusivity: at most one bottomwear and one footwear per outfit
  const categories = (ids as string[]).map((id) =>
    (garmentCategoryMap.get(id) ?? "").toLowerCase(),
  );
  if (categories.filter((c) => c.includes("bottom")).length >= 2) return false;
  if (categories.filter((c) => c.includes("foot")).length >= 2) return false;

  // Fingerprint deduplication against already-saved outfits
  if (existingFingerprints) {
    const fingerprint = [...(ids as string[])].sort().join("|");
    if (existingFingerprints.has(fingerprint)) return false;
  }

  return true;
}

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

export async function generateOutfits(garments: GarmentInput[], occasion?: string | null): Promise<GenerationResult> {
  const ai = getGenAIClient();
  if (!ai) throw new Error("Gemini API key is not configured.");

  const garmentInputMap = new Map(garments.map((g) => [g.id, g]));

  const prompt = buildGenerationPrompt(garments, occasion);

  // Try primary model; fall back to gemini-2.0-flash on 503 (capacity spikes).
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
      console.warn("[generateOutfits] gemini-2.5-flash unavailable (503), retrying with gemini-2.0-flash");
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
    } else {
      throw err;
    }
  }

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
  const garmentCategoryMap = new Map(garments.map((g) => [g.id, g.category]));
  const rawOutfits = (parsed as Record<string, unknown>).outfits as unknown[];

  console.log(`[generateOutfits] Gemini returned ${rawOutfits.length} raw outfit(s)`);

  const valid = rawOutfits
    .filter((o): o is { name: string; garmentIds: string[]; reason: string } => {
      if (!validateGeneratedOutfit(o, inputIds, garmentCategoryMap)) {
        const name = (o as Record<string, unknown>)?.name ?? "(no name)";
        console.warn(`[generateOutfits] Skipping invalid outfit: ${name}`);
        return false;
      }
      return true;
    })
    .map((o) => {
      const resolvedGarments = (o.garmentIds as string[]).map((id) => garmentInputMap.get(id)).filter(Boolean) as GarmentInput[];
      const outfitOccasion = occasion !== undefined ? (occasion ?? null) : (inferOccasion(resolvedGarments) ?? null);
      return {
        name: o.name.trim().slice(0, 100),
        garmentIds: o.garmentIds as string[],
        reason: o.reason.trim().slice(0, 500),
        occasion: outfitOccasion,
      };
    });

  console.log(`[generateOutfits] ${valid.length} outfit(s) passed validation`);

  return { outfits: valid };
}
