# Progress Tracker

Update this file after every meaningful implementation change.

---

## Current Phase

**Phase 1 — MVP Foundation (Complete) / Phase 1.5 — Hardening & Polish (In Progress)**

Goal: All core Phase 1 features are built. Current focus is fixing known shortcomings before moving to Phase 3 (Avatar / Virtual Try-On).

---

## Current Goal

**MVP Hardening Pass** — addressing code quality, reliability, UX, and test coverage issues identified during review.

Current target:

1. ~~User authentication~~ ✓
2. ~~Clothing upload flow~~ ✓
3. ~~Cloudinary image storage~~ ✓
4. ~~Background removal~~ ✓
5. ~~Clothing metadata extraction~~ ✓
6. ~~Save processed clothing item to wardrobe~~ ✓

Active fixes:

- Remove debug logging left in production routes
- Fix sidebar thumbnails to use processed (background-removed) images
- Add retry logic for fire-and-forget background jobs
- Add weather data TTL caching
- Add rate limiting on paid AI endpoints
- Handle recommendations cold-start (no outfits yet)
- Re-enable auto-classification on garment upload
- Build onboarding flow for new users
- Add manual initial preference selection
- Add background removal completion polling
- Add unit tests for recommendation scoring algorithm

---

## Completed

### Product Architecture

- Defined scalable system architecture.
- Finalized monorepo structure.
- Selected technology stack:
  - Next.js
  - NestJS
  - PostgreSQL
  - Prisma
  - pgvector
  - Cloudinary
  - Clerk
  - OpenWeather API
  - React Three Fiber
  - BullMQ

### Engineering Standards

- Defined project-wide code standards.
- Established TypeScript strictness rules.
- Defined API invariants and AI constraints.

### Workflow Definition

- Established spec-driven development process.
- Defined MVP-first implementation order.
- Documented feature scoping rules.

### Design System & UI Primitives

- Initialized and configured `shadcn/ui` integration.
- Created custom sand, cream, and sage CSS theme variables for both light and dark modes matching the warm editorial boutique aesthetic.
- Wired up Cormorant Garamond Serif and Geist Sans typography pairings.
- Integrated `lucide-react` for minimal, stroke-based icons.
- Installed core UI primitives: `Button`, `Card`, `Dialog`, `Input`, `Textarea`, `Tabs`, and `ScrollArea`.
- Created `lib/utils.ts` with the `cn()` class utility for conditional class merging.

### Foundational Application Chrome (Editor Shell)

- Created reusable, sticky, and translucent `EditorNavbar` with sidebar toggle, dynamic center title, and right layout spacing.
- Created floating overlay `ProjectSidebar` with slide-in transition, close action, Tab navigation ("My Wardrobe", "Saved Outfits"), empty placeholders with premium editorial styling, and bottom-anchored "Add Clothing" button.
- Created reusable luxury `EditorialDialog` pattern matching warm sand/cream tokens, featuring serif typography and generous spacing.
- Integrated the shell components and linked states into `page.tsx` for complete interactivity.

### Unit 1 — Authentication

- Integrated Clerk authentication with the Next.js 16 application.
- Designed custom, minimal two-panel editorial layouts for `/sign-in` and `/sign-up` pages.
- Styled Clerk components to perfectly inherit StyleSync theme variables (sand backgrounds, cream card surfaces, sage green accent primary, and zero-border-radius corners).
- Protected all routes by default using Next.js 16 `proxy.ts` middleware configuration, making only `/sign-in` and `/sign-up` public.
- Updated root route (`/`) to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`.
- Restructured the editor shell to `/editor/page.tsx` and integrated the Clerk `<UserButton />` into the `EditorNavbar`.

### Database Integration & Schema

- Configured Prisma 7 with PostgreSQL database connection using a custom driver adapter.
- Created the PostgreSQL database schema model for wardrobe items (`Garment`).
- Split Prisma schema into modular files under `prisma/models/` (`garment.prisma`, `outfit.prisma`, `user-preference.prisma`, and `recommendation.prisma`) to keep models clean and extensible.
- Configured database branching in `lib/prisma.ts` to support both Prisma Accelerate (`prisma+postgres://` URLs) and PostgreSQL driver adapter (`@prisma/adapter-pg`).
- Pushed schema changes to synchronize with the local database and successfully generated the Prisma Client.

