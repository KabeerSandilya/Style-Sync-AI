# Tests & CI — Feature Spec

## Overview

Add a meaningful automated test suite and a GitHub Actions CI pipeline so every
push to the repo is validated before it can land.

The project already has Vitest configured in the backend workspace. What's missing is
actual test coverage of the most important code (the recommendation scorer, the
generation validator, the preference-learning engine) and a CI workflow that runs
these checks on every PR.

This is tooling only. No user-facing changes.

---

## Scope

**In scope:**
- Vitest unit tests for the backend service functions (pure logic, no DB)
- One integration test for the Zod schemas (fast, no network)
- A GitHub Actions workflow: typecheck → test → build on every push and pull request
- npm script updates to support the CI commands

**Out of scope:**
- End-to-end / browser tests (Playwright) — future phase
- API route handler integration tests against a real DB — future phase
- Frontend component tests (React Testing Library) — future phase
- Code coverage enforcement / coverage gates — future phase

---

## What to Test

### Priority 1 — Recommendation Scorer (`score-outfit.ts`)

The scorer is a **pure function** with no dependencies. It is the most complex logic
in the codebase and the hardest to get right. This is the highest-value test target.

Test groups:

```
weather scoring
  ✓ hot day boosts lightweight garments
  ✓ rain day penalises suede / open footwear
  ✓ cold day penalises summer garments
  ✓ neutral weather produces a mid-range base

season scoring
  ✓ garments tagged All-Season always receive full season credit
  ✓ garment season matches current season → full credit
  ✓ garment season mismatches current season → penalty

occasion scoring
  ✓ exact occasion match → +25
  ✓ compatible occasion (same group) → +12
  ✓ conflicting occasion → -15
  ✓ no requestedOccasion → 0, no regression to existing score

recency penalty
  ✓ worn today → -50
  ✓ worn yesterday → -25
  ✓ worn 3 days ago → -10
  ✓ never worn → 0

feedback adjustment
  ✓ LIKE → +10
  ✓ DISLIKE → -30
  ✓ null feedback → 0

preference bonus/penalty
  ✓ matching favorite style → bonus applied
  ✓ matching avoided style → penalty applied
  ✓ no preference profile → neutral

final score clamping
  ✓ score never exceeds 100
  ✓ score never goes below 0

tie-breaking
  ✓ two outfits with identical scores keep their relative createdAt order
```

### Priority 2 — Generation Validator (`generate-outfits.ts` validation logic)

The function that validates and deduplicates Gemini's output before saving. Extract
the validation step into a pure helper `validateGeneratedOutfit()` or test via
`generateOutfits` with a mocked Gemini client.

```
✓ outfit with a hallucinated garmentId is dropped
✓ outfit with 0 or 1 garments is dropped
✓ outfit with > 5 garments is dropped
✓ outfit with 2 bottomwear garments is dropped
✓ outfit with 2 footwear garments is dropped
✓ outfit that duplicates an existing saved outfit (by fingerprint) is dropped
✓ valid outfit with 2–5 garments passes through
✓ all outfits invalid → result array is empty (not an error)
```

### Priority 3 — Occasion Inference (`infer-occasion.ts`)

Pure function, tiny.

```
✓ garments with style "Formal" → "Formal"
✓ garments with style "Active" → "Active"
✓ mixed garments with no clear signal → null
✓ smart casual majority → "Smart Casual"
✓ casual majority → "Casual"
```

### Priority 4 — Preference Scoring (`preferences/update-profile.ts`)

```
✓ wear event increases style score
✓ dislike event decreases style score
✓ scores are bounded (no unbounded accumulation)
✓ empty event history produces neutral profile
```

### Priority 5 — Zod Schemas (`frontend/lib/schemas.ts`)

Fast to run, validates that the Zod schemas reject bad input and accept good input.
These are unit tests that run against the schema objects directly — no HTTP involved.

```
CreateOutfitSchema
  ✓ rejects empty garmentIds array
  ✓ rejects invalid occasion string
  ✓ accepts valid occasion values
  ✓ accepts null occasion

UpdateOutfitSchema
  ✓ rejects empty object (no fields to update)
  ✓ accepts partial updates

RecommendationsQuerySchema
  ✓ coerces lat/lon strings to numbers
  ✓ rejects lat outside -90..90

OnboardingSchema
  ✓ rejects empty favoriteStyles array
  ✓ rejects more than 10 favorite colors
```

---

## Test File Locations

Follow the existing Vitest convention in `backend/src/`:

```
backend/src/services/recommendation/__tests__/score-outfit.test.ts
backend/src/services/recommendation/__tests__/infer-occasion.test.ts
backend/src/services/recommendation/__tests__/rank-outfits.test.ts
backend/src/services/outfit-generation/__tests__/validate-outfit.test.ts
backend/src/services/preferences/__tests__/update-profile.test.ts
frontend/lib/__tests__/schemas.test.ts
```

---

## Test Fixtures

Create a shared fixtures file to avoid repeating boilerplate:

