# Look Book / Style Journal (F3)

We are implementing **Look Book (Style Journal)** for **StyleSync AI**.

This is the third Sprint 3 ("Expression") feature from the Phase 3 roadmap
(`context/feature-specs/Phase 3 specs.md`, F3) and the first to depend on
the durable job queue (F6 / spec 24) for upload reliability. F1 (Style DNA,
spec 25) and F2 (Capsule Audit, spec 26) are done; Ask the Stylist (spec 27)
shipped out-of-band. This spec supersedes the F3 section of the Phase 3
brief where the two disagree — see Technical Notes below.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

StyleSync already logs *what* was worn (`OutfitWear`, spec 12) but not
*how it actually looked or felt*. A user who wears an outfit today has no
way to attach a real photo of the look, note how confident it felt, or rate
it — the wear log is a timestamp, not a memory. Look Book turns individual
wear moments into a scrollable visual journal, and the `isShareable` flag on
each entry is the seed for the Community Feed (F5, future spec).

---

# Scope

Build:

### `LookBookEntry` Prisma model
### `POST /api/lookbook`, `GET /api/lookbook`, `GET /api/lookbook/[id]`, `PATCH /api/lookbook/[id]`, `DELETE /api/lookbook/[id]`
### Photo upload via the existing Cloudinary pipeline, new folder `stylesync/lookbook/{userId}`
### "Add to Look Book" action on outfit cards in the History view
### `/lookbook` route — infinite-scroll journal grid with month/mood/rating/occasion filters
### `/lookbook/[id]` — single-entry detail view

Do **not** build:

* Publishing/sharing UI — `isShareable` is stored but has no consumer until F5 (Community Feed) exists; no "share" button renders in this spec
* Client-side image compositing (that is F4, Flat Lay Builder) — Look Book photos are direct camera/gallery uploads, not canvas compositions
* Editing the linked outfit itself from the Look Book UI — the linked outfit opens in the existing outfit detail flow (read-only reference)
* A durable-queue worker for Look Book photo processing — uploads are small, user-initiated, single-image, and complete synchronously in the request (no background removal or AI step is run on Look Book photos)

---

# New Dependencies

None. Reuses the existing Cloudinary SDK/config (`backend/src/lib/cloudinary.ts`)
and the existing `withRetry` helper if any transient upload failures need
retrying inline.

---

# Database Changes

Create `backend/prisma/models/look-book.prisma`:

```prisma
model LookBookEntry {
  id          String   @id @default(cuid())
  userId      String

  outfitId    String?
  outfit      Outfit?  @relation(fields: [outfitId], references: [id], onDelete: SetNull)

  photoUrl    String
  date        DateTime
  rating      Int      // 1–5, validated in Zod, not a DB constraint
  mood        String[] // validated against MOOD_TAGS server-side
  notes       String?
  isShareable Boolean  @default(false)

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([userId, date])
}
```

Add the reverse relation to `Outfit` in `backend/prisma/models/outfit.prisma`:

```prisma
lookBookEntries LookBookEntry[]
```

`onDelete: SetNull` on `outfitId` — deleting an outfit must not delete the
user's journal entry/photo; the entry becomes unlinked instead (renders
without the "linked outfit" affordance).

Run `prisma db push` and regenerate the client, per the pattern in every
prior schema-changing unit (23–26).

---

# Mood Tags

Fixed, server-validated enum — not user-extensible in v1:

```ts
export const MOOD_TAGS = [
  "Confident",
  "Comfortable",
  "Underdressed",
  "Overdressed",
  "Effortless",
  "Bold",
  "Casual",
] as const;
export type MoodTag = (typeof MOOD_TAGS)[number];
```

Define this once in `backend/src/types/index.ts` (same pattern as
`OCCASIONS`/`Occasion` in spec 17) and export it — the frontend imports it
from `@style-sync/backend/types` rather than re-declaring the list.

---

# Zod Schemas

Add to `frontend/lib/schemas.ts`:

```ts
export const CreateLookBookEntrySchema = z.object({
  outfitId:    CuidSchema.optional().nullable(),
  photoUrl:    z.string().url(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  rating:      z.number().int().min(1).max(5),
  mood:        z.array(z.enum(MOOD_TAGS)).max(MOOD_TAGS.length),
  notes:       z.string().max(500).optional(),
  isShareable: z.boolean().optional(),
});

export const UpdateLookBookEntrySchema = CreateLookBookEntrySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const LookBookQuerySchema = z.object({
  cursor:   z.string().optional(),        // LookBookEntry id
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  month:    z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM
  mood:     z.enum(MOOD_TAGS).optional(),
  rating:   z.coerce.number().int().min(1).max(5).optional(),
  occasion: z.string().optional(), // matches linked outfit's occasion
});
```

