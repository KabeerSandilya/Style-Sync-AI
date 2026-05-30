import { Outfit } from "@/types";
import { WeatherContext } from "../weather/types";
import { ScoredOutfit } from "./types";
import { scoreOutfit, UserPreferenceInput } from "./score-outfit";
import { explainRecommendation } from "./explain-recommendation";

export function rankOutfits(
  outfits: Outfit[],
  weather: WeatherContext,
  userPreference?: UserPreferenceInput
): ScoredOutfit[] {
  const scored = outfits.map((outfit) => {
    const score = scoreOutfit(outfit, weather, userPreference);
    const explanation = explainRecommendation(outfit, weather, score, userPreference);
    return {
      outfitId: outfit.id,
      score,
      explanation,
      outfit,
    };
  });

  // Sort: highest score first. In case of ties, sort by outfit creation date descending (newest first)
  return scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    
    // Fallback: compare dates
    const dateA = new Date(a.outfit.createdAt).getTime();
    const dateB = new Date(b.outfit.createdAt).getTime();
    return dateB - dateA;
  });
}
