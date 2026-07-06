# Capsule Wardrobe Auditor (F2)

We are implementing **Capsule Wardrobe Auditor** for **StyleSync AI**.

This feature answers "how hard is my wardrobe actually working?" by scoring
every classified garment on combinatorial value, grouping the wardrobe into
tiers (Workhorses, Sleeping Beauties, Orphans, Unprocessed), and generating an
AI gap analysis of what's missing. It is the second Sprint 2 intelligence
feature and the second consumer of the Redis cache helpers created in F7
(spec 23) — `getCachedCapsuleAudit` / `setCachedCapsuleAudit` /
`invalidateCapsuleAuditCache` in `backend/src/lib/cache/capsule-audit.ts`
already exist and are not yet wired to a route.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

StyleSync tells users what to wear today (recommendations) and who they are
as a dresser (Style DNA, spec 25). It does not tell them which garments are
actually earning their place in the wardrobe. A user with 40 garments has no
way to see that 5 pieces anchor most of their outfits while 12 have never
been worn. The data to answer this already exists — `OutfitGarment`,
`OutfitWear`, and `RecommendationFeedback` — but no service aggregates it into
a per-garment score or surfaces it.

---

# Scope

Build:

### Combinatorial Value Score (CVS) service (`backend/src/services/capsule/score-garments.ts`)
### Wardrobe tiering service (`backend/src/services/capsule/tier-garments.ts`)
### Gemini gap-analysis function (`backend/src/services/capsule/analyze-gaps.ts`)
### Purge-suggestion helper (`backend/src/services/capsule/purge-suggestions.ts`)
### Export all from `@style-sync/backend`
### `GET /api/insights/capsule` — computes (or returns cached) the full audit
### "Capsule Audit" tab on the existing `/insights` page

Do **not** build:

* Auto-purge or auto-delete of any garment — purge suggestions are informational only, user-actioned elsewhere (existing garment delete flow)
* A standalone `/capsule` route — this lives inside the existing Insights page as a tab
* Historical CVS trend tracking — only the current snapshot is computed
* A persisted `Recommendation.score` field — none exists today; CVS is derived from `OutfitGarment`, `OutfitWear`, and `RecommendationFeedback` only (see Technical Notes)

---

# New Dependencies

None. Reuses the existing Gemini client (`@style-sync/backend`) and the
Redis cache helpers already created in spec 23.

---

# Database Changes

None. Everything is computed on-the-fly from `Garment`, `OutfitGarment`,
`OutfitWear`, and `RecommendationFeedback`. No new Prisma model.

---

# Technical Notes — Score Source Correction

The original Phase 3 brief for F2 (`context/feature-specs/Phase 3 specs.md`)
lists "average recommendation score when it is part of a ranked outfit" as a
CVS input. That does not exist: `Recommendation` (`recommendation.prisma`)
has no persisted `score` field — ranking scores are computed in-memory by
`scoreOutfit()` at request time and never written to the database. Use
`RecommendationFeedback` (`feedbackType`: `LIKE` / `DISLIKE`) as the
real signal of outfit quality instead. This spec supersedes that line item.

---

# Combinatorial Value Score (CVS)

Create `backend/src/services/capsule/score-garments.ts`.

For every **processed** garment (`isProcessed: true`), compute a score from
data already in the schema:

```ts
import { prisma } from '../../lib/prisma'

export interface GarmentScore {
  garmentId: string
  outfitCount: number       // distinct outfits this garment appears in
  wearCount: number         // total wears across those outfits
  likeCount: number         // LIKE feedback on those outfits
  dislikeCount: number      // DISLIKE feedback on those outfits
  neverWornPenalty: boolean // true if outfitCount > 0 and wearCount === 0
  cvs: number               // final score
}

export async function scoreGarments(userId: string): Promise<GarmentScore[]> {
  const garments = await prisma.garment.findMany({
    where: { userId, isProcessed: true },
    select: {
      id: true,
      outfitItems: {
        select: {
          outfit: {
            select: {
              wears: { select: { id: true } },
              feedbacks: { select: { feedbackType: true } },
            },
          },
        },
      },
    },
  })

  return garments.map((g) => {
    const outfitCount = g.outfitItems.length
    let wearCount = 0
    let likeCount = 0
    let dislikeCount = 0

    for (const item of g.outfitItems) {
      wearCount += item.outfit.wears.length
      for (const fb of item.outfit.feedbacks) {
        if (fb.feedbackType === 'LIKE') likeCount += 1
        if (fb.feedbackType === 'DISLIKE') dislikeCount += 1
      }
    }

    const neverWornPenalty = outfitCount > 0 && wearCount === 0

    const cvs =
      outfitCount * 4 +
      wearCount * 6 +
      likeCount * 3 -
      dislikeCount * 3 -
      (neverWornPenalty ? 10 : 0)

    return { garmentId: g.id, outfitCount, wearCount, likeCount, dislikeCount, neverWornPenalty, cvs }
  })
}
```

