# Outfit Builder & Saved Outfits

We are implementing the **Outfit Builder system** for **StyleSync AI**.

This feature introduces the concept of:

**saved outfits built from owned garments**

Users can already:

* upload garments
* browse wardrobe
* organize clothing
* edit garment metadata

Now users must be able to:

* manually create outfits
* combine garments
* save outfit combinations
* edit saved outfits
* favorite outfits

This layer becomes the foundation for:

* AI outfit recommendations
* weather-aware styling
* outfit reuse
* recommendation feedback
* future outfit analytics

Follow:

* `ui-context.md`
* `globals.css`
* `code-standards.md`
* `architecture.md`

The experience should feel:

**premium, editorial, lightweight, and fashion-first.**

Avoid productivity-tool or dashboard-builder UX.

---

# Scope

Build:

### Outfit Creation

### Outfit Selection

### Saved Outfits

### Outfit Editing

### Favorite Outfits

### Outfit Deletion

### Outfit Retrieval

Do **not** build:

* AI recommendations
* drag-and-drop
* outfit scoring
* weather logic
* outfit sharing
* outfit collaboration

Keep MVP intentionally simple.

---

# User Flow

Users manually create outfits.

Flow:

```txt id="fqk6ot"
Open Outfit Builder
        ↓
Choose garments
        ↓
Preview outfit
        ↓
Save outfit
        ↓
View saved outfit
        ↓
Edit or favorite later
```

No navigation-heavy workflow.

Everything should feel immediate.

---

# Backend APIs

Implement backend-only support for outfits.

---

## `GET /api/outfits`

Purpose:

Fetch authenticated user's outfits.

Requirements:

* Clerk authentication required
* return current user's outfits only
* newest first
* include linked garments
* unauthorized → `401`

Order:

```txt id="v0klr1"
createdAt DESC
```

Response:

```ts id="qxtx2x"
{
  success: true,
  data: outfits
}
```

---

## `POST /api/outfits`

Purpose:

Create new outfit.

Input:

```ts id="zyvdgv"
{
  name?: string
  garmentIds: string[]
  notes?: string
}
```

Requirements:

Use authenticated Clerk user ID.

Validate:

* garment array exists
* minimum 1 garment
* all garments belong to current user

Default name:

```txt id="9r4e2v"
Untitled Outfit
```

Create:

* `Outfit`
* `OutfitGarment` join records

Unauthorized:

```txt id="11y7yo"
401
```

Invalid ownership:

```txt id="wyvsmo"
403
```

---

## `PATCH /api/outfits/[outfitId]`

Purpose:

Edit saved outfit.

Allowed updates:

* name
* notes
* garmentIds
* isFavorite

Requirements:

* owner-only mutation
* validate garment ownership
* prevent cross-user garment linking
* unauthorized → `401`
* non-owner → `403`
* not found → `404`

---

## `DELETE /api/outfits/[outfitId]`

Purpose:

Delete outfit.

Requirements:

* owner-only deletion
* remove join relationships
* unauthorized → `401`
* forbidden → `403`
* not found → `404`

No page reloads required.

---

# Outfit Builder UI

Create:

`components/editor/outfit-builder-dialog.tsx`

Purpose:

Manual outfit creation.

The dialog should feel:

**creative and tactile**

—not—

like filling out a database form.

---

## Layout

### Left Section

Wardrobe selection panel.

Displays:

authenticated user garments.

Requirements:

* scrollable garment grid
* image-first design
* compact cards
* selection state

Card hierarchy:

1. image
2. garment name
3. category

Selection behavior:

* click to add/remove
* clear visual selection state
* soft editorial interactions

Avoid checkboxes.

---

### Right Section

Outfit Preview.

Purpose:

Visualize selected outfit.

Requirements:

* stacked garment preview
* clean composition
* breathable spacing
* premium card surface

No drag-and-drop yet.

Just visual grouping.

---

## Outfit Metadata

Allow:

### Outfit Name

Use:

`Input`

Requirements:

* editable
* optional
* defaults to:

```txt id="wj3b4f"
Untitled Outfit
```

---

### Notes

Use:

`Textarea`

Optional.

Examples:

> Airport fit

> Winter evening casual

Character limit required.

---

### Favorite Toggle

Allow:

```txt id="t4kpl4"
isFavorite
```

Purpose:

Future recommendation prioritization.

Visual:

* subtle heart/bookmark
* sage accent when active

Not overly prominent.

---

# Saved Outfits View

Create:

`components/editor/outfit-grid.tsx`

Purpose:

Display saved outfits.

Requirements:

* editorial grid
* responsive layout
* premium spacing

Desktop:

```txt id="24i5jp"
2–4 columns
```

Mobile:

```txt id="nn7kpo"
1–2 columns
```

---

## Outfit Card

Create:

`components/editor/outfit-card.tsx`

Display:

* outfit preview collage
* outfit name
* garment count
* favorite state

Hover:

* soft elevation
* subtle motion

Click:

Open edit dialog.

---

# Empty State

When no outfits exist:

Show elegant onboarding state.

Tone:

Warm and aspirational.

Example feel:

> Create your first outfit from pieces you already own.

CTA:

```txt id="3npd1u"
Create Outfit
```

Must open builder dialog.

Avoid:

> No outfits found

---

# Loading State

Before outfits load:

Use:

**editorial skeleton cards**

Requirements:

* preserve layout
* no jumpiness
* soft pulse

Avoid harsh spinners.

---

# State Management

Requirements:

After:

* create
* update
* delete

Automatically:

* refresh outfit grid
* preserve editor state

No:

```ts id="31lc96"
window.location.reload()
```

Allowed:

* query invalidation
* server refresh pattern

---

# Validation Rules

Creating outfit:

Must:

* contain at least one garment
* reject invalid garment ownership
* reject empty arrays

Error tone:

Bad:

```txt id="8h5w2r"
Prisma validation failed
```

Good:

```txt id="8sod5w"
Please select at least one garment.
```

---

# Constraints

Do **not**:

* add drag-and-drop
* build recommendation logic
* add weather scoring
* add outfit sharing
* build outfit marketplace
* add AI styling

This is manual outfit creation only.

---

# Check When Done

* authenticated outfits load
* outfit creation works
* garment selection works
* outfit saving works
* outfit editing works
* outfit deletion works
* favorite toggle works
* outfit grid renders correctly
* empty state works
* loading state works
* no TypeScript errors
* no lint errors
* `npm run build` passes
