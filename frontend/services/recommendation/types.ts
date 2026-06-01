import { Outfit } from "@/types";

export interface ScoredOutfit {
  outfitId: string;
  score: number;
  explanation: string;
  outfit: Outfit;
  feedbackType?: 'LIKE' | 'DISLIKE' | null;
  wornToday?: boolean;
  lastWorn?: string | Date | null;
}
