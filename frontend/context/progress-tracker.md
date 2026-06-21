# Progress Tracker

## Current Phase
**Outfit Export & Share** — complete and deployed to DB.

---

## Completed Features

### Core Wardrobe
- Garment upload, background removal, AI classification
- Wardrobe grid with category filters, favorites
- Garment details & edit dialog

### Outfit System
- Outfit builder dialog (create / edit / delete)
- Outfit grid with collage preview
- AI outfit generation (`/api/outfits/generate`)
- Occasion-aware recommendations
- Weekly outfit recommendations
- Wear history tracking

### Outfit Export & Share ✅ (June 2026)
- **Export as PNG**: off-screen `OutfitExportCard` rendered via portal, captured with `html-to-image`, downloaded as `outfit-name.png`.
- **Shareable link**: UUID `shareToken` on `Outfit` model; POST `/api/outfits/[id]/share` generates token, DELETE revokes it.
- **Public page**: `/share/[token]` — no auth, no layout chrome, full garment grid + notes. OG meta tags included.
- **Public API**: GET `/api/public/outfits/[token]` — returns safe fields only (no `userId`).
- **UI**: Hover-revealed Export / Share / Revoke icon buttons on each outfit card; "Shared" badge when token exists.
- **DB**: `shareToken String? @unique` pushed via `prisma db push`.

### Other
- Wardrobe insights page
- Planner (weekly outfit scheduling)
- Preferences page
- Onboarding flow

---

## Open Questions / Next Steps

- Social media deep integration (Instagram/X posting) — out of scope for now
- Outfit collections / multi-outfit share pages — future
- QR codes for share links — future
- Password-protected share links — future
- `NEXT_PUBLIC_APP_URL` env var should be set in `.env.local` for correct share URL generation in production

---

## Key Files

| Area | File |
|------|------|
| Export card component | `components/editor/outfit-export-card.tsx` |
| Export utility | `lib/export-outfit.ts` |
| Share API (POST/DELETE) | `app/api/outfits/[id]/share/route.ts` |
| Public outfit API | `app/api/public/outfits/[token]/route.ts` |
| Public share page | `app/share/[token]/page.tsx` |
| Share view component | `components/share/shared-outfit-view.tsx` |
| Outfit card (with Export/Share buttons) | `components/editor/outfit-card.tsx` |
| Outfit grid | `components/editor/outfit-grid.tsx` |
| Prisma outfit model | `../backend/prisma/models/outfit.prisma` |
| Outfit type | `../backend/src/types/index.ts` |
