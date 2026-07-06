# Community Style Feed (F5)

We are implementing **Community Style Feed** for **StyleSync AI**.

This is the fifth and final Sprint 3 ("Expression") feature from the Phase 3
roadmap (`context/feature-specs/Phase 3 specs.md`, F5). Look Book (F3, spec
28) and Flat Lay Builder (F4, spec 29) are both done. Per
`context/progress-tracker.md`'s "Next Up" note, F5 consumes the
`LookBookEntry.isShareable` flag added — but left unconsumed — in Unit 28.
This spec wires that flag to an actual publish action for the first time.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

Look Book (spec 28) lets a user mark an entry `isShareable`, and the Phase 3
brief frames F5 as StyleSync's first social surface, but nothing today reads
that flag or gives users a place to publish, browse, like, or save looks
from other users. Community Style Feed adds that thin social layer — opt-in
per post, no follower graph, no DMs, no comments — while reusing every image
and metadata field that already exists on a `LookBookEntry` rather than
introducing a parallel upload pipeline.

---

# Scope

Build:

### `CommunityProfile` model — one-time display name + avatar + privacy setup, gating all publishing
### `CommunityPost` / `CommunityLike` / `InspirationSave` models
### `POST/GET /api/community/profile` — fetch or create/update the caller's own profile
### `GET/POST /api/community` — feed (cursor-paginated "newest", capped top-N "trending") and publish
### `POST /api/community/[id]/like`, `POST /api/community/[id]/save`, `DELETE /api/community/[id]`
### "Publish to Community" action on `/lookbook/[id]` for entries with `isShareable: true`
### `/community` route — Feed / Saved tab switcher, occasion filter, trending toggle

Not built (out of scope for this unit):

* **Flat Lay Builder (F4) publishing.** The Phase 3 brief mentions "from Look
  Book *or* Flat Lay Builder," but the progress tracker's own "Next Up" note
  names only the Look Book `isShareable` flag as F5's dependency, and Flat
  Lay compositions are explicitly ephemeral/unpersisted (spec 29) — there is
  no server-side image to reference yet. Publishing a flat lay would require
  first uploading its exported PNG somewhere durable, which is a distinct
  follow-up, not implicit here.
