# Progress Tracker

Update this file after every meaningful implementation change.

---

## Current Phase

**Phase 1 — MVP Foundation (In Progress)**

Goal: Build the core digital wardrobe and recommendation system before advanced intelligence and 3D avatar systems.

---

## Current Goal

Build the **wardrobe upload pipeline** end-to-end.

Current target:

1. User authentication
2. Clothing upload flow
3. Cloudinary image storage
4. Background removal
5. Clothing metadata extraction
6. Save processed clothing item to wardrobe

Success criteria:

* User uploads clothing item
* Clothing image is processed asynchronously
* Metadata is extracted automatically
* Item appears in wardrobe with tags

---

## Completed

### Product Architecture

* Defined scalable system architecture.
* Finalized monorepo structure.
* Selected technology stack:

  * Next.js
  * NestJS
  * PostgreSQL
  * Prisma
  * pgvector
  * Cloudinary
  * Clerk
  * OpenWeather API
  * React Three Fiber
  * BullMQ

### Engineering Standards

* Defined project-wide code standards.
* Established TypeScript strictness rules.
* Defined API invariants and AI constraints.

### Workflow Definition

* Established spec-driven development process.
* Defined MVP-first implementation order.
* Documented feature scoping rules.

### Design System & UI Primitives

* Initialized and configured `shadcn/ui` integration.
* Created custom sand, cream, and sage CSS theme variables for both light and dark modes matching the warm editorial boutique aesthetic.
* Wired up Cormorant Garamond Serif and Geist Sans typography pairings.
* Integrated `lucide-react` for minimal, stroke-based icons.
* Installed core UI primitives: `Button`, `Card`, `Dialog`, `Input`, `Textarea`, `Tabs`, and `ScrollArea`.
* Created `lib/utils.ts` with the `cn()` class utility for conditional class merging.

### Foundational Application Chrome (Editor Shell)

* Created reusable, sticky, and translucent `EditorNavbar` with sidebar toggle, dynamic center title, and right layout spacing.
* Created floating overlay `ProjectSidebar` with slide-in transition, close action, Tab navigation ("My Wardrobe", "Saved Outfits"), empty placeholders with premium editorial styling, and bottom-anchored "Add Clothing" button.
* Created reusable luxury `EditorialDialog` pattern matching warm sand/cream tokens, featuring serif typography and generous spacing.
* Integrated the shell components and linked states into `page.tsx` for complete interactivity.

### Unit 1 — Authentication

* Integrated Clerk authentication with the Next.js 16 application.
* Designed custom, minimal two-panel editorial layouts for `/sign-in` and `/sign-up` pages.
* Styled Clerk components to perfectly inherit StyleSync theme variables (sand backgrounds, cream card surfaces, sage green accent primary, and zero-border-radius corners).
* Protected all routes by default using Next.js 16 `proxy.ts` middleware configuration, making only `/sign-in` and `/sign-up` public.
* Updated root route (`/`) to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`.
* Restructured the editor shell to `/editor/page.tsx` and integrated the Clerk `<UserButton />` into the `EditorNavbar`.

### Database Integration & Schema

* Configured Prisma 7 with PostgreSQL database connection using a custom driver adapter.
* Created the PostgreSQL database schema model for wardrobe items (`Garment`).
* Split Prisma schema into modular files under `prisma/models/` (`garment.prisma`, `outfit.prisma`, `user-preference.prisma`, and `recommendation.prisma`) to keep models clean and extensible.
* Configured database branching in `lib/prisma.ts` to support both Prisma Accelerate (`prisma+postgres://` URLs) and PostgreSQL driver adapter (`@prisma/adapter-pg`).
* Pushed schema changes to synchronize with the local database and successfully generated the Prisma Client.


### Unit 2 — Wardrobe Upload & Storage (Completed)

* Created secure server-side Upload API endpoint (`/api/upload`) using Cloudinary storage integration.
* Created Wardrobe Retrieval API endpoint (`/api/garments`) to query wardrobe items for the logged-in user.
* Built `<UploadGarmentDialog />` with premium drag-and-drop zone, file size/type validation, client-side preview, optional notes input, and loading states.
* Integrated the dialog and connected dynamic list state in `/editor/page.tsx` and `project-sidebar.tsx` to automatically refresh without full-page reloads.
* Implemented a server-side Base64 database fallback storage mechanism to enable garment uploads during local/offline development when Cloudinary environment variables are missing.

### Unit 2 — AI Garment Classification & Metadata Extraction (Completed)