Weights (`4 / 6 / 3 / -3 / -10`) are fixed constants for v1 — not user
configurable, not derived from ML. Keep them as named constants
(`OUTFIT_WEIGHT`, `WEAR_WEIGHT`, `LIKE_WEIGHT`, `DISLIKE_WEIGHT`,
`NEVER_WORN_PENALTY`) at the top of the file so they can be tuned in one
place.

---

# Wardrobe Tiering

Create `backend/src/services/capsule/tier-garments.ts`.

```ts
import { prisma } from '../../lib/prisma'
import { scoreGarments, GarmentScore } from './score-garments'

export interface CapsuleTiers {
  workhorses: GarmentScore[]      // top 20% by CVS among garments with cvs > 0
  sleepingBeauties: GarmentScore[] // outfitCount > 0, wearCount === 0
  orphans: GarmentScore[]          // outfitCount === 0
  unprocessedCount: number         // isProcessed === false
}

export async function tierGarments(userId: string): Promise<CapsuleTiers> {
  const [scores, unprocessedCount] = await Promise.all([
    scoreGarments(userId),
    prisma.garment.count({ where: { userId, isProcessed: false } }),
  ])

  const sorted = [...scores].filter(s => s.cvs > 0).sort((a, b) => b.cvs - a.cvs)
  const workhorseCount = Math.max(1, Math.ceil(sorted.length * 0.2))
  const workhorses = sorted.slice(0, workhorseCount)

  const sleepingBeauties = scores.filter(s => s.neverWornPenalty)
  const orphans = scores.filter(s => s.outfitCount === 0)

  return { workhorses, sleepingBeauties, orphans, unprocessedCount }
}
```

`workhorses` and `sleepingBeauties`/`orphans` are computed independently —
a garment can appear in at most one of `sleepingBeauties` / `orphans` (they
are mutually exclusive by `outfitCount`), but a workhorse can theoretically
also be flagged elsewhere only if its own tier condition holds; in practice
workhorses have `outfitCount > 0` and usually `wearCount > 0`, so overlap
with `sleepingBeauties` is rare but not filtered out — the UI renders tiers
as separate sections, not a strict partition.

---

# Gap Analysis (Gemini)

Create `backend/src/services/capsule/analyze-gaps.ts`. Mirrors the validated
JSON pattern used in `backend/src/services/style-dna/generate.ts` (spec 25) —
no images sent, text-only composition summary.

```ts
import { gemini } from '../../lib/gemini'

export interface WardrobeComposition {
  categoryCounts: Record<string, number>
  topStyles: string[]
  seasonBreakdown: Record<string, number>
  preferredOccasions: string[]
}

export interface GapAnalysisResult {
  gaps: Array<{ category: string; reason: string }>
  capsuleScore: number // 0–100
}

const SYSTEM_PROMPT = `You are a wardrobe consultant. Given a structured
summary of a user's wardrobe composition, identify concrete gaps — garment
categories that are missing or underrepresented relative to their preferred
occasions and seasons. Reference only the data provided; do not invent
categories that make no sense for the occasions listed. Never recommend
specific brands or products.`

export async function analyzeWardrobeGaps(
  composition: WardrobeComposition
): Promise<GapAnalysisResult> {
  const prompt = `Wardrobe composition (JSON):
${JSON.stringify(composition, null, 2)}

Return ONLY a valid JSON object with this exact structure:
{
  "gaps": [
    { "category": "short category name", "reason": "one sentence explaining the gap relative to the data above" }
  ],
  "capsuleScore": 0
}

