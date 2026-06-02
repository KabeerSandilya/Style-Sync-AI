import { GoogleGenAI } from "@google/genai";
import { GarmentMetadata, VALID_CATEGORIES, VALID_SEASONS } from "./types";
import { CLASSIFICATION_PROMPT } from "./prompts";

// Initialize GoogleGenAI client
// Fail gracefully if GEMINI_API_KEY is missing
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not configured. Classification will fail gracefully.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Classify a garment image using Gemini 2.5 Flash.
 * Returns normalized metadata or throws an error.
 */
export async function classifyGarment(imageUrl: string): Promise<GarmentMetadata> {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini API key is not configured.");
  }

  // 1. Fetch image bytes and convert to Base64
  let base64Data = "";
  let mimeType = "image/jpeg";

  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image URL format.");
    }
    mimeType = match[1];
    base64Data = match[2];
  } else {
    // Remote URL (e.g. Cloudinary)
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString("base64");
      mimeType = response.headers.get("content-type") || "image/jpeg";
    } catch (error) {
      console.error("Failed to fetch remote image:", error);
      throw new Error(`Failed to fetch remote image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 2. Call Gemini API
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        CLASSIFICATION_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini.");
    }

    // 3. Parse JSON output
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch (e) {
      console.error("Malformed JSON response from Gemini:", responseText);
      throw new Error("Gemini returned malformed JSON.");
    }

    // 4. Normalize and validate output
    const normalizeString = (val: any): string => {
      if (typeof val !== "string") return "Unknown";
      const trimmed = val.trim();
      return trimmed === "" ? "Unknown" : trimmed;
    };

    // Normalize category
    let category = normalizeString(parsed.category);
    // Find matching valid category (case-insensitive check but enforce correct casing)
    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    category = matchedCategory || "Uncategorized";

    // Normalize season
    let season = normalizeString(parsed.season);
    const matchedSeason = VALID_SEASONS.find(
      (s) => s.toLowerCase() === season.toLowerCase()
    );
    season = matchedSeason || "All Season";

    const subcategory = normalizeString(parsed.subcategory);
    const primaryColor = normalizeString(parsed.primaryColor);
    const secondaryColor = normalizeString(parsed.secondaryColor);
    const style = normalizeString(parsed.style);
    const material = normalizeString(parsed.material);

    // Normalize confidence
    let confidence = parsed.confidence;
    if (typeof confidence !== "number" || isNaN(confidence)) {
      confidence = 50;
    } else {
      confidence = Math.max(0, Math.min(100, Math.round(confidence)));
    }

    return {
      category,
      subcategory,
      primaryColor,
      secondaryColor,
      season,
      style,
      material,
      confidence,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
