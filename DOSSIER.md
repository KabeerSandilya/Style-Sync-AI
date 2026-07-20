# StyleSync AI — Complete Project Dossier

> Interview, placement, and viva preparation document.
> **Grounded in the actual codebase**, not the aspirational `context/architecture.md`.
> A critical honesty note is in §0 — read it first.

---

## §0. READ THIS FIRST — "Documented" vs "Built"

Your `context/architecture.md` describes an ambitious target stack (NestJS, pgvector embeddings, Redis + BullMQ, Turborepo + pnpm, OpenAI Vision, an admin app, microservices). **Most of that is not in the code yet.** If you claim it in an interview and the interviewer probes, you will get exposed.

Here is the **truth table** — memorize this distinction; it is your single biggest interview risk:

| Claimed in docs | Actually built | What to say |
| --- | --- | --- |
| NestJS backend | **Next.js Route Handlers** (20 routes in `frontend/app/api`) calling a shared TypeScript service package (`@style-sync/backend`) | "It's a Next.js full-stack app; backend logic lives in a separate workspace package imported by route handlers." |
| OpenAI Vision / FashionCLIP | **Google Gemini 2.5 Flash** (`@google/genai`), with `gemini-2.0-flash` as a 503 fallback | "I use Gemini 2.5 Flash for vision classification and outfit generation." |
| Redis + BullMQ queues | **Next.js `after()`** (runs work after the response is flushed) | "Background work uses Next's `after()` primitive — no separate queue infra yet." |
| pgvector + embeddings | **Not implemented.** Recommendation is a **deterministic rule engine** | "Recommendations are rule-based and explainable; embeddings are a planned upgrade." |
| Turborepo + pnpm | **npm workspaces** (root `package.json` `workspaces`) | "npm workspaces monorepo, two packages: frontend + backend." |
| Admin app, microservices | **Not built** | "Single deployable; designed so services could be extracted later." |

Everything below describes the **real, shipped system**.

---

# 1. Executive Summary

- **Project Name:** StyleSync AI
- **Problem Statement:** Style-conscious people own more clothing than they wear and waste time each morning deciding what to put on. They over-buy and under-wear. There is no low-effort way to *use what you already own* intelligently.
- **Target Users:** Style-conscious individuals roughly 20–40 who want to dress deliberately without spending time on it.
- **Business Value:** Reduces decision fatigue, increases utilization of an owned wardrobe, and creates a data moat (per-user wear/feedback history) that improves recommendations over time. Natural expansion paths: resale, brand partnerships.
- **Key Features:**
  1. AI wardrobe digitization — upload a photo, Gemini auto-classifies category/color/style/season/material/confidence, background removed automatically.
  2. AI outfit generation — Gemini assembles 6–8 stylist-grade outfits from *your* garments under explicit fashion rules.
  3. Weather + occasion-aware recommendation engine — a deterministic, explainable scorer ranks your saved outfits for today.
  4. Preference learning — wears, likes/dislikes, and favorites feed a weighted scoring profile that personalizes future ranking.
  5. Weekly outfit planner, wear history, and wardrobe insights (most/least/never worn).
- **Unique Selling Points:**
  - **Explainable AI**: every recommendation comes with a human-readable reason; ranking is deterministic and auditable (not a black box).
  - **Closed-loop personalization**: the app learns from what you actually wear, not just what you say.
  - **Editorial product design** — a deliberate, non-generic aesthetic (sage/sand palette, Cormorant Garamond).
- **Technical Complexity Level:** **Intermediate → Advanced.** Intermediate infra (full-stack Next.js, Prisma/Postgres, third-party auth), advanced in two areas: (a) the multimodal LLM pipeline with strict output validation and (b) the hand-built weighted recommendation/preference-learning engine.

---

# 2. System Architecture

## User Flow

1. User lands on the marketing page (`app/page.tsx` → `landing-page.tsx`), public route.
2. Signs in via Clerk (Google / email). `proxy.ts` (Clerk middleware) protects every non-public route.
3. Onboarding (`/onboarding`) collects style preferences → `POST /api/onboarding/complete`.
4. User uploads a garment photo (`upload-garment-dialog.tsx` → `POST /api/upload`).
5. Server stores the image (Cloudinary, or base64-in-DB fallback), creates the `Garment` row, then **after the response is sent** runs (a) Gemini classification and (b) background removal via `after()`.
6. Garment appears in the wardrobe grid; client polls `/api/garments/[id]/status` until `isProcessed`.
7. User generates outfits (`POST /api/outfits/generate`) — Gemini returns combinations, server validates + dedupes + persists them.
8. User opens "Today's Recommendations" (`GET /api/recommendations?lat&lon`) — weather is fetched, saved outfits are scored and ranked, each with an explanation.
9. User reacts: wear / like / dislike / favorite / plan into the weekly planner. Each event updates history and re-derives the preference profile.

## Frontend Architecture
- **Next.js 16 App Router**, React 19, TypeScript. Server Components by default; Client Components (`"use client"`) for interactive editor/dialog UI.
- Pages: landing, onboarding, preferences, `editor` (wardrobe + outfit builder), `editor/planner`, `history`, `insights`, Clerk sign-in/up catch-all routes.
- Styling: Tailwind CSS v4 + a small shadcn/ui-style primitive set built on **Base UI** (`@base-ui/react`), `class-variance-authority`, `clsx`, `tailwind-merge`.
- Data fetching: client components call the local `/api/*` route handlers with `fetch`; no global client cache library (no React Query/SWR) — local component state.

## Backend Architecture
- **No standalone server.** API = Next.js **Route Handlers** under `frontend/app/api/**/route.ts` (20 endpoints).
- Business logic lives in **`@style-sync/backend`**, a sibling workspace package of pure TypeScript services (classification, generation, recommendation, weather, preferences, insights, wear/recommendation history, planner helpers) plus infra libs (`prisma`, `cloudinary`, `rate-limit`, `retry`). Route handlers import from this package via the barrel `backend/src/index.ts`. `next.config.ts` `transpilePackages` compiles it; `serverExternalPackages` keeps the ONNX background-removal native module out of the bundle.

## Database Architecture
- **PostgreSQL** via **Prisma 7** with the `@prisma/adapter-pg` driver adapter (`pg`).
- Models: `Garment`, `Outfit`, `OutfitGarment` (join), `OutfitWear`, `Recommendation`, `RecommendationFeedback` (+ `FeedbackType` enum), `OutfitPlan`, `UserPreference`. No `User` table — identity is owned by Clerk; rows store Clerk's `userId` string and are filtered by it.

## Authentication Flow
- **Clerk**. `proxy.ts` runs `clerkMiddleware`; `auth.protect()` guards all non-public routes. Every API handler independently calls `await auth()` and 401s if `userId` is null (defense in depth — never trusts the middleware alone). All queries are scoped `where: { userId }`.

## API Flow (representative — upload)
`Client multipart POST → auth() → validate type/size → Cloudinary upload (or base64 fallback) → prisma.garment.create → return 200 → after(): Gemini classify + persist metadata → after(): server BG removal + upload processed PNG + persist URL.`

## Data Flow
Image bytes → Cloudinary (CDN URL) → Gemini (metadata JSON) → Postgres (`Garment`). Wear/like/dislike/favorite events → Postgres → `calculateScores` → `UserPreference.preferenceScore` (JSON) → consumed by `scoreOutfit` at recommendation time. Weather: OpenWeather → normalized `WeatherContext` (15-min in-memory cache) → `scoreOutfit`.

