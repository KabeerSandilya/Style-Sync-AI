# AI Outfit Generator

We are implementing the **AI Outfit Generator** for **StyleSync AI**.

This feature solves the core cold-start problem: users who have uploaded garments
but have not yet built any outfits receive no recommendations. The generator
analyses the user's classified wardrobe metadata and uses Gemini to assemble
coherent outfit combinations, which are saved as regular Outfit records and
immediately feed into the recommendation engine.

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`

---

# Problem Being Solved

The recommendation engine only ranks **saved outfits**.

A user who has just uploaded 15 garments sees:

```txt
No outfits yet.
Build your first look to unlock daily recommendations.
```

They must manually drag-drop garments into the outfit builder before the
product becomes useful. This is high friction and defeats the "AI-powered
stylist" premise.

The generator eliminates that barrier entirely.

---

# Scope

Build:

### Outfit Generation Service

### Generation API Endpoint

### Generation UI — Dashboard CTA (cold-start)

### Generation UI — Wardrobe Studio Button

### Loading & Result States

### AI-Generated Badge on Outfit Cards

Do **not** build:

* image-based outfit collage generation
* avatar rendering
* social sharing of generated outfits
* scheduled / automatic background generation
* outfit embeddings or vector similarity
* LLM chat interface

Generated outfits are regular `Outfit` records. The generator is just the
creation path.

---

# Trigger Conditions

The generator can be invoked in two ways:

### 1. Cold-Start CTA (dashboard)

When the `GET /api/recommendations` response returns:

```json
{ "coldStartReason": "no_outfits" }
```

Show a prominent **"Generate Looks"** button alongside the existing
"Build First Outfit" button.

### 2. On-Demand (wardrobe studio)

A **"Generate Looks"** button always present in the Saved Outfits tab of
the wardrobe studio, so users can refresh their generated outfits at any time.

---

# Preconditions

Generation requires:

```txt
Classified garments ≥ 3
```

A garment is classified when:

```txt
isProcessed = true
```

If fewer than 3 classified garments exist, show a message instead of running:

```txt
Classify at least 3 garments first to generate outfits.
Run AI Classification from the garment details panel.
```

Do not silently skip garments. The user must understand why generation is
blocked.

---

# Generation Flow

```txt
User clicks "Generate Looks"
          ↓
Fetch user's classified garments (isProcessed = true)
          ↓
Fewer than 3? → Return error, show guidance
          ↓
Build garment metadata payload
          ↓
Call Gemini 2.5 Flash
          ↓
Parse & validate JSON response
          ↓
Filter out combinations that duplicate existing outfits
          ↓
Save valid outfits to database (Outfit + OutfitGarment records)
          ↓
Return generated outfits
          ↓
UI displays results immediately
```

---

# Gemini Integration

Use:

**Gemini 2.5 Flash**

This is a metadata-only call — no images are sent. The model reasons over
structured garment descriptions, which is fast and cheap.

Do **not** send images.

Do **not** use vision features.

---

## Garment Payload Sent to Gemini

For each classified garment, send:

```ts
{
  id: string           // kept for referencing in the response
  name: string
  category: string     // "Topwear" | "Bottomwear" | "Outerwear" | ...
  subcategory: string  // "Oxford Shirt" | "Cargo Pants" | ...
  primaryColor: string
  style: string        // "Casual" | "Formal" | "Streetwear" | ...
  season: string       // "Summer" | "Winter" | "All Season" | ...
  material: string
}
```

Omit: `imageUrl`, `processedImageUrl`, `userId`, `createdAt`, timestamps.

---

## Expected Gemini Response

Gemini must return strict JSON only. No markdown. No prose.

```json
{
  "outfits": [
    {
      "name": "string",
      "garmentIds": ["id1", "id2", "id3"],
      "reason": "string"
    }
  ]
}
```

Field rules:

* `name` — short editorial outfit name, 2–5 words, e.g. `"Weekend Linen Set"`, `"Navy Office Look"`, `"Relaxed Street Edit"`
* `garmentIds` — 2 to 5 garment IDs from the provided list; must reference IDs that were sent
* `reason` — one sentence explaining why these pieces work together; used as the outfit's `notes` field

Target: **6–8 outfit combinations** per generation run.

---

# Outfit Generation Service

Create:

```txt
services/outfit-generation/
  generate-outfits.ts
  prompts.ts
  types.ts
