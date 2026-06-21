# Weekly Outfit Planner

We are implementing a **Weekly Outfit Planner** for **StyleSync AI**.

This feature adds a planning layer on top of the existing recommendation and
occasion systems. Users can assign outfits to specific days in the coming week,
request AI-powered suggestions per day, and review upcoming looks at a glance.

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`

---

# Problem Being Solved

The current recommendation engine surfaces the best outfit for *today*. Users
have no way to plan ahead — to know what they will wear on Thursday's work
meeting or Saturday's casual dinner.

Without a planning layer, users must re-open recommendations every morning and
lose any prior thought they put into their week. The occasion system (Unit 17)
added per-session context but it evaporates when the page closes.

A weekly planner closes this loop: it makes recommendations actionable and
persistent, gives the occasion system a natural weekly cadence, and turns
StyleSync from a daily tool into a weekly companion.

---

# Scope

Build:

### OutfitPlan model (DB)

### GET /api/planner — fetch the week's plan

### POST /api/planner — assign an outfit to a day

### DELETE /api/planner/[id] — remove a planned slot

### PATCH /api/planner/[id] — swap outfit or change occasion on an existing slot

### Weekly calendar page at /editor/planner

### "Suggest" per-day button that calls the existing recommendation engine

### Week navigation (previous / next week)

### EditorNavbar link to Planner

Do **not** build:

* weather forecast per day (today's weather only, as always)
* shared planning with other users
* export to Google Calendar / iCal
* push notifications for planned days
* auto-marking planned outfits as worn (planning ≠ wearing)
* drag-and-drop reordering
* multi-outfit-per-day (one outfit slot per day)

---

# Data Model

## OutfitPlan

Create `prisma/models/outfit-plan.prisma`:

```prisma
model OutfitPlan {
  id          String   @id @default(cuid())
  userId      String
  outfitId    String
  plannedDate DateTime @db.Date
  occasion    String?
  note        String?
  createdAt   DateTime @default(now())

  outfit      Outfit   @relation(fields: [outfitId], references: [id], onDelete: Cascade)

  @@unique([userId, plannedDate])
}
```

`plannedDate` stores only the date (no time component). The `@@unique` constraint
means one outfit per day per user — a second POST to the same date replaces the
existing plan for that day (upsert).

Add the reverse relation on `Outfit` in `outfit.prisma`:

```prisma
plans  OutfitPlan[]
```

Run `prisma db push` after adding the model.

---

# Types

Add to `backend/src/types/index.ts`:

```ts
export interface OutfitPlan {
  id: string
  userId: string
  outfitId: string
  plannedDate: string        // ISO date string "YYYY-MM-DD"
  occasion: string | null
  note: string | null
  createdAt: string
  outfit: Outfit
}
```

---

# API

## GET /api/planner

Query the current user's plans for a given ISO week.

```txt
GET /api/planner?week=2026-06-08        ← any date in the target week
```

The `week` param can be any date string. The route resolves the Monday–Sunday
window containing that date. If `week` is omitted, default to the current week.

Response:

```json
{
  "success": true,
  "plans": [OutfitPlan, ...],
  "weekStart": "2026-06-08",
  "weekEnd":   "2026-06-14"
}
```

Returns all `OutfitPlan` records for the user within the week window, each
including the nested `outfit` (with its `garments` array for thumbnail rendering).
Days with no plan are simply absent from the array — the UI fills in empty slots.

Auth: Clerk. Returns 401 if unauthenticated.

---

## POST /api/planner

Assign an outfit to a day.

Request body:

```ts
{
  outfitId:    string          // must be owned by the user
  plannedDate: string          // "YYYY-MM-DD"
  occasion?:   string | null
  note?:       string | null
}
```

Behaviour: upsert by `(userId, plannedDate)`. If a plan already exists for that
date, replace it (update `outfitId`, `occasion`, `note`). If not, create it.

Validation:
- `outfitId` must belong to the calling user → 403 if not
- `plannedDate` must be a valid `YYYY-MM-DD` string → 400 if malformed
- `occasion` must be one of the six valid values when provided → 400 if invalid

Response: `{ "success": true, "plan": OutfitPlan }`

---

## DELETE /api/planner/[id]

Remove a plan entry. Verifies ownership before deletion.

Response: `{ "success": true }`

Returns 404 if not found, 403 if not owned by caller.

---

## PATCH /api/planner/[id]

Update `outfitId`, `occasion`, or `note` on an existing plan.

Request body (all fields optional):

```ts
{
  outfitId?:  string
  occasion?:  string | null
  note?:      string | null
}
```

Ownership checks apply to both the plan and the new `outfitId` (if provided).

Response: `{ "success": true, "plan": OutfitPlan }`

---

# Planner Service

Create `backend/src/services/planner/get-week-range.ts`:

```ts
export function getWeekRange(dateStr: string): { start: Date; end: Date }
```

Given any date string, returns the Monday 00:00:00 and Sunday 23:59:59 of the
containing ISO week. Used by both the GET route and the planner page's week
navigation.

---

# Planner Page

Route: `frontend/app/editor/planner/page.tsx`

## Layout

Full-width page, same container width and font stack as `/editor/wardrobe`.

```
┌────────────────────────────────────────────────────────────┐
│  < Prev    Week of Jun 8 – Jun 14, 2026    Next >          │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────────┤
│ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun              │
│ Jun 8│ Jun 9│Jun 10│Jun 11│Jun 12│Jun 13│Jun 14            │
│      │      │      │      │      │      │                  │
│[card]│[card]│[    ]│[card]│[    ]│[card]│[    ]            │
│      │      │  +   │      │  +   │      │  +               │
└──────┴──────┴──────┴──────┴──────┴──────┴──────────────────┘
```

Each day column has:
- Day name (Mon / Tue / …) — `text-xs uppercase tracking-widest text-muted-foreground`
- Date (Jun 8) — `text-sm font-medium`
- Today's column gets a subtle `border-primary/40` left border highlight
- **Planned slot** — if an outfit is assigned, render a `PlannerDayCard`
- **Empty slot** — if no outfit is assigned, render an `EmptyDaySlot`

## PlannerDayCard

A compact card (narrower than `OutfitCard`) showing:
- Stacked garment thumbnail collage (same logic as `OutfitCard`, max 3 images)
- Outfit name
- Occasion badge (if set) — same style as `OutfitCard` occasion badge
- Kebab menu (three-dot icon) with: "Change outfit", "Remove"

Clicking the card opens a read-only outfit preview (reuse `HistoryDetailDialog`
or a minimal inline popover — whichever is simpler).

## EmptyDaySlot

A dashed-border placeholder card with two actions:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│   + Pick outfit   │
│   ✦ Suggest       │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

- **Pick outfit** — opens an `OutfitPickerSheet` (see below)
- **Suggest** — triggers the suggestion flow (see below)

## OutfitPickerSheet

A bottom-anchored sheet (or Dialog on desktop) listing the user's saved outfits
in a scrollable grid, filtered by an optional occasion pill row at the top.

Selecting an outfit calls `POST /api/planner` and closes the sheet.

Reuse the occasion pill row styling from `TodaysRecommendations`.

## Suggestion Flow

When the user clicks "Suggest" on a day:

1. Show a loading state on the day slot ("Finding a look…")
2. Call `GET /api/recommendations?occasion={selectedOccasion}` (uses today's
   weather, same as always)
3. Take the top-ranked outfit from the response
4. Call `POST /api/planner` to assign it
5. Render the `PlannerDayCard` with the assigned outfit

The suggestion uses today's weather for every day (not per-day forecasts — out
of scope). The occasion for a suggested day defaults to the occasion currently
selected in the occasion picker (persisted in `localStorage` as
`stylesync_occasion`), or `null` if "All" is selected.

## Week Navigation

Two `<` and `>` buttons on either side of the week label.

State: `currentWeekStart` (a `Date`, initialized to this week's Monday).

Clicking `<` subtracts 7 days; clicking `>` adds 7 days.

The current week's navigation state is reflected in the URL as a `?week=` query
param so the page is deep-linkable and refresh-safe:

```txt
/editor/planner                     ← current week (default)
/editor/planner?week=2026-06-15    ← explicit week
```

Past weeks are fully readable but the "+" actions (Pick / Suggest) are hidden for
dates in the past — no planning in the past.

---

# EditorNavbar

Add "Planner" link to the nav alongside History, Insights, Preferences.

Location: `frontend/components/editor/editor-navbar.tsx`

---

# Constraints

Do **not**:

* auto-mark planned outfits as worn (planning is distinct from wearing)
* call the recommendation engine more than once per "Suggest" click
* show per-day weather forecasts (today's weather is used for all days)
* allow multiple outfits per day
* support drag-and-drop
* create a mobile-specific layout (responsive column wrapping is sufficient)

---

# Files to Create

```txt
backend/prisma/models/outfit-plan.prisma
backend/src/services/planner/get-week-range.ts
backend/src/types/index.ts                  (OutfitPlan interface)
frontend/app/api/planner/route.ts           (GET, POST)
frontend/app/api/planner/[id]/route.ts      (DELETE, PATCH)
frontend/app/editor/planner/page.tsx
frontend/components/planner/planner-day-card.tsx
frontend/components/planner/empty-day-slot.tsx
frontend/components/planner/outfit-picker-sheet.tsx
```

---

# Files to Modify

```txt
backend/prisma/models/outfit.prisma
  — add plans OutfitPlan[] reverse relation

backend/src/types/index.ts
  — add OutfitPlan interface

frontend/components/editor/editor-navbar.tsx
  — add Planner nav link
```

---

# Check When Done

* `OutfitPlan` table exists in the database with `(userId, plannedDate)` unique
* `GET /api/planner` returns plans for the requested week with nested outfit data
* `POST /api/planner` upserts correctly — second call for same date replaces plan
* `DELETE /api/planner/[id]` returns 403 for plans owned by another user
* `PATCH /api/planner/[id]` validates `occasion` against the six valid values
* Planner page renders a 7-column week grid
* Today's column has a visible highlight
* Empty day slots show Pick and Suggest actions
* Past day slots show no edit actions (read-only)
* Pick outfit opens the outfit picker; selecting an outfit assigns it and re-renders
* Suggest calls recommendations API and assigns the top result
* PlannerDayCard shows collage thumbnail, outfit name, occasion badge
* Kebab menu on PlannerDayCard allows changing or removing the outfit
* Week navigation updates the grid and the `?week=` query param
* Page is deep-linkable via `?week=YYYY-MM-DD`
* Planner link appears in EditorNavbar
* No TypeScript errors
* `npm run build` passes
