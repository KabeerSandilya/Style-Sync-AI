import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  prisma,
  isRateLimited,
  buildWardrobeSummary,
  generateStyleDNA,
  getCachedStyleDNA,
  setCachedStyleDNA,
  invalidateStyleDNACache,
} from '@style-sync/backend'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cached = await getCachedStyleDNA(userId)
  if (cached) return NextResponse.json(cached)

  const record = await prisma.styleDNA.findUnique({ where: { userId } })
  if (!record) return NextResponse.json({ error: 'No Style DNA generated yet' }, { status: 404 })

  await setCachedStyleDNA(userId, record)
  return NextResponse.json(record)
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classifiedCount = await prisma.garment.count({
    where: { userId, isProcessed: true },
  })
  if (classifiedCount < 10) {
    return NextResponse.json(
      { error: 'At least 10 classified garments are required to generate Style DNA' },
      { status: 422 },
    )
  }

  const limited = await isRateLimited(`style-dna:${userId}`, {
    limit: 1,
    windowMs: 24 * 60 * 60 * 1000,
  })
  if (limited) {
    return NextResponse.json(
      { error: 'Style DNA can only be regenerated once per 24 hours' },
      { status: 429 },
    )
  }

  try {
    const summary = await buildWardrobeSummary(userId)

    const garments = await prisma.garment.findMany({
      where: { userId, isProcessed: true },
      select: { id: true },
    })
    const garmentIds = garments.map(g => g.id)

    const dna = await generateStyleDNA(summary, garmentIds)

    const record = await prisma.styleDNA.upsert({
      where: { userId },
      create: {
        userId,
        archetype: dna.archetype,
        colorStory: dna.colorStory,
        signaturePieces: dna.signaturePieces,
        styleKeywords: dna.styleKeywords,
        styleNarrative: dna.styleNarrative,
        wardrobeStrengths: dna.wardrobeStrengths,
        blindSpots: dna.blindSpots,
      },
      update: {
        archetype: dna.archetype,
        colorStory: dna.colorStory,
        signaturePieces: dna.signaturePieces,
        styleKeywords: dna.styleKeywords,
        styleNarrative: dna.styleNarrative,
        wardrobeStrengths: dna.wardrobeStrengths,
        blindSpots: dna.blindSpots,
        generatedAt: new Date(),
      },
    })

    await invalidateStyleDNACache(userId)
    await setCachedStyleDNA(userId, record)

    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    console.error('[POST /api/style-dna]', err)
    return NextResponse.json(
      { error: (err as Error)?.message ?? 'Failed to generate Style DNA' },
      { status: 500 },
    )
  }
}
