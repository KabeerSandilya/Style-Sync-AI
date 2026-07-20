# StyleSync AI — Phase 3 Feature Specification

> **Theme: Know Your Style. Own Your Wardrobe.**
>
> Phase 1 → Digitize & organize. Phase 2 → Recommend & plan. Phase 3 → Understand & express.

---

## Strategic Goal

Phase 3 shifts the app from a reactive tool ("what should I wear today?") into an active style intelligence layer ("who am I as a dresser, and how do I get more from what I own?"). It adds depth to the data moat built in Phases 1–2 and introduces the first social surface — turning StyleSync from a personal utility into a platform.

---

## Feature Roadmap

| ID | Feature | Priority | Effort | Depends On |
|----|---------|----------|--------|------------|
| F1 | Style DNA Profile | **P0** | Medium | Phase 2 wardrobe + preferences |
| F2 | Capsule Wardrobe Auditor | **P0** | Medium | Phase 2 outfit combinations + wear history |
| F3 | Look Book (Style Journal) | **P1** | Medium | Phase 1 garments, Phase 2 outfits |
| F4 | Flat Lay Builder | **P1** | High | Phase 1 background-removed images |
| F5 | Community Style Feed | **P2** | High | Phase 2 outfits, Look Book (F3) |
| F6 | Durable AI Job Queue | **P0** | Medium | Phase 1 `after()` jobs |
| F7 | Redis-backed Cache & Rate Limiting | **P0** | Low | Phase 2 in-memory maps |

---

## F1 — Style DNA Profile

### What it is
A single-page AI-generated style identity card synthesized from the user's classified wardrobe, outfit history, and preference profile. Surfaces: a named style archetype, dominant color story, signature pieces, and style keywords. Updated on demand (or automatically when wardrobe changes significantly).

### User Story
> "After adding 30 garments, I want to see an editorial summary of my personal style — not just raw stats, but a coherent identity I recognize."

### Functional Requirements
- A "Generate Style DNA" action in the Insights page (or its own `/style-dna` route).
- Gemini receives a structured wardrobe summary: all garment categories, styles, colors, seasons, most-worn outfits, dislike patterns from `preferenceScore`.
- Returns a structured response:
  - `archetype` — 2–4 word label (e.g., "Quiet Luxury Minimalist", "Urban Eclectic")
  - `colorStory` — 3–5 hex or named colors with a 1-line narrative
  - `signaturePieces` — 2–3 garment IDs from the user's actual wardrobe that define the look
  - `styleKeywords` — 6–8 adjectives/hum
  - `styleNarrative` — 2–3 sentence editorial description (voice: fashion editor, not AI chatbot)
  - `wardrobeStrengths` — what the wardrobe does well
  - `blindSpots` — what's missing or underused
- Result is persisted (new `StyleDNA` model) with a `generatedAt` timestamp. Shown as-is until user regenerates.
- Regeneration is rate-limited (1 generation per 24 hours).

### Technical Notes
- New Gemini service function `generateStyleDNA(wardrobeSummary)` in `@style-sync/backend`.
- `wardrobeSummary` is derived server-side: aggregate category counts, top colors, top styles, wear frequency, dislike map from `preferenceScore`. No raw images sent — token-efficient.
- Output validated field-by-field (same pattern as outfit generation).
- New API route: `POST /api/style-dna` (generate/regenerate) and `GET /api/style-dna` (fetch latest).

### Database Changes
```prisma
model StyleDNA {
  id               String   @id @default(cuid())
  userId           String   @unique
  archetype        String
  colorStory       Json     // { colors: string[], narrative: string }
  signaturePieces  String[] // garment IDs
  styleKeywords    String[]
  styleNarrative   String
  wardrobeStrengths String[]
  blindSpots       String[]
  generatedAt      DateTime @default(now())

  @@index([userId])
}
```

### UI Notes
- Full-bleed editorial card. Serif headline with the archetype name. Color story shown as paint-chip swatches. Signature pieces rendered as garment thumbnail strip. Keywords as tight uppercase chips. Narrative in Cormorant Garamond italic.
- Empty state: dashed border card with a CTA to generate; locked behind "≥ 10 classified garments" gate.
- Regeneration shows a subtle "last generated X days ago" line.

---

## F2 — Capsule Wardrobe Auditor

### What it is
An AI + data analysis tool that answers the question: "How hard is my wardrobe actually working?" It shows combinatorial value per garment, flags low-performers, identifies wardrobe gaps, and suggests specific garment types (not brands) that would unlock the most new outfit combinations.