## Storage Layer
- **Cloudinary**: original + background-removed images, per-user folders `stylesync/wardrobe/{userId}`. **Fallback**: if Cloudinary env vars are absent, images are stored as base64 data URLs directly in Postgres (dev convenience).
- **Postgres**: all structured data. **In-memory Maps**: weather cache + rate-limit counters (per server instance).

## Deployment Architecture
- Designed for **Vercel** (the `after()` usage and route-handler model are Vercel-native). Single Next.js deployment; Postgres is hosted (e.g. Neon/Supabase-style). Cloudinary + Gemini + OpenWeather + Clerk are external SaaS.

## External Services Used
Clerk (auth) · Google Gemini (vision + generation) · Cloudinary (image storage/CDN) · OpenWeather (weather) · Postgres host. (`replicate` is a dependency but the active background-removal path is `@imgly/background-removal`.)

## Architecture Diagram (ASCII)

```
                    ┌──────────────────────────────────────────────┐
                    │                  BROWSER                      │
                    │  React 19 / Next App Router (Server+Client)   │
                    │  Tailwind v4 · Base UI · Clerk components      │
                    └───────────────┬──────────────────────────────┘
                                    │ fetch /api/*
              ┌─────────────────────▼───────────────────────────────┐
              │      Next.js 16 Route Handlers (frontend/app/api)    │
              │   auth() guard · validation · rate-limit · after()   │
              └───┬───────────┬───────────┬───────────┬─────────────┘
                  │ imports   │           │           │
        ┌─────────▼─────────┐ │           │           │
        │ @style-sync/backend│ │           │           │
        │  services + libs   │ │           │           │
        └─┬───────┬────────┬─┘ │           │           │
          │       │        │   │           │           │
   ┌──────▼─┐ ┌───▼────┐ ┌─▼───▼──┐  ┌─────▼─────┐ ┌───▼──────┐
   │ Prisma │ │Gemini  │ │Cloud-  │  │OpenWeather│ │  Clerk   │
   │  ↓ pg  │ │2.5     │ │inary   │  │   API     │ │  (auth)  │
   │Postgres│ │Flash   │ │(CDN)   │  └───────────┘ └──────────┘
   └────────┘ └────────┘ └────────┘
```

## Component Interaction Diagram (upload → recommend)

```
Upload ─▶ /api/upload ─▶ Cloudinary ─▶ Garment row ─┐
                          │                          │ after()
                          └─▶ after(): Gemini classify ─▶ update metadata, isProcessed=true
                          └─▶ after(): @imgly bg-removal ─▶ processedImageUrl

Generate ─▶ /api/outfits/generate ─▶ Gemini (rule prompt) ─▶ validate IDs/2-5/dedupe ─▶ Outfit rows

Recommend ─▶ /api/recommendations ─▶ fetchWeather ─┐
                                     load outfits  │
                                     load prefs+wear+feedback ─▶ rankOutfits(scoreOutfit) ─▶ sorted + explanations
```

---

# 3. Frontend Deep Dive

