# Occasion-Aware Recommendations

We are implementing **Occasion-Aware Recommendations** for **StyleSync AI**.

This feature adds an occasion dimension to the recommendation engine. Users can
declare what they are dressing for — a work day, a casual weekend, a date night —
and the recommendation engine boosts outfits that suit that occasion while
suppressing those that conflict with it.

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`

---

# Problem Being Solved

The current recommendation engine ranks outfits by weather, season, style fit,
and personal preference. It has no concept of **purpose**.

A user going to the office and a user heading to the gym both see the same ranked
list. An outfit perfect for a job interview and an outfit built for a Sunday
grocery run can score identically today.

This produces recommendations that are contextually correct but situationally
useless.

Occasion-awareness gives the engine the single missing axis it needs to close
that gap.

---

# Scope

Build:

### Occasion Scoring Dimension in the Recommendation Engine

### Occasion Picker UI on the Dashboard

### Occasion Field on Outfit Model (DB)

### Occasion Tag on OutfitBuilderDialog

### Occasion Badge on OutfitCard

### Occasion-Aware Outfit Generation (extend existing `POST /api/outfits/generate`)

Do **not** build:

* occasion-specific weather overrides
* occasion-based garment filtering (still recommend any garment)
* time-of-day automatic occasion inference
* calendar / event integration
* multi-occasion outfits (one occasion per outfit)
* public occasion sharing

Occasion is an optional, advisory signal — not a hard filter. Outfits without
an occasion tag still appear; they just score neutrally for occasion.

---

# Occasions

Define a fixed set of occasion values. No free-text.

```ts
export type Occasion =
  | 'Work'
  | 'Casual'
  | 'Smart Casual'
  | 'Formal'
  | 'Active'
  | 'Date Night'
```

Store as a plain string in the database. The UI renders these as selectable
pills — no enum migration needed.

---

# Occasion Groups

Some occasions are compatible with each other. Use this mapping inside the
scoring logic:

```ts
const OCCASION_GROUPS: Record<string, string[]> = {
  Work:          ['Work', 'Smart Casual'],
  'Smart Casual': ['Smart Casual', 'Work', 'Date Night'],
  Formal:        ['Formal'],
  Casual:        ['Casual', 'Active'],
  Active:        ['Active', 'Casual'],
  'Date Night':  ['Date Night', 'Smart Casual', 'Formal'],
}
```

An outfit tagged with an occasion in the **same group** as the requested
occasion receives a partial bonus rather than a full match.

---

# Scoring Integration

## New Dimension: Occasion Score (0 to 25 points)

Add `occasionScore` to `scoreOutfit()`.

The occasion score is only non-zero when a `requestedOccasion` is passed in.
When no occasion is requested, `occasionScore = 0` (the call behaves exactly
as it does today — no regressions).

### Scoring Rules

```ts
// outfit.occasion is the tag set by the user on the saved outfit
// requestedOccasion is passed in from GET /api/recommendations?occasion=

if (!requestedOccasion) {
  occasionScore = 0                   // no occasion requested — ignore
} else if (!outfit.occasion) {
  occasionScore = 0                   // untagged outfit — neutral, do not penalise
} else if (outfit.occasion === requestedOccasion) {
  occasionScore = 25                  // exact match
} else if (OCCASION_GROUPS[requestedOccasion]?.includes(outfit.occasion)) {
  occasionScore = 12                  // compatible match
} else {
  occasionScore = -15                 // clear conflict (e.g. Active vs Formal)
}
```

### Updated Final Score Formula

```txt
Weather Fit          (0–40)
+ Season Fit         (0–30)
+ Style Fit          (0–30)
- Metadata Penalty   (0–25)
+ Feedback Score     (±10/30)
+ Preference Bonus   (0–25)
- Preference Penalty (0–30)
- Recent Wear Penalty(0–50)
+ Occasion Score     (-15–25)
= Final Score        (clamped 0–100)
```

The Occasion Score is added to `baseScore` before clamping, in the same
position as the other additive components.

### Changes to `scoreOutfit()`

Extend the signature:

```ts
export function scoreOutfit(
  outfit: Outfit,
  weather: WeatherContext,
  userPreference?: UserPreferenceInput,
  lastWornAt?: Date | null,
  feedbackType?: FeedbackType | null,
  requestedOccasion?: string | null,   // ← new
): number
```

Add `OCCASION_GROUPS` constant and the occasion scoring block described above.

No other changes to the existing scoring logic.

---

# Occasion Inference Helper

Create:

```txt
services/recommendation/infer-occasion.ts
```

Purpose: given an outfit's garments, infer the most likely occasion for the
outfit. Used inside `POST /api/outfits/generate` to auto-tag generated outfits.

Not used in `scoreOutfit()`. Not used in ranking.

```ts
export function inferOccasion(garments: Garment[]): Occasion | null
```

Rules (checked in order, first match wins):

```txt
Any garment style includes "Formal" or "Black Tie"          → "Formal"
Any garment style includes "Active" or "Athletic"           → "Active"
Any garment subcategory includes "Suit", "Blazer", "Dress"  → "Formal" (if no Active)
Majority of garments style is "Smart Casual"                → "Smart Casual"
Majority of garments style is "Casual"                      → "Casual"
No clear signal                                             → null
```

Return `null` rather than guessing. `null` means the outfit remains untagged.

---

# Database Changes

Extend the `Outfit` model in `prisma/models/outfit.prisma`:

```prisma
model Outfit {
  ...
  occasion       String?
  ...
}
```

`occasion` is nullable. Existing outfits default to `null` — untagged, neutral
for occasion scoring.

Run `prisma db push` after adding the field.

---

# Types

Update `Outfit` in `types/index.ts`:

```ts
export interface Outfit {
  ...
  occasion: string | null
  ...
}
```

Export the `Occasion` union type from `types/index.ts`:

```ts
export type Occasion =
  | 'Work'
  | 'Casual'
  | 'Smart Casual'
  | 'Formal'
  | 'Active'
  | 'Date Night'

