import { Outfit } from "../../types";
import { WeatherContext } from "../weather/types";
import { ScoredOutfit } from "./types";
import { scoreOutfit, UserPreferenceInput } from "./score-outfit";
import { explainRecommendation } from "./explain-recommendation";
import { FeedbackType } from "@prisma/client";

export function rankOutfits(
  outfits: Outfit[],
  weather: WeatherContext,
  userPreference?: UserPreferenceInput,
  wearsMap?: Record<string, Date>,
  feedbackMap?: Record<string, FeedbackType>,
  requestedOccasion?: string | null,
  queryKeywords?: string[],
  suggestionsMap?: Record<string, Date>,
  seasonOverride?: string | null,
): ScoredOutfit[] {
  const scored = outfits.map((outfit) => {
    const lastWornAt = wearsMap ? wearsMap[outfit.id] : null;
    const feedbackType = feedbackMap ? feedbackMap[outfit.id] : null;
    const lastSuggestedAt = suggestionsMap ? suggestionsMap[outfit.id] : null;
    const score = scoreOutfit(outfit, weather, userPreference, lastWornAt, feedbackType, requestedOccasion, queryKeywords, lastSuggestedAt, seasonOverride);
    const explanation = explainRecommendation(outfit, weather, score, userPreference, requestedOccasion, queryKeywords);
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
