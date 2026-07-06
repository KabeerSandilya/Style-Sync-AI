# Flat Lay Builder (F4)

We are implementing **Flat Lay Builder** for **StyleSync AI**.

This is the fourth Sprint 3 ("Expression") feature from the Phase 3 roadmap
(`context/feature-specs/Phase 3 specs.md`, F4). Look Book (F3, spec 28) is
done; this spec ships in parallel with it rather than after it — F4 has no
dependency on F3 and none on the durable job queue (spec 24), since all
compositing runs client-side. F5 (Community Feed) remains unspecced and is
not required for this unit.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

StyleSync already renders an outfit as a fixed diagonal-stack collage
(`<OutfitCard />`'s `renderCollage()`) and as a fixed 1200×675 export card
(`<OutfitExportCard />`, spec 19). Neither is user-arrangeable — a user who
wants a magazine-style flat lay with their own layout, sizing, and a caption
has no way to produce one. The garment images already exist
(`processedImageUrl` from spec 15, background-removed and CORS-accessible
via Cloudinary) but nothing lets the user compose them freely. Flat Lay
Builder is a client-side canvas that turns those existing images into a
draggable, exportable composition — no new AI step, no new upload pipeline.

---

# Scope

Build:

### `/editor/flat-lay/[outfitId]` route — full-page canvas editor
### Client-side drag/resize/layer/flip interaction on garment images (pointer events, no library)
### "Add from wardrobe" panel to pull in any other garment
### Optional text caption layer (Cormorant Garamond)
### PNG export (1:1 or 4:5) via `<canvas>` `toBlob`, with optional watermark
### "Open in Flat Lay Builder" hover action on `<OutfitCard />`

Do **not** build:

* Any server-side compositing or a persisted "flat lay" database record — the canvas state is ephemeral, matches the original brief's "no new DB models" call
* A dedicated `GET /api/outfits/[id]` route — the page resolves the outfit client-side from the already-cached `useOutfits()` list, the same pattern already used in `frontend/app/editor/wardrobe/page.tsx:200` (`outfits.find((item) => item.id === selectedOutfitId)`)
* Three.js, react-dnd, or any drag-and-drop/canvas library dependency — plain pointer events + native `<canvas>`, consistent with the existing zero-added-dependency precedent set by `html-to-image` being the *only* rendering dependency added in spec 19
* Saving a composition as a Look Book entry automatically — the brief mentions this as a possible F3 integration, but Look Book (spec 28) only accepts photo uploads via its multipart `POST /api/lookbook`; wiring "export flat lay → send into Look Book" is a follow-up, not part of this unit
* Web Share API integration — plain file download only, matching the existing `exportOutfitAsPng` (spec 19) download-only behavior

---

# New Dependencies

None. Uses the native `<canvas>` element and pointer events already available
in the browser; no npm package is added.

---

# Database Changes

None. Compositions are not persisted — the canvas is initialized from the
outfit's existing garments on mount and discarded on navigation, per the
original brief.

---

# Route & Entry Point

## `/editor/flat-lay/[outfitId]`

Create `frontend/app/editor/flat-lay/[outfitId]/page.tsx`. A full page (not a
modal) — consistent with how every other Phase 3 feature (`/style-dna`,
`/lookbook`, `/editor/planner`) is a dedicated route rather than an overlay.

Resolution of the outfit:

```ts
const { data: outfits = [], isLoading } = useOutfits();
const { data: garments = [] } = useGarments();
const outfit = outfits.find((o) => o.id === outfitId);
```

* While `isLoading`, render the page's own skeleton (reuse the dashed-card
  skeleton treatment already used on `/lookbook` and `/style-dna`).
* If `!isLoading && !outfit`, render a "Combination not found" empty state
  with a link back to `/editor/wardrobe?view=outfits` — do not `notFound()`
  server-side, since resolution is entirely client-side.

## Hover action on `<OutfitCard />`

Add a fourth hover action (alongside Export/Share/Revoke) in
`frontend/components/editor/outfit-card.tsx`: a `LayoutGrid` (or similar,
lucide-react) icon button, `onFlatLay?: (outfit: Outfit) => void` prop,
`title="Open in Flat Lay Builder"`. Wired in
`frontend/app/editor/wardrobe/page.tsx` to `router.push('/editor/flat-lay/' + outfit.id)`
— no new dialog, this always navigates.

---

# Canvas Model

Define the composition state in the page component (no separate store
library — `useState`/`useReducer` is enough for a single-page ephemeral
session):