### Unit 2 — Wardrobe Upload, Storage & Deletion (Completed)

- Created secure server-side Upload API endpoint (`/api/upload`) using Cloudinary storage integration.
- Created Wardrobe Retrieval API endpoint (`/api/garments`) to query wardrobe items for the logged-in user.
- Created Wardrobe Deletion API endpoint (`/api/garments/[id]`) that securely deletes a garment, removing database records and purging the asset from Cloudinary storage.
- Built `<UploadGarmentDialog />` with premium drag-and-drop zone, file size/type validation, client-side preview, optional notes input, and loading states.
- Integrated the dialog, delete triggers, and connected dynamic list state in `/editor/page.tsx` and `project-sidebar.tsx` to automatically refresh without full-page reloads.
- Implemented a server-side Base64 database fallback storage mechanism to enable garment uploads during local/offline development when Cloudinary environment variables are missing.

### Unit 2 — AI Garment Classification & Metadata Extraction (Completed)

- Installed and configured `@google/genai` Gemini SDK.
- Extended Prisma `Garment` model to store AI-extracted metadata (`subcategory`, `primaryColor`, `secondaryColor`, `season`, `style`, `material`, `confidence`).
- Implemented modular `GarmentClassificationService` invoking Gemini 2.5 Flash with structured prompts and strict schema validations.
- Disabled automatic background AI classification during garment upload, allowing classification to only occur when triggered manually by the user in the UI.
- Created manual classification endpoint at `POST /api/garments/[id]/classify` with Clerk authentication, ownership validation, and error handling.
- Polished `GarmentCard` and details dialog to correctly show unclassified states and only render loading indicators when classification is actively in progress.
- Extended `<GarmentDetailsDialog />` with an "AI Stylist Insights" dashboard and a manual "Run AI Classification" / "Re-classify garment" trigger.

### Unit 3 — Wardrobe UI, Data Integration & Wardrobe Management (Completed)

- Built responsive full-width `WardrobeGrid` component supporting 3-5 columns on desktop, 2-3 columns on tablet, and 1-2 columns on mobile.
- Created `GarmentCard` with custom styling (cream surface, soft border, rounded-2xl, subtle shadow, and gentle hover elevations).
- Implemented client-side filtering system for browsing garments by category (All, Tops, Bottoms, Outerwear, Footwear, Accessories, Uncategorized) and favorites status.
- Refactored `ProjectSidebar` (Wardrobe Sidebar) to present recent garments in a list view matching the loading skeletons instead of a grid.
- Added `PATCH /api/garments/[id]` API endpoint to persist garment favoriting in the database.
- Resolved browser syntax error (`Unexpected token '<'`) caused by Clerk middleware routing blocking Clerk's internal session requests (`/__clerk`).
- Implemented premium dual-column `<GarmentDetailsDialog />` component for details viewing and metadata editing.
- Supported full metadata editing including name, category dropdown, interactive tag chip editing, and styling notes.
- Implemented backend `PATCH /api/garments/[id]` validation and integration.
- Implemented backend `DELETE /api/garments/[id]` endpoint and secure deletion flow with confirmation prompt.
- Linked click interactions on wardrobe grid cards and sidebar lists to trigger the edit dialog.

### Unit 8 — Outfit Builder & Saved Outfits (Completed)

- Created backend `GET /api/outfits` and `POST /api/outfits` to fetch and save outfit curation configurations.
- Created backend `PATCH /api/outfits/[id]` and `DELETE /api/outfits/[id]` to update and delete outfits, including transactional mapping overrides and cascade deletions.
- Created premium visual `<OutfitCard />` rendering a stacked visual flat-lay collage of garment images, favorite status, and metadata details.
- Created responsive `<OutfitGrid />` list layout supporting skeleton loaders and creative empty states.
- Created dual-column `<OutfitBuilderDialog />` component supporting scrollable category-filtered wardrobe selectors, overlay selected states, vertical pile preview collage, metadata inputs, and integrated deletion confirmation.
- Updated `ProjectSidebar` (Wardrobe Sidebar) and main editor workspace to seamlessly switch between wardrobe and outfits view toggles with contextual CTA buttons.

### Unit 4 — Weather-Aware Recommendations (Completed)

