import { Outfit, Garment } from "../../types";
import { WeatherContext } from "../weather/types";
import { UserPreferenceInput, getCurrentSeason, OCCASION_GROUPS } from "./score-outfit";

export function explainRecommendation(
  outfit: Outfit,
  weather: WeatherContext,
  score: number,
  userPreference?: UserPreferenceInput,
  requestedOccasion?: string | null,
  queryKeywords?: string[],
): string {
  const garments = outfit.garments.map((g) => g.garment).filter(Boolean);
  if (garments.length === 0) {
    return "This outfit has no garments to recommend.";
  }

  const temp = weather.temperature;
  const isHot = temp > 32;
  const isCold = temp < 18;
  const isRain = weather.rainProbability > 60;
  const currentSeason = getCurrentSeason().toLowerCase();

  const hasKeyword = (garment: Garment, kwList: string[]) => {
    const checkString = [
      garment.name,
      garment.subcategory,
      garment.clothingType,
      garment.notes,
      garment.material,
      ...garment.tags
    ].filter(Boolean).join(" ").toLowerCase();

    return kwList.some((kw) => checkString.includes(kw.toLowerCase()));
  };

  let explanation: string;

  if (isRain) {
    const hasSandal = garments.some(
      (g) => g.category.toLowerCase().includes("foot") && hasKeyword(g, ["sandal", "flip flop", "slide", "slipper", "open toe"])
    );
    if (!hasSandal && garments.some((g) => g.category.toLowerCase().includes("foot"))) {
      explanation = "Includes protective, closed-toe footwear and sensible layering for rainy conditions.";
    } else {
      explanation = "Layered upper pieces provide quick cover and comfort in today's wet forecast.";
    }
  } else if (isHot) {
    const hasSummerBoots = garments.some(
      (g) => g.category.toLowerCase().includes("foot") && hasKeyword(g, ["boots", "leather boots", "heavy boots"])
    );
    const hasLinen = garments.some((g) => hasKeyword(g, ["linen", "silk", "cotton"]));
    if (hasLinen && !hasSummerBoots) {
      explanation = "Lightweight, breathable fabrics in this outfit make it exceptionally comfortable for hot weather.";
    } else {
      explanation = "A minimal, breezy combination selected to keep you cool and relaxed in high temperatures.";
    }
  } else if (isCold) {
    const hasTop = garments.some((g) => g.category.toLowerCase().includes("top"));
    const hasOuter = garments.some((g) => g.category.toLowerCase().includes("outer") || hasKeyword(g, ["jacket", "coat", "sweater", "hoodie", "cardigan"]));
    if (hasTop && hasOuter) {
      explanation = "Cozy layered styling and substantial outerwear make this look perfect for today's chill.";
    } else {
      explanation = "Includes warm fabrics and insulated pieces to protect against cooler temperatures.";
    }
  } else {
    const seasonCount = garments.filter((g) => {
      const s = g.season ? g.season.toLowerCase() : "";
      return s === currentSeason || s === "all season" || (currentSeason === "autumn" && s === "fall");
    }).length;

    if (seasonCount / garments.length > 0.7) {
      explanation = `The seasonal structure and weight of this look align beautifully with ${getCurrentSeason()} conditions.`;
    } else if (userPreference?.favoriteStyles && userPreference.favoriteStyles.length > 0) {
      const prefs = userPreference.favoriteStyles.map((s) => s.toLowerCase());
      const matchesStyle = garments.some((g) => {
        const gs = g.style ? g.style.toLowerCase() : "";
        return gs && prefs.some((p) => gs.includes(p) || p.includes(gs));
      });
      if (matchesStyle) {
        explanation = "Tailored closely to your aesthetic preferences and suited to today's general climate.";
      } else if (score >= 85) {
        explanation = "An excellent, highly-coordinated configuration that matches today's forecast and styling notes.";
      } else if (score >= 60) {
        explanation = "A well-balanced, classic selection curated for today's forecast.";
      } else {
        explanation = "A basic option that satisfies daily essentials, though metadata suggestions may improve it.";
      }
    } else if (score >= 85) {
      explanation = "An excellent, highly-coordinated configuration that matches today's forecast and styling notes.";
    } else if (score >= 60) {
      explanation = "A well-balanced, classic selection curated for today's forecast.";
    } else {
      explanation = "A basic option that satisfies daily essentials, though metadata suggestions may improve it.";
    }
  }

  // Append occasion phrase when there is a positive occasion score
  if (requestedOccasion && outfit.occasion) {
    if (outfit.occasion === requestedOccasion) {
      explanation += ` A strong match for ${requestedOccasion}.`;
    } else if (OCCASION_GROUPS[requestedOccasion]?.includes(outfit.occasion)) {
      explanation += ` Works well for ${requestedOccasion}.`;
    }
    // -15 conflict: omit occasion mention entirely
  }

  // Append matched keyword phrase when the query surfaced specific attribute matches
  if (queryKeywords && queryKeywords.length > 0) {
    const matched = queryKeywords.filter((kw) => garments.some((g) => hasKeyword(g, [kw])));
    if (matched.length > 0) {
      explanation += ` Tailored to match: ${matched.join(", ")}.`;
    }
  }

  return explanation;
}
