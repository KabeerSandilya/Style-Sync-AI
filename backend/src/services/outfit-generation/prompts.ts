import { GarmentInput } from "./types";

export function buildGenerationPrompt(garments: GarmentInput[], occasion?: string | null, keywords?: string[]): string {
  const garmentList = JSON.stringify(
    garments.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      subcategory: g.subcategory ?? "Unknown",
      primaryColor: g.primaryColor ?? "Unknown",
      style: g.style ?? "Unknown",
      season: g.season ?? "All Season",
      material: g.material ?? "Unknown",
    })),
    null,
    2
  );

  const occasionLine = occasion
    ? `\nThe user is dressing for: ${occasion}.\nPrefer garment combinations appropriate for this context.\nName each outfit to reflect this occasion naturally.\n`
    : "";

  const keywordLine = keywords && keywords.length > 0
    ? `\nThe user's request specifically calls for these qualities: ${keywords.join(", ")}.\nPrioritize garments matching these attributes over any other consideration (including season metadata).\n`
    : "";

  return `You are a professional fashion stylist. Your task is to create stylish, wearable outfit combinations from a wardrobe of clothing items.${occasionLine}${keywordLine}

WARDROBE:
${garmentList}

INSTRUCTIONS:
Create 6 to 8 distinct outfit combinations using the garments above. Each outfit must follow these fashion rules:

1. COMPOSITION — Every outfit must include:
   - At least one top layer (Topwear, Outerwear) OR be a self-contained item (Formalwear, Ethnicwear)
   - Bottomwear when the top is not a full-length garment (no more than one Bottomwear piece per outfit)
   - Optionally: Footwear (at most one), Accessories (at most two)

2. STYLE COHERENCE — Do not mix incompatible style registers:
   - Casual, Streetwear, Minimal, Athleisure can mix with each other
   - Formal and Business Casual can mix with each other
   - Do not pair Formal with Streetwear or Athleisure
   - Bohemian can pair with Casual or Minimal

3. COLOR COORDINATION — Choose one approach per outfit:
   - Neutral base (black, white, grey, beige, navy) + one accent color
   - Tonal dressing (shades of the same color family)
   - Classic complementary pairings (navy + white, black + cream, olive + brown)

4. SEASON MATCHING — Do not pair a Summer-only garment with a Winter-only garment.
   "All Season" garments pair with everything.

5. VARIETY — Spread garment usage across outfits. Avoid using the same garment in more than 3 outfits.
   Each outfit must use between 2 and 5 garments.

6. NAMING — Give each outfit a short editorial name (2–5 words). Examples:
   "Weekend Linen Edit", "Navy Office Look", "Relaxed Street Set", "Tonal Earth Layers"

RESPONSE FORMAT:
Return ONLY a JSON object. No markdown, no prose, no code fences.

{
  "outfits": [
    {
      "name": "short editorial outfit name",
      "garmentIds": ["id1", "id2"],
      "reason": "One sentence explaining why these pieces work together."
    }
  ]
}

Use only IDs from the wardrobe list provided. Do not invent garment IDs.`;
}