Photo upload is a **separate** request from entry creation (see API section)
— `photoUrl` above is the Cloudinary URL returned by that first call, same
two-step pattern already used for garment uploads (`POST /api/upload` then
garment record creation) is *not* followed here; instead Look Book reuses
a single combined multipart endpoint (see below) to avoid an orphaned-photo
state if the client abandons the flow between steps.

---

# API Routes

## `POST /api/lookbook`

Create `frontend/app/api/lookbook/route.ts`. Accepts `multipart/form-data`
(photo file + metadata fields), mirroring `POST /api/upload`'s existing
multipart parsing — not JSON, since a file is involved.

1. Auth via Clerk; 401 if unauthenticated.
2. Validate metadata fields against `CreateLookBookEntrySchema` (photo file
   validated separately: type/size check, same limits as `POST /api/upload`).
3. If `outfitId` is provided, verify it belongs to `userId` (404 otherwise).
4. Upload the photo to Cloudinary, folder `stylesync/lookbook/{userId}`
   (mirrors `stylesync/wardrobe/{userId}` from `POST /api/upload`).
5. Create the `LookBookEntry` row.
6. Return the created entry (`201`).

## `GET /api/lookbook`

Cursor-paginated list, validated with `LookBookQuerySchema`. Cursor is
`(date, id)` composite, same pattern as the Community Feed's planned
cursor design in the Phase 3 brief (F5) and consistent with `id`-based
cursors already used elsewhere in the codebase. Sorted by `date` descending.
Filters (`month`, `mood`, `rating`, `occasion`) are applied as Prisma
`where` clauses; `occasion` filters via `outfit: { occasion: ... } }`.

## `GET /api/lookbook/[id]`

Ownership-checked single-entry fetch, `include: { outfit: { include: { garments: { include: { garment: true } } } } }` so the linked outfit's garments render without a second round-trip.

## `PATCH /api/lookbook/[id]`

