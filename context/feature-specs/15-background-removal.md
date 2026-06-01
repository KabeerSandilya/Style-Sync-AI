# Background Removal Pipeline

We are implementing the **Background Removal Pipeline** for **StyleSync AI**.

Users can already:

* upload garments
* store images in Cloudinary
* classify garments with AI
* manage wardrobe metadata
* build outfits
* receive recommendations

The system currently stores raw clothing photos — with backgrounds, cluttered environments, and inconsistent framing.

This degrades the wardrobe experience.

Garment cards, outfit collages, and outfit previews should display clean, isolated clothing items against a transparent or neutral surface — not raw photos.

This feature introduces:

* background removal service
* fire-and-forget processing after upload
* processed image storage
* UI fallback between raw and processed images
* manual re-processing trigger

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`

The processing must feel:

**invisible and automatic.**

Users should never need to think about it.

---

# Scope

Build:

### Background Removal Service

### Upload Pipeline Integration

### Processed Image Storage

### Garment Model Update

### Manual Re-Process Endpoint

### UI Processing State

Do **not** build:

* real-time processing during upload (no blocking)
* client-side background removal
* queue infrastructure (BullMQ / Redis)
* progress websockets
* bulk reprocessing UI
* image editing tools

This version processes in fire-and-forget mode only.

---

# Background Removal Flow

```txt
User Uploads Garment
        ↓
Image Uploaded to Cloudinary
        ↓
Garment Saved to DB (isProcessed: false)
        ↓
Upload Response Returned to Client
        ↓
[Fire-and-Forget]
        ↓
Fetch Original Image Bytes
        ↓
Call remove.bg API
        ↓
Receive PNG with Transparent Background
        ↓
Upload Processed Image to Cloudinary
        ↓
Update Garment: processedImageUrl, bgRemovedAt
        ↓
Garment Card Auto-Refreshes on Next Load
```

The upload response must **never** wait for background removal to complete.

---

# Background Removal Service

Create:

```txt
services/background-removal/
```

Required files:

```txt
services/background-removal/remove-background.ts
services/background-removal/types.ts
```

---

## Provider

Use **remove.bg** as the background removal provider.

API endpoint:

```txt
POST https://api.remove.bg/v1.0/removebg
```

Authentication:

```txt
X-Api-Key: {REMOVE_BG_API_KEY}
```

Required environment variable:

```env
REMOVE_BG_API_KEY=your_api_key
```

Add to `.env.local`.

---

## Service Responsibilities

```txt
removeBackground(imageUrl: string): Promise<Buffer>
```

Steps:

```txt
Fetch original image bytes
        ↓
POST to remove.bg API with image data
        ↓
Receive PNG buffer with transparent background
        ↓
Return PNG buffer
```

Return a raw `Buffer` containing the processed PNG.

Do not upload to Cloudinary from inside this service.

Keep the service focused on one thing: removing the background.

---

## Graceful Degradation

If `REMOVE_BG_API_KEY` is missing:

```txt
Log warning
Skip background removal
Return null
```

If remove.bg API call fails:

```txt
Log error
Skip background removal
Return null
```

Background removal failure must **never** crash the upload pipeline.

The garment will continue to exist with its original image.

---

## Types

Create `services/background-removal/types.ts`:

```ts
export interface BackgroundRemovalResult {
  processedBuffer: Buffer;
  mimeType: "image/png";
}
```

---

# Cloudinary Integration

After background removal succeeds, upload the processed image to Cloudinary.

Folder structure:

```txt
stylesync/wardrobe/{userId}/processed
```

Example:

```txt
stylesync/wardrobe/user_123/processed
```

Format:

```txt
PNG with transparent background
```

Use:

```ts
resource_type: "image"
format: "png"
```

Return the secure HTTPS URL of the processed image.

---

# Database Model

Update:

`prisma/models/garment.prisma`

Add fields:

```prisma
processedImageUrl  String?
bgRemovedAt        DateTime?
```

`processedImageUrl` stores the Cloudinary URL of the background-removed version.

`bgRemovedAt` records when the processing was completed.

A non-null `processedImageUrl` means background removal succeeded.

A null `processedImageUrl` means the garment is using the original raw image.

Do **not** rename or remove the existing `imageUrl` field.

The original image must always be preserved.

---

## Updated Garment Model

```prisma
model Garment {
  id              String    @id @default(cuid())

  userId          String

  imageUrl        String
  processedImageUrl String?
  bgRemovedAt     DateTime?

  name            String
  category        String

  notes           String?

  tags            String[]

  dominantColor   String?
  season          String?
  occasion        String?
  clothingType    String?

  subcategory      String?
  primaryColor     String?
  secondaryColor   String?
  style            String?
  material         String?
  confidence       Int?

  isFavorite      Boolean  @default(false)
  isProcessed     Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  outfitItems     OutfitGarment[]

  @@index([userId])
  @@index([createdAt])
}
```

---

# Upload Pipeline Integration

Update:

`app/api/upload/route.ts`

After the garment is saved to the database, trigger background removal as a fire-and-forget operation.

Follow the same fire-and-forget pattern used for classification.

Example structure:

```txt
Step 1: Upload to Cloudinary → imageUrl
Step 2: Save Garment to DB
Step 3: Return upload response to client   ← respond here
Step 4: [Background] removeBackground()
Step 5: [Background] Upload processed PNG to Cloudinary
Step 6: [Background] Update garment: processedImageUrl, bgRemovedAt
```

Steps 4–6 must not block step 3.

---

## Fire-and-Forget Pattern

```ts
// After garment is saved to DB and response returned:
if (process.env.REMOVE_BG_API_KEY) {
  removeBackground(imageUrl)
    .then(async (result) => {
      if (!result) return;
      // Upload processed PNG to Cloudinary
      // Update garment: processedImageUrl, bgRemovedAt
    })
    .catch((error) => {
      // Log error — do not propagate
    });
}
```

Never `await` background removal before responding.

---

# Manual Re-Process Endpoint

Create:

`POST /api/garments/[id]/remove-background`

Purpose:

Allow users to manually trigger background removal if it failed or was skipped.

---

## Requirements

* Clerk authentication required
* verify ownership: `garment.userId === userId`
* unauthorized → 401
* non-owner → 403
* not found → 404
* if `REMOVE_BG_API_KEY` missing → 503 with descriptive message

---

## Flow

```txt
POST /api/garments/[id]/remove-background
        ↓
