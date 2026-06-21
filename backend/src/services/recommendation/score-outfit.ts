import { Outfit, Garment } from "../../types";
import { WeatherContext } from "../weather/types";
import { FeedbackType } from "@prisma/client";

// Keep this type definition simple to avoid Prisma dependency mismatches
export interface UserPreferenceInput {
  favoriteColors?: string[];
  favoriteStyles?: string[];
  favoriteCategories?: string[];
  favoriteSeasons?: string[];
  favoriteTypes?: string[];
  preferenceScore?: any;
}

export function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
  if (month === 11 || month === 0 || month === 1) {
    return "Winter";
  } else if (month === 2 || month === 3 || month === 4) {
    return "Spring";
  } else if (month === 5 || month === 6 || month === 7) {
    return "Summer";
  } else {
    return "Autumn"; // Also checked against "Fall"
  }
}

// Utility to match strings case-insensitively
function matches(val: string | null | undefined, keywords: string[]): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

// Helper to check if a garment has any matching keyword in name, subcategory, clothingType, tags, or notes
function checkGarmentMatch(garment: Garment, keywords: string[]): boolean {
  return (
    matches(garment.name, keywords) ||
    matches(garment.subcategory, keywords) ||
    matches(garment.clothingType, keywords) ||
    garment.tags.some((tag) => keywords.some((kw) => tag.toLowerCase().includes(kw.toLowerCase()))) ||
    matches(garment.notes, keywords)
  );
}

export const OCCASION_GROUPS: Record<string, string[]> = {
  Work:           ['Work', 'Smart Casual'],
  'Smart Casual': ['Smart Casual', 'Work', 'Date Night'],
  Formal:         ['Formal'],
  Casual:         ['Casual', 'Active'],
  Active:         ['Active', 'Casual'],
  'Date Night':   ['Date Night', 'Smart Casual', 'Formal'],
};