### User Story
> "I want to know which 5 pieces in my wardrobe make the most outfits, which 10 pieces I've never actually worn, and what single new item would give me the biggest combinatorial payoff."

### Functional Requirements
**Combinatorial Value Score (CVS)** — For each garment, compute:
- Number of saved outfits it appears in.
- Number of times those outfits have been worn.
- Average recommendation score when it is part of a ranked outfit.
- Penalty if never worn despite being in ≥1 outfit.

**Wardrobe Tiers**
- **Workhorses** — top 20% by CVS (highlight these).
- **Sleeping Beauties** — classified, in outfits, never worn (surface with a wear nudge).
- **Orphans** — classified but in zero outfits (flag for re-generation or removal).
- **Unprocessed** — uploaded but `isProcessed = false` (link to retry classification).

**Gap Analysis** — Gemini receives the wardrobe composition (category counts, dominant styles, seasons) and existing outfit patterns. Returns:
- `gaps` — list of `{ category, reason }` items (e.g., "A light layering piece (cardigan/blazer) for spring — your warm-weather outfits lack versatile mid-layers").
- `capsuleScore` — 0–100 rating of how "complete" the wardrobe is for the user's preferred occasions.

**Purge Suggestions** — Items unworn for 180+ days AND in zero active outfits, surfaced with "Consider donating" flag (soft, never auto-deletes).

### Technical Notes
- CVS computed in a new `backend/src/insights/capsule.ts` service, pure TypeScript over existing Prisma queries.
- Gap analysis is a new Gemini call `analyzeWardrobeGaps(composition, occasions)` — token-light, returns structured JSON.
- New API route: `GET /api/insights/capsule`.
- Cached for 6 hours (per-user, in Redis once F7 is done; in-memory `Map` as interim).

### Database Changes
None required. CVS is computed on-the-fly from existing `Outfit`, `OutfitGarment`, `OutfitWear`, `Recommendation` tables.

### UI Notes
- New tab in the Insights page: "Capsule Audit".
- Top bar: CVS breakdown donut chart (Workhorses / Sleeping Beauties / Orphans / Unprocessed counts).
- Garment grid sorted by CVS with a subtle color-coded badge per tier.
- "Gap Recommendations" card below grid — Gemini's suggestions in an editorial list.
- Purge suggestions in a collapsible section (non-alarming copy: "Pieces that might be ready for a new home").

---

## F3 — Look Book (Style Journal)

### What it is
A personal visual diary where users document their real-world outfit moments — attaching a photo to an existing saved outfit, adding a mood, occasion note, and a self-rating. Transforms the outfit log from raw data into a scrollable editorial journal.

### User Story
> "After wearing an outfit, I want to attach a photo of the actual look (from my mirror or camera), give it a rating, and be able to scroll back through my style evolution."

### Functional Requirements
- "Add to Look Book" action on any outfit card in the History view.
- Upload a look photo (same Cloudinary pipeline, new folder `stylesync/lookbook/{userId}`).
- Fill in: date worn (defaults to today), mood tags (multi-select from preset list: Confident, Comfortable, Underdressed, Overdressed, Effortless, Bold, Casual), self-rating (1–5), free-text notes.
- Look Book view (`/lookbook`): infinite scroll grid of look cards, sorted by date. Each card: photo, outfit name, date, rating stars, mood chips.
- Filter by: month, mood, rating, occasion.
- Single-look view: full photo + all metadata + linked outfit (which links back to garment grid).
- Sharing: a look can be marked "shareable" (feeds into F5).

### Technical Notes
- New `LookBookEntry` model.
- New API routes: `POST /api/lookbook`, `GET /api/lookbook`, `GET /api/lookbook/[id]`, `PATCH /api/lookbook/[id]`, `DELETE /api/lookbook/[id]`.
- Photo upload reuses the existing Cloudinary upload logic; new folder path.
- Mood tags are a `String[]` enum-validated server-side.

### Database Changes
```prisma
model LookBookEntry {
  id          String   @id @default(cuid())
  userId      String
  outfitId    String?
  photoUrl    String
  date        DateTime
  rating      Int      // 1–5
  mood        String[] // validated enum subset
  notes       String?
  isShareable Boolean  @default(false)
  createdAt   DateTime @default(now())

  outfit      Outfit?  @relation(fields: [outfitId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([userId, date])
}
```

---

## F4 — Flat Lay Builder

