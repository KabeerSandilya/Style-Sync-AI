# Style DNA Profile (F1)

We are implementing **Style DNA Profile** for **StyleSync AI**.

This feature generates an AI-authored style identity card for the user —
synthesized from their classified wardrobe, outfit history, and preference
profile. It is the first Sprint 2 intelligence feature and the primary
consumer of the Redis Style DNA cache helpers created in F7 (spec 23).

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

StyleSync currently tells users _what_ to wear today. It does not tell them
_who they are as a dresser_. After a user has classified 10+ garments and built
outfits, there is enough signal to synthesize a coherent style identity — an
archetype, a color story, signature pieces, and an editorial narrative — but
no surface currently derives or presents it.

Style DNA fills that gap: one page, generated on demand, that reflects the
user back as a fashion editor would describe them.

---

# Scope

Build:

### Wardrobe summary aggregation service (`backend/src/services/style-dna/summarize.ts`)
### Gemini style DNA generation function (`backend/src/services/style-dna/generate.ts`)
### Export both from `@style-sync/backend`
### `GET /api/style-dna` — fetch the user's latest persisted Style DNA
### `POST /api/style-dna` — generate (or regenerate) the user's Style DNA
### `/style-dna` frontend page — editorial card UI
### Wire the Style DNA cache helpers (already created in spec 23)

Do **not** build:

* Automatic regeneration on wardrobe change — manual, on-demand only in v1
* A "Style DNA history" timeline — only the latest result is kept
* Outfit suggestions derived from the DNA — that is the recommendation engine
* Email or push notifications when DNA is ready
* Sharing the DNA card publicly (that belongs in F5)

---

# New Dependencies

None beyond what was installed in F7 (spec 23). The Gemini client is already
exported from `@style-sync/backend`. Upstash Redis helpers are already in
place.

---

# Database Changes

Add one new model to `prisma/schema.prisma`:

```prisma
model StyleDNA {
  id                String   @id @default(cuid())
  userId            String   @unique
  archetype         String
  colorStory        Json     // { colors: string[], narrative: string }
  signaturePieces   String[] // garment IDs from the user's own wardrobe
  styleKeywords     String[]
  styleNarrative    String
  wardrobeStrengths String[]
  blindSpots        String[]
  generatedAt       DateTime @default(now())

  @@index([userId])
}
```

Run `npx prisma generate` after adding the model. A migration is required
before deploying (`npx prisma migrate dev --name add-style-dna`).

---

# Wardrobe Summary Aggregation

Create `backend/src/services/style-dna/summarize.ts`.

This function queries the database and returns a compact, token-efficient
summary — **no images are sent to Gemini**, only structured metadata.

