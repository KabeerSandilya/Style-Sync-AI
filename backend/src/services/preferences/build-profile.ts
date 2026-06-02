import { PreferenceScoreData } from "./types";

interface BuildProfileResult {
  favoriteColors: string[];
  favoriteStyles: string[];
  favoriteCategories: string[];
  favoriteSeasons: string[];
  favoriteTypes: string[];
}

/**
 * Builds the simplified profile by sorting preference scores and taking the top positive values.
 */
export function buildProfile(
  scores: PreferenceScoreData,
  threshold = 5
): BuildProfileResult {
  const getTopKeys = (record: Record<string, number>, limit = 5): string[] => {
    return Object.entries(record)
      .filter(([_, score]) => score >= threshold) // Configurable threshold to filter low-engagement items
      .sort((a, b) => b[1] - a[1]) // Sort descending by score
      .slice(0, limit) // Limit to top choices
      .map(([key]) => key);
  };

  return {
    favoriteColors: getTopKeys(scores.colors, 5),
    favoriteStyles: getTopKeys(scores.styles, 5),
    favoriteCategories: getTopKeys(scores.categories, 5),
    favoriteSeasons: getTopKeys(scores.seasons, 5),
    favoriteTypes: getTopKeys(scores.types, 5),
  };
}