- Created a normalized weather service integrating with OpenWeather API using a seasonal/location-based fallback to support offline local development.
- Developed a modular recommendation scoring service to evaluate outfits on Weather Fit, Season Fit, Style Fit, and Metadata Completeness.
- Created a deterministic rule-based explanation engine that articulates recommendations clearly without using LLMs.
- Implemented the Clerk-authenticated GET `/api/recommendations` API endpoint.
- Designed and built the dynamic `<TodaysRecommendations />` component displaying weather context, primary recommendation previews, and alternative looks, fully styled for the sand/cream editorial theme.
- Centered the styling recommendations on the main dashboard (`/editor`) and added a dedicated CTA redirecting to a full-width Wardrobe Studio page (`/editor/wardrobe`) for collection management and outfit creation.
- Enabled query parameter deep-linking on `/editor/wardrobe` so sidebar clicks and "Add Clothing" actions automatically trigger dialogs.

### Unit 11 — Recommendation Feedback & Wear History (Completed)

- Created modular `RecommendationFeedback` and `OutfitWear` models in `prisma/models/recommendation-feedback.prisma` and synchronized database schema.
- Created `RecommendationHistoryService` in `services/recommendation-history/index.ts` to map user wear and feedback history.
- Updated recommendation scoring system to integrate Feedback Score (+10 for LIKE, -30 for DISLIKE) and Recent Wear Penalty (up to -50 points for outfits worn recently) for repetition avoidance.
- Implemented Clerk-authenticated endpoints `POST /api/recommendations/[outfitId]/wear`, `POST /api/recommendations/[outfitId]/like`, and `POST /api/recommendations/[outfitId]/dislike` with strict ownership checks and duplicate prevention.
- Added minimal, elegant "Wear This", "Like", and "Dislike" buttons on `<TodaysRecommendations />` spotlight cards with dynamic active state highlighting and automatic query refresh.

### Unit 12 — Wear History & Outfit Timeline (Completed)

- Created backend `GET /api/wear-history` API endpoint with Clerk authentication to retrieve the logged-in user's wear history.
- Created Wear Statistics Service in `services/wear-history/index.ts` to retrieve recent wears, count wears, and find last worn date.
- Updated `GET /api/outfits` to fetch and include the most recent wear record for each outfit.
- Created `<HistoryItem />` component to render timeline items with thumbnails, relative worn date, and piece count.
- Created read-only `<HistoryDetailDialog />` to view previously worn outfits, preview garments, and styling notes.
- Created Wear History page (`app/history/page.tsx`) with editorial chronological grouping, pulse skeleton loaders, and empty states.
- Updated `<OutfitCard />` to display dynamic last worn information (`Last worn 3 days ago` or `Never worn`).
- Integrated navigation links (`Wardrobe`, `Outfits`, `History`) into `<EditorNavbar />`.
- Implemented clearing capabilities: Added DELETE endpoints for clearing all history and individual history entries, integrated "Clear All History" button on the timeline page, and "Remove Entry" button in the history detail modal dialog.

### Unit 13 — Wardrobe Insights & Wear Analytics (Completed)

- Created backend `GET /api/insights` API endpoint with Clerk authentication to retrieve aggregated wardrobe analytics for the user.
- Created Wardrobe Insights services (`services/insights/get-most-worn-garments.ts`, `get-least-worn-garments.ts`, `get-never-worn-garments.ts`, `get-most-worn-outfits.ts`) to calculate usage statistics and return presentation-ready data.
- Updated `GET /api/garments` to compute and return `lastWornAt` metadata for garments based on containing outfit wear history.
- Updated `types/index.ts` and `components/editor/garment-card.tsx` to display dynamic last worn information (`Last worn 4 days ago` or `Never worn`) on garment cards.
- Created Wardrobe Insights page (`app/insights/page.tsx`) displaying Most Worn, Most Worn Outfits, Least Worn, and Never Worn sections in a spacious, editorial layout matching the sand/cream boutique aesthetic.
- Integrated the `Insights` page into the `EditorNavbar` navigation header.

### Unit 15 — Background Removal Pipeline (Completed)