* **Comments.** Explicitly excluded by the brief ("reduces moderation
  surface").
* **Follower graph / DMs.** Explicitly excluded by the brief.
* **Moderation UI.** `isHidden` is a DB-only admin stub, as specced — no
  admin route or dashboard.
* **Re-publishing a flat lay export or any image outside Look Book/Cloudinary.**
* **Editing a published post's caption/occasion after publish.** Delete +
  republish is the only correction path in v1 (mirrors how `LookBookEntry`
  itself has no photo-replace path in its `PATCH`, per spec 28).

---

# New Dependencies

None. Reuses the existing Cloudinary-hosted `photoUrl` already on
`LookBookEntry` (brief: "Images are already on Cloudinary — community posts
just reference existing `photoUrl`") and the existing `@clerk/nextjs` client
hook `useUser()` for the one-time profile setup's default display name and
avatar (the app currently only uses Clerk's `auth()` for `userId` server-side
and `<UserButton />` client-side — this is the first read of `useUser()`'s
profile fields, but it's a standard Clerk hook, not a new package).

---

# Database Changes

The Phase 3 brief's schema sketch covers `CommunityPost`/`CommunityLike`/
`InspirationSave` but not the per-user privacy toggle or one-time display
name — "Users can set their profile to private (removes all their posts
from feed)" needs a place to live that isn't per-post. Add a fourth model,
`CommunityProfile`, that a `CommunityPost` relates to by `userId` (there is
no local `User` table anywhere in this schema — every model stores a raw
Clerk `userId` string — so this is the first non-id-field relation in the
codebase, the same pattern Prisma already supports for `@unique` fields):

```prisma
model CommunityProfile {
  id          String   @id @default(cuid())
  userId      String   @unique

  displayName String
  avatarUrl   String
  isPrivate   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts       CommunityPost[]

  @@index([userId])
}

model CommunityPost {
  id                    String   @id @default(cuid())
  userId                String
  profile               CommunityProfile @relation(fields: [userId], references: [userId])

  sourceLookBookEntryId String?  @unique
  photoUrl              String
  caption               String?
  occasion              String?
  isHidden              Boolean  @default(false)

  createdAt             DateTime @default(now())

  likes                 CommunityLike[]
  saves                 InspirationSave[]

  @@index([userId])
  @@index([createdAt])
}

model CommunityLike {
  id        String        @id @default(cuid())
  userId    String
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime      @default(now())

  @@unique([userId, postId])
  @@index([postId])
}

model InspirationSave {
  id        String        @id @default(cuid())
  userId    String
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime      @default(now())

  @@unique([userId, postId])
  @@index([userId])
}
```

Notes on deviations from the brief's sketch:

* `sourceLookBookEntryId` is new (not in the brief) and `@unique` —
  publishing the same Look Book entry twice is idempotent (returns/reuses
  the existing post) rather than creating duplicates, mirroring the
  `Outfit.shareToken` idempotent-`POST` precedent from spec 19. It is
  nullable because a post could theoretically outlive its source entry
  (Look Book entry deletion does not cascade-delete the community post —
  see below).
* `CommunityLike.createdAt` is new (not in the brief) — required to compute
  "most likes in the last 7 days" for the trending filter without a
  separate rolling-window table.
* `LookBookEntry` gets **no** new field or relation pointing at
  `CommunityPost` — checking "already published" is done only on the single
  entry's detail page (one `findUnique` by `sourceLookBookEntryId`), never
  in the list/grid, so there is no N+1 risk to guard against with a cached
  pointer.
* Deleting a `LookBookEntry` does not cascade-delete its `CommunityPost` —
  the photo is still valid on Cloudinary and other users may have already
  liked/saved it; `sourceLookBookEntryId` simply becomes an orphaned
  reference (never dereferenced again once the post exists).

Create `backend/prisma/models/community.prisma` with all four models (one
file, following the `recommendation-feedback.prisma` precedent of grouping
tightly-coupled models together rather than one file per model).

---

# Backend

## Types (`backend/src/types/index.ts`)

```ts
export interface CommunityProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  sourceLookBookEntryId: string | null;
  photoUrl: string;
  caption: string | null;
  occasion: string | null;
  createdAt: string;
  profile: Pick<CommunityProfile, "displayName" | "avatarUrl">;
  likeCount: number;
  saveCount: number;
  isLikedByViewer: boolean;
  isSavedByViewer: boolean;
}
```

`isHidden` is deliberately omitted from the client-facing `CommunityPost`
type — it is an internal moderation flag, never sent to the client (routes
filter `isHidden: false` server-side, the same way `userId` is omitted from
the public `/share/[token]` payload in spec 19).

Export both from `backend/src/types/index.ts` and re-export from
`backend/src/index.ts` (`OCCASIONS`/`MOOD_TAGS`-style barrel section).

## Zod schemas (`frontend/lib/schemas.ts`)

* `UpsertCommunityProfileSchema` — `displayName` (1–40 chars, trimmed),
  `avatarUrl` (`z.string().url()`), `isPrivate` (boolean).
* `CreateCommunityPostSchema` — `sourceLookBookEntryId` (CUID),
  `caption` (optional, ≤ 300 chars), `occasion` (optional, one of
  `OCCASIONS`).
* `CommunityFeedQuerySchema` — `cursor` (optional CUID), `limit` (optional,
  default 12, max 30), `occasion` (optional enum), `sort`
  (`"newest" | "trending"`, default `"newest"`), `tab`
  (`"feed" | "saved"`, default `"feed"`) — mirrors `LookBookQuerySchema`'s
  coercion-from-`URLSearchParams` pattern.

## `GET/POST /api/community/profile/route.ts`

* `GET` — returns the caller's `CommunityProfile` or `{ success: true, data: null }`
  if none exists yet (never a 404 — "no profile yet" is a normal, expected
  state the client checks before allowing a publish).
* `POST` — upsert by `userId` (`prisma.communityProfile.upsert`), validated
  via `UpsertCommunityProfileSchema`. No rate limit (low-frequency, no AI
  cost, same tier as `PATCH /api/garments/[id]`).

## `GET/POST /api/community/route.ts`

**`POST`** (publish):
1. Auth via `auth()`; 401 if absent.
2. Require an existing `CommunityProfile` for the caller — 422 with a
   clear message ("Set up your Community Profile before publishing.") if
   none, so the client always completes profile setup before this call
   ever fires with a real payload.
3. Validate body via `CreateCommunityPostSchema`.
4. Load the `LookBookEntry` by `sourceLookBookEntryId`, verify
   `userId` ownership and `isShareable === true` — 404 if not found/not
   owned, 422 ("This entry isn't marked shareable.") if `isShareable` is
   false.
5. `prisma.communityPost.upsert({ where: { sourceLookBookEntryId }, ... })`
   — idempotent: republishing the same entry updates caption/occasion on
   the existing post instead of erroring or duplicating.
6. `occasion` defaults to the linked outfit's `occasion` (via
   `entry.outfit?.occasion`) when the caller omits it; `photoUrl` is always
   `entry.photoUrl` — never re-uploaded.
7. Rate-limited (`${userId}:community-publish`, 10/min) — spam guard, same
   shape as the other write endpoints (spec 23's `isRateLimited`).

**`GET`** (feed):
* `tab: "feed"` — `sort: "newest"` uses `LookBookQuerySchema`-style
  `id`-based cursor pagination (`orderBy: [{ createdAt: "desc" }, { id: "desc" }]`,
  `take: limit + 1`), filtered to `isHidden: false`, `profile.isPrivate: false`,
  and `occasion` when provided.
* `tab: "feed"` — `sort: "trending"` is **not** cursor-paginated. It loads
  up to 200 recent non-hidden, non-private candidates, computes each post's
  like count within the last 7 days via a filtered `_count` (Prisma's
  `_count.select.likes.where: { createdAt: { gte: sevenDaysAgo } }}` —
  supported without raw SQL), sorts in JS, and returns the top 20. This
  mirrors the fixed-length "Most Worn Outfits" style of list already used
  on the Insights page (Unit 13) rather than inventing keyset pagination
  over a computed, non-monotonic sort key.
* `tab: "saved"` — the caller's `InspirationSave` rows joined to their
  posts, same cursor shape as `"newest"`, ignoring the `profile.isPrivate`
  filter (a user's own saved posts stay visible to them even if the
  original poster later goes private — the save is a personal collection,
  not a live feed subscription).
* Every returned post includes `_count: { likes: true, saves: true }` and a
  per-viewer `likes`/`saves` sub-query filtered to the caller's `userId`
  (array-length check, same technique as `outfit.shareToken` boolean
  derivation) to populate `isLikedByViewer`/`isSavedByViewer`.

## `POST /api/community/[id]/like/route.ts` and `.../save/route.ts`

Toggle endpoints (not separate like/unlike routes) — each checks for an
existing `CommunityLike`/`InspirationSave` row for `(userId, postId)`; if
present, deletes it (unlike/unsave), otherwise creates it. Returns the new
boolean state and updated count. 404 if the post doesn't exist or is
hidden. No rate limit (cheap, idempotent-by-toggle, same class as
`PATCH /api/garments/[id]` favorite toggling).

## `DELETE /api/community/[id]/route.ts`

Ownership-checked hard delete (`userId` must match `post.userId`) — cascades
`CommunityLike`/`InspirationSave` rows via `onDelete: Cascade`. Does not
touch the source `LookBookEntry` or its `isShareable` flag.

---

# Frontend

## Files

`frontend/lib/hooks/use-community.ts`:
* `useCommunityProfile()` — plain `useQuery`.
* `useUpsertCommunityProfile()` — mutation, invalidates `QK.communityProfile()`.
* `useCommunityFeed(filters)` — `useInfiniteQuery` for `tab: "feed", sort: "newest"`
  (same `getNextPageParam` shape as `useLookBookEntries`); a plain `useQuery`
  for `sort: "trending"` and `tab: "saved"` (both non-cursor / already-small
  result sets) — one hook, branching internally on `filters.sort`/`filters.tab`
  rather than three separate hooks, since the caller (the `/community` page)
  only ever has one active mode at a time.
* `useLikePost()`, `useSavePost()`, `useDeleteCommunityPost()` — mutations,
  optimistic like/save toggle (mirrors `useToggleOutfitFavorite`'s optimistic
  pattern from Unit 21) invalidating the active feed query key on settle.

Add to `frontend/lib/query-keys.ts`:
```ts
communityProfile: () => ["community", "profile"] as const,
communityFeed:    (filters: object) => ["community", "feed", filters] as const,
```

`frontend/components/community/community-post-card.tsx` — photo, avatar +
display name header, occasion badge, caption, like button (filled heart +
count when liked), save button (bookmark icon), delete action (only when
`post.userId` matches the viewer — passed down as an `isOwn` prop from the
page, which already knows the signed-in `userId` via a lightweight
`GET /api/community/profile` round trip rather than threading Clerk's
`useUser()` into the card itself).

`frontend/components/community/community-profile-setup.tsx` — inline form
(display name input, `useUser()`-sourced avatar preview, private toggle)
rendered as step one of the publish dialog when `useCommunityProfile()`
resolves to `null`; also reachable standalone from `/community`'s header
("Edit Community Profile") once a profile exists.

`frontend/components/community/publish-to-community-dialog.tsx` — built on
`<EditorialDialog />` (spec 3's shell, same as `add-to-lookbook-dialog.tsx`
from spec 28). Two-step: profile setup (skipped if a profile already
exists) → caption input + occasion picker (prefilled from the linked
outfit's occasion, editable) → Publish button calling
`POST /api/community`.

`frontend/app/community/page.tsx` — `EditorNavbar` + `ProjectSidebar` shell
(same skeleton as `/lookbook`). Header: "Feed" / "Saved" tab switcher
(reusing the Capsule Audit tab-switcher pattern from Unit 26 — custom
editorial buttons, not the shadcn `Tabs` primitive), occasion pill row, a
"Trending" toggle (only meaningful on the Feed tab; hidden on Saved).
Body: responsive grid of `<CommunityPostCard />`, `IntersectionObserver`
sentinel for `"newest"`/`"saved"` (both cursor-paginated), no sentinel for
`"trending"` (fixed top-20, no more pages). Empty states: "No one has
shared a look yet." (Feed) / "Save looks you love to find them here."
(Saved).

## Publish entry point

`frontend/app/lookbook/[id]/page.tsx` gains a "Publish to Community" button,
shown only when `entry.isShareable` is true. Clicking opens
`<PublishToCommunityDialog entry={entry} />`. If the entry is already
published (`GET /api/community?sourceLookBookEntryId=` — a narrow
single-purpose lookup, not the paginated feed query — returns a match), the
button instead reads "Update Community Post" / "View on Community" and
skips straight to step two pre-filled with the existing caption/occasion.

## Navigation

Add a "Community" link to `EditorNavbar`'s `secondaryItems` array
(`frontend/components/editor/editor-navbar.tsx:48-53`), after "Look Book" —
it belongs with the "looking back or looking deeper" group, not the daily
wardrobe/outfits/planner loop.

---

# Technical Notes — Deviations from the Phase 3 Brief

* Added `CommunityProfile` (not in the brief's schema sketch) — necessary
  to hold the per-user display name/avatar/privacy state the brief's prose
  requires but its schema omitted.
* Added `CommunityPost.sourceLookBookEntryId` (unique) — makes publishing
  idempotent, consistent with the `shareToken` precedent (spec 19) instead
  of allowing silent duplicate posts from a double-click or retry.
* Added `CommunityLike.createdAt` — required to compute the brief's own
  "trending (most likes in 7 days)" filter without a separate audit table.
* Flat Lay Builder (F4) publishing is deferred — see Scope. The brief lists
  it as a source but the progress tracker's actual dependency note (Unit 29
  completion) names only Look Book's `isShareable` flag.
* "Trending" is a fixed top-20 snapshot, not infinitely paginated — ranking
  by a rolling 7-day like count isn't a stable cursor key, so it follows
  the existing fixed-list precedent (Insights page's Most/Least Worn
  sections) instead of inventing unstable keyset pagination.

---

# Files to Create

```txt
backend/prisma/models/community.prisma
frontend/lib/hooks/use-community.ts
frontend/app/api/community/profile/route.ts
frontend/app/api/community/route.ts
frontend/app/api/community/[id]/route.ts
frontend/app/api/community/[id]/like/route.ts
frontend/app/api/community/[id]/save/route.ts
frontend/components/community/community-post-card.tsx
frontend/components/community/community-profile-setup.tsx
frontend/components/community/publish-to-community-dialog.tsx
frontend/app/community/page.tsx
```

# Files to Modify

```txt
backend/src/types/index.ts
  — add CommunityProfile, CommunityPost interfaces
backend/src/index.ts
  — export CommunityProfile/CommunityPost types
frontend/lib/schemas.ts
  — add UpsertCommunityProfileSchema, CreateCommunityPostSchema, CommunityFeedQuerySchema
frontend/lib/query-keys.ts
  — add QK.communityProfile(), QK.communityFeed(filters)
frontend/app/lookbook/[id]/page.tsx
  — "Publish to Community" action when entry.isShareable is true
frontend/components/editor/editor-navbar.tsx
  — add "Community" link to secondaryItems
```

---

# Constraints

Do **not**:

* Add a new Cloudinary upload path for community posts — always reference
  the source `LookBookEntry.photoUrl` directly.
* Expose `userId` or any wardrobe/garment data on a `CommunityPost` payload
  — only `photoUrl`, `caption`, `occasion`, and the profile's
  `displayName`/`avatarUrl` are public.
* Build comments, a follower graph, or DMs.
* Allow publishing an entry whose `isShareable` is false, or one the caller
  doesn't own.
* Let a private profile's posts appear in another user's Feed or Trending
  tab (their own Saved tab may still show previously-saved posts from a
  now-private profile).
* Cascade-delete a `CommunityPost` when its source `LookBookEntry` is
  deleted.

---

# Check When Done

* Publishing requires a `CommunityProfile` first; the dialog's step one
  appears exactly once per user (subsequent publishes skip straight to
  caption/occasion).
* `/lookbook/[id]` shows "Publish to Community" only when `isShareable` is
  true, and republishing the same entry updates rather than duplicates.
* `/community` Feed tab (Newest) infinite-scrolls; Trending shows a capped,
  non-paginated top list ranked by likes in the last 7 days; Saved tab
  shows only the caller's saved posts.
* Occasion filter narrows all three views correctly.
* Like/save toggle instantly (optimistic) and persist after refresh;
  counts match across the feed and the single-post view.
* Deleting a post removes it from feed/saved for everyone and cascades its
  likes/saves.
* Setting a profile private removes all of that user's posts from other
  users' Feed/Trending immediately, without deleting the posts.
* No wardrobe/garment/userId data leaks through any `/api/community*`
  response.
* `npx tsc --noEmit` — zero errors (backend and frontend).
* `npm run build` passes.
* No lint errors.
