# Garment Upload & Digital Wardrobe Storage

We are implementing the **Garment Upload & Digital Wardrobe Storage system** for **StyleSync AI**.

This feature enables users to digitize their physical wardrobe by uploading clothing photos, securely storing them in Cloudinary, and saving garment metadata to PostgreSQL for future outfit recommendations and AI classification. Additionally, a garment can be deleted at any time; this function is also important and must clean up database records (including outfit associations) and the stored image on Cloudinary.

The implementation must follow:

* `ui-context.md`
* `globals.css`
* `code-standards.md`
* `architecture.md`

The experience should feel:

**premium, editorial, calm, and fashion-first.**

No generic dashboard upload flows.

---

## Technical Stack & Storage

The upload system uses:

### Frontend

* Next.js App Router
* Client Components for drag/drop + preview handling

### Backend

* Next.js Route Handlers

### Storage

* Cloudinary

### Database

* Prisma + PostgreSQL

### Authentication

* Clerk

---

## Dependencies

Install:

```bash
npm install cloudinary
```

---

## Environment Variables

Add to:

`.env.local`

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Rules

* Never expose `CLOUDINARY_API_SECRET` to the client.
* Uploads must always be authenticated server-side.
* Never use unsigned uploads.

---

# Cloudinary Configuration

Create:

`lib/cloudinary.ts`

Requirements:

* initialize Cloudinary using server-side env vars
* export reusable configured client
* fail safely when env vars are missing

Folder structure:

```txt
stylesync/wardrobe/{userId}
```

Example:

```txt
stylesync/wardrobe/user_123
```

Why:

* easier moderation
* better cleanup
* future analytics
* ownership separation

---

# Database Model

Update Prisma schema:

```prisma
model Garment {
  id              String   @id @default(cuid())

  userId          String
  imageUrl        String

  name            String
  category        String

  notes           String?

  tags            String[]

  dominantColor   String?
  season           String?
  occasion         String?
  clothingType     String?

  isProcessed      Boolean  @default(false)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
}
```

### Field Defaults

When first uploaded:

```txt
name = "New Garment"
category = "Uncategorized"
tags = []
isProcessed = false
```

Future AI processing will enrich metadata.

Examples:

```txt
hoodie
casual
winter
black
streetwear
```

---

# Upload Flow

The upload pipeline must follow this exact flow:

```txt
User selects image
        ↓
Client validates file
        ↓
Preview shown
        ↓
POST /api/upload
        ↓
Server validates Clerk auth
        ↓
Server validates mime type + size
        ↓
Upload to Cloudinary
        ↓
Create Garment DB record
        ↓
Return garment response
        ↓
Refresh wardrobe state
        ↓
Success toast
```

No deviations.

---

# Upload API

Create:

`app/api/upload/route.ts`

## Requirements

### Authentication

Enforce Clerk authentication before processing uploads.

Unauthenticated users:

```ts
401 Unauthorized
```

---

### Accepted Input

Accept:

`multipart/form-data`

Fields:

```txt
file
notes (optional)
```

---

### Validation

#### File Type

Allow only:

* PNG
* JPG / JPEG
* WEBP

Reject everything else.

---

#### File Size

Maximum:

```txt
10MB
```

Reject oversized uploads.

---

### Server Validation Rules

Server validation is mandatory even if client validation exists.

Never trust client input.

Requirements:

* validate mime type
* validate file size
* validate authenticated user
* gracefully handle malformed requests

---

### Cloudinary Upload

Upload to:

```txt
stylesync/wardrobe/{userId}
```

Use:

* secure HTTPS URLs
* optimized asset delivery

Never expose internal Cloudinary metadata to frontend.

---

### Database Persistence

Create new `Garment` record.

Requirements:

* map `userId` to Clerk user ID
* save Cloudinary secure URL
* persist notes
* apply default metadata values

---

### Response Shape

Follow project API conventions.

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

Never expose raw exceptions.

Bad:

```txt
CloudinaryError: invalid signature
```

Good:

```txt
Upload failed. Please try again.
```

---

# Wardrobe Retrieval API

Create:

`app/api/garments/route.ts`

Purpose:

Fetch authenticated user wardrobe.

## Requirements

* Clerk authentication required
* return garments belonging only to current user
* order by newest first
* future filtering compatible

Order:

```txt
createdAt DESC
```

Prepare response shape for:

* categories
* search
* filters
* favorites
* tags

No pagination required for MVP, but structure should remain pagination-ready.

---

# Upload Dialog Component

Create:

`components/editor/upload-garment-dialog.tsx`

Do **not** place upload logic directly inside:

`app/editor/page.tsx`

The editor page should remain thin.

The dialog is responsible for:

* file selection
* drag/drop
* preview
* notes
* upload state
* success/error handling

---

## Visual Requirements

Must follow:

`ui-context.md`

Aesthetic:

* warm editorial UI
* premium wardrobe feel
* sand/cream surfaces
* sage accents
* elegant spacing
* rounded premium surfaces

---

### Drag & Drop Zone

Requirements:

* editorial dashed-border aesthetic
* click-to-upload fallback
* drag state feedback
* subtle motion
* warm hover treatment

Must feel intentional and premium.

Avoid generic upload boxes.

---

### Image Preview

After selection:

Show:

* image preview
* remove button

Remove action resets upload state.

---

### Notes Input

Use:

`Textarea`

Requirements:

* optional field
* character limit
* elegant focus state
* premium styling

Placeholder tone:

> Add optional notes about fit, fabric, or styling…

---

### Helper Text

Display:

```txt
PNG, JPG, WEBP — up to 10MB
```

Muted styling.

Non-intrusive.

---

# Interactive States

## Hover State

Drag zone:

* soft highlight
* sage border emphasis
* subtle icon scaling
* elegant transitions

No aggressive animations.

---

## Loading State

During upload:

* disable submit
* disable remove image
* disable close dialog
* disable drag/drop
* disable textarea

Show:

* premium loading micro-animation
* subtle pulse or spinning sage indicator

No harsh spinners.

---

## Success State

On success:

1. close dialog
2. refresh wardrobe state
3. refresh sidebar list
4. show subtle toast

No page reloads.

No:

```ts
window.location.reload()
```

---

## Error State

On failure:

Requirements:

* preserve selected image
* preserve notes
* allow retry
* show elegant inline or toast feedback

Tone:

Bad:

> Upload failed: Cloudinary 403

Good:

> Upload failed. Please try again.

---

# State Management

Wardrobe refresh must happen:

**without full-page refresh**

Requirements:

* server refresh pattern OR query invalidation
* automatic sidebar update after upload
* optimistic UI optional

No hacky refresh patterns.

---

# Constraints

Do **not**:

* upload directly to Cloudinary from frontend
* use unsigned uploads
* expose Cloudinary secrets
* store base64 image blobs in PostgreSQL
* block UI rendering
* place upload logic inside `editor/page.tsx`
* expose raw server exceptions
* reload the page after upload

---

# Check When Done

* Cloudinary initialized server-side
* env vars used correctly
* `/api/upload` protected with Clerk auth
* image mime validation enforced
* 10MB size limit enforced
* image uploaded successfully to Cloudinary
* secure HTTPS image URL returned
* `Garment` saved to PostgreSQL
* correct Clerk `userId` attached
* `/api/garments` returns authenticated wardrobe
* drag/drop works
* click upload works
* preview appears before submission
* upload loading state disables controls
* elegant loading micro-animations exist
* sidebar updates automatically
* success toast appears
* graceful failure handling works
* no TypeScript errors
* no lint errors
* `npm run build` passes