`UpdateLookBookEntrySchema`; ownership check; does not accept photo
replacement in v1 (delete and recreate the entry to change the photo —
matches the "no re-upload" simplicity of the outfit `PATCH` route, which
also doesn't replace garment images).

## `DELETE /api/lookbook/[id]`

Ownership check; deletes the Cloudinary asset (same pattern as
`DELETE /api/garments/[id]`) then the DB row.

---

# Frontend

## "Add to Look Book" action

Add a button/menu item on outfit cards in the History view
(`frontend/app/history/page.tsx` / `<HistoryDetailDialog />`) that opens a
new `<AddToLookBookDialog />` (built on the existing `<EditorialDialog />`
primitive — no new dialog component). Pre-fills `outfitId` and `date` from
the wear record being viewed. Form fields: photo picker (drag-and-drop,
reusing the existing upload-dialog's drop-zone styling), mood multi-select
chips (`MOOD_TAGS`), 1–5 star rating control, notes textarea.

## `/lookbook` page

`frontend/app/lookbook/page.tsx` — infinite-scroll grid (reuse the
`WardrobeGrid`/`OutfitGrid` responsive column pattern: 3–5 desktop, 2–3
tablet, 1–2 mobile). Each card: photo, outfit name (if linked), date, star
rating, mood chips. Filter bar above the grid: month picker, mood pills,
rating pills, occasion pills (reusing the existing occasion-pill styling
from `TodaysRecommendations`). Uses `useInfiniteQuery` (TanStack Query) with
`QK.lookBook(filters)` — new query key entry in `frontend/lib/query-keys.ts`.

## `/lookbook/[id]` page

`frontend/app/lookbook/[id]/page.tsx` — full photo, all metadata, and a
"View linked outfit" link back to the outfit (opens the existing outfit
detail flow — no new component). Renders a "not linked to an outfit" state
when `outfitId` is null.

## Hooks

`frontend/lib/hooks/use-lookbook.ts` — `useLookBookEntries(filters)`
(`useInfiniteQuery`), `useLookBookEntry(id)` (`useQuery`),
`useCreateLookBookEntry()`, `useUpdateLookBookEntry()`,
`useDeleteLookBookEntry()` (mutations), following the exact hook-file
pattern established in spec 21 (one file per resource, colocated
query + mutation hooks).

## Navigation

Add a "Look Book" link to `EditorNavbar`'s `navItems` array
(`frontend/components/editor/editor-navbar.tsx`), same pattern as the
existing "Style DNA" entry.

---

# Technical Notes — Deviations from the Phase 3 Brief

* The original F3 brief in `Phase 3 specs.md` describes photo upload and
  entry metadata as implicitly one step. This spec makes it explicit: one
  `multipart/form-data` `POST /api/lookbook` call does both, to avoid an
  orphaned Cloudinary asset if the client abandons a two-step flow midway.
* The brief's mood list is adopted as-is (`Confident`, `Comfortable`,
  `Underdressed`, `Overdressed`, `Effortless`, `Bold`, `Casual`) — kept as a
  fixed backend-exported constant rather than a free-text `String[]`, for
  the same reason `Occasion` is a closed enum (spec 17): validated filtering
  requires known values.
* No `Recommendation`-style scoring is involved — Look Book is a journal,
  not a ranking surface.

---

# Backend Exports

Add to `backend/src/index.ts` (or `backend/src/types/index.ts` for the
type-only export):

```ts
export const MOOD_TAGS = [...] as const;
export type MoodTag = (typeof MOOD_TAGS)[number];
```

No new service functions are required beyond the Prisma-backed route
handlers — this feature does not need a dedicated `backend/src/services/lookbook/`
module since there is no scoring/AI computation, only CRUD (consistent with
how `LookBookEntry` in the original brief also specified no service layer).

---

# Files to Create

```txt
backend/prisma/models/look-book.prisma
frontend/app/api/lookbook/route.ts
frontend/app/api/lookbook/[id]/route.ts
frontend/app/lookbook/page.tsx
frontend/app/lookbook/[id]/page.tsx
frontend/lib/hooks/use-lookbook.ts
frontend/components/lookbook/add-to-lookbook-dialog.tsx
frontend/components/lookbook/lookbook-card.tsx
```

# Files to Modify

```txt
backend/prisma/models/outfit.prisma
  — add lookBookEntries LookBookEntry[] reverse relation
backend/src/types/index.ts
  — add MOOD_TAGS constant, MoodTag type
frontend/lib/schemas.ts
  — add CreateLookBookEntrySchema, UpdateLookBookEntrySchema, LookBookQuerySchema
frontend/lib/query-keys.ts
  — add QK.lookBook(filters), QK.lookBookEntry(id)
frontend/components/editor/editor-navbar.tsx
  — add "Look Book" nav item
frontend/app/history/page.tsx (and/or history-detail-dialog.tsx)
  — add "Add to Look Book" action on wear records
```

---

# Constraints

Do **not**:

* Build any sharing/publishing UI — `isShareable` is a stored flag only, unconsumed until F5 exists
* Add a durable-queue job for Look Book photo uploads — this is a synchronous, user-initiated, single-image upload, not a batch/background process
* Allow deleting an outfit to cascade-delete its Look Book entries — must be `SetNull`, entries are the user's memories, not outfit metadata
* Add a new `Occasion`-like field on `LookBookEntry` — occasion filtering reads through the linked `outfit.occasion`, no duplicate field
* Make `mood` a free-text field — must validate against `MOOD_TAGS`

---

# Check When Done

* `LookBookEntry` model exists; `prisma db push` succeeds; reverse relation on `Outfit` resolves
* `POST /api/lookbook` accepts multipart data, uploads to `stylesync/lookbook/{userId}`, creates one row per call, rejects an `outfitId` not owned by the caller (404)
* `GET /api/lookbook` cursor-paginates correctly and honors `month`/`mood`/`rating`/`occasion` filters independently and combined
* `DELETE /api/lookbook/[id]` removes both the Cloudinary asset and the DB row
* Deleting the linked `Outfit` leaves the `LookBookEntry` intact with `outfitId: null`
* "Add to Look Book" action is reachable from a wear record in the History view
* `/lookbook` infinite-scrolls, filters work, `/lookbook/[id]` renders full detail and links back to the outfit when present
* `npx tsc --noEmit` — zero errors (backend and frontend)
* `npm run build` passes
* No lint errors
