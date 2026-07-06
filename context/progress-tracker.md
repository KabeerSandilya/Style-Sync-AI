# Progress Tracker

Update this file after every meaningful implementation change.

---

## Current Phase

**Phase 1 (Complete) / Phase 1.5 Hardening (Complete) / Phase 3 (Complete)**

Goal: Phase 1 MVP and the Phase 1.5 hardening pass are both done. Sprint 1
(Infrastructure: Redis cache/rate limiting, durable job queue), Sprint 2
(Intelligence: Style DNA, Capsule Audit, Ask the Stylist), and Sprint 3
(Expression: Look Book, Flat Lay Builder, Community Style Feed) are all
complete — every feature in the Phase 3 roadmap (F1–F7) is now built.

---

## Current Goal

Phase 3 is fully shipped. No spec is queued yet for the next phase — see
"Next Up" below.

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

## Completed — Phase 2 Feature

### Unit 19 — Outfit Export & Sharing (Completed)

- Added `shareToken String? @unique` to the `Outfit` Prisma model; schema pushed and Prisma client regenerated.
- Installed `html-to-image`; created `frontend/lib/export-outfit.ts` — `exportOutfitAsPng(outfit, node)` renders the off-screen card to a 1200×675 PNG (`cacheBust`, `pixelRatio: 1`) and triggers a browser download named after the outfit.
- Created `frontend/components/editor/outfit-export-card.tsx` — fixed-dimension, pure presentational card (header wordmark, up to 6-garment image grid with `+N more` overflow, outfit name, occasion/piece-count/date meta row, notes excerpt, watermark) used only as the off-screen render target.
- Created `POST` / `DELETE` `frontend/app/api/outfits/[id]/share/route.ts` — owner-only (Clerk auth + `userId` ownership check); `POST` generates a `randomUUID()` token on first call (idempotent — returns the existing token on repeat calls) and returns `{ url, token }`; `DELETE` nulls the token to revoke.
- Deviated from the original spec's `GET /api/public/outfits/[token]` API route: the public share page fetches directly via `prisma.outfit.findUnique({ where: { shareToken } })` in a Server Component instead, avoiding an extra network hop. Selects only `name`, `notes`, `occasion`, `createdAt`, and `garments[].garment.{imageUrl, processedImageUrl, category, name}` — no `userId` exposed.
- Created `/share/[token]` public page (`frontend/app/share/[token]/page.tsx`) — Server Component, no Clerk guard, `notFound()` on invalid/revoked token; `generateMetadata()` builds Open Graph/Twitter card tags (title, occasion + piece-count description, first garment image) for link unfurling.
- Created `frontend/components/share/shared-outfit-view.tsx` — presentational read-only view for the public page (full garment grid, notes, meta, discovery CTA), no sign-in prompt.
- Added Export (`Download` icon) and Share (`Share2` icon, `Link2Off` revoke icon) hover actions to `<OutfitCard />`; a "Shared" badge renders when `outfit.shareToken` is set.
- Added `useShareOutfit` / `useRevokeShare` mutation hooks (alongside the rest of the Unit 21 TanStack migration) invalidating outfit queries on success.
- Renamed the Next.js middleware file from `proxy.ts` to `middleware.ts` and added `/share/(.*)` to the public-route matcher so shared outfit links load without a Clerk sign-in redirect.
- Out of scope (per spec): social-platform posting integrations, multi-outfit share pages, QR codes, password-protected links.

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

---

## Completed — Sprint 1 Infrastructure

### Unit 23 — Redis-backed Cache & Rate Limiting (Completed)

