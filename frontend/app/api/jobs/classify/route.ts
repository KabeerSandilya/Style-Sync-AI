import { NextResponse } from 'next/server'
import { prisma, classifyGarment, withRetry } from '@style-sync/backend'
import { Receiver } from '@upstash/qstash'

interface JobPayload {
  garmentId: string
  userId: string
}

function getReceiver(): Receiver | null {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY
  const next = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!current || !next) return null
  return new Receiver({ currentSigningKey: current, nextSigningKey: next })
}

export async function POST(req: Request) {
  const receiver = getReceiver()
  if (!receiver) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const signature = req.headers.get('upstash-signature') ?? ''
  const body = await req.text()
  const isValid = await receiver.verify({ signature, body }).catch(() => false)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  const payload: JobPayload = JSON.parse(body)
  return handleClassify(payload)
}

async function handleClassify({ garmentId, userId }: JobPayload) {
  const garment = await prisma.garment.findFirst({
    where: { id: garmentId, userId },
  })
  if (!garment) return NextResponse.json({ skipped: 'not found' })
  if (garment.isProcessed) return NextResponse.json({ skipped: 'already processed' })

  const metadata = await withRetry(
    () => classifyGarment(garment.imageUrl),
    `classify garment ${garmentId}`
  )

  await prisma.garment.update({
    where: { id: garmentId },
    data: {
      category: metadata.category,
      subcategory: metadata.subcategory,
      primaryColor: metadata.primaryColor,
      secondaryColor: metadata.secondaryColor,
      season: metadata.season,
      style: metadata.style,
      material: metadata.material,
      confidence: metadata.confidence,
      isProcessed: true,
    },
  })

  return NextResponse.json({ success: true })
}
