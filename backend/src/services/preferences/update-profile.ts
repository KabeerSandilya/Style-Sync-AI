import { prisma } from "../../lib/prisma";
import { calculateScores } from "./calculate-scores";
import { buildProfile } from "./build-profile";

/**
 * Calculates raw score data and updates the UserPreference profile for the user in the database.
 */
export async function updatePreferenceProfile(userId: string, customThreshold?: number) {
  // 1. Calculate raw scores
  const scores = await calculateScores(userId);

  // 2. Fetch existing profile to get current threshold
  const existing = await prisma.userPreference.findUnique({
    where: { userId },
    select: { threshold: true },
  });

  const threshold = customThreshold !== undefined ? customThreshold : (existing?.threshold ?? 5);

  // 3. Build profile arrays (top positive attributes) using the threshold
  const profile = buildProfile(scores, threshold);

  // 4. Upsert into database
  const updated = await prisma.userPreference.upsert({
    where: { userId },
    update: {
      favoriteColors: profile.favoriteColors,
      favoriteStyles: profile.favoriteStyles,
      favoriteCategories: profile.favoriteCategories,
      favoriteSeasons: profile.favoriteSeasons,
      favoriteTypes: profile.favoriteTypes,
      threshold,
      preferenceScore: scores as any, // Cast to handle JSON compatibility
    },
    create: {
      userId,
      favoriteColors: profile.favoriteColors,
      favoriteStyles: profile.favoriteStyles,
      favoriteCategories: profile.favoriteCategories,
      favoriteSeasons: profile.favoriteSeasons,
      favoriteTypes: profile.favoriteTypes,
      threshold,
      preferenceScore: scores as any,
    },
  });

  return updated;
}
