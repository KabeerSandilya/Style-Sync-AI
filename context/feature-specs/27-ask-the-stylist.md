# Ask the Stylist — Free-Text Query Recommendations (Unit 27)

We are documenting **Ask the Stylist** for **StyleSync AI**.

> **Retroactive spec.** This feature was already built and marked
> "Completed" as **Unit 27** in `context/progress-tracker.md` before a
> written spec existed for it — an out-of-band addition, not part of the
> original Phase 3 roadmap (`context/feature-specs/Phase 3 specs.md`, F1–F7).
> This document describes what was actually shipped so the spec sequence
> has no gap and future changes have something to diff against.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

`GET /api/recommendations` and `POST /api/outfits/generate` both require the
user to pick a structured occasion from a fixed 6-value enum. Neither
handles a free-text situational query like "I'm going for a run" or "dinner
date tonight" — the kind of phrasing a user actually types, which may imply
an occasion, a specific garment attribute (breathable, closed-toe), or both.
Ask the Stylist adds a single free-text entry point that interprets the
query with Gemini, then reuses the existing scoring/generation pipeline
rather than building a parallel one.

---

# Scope

Built:

### `interpretStyleQuery(query)` — Gemini-backed query interpretation (`backend/src/services/recommendation/interpret-query.ts`)
### `queryKeywords` scoring bonus in `scoreOutfit()` (`backend/src/services/recommendation/score-outfit.ts`)
### `queryKeywords` explanation clause in `explainRecommendation()` (`backend/src/services/recommendation/explain-recommendation.ts`)
### `queryKeywords` threaded through `rankOutfits()` (`backend/src/services/recommendation/rank-outfits.ts`)
### `POST /api/recommendations/query` — rank-first, generate-as-fallback endpoint
### Shared `<OutfitCollage />` component extracted from `TodaysRecommendations`
### `<AskStylistDialog />` + `useAskStylist()` hook, wired into `TodaysRecommendations`

Not built (out of scope, confirmed by the shipped code):

* No new Prisma model — a generated fallback outfit is a normal `Outfit` row (`isAiGenerated: true`), not a distinct query-history record
* No persistence of past queries or a query history view
* No streaming/typing-indicator UI — a single request/response cycle per submission
* No occasion-pill integration — this is a separate entry point from the existing occasion-pill row, not merged into it

---

# New Dependencies

None. Reuses the existing `@google/genai` client, the existing
`generateOutfits()` service (spec 16), and the existing rate-limit helper
(spec 23).

---

# Database Changes

None. A generated fallback is written through the existing `Outfit` /
`OutfitGarment` create path used by `POST /api/outfits/generate`.

---

# Query Interpretation (Gemini)

`backend/src/services/recommendation/interpret-query.ts`:

```ts
export interface QueryInterpretation {
  occasion: Occasion | null;
  keywords: string[];
}

export async function interpretStyleQuery(query: string): Promise<QueryInterpretation>
```

- Same Gemini call pattern as `generate-outfits.ts` / `style-dna/generate.ts`:
  `gemini-2.5-flash` with `responseMimeType: "application/json"`, falling
  back to `gemini-2.0-flash` on a `503`.
- Prompt maps the query to the closest value in `OCCASIONS` (or `null`) and
  asks for 3–6 short lowercase keywords describing ideal garment attributes.
- `extractJson()` strips markdown code fences before `JSON.parse`.
- Validation: `occasion` is discarded to `null` unless it is an exact member
  of `OCCASIONS`; `keywords` is filtered to non-empty strings, lowercased,
  truncated to 30 chars each, and capped at 6 entries.
- Throws (caller wraps in `withRetry`) on missing API key, empty response,
  malformed JSON, or non-object response shape.

---

# Scoring Integration

`scoreOutfit()` gained a new optional 7th parameter `queryKeywords?: string[]`
(after `requestedOccasion`). It is purely additive — omitting it produces
identical scores to before this feature:

```ts
// 8. Query Keyword Match Bonus (0 to 15 points)
let keywordScore = 0;
if (queryKeywords && queryKeywords.length > 0) {
  const matchedKeywords = new Set<string>();
  garments.forEach((g) => {
    queryKeywords.forEach((kw) => {
      if (checkGarmentMatch(g, [kw])) matchedKeywords.add(kw);
    });
  });
  keywordScore = Math.min(15, matchedKeywords.size * 5);
}
```