export const OCCASIONS: Occasion[] = [
  'Work',
  'Casual',
  'Smart Casual',
  'Formal',
  'Active',
  'Date Night',
]
```

---

# API Changes

## GET /api/recommendations

Extend to accept an optional `occasion` query parameter.

```txt
GET /api/recommendations?occasion=Work
GET /api/recommendations               ← still works, occasion ignored
```

### Logic Change

Pass `occasion` (or `null`) through to `scoreOutfit()` as `requestedOccasion`.

No other changes to the recommendation ranking or response shape.

---

## PATCH /api/outfits/[id]

Extend to accept `occasion` in the request body.

```ts
{
  occasion?: string | null
}
```

Validate that, when provided, `occasion` is one of the six valid values.

Invalid value → `400`:

```json
{ "success": false, "error": "Invalid occasion value." }
```

---

## POST /api/outfits/generate

Extend to accept an optional `occasion` in the request body:

```ts
{
  occasion?: string | null
}
```

Pass `occasion` into `generateOutfits()`. The service uses it to bias the
Gemini prompt toward that context and to auto-tag each generated outfit with
the requested occasion.

If `occasion` is omitted, generation behaves exactly as today. Auto-tag via
`inferOccasion()` for each generated outfit before saving.

---

# Outfit Generation Service Changes

## generate-outfits.ts

Extend the function signature:

```ts
export async function generateOutfits(
  garments: GarmentInput[],
  occasion?: string | null,
): Promise<GenerationResult>
```

When `occasion` is provided, pass it to `buildGenerationPrompt()` so Gemini
knows the target context.

Each returned outfit in `GenerationResult` now carries an optional `occasion`
field:

```ts
export interface GeneratedOutfit {
  name: string
  garmentIds: string[]
  reason: string
  occasion?: string | null  // ← new
}
```

The generation route saves this as the `occasion` field on the `Outfit` record.

If `occasion` was not provided, call `inferOccasion()` on the outfit's resolved
garments before saving. If inference returns `null`, save `occasion: null`.

## prompts.ts

When an `occasion` is provided, add a line to the system prompt:

```txt
The user is dressing for: {occasion}.
Prefer garment combinations appropriate for this context.
Name each outfit to reflect this occasion naturally.
```

When no occasion is provided, omit this line (existing behavior).

---

# Explanation Changes

Update `explain-recommendation.ts` to include occasion context in the
explanation string when `requestedOccasion` is present and the outfit has a
non-zero occasion score:

```txt
occasionScore === 25 → "A strong match for {occasion}."
occasionScore === 12 → "Works well for {occasion}."
occasionScore === -15 → (omit occasion mention entirely from explanation)
```

Append the occasion phrase after the existing weather/season explanation
clause. Keep explanations under two sentences total.

---

# Dashboard UI

## Occasion Picker

Location: `components/recommendation/todays-recommendations.tsx`

Render a horizontally scrollable pill row **above** the recommendation cards.

Pills:

```txt
[  All  ]  [ Work ]  [ Casual ]  [ Smart Casual ]  [ Formal ]  [ Active ]  [ Date Night ]
```

"All" is selected by default (no occasion filter).

Selecting a pill:
* sets local state `selectedOccasion`
* triggers a recommendations refetch with `?occasion={value}`
* selected pill uses `bg-primary text-primary-foreground` styling
* unselected pills use `border border-border text-muted-foreground hover:border-primary` styling

The picker uses the same sand/cream editorial token set as the rest of the
dashboard. Sharp corners (no border-radius), uppercase tracking, small text size.

Persist selected occasion in `localStorage` as `stylesync_occasion` so it
survives page refresh.

---

# OutfitBuilderDialog UI

Location: `components/editor/outfit-builder-dialog.tsx`

Add an **Occasion** dropdown to the outfit metadata section, below the Notes
textarea.

```txt
Occasion
[ — None — ▾ ]
```

Options:

```txt
— None —
Work
Casual
Smart Casual
Formal
Active
Date Night
```

"None" maps to `null`. Saves via `PATCH /api/outfits/[id]` with the new
`occasion` field.

For new outfits (`POST /api/outfits`), include `occasion` in the create
payload. Extend the create endpoint to accept and persist it.

Label styling: same as the existing Notes and Name labels in the dialog —
`text-xs font-medium uppercase tracking-widest text-muted-foreground`.

---

# OutfitCard UI

Location: `components/editor/outfit-card.tsx`

When `outfit.occasion` is set, display a small occasion badge at the bottom
of the card, below the garment collage.

Style:

```txt
bg-muted/40 text-muted-foreground border border-border/50
text-[10px] uppercase tracking-widest font-medium
```

The badge must not overlap the AI Generated badge. If both are present, stack
vertically (AI badge above, Occasion badge below).

---

# POST /api/outfits (create)

Extend to accept `occasion` in the request body (optional, nullable).

Persist it on the created `Outfit` record.

---

# Occasion Filter Persistence

Selected occasion is persisted in `localStorage` with the key
`stylesync_occasion`.

On mount, read `localStorage.getItem('stylesync_occasion')` and restore the
selected pill. If the stored value is not a valid occasion, ignore it and
default to "All".

---

# Constraints

Do **not**:

* hard-filter outfits by occasion (untagged outfits must still appear)
* auto-select occasion based on time of day
* show different occasion labels on mobile vs desktop
* create a separate "occasion" page or route
* add occasion to the garment model (occasion lives on Outfit only)
* break existing `scoreOutfit()` call sites — `requestedOccasion` is optional,
  defaults to `null`

---

# Files to Create

```txt
services/recommendation/infer-occasion.ts
```

---

# Files to Modify

```txt
prisma/models/outfit.prisma
  — add occasion String? field

