# Durable AI Job Queue (F6)

We are implementing **Durable AI Job Queue** for **StyleSync AI**.

This feature replaces `after()` fire-and-forget background jobs with
[QStash](https://upstash.com/docs/qstash) — Upstash's HTTP-based durable
message queue. It makes garment classification and background removal
survive serverless cold-starts, retries on failure, and prevents silent
job loss at Phase 3 scale.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

Two `after()` calls in `frontend/app/api/upload/route.ts` fire garment
classification and background removal as post-response background tasks:

```ts
after(async () => { /* classify */ })
after(async () => { /* remove background */ })
```

`after()` has three hard limitations in a Vercel serverless environment:

1. **Silent loss on timeout.** Vercel kills the function after its maximum
   execution duration. Any `after()` job still running is terminated with
   no retry — the garment stays `isProcessed: false` forever.
2. **No retry on API failure.** If Gemini or remove.bg returns a transient
   error, `withRetry` handles a few fast retries, but if all fail the job
   disappears. There is no re-queue mechanism.
3. **No idempotency guarantee.** If the upload request is retried by the
   client after a timeout, two classification jobs could run concurrently
   for the same garment ID.

At Phase 2 scale this is acceptable. At Phase 3 scale — with Look Book
uploads (F3) and community images (F5) adding additional processing
load — silent job loss is unacceptable.

---

# Scope

Build:

### QStash publisher helper (`lib/qstash.ts`)
### Worker endpoint: `POST /api/jobs/classify`
### Worker endpoint: `POST /api/jobs/remove-background`
### Replace `after()` calls in upload route with QStash publish
### Fallback to `after()` in local dev when QStash env vars are absent

Do **not** build:

* BullMQ, Redis Streams, or any self-hosted queue infrastructure
* A job status / monitoring dashboard
* Worker endpoints for anything other than classify and remove-background
* QStash schedule or cron features
* Changes to the manual classify (`POST /api/garments/[id]/classify`) or
  manual remove-background (`POST /api/garments/[id]/remove-background`)
  endpoints — those are synchronous by design and stay as-is

---

# New Dependency

```txt
@upstash/qstash
```

Install in `frontend/`:

```bash
npm install @upstash/qstash --workspace frontend
```

---

# New Environment Variables

```txt
QSTASH_TOKEN                 # Secret token for publishing to QStash
QSTASH_CURRENT_SIGNING_KEY   # For verifying incoming QStash webhook signatures
QSTASH_NEXT_SIGNING_KEY      # For key rotation (QStash rotates periodically)
NEXT_PUBLIC_APP_URL          # Canonical app URL (e.g. https://stylesync.vercel.app)
                             # Used to construct absolute worker URLs for QStash delivery
```

Add all four to `frontend/.env.example`.

The app must start without them — local dev falls back to `after()` silently.
Do not crash on missing vars.

---

# QStash Publisher Helper

Create `frontend/lib/qstash.ts`:

```ts
import { Client } from '@upstash/qstash'

let _client: Client | null = null

export function getQStash(): Client | null {
  if (!process.env.QSTASH_TOKEN) return null
  if (!_client) _client = new Client({ token: process.env.QSTASH_TOKEN })
  return _client
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
}
```

`getQStash()` returns `null` when `QSTASH_TOKEN` is absent. Every caller
must handle `null` by falling back to `after()`.

---

# Worker Payload Schema

Both workers receive the same minimal payload:

```ts
interface JobPayload {
  garmentId: string
  userId: string
}
```

The image URL and all processing details are fetched from the database by
the worker — not passed in the payload. Keeps messages small and avoids
stale data if the garment is updated between enqueue and execution.

---

# Worker Endpoints

## Signature Verification

Both workers verify QStash's HMAC-SHA256 signature before processing.
Use the `Receiver` class from `@upstash/qstash`:

```ts
import { Receiver } from '@upstash/qstash'

function getReceiver(): Receiver | null {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY
  const next = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!current || !next) return null
  return new Receiver({ currentSigningKey: current, nextSigningKey: next })
}
```

If the receiver is `null` (local dev / signing keys not set), skip
verification and proceed — this mirrors local dev behavior today.

## `POST /api/jobs/classify`

Create `frontend/app/api/jobs/classify/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma, classifyGarment, withRetry } from '@style-sync/backend'
import { Receiver } from '@upstash/qstash'

export async function POST(req: Request) {
  // 1. Verify QStash signature
  const receiver = getReceiver()
  if (receiver) {
    const signature = req.headers.get('upstash-signature') ?? ''
    const body = await req.text()
    const isValid = await receiver.verify({ signature, body }).catch(() => false)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    // Parse body after verification
    const payload: JobPayload = JSON.parse(body)
    return handleClassify(payload)
  }

  const payload: JobPayload = await req.json()
  return handleClassify(payload)
}

async function handleClassify({ garmentId, userId }: JobPayload) {
  // 2. Idempotency check — return 200 immediately if already processed
  const garment = await prisma.garment.findFirst({
    where: { id: garmentId, userId },
  })
  if (!garment) return NextResponse.json({ skipped: 'not found' })
  if (garment.isProcessed) return NextResponse.json({ skipped: 'already processed' })

  // 3. Classify — withRetry guards against transient AI failures within this attempt
  const metadata = await withRetry(
    () => classifyGarment(garment.imageUrl),
    `classify garment ${garmentId}`
  )

  // 4. Persist
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
```

On any unhandled exception, let it propagate as a 500. QStash interprets
non-2xx as failure and retries (up to 3 attempts with exponential backoff).

## `POST /api/jobs/remove-background`

Create `frontend/app/api/jobs/remove-background/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { cloudinary, prisma, removeBackground, withRetry } from '@style-sync/backend'
import { Receiver } from '@upstash/qstash'

export async function POST(req: Request) {
  // 1. Verify QStash signature (same pattern as classify worker)
  const receiver = getReceiver()
  if (receiver) {
    const signature = req.headers.get('upstash-signature') ?? ''
    const body = await req.text()
    const isValid = await receiver.verify({ signature, body }).catch(() => false)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    const payload: JobPayload = JSON.parse(body)
    return handleRemoveBackground(payload)
  }

  const payload: JobPayload = await req.json()
  return handleRemoveBackground(payload)
}

async function handleRemoveBackground({ garmentId, userId }: JobPayload) {
  // 2. Idempotency check — already has a processed image, skip
  const garment = await prisma.garment.findFirst({
    where: { id: garmentId, userId },
  })
  if (!garment) return NextResponse.json({ skipped: 'not found' })
  if (garment.bgRemovedAt) return NextResponse.json({ skipped: 'already processed' })

  // 3. Remove background
  const processedBuffer = await withRetry(
    () => removeBackground(garment.imageUrl),
    `remove background for garment ${garmentId}`
  )
  if (!processedBuffer) {
    return NextResponse.json({ error: 'Background removal returned null' }, { status: 500 })
  }

  // 4. Upload to Cloudinary
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

  // 5. Persist
  await prisma.garment.update({
    where: { id: garmentId },
    data: {
      processedImageUrl: uploadResult.secure_url,
      bgRemovedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
```

---

# Upload Route Changes

In `frontend/app/api/upload/route.ts`, replace the two `after()` blocks
with QStash publishes. Add a helper at the top of the file:

```ts
import { after } from 'next/server'
import { getQStash, getAppUrl } from '@/lib/qstash'
```

Replace the classification `after()` block:

```ts
// Before
if (process.env.GEMINI_API_KEY) {
  after(async () => { /* classify logic */ })
}

// After
if (process.env.GEMINI_API_KEY) {
  const qstash = getQStash()
  if (qstash) {
    await qstash.publishJSON({
      url: `${getAppUrl()}/api/jobs/classify`,
      body: { garmentId: garment.id, userId },
      retries: 3,
    })
  } else {
    // Local dev fallback
    after(async () => { /* existing classify logic unchanged */ })
  }
}
```

Replace the background removal `after()` block:

```ts
// Before
if (hasCloudinaryCreds && !processedImageUrl) {
  after(async () => { /* bg removal logic */ })
}

// After
if (hasCloudinaryCreds && !processedImageUrl) {
  const qstash = getQStash()
  if (qstash) {
    await qstash.publishJSON({
      url: `${getAppUrl()}/api/jobs/remove-background`,
      body: { garmentId: garment.id, userId },
      retries: 3,
    })
  } else {
    // Local dev fallback
    after(async () => { /* existing bg removal logic unchanged */ })
  }
}
```

The `after()` import and all existing `after()` logic stays in the file —
it is only used when QStash is not configured.

---

# Retry Policy

QStash retries failed deliveries (non-2xx response or network error):

| Setting | Value |
|---------|-------|
| Max retries | 3 |
| Backoff | Exponential (QStash default) |
| Max delay | ~60 s |
| Deduplication | None needed — idempotency check in worker |

Workers must return a 2xx to acknowledge success. Any 4xx (except 401 for
invalid signature) or 5xx causes QStash to retry.

---

# Idempotency

Both workers guard against double execution:

- **Classify worker:** checks `garment.isProcessed` — if `true`, returns 200
  immediately without calling Gemini.
- **Remove-background worker:** checks `garment.bgRemovedAt` — if non-null,
  returns 200 immediately without calling remove.bg or Cloudinary.

This means duplicate delivers (e.g. from client-side upload retries or QStash
at-least-once delivery) are safe.

---

# Security

- QStash signs every delivery with HMAC-SHA256 using the signing keys.
- Workers verify the signature before processing. An invalid signature returns
  `401` — QStash does **not** retry on 401.
- Signing keys are never sent to the client (`NEXT_PUBLIC_` prefix is absent).
- Workers are not authenticated with Clerk — they are called by QStash, not
  by the browser. The `userId` in the payload is used only to scope the
  Prisma query (`findFirst({ where: { id, userId } })`), preventing
  cross-user data access even if a payload is forged.

---

# Local Dev Behavior

When `QSTASH_TOKEN` is absent:

- `getQStash()` returns `null`.
- Upload route falls back to the existing `after()` blocks — zero behavior
  change in local development.
- Worker endpoints still exist and can be called directly via `curl` or
  Postman for manual testing (signature verification skipped when signing
  keys are absent).

---

# Files to Create

```txt
frontend/lib/qstash.ts
frontend/app/api/jobs/classify/route.ts
frontend/app/api/jobs/remove-background/route.ts
```

---

# Files to Modify

```txt
frontend/app/api/upload/route.ts
  — replace both after() blocks with qstash.publishJSON()
  — keep after() as fallback when getQStash() returns null
  — import getQStash and getAppUrl from @/lib/qstash

frontend/.env.example
  — add QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY, NEXT_PUBLIC_APP_URL
```

---

# Database Changes

None. Workers update the same `Garment` fields as the current `after()`
jobs. No new models, no schema migrations.

---

# Check When Done

* `@upstash/qstash` is in `frontend/package.json` dependencies
* `frontend/lib/qstash.ts` exists; `getQStash()` returns `null` when
  `QSTASH_TOKEN` is absent
* `POST /api/jobs/classify` and `POST /api/jobs/remove-background` exist
* Both worker endpoints verify the QStash signature and return 401 on
  mismatch (when signing keys are configured)
* Both worker endpoints are idempotent — re-running for an already-processed
  garment returns 200 without calling Gemini or remove.bg again
* Upload route uses `qstash.publishJSON()` when QStash is configured
* Upload route falls back to `after()` when `QSTASH_TOKEN` is absent
* `GEMINI_API_KEY` gate is preserved — classify job is only enqueued when
  the key is present
* `hasCloudinaryCreds` gate is preserved — bg removal job is only enqueued
  when Cloudinary is configured and no client-side processed image was sent
* All four QStash env vars documented in `frontend/.env.example`
* `npm run build` passes (Next.js)
* `npx tsc --noEmit` — zero TypeScript errors (frontend)
* No lint errors
* App works correctly in local dev without QStash env vars set