Provide 2–5 gaps. capsuleScore is 0–100, rating how complete this wardrobe is for the occasions listed.`

  const response = await gemini.generateContent({
    systemInstruction: SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
  })

  const raw = response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const parsed = JSON.parse(raw) as GapAnalysisResult

  if (
    !Array.isArray(parsed.gaps) ||
    typeof parsed.capsuleScore !== 'number'
  ) {
    throw new Error('Gemini returned an invalid gap analysis structure')
  }

  parsed.capsuleScore = Math.max(0, Math.min(100, Math.round(parsed.capsuleScore)))
  parsed.gaps = parsed.gaps.slice(0, 5)

  return parsed
}
```

`WardrobeComposition` is intentionally a subset of `WardrobeSummary` (spec
25) — reuse `buildWardrobeSummary()` from `@style-sync/backend` and pick the
four fields needed rather than duplicating aggregation logic:

```ts
const summary = await buildWardrobeSummary(userId)
const composition: WardrobeComposition = {
  categoryCounts: summary.categoryCounts,
  topStyles: summary.topStyles,
  seasonBreakdown: summary.seasonBreakdown,
  preferredOccasions: summary.preferredOccasions,
}
```

---

# Purge Suggestions

Create `backend/src/services/capsule/purge-suggestions.ts`.

```ts
import { prisma } from '../../lib/prisma'

const PURGE_THRESHOLD_MS = 180 * 24 * 60 * 60 * 1000 // 180 days

export interface PurgeSuggestion {
  garmentId: string
  name: string
  reason: string
}

export async function getPurgeSuggestions(userId: string): Promise<PurgeSuggestion[]> {
  const cutoff = new Date(Date.now() - PURGE_THRESHOLD_MS)

  const garments = await prisma.garment.findMany({
    where: {
      userId,
      isProcessed: true,
      createdAt: { lte: cutoff },
      outfitItems: { none: {} }, // zero outfits — orphan tier
    },
    select: { id: true, name: true, createdAt: true },
  })

  return garments.map(g => ({
    garmentId: g.id,
    name: g.name,
    reason: `Added over 180 days ago and not part of any saved outfit.`,
  }))
}
```

Purge candidates are a strict subset of the Orphans tier (zero outfits) aged
past the threshold — never auto-deletes; the UI presents this as a soft,
collapsible suggestion list only.

---

# API Route

## `GET /api/insights/capsule`

Create `frontend/app/api/insights/capsule/route.ts`.

Cache-first (Redis, 6-hour TTL via the existing helpers), falls back to
computing fresh when the cache misses or Redis is unavailable.

```ts
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

  const gapAnalysis = await analyzeWardrobeGaps({
    categoryCounts: summary.categoryCounts,
    topStyles: summary.topStyles,
    seasonBreakdown: summary.seasonBreakdown,
    preferredOccasions: summary.preferredOccasions,
  })

  const result = { tiers, gapAnalysis, purgeSuggestions }

  await setCachedCapsuleAudit(userId, result)

  return NextResponse.json(result)
}
```

No POST/regenerate route in v1 — the 6-hour cache is the only staleness
control. A manual "Refresh" action is out of scope (add
`invalidateCapsuleAuditCache` wiring only if the user explicitly asks for it
later).

Gemini failure handling: if `analyzeWardrobeGaps` throws, catch it in the
route and return the tiers/purge data with `gapAnalysis: null` rather than
failing the whole request — tiering and purge suggestions do not depend on
Gemini and should still render.

---

# Frontend — Capsule Audit Tab

Extend the existing `frontend/app/insights/page.tsx` (do not create a new
route). Add a tab/section switcher at the top of the page: "Wear Analytics"
(existing content) and "Capsule Audit" (new). Reuse the page's existing
`SectionHeader` component for each new section — do not build a parallel
header component.

