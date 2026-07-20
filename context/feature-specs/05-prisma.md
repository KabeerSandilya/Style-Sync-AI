# Prisma Setup & Core Data Models

Prisma is already installed.

We are implementing the **core database models** for **StyleSync AI**.

The schema must support:

### MVP

* authentication ownership
* digital wardrobe storage
* garment uploads
* outfit saving
* recommendation generation
* user preferences

### Future Compatibility

* AI garment classification
* outfit recommendation personalization
* weather-aware suggestions
* wardrobe analytics

The schema should remain **minimal but extensible**.

Avoid premature complexity while preventing painful migrations later.

---

# Database Architecture

Database:

**PostgreSQL**

ORM:

**Prisma**

Authentication source:

**Clerk**

User ownership must always map to:

```txt id="im4lko"
Clerk userId
```

Never create duplicate auth systems.

---

# Prisma File Structure

Create:

```txt id="n0v2z5"
prisma/models/
```

Split schema into domain models.

Required files:

```txt id="rzlmyi"
prisma/models/garment.prisma
prisma/models/outfit.prisma
prisma/models/user-preference.prisma
prisma/models/recommendation.prisma
```

Then compose them into:

```txt id="7n53d2"
prisma/schema.prisma
```

Keep models modular.

Do not place everything in one giant schema file.

---

# Garment Model

Create:

`prisma/models/garment.prisma`

Purpose:

Stores uploaded clothing items inside a user's wardrobe.

Requirements:

```prisma id="kq1qop"
model Garment {
  id              String   @id @default(cuid())

  userId          String

  imageUrl        String

  name            String
  category        String

  notes           String?

  tags            String[]

  dominantColor   String?
  season           String?
  occasion         String?
  clothingType     String?

  isFavorite      Boolean  @default(false)
  isProcessed      Boolean  @default(false)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  outfitItems      OutfitGarment[]

  @@index([userId])
  @@index([createdAt])
}
```

### Rules

Defaults:

```txt id="fpb71n"
name = "New Garment"
category = "Uncategorized"
tags = []
```

Garments belong to exactly one authenticated user.

No garment sharing in MVP.

---

# Outfit Model

Create:

`prisma/models/outfit.prisma`

Purpose:

Stores saved outfits.

Requirements:

```prisma id="68qfmx"
model Outfit {
  id            String   @id @default(cuid())

  userId        String

  name          String

  notes         String?

  isFavorite    Boolean @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  garments      OutfitGarment[]

  @@index([userId])
  @@index([createdAt])
}
```

---

# Outfit ↔ Garment Join Table

Required for many-to-many relationships.

Requirements:

```prisma id="g2p4iz"
model OutfitGarment {
  id           String   @id @default(cuid())

  outfitId     String
  garmentId    String

  outfit       Outfit @relation(fields: [outfitId], references: [id], onDelete: Cascade)

  garment      Garment @relation(fields: [garmentId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())

  @@unique([outfitId, garmentId])

  @@index([outfitId])
  @@index([garmentId])
}
```

Why:

Users will reuse garments across many outfits.

Example:

```txt id="dbz7rw"
Black hoodie
→ casual outfit
→ airport outfit
→ winter outfit
```

---

# User Preference Model

Create:

`prisma/models/user-preference.prisma`

Purpose:

Stores onboarding and personalization data.

Requirements:

```prisma id="z4qibd"
model UserPreference {
  id                 String   @id @default(cuid())

  userId             String   @unique

  preferredStyles    String[]
  dislikedColors     String[]
  favoriteCategories String[]

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([userId])
}
```

Examples:

```txt id="xn2rpo"
streetwear
minimal
oversized
```

Future AI personalization depends on this.

---

# Recommendation Model

Create:

`prisma/models/recommendation.prisma`

Purpose:

Stores generated outfit recommendations.

Requirements:

```prisma id="vpph4y"
model Recommendation {
  id              String   @id @default(cuid())

  userId          String

  explanation     String?

  weatherContext  Json?

  createdAt       DateTime @default(now())

  outfitId        String?

  outfit          Outfit? @relation(fields: [outfitId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([createdAt])
}
```

Why:

Future recommendation learning.

Example:

```txt id="mjlwmr"
Did user save this?
Did user ignore this?
```

Without schema rewrites.

---

# Prisma Client

Create:

`lib/prisma.ts`

Requirements:

### Singleton Pattern

Export one cached Prisma instance.

### Database Branching

If:

```txt id="m12z7k"
DATABASE_URL
```

starts with:

```txt id="63zwel"
prisma+postgres://
```

Use:

**Prisma Accelerate**

Otherwise:

Use:

**@prisma/adapter-pg**

Requirements:

* hot reload safe
* cached on `global` in development
* avoid duplicate Prisma instances

Never instantiate Prisma repeatedly.

---

# Migration

Run:

1. Prisma schema validation
2. First migration
3. Client generation

Requirements:

* migration succeeds
* generated client is usable
* no schema conflicts

---

# Dependencies

Already installed:

* prisma
* @prisma/client
* @prisma/adapter-pg
* pg

No additional ORM libraries.

---

# Constraints

Do **not**:

* create a local auth system
* duplicate Clerk users in database
* over-normalize prematurely
* add social/collaboration models
* add recommendation ML storage yet

Keep MVP lean.

---

# Check When Done

* modular Prisma models exist
* schema composes correctly
* `Garment` model exists
* `Outfit` model exists
* join table works
* `UserPreference` model exists
* `Recommendation` model exists
* indexes exist
* Prisma singleton works
* Accelerate branching works
* migration succeeds
* Prisma client generates successfully
* no TypeScript errors
* `npm run build` passes