### What it is
An interactive canvas where users compose and export a flat-lay collage of their outfit — using the background-removed garment images already in the system. No 3D avatar. Think Pinterest board builder, scoped to your own wardrobe.

### User Story
> "I want to drag my blazer, trousers, and sneakers onto a canvas, arrange them like a magazine flat lay, and export the image to share."

### Functional Requirements
- Accessible from any outfit's detail view ("Open in Flat Lay Builder").
- Pre-populates with the outfit's garment images (processed/background-removed).
- Canvas: white or cream background (toggleable). Per-item controls: drag, resize (aspect-ratio-locked), layer order (bring forward/send back), horizontal flip.
- "Add from wardrobe" button to pull in any other garment.
- Text annotation layer: add a caption in Cormorant Garamond (optional).
- Export as PNG (1:1 or 4:5 for Instagram). Watermark: `StyleSync AI` in bottom-right at 20% opacity (opt-out in settings).
- All compositing runs **client-side** via `<canvas>` API — no server round-trips.

### Technical Notes
- New route `/editor/flat-lay/[outfitId]` (or a modal on larger screens).
- Uses the HTML5 Canvas API + a lightweight interaction layer (drag-and-drop via pointer events, no Three.js needed).
- Export: `canvas.toBlob('image/png')` → download or share via Web Share API.
- `processedImageUrl` must be CORS-accessible (Cloudinary already serves with permissive CORS headers).
- No new DB models required. Compositions are not persisted (can be saved as a `LookBookEntry` photo via F3 integration).

### Database Changes
None. Canvas state is ephemeral in the client.

---

## F5 — Community Style Feed

### What it is
An opt-in public feed where users share Look Book entries or outfit flat lays with the StyleSync community. Lightweight social layer — no DMs, no follower graph in v1. Closer to a curated gallery than a social network.

### User Story
> "I want to share my flat lay with other StyleSync users, discover how other people style similar pieces, and save inspiring looks to my own wardrobe ideas."

### Functional Requirements
**Sharing**
- From Look Book (F3) or Flat Lay Builder (F4), user can publish to the community feed.
- Publishing requires a one-time "Community Profile" setup: display name + avatar (Clerk profile photo).
- Each published post: image, optional caption, occasion tag, like count.
- User can delete their own posts at any time.

**Feed**
- `/community` route: paginated grid of community posts, newest first.
- Filters: by occasion, trending (most likes in 7 days).
- Like/save a post (save = adds to a private "Inspiration" collection, not the wardrobe).
- No comments in v1 (reduces moderation surface).

**Privacy**
- Sharing is strictly opt-in at post level.
- Wardrobe data is never exposed — only the image and the occasion tag.
- Users can set their profile to private (removes all their posts from feed).

### Technical Notes
- New models: `CommunityPost`, `CommunityLike`, `InspirationSave`.
- New API routes: `POST/GET /api/community`, `POST /api/community/[id]/like`, `POST /api/community/[id]/save`, `DELETE /api/community/[id]`.
- Feed uses cursor-based pagination (`createdAt` + `id` composite cursor).
- Moderation stub: `isHidden` flag on `CommunityPost` (admin-settable, no UI yet).
- Images are already on Cloudinary — community posts just reference existing `photoUrl`.

### Database Changes
```prisma
model CommunityPost {
  id          String   @id @default(cuid())
  userId      String
  photoUrl    String
  caption     String?
  occasion    String?
  isHidden    Boolean  @default(false)
  createdAt   DateTime @default(now())

  likes       CommunityLike[]
  saves       InspirationSave[]

  @@index([userId])
  @@index([createdAt])
}

model CommunityLike {
  id        String        @id @default(cuid())
  userId    String
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
}

model InspirationSave {
  id        String        @id @default(cuid())
  userId    String
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
}
```

---

## F6 — Durable AI Job Queue

### What it is
Replace `after()` with a proper durable queue for garment classification and background removal jobs. Critical for production reliability.

### Why Now
`after()` loses in-flight jobs if the serverless function is killed mid-run. At Phase 3 scale (Look Book uploads + community images adding to the processing load), silent job loss is unacceptable.