- Created modular `removeBackground(imageUrl)` service in `services/background-removal/remove-background.ts` using the remove.bg API with graceful degradation when `REMOVE_BG_API_KEY` is missing or the API call fails.
- Added `processedImageUrl` (nullable string) and `bgRemovedAt` (nullable DateTime) fields to the `Garment` Prisma model and synced the database schema with `prisma db push`.
- Updated `types/index.ts` to include the two new fields on the `Garment` interface.
- Added `getDisplayImageUrl(garment)` utility to `lib/utils.ts` implementing the `processedImageUrl ?? imageUrl` resolution rule.
- Wired fire-and-forget background removal into `POST /api/upload` — runs after the upload response is returned and only when both Cloudinary and `REMOVE_BG_API_KEY` are configured.
- Created synchronous `POST /api/garments/[id]/remove-background` endpoint for manual re-triggering with full Clerk auth and ownership validation.
- Updated all five image surfaces to use `getDisplayImageUrl()`: `GarmentCard`, `GarmentDetailsDialog`, `OutfitCard`, `OutfitBuilderDialog`, `HistoryDetailDialog`, and `TodaysRecommendations`.
- Added a subtle pulsing "Processing" badge on `GarmentCard` when `processedImageUrl` is null and `bgRemovedAt` is null.
- Added a "Background Processing" section inside the `GarmentDetailsDialog` AI Insights panel showing status and a manual "Remove Background" trigger button.
- Fixed `bgRemovedAt` date serialization (`Date → ISO string`) in all four insight services to maintain TypeScript type safety.

### Unit 14 — Preference Learning (Completed)

- Implemented `UserPreference` schema model to store favorite colors, styles, categories, seasons, and clothing types, along with raw JSON preference scores.
- Created modular deterministic preference calculation services (`calculate-scores.ts`, `build-profile.ts`, `update-profile.ts`) that evaluate user wear history, feedbacks, and favorites in background.
- Created Clerk-authenticated preference retrieval API endpoint at `GET /api/preferences`.
- Integrated preference profiles directly into recommendation scoring logic (`scoreOutfit`) using a Preference Match Bonus (up to +25 points) and a Preference Match Penalty (up to -30 points).
- Designed and built the read-only editorial Style Preferences page (`app/preferences/page.tsx`) rendering favorite colors, styles, categories, and clothing types lists.
- Integrated Preferences page navigation links in the dashboard header layout, resolving container click collisions.

### Backend APIs — Wardrobe & Outfit Management (Completed)

- Implemented `GET /api/garments` to fetch the authenticated user's wardrobe (newest first).
- Implemented `POST /api/garments` to create a new garment in the wardrobe.
- Implemented `PATCH /api/garments/[id]` to update a garment's metadata (name, category, notes, tags, isFavorite) with strict ownership checks.
- Implemented `DELETE /api/garments/[id]` with secure ownership checks and automatic cascade deletion.
- Implemented `GET /api/outfits` to fetch the authenticated user's saved outfits including garment references.
- Implemented `POST /api/outfits` to create outfits, verifying user ownership of all garments before saving.
- Implemented `PATCH /api/outfits/[id]` to edit outfits (including renaming, notes, updating garments, toggling favorite status) inside a database transaction.
- Implemented `DELETE /api/outfits/[id]` to remove outfits with automatic deletion of join table associations.
- Standardized API response shapes and strict authorization rules (401 Unauthorized, 403 Forbidden, 404 Not Found).

---

## In Progress

### Phase 1.5 — MVP Hardening Pass

Fixes completed:

- [x] Remove `fs.appendFileSync` debug logging from `GET /api/garments`
- [x] Fix `ProjectSidebar` to use `getDisplayImageUrl()` for garment and outfit thumbnails
- [x] Add retry logic for fire-and-forget background jobs (classification, bg removal)
- [x] Add weather data TTL caching
- [x] Add rate limiting on `/api/garments/[id]/classify` and `/api/garments/[id]/remove-background`
- [x] Handle recommendations cold-start (no outfits yet)
- [x] Re-enable auto-classification on garment upload (fire-and-forget) — already present in upload route, gated behind GEMINI_API_KEY
- [x] Build onboarding flow for new users
- [x] Add manual initial preference selection
- [x] Add background removal completion polling in UI
- [x] Add unit tests for recommendation scoring algorithm (17 tests, vitest)
- [x] Fix background removal for Vercel hosting:
  - `removeBackground()` now calls remove.bg REST API when `REMOVE_BG_API_KEY` is set (works on serverless)
  - Falls back to `@imgly` local ONNX model only when key is absent (local dev)
  - Upload route background jobs now use `after()` from `next/server` so Vercel doesn't kill them when the response is sent
