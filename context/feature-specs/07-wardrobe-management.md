# Garment Management & Wardrobe Editing

We are implementing **Garment Management** for **StyleSync AI**.

Users can already:

* upload garments
* view wardrobe
* browse clothing

Now they must be able to **manage and organize their wardrobe**.

This feature enables users to:

* rename garments
* categorize garments
* edit notes
* manage tags
* favorite garments
* delete garments

This layer is critical because future AI recommendations depend on high-quality garment metadata.

Follow:

* `ui-context.md`
* `globals.css`
* `code-standards.md`
* `architecture.md`

The experience should feel:

**premium, calm, editorial, and lightweight.**

Avoid heavy CRUD dashboard UX.

---

# Scope

Build:

### Garment Details Dialog

### Garment Editing

### Categorization

### Tag Editing

### Favorite Toggle

### Delete Garment

### Wardrobe Refresh

Do **not** build:

* AI auto-classification
* bulk editing
* outfit builder
* drag-and-drop organization
* advanced filtering
* garment history

---

# Interaction Pattern

Users should edit garments directly from the wardrobe.

Behavior:

```txt id="z1"
Click garment card
        ↓
Open Garment Details Dialog
        ↓
Edit metadata
        ↓
Save changes
        ↓
Refresh wardrobe
```

No navigation.

No dedicated edit page.

Editing should feel immediate.

---

# Garment Details Dialog

Create:

`components/editor/garment-details-dialog.tsx`

Purpose:

View and edit garment metadata.

Requirements:

* modal dialog
* premium editorial styling
* centered overlay
* warm surfaces
* rounded corners
* elegant spacing

Must match:

`ui-context.md`

---

## Dialog Layout

### Left Side

Garment image preview.

Requirements:

* large image
* rounded corners
* contained layout
* subtle border

---

### Right Side

Editable metadata.

Sections:

1. Garment Name
2. Category
3. Tags
4. Notes
5. Favorite Toggle
6. Delete Action

---

# Editing Features

## Rename Garment

Use:

`Input`

Requirements:

* editable
* soft focus states
* default value from garment

Validation:

* trim whitespace
* max character length
* empty values fallback to:

```txt id="z2"
Untitled Garment
```

---

## Category Selection

Use:

`Select`

Predefined categories:

```txt id="z3"
Topwear
Bottomwear
Outerwear
Footwear
Accessories
Formalwear
Sportswear
Ethnicwear
Uncategorized
```

No free-text category input.

Future AI classification depends on consistency.

---

## Tag Editing

Allow:

* add tag
* remove tag

Suggested tags:

```txt id="z4"
casual
formal
winter
summer
oversized
streetwear
minimal
gym
party
cotton
denim
```

Requirements:

* chip-based interaction
* lightweight editing
* soft editorial feel

No complicated tagging UI.

---

## Notes

Use:

`Textarea`

Purpose:

User styling notes.

Examples:

> Slightly oversized fit

> Best for winter evenings

Requirements:

* optional
* character limit
* elegant focus states

---

## Favorite Toggle

Allow users to favorite garments.

Behavior:

Toggle:

```txt id="z5"
isFavorite
```

Purpose:

Future recommendation prioritization.

Visual:

* subtle heart/bookmark icon
* sage accent when active

Not overly prominent.

---

## Delete Garment

Allow deletion.

Requirements:

* confirmation dialog required
* editorial confirmation pattern
* soft destructive styling

Tone:

Bad:

> Are you sure?

Good:

> Remove this garment from your wardrobe?

Behavior:

```txt id="z6"
delete garment
        ↓
refresh wardrobe
        ↓
close dialog
```

No page reload.

---

# Backend Integration

Use:

```txt id="z7"
PATCH /api/garments/[garmentId]
```

for updates.

Allowed:

```ts id="z8"
{
  name
  category
  notes
  tags
  isFavorite
}
```

Use:

```txt id="z9"
DELETE /api/garments/[garmentId]
```

for deletion.

No client-side mocks.

---

# Loading State

During save:

* disable inputs
* disable close
* disable delete
* show elegant loading state

No harsh spinners.

---

# Success State

After save:

* close dialog
* refresh wardrobe
* refresh sidebar
* subtle toast

No reloads.

---

# Error State

Preserve unsaved input.

Allow retry.

Tone:

Bad:

> Prisma Error

Good:

> Unable to update garment.

---

# Constraints

Do **not**:

* create dedicated edit pages
* reload the page
* allow bulk editing
* add AI tagging
* allow arbitrary categories

Keep editing lightweight.

---

# Check When Done

* clicking garment opens dialog
* garment metadata editable
* category updates work
* tags editable
* favorite toggle works
* deletion works
* wardrobe refreshes automatically
* sidebar refreshes
* loading states work
* no TypeScript errors
* no lint errors
* `npm run build` passes
