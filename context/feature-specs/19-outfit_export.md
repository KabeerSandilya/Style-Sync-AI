# Outfit Export & Share — Feature Spec

## Overview

Two complementary capabilities that let users take their curated outfits outside the app:

1. **Export as Image** — client-side only, no backend changes. Renders an editorial card and downloads it as a PNG.
2. **Shareable Link** — generates a public, unauthenticated URL for a single outfit. Requires a DB token field and a public page.

Both ship together. Export works offline; Share requires the server.

---

## 1. Export as Image

### User Flow

Outfit card in `/editor` (wardrobe page) has an existing action menu or a new share icon.  
User clicks **Export** → a styled card is rendered off-screen → downloads automatically as `outfit-name.png`.

### Card Layout

```
┌──────────────────────────────────────────────┐
│  StyleSync AI                     SS.AI  001 │  ← header bar
├──────────────────────────────────────────────┤
│                                              │
│   [img]    [img]    [img]                    │  ← garment grid (up to 6)
│   [img]    [img]  +2 more                   │
│                                              │
├──────────────────────────────────────────────┤
│  Casual Sunday Linen                         │  ← outfit name (serif)
│  CASUAL  ·  3 pieces  ·  June 2026          │  ← meta row (sans, small caps)
│                                              │
│  "Paired with raw-hem jeans…"                │  ← notes excerpt (optional)
└──────────────────────────────────────────────┘
```

- Background: `#faf6f0` (lp-bg cream)
- Garment images use `processedImageUrl` (bg-removed) if available, else `imageUrl`
- Max 6 garments shown; if more, last cell shows `+N more`
- Watermark: `StyleSync AI` wordmark bottom-right at 30% opacity
- Canvas size: 1200×675px (16:9, social-share safe)

### Technical Approach

Use [`html-to-image`](https://www.npmjs.com/package/html-to-image) (`toPng`).  
Render a hidden `<div>` with fixed dimensions inside a portal, capture it, trigger download.

**Why not `html2canvas`?** `html-to-image` handles CORS on `<img>` tags better, is actively maintained, and produces sharper output at higher DPI.

**CORS consideration:** Cloudinary images need `crossOrigin="anonymous"` on the `<img>` tags inside the render target. Cloudinary supports this by default.

### New Files

- `frontend/components/editor/outfit-export-card.tsx` — the off-screen card component (pure presentational, fixed pixel dimensions)
- `frontend/lib/export-outfit.ts` — `exportOutfitAsPng(outfit: Outfit): Promise<void>` utility

### Changed Files

- `frontend/components/editor/[outfit-card-component]` — add Export button/icon
- `package.json` → add `html-to-image`

---

## 2. Shareable Link

### User Flow

User clicks **Share** on an outfit card →

- If no token exists: API call generates one, returns the URL, copies it to clipboard, shows toast "Link copied"
- If token exists already: immediately copies existing URL to clipboard
- Optional: **Revoke** button to delete the token and break the link

### Public Page

Route: `/share/[token]` — no auth required, no layout chrome.

```
┌───────────────────────────────────────────┐
│  StyleSync AI                             │  ← minimal nav, no sign-in gate
├───────────────────────────────────────────┤
│                                           │
│  Casual Sunday Linen          CASUAL      │  ← name + occasion
│  Curated by a StyleSync wardrobe          │  ← attribution (no username exposed)
│                                           │
│  [img]  [img]  [img]                      │  ← full garment grid, all pieces
│  [img]  [img]                             │
│                                           │
│  Styling Notes                            │
│  "…"                                      │
│                                           │
│  3 pieces  ·  June 2026                  │
│                                           │
├───────────────────────────────────────────┤
│  Build your wardrobe → stylesync.ai       │  ← discovery CTA
└───────────────────────────────────────────┘
```

- No sign-in prompt on the page itself (frictionless viewing)
- No garment names or personal notes exposed beyond what the owner added to the outfit
- Token is a UUID v4; revocable at any time by the owner

### Data Model Change

```prisma
model Outfit {
  // ... existing fields ...
  shareToken  String?  @unique   // nullable UUID, set on first share
}
```

### New API Routes

| Method   | Path                          | Auth                  | Action                                             |
| -------- | ----------------------------- | --------------------- | -------------------------------------------------- |
| `POST`   | `/api/outfits/[id]/share`     | Required (owner only) | Generate token if missing, return `{ url, token }` |
| `DELETE` | `/api/outfits/[id]/share`     | Required (owner only) | Nullify token, return `{ success }`                |
| `GET`    | `/api/public/outfits/[token]` | None                  | Return outfit by token (selected fields only)      |

The public GET must **not** return `userId`. Return: `name`, `notes`, `occasion`, `createdAt`, `garments[].garment.{imageUrl, processedImageUrl, category}`.

### New Files

- `frontend/app/api/outfits/[id]/share/route.ts` — POST + DELETE handlers
- `frontend/app/api/public/outfits/[token]/route.ts` — unauthenticated GET
- `frontend/app/share/[token]/page.tsx` — public share page (Server Component, no Clerk guard)
- `frontend/components/share/shared-outfit-view.tsx` — presentational component for the share page

### Changed Files

- `backend/prisma/schema.prisma` → add `shareToken` field + migration
- `frontend/components/editor/[outfit-card-component]` → add Share button/icon + revoke UI

---

## Scope Boundaries

**In scope:**

- Export: PNG download, fixed canvas size, watermark
- Share: UUID token, public page, copy-to-clipboard, revoke

**Out of scope (future):**

- Social media deep integration (Open Graph meta on share page is fine, but no direct Instagram/X posting)
- Outfit collections or multi-outfit share pages
- QR codes
- Password-protected share links

---

## Open Graph (nice-to-have, same PR)

Add `<meta>` tags to the share page so links unfurl on WhatsApp/Slack/X:

- `og:title` → outfit name
- `og:description` → occasion + piece count
- `og:image` → first garment's `processedImageUrl` (or a generated card via Cloudinary transforms)
- `og:url` → canonical share URL

This requires no extra infrastructure if using an existing garment image as the OG image.