* Installed and configured `@google/genai` Gemini SDK.
* Extended Prisma `Garment` model to store AI-extracted metadata (`subcategory`, `primaryColor`, `secondaryColor`, `season`, `style`, `material`, `confidence`).
* Implemented modular `GarmentClassificationService` invoking Gemini 2.5 Flash with structured prompts and strict schema validations.
* Disabled automatic background AI classification during garment upload, allowing classification to only occur when triggered manually by the user in the UI.
* Created manual classification endpoint at `POST /api/garments/[id]/classify` with Clerk authentication, ownership validation, and error handling.
* Polished `GarmentCard` and details dialog to correctly show unclassified states and only render loading indicators when classification is actively in progress.
* Extended `<GarmentDetailsDialog />` with an "AI Stylist Insights" dashboard and a manual "Run AI Classification" / "Re-classify garment" trigger.

### Unit 3 — Wardrobe UI, Data Integration & Wardrobe Management (Completed)

* Built responsive full-width `WardrobeGrid` component supporting 3-5 columns on desktop, 2-3 columns on tablet, and 1-2 columns on mobile.
* Created `GarmentCard` with custom styling (cream surface, soft border, rounded-2xl, subtle shadow, and gentle hover elevations).
* Implemented client-side filtering system for browsing garments by category (All, Tops, Bottoms, Outerwear, Footwear, Accessories, Uncategorized) and favorites status.
* Refactored `ProjectSidebar` (Wardrobe Sidebar) to present recent garments in a list view matching the loading skeletons instead of a grid.
* Added `PATCH /api/garments/[id]` API endpoint to persist garment favoriting in the database.
* Resolved browser syntax error (`Unexpected token '<'`) caused by Clerk middleware routing blocking Clerk's internal session requests (`/__clerk`).
* Implemented premium dual-column `<GarmentDetailsDialog />` component for details viewing and metadata editing.
* Supported full metadata editing including name, category dropdown, interactive tag chip editing, and styling notes.
* Implemented backend `PATCH /api/garments/[id]` validation and integration.
* Implemented backend `DELETE /api/garments/[id]` endpoint and secure deletion flow with confirmation prompt.
* Linked click interactions on wardrobe grid cards and sidebar lists to trigger the edit dialog.

### Unit 8 — Outfit Builder & Saved Outfits (Completed)

* Created backend `GET /api/outfits` and `POST /api/outfits` to fetch and save outfit curation configurations.
* Created backend `PATCH /api/outfits/[id]` and `DELETE /api/outfits/[id]` to update and delete outfits, including transactional mapping overrides and cascade deletions.
* Created premium visual `<OutfitCard />` rendering a stacked visual flat-lay collage of garment images, favorite status, and metadata details.
* Created responsive `<OutfitGrid />` list layout supporting skeleton loaders and creative empty states.
* Created dual-column `<OutfitBuilderDialog />` component supporting scrollable category-filtered wardrobe selectors, overlay selected states, vertical pile preview collage, metadata inputs, and integrated deletion confirmation.
* Updated `ProjectSidebar` (Wardrobe Sidebar) and main editor workspace to seamlessly switch between wardrobe and outfits view toggles with contextual CTA buttons.

### Unit 4 — Weather-Aware Recommendations (Completed)

* Created a normalized weather service integrating with OpenWeather API using a seasonal/location-based fallback to support offline local development.
* Developed a modular recommendation scoring service to evaluate outfits on Weather Fit, Season Fit, Style Fit, and Metadata Completeness.
* Created a deterministic rule-based explanation engine that articulates recommendations clearly without using LLMs.
* Implemented the Clerk-authenticated GET `/api/recommendations` API endpoint.
* Designed and built the dynamic `<TodaysRecommendations />` component displaying weather context, primary recommendation previews, and alternative looks, fully styled for the sand/cream editorial theme.
* Centered the styling recommendations on the main dashboard (`/editor`) and added a dedicated CTA redirecting to a full-width Wardrobe Studio page (`/editor/wardrobe`) for collection management and outfit creation.
* Enabled query parameter deep-linking on `/editor/wardrobe` so sidebar clicks and "Add Clothing" actions automatically trigger dialogs.

---

## In Progress

### MVP Infrastructure Setup

Current implementation focus:

* Monorepo initialization
* Next.js app setup
* NestJS backend setup
* Shared packages structure

Blockers:

* None

---

## Next Up

### Unit 2 — Wardrobe Upload Pipeline (Remaining)

Scope:

* Background removal

---

## Open Questions

### Product Decisions

* Should users manually edit AI-generated clothing metadata?
* How much randomness should outfit recommendations include?
* Should users rate outfits to improve recommendations?
* Will wardrobes support multiple styles (streetwear, formal, gym)?
* Should outfit recommendations avoid recently worn items?

### Technical Decisions

* Should recommendations run synchronously or via queue jobs?
* Which avatar provider is preferred for MVP:

  * Ready Player Me
  * Avaturn

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

* Upload owned clothes
* Build wardrobes
* Receive personalized outfit recommendations
* Get weather-aware suggestions
* Eventually create a scanned 3D avatar for virtual try-on

Current engineering priority:

**Ship the wardrobe + recommendation engine first.**

Do not start avatar rendering before recommendation quality is strong.
