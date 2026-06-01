# Wear History & Outfit Timeline

We are implementing the **Wear History System** for **StyleSync AI**.

Users can already:

* upload garments
* create outfits
* receive recommendations
* mark outfits as worn

The system currently records wear events, but users cannot see or interact with their wear history.

This feature introduces:

* wear history timeline
* worn outfit tracking
* outfit usage history
* wardrobe usage insights foundation

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`
* `globals.css`

The experience should feel:

**personal, reflective, and editorial.**

Not like analytics software.

---

# Scope

Build:

### Wear History API

### Wear History UI

### Timeline View

### Worn Outfit Details

### Wear Statistics Foundation

Do **not** build:

* calendar planner
* analytics dashboard
* streak tracking
* social sharing
* AI insights
* outfit scheduling

This feature focuses only on viewing past worn outfits.

---

# User Goals

Users should be able to answer:

```txt
What did I wear recently?

How often do I wear certain outfits?

When did I last wear this outfit?
```

---

# Navigation

Add a new section:

### History

Example navigation:

```txt
Wardrobe
Outfits
History
```

The history section should feel like a wardrobe journal.

---

# Backend API

Create:

`GET /api/wear-history`

Purpose:

Retrieve authenticated user's wear history.

---

## Requirements

* Clerk authentication required
* return current user's wear history only
* newest first
* include outfit information
* include outfit preview garments

Unauthorized:

```txt
401
```

---

## Response

Success:

```ts
{
  success: true,
  data: [
    {
      id: string,
      wornAt: Date,
      outfit: {
        id: string,
        name: string,
        garments: [...]
      }
    }
  ]
}
```

Failure:

```ts
{
  success: false,
  error: string
}
```

---

# History Page

Create:

`app/history/page.tsx`

Purpose:

Display outfit wear history.

Requirements:

* authenticated route
* responsive layout
* editorial spacing
* chronological grouping

---

# Timeline Layout

Display history grouped by date.

Example:

```txt
Today
 ├─ Summer Linen Fit
 └─ Casual Office Outfit

Yesterday
 └─ Airport Outfit

Last Week
 ├─ Weekend Streetwear
 └─ Dinner Outfit
```

Newest first.

---

# Timeline Item

Create:

`components/history/history-item.tsx`

Display:

### Outfit Preview

Small collage or garment thumbnails.

---

### Outfit Name

Primary text.

---

### Worn Date

Secondary text.

Examples:

```txt
Today

Yesterday

2 days ago

May 27, 2026
```

---

### Garment Count

Example:

```txt
4 pieces
```

Subtle metadata.

---

# Outfit Detail Dialog

Clicking a history item should open:

`components/history/history-detail-dialog.tsx`

Purpose:

View previously worn outfit.

---

## Display

Show:

* outfit preview
* outfit name
* worn date
* garments included
* notes (if available)

Read-only.

No editing required.

---

# Empty State

When no outfits have been worn:

Show:

```txt
Your wear history will appear here.
```

Supporting text:

```txt
Mark outfits as worn to build your personal style timeline.
```

CTA:

```txt
Explore Recommendations
```

Avoid:

```txt
No records found
```

---

# Loading State

Use:

Editorial skeleton timeline.

Requirements:

* preserve layout
* soft pulse
* no harsh spinners

---

# Wear Statistics Foundation

Create service:

`services/wear-history/`

Responsibilities:

```txt
Get recent wears
Count wears
Find last worn date
```

These utilities will support future features.

---

# Last Worn Information

Update outfit cards.

Display:

```txt
Last worn 3 days ago
```

when available.

If never worn:

```txt
Never worn
```

This becomes useful for recommendation scoring later.

---

# Recommendation Integration

Wear history should support:

```txt
Recent Wear Penalty
```

Example:

```txt
Worn Today
 → Strong Penalty

Worn Yesterday
 → Medium Penalty

Worn Last Week
 → Small Penalty
```

Do not implement advanced personalization yet.

---

# State Management

History should update automatically after:

```txt
Wear This
```

Requirements:

```txt
Click Wear This
        ↓
Create Wear Record
        ↓
Refresh History
```

No page reloads.

No manual refresh.

---

# Constraints

Do **not**:

* build analytics dashboards
* build charts
* build calendar views
* build streak systems
* build recommendation learning

Focus on history visibility only.

---

# Future Compatibility

This system should later support:

```txt
Wear History
      ↓
Calendar Planner
      ↓
Style Insights
      ↓
Personalized Recommendations
```

without major rewrites.

---

# Check When Done

* wear history API exists
* authenticated history retrieval works
* history page renders correctly
* timeline grouping works
* outfit detail dialog works
* empty state works
* loading state works
* history updates after Wear This
* last worn information displays
* no TypeScript errors
* no lint errors
* npm run build passes
