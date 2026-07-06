import { NextResponse } from 'next/server'
import { cloudinary, prisma, removeBackground, withRetry } from '@style-sync/backend'
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
  return handleRemoveBackground(payload)
}

async function handleRemoveBackground({ garmentId, userId }: JobPayload) {
  const garment = await prisma.garment.findFirst({
    where: { id: garmentId, userId },
  })
  if (!garment) return NextResponse.json({ skipped: 'not found' })
  if (garment.bgRemovedAt) return NextResponse.json({ skipped: 'already processed' })

  const processedBuffer = await withRetry(
    () => removeBackground(garment.imageUrl),
    `remove background for garment ${garmentId}`
  )
  if (!processedBuffer) {
    return NextResponse.json({ error: 'Background removal returned null' }, { status: 500 })
  }

  const uploadProcessed = (): Promise<{ secure_url: string }> =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `stylesync/wardrobe/${userId}/processed`, resource_type: 'image', format: 'png' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string })
        }
      )
      stream.end(processedBuffer)
    })

  const uploadResult = await withRetry(uploadProcessed, `upload processed image for garment ${garmentId}`)

  await prisma.garment.update({
    where: { id: garmentId },
    data: {
      processedImageUrl: uploadResult.secure_url,
      bgRemovedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