- Installed `@upstash/redis` and `@upstash/ratelimit` in `backend/`.
- Created `backend/src/lib/redis.ts` — `getRedis()` singleton; returns `null` when env vars absent so local dev never crashes.
- Replaced fixed-window `Map` in `backend/src/lib/rate-limit.ts` with Upstash sliding-window via `@upstash/ratelimit`; `isRateLimited()` is now `async` with in-memory `Map` fallback when Redis is unavailable.
- Updated all five `isRateLimited()` call sites with `await`: `POST /api/upload`, `POST /api/outfits/generate`, `POST /api/garments/[id]/classify`, `POST /api/garments/[id]/remove-background`, `PATCH /api/outfits/[id]`.
- Replaced module-level `weatherCache` Map in `backend/src/services/weather/index.ts` with Redis `GET`/`SET` (15-min TTL, `stylesync:weather:*` prefix); in-memory `Map` kept as fallback.
- Created `backend/src/lib/cache/style-dna.ts` — `getCachedStyleDNA` / `setCachedStyleDNA` / `invalidateStyleDNACache` with 24-hour TTL (F1 prep; not yet wired to routes).
- Created `backend/src/lib/cache/capsule-audit.ts` — `getCachedCapsuleAudit` / `setCachedCapsuleAudit` / `invalidateCapsuleAuditCache` with 6-hour TTL (F2 prep; not yet wired to routes).
- Documented `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `frontend/.env.example`; live Upstash credentials added to `frontend/.env.local`.
- All Redis keys use `stylesync:` namespace prefix to avoid collisions on a shared instance.
- Backend `npx tsc --noEmit` — zero errors. Frontend `npx tsc --noEmit` — zero errors.
- `npm run build` passes (34 routes). 79/79 tests passing (61 backend + 18 frontend).

---

---

## Completed — Sprint 1 Infrastructure

### Unit 24 — Durable AI Job Queue / QStash (Completed)

- Installed `@upstash/qstash` in `frontend/` workspace.
- Created `frontend/lib/qstash.ts` — `getQStash()` singleton (returns `null` when `QSTASH_TOKEN` absent); `getAppUrl()` helper for constructing absolute worker URLs.
- Created `POST /api/jobs/classify` worker — verifies QStash HMAC-SHA256 signature via `Receiver`, idempotency-checks `garment.isProcessed`, calls `classifyGarment` via `withRetry`, persists metadata. Returns 200 on already-processed garments.
- Created `POST /api/jobs/remove-background` worker — same signature verification pattern, idempotency-checks `garment.bgRemovedAt`, calls `removeBackground` via `withRetry`, uploads result to Cloudinary, persists `processedImageUrl` and `bgRemovedAt`.
- Updated `POST /api/upload` — both `after()` blocks replaced with `qstash.publishJSON()` (3 retries) when QStash is configured; `after()` blocks preserved as local-dev fallback when `getQStash()` returns `null`.
- Workers return `401` on invalid signature (QStash does not retry 4xx); any 5xx triggers QStash exponential-backoff retry (up to 3 attempts).
- Added `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `NEXT_PUBLIC_APP_URL` to `frontend/.env.example`.
- `npx tsc --noEmit` — zero errors. `npm run build` passes (36 routes).

---

---

## Completed — Sprint 2 Intelligence

### Unit 25 — Style DNA Profile (Completed)

- Added `StyleDNA` Prisma model (`backend/prisma/models/style-dna.prisma`) with `userId @unique`, `archetype`, `colorStory` (JSON), `signaturePieces` (String[]), `styleKeywords`, `styleNarrative`, `wardrobeStrengths`, `blindSpots`, and `generatedAt`; schema pushed and Prisma client regenerated.
- Created `backend/src/services/style-dna/summarize.ts` — `buildWardrobeSummary()` aggregates classified garments into a compact token-efficient summary (categoryCounts, topColors, topStyles, seasonBreakdown, mostWornOutfits, dislikedPatterns, preferredOccasions); adapted for actual `RecommendationFeedback` schema (`feedbackType` LIKE/DISLIKE, direct `outfit` relation).
- Created `backend/src/services/style-dna/generate.ts` — `generateStyleDNA()` calls Gemini 2.5 Flash with a fashion-editor system prompt, validates all seven required fields, and filters `signaturePieces` to real garment IDs.
- Exported `buildWardrobeSummary`, `WardrobeSummary`, `generateStyleDNA`, `StyleDNAResult`, `getCachedStyleDNA`, `setCachedStyleDNA`, `invalidateStyleDNACache` from `backend/src/index.ts`.
- Created `GET /api/style-dna` — cache-first (Redis → DB); returns 404 when no record exists.
- Created `POST /api/style-dna` — gate: ≥10 classified garments (422); rate limit: 1 per 24h (429); upserts one record per user; invalidates and rewrites Redis cache.
- Created `/style-dna` page with empty state (dashed card, progress bar, disabled CTA), full-card skeleton loader, and editorial DNA card (archetype headline, style narrative, color swatches, keyword chips, signature piece thumbnails, strengths/blind-spots columns, regenerate footer with 24h lock).
- Added "Style DNA" nav link to `EditorNavbar`.
- `npx tsc --noEmit` — zero errors (backend and frontend).

