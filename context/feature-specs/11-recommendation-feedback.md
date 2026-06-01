# Recommendation Feedback & Wear History

We are implementing the **Recommendation Feedback System** for **StyleSync AI**.

Users can already:

* upload garments
* classify garments
* build outfits
* receive outfit recommendations

The system can currently recommend outfits.

However, it cannot learn whether recommendations were actually useful.

This feature introduces:

* wear tracking
* recommendation feedback
* recommendation history
* repetition avoidance signals

These become the foundation for future personalization.

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`
* `globals.css`

The experience should feel:

**lightweight, intentional, and non-intrusive.**

Users should never feel like they are training a model.

---

# Scope

Build:

### Wear Tracking

### Recommendation Feedback

### Recommendation History

### Feedback APIs

### Recommendation Actions

### Recommendation Scoring Signals

Do **not** build:

* machine learning
* embeddings
* AI personalization
* user clustering
* recommendation retraining
* analytics dashboard

This version only captures signals.

---

# Goals

The system should learn:

```txt
Did the user wear this outfit?
Did the user like this recommendation?
Did the user dislike this recommendation?
Did the user ignore it?
```

Future recommendation engines will use these signals.

---

# Database Models

Create:

`prisma/models/recommendation-feedback.prisma`

---

## Feedback Type Enum

```prisma
enum FeedbackType {
  LIKE
  DISLIKE
}
```

---

## RecommendationFeedback

```prisma
model RecommendationFeedback {
  id            String @id @default(cuid())

  userId        String

  outfitId      String

  feedbackType  FeedbackType

  createdAt     DateTime @default(now())

  outfit        Outfit @relation(fields: [outfitId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([outfitId])
  @@index([createdAt])
}
```

---

## OutfitWear

Create:

```prisma
model OutfitWear {
  id          String @id @default(cuid())

  userId      String

  outfitId    String

  wornAt      DateTime @default(now())

  outfit      Outfit @relation(fields: [outfitId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([outfitId])
  @@index([wornAt])
}
```

Purpose:

Track actual outfit usage.

---

# Recommendation Actions

Every recommendation card should support:

### Wear This

### Like

### Dislike

Actions should remain visually lightweight.

Avoid social-media style interactions.

---

# Wear This Action

Purpose:

User confirms they wore the outfit.

Flow:

```txt
Click Wear This
        ↓
Create OutfitWear
        ↓
Refresh Recommendations
```

Store:

```txt
outfitId
userId
timestamp
```

This becomes the strongest recommendation signal.

---

# Like Action

Purpose:

User likes recommendation.

Flow:

```txt
Click Like
        ↓
Create RecommendationFeedback
        ↓
feedbackType = LIKE
```

Meaning:

```txt
Recommend similar outfits more often
```

Future behavior only.

No personalization required yet.

---

# Dislike Action

Purpose:

User dislikes recommendation.

Flow:

```txt
Click Dislike
        ↓
Create RecommendationFeedback
        ↓
feedbackType = DISLIKE
```

Meaning:

```txt
Reduce future recommendation priority
```

Future behavior only.

---

# Recommendation APIs

Create:

---

## POST /api/recommendations/[outfitId]/wear

Purpose:

Record outfit wear.

Requirements:

* Clerk authentication required
* verify outfit ownership
* unauthorized → 401
* non-owner → 403
* not found → 404

Success:

```ts
{
  success: true
}
```

---

## POST /api/recommendations/[outfitId]/like

Purpose:

Record positive feedback.

Requirements:

* authenticated user only
* owner validation
* prevent duplicate likes

---

## POST /api/recommendations/[outfitId]/dislike

Purpose:

Record negative feedback.

Requirements:

* authenticated user only
* owner validation
* prevent duplicate dislikes

---

# Recommendation History Service

Create:

`services/recommendation-history/`

Responsibilities:

```txt
Get recent wears
Get feedback history
Calculate recency
```

No personalization logic yet.

---

# Repetition Avoidance

Update recommendation scoring.

Recently worn outfits should receive a penalty.

Example:

```txt
Worn Today
  → Heavy Penalty

Worn Yesterday
  → Medium Penalty

Worn Last Week
  → Small Penalty

Not Worn Recently
  → No Penalty
```

Goal:

Avoid recommending the same outfit repeatedly.

---

# Recommendation Scoring Update

Previous:

```txt
Weather Fit
+
Season Fit
+
Style Fit
```

New:

```txt
Weather Fit
+
Season Fit
+
Style Fit
+
Feedback Score
-
Recent Wear Penalty
```

Keep scoring deterministic.

No AI.

---

# Recommendation UI

Update:

`components/recommendation/todays-recommendations.tsx`

Add:

### Wear This Button

Primary action.

---

### Like Button

Subtle positive signal.

---

### Dislike Button

Subtle negative signal.

Requirements:

* small footprint
* elegant styling
* editorial aesthetic

Avoid:

* giant reaction buttons
* social-media appearance

---

# Recommendation History Rules

Store:

```txt
Date Recommended
Date Worn
Feedback Type
```

Purpose:

Future recommendation learning.

Do not expose history UI yet.

Capture data only.

---

# State Management

After:

* wear
* like
* dislike

Automatically:

* refresh recommendations
* update scores
* update recommendation ordering

No:

```ts
window.location.reload()
```

Use:

* query invalidation
* server refresh pattern

---

# Constraints

Do **not**:

* build AI personalization
* train models
* create recommendation analytics
* expose raw feedback data
* create recommendation dashboards

Collect signals only.

---

# Future Compatibility

This system must support:

```txt
Recommendation Engine V2
        ↓
User Preferences
        ↓
Wear History
        ↓
Feedback History
        ↓
Personalized Ranking
```

without schema rewrites.

---

# Check When Done

* feedback models exist
* migrations succeed
* wear tracking works
* like tracking works
* dislike tracking works
* ownership validation works
* duplicate feedback prevented
* recommendation refresh works
* repetition avoidance works
* scoring updates work
* no TypeScript errors
* no lint errors
* npm run build passes