| Section | Rendering |
|---------|-----------|
| **Tier Summary** | Four stat tiles across the top: Workhorses / Sleeping Beauties / Orphans / Unprocessed counts, using the existing icon-chip style from `SectionHeader` (`Award`, `EyeOff`, `HelpCircle`, `BarChart2` — already imported in the file). |
| **Workhorses grid** | Garment cards (reuse the page's existing `GarmentCard` component) sorted by CVS descending, badge shows CVS score. |
| **Sleeping Beauties grid** | Same card component, badge reads "Never worn" in a warning tone. |
| **Orphans grid** | Same card component, badge reads "Not in any outfit". |
| **Gap Recommendations** | Editorial list card: `capsuleScore` as a large serif number (e.g. "72 / 100"), followed by the `gaps` list (category + reason) in Cormorant Garamond italic for the reason line. Renders nothing (not an error) when `gapAnalysis` is `null`. |
| **Purge Suggestions** | Collapsible section (closed by default), non-alarming copy: "Pieces that might be ready for a new home." Each row: garment thumbnail, name, reason. No action button in v1 — user navigates to the garment via existing wardrobe flows to delete it themselves. |

Use `useQuery` (TanStack Query, per the spec 21 migration) with a new query
key `QK.capsuleAudit()` added to `frontend/lib/query-keys.ts`, and a new hook
`frontend/lib/hooks/use-capsule-audit.ts` following the existing
`use-insights.ts` pattern exactly (same `staleTime`/`gcTime` defaults from
the shared `Providers`).

---

# Backend Exports

Add to `backend/src/index.ts`:

```ts
export { scoreGarments } from './services/capsule/score-garments'
export type { GarmentScore } from './services/capsule/score-garments'
export { tierGarments } from './services/capsule/tier-garments'
export type { CapsuleTiers } from './services/capsule/tier-garments'
export { analyzeWardrobeGaps } from './services/capsule/analyze-gaps'
export type { WardrobeComposition, GapAnalysisResult } from './services/capsule/analyze-gaps'
export { getPurgeSuggestions } from './services/capsule/purge-suggestions'
export type { PurgeSuggestion } from './services/capsule/purge-suggestions'
```

`getCachedCapsuleAudit`, `setCachedCapsuleAudit`, and
`invalidateCapsuleAuditCache` are already exported from spec 23 — confirm
they are re-exported from `backend/src/index.ts` and add them there if not.

---

# Files to Create

```txt
backend/src/services/capsule/score-garments.ts
backend/src/services/capsule/tier-garments.ts
backend/src/services/capsule/analyze-gaps.ts
backend/src/services/capsule/purge-suggestions.ts
frontend/app/api/insights/capsule/route.ts
frontend/lib/hooks/use-capsule-audit.ts
```

---

# Files to Modify

```txt
backend/src/index.ts
  — export scoreGarments, tierGarments, analyzeWardrobeGaps, getPurgeSuggestions (see Backend Exports)
  — confirm/export getCachedCapsuleAudit, setCachedCapsuleAudit, invalidateCapsuleAuditCache

frontend/app/insights/page.tsx
  — add tab switcher (Wear Analytics / Capsule Audit)
  — add Capsule Audit section using existing GarmentCard/SectionHeader components

frontend/lib/query-keys.ts
  — add QK.capsuleAudit()
```

---

# Constraints

Do **not**:

* Send any garment images to Gemini — gap analysis is text-only composition data
* Persist a `Recommendation.score` field to backfill this feature — it does not exist and is out of scope to add
* Auto-delete or auto-archive any garment from purge suggestions
* Create a new top-level route for this feature — it is a tab inside `/insights`
* Add a POST/regenerate endpoint — cache TTL (6h) is the only refresh mechanism in v1
- Let a Gemini failure break tiering/purge data — catch and degrade gapAnalysis to `null` only
* Add Framer Motion or any new animation/library dependency

---

# Check When Done

* `backend/src/services/capsule/score-garments.ts` exists; `scoreGarments()` returns correct `outfitCount`/`wearCount`/`likeCount`/`dislikeCount`/`cvs` per garment
* `backend/src/services/capsule/tier-garments.ts` exists; workhorse count is `ceil(20% of positive-CVS garments)`, minimum 1
* `backend/src/services/capsule/analyze-gaps.ts` exists; `analyzeWardrobeGaps()` validates `gaps` array and `capsuleScore` (clamped 0–100)
* `backend/src/services/capsule/purge-suggestions.ts` exists; only returns garments with zero outfits and `createdAt` older than 180 days
* `GET /api/insights/capsule` returns cached data within the 6-hour window without recomputing
* `GET /api/insights/capsule` degrades gracefully (`gapAnalysis: null`) when Gemini call fails, without failing the whole request
* `/insights` page has a working tab switcher between Wear Analytics and Capsule Audit
* Capsule Audit tab renders all four tiers, gap recommendations, and a collapsible purge list
* `npx tsc --noEmit` — zero errors (backend and frontend)
* `npm run build` passes
* No lint errors