```ts
// backend/src/services/recommendation/__tests__/fixtures.ts

export const mockWeatherClear: WeatherContext = {
  tempC: 22, feelsLikeC: 21, condition: "Clear", pop: 0,
  humidity: 50, windKph: 10, isDay: true, location: "London",
};

export const mockWeatherRainy: WeatherContext = {
  tempC: 14, feelsLikeC: 12, condition: "Rain", pop: 0.9,
  humidity: 80, windKph: 20, isDay: true, location: "London",
};

export const mockGarmentTop: Garment = {
  id: "gar_top_1", userId: "user_1",
  imageUrl: "https://example.com/top.jpg", processedImageUrl: null,
  name: "White Linen Shirt", category: "Topwear",
  style: "Casual", season: "Summer", material: "Linen",
  primaryColor: "White", tags: [], isFavorite: false,
  isProcessed: true, confidence: 90,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  // ... fill remaining fields
};

export const mockOutfit: Outfit = {
  id: "out_1", userId: "user_1",
  name: "Summer Look", notes: null, occasion: "Casual",
  isFavorite: false, isAiGenerated: false,
  garments: [{ id: "og_1", outfitId: "out_1", garmentId: "gar_top_1",
    createdAt: new Date().toISOString(), garment: mockGarmentTop }],
  createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
  updatedAt: new Date().toISOString(),
};
```

---

## Example Test — Scorer

```ts
// score-outfit.test.ts
import { describe, it, expect } from "vitest";
import { scoreOutfit } from "../score-outfit";
import { mockWeatherClear, mockWeatherRainy, mockOutfit } from "./fixtures";

describe("scoreOutfit — weather", () => {
  it("returns a score within 0–100 on clear weather", () => {
    const score = scoreOutfit(mockOutfit, mockWeatherClear);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("penalises suede footwear on a rainy day", () => {
    const suedeSneaker: Garment = { ...mockGarmentFootwear, material: "Suede" };
    const outfitWithSuede = { ...mockOutfit, garments: [...mockOutfit.garments,
      { ...mockOutfitGarment, garment: suedeSneaker }] };
    const clear = scoreOutfit(outfitWithSuede, mockWeatherClear);
    const rainy = scoreOutfit(outfitWithSuede, mockWeatherRainy);
    expect(rainy).toBeLessThan(clear);
  });
});

describe("scoreOutfit — occasion", () => {
  it("adds 25 for an exact occasion match", () => {
    const base = scoreOutfit(mockOutfit, mockWeatherClear, undefined, null, null, null);
    const matched = scoreOutfit(mockOutfit, mockWeatherClear, undefined, null, null, "Casual");
    expect(matched).toBe(Math.min(100, base + 25));
  });

  it("does not change the score when no occasion is requested", () => {
    const a = scoreOutfit(mockOutfit, mockWeatherClear);
    const b = scoreOutfit(mockOutfit, mockWeatherClear, undefined, null, null, null);
    expect(a).toBe(b);
  });
});
```

---

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main, development]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: Type check (backend)
        run: npm run typecheck --workspace=backend

      - name: Type check (frontend)
        run: npx tsc --noEmit
        working-directory: frontend

      - name: Run tests
        run: npm test --workspace=backend
        env:
          DATABASE_URL: ""          # tests are pure; no DB needed

      - name: Build
        run: npm run build --workspace=frontend
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY:                 ${{ secrets.CLERK_SECRET_KEY }}
          DATABASE_URL:                     ${{ secrets.DATABASE_URL }}
          GEMINI_API_KEY:                   ${{ secrets.GEMINI_API_KEY }}
          CLOUDINARY_CLOUD_NAME:            ${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY:               ${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET:            ${{ secrets.CLOUDINARY_API_SECRET }}
          OPENWEATHER_API_KEY:              ${{ secrets.OPENWEATHER_API_KEY }}
```

The build step runs only if typecheck + tests pass. All sensitive values come from
GitHub Actions secrets (set once in the repo settings, never committed).

---

## npm Script Updates

```json
// root package.json — add convenience scripts
"scripts": {
  "test":      "npm test --workspaces --if-present",
  "typecheck": "npm run typecheck --workspaces --if-present"
}

// backend/package.json — already has "test": "vitest run"
// frontend/package.json — add:
"scripts": {
  "test": "vitest run"
}
```

---

## New Files

```
.github/workflows/ci.yml
backend/src/services/recommendation/__tests__/score-outfit.test.ts
backend/src/services/recommendation/__tests__/infer-occasion.test.ts
backend/src/services/recommendation/__tests__/rank-outfits.test.ts
backend/src/services/recommendation/__tests__/fixtures.ts
backend/src/services/outfit-generation/__tests__/validate-outfit.test.ts
backend/src/services/preferences/__tests__/update-profile.test.ts
frontend/lib/__tests__/schemas.test.ts
```

## Changed Files

```
package.json (root)          — add test + typecheck scripts
frontend/package.json        — add vitest + test script
```

---

## Scope Boundaries

**Do not:**
- Add a real database to the CI workflow — all tests must be pure/offline
- Write tests for Prisma queries (integration tests, separate future task)
- Write tests for Gemini API calls (mocking a third-party LLM is low value)
- Add coverage thresholds in this iteration
- Mock the file system or Cloudinary

---

## Check When Done

- `npm test` (from repo root) runs all tests and exits 0
- `npm run typecheck` exits 0 with no errors in backend or frontend
- `.github/workflows/ci.yml` exists and is valid YAML
- The Actions workflow shows green on a test push to the `development` branch
- At least 15 distinct test cases exist across the test files
- Tests for `scoreOutfit()` cover weather, occasion, recency, feedback, and clamping
- Tests for the generation validator cover all invalid-shape scenarios
- `npm run build` in the CI workflow passes
- No test imports from `@style-sync/backend` prisma client (keeps tests offline)
