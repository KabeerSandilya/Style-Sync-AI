# Preference Learning V1

We are implementing **Preference Learning V1** for **StyleSync AI**.

Users can already:

* upload garments
* classify garments
* create outfits
* receive recommendations
* track wear history
* view wardrobe insights

The system now has enough behavioral data to begin learning user preferences.

The goal is to automatically infer:

* preferred colors
* preferred styles
* preferred categories
* preferred seasons
* preferred garment types

without asking users to manually configure everything.

This version is entirely deterministic.

Do **not** use AI or LLMs.

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`
* `globals.css`

---

# Scope

Build:

### Preference Aggregation

### Preference Service

### Preference API

### Preference Profile

### Recommendation Integration

### Preference Insights UI

Do **not** build:

* machine learning
* embeddings
* user clustering
* GPT preference analysis
* recommendation retraining

This version only derives preferences from user actions.

---

# Data Sources

Preference learning should use:

### Wear History

Strongest signal.

Example:

```txt
Worn 15 times
→ Strong preference
```

---

### Recommendation Feedback

Examples:

```txt
LIKE
→ Positive signal

DISLIKE
→ Negative signal
```

---

### Favorite Garments

Examples:

```txt
Favorite = true
→ Positive signal
```

---

### Favorite Outfits

Examples:

```txt
Favorite Outfit
→ Positive signal
```

---

# Preference Hierarchy

Signal strength:

```txt
Wear History         = Highest

Likes                = High

Favorites            = Medium

Dislikes             = Negative
```

Wear behavior should outweigh all other signals.

---

# Database Model

Create:

`prisma/models/user-preference.prisma`

Purpose:

Store aggregated preference profile.

```prisma
model UserPreference {
  id                  String   @id @default(cuid())

  userId              String   @unique

  favoriteColors      String[]
  favoriteStyles      String[]
  favoriteCategories  String[]
  favoriteSeasons     String[]
  favoriteTypes       String[]

  preferenceScore     Json?

  updatedAt           DateTime @updatedAt
  createdAt           DateTime @default(now())

  @@index([userId])
}
```

---

# Preference Service

Create:

```txt
services/preferences/
```

Required files:

```txt
services/preferences/build-profile.ts
services/preferences/calculate-scores.ts
services/preferences/types.ts
services/preferences/update-profile.ts
```

Responsibilities:

* analyze user behavior
* aggregate signals
* generate preference profile
* persist results

No UI logic.

No API logic.

---

# Preference Categories

The system should calculate preferences for:

---

## Colors

Examples:

```txt
Black
White
Grey
Brown
Blue
Green
```

Calculation:

Count appearances across:

* worn outfits
* liked outfits
* favorite garments

Rank highest first.

---

## Styles

Examples:

```txt
Casual
Streetwear
Minimal
Formal
Athleisure
```

Calculate from:

```txt
Garment Metadata
+
Outfit Metadata
```

---

## Categories

Examples:

```txt
Topwear
Bottomwear
Outerwear
Footwear
Accessories
```

Determine which categories appear most frequently.

---

## Seasons

Examples:

```txt
Summer
Winter
Spring
Autumn
All Season
```

---

## Clothing Types

Examples:

```txt
Flannel Shirt
Cargo Pants
Straight Jeans
Sneakers
```

These become highly valuable later for recommendations.

---

# Scoring System

Create weighted scoring.

Example:

```txt
Wear Event      +10

Like            +5

Favorite        +3

Dislike         -5
```

These values should be configurable.

Store raw scores internally.

---

# Preference Profile Generation

Example:

Input:

```txt
Worn:
- Black Tee (12x)
- Black Cargo (10x)
- White Sneakers (15x)

Liked:
- Streetwear Outfit
```

Generated profile:

```json
{
  "favoriteColors": [
    "Black",
    "White"
  ],
  "favoriteStyles": [
    "Streetwear"
  ],
  "favoriteCategories": [
    "Topwear",
    "Footwear"
  ]
}
```

---

# Profile Refresh

Preferences should refresh:

After:

```txt
Wear This

Like

Dislike

Favorite Garment

Favorite Outfit
```

Do not require manual refresh.

---

# API

Create:

`GET /api/preferences`

Purpose:

Return authenticated user's preference profile.

---

## Requirements

* Clerk authentication required
* user-specific profile only
* unauthorized → 401

---

## Response

```ts
{
  success: true,
  data: {
    favoriteColors: [],
    favoriteStyles: [],
    favoriteCategories: [],
    favoriteSeasons: [],
    favoriteTypes: []
  }
}
```

---

# Insights UI

Create:

`app/preferences/page.tsx`

Purpose:

Display learned preferences.

---

## Sections

### Favorite Colors

Display:

```txt
Black
White
Grey
```

Use subtle color chips.

---

### Favorite Styles

Display:

```txt
Streetwear
Casual
Minimal
```

---

### Favorite Categories

Display:

```txt
Topwear
Footwear
Bottomwear
```

---

### Favorite Clothing Types

Display:

```txt
Oversized Tee
Cargo Pants
Sneakers
```

---

# Empty State

When insufficient data exists:

Show:

```txt
Wear more outfits to help StyleSync understand your style.
```

Supporting text:

```txt
Preferences are learned automatically from your wardrobe activity.
```

---

# Recommendation Engine Integration

Update recommendation scoring.

Current:

```txt
Weather Fit
+
Season Fit
+
Style Fit
-
Recent Wear Penalty
```

New:

```txt
Weather Fit
+
Season Fit
+
Style Fit
+
Preference Match
-
Recent Wear Penalty
```

---

## Preference Match Examples

User prefers:

```txt
Black
Streetwear
Sneakers
```

Outfit contains:

```txt
Black Cargo
Black Tee
White Sneakers
```

Add bonus score.

---

## Negative Match

User frequently dislikes:

```txt
Formalwear
```

Apply recommendation penalty.

---

# Recommendation Explanation

Future recommendation cards may display:

```txt
Recommended because it matches your preferred streetwear style.
```

Keep explanation deterministic.

No LLM required.

---

# Constraints

Do **not**:

* use AI
* use Gemini
* use embeddings
* infer personality traits
* create recommendation retraining

Use behavior only.

---

# Future Compatibility

This system should support:

```txt
Preference Learning
        ↓
Personalized Recommendations
        ↓
AI Stylist
        ↓
Dynamic Outfit Generation
```

without schema rewrites.

---

# Check When Done

* preference model exists
* preference service exists
* preference aggregation works
* profile generation works
* API works
* recommendation integration works
* profile refresh works
* preference page renders
* empty state works
* no TypeScript errors
* no lint errors
* npm run build passes
