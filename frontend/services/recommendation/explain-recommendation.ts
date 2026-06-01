import { Outfit, Garment } from "@/types";
import { WeatherContext } from "../weather/types";
import { UserPreferenceInput, getCurrentSeason } from "./score-outfit";

export function explainRecommendation(
  outfit: Outfit,
  weather: WeatherContext,
  score: number,
  userPreference?: UserPreferenceInput
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

  // Helper check function
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

  // 1. High Rain logic
  if (isRain) {
    const hasSandal = garments.some(
      (g) => g.category.toLowerCase().includes("foot") && hasKeyword(g, ["sandal", "flip flop", "slide", "slipper", "open toe"])
    );
    if (!hasSandal && garments.some((g) => g.category.toLowerCase().includes("foot"))) {
      return "Includes protective, closed-toe footwear and sensible layering for rainy conditions.";
    }
    return "Layered upper pieces provide quick cover and comfort in today's wet forecast.";
  }

  // 2. High Temperature logic
  if (isHot) {
    const hasSummerBoots = garments.some(
      (g) => g.category.toLowerCase().includes("foot") && hasKeyword(g, ["boots", "leather boots", "heavy boots"])
    );
    const hasLinen = garments.some((g) => hasKeyword(g, ["linen", "silk", "cotton"]));
    if (hasLinen && !hasSummerBoots) {
      return "Lightweight, breathable fabrics in this outfit make it exceptionally comfortable for hot weather.";
    }
    return "A minimal, breezy combination selected to keep you cool and relaxed in high temperatures.";
  }

  // 3. Low Temperature logic
  if (isCold) {
    const hasTop = garments.some((g) => g.category.toLowerCase().includes("top"));
    const hasOuter = garments.some((g) => g.category.toLowerCase().includes("outer") || hasKeyword(g, ["jacket", "coat", "sweater", "hoodie", "cardigan"]));
    if (hasTop && hasOuter) {
      return "Cozy layered styling and substantial outerwear make this look perfect for today's chill.";
    }
    return "Includes warm fabrics and insulated pieces to protect against cooler temperatures.";
  }

  // 4. Season Coherence logic
  const seasonCount = garments.filter((g) => {
    const s = g.season ? g.season.toLowerCase() : "";
    return s === currentSeason || s === "all season" || (currentSeason === "autumn" && s === "fall");
  }).length;

  if (seasonCount / garments.length > 0.7) {
    return `The seasonal structure and weight of this look align beautifully with ${getCurrentSeason()} conditions.`;
  }

  // 5. Preferred Style logic
  if (userPreference?.favoriteStyles && userPreference.favoriteStyles.length > 0) {
    const prefs = userPreference.favoriteStyles.map((s) => s.toLowerCase());
    const matchesStyle = garments.some((g) => {
      const gs = g.style ? g.style.toLowerCase() : "";
      return gs && prefs.some((p) => gs.includes(p) || p.includes(gs));
    });
    if (matchesStyle) {
      return "Tailored closely to your aesthetic preferences and suited to today's general climate.";
    }
  }

  // 6. Default general rule-based response based on overall score
  if (score >= 85) {
    return "An excellent, highly-coordinated configuration that matches today's forecast and styling notes.";
  } else if (score >= 60) {
    return "A well-balanced, classic selection curated for today's forecast.";
  } else {
    return "A basic option that satisfies daily essentials, though metadata suggestions may improve it.";
  }
}
