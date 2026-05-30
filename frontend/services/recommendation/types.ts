import { Outfit } from "@/types";

export interface ScoredOutfit {
  outfitId: string;
  score: number;
  explanation: string;
  outfit: Outfit;
}