---

### Unit 26 — Capsule Wardrobe Auditor (Completed)

- Created `backend/src/services/capsule/score-garments.ts` — `scoreGarments()` computes a Combinatorial Value Score (CVS) per processed garment from `outfitItems`/`OutfitWear`/`RecommendationFeedback` (weights: `OUTFIT_WEIGHT=4`, `WEAR_WEIGHT=6`, `LIKE_WEIGHT=3`, `DISLIKE_WEIGHT=-3`, `NEVER_WORN_PENALTY=-10`, named constants).
- Created `backend/src/services/capsule/tier-garments.ts` — `tierGarments()` groups garments into `workhorses` (top `ceil(20%)` of positive-CVS garments, min 1), `sleepingBeauties` (styled but never worn), `orphans` (zero outfits), and `unprocessedCount`.
- Created `backend/src/services/capsule/analyze-gaps.ts` — `analyzeWardrobeGaps()` mirrors the Style DNA (Unit 25) Gemini pattern exactly (`GoogleGenAI`, 2.5-flash → 2.0-flash 503 fallback, fenced-JSON extraction); validates `gaps` array and clamps `capsuleScore` to 0–100. Text-only — no garment images sent.
- Created `backend/src/services/capsule/purge-suggestions.ts` — `getPurgeSuggestions()` returns processed, zero-outfit garments older than 180 days; informational only, no auto-delete.
- Exported all four services + types and re-exported the existing `getCachedCapsuleAudit`/`setCachedCapsuleAudit`/`invalidateCapsuleAuditCache` (Unit 23 cache helpers, now wired) from `backend/src/index.ts`.
- Created `GET /api/insights/capsule` — Redis cache-first (6h TTL); computes `tierGarments`, `buildWardrobeSummary`, `getPurgeSuggestions` in parallel; catches Gemini failures and degrades `gapAnalysis` to `null` without failing the request. No POST/regenerate endpoint (cache TTL is the only refresh mechanism in v1).
- Added `QK.capsuleAudit()` to `frontend/lib/query-keys.ts` and created `frontend/lib/hooks/use-capsule-audit.ts` following the `useInsights` pattern.
- Added a "Wear Analytics" / "Capsule Audit" tab switcher to `/insights` (custom editorial-styled buttons, not the shadcn `Tabs` primitive, to keep the sharp zero-radius aesthetic). Capsule Audit tab renders: four tier stat tiles, Workhorses/Sleeping Beauties/Orphans grids (reusing the page's existing `GarmentCard`/`SectionHeader`), a Gap Recommendations card (large serif capsule score + italic reasons), and a closed-by-default collapsible Purge Suggestions list.
- `npx tsc --noEmit` — zero errors (backend and frontend). `npm run build` passes (37 routes, including `/api/insights/capsule`). Frontend `eslint` clean on all new/modified files.
- Ran `graphify update .` — graph re-extracted (6301 nodes, 8630 edges, 519 communities).

---

### Unit 27 — Ask the Stylist (Free-Text Query Recommendations) (Completed)

- Created `backend/src/services/recommendation/interpret-query.ts` — `interpretStyleQuery(query)` calls Gemini (2.5-flash → 2.0-flash on 503, same pattern as `generate-outfits.ts`/`style-dna/generate.ts`) to map a free-text query (e.g. "I'm going for a run") to the closest `Occasion` (or `null`) plus 3–6 lowercase keywords describing ideal garment attributes; validates occasion against `OCCASIONS` and caps/sanitizes keywords.
- Extended `scoreOutfit()` with an optional `queryKeywords` parameter — new "Query Keyword Match Bonus" (0–15 pts, reusing the existing `checkGarmentMatch()` helper) — purely additive, no regression when omitted.
- Extended `explainRecommendation()` with the same optional parameter — appends a deterministic "Tailored to match: …" sentence when keywords match a garment; no second LLM call for explanation text, keeping the "explainable before LLM enhancement" invariant.
- Threaded `queryKeywords` through `rankOutfits()`.
- Created `POST /api/recommendations/query` — interprets the query, ranks the user's existing saved outfits first; if the best score is `< 60` (or no outfits exist), falls back to `generateOutfits()` and persists a single freshly-assembled outfit (`isAiGenerated: true`) instead of a full batch. Rate-limited 5/min per user (`${userId}:ask-stylist`), mirrors `/api/outfits/generate`'s garment-count gate and fingerprint dedup logic.
- Added `QueryRecommendationSchema` to `frontend/lib/schemas.ts`.
- Extracted the collage renderer already duplicated inline in `TodaysRecommendations` into a shared `<OutfitCollage garments isMini />` component (`frontend/components/recommendation/outfit-collage.tsx`), used by both `TodaysRecommendations` and the new dialog.
- Created `frontend/lib/hooks/use-ask-stylist.ts` and `frontend/components/recommendation/ask-stylist-dialog.tsx` (built on the existing `EditorialDialog` primitive) — free-text textarea, interpreted occasion/keyword chips, outfit result (match % for existing outfits, "Freshly assembled for you" badge for generated ones), Wear/Like/Dislike actions reusing `useWearOutfit()`/`useLikeDislike()`.
- Wired `<AskStylistDialog />` as a distinct entry point above the occasion-pill row in `TodaysRecommendations` (not merged into the pills), reusing the same geolocation/city `location` state already resolved there.
- Exported `interpretStyleQuery`/`QueryInterpretation` from `backend/src/index.ts`.
- `npx tsc --noEmit` — zero errors (backend and frontend). 61/61 backend tests, 18/18 frontend tests passing (all pre-existing, unaffected — new params are optional/additive). `npm run build` passes (38 routes, including `/api/recommendations/query`).

---

### Unit 28 — Look Book / Style Journal (Completed)

- Added `LookBookEntry` Prisma model (`backend/prisma/models/look-book.prisma`) with `outfitId` (`onDelete: SetNull` — deleting an outfit unlinks the journal entry instead of deleting it), `photoUrl`, `date`, `rating`, `mood: String[]`, `notes`, `isShareable`; added `lookBookEntries LookBookEntry[]` reverse relation on `Outfit`; schema pushed and Prisma client regenerated.
- Added `MOOD_TAGS`/`MoodTag` (7 fixed tags: Confident, Comfortable, Underdressed, Overdressed, Effortless, Bold, Casual) and a `LookBookEntry` interface to `backend/src/types/index.ts`; exported from `backend/src/index.ts`.
- Created `POST /api/lookbook` — single combined `multipart/form-data` endpoint (photo + metadata in one request, avoiding an orphaned Cloudinary asset if a two-step flow were abandoned midway); manual field validation mirroring `POST /api/upload`'s established pattern rather than Zod (FormData values are strings, not JSON); uploads to `stylesync/lookbook/{userId}` via Cloudinary with Base64 DB fallback when unconfigured; verifies `outfitId` ownership (404 if not owned).
- Created `GET /api/lookbook` — cursor-paginated (`id`-based cursor, `orderBy: [date desc, id desc]`), validated via new `LookBookQuerySchema`; filters `month`/`mood`/`rating`/`occasion` (through `outfit.occasion`) composable independently.
- Created `GET/PATCH/DELETE /api/lookbook/[id]` — ownership-checked; `GET` includes the linked outfit's garments; `PATCH` uses new `UpdateLookBookEntrySchema` (no photo replacement in v1, per spec); `DELETE` best-effort destroys the Cloudinary asset (extracts `public_id` from the secure URL, non-fatal on failure) then deletes the row.
- Added `QK.lookBook(filters)` / `QK.lookBookEntry(id)` to `query-keys.ts` and created `frontend/lib/hooks/use-lookbook.ts` — `useLookBookEntries` (`useInfiniteQuery`), `useLookBookEntry`, `useCreateLookBookEntry`/`useUpdateLookBookEntry`/`useDeleteLookBookEntry` mutations.
- Created `frontend/components/lookbook/lookbook-card.tsx` (photo, linked outfit name, date, star rating, mood chips) and `add-to-lookbook-dialog.tsx` (built on `<EditorialDialog />`; drag-and-drop photo picker reusing the upload-dialog styling, 1–5 star control, mood multi-select chips, notes textarea).
- Wired "Add to Look Book" as a full-width action in `<HistoryDetailDialog />`, pre-filling `outfitId`/`date` from the wear record being viewed; added a generic `onToast` prop (distinct from the delete-specific `onDeleteSuccess`) threaded from `app/history/page.tsx`.
- Created `/lookbook` (infinite-scroll grid via `IntersectionObserver` sentinel, month/mood/rating/occasion pill filters, empty and skeleton states) and `/lookbook/[id]` (full photo, rating, mood, notes, "View linked outfit" link or "not linked" state, delete action) pages.
- Added "Look Book" nav link to `EditorNavbar`.
- Deviated from the spec's Zod-schema section: `CreateLookBookEntrySchema` (with a `photoUrl: z.string().url()` field) wasn't implemented as written, since the combined multipart endpoint uploads the photo *within* the same request that validates metadata — there is no prior `photoUrl` to validate against. Manual validation is used for `POST` instead, consistent with `POST /api/upload`'s existing precedent for multipart routes; Zod (`UpdateLookBookEntrySchema`, `LookBookQuerySchema`) is used for the JSON/query-param routes as specced.
- `npx tsc --noEmit` — zero errors (backend and frontend). `npm run build` passes (40 routes, including `/api/lookbook`, `/api/lookbook/[id]`, `/lookbook`, `/lookbook/[id]`). 61/61 backend tests, 18/18 frontend tests passing (pre-existing, unaffected). ESLint clean on all new/modified files.

---

### Unit 29 — Flat Lay Builder (Completed)

- Created `frontend/lib/export-flat-lay.ts` — `FlatLayItem`/`CaptionLayer` types, `findUnoccupiedPosition`-style helpers live in the page (see below), and `exportFlatLay(items, images, caption, options)`: rasterizes the 1200×1200 internal composition onto an off-screen `<canvas>` sized 1200×1200 (1:1) or 1080×1350 (4:5, letterboxed top/bottom — content is never cropped), drawing items in ascending `zIndex` with `ctx.scale(-1,1)` per-item for `flippedX`, an optional caption via `ctx.fillText` (font resolved from the app's existing `--font-serif` CSS variable, loaded via `document.fonts.load()` before drawing), and a 20%-opacity bottom-right watermark unless toggled off; exports via `canvas.toBlob` → `URL.createObjectURL` → click-to-download, mirroring `exportOutfitAsPng` (Unit 19). Also exports `loadFlatLayImage()` (sets `crossOrigin="anonymous"`) so every item's `Image` object is preloaded once at add-time (init or "Add from wardrobe") and reused at export instead of being re-fetched per click.
- Created `frontend/components/flat-lay/flat-lay-item.tsx` (`<FlatLayItemView />`) — a single garment image as an absolutely-positioned `<img>` using native pointer events (`onPointerDown`/`onPointerMove`/`onPointerUp`, `setPointerCapture`) for drag (converts screen-space pointer delta to canvas-space via a `scale` prop) and a single corner resize handle (width-driven, height derived from the item's cached `aspectRatio` — never re-measures `naturalWidth`/`naturalHeight` mid-drag); a floating toolbar (shown only when selected) with Bring Forward / Send Back (swaps `zIndex` with the adjacent item in stacking order) and Flip (`scaleX(-1)`) buttons; all interactive sub-elements call `stopPropagation` on `pointerdown` so drag/resize/toolbar/canvas-background-deselect don't fight each other.
- Created `frontend/app/editor/flat-lay/[outfitId]/page.tsx` — resolves the outfit client-side from the already-cached `useOutfits()` list (`useParams<{ outfitId: string }>()`, no `GET /api/outfits/[id]` route added, per spec); dashed-card skeleton while `useOutfits()` is loading, "Combination not found" empty state (link back to `/editor/wardrobe?view=outfits`) when the id doesn't resolve. Seeds one `FlatLayItem` per garment on mount via a sequential non-overlapping 3×3-grid placement helper (`findUnoccupiedPosition`, AABB-overlap-tested, reused for "Add from wardrobe" additions so both paths share one algorithm). Custom top bar (no `EditorNavbar`/`ProjectSidebar` — a focused full-page tool, consistent with `/share/[token]` having no nav entry) with back link, caption text input (Cormorant Garamond italic, `font-serif` utility), white/cream background toggle (`FLAT_LAY_BACKGROUND_COLORS`, shared between on-screen canvas and export for WYSIWYG), 1:1/4:5 export ratio toggle, watermark on/off toggle, and Export button. "Add from Wardrobe" reuses the `OutfitPickerSheet` (Unit 18) dialog-grid visual pattern, filtered to garments not already on the canvas. Canvas container uses a `ResizeObserver` to compute a `scale` factor (rendered px ÷ 1200 canvas-space) shared by drag/resize math and the caption's position-only drag.
- Added `onFlatLay?: (outfit: Outfit) => void` prop and a `LayoutGrid` (lucide-react) hover-action button to `<OutfitCard />` (alongside Export/Share/Revoke), threaded through `<OutfitGrid />`, and wired in `frontend/app/editor/wardrobe/page.tsx` to `router.push('/editor/flat-lay/' + outfit.id)`.
- No new npm dependency, no new Prisma model, no new API route — composition state is ephemeral (discarded on navigation), matching the spec's "no new DB models" constraint.
- `npx tsc --noEmit` — zero errors. ESLint clean on all new/modified files. `npm run build` passes (registers `/editor/flat-lay/[outfitId]` as a dynamic route, 41 routes total).
- Verification note: could not drive a full authenticated browser click-through in this sandbox — the app is Clerk-protected (`pk_test_*`) and no test credentials were available; scripted `curl` confirmed the route is intercepted by Clerk's dev-browser handshake (not a 500/crash) rather than a broken page. Recommend a manual click-through in an already-logged-in browser session to confirm the drag/resize/export UX feels right.

### Unit 30 — Community Style Feed (Completed)

- Added `CommunityProfile`, `CommunityPost`, `CommunityLike`, `InspirationSave` Prisma models (`backend/prisma/models/community.prisma`); `CommunityPost.userId` relates to `CommunityProfile.userId` (first non-id-field relation in the schema); `CommunityPost.sourceLookBookEntryId` is `@unique` so publishing the same Look Book entry twice is idempotent (upsert), mirroring the `Outfit.shareToken` precedent (spec 19); schema pushed and Prisma client regenerated.
- Added `CommunityProfile`/`CommunityPost` interfaces to `backend/src/types/index.ts`, re-exported from `backend/src/index.ts`.
- Deviated from the spec's literal `CommunityPost` type: the spec's own Constraints section and "Check When Done" criteria explicitly forbid exposing `userId` on any `/api/community*` payload ("only `photoUrl`, `caption`, `occasion`, and the profile's `displayName`/`avatarUrl` are public"), which conflicts with the spec's Types code block that included a raw `userId: string` field. Followed the explicit security constraint: omitted `userId` from the client-facing type/payload and added a derived `isOwnPost: boolean` instead (same pattern as `isLikedByViewer`/`isSavedByViewer`/`shareToken`), so `<CommunityPostCard />` can still gate its delete action without leaking another user's Clerk ID.
- Added `UpsertCommunityProfileSchema`, `CreateCommunityPostSchema`, `CommunityFeedQuerySchema` to `frontend/lib/schemas.ts`; added `QK.communityProfile()`/`QK.communityFeed(filters)` to `query-keys.ts`.
- Created `GET/POST /api/community/profile` — `GET` returns `{ data: null }` (never 404) when no profile exists yet; `POST` upserts by `userId`, no rate limit (same tier as `PATCH /api/garments/[id]`).
- Created `GET/POST /api/community` — `POST` (publish) requires an existing `CommunityProfile` (422 if missing), validates the source `LookBookEntry`'s ownership and `isShareable` flag, upserts by `sourceLookBookEntryId` (idempotent republish updates caption/occasion), defaults `occasion` to the linked outfit's occasion, rate-limited 10/min. `GET` handles three shapes: `tab=feed&sort=newest` (cursor-paginated), `tab=feed&sort=trending` (top-200 candidate pool, 7-day like count computed via a filtered `_count`, sorted in JS, capped to top 20 — mirrors the Insights page's fixed "Most Worn" list rather than inventing keyset pagination over a non-monotonic sort key), and `tab=saved` (the caller's `InspirationSave` rows, same cursor shape as newest, ignoring the `profile.isPrivate` filter so previously-saved posts stay visible even if the poster later goes private). A narrow `?sourceLookBookEntryId=` lookup (not the paginated feed) powers the "already published?" check on `/lookbook/[id]`.
- Created `POST /api/community/[id]/like` and `.../save` — toggle endpoints (create-or-delete on `(userId, postId)`), no rate limit.
- Created `DELETE /api/community/[id]` — ownership-checked hard delete; cascades `CommunityLike`/`InspirationSave` via `onDelete: Cascade`; does not touch the source `LookBookEntry` or its `isShareable` flag.
- Created `frontend/lib/hooks/use-community.ts` — `useCommunityProfile`, `useUpsertCommunityProfile`, `useCommunityPostBySource` (the narrow lookup), `usePublishToCommunity`, `useCommunityFeed(filters)` (branches internally: `useInfiniteQuery` for `sort: "newest"`/`tab: "saved"`, plain `useQuery` for the fixed-length `sort: "trending"` — deviated from the spec's hook description, which said saved should be non-cursor, but the spec's own backend/page sections both describe Saved as cursor-paginated with an `IntersectionObserver` sentinel, so followed those over the hook prose), `useLikePost`/`useSavePost`/`useDeleteCommunityPost`.
- Created `frontend/components/community/community-post-card.tsx`, `community-profile-setup.tsx` (inline form sourcing default display name/avatar from Clerk's `useUser()` — first read of its profile fields in the app), and `publish-to-community-dialog.tsx` (built on `<EditorialDialog />`; two-step — profile setup skipped once a profile exists — caption + occasion picker prefilled from the linked outfit's occasion).
- Created `/community` page — `EditorNavbar`/`ProjectSidebar` shell matching `/lookbook`; Feed/Saved tab switcher (Capsule Audit tab-switcher pattern, Unit 26) with a Trending toggle (Feed only) and an occasion pill row; infinite-scroll grid for Newest/Saved, fixed top-20 for Trending; standalone "Edit Community Profile" entry point in the header.
- Wired a "Publish to Community" / "Update Community Post" action into `/lookbook/[id]`, shown only when `entry.isShareable` is true; republishing opens the same dialog prefilled from the existing post rather than navigating away.
- Added "Community" link to `EditorNavbar`'s `secondaryItems`, after "Look Book".
- `npx tsc --noEmit` — zero errors (backend and frontend). `npm run build` passes (44 routes, including all five `/api/community*` endpoints and `/community`). 81/81 pre-existing tests passing (61 backend + 20 frontend), unaffected. ESLint clean on all new/modified files (pre-existing errors in untouched files are unrelated).
- This completes every feature in the Phase 3 roadmap (F1–F7).

---

## Next Up

No spec queued yet for the next phase.

### Later — Phase 3 Avatar

Avatar / Virtual Try-On remains deferred until the Sprint 3 expression layer and recommendation quality are solid (see Architecture Decisions below).

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