```ts
interface FlatLayItem {
  id: string;           // garmentId, unique per canvas item (a garment can be added once)
  garmentId: string;
  imageUrl: string;      // getDisplayImageUrl(garment) at add-time
  x: number;             // canvas-space, top-left, px
  y: number;
  width: number;         // aspect-ratio-locked; height derived from natural image ratio
  zIndex: number;
  flippedX: boolean;
}

interface CaptionLayer {
  text: string;
  x: number;
  y: number;
}
```

Canvas dimensions are fixed at 1200×1200 internally (matches the 1:1 export
option below); the 4:5 export crops/pads from the same internal canvas
rather than maintaining two separately-sized states.

## Initialization

On mount, seed one `FlatLayItem` per garment in `outfit.garments`, laid out
in a simple non-overlapping grid (not a stacked pile — the point of this
tool is manual arrangement) with default `width` scaled to keep every item
visible without overlap for up to 6 garments; `zIndex` assigned in insertion
order.

## Interactions

All implemented with native pointer events (`onPointerDown` / `onPointerMove`
/ `onPointerUp`, `setPointerCapture`) directly on absolutely-positioned
`<img>` elements layered inside a relatively-positioned canvas container —
**not** the `<canvas>` 2D API for the interactive editing surface itself
(that would require reimplementing hit-testing/dragging by hand against a
raster; DOM elements get this for free from the browser). The `<canvas>` 2D
API is used only at **export time** to rasterize the final composition (see
Export below).

* **Drag** — pointer down on an item selects it (raises to `Math.max(...allZIndex) + 1`) and tracks pointer delta to update `x`/`y`.
* **Resize** — a single corner handle on the selected item; drag updates `width`, height recalculated from the image's natural aspect ratio (read via `Image.naturalWidth/naturalHeight` cached at add-time, not re-measured every frame).
* **Layer order** — "Bring forward" / "Send back" buttons in a small floating toolbar above the selected item; swaps `zIndex` with the next/previous item by current stacking order.
* **Flip** — toggle button in the same floating toolbar; toggles `flippedX`, rendered as `scaleX(-1)` via inline `transform`.
* **Background toggle** — a top-bar control switching the container's background between white (`#ffffff`) and cream (the existing `--card`/sand token) — a plain state flag, not persisted.

## "Add from wardrobe" panel

A collapsible side panel (reuse the drawer/sheet treatment from
`OutfitPickerSheet`, spec 18, for visual consistency rather than a new
pattern) listing `useGarments()` results not already on the canvas. Clicking
a garment adds a new `FlatLayItem` at a default unoccupied position
(simple next-free-grid-cell heuristic, same as initialization).

## Caption layer

One optional `CaptionLayer` (not a list — v1 supports a single caption, per
the brief's "add a caption" singular framing). A text input in the top bar;
when non-empty, renders as a draggable (position-only, no resize/rotate)
text block in Cormorant Garamond italic, layered above all garment images
(`zIndex: Infinity` equivalent — render last in DOM order, don't fold it
into the numeric `zIndex` space garments use).

---

# Export

"Export" button in the top bar, with a 1:1 / 4:5 toggle beside it.

1. Create an off-screen `<canvas>` sized 1200×1200 (1:1) or 1080×1350 (4:5).
2. Fill background (white or cream, per the toggle state).
3. For 4:5, translate/scale the 1200×1200 composition to fit centered within
   the taller canvas (letterboxed top/bottom) rather than cropping content —
   arranged items must never be cut off by an aspect change.
4. Draw each `FlatLayItem` via `ctx.drawImage(img, x, y, width, height)` in
   ascending `zIndex` order, applying `ctx.scale(-1, 1)` around the item's
   center when `flippedX` is true (save/restore context around each draw).
5. Draw the caption text (if present) via `ctx.fillText`, using a loaded
   Cormorant Garamond `FontFace` (the app already loads this font for the
   page chrome; reuse the existing `next/font` variable rather than loading
   a second copy).
6. Draw the watermark: `"StyleSync AI"` bottom-right, 20% opacity, unless the
   user has toggled it off for this export (a session-only toggle in the top
   bar — not a persisted settings-page opt-out; the brief's "opt-out in
   settings" is deferred since there is no per-user settings model to add it
   to today).
7. `canvas.toBlob('image/png')` → `URL.createObjectURL` → a temporary
   `<a download>` click, mirroring `exportOutfitAsPng`'s (spec 19)
   click-to-download pattern exactly, so both exports feel identical to the
   user.

Images must be loaded with `crossOrigin = "anonymous"` before being drawn
(Cloudinary already serves permissive CORS headers, confirmed in the F4
brief) — without this, `canvas.toBlob` throws a tainted-canvas
`SecurityError`. Pre-load every item's `Image` object (with `crossOrigin`
set) once on add, not on every export click.