- [x] Client-side background removal (free, unlimited):
  - `@imgly/background-removal` (browser build) runs WASM ONNX model in the user's browser
  - Starts as soon as user picks a file; runs in parallel while they fill in name/notes
  - Preview switches from original → background-removed with a "BG Removed" badge when done
  - Processed PNG is sent with the upload form; server skips its own BG removal job entirely
  - Server-side BG removal (remove.bg API → @imgly local) only runs if client-side fails

Blockers:

- None

---

## Completed — Phase 2 Feature

### Unit 16 — AI Outfit Generator (Completed)

- Added `isAiGenerated Boolean @default(false)` to `Outfit` Prisma model; schema pushed and client regenerated.
- Created `services/outfit-generation/` with `types.ts`, `prompts.ts`, and `generate-outfits.ts` — metadata-only Gemini call (no vision), returns 6–8 outfit combinations as structured JSON.
- Created `POST /api/outfits/generate` — rate-limited (1/min), requires ≥3 classified garments, runs duplicate detection via garment-ID fingerprints, saves valid outfits with `isAiGenerated: true`.
- Added AI Generated badge (Sparkles icon) to `OutfitCard` for generated outfits.
- Extended `TodaysRecommendations` cold-start state with "Generate Looks" button (shown when user has garments but no outfits); includes inline loading and error feedback.
- Added "Generate Looks" button to the Saved Outfits tab header in the Wardrobe Studio.
- Updated test suite helper (`makeOutfit`) for new `isAiGenerated` field — 17/17 tests passing.
- TypeScript strict-mode clean across all changed files.

---

## Completed — Phase 2 Feature (Unit 17)

### Unit 17 — Occasion-Aware Recommendations (Completed)

- Added `occasion String?` field to `Outfit` Prisma model; schema pushed and Prisma client regenerated.
- Exported `Occasion` union type and `OCCASIONS` constant from `backend/src/types/index.ts`.
- Added `OCCASION_GROUPS` constant and `requestedOccasion` 6th parameter to `scoreOutfit()` — exact match: +25, compatible group: +12, conflict: −15. No regression when `requestedOccasion` is omitted.
- Updated `explainRecommendation()` to accept `requestedOccasion` and append occasion phrase ("A strong match for X." / "Works well for X.") when score is positive; conflict (−15) is silently omitted.
- Updated `rankOutfits()` to accept and thread `requestedOccasion` through to both `scoreOutfit()` and `explainRecommendation()`.
- Created `services/recommendation/infer-occasion.ts` — rule-based occasion inference from garment `style`/`subcategory`; returns `null` when no clear signal.
- Extended `services/outfit-generation/types.ts`: added `occasion?: string | null` to `GeneratedOutfit`.
- Extended `generate-outfits.ts`: accepts optional `occasion` parameter, passes it to `buildGenerationPrompt()`, and sets occasion on each result (explicit if provided, inferred via `inferOccasion()` otherwise).
- Updated `prompts.ts`: appends occasion context line to Gemini system prompt when occasion is provided.
- Extended `GET /api/recommendations` to read `?occasion=` query param and pass to `rankOutfits()`.
- Extended `POST /api/outfits` to accept and persist `occasion` (validated against the 6 valid values).
- Extended `PATCH /api/outfits/[id]` to accept and validate `occasion`; returns `400` for invalid strings.
- Extended `POST /api/outfits/generate` to accept optional `occasion` in request body and pass to `generateOutfits()`.
- Added horizontally scrollable occasion picker pill row (All + 6 occasion pills) above recommendation cards in `TodaysRecommendations`; selection persisted in `localStorage` as `stylesync_occasion` and restored on mount.
- Added Occasion dropdown to `OutfitBuilderDialog` below the Styling Notes textarea; saves via `PATCH /api/outfits/[id]`.
- Added occasion badge (`bg-muted/40`, uppercase tracking) to `OutfitCard` info section below last worn date.
- Updated `makeOutfit()` test helper to include `occasion` field — 17/17 tests passing, no TypeScript errors.

---

---

## Completed — Phase 2 Feature

### Unit 18 — Weekly Outfit Planner (Completed)