backend/src/types/index.ts
  — add occasion to Outfit interface
  — export Occasion type and OCCASIONS constant

services/recommendation/score-outfit.ts
  — add requestedOccasion parameter
  — add OCCASION_GROUPS constant
  — add occasion scoring block to scoreOutfit()

services/recommendation/explain-recommendation.ts
  — append occasion phrase when score is positive

services/outfit-generation/types.ts
  — add occasion?: string | null to GeneratedOutfit

services/outfit-generation/generate-outfits.ts
  — add occasion parameter
  — pass to buildGenerationPrompt()
  — run inferOccasion() on generated outfits when occasion not provided

services/outfit-generation/prompts.ts
  — append occasion context line when occasion is provided

app/api/recommendations/route.ts
  — read ?occasion= from searchParams
  — pass to scoreOutfit() via rank-outfits

app/api/outfits/route.ts (POST)
  — accept occasion in create body

app/api/outfits/[id]/route.ts (PATCH)
  — accept and validate occasion in update body

app/api/outfits/generate/route.ts
  — accept occasion in request body
  — pass to generateOutfits()

components/recommendation/todays-recommendations.tsx
  — add occasion picker pill row
  — pass selected occasion as query param to recommendations fetch

components/editor/outfit-builder-dialog.tsx
  — add Occasion dropdown

components/editor/outfit-card.tsx
  — add occasion badge
```

---

# Check When Done

* `occasion` column exists on `Outfit` table (nullable String)
* `Outfit` TypeScript interface has `occasion: string | null`
* `Occasion` type and `OCCASIONS` constant exported from `types/index.ts`
* `scoreOutfit()` accepts `requestedOccasion` as 6th optional parameter
* `scoreOutfit()` with no `requestedOccasion` produces identical scores to today (no regressions)
* `OCCASION_GROUPS` constant defined; partial-match logic tested
* `infer-occasion.ts` exists; returns `null` for garments with no clear signal
* `GET /api/recommendations?occasion=Work` returns occasion-boosted results
* `GET /api/recommendations` (no param) returns same results as today
* `PATCH /api/outfits/[id]` accepts and persists `occasion`
* `PATCH /api/outfits/[id]` returns `400` for invalid occasion string
* `POST /api/outfits` persists `occasion` when provided
* `POST /api/outfits/generate` accepts `occasion` body field
* Generated outfits are saved with the requested occasion (or inferred occasion)
* Occasion picker renders on the dashboard with 7 pills ("All" + 6 occasions)
* Selecting a pill refreshes recommendations with correct `?occasion=` param
* Selected occasion is persisted in `localStorage`
* OutfitBuilderDialog shows Occasion dropdown; saving updates the outfit
* OutfitCard shows occasion badge when `outfit.occasion` is set
* AI badge and Occasion badge coexist without overlapping
* Existing 17 recommendation scoring tests pass without modification
* No TypeScript errors
* No lint errors
* `npm run build` passes
* `npm test` passes
