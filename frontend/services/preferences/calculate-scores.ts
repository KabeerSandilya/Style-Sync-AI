import { prisma } from "@/lib/prisma";
import { PreferenceScoreData } from "./types";

const WEIGHTS = {
  WEAR: 10,
  LIKE: 5,
  FAVORITE: 3,
  DISLIKE: -5,
};

/**
 * Calculates raw preference scores based on the user's wardrobe, wear history, and feedback.
 */
export async function calculateScores(userId: string): Promise<PreferenceScoreData> {
  const scores: PreferenceScoreData = {
    colors: {},
    styles: {},
    categories: {},
    seasons: {},
    types: {},
  };

  // Helper to add points
  const addPoints = (
    attribute: "colors" | "styles" | "categories" | "seasons" | "types",
    value: string | null | undefined,
    points: number
  ) => {
    if (!value) return;
    const clean = value.trim();
    if (!clean) return;
    
    // Normalize to title case or preserve casing case-insensitively
    // We'll store case-insensitively but capitalize standard colors/categories nicely
    const key = clean.charAt(0).toUpperCase() + clean.slice(1);
    scores[attribute][key] = (scores[attribute][key] || 0) + points;
  };

  // 1. Process Garments (Favorites)
  const garments = await prisma.garment.findMany({
    where: { userId },
  });

  garments.forEach((g) => {
    if (g.isFavorite) {
      const colors = [g.primaryColor, g.secondaryColor, g.dominantColor].filter(Boolean);
      colors.forEach((c) => addPoints("colors", c, WEIGHTS.FAVORITE));
      addPoints("styles", g.style, WEIGHTS.FAVORITE);
      addPoints("categories", g.category, WEIGHTS.FAVORITE);
      addPoints("seasons", g.season, WEIGHTS.FAVORITE);
      addPoints("types", g.clothingType, WEIGHTS.FAVORITE);
    }
  });

  // 2. Process Outfits (Favorites)
  const outfits = await prisma.outfit.findMany({
    where: { userId },
    include: {
      garments: {
        include: {
          garment: true,
        },
      },
    },
  });

  outfits.forEach((o) => {
    if (o.isFavorite) {
      o.garments.forEach((og) => {
        const g = og.garment;
        const colors = [g.primaryColor, g.secondaryColor, g.dominantColor].filter(Boolean);
        colors.forEach((c) => addPoints("colors", c, WEIGHTS.FAVORITE));
        addPoints("styles", g.style, WEIGHTS.FAVORITE);
        addPoints("categories", g.category, WEIGHTS.FAVORITE);
        addPoints("seasons", g.season, WEIGHTS.FAVORITE);
        addPoints("types", g.clothingType, WEIGHTS.FAVORITE);
      });
    }
  });

  // 3. Process Wear Events
  const wears = await prisma.outfitWear.findMany({
    where: { userId },
    include: {
      outfit: {
        include: {
          garments: {
            include: {
              garment: true,
            },
          },
        },
      },
    },
  });

  wears.forEach((w) => {
    if (w.outfit) {
      w.outfit.garments.forEach((og) => {
        const g = og.garment;
        const colors = [g.primaryColor, g.secondaryColor, g.dominantColor].filter(Boolean);
        colors.forEach((c) => addPoints("colors", c, WEIGHTS.WEAR));
        addPoints("styles", g.style, WEIGHTS.WEAR);
        addPoints("categories", g.category, WEIGHTS.WEAR);
        addPoints("seasons", g.season, WEIGHTS.WEAR);
        addPoints("types", g.clothingType, WEIGHTS.WEAR);
      });
    }
  });

  // 4. Process Recommendation Feedback (Likes and Dislikes)
  const feedbacks = await prisma.recommendationFeedback.findMany({
    where: { userId },
    include: {
      outfit: {
        include: {
          garments: {
            include: {
              garment: true,
            },
          },
        },
      },
    },
  });

  feedbacks.forEach((f) => {
    if (f.outfit) {
      const points = f.feedbackType === "LIKE" ? WEIGHTS.LIKE : WEIGHTS.DISLIKE;
      f.outfit.garments.forEach((og) => {
        const g = og.garment;
        const colors = [g.primaryColor, g.secondaryColor, g.dominantColor].filter(Boolean);
        colors.forEach((c) => addPoints("colors", c, points));
        addPoints("styles", g.style, points);
        addPoints("categories", g.category, points);
        addPoints("seasons", g.season, points);
        addPoints("types", g.clothingType, points);
      });
    }
  });

  return scores;
}