- Added `OutfitPlan` model to `prisma/models/outfit-plan.prisma` with `(userId, plannedDate)` unique constraint; schema pushed and Prisma client regenerated.
- Added `plans OutfitPlan[]` reverse relation on `Outfit` model.
- Added `OutfitPlan` interface to `backend/src/types/index.ts`.
- Created `backend/src/services/planner/get-week-range.ts` utility (ISO week resolution, `toDateString` helper).
- Exported new `./planner` entry point from `@style-sync/backend` package.
- Created `GET /api/planner` — fetches the user's plans for a given week window (default: current week).
- Created `POST /api/planner` — upserts a plan by `(userId, plannedDate)`; validates outfitId ownership and occasion.
- Created `DELETE /api/planner/[id]` and `PATCH /api/planner/[id]` with ownership checks.
- Created `PlannerDayCard` component — compact collage thumbnail, outfit name, occasion badge, hover actions (change/remove).
- Created `EmptyDaySlot` component — dashed placeholder with "Pick outfit" and "Suggest" actions; past-day read-only state.
- Created `OutfitPickerSheet` component — dialog with occasion pill filter and outfit grid.
- Created `/editor/planner` page — 7-column ISO week grid, week navigation, deep-linkable via `?week=YYYY-MM-DD`, Suspense boundary for `useSearchParams`.
- Suggestion flow reads `stylesync_occasion` from localStorage (same key as dashboard) and calls existing `/api/recommendations` for the top result.
- Added "Planner" nav link to `EditorNavbar`.
- `npm run build` passes (22 routes, 0 TypeScript errors).

---

---

## Completed — Phase 1.5 Hardening

### Unit 20 — Zod Validation Layer (Completed)

- Installed `zod` in the `frontend/` workspace.
- Created `frontend/lib/schemas.ts` — single, auditable schema library with `zodError` helper and all route schemas: `UpdateGarmentSchema`, `CreateOutfitSchema`, `UpdateOutfitSchema`, `GenerateOutfitsSchema`, `RecommendationsQuerySchema`, `CreatePlanSchema`, `UpdatePreferencesSchema`, `OnboardingSchema`.
- Replaced all manual `if (!field)` / `typeof` body guards in 8 API route handlers with `schema.safeParse()`:
  - `PATCH /api/garments/[id]` — `UpdateGarmentSchema` (enum for category, tags array, strict)
  - `POST /api/outfits` — `CreateOutfitSchema` (garmentId CUID array, occasion enum)
  - `PATCH /api/outfits/[id]` — `UpdateOutfitSchema` (refine rejects empty payloads)
  - `POST /api/outfits/generate` — `GenerateOutfitsSchema` (optional body)
  - `GET /api/recommendations` — `RecommendationsQuerySchema` (coerce lat/lon from strings)
  - `POST /api/planner` — `CreatePlanSchema` (CUID outfitId, YYYY-MM-DD date regex)
  - `POST /api/preferences` — `UpdatePreferencesSchema` (strict, includes threshold)
  - `POST /api/onboarding/complete` — `OnboardingSchema` (min 1 style and color required)
- All invalid bodies now return `{ success: false, error: "<message>" }` with status `400`.
- Fixed pre-existing TypeScript error in `backend/src/services/insights/get-most-worn-outfits.ts`: added `toOccasion()` narrowing function to convert `string | null` → `Occasion | null` at the mapping site.
- Fixed `Occasion | null` type mismatch in `backend/__tests__/services/recommendation/score-outfit.test.ts` test helper.
- `npx tsc --noEmit` — zero errors (frontend and backend).
- 17/17 backend tests passing.
- `npm run build` passes.

---

---

## Completed — Phase 1.5 Hardening

### Unit 21 — TanStack Query Migration (Completed)