---

# Frontend

## Files

`frontend/app/editor/flat-lay/[outfitId]/page.tsx` — the full editor page:
top bar (background toggle, caption input, export controls, back link),
canvas container (drag/resize/flip/layer interactions), collapsible
"Add from wardrobe" side panel.

`frontend/components/flat-lay/flat-lay-item.tsx` — a single draggable/
resizable/flippable garment image, encapsulating its own pointer-event
handlers and the floating per-item toolbar (layer/flip buttons) shown only
when selected.

`frontend/lib/export-flat-lay.ts` — `exportFlatLay(items, caption, options)`
containing the canvas-rasterization logic from the Export section above,
mirroring `frontend/lib/export-outfit.ts`'s (spec 19) role as a small,
pure, side-effecting export helper.

No new query hook or query key is needed — the page consumes the existing
`useOutfits()`/`useGarments()` hooks read-only; there is no mutation to
persist.

## Navigation

No new `EditorNavbar` link — Flat Lay Builder is reached only from an
outfit's hover action, the same way `/editor/flat-lay/[outfitId]` behaves
as a deep, outfit-scoped tool rather than a top-level section (consistent
with how `/share/[token]` also has no nav entry).

---

# Technical Notes — Deviations from the Phase 3 Brief

* The brief describes the interaction layer as "drag-and-drop via pointer
  events" without specifying whether the raster canvas or DOM elements host
  the live editing surface. This spec makes DOM elements the editing
  surface and reserves `<canvas>` for export only — dragging/resizing raw
  pixels on a `<canvas>` would require hand-built hit-testing that the DOM
  gives for free, and every other interactive surface in this codebase
  (dialogs, grids, cards) is already DOM-based.
* The brief's "watermark opt-out in settings" is implemented as a
  per-export session toggle instead, since no user-settings model exists
  in the codebase to persist such a preference today.
* The brief's optional "save composition as a Look Book photo" integration
  is explicitly deferred (see Scope) — Look Book's upload endpoint takes a
  direct file upload, not a canvas blob, and wiring the two is a distinct
  follow-up unit, not implicit in this spec.

---

# Files to Create

```txt
frontend/app/editor/flat-lay/[outfitId]/page.tsx
frontend/components/flat-lay/flat-lay-item.tsx
frontend/lib/export-flat-lay.ts
```

# Files to Modify

```txt
frontend/components/editor/outfit-card.tsx
  — add onFlatLay prop, hover action button (LayoutGrid icon)
frontend/components/editor/outfit-grid.tsx
  — thread onFlatLay through to OutfitCard
frontend/app/editor/wardrobe/page.tsx
  — wire onFlatLay to router.push('/editor/flat-lay/' + outfit.id)
```

---

# Constraints

Do **not**:

* Add any new npm dependency (canvas/drag libraries, Three.js, Web Share API polyfills)
* Persist canvas state to the database or introduce a new Prisma model
* Build a `GET /api/outfits/[id]` route — resolve the outfit from the already-cached outfit list, client-side
* Crop composed content when switching between 1:1 and 4:5 export — letterbox, never cut off arranged items
* Load garment images into the export `<canvas>` without `crossOrigin = "anonymous"` — this taints the canvas and breaks `toBlob`
* Wire this feature into Look Book's upload flow — that integration is out of scope for this unit

---

# Check When Done

* `/editor/flat-lay/[outfitId]` loads, pre-populated with the outfit's garment images in a non-overlapping default layout
* Every item can be dragged, resized (aspect-ratio-locked), reordered (bring forward/send back), and flipped horizontally
* "Add from wardrobe" panel adds any other garment to the canvas at an unoccupied position
* Caption text renders in Cormorant Garamond and can be repositioned
* Background toggles between white and cream
* Export produces a downloaded PNG at 1200×1200 (1:1) or 1080×1350 (4:5, letterboxed) with correct z-order and flips baked in
* Watermark renders at 20% opacity bottom-right unless toggled off for that export
* Navigating to a `[outfitId]` that doesn't resolve from `useOutfits()` shows a "Combination not found" state, not a crash
* "Open in Flat Lay Builder" hover action appears on `<OutfitCard />` and navigates correctly
* `npx tsc --noEmit` — zero errors (frontend)
* `npm run build` passes
* No lint errors
