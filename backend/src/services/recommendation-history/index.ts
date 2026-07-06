import { prisma } from "../../lib/prisma";
import { FeedbackType } from "@prisma/client";

/**
 * Retrieves a mapping of outfit IDs to their most recent wear timestamp for a user.
 */
export async function getRecentWearsMap(userId: string): Promise<Record<string, Date>> {
  const wears = await prisma.outfitWear.findMany({
    where: { userId },
    orderBy: { wornAt: "desc" },
  });

  const wearsMap: Record<string, Date> = {};
  for (const wear of wears) {
    // The first entry found will be the most recent because of the descending order query
    if (!wearsMap[wear.outfitId]) {
      wearsMap[wear.outfitId] = wear.wornAt;
    }
  }
  return wearsMap;
}

/**
 * Retrieves a mapping of outfit IDs to the most recent time they were suggested
 * back to the user (e.g. via "Ask the Stylist"), so repeat queries can be
 * penalised away from an outfit that was just recommended.
 */
export async function getRecentSuggestionsMap(userId: string): Promise<Record<string, Date>> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const suggestions = await prisma.recommendation.findMany({
    where: { userId, outfitId: { not: null }, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const suggestionsMap: Record<string, Date> = {};
  for (const suggestion of suggestions) {
    if (!suggestion.outfitId) continue;
    // The first entry found will be the most recent because of the descending order query
    if (!suggestionsMap[suggestion.outfitId]) {
      suggestionsMap[suggestion.outfitId] = suggestion.createdAt;
    }
  }
  return suggestionsMap;
}

/**
 * Retrieves a mapping of outfit IDs to their feedback type (LIKE / DISLIKE) for a user.
 */
export async function getFeedbackHistoryMap(userId: string): Promise<Record<string, FeedbackType>> {
  const feedbacks = await prisma.recommendationFeedback.findMany({
    where: { userId },
  });

  const feedbackMap: Record<string, FeedbackType> = {};
  for (const fb of feedbacks) {
    feedbackMap[fb.outfitId] = fb.feedbackType;
  }
  return feedbackMap;
}
