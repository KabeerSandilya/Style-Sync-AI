import { prisma } from "@/lib/prisma";
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