Auth + Ownership Check
        ↓
Fetch Original Image
        ↓
Call remove.bg
        ↓
Upload Processed PNG to Cloudinary
        ↓
Update Garment: processedImageUrl, bgRemovedAt
        ↓
Return Updated Garment
```

This endpoint is **synchronous** — it waits for the full process before responding.

It is only called manually by the user; it does not need to be non-blocking.

---

## Response

Success:

```ts
{
  success: true,
  data: garment
}
```

Failure:

```ts
{
  success: false,
  error: string
}
```

---

# TypeScript Types

Update:

`types/index.ts`

Add fields to `Garment` interface:

```ts
processedImageUrl?: string | null;
bgRemovedAt?: string | null;
```

---

# Image Resolution Priority

When displaying garment images anywhere in the UI, follow this priority:

```txt
processedImageUrl (if set)
        ↓
imageUrl (original fallback)
```

Apply this rule consistently in:

* `GarmentCard`
* `GarmentDetailsDialog`
* `OutfitBuilderDialog`
* `OutfitCard`
* `HistoryDetailDialog`
* `TodaysRecommendations`

Create a shared utility if needed:

```ts
export function getDisplayImageUrl(garment: Garment): string {
  return garment.processedImageUrl ?? garment.imageUrl;
}
```

Place in `lib/utils.ts`.

---

# UI Processing State

## GarmentCard

When `processedImageUrl` is null and `bgRemovedAt` is null:

Show a subtle processing indicator on the card.

Requirements:

* small, unobtrusive badge or soft overlay
* editorial aesthetic — not alarming
* text: `"Processing…"` or a soft pulsing dot
* disappears automatically once `processedImageUrl` is set

When `processedImageUrl` is set:

Show the clean processed image.

No indicator.

---

## GarmentDetailsDialog

Add a section in the AI Stylist Insights area:

### Background Processing

When processing is complete:

```txt
Background removed
```

With the bgRemovedAt date.

When not yet processed:

```txt
Background processing pending
```

With a manual trigger button:

```txt
Remove Background
```

Button requirements:

* only visible when `processedImageUrl` is null
* calls `POST /api/garments/[id]/remove-background`
* shows loading state while processing
* updates dialog on success

---

# Environment Variables

Add to `.env.local`:

```env
REMOVE_BG_API_KEY=your_api_key
```

Add to `.env` (with empty placeholder):

```env
REMOVE_BG_API_KEY=
```

---

# Constraints

Do **not**:

* block the upload response waiting for background removal
* remove or overwrite the original `imageUrl`
* crash the upload pipeline on background removal failure
* call remove.bg from client-side code
* expose the `REMOVE_BG_API_KEY` to the frontend
* build queue infrastructure (BullMQ / Redis) in this unit
* build bulk reprocessing
* build progress tracking via websockets

---

# Migration

After updating `prisma/models/garment.prisma`:

Run:

```bash
npx prisma migrate dev --name add-background-removal-fields
```

Verify migration succeeds before implementing service logic.

---

# Future Compatibility

This system must later support:

```txt
Background Removal
        ↓
Queue-based Processing (BullMQ)
        ↓
Real-time Processing Status
        ↓
Batch Reprocessing
```

without schema rewrites.

Keep the service modular.

The fire-and-forget pattern used here should be directly replaceable by a queue job with no changes to the service itself.

---

# Check When Done

* `services/background-removal/remove-background.ts` exists
* `services/background-removal/types.ts` exists
* `REMOVE_BG_API_KEY` env var documented and checked
* `processedImageUrl` and `bgRemovedAt` added to Garment model
* Prisma migration runs successfully
* `types/index.ts` updated with new fields
* fire-and-forget triggers after upload
* upload response is never delayed by background removal
* remove.bg failure does not crash upload
* missing API key skips removal gracefully
* processed image uploaded to Cloudinary under `/processed` folder
* garment updated with `processedImageUrl` and `bgRemovedAt`
* `getDisplayImageUrl()` utility exists in `lib/utils.ts`
* `GarmentCard` uses processed image when available
* `OutfitCard` uses processed image when available
* `OutfitBuilderDialog` uses processed image when available
* `TodaysRecommendations` uses processed image when available
* `HistoryDetailDialog` uses processed image when available
* processing indicator shows on unprocessed garment cards
* `GarmentDetailsDialog` shows bg removal status
* manual "Remove Background" button works in `GarmentDetailsDialog`
* `POST /api/garments/[id]/remove-background` endpoint works
* ownership validation enforced on manual endpoint
* no TypeScript errors
* no lint errors
* `npm run build` passes