Reuses the existing `checkGarmentMatch()` helper (already used by the
weather-fit rules) instead of adding a new matching function. `keywordScore`
is added into the final clamped score alongside `feedbackScore`,
`wearPenalty`, and `occasionScore`.

`explainRecommendation()` takes the same optional `queryKeywords` parameter
and appends a deterministic sentence — no second LLM call:

```ts
if (queryKeywords && queryKeywords.length > 0) {
  const matched = queryKeywords.filter((kw) => garments.some((g) => hasKeyword(g, [kw])));
  if (matched.length > 0) {
    explanation += ` Tailored to match: ${matched.join(", ")}.`;
  }
}
```

This preserves the project's existing invariant that explanations are
rule-based, not LLM-generated (see spec 10 / Architecture Decisions in
`progress-tracker.md`).

`rankOutfits()` threads `queryKeywords` as its new 7th parameter straight
into both `scoreOutfit()` and `explainRecommendation()` calls.

---

# API Route

## `POST /api/recommendations/query`

Create `frontend/app/api/recommendations/query/route.ts`.

Request body (`QueryRecommendationSchema` in `frontend/lib/schemas.ts`):

```ts
export const QueryRecommendationSchema = z.object({
  query: z.string().min(3).max(200),
  lat:   z.number().min(-90).max(90).optional(),
  lon:   z.number().min(-180).max(180).optional(),
  city:  z.string().max(100).optional(),
});
```

Flow:

1. Auth via Clerk; 401 if unauthenticated.
2. Validate body with `QueryRecommendationSchema`; 400 via `zodError()` on failure.
3. Rate limit: 5/min per user, key `${userId}:ask-stylist` — separate bucket
   from `/api/outfits/generate`'s `1/min` limit (mirrors the pattern from
   spec 23, distinct key namespace).
4. 503 if `GEMINI_API_KEY` is not configured.
5. `interpretStyleQuery(query)` via `withRetry` → `{ occasion, keywords }`.
6. Fetch weather (`fetchWeather(city, lat, lon)`, default city `"Paris"`).
7. **Existing-outfit path**: rank all of the user's saved outfits with
   `rankOutfits(outfits, weather, userPreference, wearsMap, feedbackMap, occasion, keywords)`.
   If the top score is `>= 60` (`GOOD_MATCH_THRESHOLD`), return it immediately
   with `mode: "existing"` — no Gemini generation call is made.
8. **Fallback path** (no outfits exist, or best score `< 60`): require
   `>= 3` classified garments (`400`, `error: "not_enough_garments"` +
   `classifiedCount` otherwise); call `generateOutfits(garmentInputs, occasion)`
   (the same service as spec 16); filter candidates against existing outfit
   fingerprints (dedup) and a bottomwear/footwear-exclusivity check (same
   rule as spec 22's `validateGeneratedOutfit`); persist the first valid
   candidate as a normal `Outfit` (`isAiGenerated: true`, `occasion` from the
   candidate) and return it with `mode: "generated"`.
9. `422` if no valid candidate survives filtering; `500` with a generic
   message on any uncaught error (logged server-side).

Response shape (`success: true` case):

```ts
{
  success: true,
  mode: "existing" | "generated",
  interpretation: { occasion: string | null, keywords: string[] },
  recommendation: {
    outfitId: string,
    score: number | null,       // null in "generated" mode
    explanation: string,
    outfit: Outfit,
    feedbackType: "LIKE" | "DISLIKE" | null,
    lastWorn: Date | null,
    wornToday: boolean,
  },
  weather: WeatherContext,
}
```

No separate query-history table — every call is stateless except for the
side effect of persisting a new `Outfit` row in the fallback path.

---

# Frontend

## Shared collage extraction

`TodaysRecommendations` had an inline garment-collage renderer (1/2/3+-item
layered layout) duplicated at two call sites. It was extracted into
`frontend/components/recommendation/outfit-collage.tsx`:

```ts
export function OutfitCollage({ garments, isMini }: { garments: Garment[]; isMini?: boolean })
```

Both `TodaysRecommendations` and `AskStylistDialog` import this component —
no visual behavior changed, only de-duplication.

## `useAskStylist()` hook

`frontend/lib/hooks/use-ask-stylist.ts` — a `useMutation` wrapping
`POST /api/recommendations/query`. On success, if `mode === "generated"` it
invalidates `QK.outfits()` and the `["recommendations"]` query key so the
newly-saved outfit shows up in Saved Outfits and future recommendation
fetches without a manual refresh.

## `<AskStylistDialog />`

`frontend/components/recommendation/ask-stylist-dialog.tsx`, built on the
existing `<EditorialDialog />` primitive (no new dialog component). Contents:

- A `<Textarea>` (max 200 chars) with placeholder examples, disabled while pending.
- A "Find My Fit" submit button (min 3 chars to enable), showing a spinner
  while `askStylist.isPending`.
- On success: interpreted occasion + keyword chips, an `<OutfitCollage />`
  thumbnail, outfit name, the rule-based explanation, and a match badge
  (`Match {score}%` for `mode: "existing"`, `"Freshly assembled for you"`
  for `mode: "generated"`).
- `mode: "existing"` results get inline Wear / Like / Dislike actions reusing
  `useWearOutfit()` and `useLikeDislike()` — no new mutation hooks.
- `mode: "generated"` results show a static "Saved to your wardrobe — find
  it in Saved Outfits" line instead (the outfit is already persisted; no
  further action needed here).