- Installed `@tanstack/react-query` and `@tanstack/react-query-devtools` in the `frontend/` workspace.
- Created `frontend/components/providers.tsx` — `QueryClientProvider` wrapper with `staleTime: 60s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`; `ReactQueryDevtools` shown in development only.
- Wrapped `frontend/app/layout.tsx` root body in `<Providers>`.
- Created `frontend/lib/query-keys.ts` — typed `QK` constant for garments, garment, outfits, recommendations, planner, insights, wearHistory, preferences.
- Created 6 query hooks in `frontend/lib/hooks/`: `useGarments`, `useOutfits`, `useRecommendations`, `usePlanner`, `useInsights`, `useWearHistory`.
- Created 9 mutation hooks in `frontend/lib/hooks/`: `useToggleGarmentFavorite` (optimistic), `useToggleOutfitFavorite` (optimistic), `useCreateOutfit`, `useUpdateOutfit`, `useDeleteOutfit`, `useGenerateOutfits`, `useWearOutfit`, `useLikeDislike`, `useShareOutfit`/`useRevokeShare`.
- Migrated `app/editor/wardrobe/page.tsx` — all `useState + useEffect + fetch` patterns replaced; favorite toggles use optimistic updates; generate/share/revoke use mutation hooks; upload and outfit-builder success callbacks use `queryClient.invalidateQueries`.
- Migrated `app/editor/page.tsx` — garment and outfit sidebar data use `useGarments`/`useOutfits`.
- Migrated `components/recommendation/todays-recommendations.tsx` — geolocation drives `location` state feeding `useRecommendations`; occasion changes auto-trigger refetch via key change; wear/like/dislike use mutation hooks that invalidate `["recommendations"]`; weather refresh uses `refetch()`; `GenerateLooksButton` invalidates outfits + recommendations on success.
- Migrated `app/editor/planner/page.tsx` — plan data uses `usePlanner(weekKey)`; assign and remove operations call `queryClient.invalidateQueries` after server mutations.
- Migrated `app/insights/page.tsx` — insights, garments, outfits all use query hooks.
- Migrated `app/history/page.tsx` — history, garments, outfits use query hooks; clear-all and delete-entry use `queryClient.invalidateQueries({ queryKey: QK.wearHistory() })`.
- No `useEffect(() => { fetch(...) }, [])` patterns remain in any migrated page.
- `npx tsc --noEmit` — zero errors. `npm run build` passes (34 routes, 0 TypeScript errors).

---

---

## Completed — Phase 1.5 Hardening

### Unit 22 — Tests & CI (Completed)

- Extracted `validateGeneratedOutfit()` pure helper from `services/outfit-generation/generate-outfits.ts` — added bottomwear/footwear category-exclusivity checks and fingerprint deduplication parameter; updated `generateOutfits()` filter to use it.
- Created shared test fixture factory (`backend/src/services/recommendation/__tests__/fixtures.ts`) — `makeGarment`, `makeOutfit`, and four weather constants.
- Extended existing `backend/__tests__/services/recommendation/score-outfit.test.ts` with 5 occasion-scoring tests (exact match +25, compatible group +12, conflict −15, null no-op, untagged outfit neutral).
- Created `backend/src/services/recommendation/__tests__/infer-occasion.test.ts` — 7 tests covering Formal, Active, Blazer subcategory, Smart Casual majority, Casual majority, mixed null, empty list.
- Created `backend/src/services/recommendation/__tests__/rank-outfits.test.ts` — 6 tests: empty input, count preserved, higher-scoring first, tie-breaking by createdAt desc, explanation attached, occasion threaded through.
- Created `backend/src/services/outfit-generation/__tests__/validate-outfit.test.ts` — 18 tests: shape checks (missing name/reason/garmentIds, 0/1/>5 garments, hallucinated IDs), category exclusivity (2× bottomwear, 2× footwear), fingerprint deduplication (order-independent, existing match, no-set passthrough, all-invalid → empty).
- Created `backend/src/services/preferences/__tests__/update-profile.test.ts` — 9 tests for `buildProfile()`: empty history, wear-score threshold inclusion, ranking order, dislike exclusion, per-category cap (≤5), configurable threshold.
- Created `frontend/lib/__tests__/schemas.test.ts` — 18 tests for Zod schemas: `CreateOutfitSchema` (empty array, invalid occasion, all 6 valid occasions, null), `UpdateOutfitSchema` (empty object rejection, partial update, name length), `RecommendationsQuerySchema` (string coercion, out-of-range lat, boundary values, optional fields), `OnboardingSchema` (empty styles, >10 colors, minimal valid, empty colors).
- Added `frontend/vitest.config.ts` with `environment: "node"` and `globals: true`; mocked `next/server` in schema tests.
- Added `vitest: "^4.1.8"` to `frontend/devDependencies`; added `"test": "vitest run"` and `"typecheck": "tsc --noEmit"` to `frontend/package.json` scripts.
- Updated root `package.json`: `"test"` → `npm test --workspaces --if-present`; added `"typecheck"` → `npm run typecheck --workspaces --if-present`.
- Created `.github/workflows/ci.yml` — typecheck (backend + frontend) → test (backend) → build (frontend) with all secrets injected; triggers on push/PR to `main` and `development`.
- **79/79 tests passing** (61 backend + 18 frontend); `npm test` from root runs all.