```ts
import { prisma } from '../../lib/prisma'

export interface WardrobeSummary {
  totalGarments: number
  categoryCounts: Record<string, number>        // e.g. { tops: 12, trousers: 8 }
  topColors: string[]                           // top 8 most frequent primaryColor values
  topStyles: string[]                           // top 5 most frequent style values
  seasonBreakdown: Record<string, number>       // e.g. { all: 10, summer: 6, winter: 4 }
  mostWornOutfits: Array<{
    outfitId: string
    name: string
    wearCount: number
    garmentCategories: string[]
  }>
  dislikedPatterns: Array<{
    category: string
    style: string
    dislikeCount: number
  }>
  preferredOccasions: string[]                  // top 3 occasions from feedback
}

export async function buildWardrobeSummary(userId: string): Promise<WardrobeSummary> {
  const [garments, outfitWears, feedback] = await Promise.all([
    prisma.garment.findMany({
      where: { userId, isProcessed: true },
      select: {
        id: true,
        category: true,
        primaryColor: true,
        style: true,
        season: true,
      },
    }),
    prisma.outfitWear.findMany({
      where: { outfit: { userId } },
      include: {
        outfit: {
          include: {
            garments: { include: { garment: { select: { category: true } } } },
          },
        },
      },
      orderBy: { wornAt: 'desc' },
      take: 50,
    }),
    prisma.recommendationFeedback.findMany({
      where: { userId },
      include: {
        recommendation: {
          include: {
            outfit: {
              include: {
                garments: { include: { garment: { select: { category: true, style: true } } } },
              },
            },
          },
        },
      },
    }),
  ])

  const categoryCounts: Record<string, number> = {}
  const colorFreq: Record<string, number> = {}
  const styleFreq: Record<string, number> = {}
  const seasonFreq: Record<string, number> = {}

  for (const g of garments) {
    categoryCounts[g.category ?? 'unknown'] = (categoryCounts[g.category ?? 'unknown'] ?? 0) + 1
    if (g.primaryColor) colorFreq[g.primaryColor] = (colorFreq[g.primaryColor] ?? 0) + 1
    if (g.style) styleFreq[g.style] = (styleFreq[g.style] ?? 0) + 1
    if (g.season) seasonFreq[g.season] = (seasonFreq[g.season] ?? 0) + 1
  }

  const topColors = Object.entries(colorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c)

  const topStyles = Object.entries(styleFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s)

  // Aggregate wear counts per outfit
  const wearCountMap: Record<string, number> = {}
  for (const w of outfitWears) {
    wearCountMap[w.outfitId] = (wearCountMap[w.outfitId] ?? 0) + 1
  }

  const mostWornOutfits = Object.entries(wearCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([outfitId, wearCount]) => {
      const wear = outfitWears.find(w => w.outfitId === outfitId)!
      return {
        outfitId,
        name: wear.outfit.name ?? 'Untitled',
        wearCount,
        garmentCategories: wear.outfit.garments.map(g => g.garment.category ?? 'unknown'),
      }
    })

  // Derive disliked patterns from negative feedback (score < 0)
  const dislikedMap: Record<string, { category: string; style: string; count: number }> = {}
  for (const fb of feedback) {
    if (fb.score >= 0) continue
    for (const og of fb.recommendation.outfit.garments) {
      const key = `${og.garment.category}:${og.garment.style}`
      if (!dislikedMap[key]) {
        dislikedMap[key] = { category: og.garment.category ?? '', style: og.garment.style ?? '', count: 0 }
      }
      dislikedMap[key].count += 1
    }
  }

  const dislikedPatterns = Object.values(dislikedMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(d => ({ category: d.category, style: d.style, dislikeCount: d.count }))

  // Derive preferred occasions from positive feedback
  const occasionFreq: Record<string, number> = {}
  for (const fb of feedback) {
    if (fb.score <= 0) continue
    const occ = (fb.recommendation.outfit as { occasion?: string }).occasion
    if (occ) occasionFreq[occ] = (occasionFreq[occ] ?? 0) + 1
  }
  const preferredOccasions = Object.entries(occasionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([o]) => o)

  return {
    totalGarments: garments.length,
    categoryCounts,
    topColors,
    topStyles,
    seasonBreakdown: seasonFreq,
    mostWornOutfits,
    dislikedPatterns,
    preferredOccasions,
  }
}
```

---

# Gemini Style DNA Generation

Create `backend/src/services/style-dna/generate.ts`.

```ts
import { gemini } from '../../lib/gemini'
import { WardrobeSummary } from './summarize'

export interface StyleDNAResult {
  archetype: string
  colorStory: { colors: string[]; narrative: string }
  signaturePieces: string[]  // garment IDs — Gemini must pick from the wardrobe
  styleKeywords: string[]
  styleNarrative: string
  wardrobeStrengths: string[]
  blindSpots: string[]
}

const SYSTEM_PROMPT = `You are a senior fashion editor at an editorial magazine.
Given a structured summary of a user's wardrobe and outfit history, generate a
concise, insightful Style DNA profile. Write in a confident editorial voice —
never robotic, never generic. Reference only the data provided; do not invent
garments or colors not present in the summary.`

export async function generateStyleDNA(
  summary: WardrobeSummary,
  garmentIds: string[]  // all processed garment IDs, for signaturePieces validation
): Promise<StyleDNAResult> {
  const prompt = `Wardrobe summary (JSON):
${JSON.stringify(summary, null, 2)}

Available garment IDs for signaturePieces selection:
${garmentIds.join(', ')}