```

---

## types.ts

```ts
export interface GarmentInput {
  id: string
  name: string
  category: string
  subcategory: string | null
  primaryColor: string | null
  style: string | null
  season: string | null
  material: string | null
}

export interface GeneratedOutfit {
  name: string
  garmentIds: string[]
  reason: string
}

export interface GenerationResult {
  outfits: GeneratedOutfit[]
}
```

---

## prompts.ts

The system prompt must instruct Gemini to:

1. Act as a professional fashion stylist
2. Create complete, wearable outfit combinations
3. Respect fashion rules:
   - Tops pair with bottoms or full outfits
   - Match seasons across pieces
   - Coordinate colors (complementary, neutral-base, tonal)
   - Match style registers (do not pair Formal with Streetwear)
   - Include footwear and accessories when available
4. Avoid repeating the same garments across too many outfits
5. Return exactly the specified JSON schema with no other text

The prompt must include the garment list as a JSON array.

---

## generate-outfits.ts

Responsibilities:

* build the prompt with the garment payload
* call Gemini
* extract and parse JSON from the response
* validate garment IDs in the response against the input list
* reject combinations with fewer than 2 or more than 5 pieces
* return `GenerationResult`

No database access inside this service.

No API logic inside this service.

---

# Duplicate Detection

Before saving, compare each generated outfit against the user's existing outfits.

An outfit is a duplicate if its set of garment IDs exactly matches an existing outfit's garment IDs (order-independent).

Discard duplicates silently.

---

# Database Changes

Extend the `Outfit` model:

```prisma
model Outfit {
  ...
  isAiGenerated  Boolean  @default(false)
}
```

Purpose:

* display "AI Generated" badge in the UI
* allow future bulk-delete of AI outfits
* distinguish in analytics

Existing Outfit records default to `false` — no migration data change needed.

---

# API Endpoint

Create:

```txt
POST /api/outfits/generate
```

---

## Authentication

Clerk authentication required.

Unauthorized → `401`

---

## Rate Limiting

Use the existing `isRateLimited()` utility.

Limit: **1 request per 60 seconds per user.**

Rate limited → `429`

```json
{
  "success": false,
  "error": "Please wait before generating again."
}
```

---

## Request

No body required.

The endpoint fetches the user's wardrobe internally.

---

## Logic

```txt
1. Authenticate user
2. Check rate limit
3. Fetch classified garments (isProcessed = true) for user
4. Return 400 if fewer than 3 classified garments
5. Build garment payload
6. Call generateOutfits() service
7. Validate and filter duplicates
8. Save each valid outfit via prisma.outfit.create (with isAiGenerated: true)
9. Return saved outfits
```

Wrap the Gemini call in `withRetry()` (existing utility, up to 3 attempts).

---

## Response

Success:

```ts
{
  success: true,
  data: Outfit[]   // full outfit objects including garments
}
```

Insufficient garments:

```ts
{
  success: false,
  error: "not_enough_garments",
  classifiedCount: number
}
```

Failure:

```ts
{
  success: false,
  error: "string"
}
```

---

# UI

---

## Dashboard Cold-Start CTA

Location: `components/recommendation/todays-recommendations.tsx`

When `coldStartReason === "no_outfits"`, extend the existing empty state card to offer **two actions side by side**:

```txt
[  Build Outfit  ]   [  Generate Looks  ]
```

"Generate Looks" button:

* calls `POST /api/outfits/generate`
* shows an inline loading state while generating
* on success, triggers a recommendations refresh so generated outfits appear immediately
* on `not_enough_garments` error, shows inline guidance linking to the wardrobe studio

---

## Wardrobe Studio Button

Location: `app/editor/wardrobe/page.tsx` — within the Saved Outfits view

Place a **"Generate Looks"** button in the outfit grid header area.

Button states:

| State | Label |
|---|---|
| Idle | "Generate Looks" + Sparkles icon |
| Loading | "Generating…" + spinner |
| Success | Button re-enables after outfit grid refreshes |
| Rate limited | Button disabled with tooltip "Wait before regenerating" |
| Not enough garments | Button disabled with tooltip text |

---

## Loading State

While `POST /api/outfits/generate` is in-flight:

Show an editorial loading message in place of the button area:

```txt
Assembling your looks…
```

Below the message, show 3 skeleton outfit card placeholders (matching the
existing `OutfitGrid` skeleton pattern).

Duration is typically 3–8 seconds.

---

## Generated Outfits Result

On success, the outfit grid refreshes automatically.

Newly generated outfits display an **"AI Generated"** badge:

* small pill badge on the `OutfitCard`
* uses the existing `Sparkles` icon
* styled with `bg-primary/10 text-primary border border-primary/20`
* positioned at the bottom of the collage area

The badge disappears if the user manually edits the outfit name or garments
(or can be left permanent — implementation decision at build time).

---

## AI-Generated Badge on OutfitCard

Update `components/editor/outfit-card.tsx`.

When `outfit.isAiGenerated === true`:

Show a small badge overlay on the collage:

```txt
✦ AI
```

Using Sparkles icon + "AI" label.

Style: subtle, premium, non-intrusive.

---

# Outfit Naming Convention

Gemini generates the name. The name is saved directly as the outfit `name` field.

The `reason` field from Gemini is saved as the outfit `notes` field.

Both can be edited by the user after generation like any other outfit.

---

# Error Handling

| Scenario | Behavior |
|---|---|
| Gemini API fails after retries | Return `500`, show retry button in UI |
| Gemini returns malformed JSON | Retry once with explicit format reminder in prompt; if still broken, return `500` |
| All generated outfits are duplicates | Return `200` with empty array and message `"All generated looks already exist in your wardrobe."` |
| GEMINI_API_KEY not set | Return `503` with `"AI service not configured."` |

---

# Constraints

Do **not**:

* generate from unclassified garments (`isProcessed = false`)
* block the HTTP response waiting for Gemini — the endpoint is synchronous but must respond within 30 seconds
* auto-trigger generation silently in the background
* expose the Gemini API key to the client
* store raw Gemini response text in the database
* overwrite or delete existing user-created outfits

Generated outfits are regular `Outfit` records.

Users can edit, delete, and favorite them like any other outfit.

---

# Future Compatibility

This system must later support:

```txt
Occasion-aware generation
```

e.g. "Generate outfits for work", "Generate party looks"

Design the prompt and service to accept an optional `occasion` parameter
without requiring a rewrite.

---

# Environment Variables

No new variables required.

Uses existing:

```env
GEMINI_API_KEY=...
```

---

# Files to Create

```txt
services/outfit-generation/generate-outfits.ts
services/outfit-generation/prompts.ts
services/outfit-generation/types.ts
app/api/outfits/generate/route.ts
```

---

# Files to Modify

```txt
prisma/models/outfit.prisma              — add isAiGenerated field
types/index.ts                           — add isAiGenerated to Outfit interface
components/editor/outfit-card.tsx        — add AI Generated badge
components/recommendation/todays-recommendations.tsx  — extend cold-start CTA
app/editor/wardrobe/page.tsx             — add Generate Looks button to outfit view
```

---

# Check When Done

* `POST /api/outfits/generate` exists and is authenticated
* rate limiting works (1 req / 60s per user)
* fewer than 3 classified garments returns `400` with `not_enough_garments`
* Gemini service exists in `services/outfit-generation/`
* prompt produces correct JSON schema
* garment IDs in response are validated against input
* duplicate outfits are filtered before saving
* generated outfits have `isAiGenerated: true`
* outfit `notes` field is populated from the `reason` field
* outfit grid refreshes after generation
* AI Generated badge visible on outfit cards
* cold-start dashboard CTA shows "Generate Looks" button
* wardrobe studio shows "Generate Looks" button in outfit tab
* loading state displays during generation
* error states handled (Gemini failure, duplicates, insufficient garments)
* no TypeScript errors
* no lint errors
* `npm run build` passes
* `npm test` passes
