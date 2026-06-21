# Recommendation Engine V1

We are implementing the first version of the **Outfit Recommendation Engine** for **StyleSync AI**.

This is the core intelligence layer of the product.

Users can already:

* upload garments
* classify garments with AI
* manage wardrobe metadata
* create outfits
* save outfits

Now the system must answer:

> What should I wear today?

The recommendation engine should recommend the most suitable saved outfits based on:

* weather conditions
* garment metadata
* outfit composition

This version must be deterministic and explainable.

Do **not** use LLMs to select outfits.

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`

---

# Scope

Build:

### Weather Service

### Recommendation Service

### Outfit Scoring Engine

### Recommendation API

### Recommendation UI

### Recommendation Explanations

Do **not** build:

* GPT outfit selection
* dynamic outfit generation
* user behavior learning
* vector embeddings
* similarity search
* AI stylist chat

This version ranks existing outfits only.

---

# Recommendation Flow

```txt
User Opens App
        ↓
Fetch Weather
        ↓
Fetch Saved Outfits
        ↓
Score Every Outfit
        ↓
Sort By Score
        ↓
Return Top Recommendations
```

---

# Weather Integration

Create:

`services/weather/`

Purpose:

Normalize weather data for recommendation logic.

Use:

* temperature
* humidity
* condition
* rain probability

Ignore:

* UV
* AQI
* wind

for V1.

---

## Weather Context

Normalized structure:

```ts
{
  temperature: number
  humidity: number
  condition: string
  rainProbability: number
}
```

Example:

```json
{
  "temperature": 34,
  "humidity": 78,
  "condition": "Sunny",
  "rainProbability": 10
}
```

---

# Recommendation Service

Create:

`services/recommendation/`

Required files:

```txt
services/recommendation/score-outfit.ts
services/recommendation/rank-outfits.ts
services/recommendation/explain-recommendation.ts
services/recommendation/types.ts
```

Responsibilities:

* evaluate outfits
* calculate score
* generate explanation
* return ranked results

No UI logic.

No API logic.

---

# Outfit Scoring

Every outfit receives a score:

```txt
0 → 100
```

Higher score = better recommendation.

---

## Scoring Formula

```txt
Weather Fit
+
Season Fit
+
Style Fit
=
Final Score
```

Example:

```txt
Weather Fit      40
Season Fit       30
Style Fit        20

Final Score      90
```

---

# Weather Rules

### Hot Weather

```txt
temperature > 32°C
```

Boost:

```txt
T-Shirt
Linen Shirt
Shorts
Lightweight Clothing
```

Penalize:

```txt
Hoodie
Heavy Jacket
Wool Layers
```

---

### Mild Weather

```txt
18°C - 32°C
```

Neutral scoring.

---

### Cold Weather

```txt
temperature < 18°C
```

Boost:

```txt
Hoodies
Jackets
Sweaters
Layered Outfits
```

Penalize:

```txt
Shorts
Sleeveless Tops
```

---

### Rain

```txt
rainProbability > 60
```

Penalize:

```txt
Light-colored suede footwear
```

Boost:

```txt
Covered footwear
Layered outfits
```

---

# Metadata Requirements

Recommendations depend on:

```txt
category
clothingType
season
style
dominantColor
```

Outfits with missing metadata should receive lower confidence scores.

Do not reject them.

---

# Recommendation Ranking

Create:

`rank-outfits.ts`

Responsibilities:

```txt
Score all outfits
        ↓
Sort descending
        ↓
Return best matches
```

Example:

```txt
Outfit A → 94
Outfit B → 87
Outfit C → 62
```

Output:

```txt
A
B
C
```

---

# Recommendation Explanations

Create:

`explain-recommendation.ts`

Purpose:

Generate deterministic explanations.

Examples:

```txt
Great for today's warm weather.
```

```txt
Lightweight garments make this outfit comfortable in high temperatures.
```

```txt
This outfit's seasonal metadata aligns well with current conditions.
```

No LLMs.

No AI-generated prose.

Simple rule-based explanations.

---

# Recommendation API

Create:

`GET /api/recommendations`

Requirements:

* Clerk authentication required
* return current user's recommendations only
* calculate recommendations on request
* return top outfits

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
      outfitId: string,
      score: number,
      explanation: string
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

# Recommendation UI

Create:

`components/recommendation/todays-recommendations.tsx`

Purpose:

Display top outfit recommendations.

---

## Layout

Show:

### Today's Outfit

Primary recommendation.

Includes:

* outfit preview
* outfit name
* score
* explanation

---

### Alternative Options

Display:

Top 3 recommendations.

Order:

Highest score first.

---

# Empty State

When:

```txt
No outfits exist
```

Show:

```txt
Create outfits to receive recommendations.
```

CTA:

```txt
Create Outfit
```

---

# Loading State

Show:

Editorial skeleton cards.

Requirements:

* preserve layout
* soft pulse
* no harsh spinners

---

# State Management

Recommendations should refresh:

* on page load
* after outfit creation
* after outfit deletion

No:

```ts
window.location.reload()
```

Use:

* server refresh
* query invalidation

---

# Constraints

Do **not**:

* use GPT for outfit selection
* generate new outfits
* create embeddings
* add machine learning
* add recommendation history
* add feedback learning

Focus only on ranking saved outfits.

---

# Future Compatibility

This system must later support:

```txt
Weather
+
Wardrobe
+
Preferences
+
Recommendation History
```

without major rewrites.

Keep scoring modular.

---

# Check When Done

* weather service exists
* recommendation service exists
* outfit scoring works
* ranking works
* explanations work
* `/api/recommendations` works
* authenticated recommendations load
* top outfits display correctly
* empty state works
* loading state works
* no TypeScript errors
* no lint errors
* `npm run build` passes