Return ONLY a valid JSON object with this exact structure:
{
  "archetype": "2–4 word style label",
  "colorStory": {
    "colors": ["color1", "color2", "color3"],  // 3–5 colors from topColors
    "narrative": "One sentence describing the color palette mood"
  },
  "signaturePieces": ["garmentId1", "garmentId2"],  // 2–3 IDs from the available list above
  "styleKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "styleNarrative": "2–3 sentence editorial description of this person's style identity.",
  "wardrobeStrengths": ["strength1", "strength2", "strength3"],
  "blindSpots": ["gap1", "gap2"]
}`

  const response = await gemini.generateContent({
    systemInstruction: SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
  })

  const raw = response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const parsed = JSON.parse(raw) as StyleDNAResult

  // Validate required fields
  if (
    typeof parsed.archetype !== 'string' ||
    !Array.isArray(parsed.colorStory?.colors) ||
    !Array.isArray(parsed.signaturePieces) ||
    !Array.isArray(parsed.styleKeywords) ||
    typeof parsed.styleNarrative !== 'string' ||
    !Array.isArray(parsed.wardrobeStrengths) ||
    !Array.isArray(parsed.blindSpots)
  ) {
    throw new Error('Gemini returned an invalid Style DNA structure')
  }

  // Constrain signaturePieces to actual garment IDs
  const validIds = new Set(garmentIds)
  parsed.signaturePieces = parsed.signaturePieces.filter(id => validIds.has(id)).slice(0, 3)

  return parsed
}
```

---

# API Routes

## `GET /api/style-dna`

Create `frontend/app/api/style-dna/route.ts`.

Returns the user's latest persisted `StyleDNA` record. Checks the Redis cache
first; falls back to the database. Returns `404` when none exists yet.

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@style-sync/backend'
import { getCachedStyleDNA, setCachedStyleDNA } from '@style-sync/backend'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cache-first read
  const cached = await getCachedStyleDNA(userId)
  if (cached) return NextResponse.json(cached)

  const record = await prisma.styleDNA.findUnique({ where: { userId } })
  if (!record) return NextResponse.json({ error: 'No Style DNA generated yet' }, { status: 404 })

  await setCachedStyleDNA(userId, record)
  return NextResponse.json(record)
}
```

## `POST /api/style-dna`

Generates (or regenerates) the Style DNA. Enforces a 24-hour rate limit using
the existing `isRateLimited` helper.

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma, isRateLimited } from '@style-sync/backend'
import { buildWardrobeSummary, generateStyleDNA } from '@style-sync/backend'
import { invalidateStyleDNACache, setCachedStyleDNA } from '@style-sync/backend'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Gate: require at least 10 classified garments
  const classifiedCount = await prisma.garment.count({
    where: { userId, isProcessed: true },
  })
  if (classifiedCount < 10) {
    return NextResponse.json(
      { error: 'At least 10 classified garments are required to generate Style DNA' },
      { status: 422 }
    )
  }

  // Rate limit: 1 generation per 24 hours
  const limited = await isRateLimited(`style-dna:${userId}`, {
    limit: 1,
    windowMs: 24 * 60 * 60 * 1000,
  })
  if (limited) {
    return NextResponse.json(
      { error: 'Style DNA can only be regenerated once per 24 hours' },
      { status: 429 }
    )
  }

  // Build wardrobe summary (no images — token efficient)
  const summary = await buildWardrobeSummary(userId)

  // Fetch all processed garment IDs for signaturePieces validation
  const garments = await prisma.garment.findMany({
    where: { userId, isProcessed: true },
    select: { id: true },
  })
  const garmentIds = garments.map(g => g.id)

  // Generate via Gemini
  const dna = await generateStyleDNA(summary, garmentIds)

  // Upsert — one record per user
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

  // Invalidate the old cache entry and write the fresh one
  await invalidateStyleDNACache(userId)
  await setCachedStyleDNA(userId, record)

  return NextResponse.json(record, { status: 201 })
}
```

---

# Frontend Page — `/style-dna`

Create `frontend/app/style-dna/page.tsx`.

## Empty State

Shown when `GET /api/style-dna` returns 404 or when `classifiedCount < 10`:

- Full-page centered layout.
- Dashed 1px border card (in sage/sand palette).
- Serif headline: "Your Style DNA".
- Body copy (Geist Sans): "Classify at least 10 garments to unlock your
  editorial style identity."
- Progress indicator: "X / 10 garments classified" (fetched from wardrobe
  count).
- CTA button is disabled and greyed until the gate is met.

## Loaded State

Once data is available, render a full-bleed editorial card:

