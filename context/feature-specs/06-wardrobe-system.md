# Digital Wardrobe UI & Data Integration

We are implementing the **Digital Wardrobe experience** for **StyleSync AI**.

This feature connects:

* garment upload
* wardrobe retrieval APIs
* sidebar navigation
* wardrobe visualization

This is the first fully interactive authenticated user experience.

Follow:

* `ui-context.md`
* `globals.css`
* `code-standards.md`
* `architecture.md`

The wardrobe experience should feel:

**premium, editorial, tactile, and fashion-first.**

Avoid generic dashboard grids.

---

# Scope

Build:

### Wardrobe Grid

### Sidebar Integration

### Garment Fetching

### Upload Dialog Integration

### Empty States

### Loading States

### Basic Filtering

Do **not** build:

* AI recommendations
* outfit builder
* drag-and-drop outfits
* garment editing modal
* virtual try-on
* avatar system

---

# Editor Page

Update:

`app/editor/page.tsx`

Responsibilities:

* fetch authenticated wardrobe
* render wardrobe grid
* open upload garment dialog
* connect sidebar actions
* handle loading + empty states

Keep page thin.

Business logic should live in hooks or dedicated components.

---

# Sidebar Integration

Update:

`components/editor/project-sidebar.tsx`

Rename mental model:

This is now the:

**Wardrobe Sidebar**

Requirements:

### My Wardrobe Tab

Display:

recent garments

Structure:

* image thumbnail
* garment name
* category label

Order:

Newest first.

---

### Saved Outfits Tab

Placeholder state only.

Do not implement outfit fetching yet.

---

### Add Clothing Button

Open:

`UploadGarmentDialog`

No navigation.

No full page reload.

---

# Wardrobe API Integration

Use:

```txt
GET /api/garments
```

Requirements:

* authenticated requests only
* fetch on editor load
* newest first
* refresh after upload

No mock data.

No hardcoded garments.

---

# Wardrobe Grid

Create:

`components/editor/wardrobe-grid.tsx`

Purpose:

Primary garment display.

Requirements:

* responsive layout
* editorial spacing
* premium card feel

Grid behavior:

### Desktop

3–5 columns.

### Tablet

2–3 columns.

### Mobile

1–2 columns.

---

## Garment Card

Create:

`components/editor/garment-card.tsx`

Hierarchy:

1. garment image
2. garment name
3. category
4. tags

Card styling:

* rounded-2xl
* cream surface
* soft border
* subtle shadow

Hover:

* gentle elevation
* subtle scale
* premium feel

No harsh hover animations.

---

# Empty State

When no garments exist:

Show elegant empty state.

Tone:

Warm and aspirational.

Example feel:

> Your digital wardrobe starts here.

CTA:

**Upload First Garment**

Must launch upload dialog.

Avoid:

> No data available

---

# Loading State

Before wardrobe loads:

Show:

**editorial skeleton cards**

Requirements:

* preserve layout
* soft pulse
* avoid spinners

No layout shift.

---

# Filtering

Create lightweight filtering.

Support:

* category
* favorites

Future-ready for:

* colors
* season
* style

Filtering should feel lightweight.

Avoid dense admin filters.

---

# State Management

Requirements:

After successful upload:

* refresh wardrobe grid
* refresh sidebar
* no full page reload

Allowed:

* server refresh
* query invalidation

Not allowed:

```ts
window.location.reload()
```

---

# Constraints

Do **not**:

* add AI recommendations
* build outfit builder
* add drag-and-drop
* create garment editing
* add pagination yet

Wardrobe browsing only.

---

# Check When Done

* authenticated wardrobe loads
* sidebar reflects uploaded garments
* upload dialog works
* wardrobe refreshes automatically
* garment cards render correctly
* loading skeletons work
* empty state works
* responsive layout works
* no TypeScript errors
* no lint errors
* `npm run build` passes