### Approach
- **Queue provider:** [QStash](https://upstash.com/docs/qstash) (HTTP-based, serverless-native, no infra to run). Alternative: BullMQ + Redis (more control, more ops).
- **Worker endpoints:** `POST /api/jobs/classify` and `POST /api/jobs/remove-background` — idempotent, keyed by garment ID.
- **Payload:** `{ garmentId, userId }` (small — image URL is fetched from DB by the worker).
- **Retry policy:** QStash retry with exponential backoff (3 attempts, max 60 s delay).
- **Idempotency:** worker checks `isProcessed` before doing work; if already done, returns 200 immediately.
- `after()` calls are replaced with `qstash.publishJSON(...)` in the upload route handler.
- `withRetry` inside workers is kept as a secondary guard against transient AI failures within a single attempt.

### Database Changes
None. Worker updates the same `Garment` fields as before.

---

## F7 — Redis-backed Cache & Rate Limiting

### What it is
Replace in-memory `Map`-based weather cache and rate-limit counters with Redis (Upstash), making them correct across serverless instances.

### Changes
**Rate limiting:** swap `lib/rate-limit.ts` fixed-window `Map` for Upstash Redis sliding-window (`@upstash/ratelimit`). Same interface, distributed correctness.

**Weather cache:** replace the module-level `Map` with a Redis `SET`+`GET` with 15-min TTL. Key: `weather:{city}` or `weather:{lat}:{lon}`.

**Style DNA cache (F1):** 24-hour Redis cache per user avoids re-running Gemini if the wardrobe hasn't changed.

**Capsule audit cache (F2):** 6-hour Redis cache per user.

**New env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

### Database Changes
None.

---

## Implementation Order

```
Sprint 1 (Infrastructure)
  F7 Redis         — unblocks correct rate limiting before user growth
  F6 Job Queue     — unblocks reliable processing for new upload types (F3, F4)

Sprint 2 (Intelligence)
  F1 Style DNA     — high-value, low-infra; leverages existing Gemini pipeline
  F2 Capsule Audit — pure data computation + one Gemini call; no new upload paths

Sprint 3 (Expression)
  F3 Look Book     — new upload type; needs F6 for job reliability
  F4 Flat Lay      — client-side canvas; no new backend jobs; can ship in parallel with F3

Sprint 4 (Social)
  F5 Community     — depends on F3 (shareable Look Book entries)
```

---

## New API Surface (Phase 3)

| Method | Route | Feature |
|--------|-------|---------|
| GET | `/api/style-dna` | F1 — fetch latest DNA |
| POST | `/api/style-dna` | F1 — generate/regenerate |
| GET | `/api/insights/capsule` | F2 — capsule audit |
| GET | `/api/lookbook` | F3 — list entries |
| POST | `/api/lookbook` | F3 — create entry |
| GET | `/api/lookbook/[id]` | F3 — single entry |
| PATCH | `/api/lookbook/[id]` | F3 — update |
| DELETE | `/api/lookbook/[id]` | F3 — delete |
| GET | `/api/community` | F5 — feed (paginated) |
| POST | `/api/community` | F5 — publish post |
| POST | `/api/community/[id]/like` | F5 — like/unlike |
| POST | `/api/community/[id]/save` | F5 — save to inspiration |
| DELETE | `/api/community/[id]` | F5 — delete own post |
| POST | `/api/jobs/classify` | F6 — worker endpoint |
| POST | `/api/jobs/remove-background` | F6 — worker endpoint |

---

## New Routes (Frontend)

| Route | Feature |
|-------|---------|
| `/style-dna` | F1 — Style DNA profile page |
| `/editor/flat-lay/[outfitId]` | F4 — Flat Lay Builder |
| `/lookbook` | F3 — Look Book journal |
| `/lookbook/[id]` | F3 — Single entry view |
| `/community` | F5 — Community feed |

---

## What Phase 3 Does NOT Include

- Brand/product recommendations or e-commerce integrations.
- Zod schema validation refactor (valuable but orthogonal — best done as a focused PR).
- TanStack Query client-cache refactor (same).
- RBAC / admin dashboard.
- Mobile app.

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Style DNA generation | ≤ 4 s end-to-end (wardrobe summary → Gemini → persist → return) |
| Capsule Audit load | ≤ 1.5 s (cached path ≤ 100 ms) |
| Flat Lay export | ≤ 2 s for a 4-garment composition |
| Job queue reliability | Zero silent job losses; ≥ 99% eventual success within 3 retries |
| Rate limit correctness | Consistent across ≥ 2 serverless instances (Redis-backed) |

---

*This spec is grounded in the Phase 1–2 codebase (as documented in DOSSIER.md). Every new feature is designed to fit the existing Next.js + Prisma + Gemini + Cloudinary stack without introducing new runtime dependencies beyond Upstash Redis and QStash.*
