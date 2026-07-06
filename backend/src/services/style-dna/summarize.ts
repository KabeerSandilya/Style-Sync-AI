import { prisma } from '../../lib/prisma'

export interface WardrobeSummary {
  totalGarments: number
  categoryCounts: Record<string, number>
  topColors: string[]
  topStyles: string[]
  seasonBreakdown: Record<string, number>
  mostWornOutfits: Array<{
    outfitId: string
    name: string
    wearCount: number
    garmentCategories: string[]
  }>
  dislikedPatterns: Array<{
    category: string
    style: string
    dislikeCount: number
  }>
  preferredOccasions: string[]
}

export async function buildWardrobeSummary(userId: string): Promise<WardrobeSummary> {
  const [garments, outfitWears, feedback] = await Promise.all([
    prisma.garment.findMany({
      where: { userId, isProcessed: true },
      select: {
        id: true,
        category: true,
        primaryColor: true,
        style: true,
        season: true,
      },
    }),
    prisma.outfitWear.findMany({
      where: { outfit: { userId } },
      include: {
        outfit: {
          include: {
            garments: { include: { garment: { select: { category: true } } } },
          },
        },
      },
      orderBy: { wornAt: 'desc' },
      take: 50,
    }),
    prisma.recommendationFeedback.findMany({
      where: { userId },
      include: {
        outfit: {
          include: {
            garments: { include: { garment: { select: { category: true, style: true } } } },
          },
        },
      },
    }),
  ])

  const categoryCounts: Record<string, number> = {}
  const colorFreq: Record<string, number> = {}
  const styleFreq: Record<string, number> = {}
  const seasonFreq: Record<string, number> = {}

  for (const g of garments) {
    categoryCounts[g.category ?? 'unknown'] = (categoryCounts[g.category ?? 'unknown'] ?? 0) + 1
    if (g.primaryColor) colorFreq[g.primaryColor] = (colorFreq[g.primaryColor] ?? 0) + 1
    if (g.style) styleFreq[g.style] = (styleFreq[g.style] ?? 0) + 1
    if (g.season) seasonFreq[g.season] = (seasonFreq[g.season] ?? 0) + 1
  }

  const topColors = Object.entries(colorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c)

  const topStyles = Object.entries(styleFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s)

  const wearCountMap: Record<string, number> = {}
  for (const w of outfitWears) {
    wearCountMap[w.outfitId] = (wearCountMap[w.outfitId] ?? 0) + 1
  }

  const mostWornOutfits = Object.entries(wearCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([outfitId, wearCount]) => {
      const wear = outfitWears.find(w => w.outfitId === outfitId)!
      return {
        outfitId,
        name: wear.outfit.name ?? 'Untitled',
        wearCount,
        garmentCategories: wear.outfit.garments.map(g => g.garment.category ?? 'unknown'),
      }
    })

  // Derive disliked patterns from DISLIKE feedback
  const dislikedMap: Record<string, { category: string; style: string; count: number }> = {}
  for (const fb of feedback) {
    if (fb.feedbackType !== 'DISLIKE') continue
    for (const og of fb.outfit.garments) {
      const key = `${og.garment.category}:${og.garment.style}`
      if (!dislikedMap[key]) {
        dislikedMap[key] = { category: og.garment.category ?? '', style: og.garment.style ?? '', count: 0 }
      }
      dislikedMap[key].count += 1
    }
  }

  const dislikedPatterns = Object.values(dislikedMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(d => ({ category: d.category, style: d.style, dislikeCount: d.count }))

  // Derive preferred occasions from LIKE feedback
  const occasionFreq: Record<string, number> = {}
  for (const fb of feedback) {
    if (fb.feedbackType !== 'LIKE') continue
    const occ = fb.outfit.occasion
    if (occ) occasionFreq[occ] = (occasionFreq[occ] ?? 0) + 1
  }
  const preferredOccasions = Object.entries(occasionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([o]) => o)

  return {
    totalGarments: garments.length,
    categoryCounts,
    topColors,
    topStyles,
    seasonBreakdown: seasonFreq,
    mostWornOutfits,
    dislikedPatterns,
    preferredOccasions,
  }
}