### Next.js 16 (App Router)
- **Why chosen:** one framework for UI + API + SSR; first-class Vercel deploy; Server Components reduce client JS; `after()` gives free post-response background work without a queue.
- **Alternatives considered:** Vite + Express SPA (two deploys, manual SSR); Remix (smaller ecosystem); plain CRA (no server).
- **Advantages:** colocated full-stack, RSC streaming, file-based routing, edge/serverless ready.
- **Limitations:** serverless statelessness (in-memory cache/rate-limit don't share across instances); cold starts; vendor-leaning primitives (`after()`).
- **Backend interaction:** client components `fetch('/api/...')`; handlers import `@style-sync/backend`.

### React 19
- **Why:** required by Next 16; modern hooks, transitions, improved Suspense.
- **Alternatives:** Vue/Svelte — rejected for ecosystem + team familiarity.
- **Limitations:** churn at the bleeding edge (RSC mental model is non-trivial).

### State Management
- **Local component state + server as source of truth.** No Redux/Zustand/React Query.
- **Why:** the app is read-mostly per page; data is re-fetched on navigation; avoids cache-invalidation complexity.
- **Limitation:** no shared client cache → some refetch duplication; manual polling for processing status. **Production upgrade:** TanStack Query for caching, optimistic updates, and dedup.

### Routing
- File-based App Router. Dynamic segments (`[id]`, `[outfitId]`), catch-all for Clerk (`[[...sign-in]]`). Public vs protected decided in `proxy.ts`.

### Forms
- Native controlled inputs + `FormData` for the multipart upload. No Formik/RHF. Validation is server-authoritative (type/size/category whitelist).

### UI Libraries
- **Base UI** (`@base-ui/react`) primitives wrapped into local `components/ui/*` (button, dialog, tabs, card, input, textarea, scroll-area) in shadcn style with `cva` variants. `lucide-react` icons.
- **Why:** unstyled, accessible primitives + full styling control → matches the bespoke editorial design without fighting a heavy component kit.

### Styling
- **Tailwind v4** + `tailwind-merge` + `clsx` (the `cn()` helper in `lib/utils.ts`) + `class-variance-authority` for variant APIs. `tw-animate-css` for animation utilities. Design tokens (sage/sand/cream, Cormorant Garamond + Geist) defined in `globals.css` and mirrored into Clerk's `appearance` in `layout.tsx`.

### Performance Optimization
- Server Components ship less JS; background removal can run **client-side** (`@imgly/background-removal`) to offload the server and skip a round trip; Cloudinary CDN + transformations; `after()` keeps the upload response fast (heavy work deferred).

### Error Handling
- Every route returns a uniform `{ success, error }` JSON envelope with correct status codes (400/401/422/429/500/503). Background jobs swallow-and-log (a failed classification leaves `isProcessed=false`, retried/visible, never crashes the request).

### Caching
- Weather cached 15 min in-memory; Cloudinary CDN for images. No HTTP cache layer on API yet.

### Accessibility
- Target **WCAG AA** (`PRODUCT.md`): 4.5:1 body contrast, reduced-motion support, accessible Base UI primitives (focus management, ARIA in dialogs/tabs).

### Responsive Design
- Tailwind responsive utilities; grid-based wardrobe/outfit layouts; editor sidebar collapses on small screens.

---

# 4. Backend Deep Dive

### APIs — Next.js Route Handlers
- **Purpose:** the entire HTTP surface (20 endpoints: garments CRUD + status/classify/remove-bg, upload, outfits CRUD + generate, recommendations + like/dislike/wear, planner, preferences, insights, wear-history, onboarding).
- **Internal working:** each is an async `GET/POST/PATCH/DELETE` exporting a `Request → NextResponse` function. Auth, validation, rate-limit, DB, and service calls happen inline.
- **Why:** zero extra infra; type-safe import of the service layer; serverless scaling per route.
- **Scalability:** stateless handlers scale horizontally; bottleneck is Postgres connections (mitigate with PgBouncer/pooling) and third-party rate limits.
- **Security:** per-handler `auth()` + `where:{userId}` scoping; strict input validation.

### Service Framework — `@style-sync/backend` workspace package
- **Purpose:** keep domain logic framework-agnostic and unit-testable (vitest) outside Next.
- **Internal working:** plain functions exported through a barrel; consumed by handlers.
- **Why:** separation of concerns; could later be lifted into a true standalone service with minimal change.

### Authentication — Clerk
- **Purpose:** identity, sessions, social login.
- **Internal working:** `clerkMiddleware` sets the auth context from a session cookie/JWT; `auth()` reads `userId` server-side.
- **Why:** offloads password storage, OAuth, MFA, session rotation — large security surface handled by a specialist.
- **Scalability/Security:** Clerk-managed; app never stores credentials.

### Authorization
- **Ownership model:** every row carries Clerk `userId`; all reads/writes filter by it; cross-user access is structurally impossible through the query layer. No roles/RBAC yet (single user-tier).

### Middleware
- `proxy.ts` (Next 16's renamed middleware) = Clerk route protection with a matcher that skips static assets and always runs for `/api`.

### Logging
- `console.*` with tagged prefixes (`[generateOutfits]`, `[retry]`). Structured/centralized logging is a production gap.

### Error Handling
- `withRetry` (exponential backoff, 3 attempts) around flaky AI/Cloudinary calls; try/catch in every handler; graceful degradation (missing API keys → mock weather / skipped classification rather than 500).

### Rate Limiting
- `lib/rate-limit.ts`: in-memory fixed-window counter keyed `userId:endpoint`. Outfit generation = **1/min/user** (protects the Gemini quota/cost).
- **Limitation:** per-instance only — not shared across serverless instances. **Prod:** Redis/Upstash sliding window.

### Validation
- Manual, server-side: file MIME whitelist + 10 MB cap; category whitelist; occasion whitelist (`OCCASIONS`); JSON parse guards; Gemini output validated field-by-field (see §7 generation). No Zod yet — a clean upgrade.

### Background Jobs
- **Next.js `after()`** — runs classification and background removal after the HTTP response flushes, so uploads feel instant. **Not** a durable queue: no retries across requests, no cross-instance fan-out, lost if the function is killed mid-run (mitigated by `withRetry` inside).

### Caching / Message Queues / WebSockets
- Caching: in-memory weather (15 min). Queues: none (replaced by `after()`). WebSockets: none — status uses client polling (`/status`).

---

# 5. Database Deep Dive

### Database choice — PostgreSQL + Prisma 7
- **Why Postgres:** relational integrity for the wardrobe↔outfit↔wear graph, JSON columns for flexible `preferenceScore`/`weatherContext`, array columns (`tags`, `favoriteColors`) without a join table, and a clean future path to `pgvector`.
- **Why Prisma:** type-safe queries, declarative schema split across `prisma/models/*.prisma`, migrations, driver adapter (`@prisma/adapter-pg`).

### Schema Design (models)
`Garment`, `Outfit`, `OutfitGarment` (M:N join), `OutfitWear`, `Recommendation`, `RecommendationFeedback` + `FeedbackType` enum, `OutfitPlan`, `UserPreference`. Identity (`userId`) is a Clerk string, not an FK to a local table.

### Relationships
- `Outfit` 1—M `OutfitGarment` M—1 `Garment` (many-to-many garments↔outfits).
- `Outfit` 1—M `OutfitWear`, `RecommendationFeedback`, `Recommendation`, `OutfitPlan`.
- Cascade deletes on outfit children; `Recommendation.outfitId` is `SetNull` (keep history if outfit deleted).
- `OutfitPlan` `@@unique([userId, plannedDate])` → one planned outfit per day. `UserPreference.userId` is `@unique` (1 profile/user).

### Indexing
- `@@index([userId])` on every table (the universal access pattern), plus `createdAt`/`wornAt` indexes for ordering, and unique composite indexes on join + plan tables. Query plans are index-driven on the hot paths.

### Query Optimization
- Selective `select`/`include` (generation fetches only the 8 fields it needs); `take:1` + `orderBy desc` for "last worn"; in-app fingerprint `Set` for O(1) duplicate-outfit detection instead of N queries; `Promise.all` to parallelize independent reads.

### Scaling Strategy
- Read replicas for recommendation/insights reads; connection pooling (PgBouncer); partition `OutfitWear` by time if it grows huge; later move embeddings into `pgvector` with an ANN index.

### Backup / Consistency / Transactions
- Backups: managed-Postgres PITR (host-level; not app-coded). Consistency: FK constraints + unique indexes enforce invariants. Transactions: outfit creation uses Prisma nested writes (atomic create of outfit + join rows); multi-step writes could be wrapped in `prisma.$transaction` (a noted gap for the preference-recompute path).

### ER Diagram

```
            UserPreference (userId unique)
                 │ (logical, by userId)
   Clerk userId ─┼───────────────┬──────────────┬───────────────┐
                 │               │              │               │
              Garment        Outfit         OutfitWear   RecommendationFeedback
                 │             │  │ │ │           │               │
                 │   ┌─────────┘  │ │ └────────┐  │               │
            OutfitGarment         │ │     OutfitPlan               │
          (garmentId,outfitId)    │ └─ Recommendation (outfitId SetNull)
                 └────────────────┘
```

### Sample Tables

```
Garment(id, userId, imageUrl, processedImageUrl, name, category, tags[],
        primaryColor, secondaryColor, dominantColor, season, style, material,
        confidence, isFavorite, isProcessed, createdAt)
Outfit(id, userId, name, notes, occasion, isFavorite, isAiGenerated, createdAt)
OutfitGarment(id, outfitId, garmentId)          -- UNIQUE(outfitId, garmentId)
OutfitWear(id, userId, outfitId, wornAt)
UserPreference(userId UNIQUE, favoriteColors[], favoriteStyles[], ...,
               threshold, preferenceScore JSON)
```

### Common Queries
```sql
-- Wardrobe, newest first
SELECT * FROM "Garment" WHERE "userId"=$1 ORDER BY "createdAt" DESC;
-- Classified garments for generation
SELECT id,name,category,subcategory,"primaryColor",style,season,material
FROM "Garment" WHERE "userId"=$1 AND "isProcessed"=true;
-- Most-worn outfits
SELECT "outfitId", COUNT(*) FROM "OutfitWear" WHERE "userId"=$1
GROUP BY "outfitId" ORDER BY COUNT(*) DESC;
```

---

# 6. Technology Breakdown

| Technology | Purpose | Why Used | Alternatives | Sample Interview Q |
| --- | --- | --- | --- | --- |
| Next.js 16 (App Router) | Full-stack UI + API | One deploy, RSC, `after()` | Remix, Vite+Express | RSC vs Client Component? |
| React 19 | UI runtime | Required by Next 16 | Vue, Svelte | What does `after()` solve? |
| TypeScript | Type safety across stack | Shared types FE/BE | Plain JS | How are types shared? |
| Tailwind v4 + cva | Styling/design system | Bespoke editorial UI | CSS Modules, MUI | `cn()` purpose? |
| Base UI + shadcn-style | Accessible primitives | Full styling control | Radix, MUI | Why unstyled primitives? |
| Clerk | Auth/sessions | Offload credential security | NextAuth, Auth0 | Why not roll your own auth? |
| Prisma 7 (+ adapter-pg) | ORM/migrations | Type-safe queries | Drizzle, TypeORM | N+1 mitigation? |
| PostgreSQL | Primary DB | Relational + JSON + arrays | MySQL, Mongo | Why relational here? |
| Google Gemini 2.5 Flash | Vision + outfit gen | Cheap, fast, JSON mode | OpenAI, Claude | How do you trust LLM output? |
| `@imgly/background-removal` | Cutout garments | Runs client or server (ONNX) | remove.bg API, Replicate | Why client-side option? |
| Cloudinary | Image storage/CDN | Optimized delivery | S3+CloudFront | Why not just S3? |
| OpenWeather | Weather context | Forecast POP for rain | WeatherAPI, Tomorrow.io | Cache strategy? |
| `after()` (Next) | Background jobs | No queue infra needed | BullMQ+Redis | Durability tradeoff? |
| Vitest | Backend unit tests | Fast, ESM-native | Jest | What's tested? |
| npm workspaces | Monorepo | Share backend pkg w/ FE | Turborepo, pnpm | Why a separate pkg? |

---

# 7. Feature-by-Feature Analysis

### A. Garment Upload + AI Classification
- **Functional:** user uploads a photo; system stores it and auto-fills category, subcategory, primary/secondary color, season, style, material, confidence; removes background.
- **Technical:** `POST /api/upload` → validate (MIME whitelist, 10 MB) → Cloudinary stream upload (or base64 fallback) → `garment.create` → `after()` runs `classifyGarment` (Gemini 2.5 Flash, `responseMimeType: application/json`, image as inline base64) and `removeBackground`. Output is **normalized + clamped** (category coerced to a valid enum, confidence clamped 0–100, blanks → "Unknown").
- **DB:** insert `Garment`; later update metadata + `isProcessed`, `processedImageUrl`, `bgRemovedAt`.
- **Endpoints:** `/api/upload`, `/api/garments/[id]/classify`, `/remove-background`, `/status`.
- **Challenges:** LLMs return malformed/over-confident JSON → solved with JSON-mode + field normalization + retry. Slow upload UX → solved with `after()` + status polling.
- **Edge cases:** missing Gemini key (skips gracefully), missing Cloudinary (base64 fallback), client-side BG removal already done (server skips), fetch of remote image fails (throws, retried).

### B. AI Outfit Generation
- **Functional:** generate 6–8 wearable outfits from owned, classified garments, optionally for an occasion.
- **Technical:** `POST /api/outfits/generate` → auth → rate-limit (1/min) → require ≥3 classified garments → build a rule-rich stylist prompt → Gemini (2.5-flash, fallback 2.0-flash on 503) → strip code fences → parse → **validate each outfit**: name non-empty, 2–5 garments, every `garmentId` exists in input, ≤1 bottom, ≤1 footwear → fingerprint-dedupe against existing outfits → persist with nested join writes.
- **DB:** `Outfit` (+`isAiGenerated`, `occasion`, `notes`=reason) + `OutfitGarment` rows.
- **Challenges:** hallucinated garment IDs (validated against an input `Set`); duplicate looks (sorted-ID fingerprint `Set`); capacity 503s (model fallback).
- **Edge cases:** all outfits invalid → 422 with guidance; all duplicates → 200 empty with message; <3 garments → structured `not_enough_garments`.

### C. Weather + Occasion Recommendation Engine (the crown jewel)
- **Functional:** rank the user's saved outfits for *today* given live weather + optional occasion, each with a reason.
- **Technical:** `GET /api/recommendations` → `fetchWeather(city|lat/lon)` → load outfits+garments, prefs, recent-wear map, feedback map → `rankOutfits` → `scoreOutfit` (0–100):
  - Weather fit (0–40): hot/cold/rain heuristics boost/penalize garment keywords; layering & footwear/suede rain rules.
  - Season fit (0–30): garment.season vs current season (All-Season = full credit).
  - Style fit (0–30): garment.style vs user's favorite styles.
  - Metadata penalty (≤25), feedback (+10 LIKE / −30 DISLIKE), preference-match bonus (≤25) and penalty (≤30, from negative `preferenceScore`), recent-wear penalty (worn today −50 … last week −10), occasion (+25 exact / +12 compatible via `OCCASION_GROUPS` / −15 conflict).
  - Final clamped 0–100; ties broken by newest outfit.
- **DB:** reads only; `Recommendation` row can log explanation + `weatherContext` JSON.
- **Challenges:** non-determinism/black-box risk → fully rule-based + explainable; cold start → `coldStartReason` (`no_garments`/`no_outfits`).
- **Edge cases:** no API key → seasonal mock weather; missing metadata → penalized not crashed.

### D. Preference Learning (closed loop)
- **Functional:** the app learns favored colors/styles/categories/seasons/types from behavior.
- **Technical:** `calculateScores` weights events — wear +10, like +5, favorite +3, dislike −5 — aggregated per attribute into a JSON score map; `buildProfile` thresholds it into favorite arrays; `updatePreferenceProfile` upserts `UserPreference`. `scoreOutfit` then consumes both the arrays (bonus) and the raw negative scores (penalty).
- **Endpoints:** triggered by wear/like/dislike/favorite + `/api/preferences`.
- **Edge case:** no history → neutral baselines so new users still get sensible (weather-led) ranking.

### E. Weekly Planner / Wear History / Insights
- **Planner:** `OutfitPlan` unique per (user, date); `getWeekRange` computes ISO Mon–Sun.
- **History:** `OutfitWear` log; `/api/wear-history`.
- **Insights:** most/least/never-worn garments and most-worn outfits via grouped aggregates.

---

# 8. Security Analysis

- **Authentication:** Clerk; sessions via signed cookie/JWT; `clerkMiddleware` + per-route `auth()`.
- **Authorization:** ownership-by-`userId` on every query; cross-tenant access structurally prevented; no RBAC yet.
- **JWT/OAuth flow:** Clerk handles OAuth (Google) and issues/verifies session tokens; the app only reads the verified `userId` server-side.
- **Password handling:** none stored — delegated to Clerk (eliminates a whole class of risk).
- **Encryption:** TLS in transit (Vercel/Cloudinary/Clerk); at-rest handled by managed Postgres/Cloudinary. Secrets in env vars.
- **Input validation:** MIME whitelist + 10 MB cap on uploads; category/occasion whitelists; JSON parse guards; AI output validated field-by-field.
- **XSS:** React escapes by default; no `dangerouslySetInnerHTML`.
- **CSRF:** Clerk session model + same-origin `fetch`; no cross-site form posts.
- **SQL injection:** Prisma parameterizes all queries; no raw SQL on user input.
- **API security:** auth on every route, rate-limit on the expensive generation route, uniform error envelope (no stack leakage).
- **Secrets management:** `.env`/Vercel env vars; keys never shipped to client; graceful degradation if absent.

**Likely security interview questions**
1. How do you stop user A reading user B's wardrobe? → every query is `where:{userId}` from the verified Clerk session; no client-supplied user id is ever trusted.
2. Where could an LLM injection bite you? → Gemini output is data, never executed; all IDs re-validated against the input set; output is normalized/clamped.
3. Is the rate limiter abuse-proof? → No — it's per-instance in-memory; production needs Redis-backed distributed limiting + auth-level abuse detection.
4. How are secrets handled? → server-only env vars; absence degrades gracefully rather than leaking.
5. Upload abuse? → MIME + size validation; per-user Cloudinary folders; could add content moderation + virus scan.

---

# 9. Scalability Discussion

**100 users:** current architecture is comfortable. Single Postgres, Gemini on demand, in-memory caches fine.

**10,000 users:** bottlenecks emerge —
- Postgres **connections** (serverless fan-out) → add PgBouncer/Prisma Accelerate pooling.
- In-memory **rate-limit + weather cache** don't share across instances → move to Redis/Upstash.
- Gemini **cost/quota** → cache classifications, batch, queue generation.
- Background `after()` lacks durability → introduce a real queue (BullMQ/QStash) for classification + BG removal.

**1,000,000 users:**
- **DB scaling:** read replicas for recommendations/insights; partition `OutfitWear` by time; consider sharding by `userId`.
- **Load balancing:** Vercel/edge auto-scales handlers; put a CDN in front (already true for images).
- **Caching:** Redis for sessions-of-derived data, weather, rate-limit, and precomputed daily recommendations.
- **CDN:** Cloudinary already; add edge caching for read APIs.
- **Queues:** durable queue + workers for all AI work; decouple ingestion from processing.
- **Microservices:** extract `ai-engine` (classification/generation) and a `recommendation-service` so AI latency/cost scale independently — the workspace-package boundary already maps to these seams.
- **Precompute:** nightly job computes each user's top outfits so the morning request is a cache hit (helps the "<3s" success criterion at scale).

---

# 10. Deployment & DevOps

- **CI/CD:** Vercel Git integration (build/preview/prod on push) is the natural fit; `npm run build` builds the frontend workspace; `postinstall` runs `prisma generate`. (No GitHub Actions committed yet — a gap.)
- **Docker / Kubernetes:** not used; serverless removes the need at this scale. A Dockerfile would be needed only if self-hosting the Next server or the ONNX BG-removal worker.
- **Cloud infrastructure:** Vercel (app) + managed Postgres (Neon/Supabase) + Cloudinary + Clerk + Gemini + OpenWeather.
- **Monitoring/Logging/Alerts:** currently `console.*` only — production should add Sentry (errors), structured logs, and uptime/quota alerts (Gemini/OpenWeather cost + 429s).
- **Environment variables:** `GEMINI_API_KEY`, `CLOUDINARY_*`, `OPENWEATHER_API_KEY`, `DATABASE_URL`, `CLERK_*`. App degrades gracefully when optional ones are missing.
- **Secrets management:** Vercel env vars / `.env.local` (gitignored).

**Deployment interview questions**
1. Why serverless over a container? → zero-ops scaling, pay-per-use, matches `after()`/route-handler model; tradeoff is statelessness + cold starts.
2. How do migrations run in prod? → `prisma migrate deploy` in the release step against the hosted DB.
3. What breaks first under load and how do you see it? → DB connections; you'd see it via pool exhaustion errors — hence pooling + monitoring.
4. How do you handle the native ONNX module on Vercel? → `serverExternalPackages` keeps it external; or run BG-removal client-side to avoid the server dependency entirely.

---

# 11. Design Decisions

1. **Next.js full-stack vs separate NestJS API.** Options: monolith Next vs split FE/BE. Chose Next route handlers + a shared service package. **Why:** one deploy, shared types, less infra for an MVP. **Tradeoff:** less framework structure (DI, guards, pipes) than NestJS. **Prod change:** could lift `@style-sync/backend` into a standalone service — the boundary already exists.
2. **Rule engine vs ML/embeddings for recommendations.** Chose deterministic scoring. **Why:** explainability (a product principle), determinism, zero training data, debuggability. **Tradeoff:** hand-tuned weights, less "discovery." **Prod change:** add `pgvector` embeddings as a *complementary* compatibility signal, keep rules for explainability.
3. **`after()` vs a real queue.** Chose `after()`. **Why:** instant upload UX with zero queue infra. **Tradeoff:** no durability/cross-instance retries. **Prod change:** BullMQ/QStash workers.
4. **Gemini 2.5 Flash vs OpenAI/Claude.** Chose Gemini Flash. **Why:** cost/latency, native JSON mode, strong multimodal. **Tradeoff:** vendor lock-in; mitigated by a thin service wrapper + model fallback.
5. **Clerk vs self-rolled/NextAuth.** Chose Clerk. **Why:** managed OAuth/sessions/MFA, less security surface. **Tradeoff:** vendor cost + lock-in.
6. **Cloudinary base64 fallback.** **Why:** the app runs in dev without Cloudinary creds. **Tradeoff:** base64-in-Postgres bloats rows — dev-only, never prod.
7. **No client cache lib.** **Why:** simplicity for an MVP. **Tradeoff:** refetching; **prod change:** TanStack Query.

---

# 12. Challenges & Problem Solving (10)

1. **LLM returns malformed/fenced JSON.** Root cause: models wrap JSON in ```` ```json ````. Fix: `extractJson` strips fences + JSON-mode + parse guard. Alt: function-calling/structured output.
2. **LLM hallucinates garment IDs.** Cause: model invents items. Fix: validate every ID against an input `Set`, drop invalid outfits. Alt: constrained decoding.
3. **Duplicate generated outfits.** Cause: model repeats combos. Fix: sorted-ID fingerprint `Set` for O(1) dedupe vs existing outfits. Alt: DB unique constraint on a composite hash.
4. **Slow uploads (classify+BG-removal inline).** Cause: heavy work blocks the response. Fix: `after()` defers it; client polls `/status`. Alt: real queue + websocket push.
5. **Gemini 503 capacity spikes.** Cause: model overloaded. Fix: catch 503, fall back to `gemini-2.0-flash`; `withRetry` backoff. Alt: multi-provider router.
6. **Recommendations felt random/black-box.** Cause: temptation to use opaque ML. Fix: deterministic weighted scorer with explanations. Alt: hybrid rules+embeddings.
7. **Recommending just-worn outfits.** Cause: no recency awareness. Fix: recent-wear penalty (−50 today … −10 last week) from an `OutfitWear` map. Alt: hard cooldown filter.
8. **Cold start (new user, empty everything).** Cause: nothing to recommend. Fix: `coldStartReason` distinguishes `no_garments` vs `no_outfits` to drive targeted UI. Alt: seed/template outfits.
9. **Cost/abuse of generation endpoint.** Cause: each call hits Gemini. Fix: 1/min/user rate limit + ≥3-garment precondition. Alt: credits/quota system.
10. **Running without external keys (dev/demo).** Cause: missing Cloudinary/OpenWeather/Gemini. Fix: graceful degradation — base64 storage, seasonal mock weather, skipped classification. Alt: local emulators.

---

# 13. Resume Discussion Preparation

### Tell me about this project
- **30s:** "StyleSync AI is a full-stack Next.js app that digitizes your wardrobe with AI and recommends outfits from clothes you already own, factoring in live weather, occasion, and what you actually wear. The interesting part is a custom, explainable recommendation engine plus a Gemini vision pipeline with strict output validation."
- **2min:** Add the flow (upload → Gemini classifies + background removal via `after()` → generate outfits with a rule-constrained prompt that I validate and dedupe → score saved outfits 0–100 across weather/season/style/preference/recency/occasion). Emphasize explainability and the closed feedback loop (wears/likes update a weighted preference profile).
- **5min:** Walk the architecture (Next route handlers + a shared `@style-sync/backend` package, Prisma/Postgres, Clerk auth, Cloudinary, Gemini, OpenWeather), then deep-dive the `scoreOutfit` weighting and the generation-validation pipeline, then the honest tradeoffs (rules vs embeddings, `after()` vs queues) and the scaling roadmap.

### Why did you build it?
- **30s:** "People own clothes they never wear and waste time every morning. I wanted to use AI to make an owned wardrobe usable, not sell more clothes."
- **2min:** Add the product thesis (intention over impulse), and that it let me build a real multimodal-AI pipeline + a recommendation system end to end.

### What was your contribution?
- The whole stack — schema design, the AI classification/generation services with validation, the recommendation + preference-learning engine, and the Next.js API/UI.

### Hardest problem?
- **30s:** "Making LLM output trustworthy — validating, normalizing, and deduping Gemini's outfits so hallucinated IDs or malformed JSON never reach the DB."
- **2min:** Plus making recommendations explainable and recency-aware instead of a black box.

### What would you improve?
- Durable queue for AI jobs, Redis-backed distributed rate-limit/cache, `pgvector` embeddings as a compatibility signal, Zod validation, Sentry + structured logging, TanStack Query, and tests/CI.

### What did you learn?
- Treating LLMs as untrusted I/O; designing for graceful degradation; the value of explainable/deterministic logic in "AI" features; full-stack type sharing via a workspace package.

---

# 14. Technical Interview Questions

## Beginner (20)
1. **What is StyleSync AI?** AI digital wardrobe + weather/occasion-aware outfit recommender built from clothes you own.
2. **Frontend framework?** Next.js 16 App Router with React 19 + TypeScript.
3. **Server vs Client Components?** Server render on the server (no JS shipped); Client (`"use client"`) run in the browser for interactivity.
4. **Where's the API?** Next.js route handlers in `frontend/app/api/**/route.ts`.
5. **Auth provider?** Clerk.
6. **ORM and DB?** Prisma 7 + PostgreSQL.
7. **How are images stored?** Cloudinary (CDN), base64-in-DB fallback in dev.
8. **Which AI model?** Google Gemini 2.5 Flash (vision + generation).
9. **How is weather fetched?** OpenWeather API, normalized to a `WeatherContext`, cached 15 min.
10. **What is a Garment vs an Outfit?** Garment = one clothing item; Outfit = a named set of garments (M:N via `OutfitGarment`).
11. **How is recommendation done?** A deterministic 0–100 scoring function ranks saved outfits.
12. **What does `isProcessed` mean?** The garment's AI classification finished.
13. **How does the UI know processing is done?** Client polls `/api/garments/[id]/status`.
14. **What's `cn()`?** A Tailwind class merger (`clsx` + `tailwind-merge`).
15. **Styling system?** Tailwind v4 + cva variants + Base UI primitives.
16. **What does `after()` do?** Runs work after the response is sent (background-ish jobs).
17. **How are routes protected?** `proxy.ts` Clerk middleware + per-route `auth()`.
18. **How are duplicate outfits avoided?** Sorted garment-ID fingerprint compared in a `Set`.
19. **What is the preference profile?** Learned favorite colors/styles/etc. from user behavior.
20. **Monorepo tool?** npm workspaces (frontend + backend packages).

## Intermediate (30)
1. **Why route handlers instead of NestJS?** One deploy, shared types, less infra; logic isolated in a workspace package for testability.
2. **How is the backend package consumed?** Imported via a barrel; `transpilePackages` compiles its TS in Next.
3. **Why `serverExternalPackages` for ONNX?** Native binary can't be bundled; kept external.
4. **Explain the upload pipeline.** Validate → Cloudinary/base64 → create row → `after()` classify + BG-remove → update.
5. **How do you validate Gemini classification?** Coerce category to a valid enum, clamp confidence 0–100, blanks→"Unknown".
6. **How do you validate generated outfits?** name present, 2–5 garments, IDs exist in input, ≤1 bottom/≤1 footwear, dedupe.
7. **What happens on Gemini 503?** Fall back to `gemini-2.0-flash`; `withRetry` backoff.
8. **How does scoring weight weather?** 0–40 band with hot/cold/rain keyword boosts/penalties + layering/footwear rules.
9. **How is recency handled?** Wear penalty: −50 today, −25 yesterday, −10 last week.
10. **How does occasion affect score?** +25 exact, +12 compatible (`OCCASION_GROUPS`), −15 conflict, 0 if untagged.
11. **How is preference learned?** Weighted events (wear +10, like +5, fav +3, dislike −5) → JSON score map → thresholded arrays.
12. **Where do penalties from preferences come from?** Negative entries in `preferenceScore` apply up to −30.
13. **Why a 15-min weather cache?** Weather changes slowly; cuts API calls/cost.
14. **What's the rate limit on generation and why?** 1/min/user to protect Gemini cost/quota.
15. **How is "last worn" computed for a garment?** Join through outfits→wears, `take:1` newest.
16. **How do you prevent N+1 queries?** Prisma `include`/`select` and `Promise.all` for independent reads.
17. **Why store `weatherContext`/`preferenceScore` as JSON?** Flexible, schema-light, read as a blob.
18. **How does cold start work?** Empty outfits → `coldStartReason` `no_garments`/`no_outfits`.
19. **Why client-side background removal option?** Offload server, skip a round trip; server path is the fallback.
20. **How are errors surfaced to the client?** Uniform `{success,error}` + proper status codes.
21. **How do you keep users isolated?** `where:{userId}` from the verified Clerk session everywhere.
22. **Why no `User` table?** Identity is Clerk-owned; rows store the Clerk `userId`.
23. **What does `OutfitGarment` model?** The M:N join with `@@unique([outfitId,garmentId])`.
24. **How is the weekly planner bounded to one/day?** `@@unique([userId, plannedDate])`.
25. **What's the season logic?** Month→season; All-Season garments always match.
26. **How is tie-breaking done in ranking?** Higher score first, then newest outfit.
27. **What testing exists?** Vitest unit tests on the backend services (`npm test`).
28. **How are secrets handled and what if missing?** Env vars; graceful degradation (mock weather, base64, skip classify).
29. **Why `withRetry` with exponential backoff?** Transient AI/Cloudinary failures.
30. **What's the `Recommendation` table for?** Logging an explanation + weather snapshot per recommendation event.

## Advanced (30)
1. **`after()` durability tradeoff and fix?** No cross-instance retry/persistence; if the function dies mid-run the job is lost (only in-run `withRetry`). Fix: durable queue + idempotent workers.
2. **Make the in-memory rate limiter correct on serverless?** Move to Redis/Upstash sliding-window keyed by `userId:endpoint`.
3. **Where would `pgvector` fit?** Store garment embeddings; add a cosine-similarity compatibility term to `scoreOutfit`; ANN index for scale — keep rules for explainability.
4. **Guarantee atomicity of outfit creation?** Prisma nested writes are atomic; multi-step preference recompute should use `prisma.$transaction`.
5. **Hit the <3s recommendation SLA at 1M users?** Precompute daily top-N per user in a nightly job; serve from cache; recompute on wardrobe change.
6. **Detect/handle LLM prompt injection via garment names?** Treat names as data; never let them alter system rules; re-validate IDs; optionally sanitize.
7. **Model-agnostic AI layer?** Wrap providers behind a `classify`/`generate` interface; route by cost/availability; the current Gemini wrapper is the seam.
8. **Scale Cloudinary cost?** Aggressive transformations/`f_auto,q_auto`, lazy variants, lifecycle deletion of originals after processing.
9. **DB connection storms on serverless?** PgBouncer/Prisma Accelerate; cap pool; consider data API.
10. **Idempotent uploads?** Client idempotency key + dedupe by content hash to avoid double rows on retry.
11. **Test the scorer without a DB?** `scoreOutfit` is pure → unit-test with fixture outfits/weather/prefs (it already is).
12. **Bias in preference learning (filter bubble)?** Inject exploration (occasionally surface lower-scored/never-worn items); decay old signals.
13. **Weight-tuning methodology?** A/B test weights against engagement; later learn weights via logistic regression on wear outcomes.
14. **Multi-region data residency?** Region-pinned Postgres + Clerk regions; route by user region.
15. **Observability for the AI pipeline?** Trace each job (classify/generate) with latency, token cost, failure reason; alert on 429/503 rates.
16. **Race: classify and BG-removal both update the same row?** They write disjoint fields; still, use targeted `update` (already) or `select`-for-update if expanded.
17. **Schema migration with zero downtime?** Expand-migrate-contract; `prisma migrate deploy`; backfill jobs.
18. **Prevent recommendation staleness after a dislike?** Dislike feeds both per-outfit feedback (−30) and the global preference penalty; recompute profile on event.
19. **Cap LLM cost per user?** Per-user monthly generation/classification quota in Redis; cache classifications by image hash.
20. **Handle 10k garments per user in generation?** Pre-filter by occasion/weather/season before sending to Gemini; cap prompt size; cluster the wardrobe.
21. **Why deterministic explanations matter legally/UX-wise?** Auditability, trust, debuggability — you can always answer "why this outfit?"
22. **Failure mode if OpenWeather is down?** Forecast→current→seasonal-mock fallback chain; recommendations still work.
23. **Secure the base64 fallback from bloating prod?** It's dev-only; enforce Cloudinary presence in prod via config assertion.
24. **Add real-time processing status?** Replace polling with SSE/WebSocket push from the worker.
25. **GDPR/delete-my-data?** Cascade deletes already on outfit children; add a purge job for Cloudinary assets + Clerk webhook on user deletion.
26. **Prevent duplicate outfits at the DB layer?** Store a normalized garment-set hash column with a unique index.
27. **Throttle Gemini globally, not just per user?** Token-bucket at a gateway/Redis shared across instances.
28. **Make recommendations explain *negative* choices?** Already partial (penalties); expose "excluded because worn today / rain-unsafe suede."
29. **Sharding strategy?** Shard by `userId` (all data is user-scoped) — clean shard key.
30. **Extract the AI engine to a microservice — what's the contract?** `classifyGarment(image)`/`generateOutfits(garments,occasion)` over RPC/HTTP; the workspace package boundary already defines it.

---

# 15. Project Defense Round (25 skeptical questions + answers)

1. **"Why call this 'AI' when ranking is just if-statements?"** The AI is the multimodal vision + generation layer (Gemini). Ranking is *deliberately* a deterministic rule engine because explainability is a product requirement — that's a design choice, not a limitation.
2. **"Your docs say NestJS/pgvector/Redis — where are they?"** Those are the target architecture; the shipped MVP uses Next route handlers, a rule engine, and `after()`. I can explain exactly why each was deferred and the migration path.
3. **"`after()` isn't a real queue — what if it dies?"** Correct — no durability across instances; only in-run retry. For production I'd move to BullMQ/QStash with idempotent workers. I chose `after()` for instant UX with zero infra in an MVP.
4. **"Your rate limiter is useless on serverless."** Per-instance, yes. It still curbs casual abuse and protects cost in single-instance/dev; distributed correctness needs Redis. I know the gap.
5. **"How do you trust anything Gemini returns?"** I don't — every field is normalized/clamped, every garment ID is validated against the input set, outfits violating composition rules are dropped, and malformed JSON is caught. LLM output is untrusted I/O.
6. **"What if two users have the same garment — any leakage?"** None. Every query filters by the verified Clerk `userId`; there is no code path that reads another user's rows.
7. **"How does auth actually work?"** Clerk middleware establishes session from a signed token; each route independently calls `auth()` and 401s without a `userId`. Defense in depth.
8. **"DB goes down — what happens?"** Reads/writes fail with a 500 envelope; the app doesn't crash. Weather/classification have their own fallbacks, but core data needs Postgres — hence HA/replicas in production.
9. **"Scale to 1M users — concretely."** Pooling (PgBouncer), Redis for cache/rate-limit, durable AI queue, read replicas, nightly precomputed recommendations, shard by `userId`. (See §9.)
10. **"Why Gemini over OpenAI?"** Cost/latency + native JSON mode for a high-volume classification path; abstracted behind a wrapper with a model fallback, so switching is cheap.
11. **"Your weights (40/30/30…) are arbitrary."** They're heuristic priors, hand-validated. The honest next step is learning them from wear outcomes via A/B tests / logistic regression. The architecture already logs the needed signals.
12. **"What stops a hallucinated outfit reaching the DB?"** The validation+dedupe+composition filter in `/api/outfits/generate`. Invalid → dropped; all invalid → 422.
13. **"No tests?"** Backend services use Vitest (`npm test`); the pure scorer is unit-testable. Coverage and route/integration tests are a known gap.
14. **"Why no client cache — isn't that wasteful?"** For an MVP, simplicity beat cache-invalidation bugs. TanStack Query is the planned upgrade.
15. **"How is the <3s recommendation goal met?"** Today it's a few indexed reads + pure computation. At scale, precompute nightly and serve from cache.
16. **"What about cold start?"** Detected explicitly (`no_garments`/`no_outfits`) so the UI guides the user; new users still get weather-led ranking from neutral baselines.
17. **"Base64-in-DB? Really?"** Dev-only fallback so the app runs without Cloudinary creds. Never prod; I'd assert Cloudinary presence in production config.
18. **"Why no `User` table?"** Clerk is the identity source of truth; duplicating it invites drift. I store the Clerk id and scope by it.
19. **"Occasion logic — how compatible vs conflicting?"** `OCCASION_GROUPS` maps each occasion to compatible ones (+12); exact +25; outside the group −15; untagged neutral.
20. **"What if Gemini is rate-limited mid-day?"** 503 fallback model + `withRetry`; failures degrade gracefully (classification just stays pending and retries).
21. **"Your weather cache is in-memory — stale/per-instance."** 15-min TTL bounds staleness; per-instance duplication is acceptable now, Redis later.
22. **"Recommendations could keep suggesting the same look."** Recency penalty (−50/−25/−10) actively rotates choices; variety is also enforced in the generation prompt.
23. **"How do you prevent a filter bubble in preference learning?"** Honest gap — I'd add exploration (surface never-worn/low-score items occasionally) and signal decay.
24. **"What's genuinely hard here vs CRUD?"** Two things: making LLM output safe/deterministic enough to persist, and designing an explainable scoring+learning loop. The CRUD is scaffolding.
25. **"If I removed the AI, what's left?"** A solid wardrobe manager with a weather/occasion rule engine — still useful, which is intentional: the product degrades gracefully without AI.

---

# 16. Hidden Follow-Up Questions (3 per key answer)

**On the rule engine**
- *Q:* How would you validate the weights empirically? *A:* Log recommendation→wear outcomes, then A/B test weight sets and/or fit a logistic model predicting "worn."
- *Q:* What if two outfits tie at 100? *A:* Newest `createdAt` wins; could add a deterministic hash tiebreak for stability.
- *Q:* How do you add a new signal (e.g., color harmony)? *A:* New bounded term in `scoreOutfit` + a line in `explainRecommendation`; pure function makes it test-safe.

**On `after()` / background jobs**
- *Q:* How do you make jobs idempotent? *A:* Key by garment id + a processing flag; updates are field-targeted so re-runs converge.
- *Q:* How do you observe failures? *A:* Today logs; production = job traces + alert on failure rate.
- *Q:* Migration to a queue — what changes in code? *A:* Replace `after(fn)` with `queue.add(payload)`; worker calls the same service functions.

**On Gemini validation**
- *Q:* Why not function-calling/structured output? *A:* Valid upgrade; JSON-mode + manual validation was simplest and provider-portable.
- *Q:* What if it returns 4 garments but one is a 2nd bottom? *A:* The ≤1-bottom rule drops it before persistence.
- *Q:* Cost control? *A:* Per-user quota + cache classifications by image hash.

**On auth/isolation**
- *Q:* Could a forged `userId` in the body bypass scoping? *A:* No — `userId` only ever comes from the verified `auth()`, never the request body.
- *Q:* Roles/admin? *A:* Not yet; would add Clerk roles + middleware checks.
- *Q:* Session revocation? *A:* Clerk-managed; tokens rotate, revocation is immediate server-side.

**On scaling**
- *Q:* First metric you'd watch? *A:* DB pool saturation + Gemini 429 rate.
- *Q:* Cheapest big win? *A:* Precompute daily recommendations (turns the hot path into a cache read).
- *Q:* Shard key choice? *A:* `userId` — every row is user-scoped.

---

# 17. Production-Grade Improvements

- **Missing now:** durable queue, distributed rate-limit/cache (Redis), structured logging + Sentry, schema-level input validation (Zod), automated tests/CI, embeddings/pgvector, client data-cache (TanStack Query), RBAC/admin, GDPR purge of Cloudinary assets + Clerk deletion webhook.
- **Enterprise needs:** SSO/SAML, audit logs, per-tenant quotas, SOC2-style secret rotation, content moderation on uploads, DR/HA Postgres with PITR + replicas.
- **Monitoring:** request tracing, AI cost/latency dashboards, quota/429 alerts, uptime checks.
- **Security:** distributed rate limiting, upload virus/content scanning, CSP headers, dependency scanning, per-provider key rotation.
- **Scalability:** precomputed recommendations, read replicas, queue-based AI workers, embeddings ANN index, CDN edge caching of read APIs.
- **Cost optimization:** cache classifications by image hash, Cloudinary `q_auto/f_auto` + lifecycle deletion, batch/queue Gemini calls, model routing (cheap model first).

---

# 18. Complete Viva Preparation Sheet (rapid revision)

- **Architecture:** Next.js 16 full-stack (RSC + route handlers) → shared `@style-sync/backend` services → Prisma/Postgres. Clerk auth (`proxy.ts` + per-route `auth()`). Cloudinary images, Gemini AI, OpenWeather, `after()` background jobs.
- **Tech stack:** Next 16, React 19, TS, Tailwind v4 + Base UI + cva, Clerk, Prisma 7 + pg, Postgres, Gemini 2.5 Flash, `@imgly/background-removal`, Cloudinary, OpenWeather, Vitest, npm workspaces.
- **Key APIs:** `POST /api/upload`, `POST /api/outfits/generate`, `GET /api/recommendations`, `/api/garments[/id/status|classify|remove-background]`, `/api/recommendations/[id]/(like|dislike|wear)`, `/api/planner`, `/api/preferences`, `/api/insights`, `/api/wear-history`.
- **Database:** Garment, Outfit, OutfitGarment(M:N), OutfitWear, Recommendation, RecommendationFeedback(+enum), OutfitPlan, UserPreference(JSON scores). `userId`-indexed everywhere; no local User table (Clerk).
- **Security:** Clerk sessions, `where:{userId}` isolation, Prisma-parameterized queries, input whitelists, rate-limit on generation, secrets in env with graceful degradation.
- **Deployment:** Vercel + managed Postgres + Cloudinary + Clerk + Gemini + OpenWeather; `prisma generate` on install; serverless.
- **50 must-know Q (one-liners):**
  1. Stack? Next16/React19/Prisma/Postgres/Clerk/Gemini. 2. Backend? Route handlers + service pkg. 3. AI model? Gemini 2.5 Flash. 4. Why not OpenAI? Cost/latency/JSON mode. 5. Recommendation type? Deterministic rule engine. 6. Score range? 0–100. 7. Weather weight? 0–40. 8. Recency penalty? −50/−25/−10. 9. Occasion? +25/+12/−15. 10. Preference weights? wear+10/like+5/fav+3/dislike−5. 11. Background jobs? `after()`. 12. Queue? None (gap). 13. Rate limit? 1/min generation, in-memory. 14. Auth? Clerk + per-route `auth()`. 15. Isolation? `userId` scoping. 16. Image storage? Cloudinary + base64 fallback. 17. BG removal? @imgly client/server ONNX. 18. Weather source? OpenWeather + mock fallback. 19. Cache? 15-min weather, in-memory. 20. ORM? Prisma 7 + adapter-pg. 21. DB? Postgres. 22. pgvector? Planned, not built. 23. M:N? OutfitGarment. 24. Dedupe outfits? sorted-ID fingerprint Set. 25. Validate LLM IDs? against input Set. 26. Malformed JSON? extractJson + guard. 27. 503 handling? fallback to 2.0-flash. 28. Cold start? coldStartReason. 29. Min garments to generate? 3. 30. Outfit size? 2–5. 31. ≤1 bottom/≤1 footwear? yes. 32. Tests? Vitest backend. 33. Monorepo? npm workspaces. 34. Styling merge? cn(). 35. UI primitives? Base UI. 36. Status updates? polling. 37. Planner uniqueness? (userId,date). 38. Pref profile storage? JSON in UserPreference. 39. Explainability? explainRecommendation. 40. Tie-break? newest. 41. Secrets? env vars. 42. Missing keys? graceful degrade. 43. Retry? exponential backoff x3. 44. Deploy target? Vercel. 45. CSRF? Clerk + same-origin. 46. XSS? React escaping. 47. SQLi? Prisma params. 48. Biggest gap? durable queue + distributed limiter. 49. Scale lever? precompute recommendations. 50. Shard key? userId.

---

# 19. Knowledge Gaps (and how to prepare)

1. **Docs vs reality drift.** *Missing:* code doesn't match `architecture.md`. *Why they'll ask:* they'll read your README and probe. *Prep:* lead with §0's truth table; frame the doc as "target architecture / roadmap."
2. **Recommendation weight justification.** *Missing:* empirical basis. *Why:* "how do you know 40 is right?" *Prep:* call them heuristic priors; describe the A/B + logistic-regression validation plan.
3. **Durability of `after()`.** *Missing:* persistence/retry semantics. *Why:* reliability questions. *Prep:* know exactly what's lost on failure and the queue migration.
4. **Distributed correctness (rate-limit/cache).** *Missing:* serverless multi-instance behavior. *Why:* classic scaling trap. *Prep:* Redis sliding-window answer.
5. **No automated route/integration tests + CI.** *Why:* quality gate. *Prep:* state what Vitest covers and what you'd add (Playwright, route tests, GH Actions).
6. **pgvector/embeddings unbuilt.** *Why:* docs promise it. *Prep:* describe the hybrid rules+vector design and where it slots into `scoreOutfit`.
7. **Cost modeling of AI.** *Why:* unit economics. *Prep:* per-classification/generation token cost, caching by image hash, quotas.

---

# 20. Interview Readiness Score

| Dimension | Score /10 | Notes / weakness |
| --- | --- | --- |
| Technical Depth | 8 | Strong on the AI pipeline + scorer; thin on tests/observability. |
| Architecture Knowledge | 7 | Clear boundaries; must own the docs-vs-built gap confidently. |
| Frontend Knowledge | 7 | Solid Next/RSC/Tailwind; no client-cache story yet (know the upgrade). |
| Backend Knowledge | 8 | Route handlers + service pkg + validation are well understood; queue is a gap. |
| Database Knowledge | 7 | Good schema/indexing/relations; weak on transactions + scaling specifics — rehearse §5/§9. |
| Security Knowledge | 7 | Auth/isolation/validation solid; distributed rate-limit + moderation are gaps. |
| Deployment Knowledge | 6 | Serverless model clear; no CI/monitoring/Docker story — rehearse §10. |
| **Overall** | **7.2** | Genuinely strong, *non-generic* project. Biggest risk is the documentation gap — own it proactively and you present as senior-aware. |

**Top 3 things to drill before an interview:**
1. The §0 truth table — never get caught defending unbuilt infra.
2. `scoreOutfit` weights + the generation validation pipeline — your differentiators.
3. The scaling story (§9) and the production-gap list (§17) — shows senior judgment.

---

*Generated from the actual codebase (frontend route handlers, `@style-sync/backend` services, Prisma schema). Where this contradicts `context/architecture.md`, the code wins — and so will you in the interview.*