---

## Next Up

### Avatar / Virtual Try-On (Phase 3)

Or continue Phase 2 intelligence layer (outfit export).

---

## Open Questions

### Product Decisions

- Should users manually edit AI-generated clothing metadata?
- How much randomness should outfit recommendations include?
- Should users rate outfits to improve recommendations?
- Will wardrobes support multiple styles (streetwear, formal, gym)?
- Should outfit recommendations avoid recently worn items?

### Technical Decisions

- Should recommendations run synchronously or via queue jobs?
- Which avatar provider is preferred for MVP:
  - Ready Player Me
  - Avaturn

---

## Architecture Decisions

### Monorepo Architecture

Decision:
Use Turborepo + pnpm.

Why:
Enables scalable separation of frontend, backend, and AI services.

---

### Database Strategy

Decision:
PostgreSQL + pgvector.

Why:
Supports relational wardrobe modeling and vector similarity search without adding extra infrastructure.

---

### Recommendation System

Decision:
Hybrid recommendation architecture.

Flow:

1. Rule-based filtering
2. Embedding similarity matching
3. LLM-generated explanation

Why:
Improves consistency and explainability.

---

### AI Processing

Decision:
Use background queues for image processing.

Why:
Avoid blocking uploads and maintain fast UX.

---

### 3D Avatar Scope

Decision:
Defer advanced virtual try-on until after MVP.

Why:
Avoid unnecessary complexity early.

---

## Session Notes

Current product direction:

**AI-powered digital wardrobe platform** where users:

- Upload owned clothes
- Build wardrobes
- Receive personalized outfit recommendations
- Get weather-aware suggestions
- Eventually create a scanned 3D avatar for virtual try-on

Current engineering priority:

**Ship the wardrobe + recommendation engine first.**

Do not start avatar rendering before recommendation quality is strong.

---

### 2026-06-02 — Backend extracted into a workspace package

- Restructured the repo into npm workspaces: root `package.json` with
  `["frontend", "backend"]`.
- Created `backend/` package (`@style-sync/backend`) holding all server-side
  business logic, moved out of the Next.js app:
  - `src/services/**` (classification, recommendation, preferences, weather,
    insights, outfit-generation, background-removal, wear/recommendation
    history)
  - `src/lib/**` (`prisma`, `cloudinary`, `rate-limit`, `retry`)
  - `src/types/index.ts` (canonical shared domain types)
  - `prisma/**` + `prisma.config.ts` (Prisma now owned by backend; loads env
    from `frontend/.env` as the single source of truth)
  - `__tests__/**` + `vitest.config.ts` (recommendation scoring tests, 17/17)
- Backend exposes two entry points: `.` (server barrel — `src/index.ts`) and
  `./types` (runtime-free, safe for Client Components).
- Frontend `app/api/**` route handlers and the server page/component now import
  from `@style-sync/backend`; backend-internal imports are relative so Next's
  bundler resolves them.
- `frontend/types/index.ts` re-exports `@style-sync/backend/types`, so all
  existing `@/types` imports keep working unchanged.
- `next.config.ts` gains `transpilePackages: ["@style-sync/backend"]`.
- Verified: backend typecheck clean, 17/17 tests pass, frontend typecheck clean,
  `next build` succeeds (19 API routes + pages).

### 2026-06-02 — Auth (Clerk) restyle

- Switched Clerk sign-in/sign-up from the `dark` theme to the light
  sand/sage editorial palette (cream card `#fffefb`, sand bg `#faf6f0`,
  olive-green primary `#46553d`, sage accent `#708272`).
- Migrated `ClerkProvider` appearance to the current `@clerk/ui` v1.14
  variable names (`colorInput`, `colorInputForeground`,
  `colorPrimaryForeground`, etc.); removed legacy/ignored keys.
- Rebuilt both auth pages as a centered single column: serif "StyleSync
  AI" wordmark, then a cream card holding the editorial heading
  (italic sage "daily silhouette" accent) with Clerk's own
  header/card chrome stripped so the form blends into the card.
