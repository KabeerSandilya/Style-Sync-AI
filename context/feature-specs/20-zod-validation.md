# Zod Validation — Feature Spec

## Overview

Replace the manual, ad-hoc field-checking scattered across every API route handler
with **Zod schemas** — a single, auditable validation layer that sits at each route's
entry point, before any business logic runs.

Every handler currently does its own `if (!field)` / `typeof` guards. This approach
is inconsistent across routes, easy to forget when extending a handler, and invisible
to type inference. Zod fixes all three.

This is a pure backend change. No UI changes. No new user-facing behaviour.

---

## Scope

**In scope:**
- Install `zod` in the frontend workspace (all route handlers live there)
- Create a shared schema library at `frontend/lib/schemas.ts`
- Replace manual body/query validation in every API route handler with Zod `safeParse`
- Return consistent `400` responses whose `error` field contains the first Zod issue message
- Fix the pre-existing TypeScript error in `get-most-worn-outfits.ts` (occasion type
  mismatch surfaces because of the same loose `string` vs `Occasion` gap that Zod closes)

**Out of scope:**
- Changing response shapes seen by the client (the `{ success, error }` envelope stays)
- Validating path parameters (Next.js guarantees segment types)
- File upload validation (MIME/size checked separately — keep as-is)
- Frontend form validation (Zod on the server only; client-side validation is a later task)

---

## Technical Approach

### Installation

```bash
npm install zod          # in frontend/
```

Zod has no runtime dependencies and is fully tree-shakeable.

### Error Helper

Add one shared helper so every handler returns the same shape on a Zod failure:

```ts
// frontend/lib/schemas.ts
import { z } from "zod";
import { NextResponse } from "next/server";

export function zodError(error: z.ZodError) {
  return NextResponse.json(
    { success: false, error: error.issues[0].message },
    { status: 400 }
  );
}
```

### Usage Pattern

Before (manual):
```ts
if (!garmentIds || !Array.isArray(garmentIds) || garmentIds.length === 0) {
  return NextResponse.json({ success: false, error: "..." }, { status: 400 });
}
```

After (Zod):
```ts
const result = CreateOutfitSchema.safeParse(await req.json());
if (!result.success) return zodError(result.error);
const { name, notes, garmentIds, occasion } = result.data;
```

---

## Schema Definitions

All schemas live in `frontend/lib/schemas.ts`.

### Shared Primitives

```ts
const OccasionSchema = z.enum([
  "Work", "Casual", "Smart Casual", "Formal", "Active", "Date Night"
]).nullable().optional();

const CuidSchema = z.string().cuid();
const CuidArraySchema = z.array(CuidSchema).min(1, "Select at least one garment.");
```

### Garment Schemas

```ts
// PATCH /api/garments/[id]
export const UpdateGarmentSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  isFavorite: z.boolean().optional(),
  notes:      z.string().max(500).nullable().optional(),
}).strict();
```

### Outfit Schemas

```ts
// POST /api/outfits
export const CreateOutfitSchema = z.object({
  name:       z.string().max(100).optional(),
  notes:      z.string().max(500).nullable().optional(),
  isFavorite: z.boolean().optional(),
  occasion:   OccasionSchema,
  garmentIds: CuidArraySchema,
});

// PATCH /api/outfits/[id]
export const UpdateOutfitSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  notes:      z.string().max(500).nullable().optional(),
  isFavorite: z.boolean().optional(),
  occasion:   OccasionSchema,
  garmentIds: CuidArraySchema.optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: "No fields to update." }
);

// POST /api/outfits/generate
export const GenerateOutfitsSchema = z.object({
  occasion: OccasionSchema,
}).optional().default({});
```

### Recommendation Schemas

```ts
// GET /api/recommendations — query params (parsed from searchParams)
export const RecommendationsQuerySchema = z.object({
  lat:      z.coerce.number().min(-90).max(90).optional(),
  lon:      z.coerce.number().min(-180).max(180).optional(),
  city:     z.string().max(100).optional(),
  occasion: OccasionSchema,
});
```

### Planner Schemas

```ts
// POST /api/planner
export const CreatePlanSchema = z.object({
  outfitId:    CuidSchema,
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "plannedDate must be YYYY-MM-DD"),
  occasion:    OccasionSchema,
  note:        z.string().max(300).nullable().optional(),
});
```

### Preference Schema

