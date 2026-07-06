import { prisma } from '../../lib/prisma'

const PURGE_THRESHOLD_MS = 180 * 24 * 60 * 60 * 1000 // 180 days

export interface PurgeSuggestion {
  garmentId: string
  name: string
  reason: string
}

export async function getPurgeSuggestions(userId: string): Promise<PurgeSuggestion[]> {
  const cutoff = new Date(Date.now() - PURGE_THRESHOLD_MS)

  const garments = await prisma.garment.findMany({
    where: {
      userId,
      isProcessed: true,
      createdAt: { lte: cutoff },
      outfitItems: { none: {} }, // zero outfits — orphan tier
    },
    select: { id: true, name: true, createdAt: true },
  })

  return garments.map(g => ({
    garmentId: g.id,
    name: g.name,
    reason: `Added over 180 days ago and not part of any saved outfit.`,
  }))
}
