# Wardrobe Insights & Wear Analytics

We are implementing the **Wardrobe Insights System** for **StyleSync AI**.

Users can already:

* upload garments
* classify garments
* create outfits
* receive recommendations
* track wear history

The system now contains valuable behavioral data.

This feature transforms that data into useful wardrobe insights.

The goal is to help users understand:

* what they wear most
* what they never wear
* which clothes are underutilized
* which outfits they rely on most

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`
* `globals.css`

The experience should feel:

**editorial, reflective, and useful.**

Avoid dashboard-heavy analytics.

Avoid corporate KPI styling.

---

# Scope

Build:

### Wardrobe Insights Service

### Insights API

### Insights Page

### Never Worn Garments

### Least Worn Garments

### Most Worn Garments

### Most Worn Outfits

### Last Worn Information

Do **not** build:

* charts
* graphs
* machine learning
* AI insights
* preference learning
* trend prediction

Focus on useful wardrobe visibility.

---

# User Goals

Users should be able to answer:

```txt
Which clothes do I never wear?

Which outfits do I wear most often?

What has been sitting unused?

When did I last wear this?
```

---

# Navigation

Add:

### Insights

Example:

```txt
Wardrobe
Outfits
History
Insights
```

---

# Backend API

Create:

`GET /api/insights`

Purpose:

Return aggregated wardrobe insights for the authenticated user.

---

## Requirements

* Clerk authentication required
* user-specific insights only
* no cross-user aggregation
* unauthorized → 401

---

## Response

```ts
{
  success: true,
  data: {
    mostWornGarments: [],
    leastWornGarments: [],
    neverWornGarments: [],
    mostWornOutfits: [],
    recentlyWornOutfits: []
  }
}
```

---

# Insights Service

Create:

`services/insights/`

Required files:

```txt
services/insights/get-most-worn-garments.ts
services/insights/get-least-worn-garments.ts
services/insights/get-never-worn-garments.ts
services/insights/get-most-worn-outfits.ts
services/insights/types.ts
```

Responsibilities:

* aggregate wear history
* calculate usage statistics
* return presentation-ready data

No UI logic.

No API logic.

---

# Never Worn Garments

Purpose:

Identify garments that have never appeared in a worn outfit.

Definition:

```txt
Wear Count = 0
```

Examples:

```txt
Brown Bomber Jacket

Never worn
```

```txt
White Linen Shirt

Never worn
```

---

## UI Section

Title:

```txt
Never Worn
```

Subtitle:

```txt
Pieces waiting for their first outing.
```

Display:

* garment image
* garment name
* category

Limit:

Top 10 results.

---

# Least Worn Garments

Purpose:

Identify garments that rarely get used.

Definition:

```txt
Wear Count > 0
```

and among the lowest usage counts.

Examples:

```txt
Green Overshirt
Worn 1 time
```

```txt
Black Cargo Pants
Worn 2 times
```

---

## UI Section

Title:

```txt
Least Worn
```

Subtitle:

```txt
Items that may deserve more attention.
```

Display:

* image
* garment name
* wear count

---

# Most Worn Garments

Purpose:

Show wardrobe favorites.

Examples:

```txt
Grey Oversized Tee
Worn 18 times
```

```txt
Blue Straight Jeans
Worn 15 times
```

---

## UI Section

Title:

```txt
Most Worn
```

Subtitle:

```txt
Your wardrobe staples.
```

Display:

* image
* garment name
* wear count

Limit:

Top 10.

---

# Most Worn Outfits

Purpose:

Show frequently repeated outfits.

Examples:

```txt
Airport Fit
Worn 12 times
```

```txt
Weekend Casual
Worn 9 times
```

---

## UI Section

Title:

```txt
Most Worn Outfits
```

Subtitle:

```txt
Looks you rely on most.
```

Display:

* outfit preview
* outfit name
* wear count

---

# Last Worn Information

Update:

### Garment Cards

Display:

```txt
Last worn 4 days ago
```

or

```txt
Never worn
```

---

### Outfit Cards

Display:

```txt
Last worn yesterday
```

or

```txt
Never worn
```

Use lightweight metadata styling.

---

# Insights Page

Create:

`app/insights/page.tsx`

Purpose:

Display wardrobe insights.

---

## Layout

Order:

```txt
Most Worn Garments

Most Worn Outfits

Least Worn Garments

Never Worn Garments
```

Use:

* editorial sections
* spacious layout
* card-based presentation

Avoid:

* tables
* spreadsheets
* analytics dashboards

---

# Empty State

When insufficient wear history exists:

Show:

```txt
Wear more outfits to unlock wardrobe insights.
```

Supporting text:

```txt
Insights become more useful as your style history grows.
```

---

# Loading State

Use:

Editorial skeleton cards.

Requirements:

* preserve layout
* soft pulse
* no spinners

---

# Recommendation Integration

The recommendation engine should eventually consume:

### Never Worn Boost

Example:

```txt
Never worn garment
     ↓
Small recommendation bonus
```

Purpose:

Encourage wardrobe exploration.

---

### Overused Outfit Penalty

Example:

```txt
Worn 12 times recently
     ↓
Recommendation penalty
```

Purpose:

Avoid repetitive styling.

Do not implement advanced weighting yet.

---

# Constraints

Do **not**:

* build charts
* build trend graphs
* build AI-generated insights
* infer preferences
* use machine learning
* create analytics dashboards

Focus on useful wardrobe visibility.

---

# Future Compatibility

This system should support:

```txt
Wear History
      ↓
Wardrobe Insights
      ↓
Preference Learning
      ↓
Personalized Recommendations
```

without schema rewrites.

---

# Check When Done

* insights service exists
* insights API works
* authenticated access enforced
* never worn garments display correctly
* least worn garments display correctly
* most worn garments display correctly
* most worn outfits display correctly
* last worn metadata displays
* empty state works
* loading state works
* no TypeScript errors
* no lint errors
* npm run build passes