| Section | Rendering |
|---------|-----------|
| **Archetype** | Cormorant Garamond, large serif headline. Uppercase tracking. |
| **Style Narrative** | Cormorant Garamond italic, 1.6 line-height. 2–3 sentences. |
| **Color Story** | Horizontal row of paint-chip swatches (40×40 px squares). Color values as labels in Geist Sans Mono. Narrative line below in Geist Sans. |
| **Style Keywords** | Tight uppercase chips — letter-spacing: 0.15em, 11px Geist Sans. No pill border-radius (sharp, 0px, matching the design system). |
| **Signature Pieces** | Garment thumbnail strip — fetch `processedImageUrl` (or `imageUrl`) for each `signaturePieceId`. 120×120 px squares, no border-radius. |
| **Wardrobe Strengths** | Bulleted editorial list. Geist Sans, 14px. |
| **Blind Spots** | Same list style, preceded by a soft label "What's missing". |
| **Regenerate** | Small ghost button in bottom-right corner. Shows "Last generated X days ago" in 12px Geist Sans beside it. Disabled for 24 h after generation. |

## Generation Flow

- When "Generate Style DNA" is clicked, POST to `/api/style-dna`.
- Show a full-card skeleton loader (pulsing) while the request is in flight.
- On success: animate the card sections in with a fade-up stagger (Tailwind
  `animate-fade-up` or a simple CSS keyframe — no Framer Motion added for
  this alone).
- On `429`: show a toast "You can regenerate in X hours" (derive from
  `generatedAt`).
- On `422`: show a toast "Classify more garments to regenerate".

---

# Backend Exports

Add to `backend/src/index.ts` (or wherever the package re-exports):

```ts
export { buildWardrobeSummary } from './services/style-dna/summarize'
export { generateStyleDNA } from './services/style-dna/generate'
export type { WardrobeSummary, StyleDNAResult } from './services/style-dna/generate'
```

Also export the cache helpers (already created in spec 23) if not already
re-exported:

```ts
export { getCachedStyleDNA, setCachedStyleDNA, invalidateStyleDNACache } from './lib/cache/style-dna'
```

---

# Files to Create

```txt
backend/src/services/style-dna/summarize.ts
backend/src/services/style-dna/generate.ts
frontend/app/api/style-dna/route.ts
frontend/app/style-dna/page.tsx
```

---

# Files to Modify

```txt
backend/src/index.ts
  — export buildWardrobeSummary, generateStyleDNA, WardrobeSummary, StyleDNAResult
  — export getCachedStyleDNA, setCachedStyleDNA, invalidateStyleDNACache (if not already)

prisma/schema.prisma
  — add StyleDNA model
```

---

# Constraints

Do **not**:

* Send any garment images to Gemini — wardrobe summary is text-only
* Allow more than 1 generation per 24 hours per user
* Auto-generate on wardrobe change — on-demand only
* Persist more than one `StyleDNA` record per user — always upsert
* Add Framer Motion or any new animation library — use CSS keyframes only
* Show the generate button to users with fewer than 10 classified garments
  (render it but keep it disabled with a tooltip explaining the gate)
* Return `signaturePieces` IDs that do not exist in the user's wardrobe
  (validate against the fetched garment ID list in `generateStyleDNA`)

---

# Check When Done

* `prisma/schema.prisma` has the `StyleDNA` model; migration applied
* `backend/src/services/style-dna/summarize.ts` exists; `buildWardrobeSummary` returns the correct shape
* `backend/src/services/style-dna/generate.ts` exists; `generateStyleDNA` validates all seven fields
* `generateStyleDNA` filters `signaturePieces` to only real garment IDs
* `GET /api/style-dna` returns 404 when no record exists, cached data when available
* `POST /api/style-dna` returns 422 when fewer than 10 garments are classified
* `POST /api/style-dna` returns 429 on the second request within 24 hours
* `POST /api/style-dna` upserts (not inserts) — only one `StyleDNA` row per user ever
* Redis cache is populated after generation; invalidated before writing the new record
* `/style-dna` page renders the empty state with a progress indicator when the gate is not met
* `/style-dna` page renders all seven DNA sections when data exists
* Signature piece thumbnails load from `processedImageUrl` with fallback to `imageUrl`
* Regenerate button is disabled for 24 h after generation with "Last generated X days ago" label
* `npm run build` passes
* `npx tsc --noEmit` — zero TypeScript errors
* No lint errors
