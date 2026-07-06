import { prisma } from '../../lib/prisma'
import { scoreGarments, GarmentScore } from './score-garments'

export interface CapsuleTiers {
  workhorses: GarmentScore[]       // top 20% by CVS among garments with cvs > 0
  sleepingBeauties: GarmentScore[] // outfitCount > 0, wearCount === 0
  orphans: GarmentScore[]          // outfitCount === 0
  unprocessedCount: number         // isProcessed === false
}

export async function tierGarments(userId: string): Promise<CapsuleTiers> {
  const [scores, unprocessedCount] = await Promise.all([
    scoreGarments(userId),
    prisma.garment.count({ where: { userId, isProcessed: false } }),
  ])

  const sorted = [...scores].filter(s => s.cvs > 0).sort((a, b) => b.cvs - a.cvs)
  const workhorseCount = Math.max(1, Math.ceil(sorted.length * 0.2))
  const workhorses = sorted.slice(0, workhorseCount)

  const sleepingBeauties = scores.filter(s => s.neverWornPenalty)
  const orphans = scores.filter(s => s.outfitCount === 0)

  return { workhorses, sleepingBeauties, orphans, unprocessedCount }
}