export function scoreOutfit(
  outfit: Outfit,
  weather: WeatherContext,
  userPreference?: UserPreferenceInput,
  lastWornAt?: Date | null,
  feedbackType?: FeedbackType | null,
  requestedOccasion?: string | null,
): number {
  const garments = outfit.garments.map((g) => g.garment).filter(Boolean);
  if (garments.length === 0) return 0;

  // 1. Weather Fit (0 to 40 points)
  let weatherScore = 20; // Start with neutral base

  const temp = weather.temperature;
  const isHot = temp > 32;
  const isCold = temp < 18;
  const isRain = weather.rainProbability > 60;

  const hasTopwear = garments.some((g) => g.category.toLowerCase().includes("top"));
  const hasOuterwear = garments.some(
    (g) =>
      g.category.toLowerCase().includes("outer") ||
      checkGarmentMatch(g, ["jacket", "coat", "sweater", "hoodie", "cardigan"])
  );

  // Weather triggers
  if (isHot) {
    garments.forEach((g) => {
      // Boost lightweight summer clothes
      if (
        g.category.toLowerCase().includes("top") &&
        checkGarmentMatch(g, ["t-shirt", "tshirt", "tee", "linen", "tank", "sleeveless", "lightweight"])
      ) {
        weatherScore += 6;
      }
      if (g.category.toLowerCase().includes("bottom") && checkGarmentMatch(g, ["shorts", "linen"])) {
        weatherScore += 6;
      }
      // Penalize heavy layers
      if (checkGarmentMatch(g, ["hoodie", "sweater", "jacket", "coat", "outerwear", "wool", "cashmere", "heavy"])) {
        weatherScore -= 10;
      }
    });
  } else if (isCold) {
    // Boost warm layers
    garments.forEach((g) => {
      if (checkGarmentMatch(g, ["hoodie", "sweater", "jacket", "coat", "outerwear", "wool", "cashmere", "cardigan", "knit"])) {
        weatherScore += 6;
      }
      // Penalize light clothes
      if (g.category.toLowerCase().includes("bottom") && checkGarmentMatch(g, ["shorts"])) {
        weatherScore -= 10;
      }
      if (checkGarmentMatch(g, ["sleeveless", "tank"])) {
        weatherScore -= 6;
      }
    });
    // Layering bonus for cold weather (having topwear + outerwear/jacket)
    if (hasTopwear && hasOuterwear) {
      weatherScore += 10;
    }
  }

  // Rain rules
  if (isRain) {
    // Boost layering
    if (hasTopwear && hasOuterwear) {
      weatherScore += 5;
    }
    // Check footwear
    const footwears = garments.filter((g) => g.category.toLowerCase().includes("foot"));
    footwears.forEach((g) => {
      // Penalize open toe in rain
      if (checkGarmentMatch(g, ["sandal", "flip flop", "slide", "slipper", "open toe"])) {
        weatherScore -= 12;
      } else {
        // Boost covered footwear
        weatherScore += 5;
      }

      // Penalize light-colored suede
      const isSuede = checkGarmentMatch(g, ["suede"]) || matches(g.material, ["suede"]);
      const isLightColor =
        matches(g.dominantColor, ["white", "cream", "sand", "beige", "light", "grey", "gray", "yellow", "pink"]) ||
        matches(g.primaryColor, ["white", "cream", "sand", "beige", "light", "grey", "gray", "yellow", "pink"]);
      if (isSuede && isLightColor) {
        weatherScore -= 15;
      }
    });
  }

  // Clamp weather score contribution between 0 and 40
  weatherScore = Math.max(0, Math.min(40, weatherScore));

  // 2. Season Fit (0 to 30 points)
  const currentSeason = getCurrentSeason().toLowerCase(); // "spring", "summer", "winter", "autumn"
  let totalSeasonScore = 0;

  garments.forEach((g) => {
    const garmentSeason = g.season ? g.season.toLowerCase() : "";
    if (garmentSeason === "all season") {
      totalSeasonScore += 30;
    } else if (garmentSeason === currentSeason || (currentSeason === "autumn" && garmentSeason === "fall")) {
      totalSeasonScore += 30;
    } else if (!garmentSeason) {
      totalSeasonScore += 10; // Neutral fallback for missing season metadata
    } else {
      totalSeasonScore += 0; // Mismatch
    }
  });
  const seasonScore = Math.round(totalSeasonScore / garments.length);

  // 3. Style Fit (0 to 30 points)
  let styleScore = 15; // Baseline default style fit

  if (userPreference?.favoriteStyles && userPreference.favoriteStyles.length > 0) {
    const prefs = userPreference.favoriteStyles.map((s) => s.toLowerCase());
    let totalStyleScore = 0;

    garments.forEach((g) => {
      const garmentStyle = g.style ? g.style.toLowerCase() : "";
      if (garmentStyle && prefs.some((p) => garmentStyle.includes(p) || p.includes(garmentStyle))) {
        totalStyleScore += 30;
      } else if (!garmentStyle) {
        totalStyleScore += 15; // Neutral
      } else {
        totalStyleScore += 10; // Mismatch
      }
    });
    styleScore = Math.round(totalStyleScore / garments.length);
  }

  // 4. Missing Metadata Penalty (up to -25 points)
  let metadataPenalty = 0;
  garments.forEach((g) => {
    if (!g.category) metadataPenalty += 5;
    if (!g.clothingType) metadataPenalty += 5;
    if (!g.season) metadataPenalty += 5;
    if (!g.style) metadataPenalty += 5;
    if (!g.dominantColor && !g.primaryColor) metadataPenalty += 5;
  });
  // Cap the metadata penalty at 25 points
  metadataPenalty = Math.min(25, metadataPenalty);

  // 5. Feedback Score (+10 for LIKE, -30 for DISLIKE)
  let feedbackScore = 0;
  if (feedbackType === "LIKE") {
    feedbackScore = 10;
  } else if (feedbackType === "DISLIKE") {
    feedbackScore = -30;
  }

  // 5.5. Preference Match Bonus (up to +25 points)
  let preferenceMatchBonus = 0;
  if (userPreference) {
    const favColors = userPreference.favoriteColors || [];
    const favStyles = userPreference.favoriteStyles || [];
    const favCategories = userPreference.favoriteCategories || [];
    const favSeasons = userPreference.favoriteSeasons || [];
    const favTypes = userPreference.favoriteTypes || [];

    garments.forEach((g) => {
      // Color bonus
      const colors = [g.primaryColor, g.secondaryColor, g.dominantColor].filter(Boolean);
      colors.forEach((c) => {
        if (matches(c, favColors)) preferenceMatchBonus += 3;
      });
      // Style bonus
      if (matches(g.style, favStyles)) preferenceMatchBonus += 4;
      // Category bonus
      if (matches(g.category, favCategories)) preferenceMatchBonus += 3;
      // Season bonus
      if (matches(g.season, favSeasons)) preferenceMatchBonus += 2;
      // Clothing Type bonus
      if (matches(g.clothingType, favTypes)) preferenceMatchBonus += 4;
    });

    preferenceMatchBonus = Math.min(25, preferenceMatchBonus);
  }

  // 5.6. Preference Match Penalty (up to -30 points) based on negative raw scores in preferenceScore JSON
  let preferenceMatchPenalty = 0;
  if (userPreference?.preferenceScore) {
    const rawScores = userPreference.preferenceScore as any;
    garments.forEach((g) => {
      // Check style
      if (g.style) {
        const styleKey = g.style.charAt(0).toUpperCase() + g.style.slice(1);
        const score = rawScores.styles?.[styleKey];
        if (score && score < 0) preferenceMatchPenalty += Math.abs(score);
      }
      // Check colors
      const colors = [g.primaryColor, g.secondaryColor, g.dominantColor].filter(Boolean);
      colors.forEach((c) => {
        const colorKey = c!.charAt(0).toUpperCase() + c!.slice(1);
        const score = rawScores.colors?.[colorKey];
        if (score && score < 0) preferenceMatchPenalty += Math.abs(score);
      });
      // Check category
      if (g.category) {
        const catKey = g.category.charAt(0).toUpperCase() + g.category.slice(1);
        const score = rawScores.categories?.[catKey];
        if (score && score < 0) preferenceMatchPenalty += Math.abs(score);
      }
    });

    preferenceMatchPenalty = Math.min(30, preferenceMatchPenalty);
  }

  // 6. Recent Wear Penalty
  let wearPenalty = 0;
  if (lastWornAt) {
    const diffMs = Date.now() - new Date(lastWornAt).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      wearPenalty = 50; // Worn Today -> Heavy Penalty
    } else if (diffHours < 48) {
      wearPenalty = 25; // Worn Yesterday -> Medium Penalty
    } else if (diffHours < 24 * 7) {
      wearPenalty = 10; // Worn Last Week -> Small Penalty
    }
  }

  // 7. Occasion Score (-15 to 25 points)
  let occasionScore = 0;
  if (requestedOccasion) {
    if (!outfit.occasion) {
      occasionScore = 0; // untagged outfit — neutral, do not penalise
    } else if (outfit.occasion === requestedOccasion) {
      occasionScore = 25; // exact match
    } else if (OCCASION_GROUPS[requestedOccasion]?.includes(outfit.occasion)) {
      occasionScore = 12; // compatible match
    } else {
      occasionScore = -15; // clear conflict
    }
  }

  // Calculate final combined score (clamped between 0 and 100)
  const baseScore = weatherScore + seasonScore + styleScore - metadataPenalty + preferenceMatchBonus - preferenceMatchPenalty;
  const finalScore = Math.max(0, Math.min(100, baseScore + feedbackScore - wearPenalty + occasionScore));
  return finalScore;
}