```ts
// POST /api/preferences  (onboarding + updates)
export const UpdatePreferencesSchema = z.object({
  favoriteColors:    z.array(z.string()).max(10).optional(),
  favoriteStyles:    z.array(z.string()).max(10).optional(),
  favoriteOccasions: z.array(z.string()).max(6).optional(),
  avoidedColors:     z.array(z.string()).max(10).optional(),
  avoidedMaterials:  z.array(z.string()).max(10).optional(),
  preferredSeasons:  z.array(z.string()).max(4).optional(),
}).strict();
```

### Onboarding Schema

```ts
// POST /api/onboarding/complete
export const OnboardingSchema = z.object({
  favoriteStyles:    z.array(z.string().min(1)).min(1).max(10),
  favoriteColors:    z.array(z.string().min(1)).min(1).max(10),
  avoidedColors:     z.array(z.string()).max(10).optional(),
  avoidedMaterials:  z.array(z.string()).max(10).optional(),
  preferredSeasons:  z.array(z.string()).max(4).optional(),
  favoriteOccasions: z.array(z.string()).max(6).optional(),
});
```

---

## Routes to Update

| Route file | Handler(s) | Body schema | Query schema |
|-----------|-----------|------------|-------------|
| `app/api/garments/[id]/route.ts` | `PATCH` | `UpdateGarmentSchema` | — |
| `app/api/outfits/route.ts` | `POST` | `CreateOutfitSchema` | — |
| `app/api/outfits/[id]/route.ts` | `PATCH` | `UpdateOutfitSchema` | — |
| `app/api/outfits/generate/route.ts` | `POST` | `GenerateOutfitsSchema` | — |
| `app/api/recommendations/route.ts` | `GET` | — | `RecommendationsQuerySchema` |
| `app/api/planner/route.ts` | `POST` | `CreatePlanSchema` | — |
| `app/api/preferences/route.ts` | `POST` | `UpdatePreferencesSchema` | — |
| `app/api/onboarding/complete/route.ts` | `POST` | `OnboardingSchema` | — |

Handlers with no user-supplied body (`GET`, `DELETE`, share `POST`/`DELETE`) need no
schema — remove their existing `body` validation guards only if they have none.

---

## Fix: `get-most-worn-outfits.ts` TypeScript Error

The pre-existing error:

```
Type 'string | null' is not assignable to type 'Occasion | null'.
```

occurs because Prisma returns `occasion` as `string | null` (it has no enum
knowledge), but the `OutfitWithStats` type expects `Occasion | null`.

Fix by casting the Prisma result at the return site:

```ts
// backend/src/services/insights/get-most-worn-outfits.ts
return outfitsWithStats as OutfitWithStats[];
```

Or, better, narrow via the `Occasion` union in the mapping step so downstream
consumers can trust the type:

```ts
import { OCCASIONS, Occasion } from "../../types";

function toOccasion(s: string | null): Occasion | null {
  if (s === null) return null;
  return OCCASIONS.includes(s as Occasion) ? (s as Occasion) : null;
}
// use toOccasion(o.occasion) when building the OutfitWithStats object
```

---

## New Files

```
frontend/lib/schemas.ts     — all Zod schemas + zodError helper
```

## Changed Files

```
frontend/app/api/garments/[id]/route.ts
frontend/app/api/outfits/route.ts
frontend/app/api/outfits/[id]/route.ts
frontend/app/api/outfits/generate/route.ts
frontend/app/api/recommendations/route.ts
frontend/app/api/planner/route.ts
frontend/app/api/preferences/route.ts
frontend/app/api/onboarding/complete/route.ts
backend/src/services/insights/get-most-worn-outfits.ts   (TS fix)
frontend/package.json                                     (add zod)
```

---

## Scope Boundaries

**Do not:**
- Add Zod to the frontend form components (out of scope — server only)
- Change HTTP status codes for auth failures (stay 401) or not-found (stay 404)
- Validate response shapes — only validate incoming requests
- Add runtime parsing of `params` (Next.js route segments are already typed)

---

## Check When Done

- `npm install` succeeds with `zod` in `frontend/package.json`
- `frontend/lib/schemas.ts` exists and exports all schemas + `zodError`
- Every in-scope route handler uses `schema.safeParse()` instead of manual guards
- Sending an invalid body to any covered route returns `{ success: false, error: "<message>" }` with status `400`
- The `Occasion` type error in `get-most-worn-outfits.ts` is resolved
- `npx tsc --noEmit` reports zero errors
- No existing API behaviour changes for valid inputs (full regression check)
- `npm run build` passes