- Error states: `not_enough_garments` shows the classified count; any other
  `success: false` or network failure shows a generic retry message.

Wired into `TodaysRecommendations` as a standalone trigger button
("Ask the Stylist", `MessageCircleQuestion` icon) placed above the existing
occasion-pill row, reusing the same `location` (`{ lat, lon, city }`) state
already resolved there via geolocation — no duplicate geolocation logic.

---

# Backend Exports

Added to `backend/src/index.ts`:

```ts
export { interpretStyleQuery } from './services/recommendation/interpret-query';
export type { QueryInterpretation } from './services/recommendation/interpret-query';
```

---

# Files Created

```txt
backend/src/services/recommendation/interpret-query.ts
frontend/app/api/recommendations/query/route.ts
frontend/lib/hooks/use-ask-stylist.ts
frontend/components/recommendation/outfit-collage.tsx
frontend/components/recommendation/ask-stylist-dialog.tsx
```

# Files Modified

```txt
backend/src/services/recommendation/score-outfit.ts
  — added optional queryKeywords 7th param; Query Keyword Match Bonus (0–15 pts)
backend/src/services/recommendation/explain-recommendation.ts
  — added optional queryKeywords param; "Tailored to match: …" clause
backend/src/services/recommendation/rank-outfits.ts
  — added optional queryKeywords 7th param, threaded to score/explain calls
backend/src/index.ts
  — export interpretStyleQuery, QueryInterpretation
frontend/lib/schemas.ts
  — added QueryRecommendationSchema
frontend/components/recommendation/todays-recommendations.tsx
  — extracted inline collage JSX to <OutfitCollage />; added <AskStylistDialog location={location} />
```

---

# Constraints

Confirmed by the shipped implementation — do **not**:

* Add a second Gemini call for explanation text — `explainRecommendation()`
  stays rule-based; only the query→occasion/keywords mapping uses an LLM
* Merge this entry point into the existing occasion-pill row — it is a
  separate dialog/trigger
* Persist query text or interpretation history in a new table
* Skip the existing-outfit ranking pass — generation is a fallback only,
  triggered by `score < 60` or zero outfits, not the default path
* Bypass the bottomwear/footwear-exclusivity and fingerprint-dedup checks
  already established in spec 22 when filtering generated candidates

---

# Check When Done

* `interpretStyleQuery()` returns `occasion: null` for queries with no clear
  occasion match, and a valid `Occasion` when a clear one exists
* `scoreOutfit()` and `explainRecommendation()` produce identical output to
  pre-Unit-27 behavior when `queryKeywords` is omitted (no regression)
* `POST /api/recommendations/query` returns `mode: "existing"` when a saved
  outfit scores `>= 60`, and `mode: "generated"` otherwise
* Rate limit (5/min, `${userId}:ask-stylist`) is independent of the
  `/api/outfits/generate` limit
* `<AskStylistDialog />` renders interpreted occasion/keyword chips, the
  collage, explanation, and mode-appropriate actions
* `npx tsc --noEmit` — zero errors (backend and frontend)
* 61/61 backend tests, 18/18 frontend tests passing (unaffected — new params additive)
* `npm run build` passes (38 routes, including `/api/recommendations/query`)
