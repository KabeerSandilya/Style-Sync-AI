import { prisma } from '../../lib/prisma'

const OUTFIT_WEIGHT = 4
const WEAR_WEIGHT = 6
const LIKE_WEIGHT = 3
const DISLIKE_WEIGHT = -3
const NEVER_WORN_PENALTY = -10

export interface GarmentScore {
  garmentId: string
  outfitCount: number       // distinct outfits this garment appears in
  wearCount: number         // total wears across those outfits
  likeCount: number         // LIKE feedback on those outfits
  dislikeCount: number      // DISLIKE feedback on those outfits
  neverWornPenalty: boolean // true if outfitCount > 0 and wearCount === 0
  cvs: number               // final score
}

export async function scoreGarments(userId: string): Promise<GarmentScore[]> {
  const garments = await prisma.garment.findMany({
    where: { userId, isProcessed: true },
    select: {
      id: true,
      outfitItems: {
        select: {
          outfit: {
            select: {
              wears: { select: { id: true } },
              feedbacks: { select: { feedbackType: true } },
            },
          },
        },
      },
    },
  })

  return garments.map((g) => {
    const outfitCount = g.outfitItems.length
    let wearCount = 0
    let likeCount = 0
    let dislikeCount = 0

    for (const item of g.outfitItems) {
      wearCount += item.outfit.wears.length
      for (const fb of item.outfit.feedbacks) {
        if (fb.feedbackType === 'LIKE') likeCount += 1
        if (fb.feedbackType === 'DISLIKE') dislikeCount += 1
      }
    }

    const neverWornPenalty = outfitCount > 0 && wearCount === 0

    const cvs =
      outfitCount * OUTFIT_WEIGHT +
      wearCount * WEAR_WEIGHT +
      likeCount * LIKE_WEIGHT +
      dislikeCount * DISLIKE_WEIGHT +
      (neverWornPenalty ? NEVER_WORN_PENALTY : 0)

    return { garmentId: g.id, outfitCount, wearCount, likeCount, dislikeCount, neverWornPenalty, cvs }
  })
}
