import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  tierGarments,
  analyzeWardrobeGaps,
  getPurgeSuggestions,
  buildWardrobeSummary,
  getCachedCapsuleAudit,
  setCachedCapsuleAudit,
} from '@style-sync/backend'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cached = await getCachedCapsuleAudit(userId)
  if (cached) return NextResponse.json(cached)

  const [tiers, summary, purgeSuggestions] = await Promise.all([
    tierGarments(userId),
    buildWardrobeSummary(userId),
    getPurgeSuggestions(userId),
  ])

  let gapAnalysis = null
  try {
    gapAnalysis = await analyzeWardrobeGaps({
      categoryCounts: summary.categoryCounts,
      topStyles: summary.topStyles,
      seasonBreakdown: summary.seasonBreakdown,
      preferredOccasions: summary.preferredOccasions,
    })
  } catch (err) {
    console.error('[GET /api/insights/capsule] gap analysis failed', err)
  }

  const result = { tiers, gapAnalysis, purgeSuggestions }

  await setCachedCapsuleAudit(userId, result)

  return NextResponse.json(result)
}
