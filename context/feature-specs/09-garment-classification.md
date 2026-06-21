# AI Garment Classification & Metadata Extraction

We are implementing the **AI Garment Classification System** for **StyleSync AI**.

This system automatically analyzes uploaded clothing images and enriches garments with structured fashion metadata.

The goal is to eliminate manual categorization wherever possible and build the foundation for:

* outfit recommendations
* weather-aware styling
* wardrobe search
* outfit generation
* style personalization
* future garment similarity matching

Follow:

* `architecture.md`
* `code-standards.md`
* `ui-context.md`
* `globals.css`

The system must feel:

**fast, invisible, reliable, and non-blocking.**

Users should never wait for AI analysis before using the application.

---

# Scope

Build:

### Gemini Integration

### Garment Classification Service

### Background Processing

### Metadata Storage

### Classification Status

### Reprocessing Endpoint

### UI Processing States

Do **not** build:

* outfit recommendations
* style matching
* garment embeddings
* vector search
* AI stylist chat
* weather scoring

This feature only extracts metadata.

---

# AI Provider

Use:

**Gemini 2.5 Flash**

Provider:

Google AI Studio

Reasoning:

* generous free tier
* strong vision capabilities
* structured JSON output
* low latency
* simple integration

Do not use:

* OpenAI Vision
* FashionCLIP
* custom ML models

for V1.

---

# Dependencies

Install:

```bash id="vuxa0c"
npm install @google/genai
```

No additional AI SDKs.

---

# Environment Variables

Add:

```env id="2f3jnn"
GEMINI_API_KEY=your_api_key
```

Rules:

* server-side only
* never exposed to client
* never logged

Fail gracefully when missing.

---

# Database Changes

Extend the existing `Garment` model.

Add:

```prisma id="8h5k8s"
subcategory      String?
primaryColor     String?
secondaryColor   String?

season           String?
style            String?
material         String?

confidence       Int?

isProcessed      Boolean @default(false)
```

Purpose:

Store structured AI metadata.

---

# Metadata Contract

Gemini must return:

```json id="x4aw7u"
{
  "category": "",
  "subcategory": "",
  "primaryColor": "",
  "secondaryColor": "",
  "season": "",
  "style": "",
  "material": "",
  "confidence": 0
}
```

---

# Classification Service

Create:

```txt id="7yctn2"
services/garment-classification/
```

Required files:

```txt id="smrv0g"
services/garment-classification/classify-garment.ts
services/garment-classification/prompts.ts
services/garment-classification/types.ts
```

Responsibilities:

* call Gemini
* validate output
* normalize metadata
* return structured result

No database logic inside service.

---

# Prompt Strategy

The AI should classify:

### Category

Examples:

```txt id="wxg8od"
Topwear
Bottomwear
Outerwear
Footwear
Accessories
Formalwear
Sportswear
Ethnicwear
```

---

### Subcategory

Examples:

```txt id="8mdqgc"
Flannel Shirt
Oxford Shirt
Cargo Pants
Straight Jeans
Bomber Jacket
Sneakers
```

---

### Color

Examples:

```txt id="8oqvjq"
Black
White
Brown
Beige
Blue
Grey
Green
```

---

### Season

Allowed:

```txt id="89xk0z"
Summer
Winter
Spring
Autumn
All Season
```

---

### Style

Examples:

```txt id="4o4fhn"
Casual
Formal
Streetwear
Minimal
Athleisure
Business Casual
```

---

### Material

Examples:

```txt id="n12q5o"
Cotton
Denim
Linen
Wool
Polyester
Leather
```

---

# Classification Flow

The workflow must be:

```txt id="9y6ggt"
User Uploads Garment
          ↓
Cloudinary Upload
          ↓
Garment Created
          ↓
isProcessed = false
          ↓
Trigger Classification
          ↓
Gemini Analysis
          ↓
Save Metadata
          ↓
isProcessed = true
```

Uploads should complete immediately.

Classification happens afterward.

---

# Important Architecture Rule

Do NOT block uploads waiting for Gemini.

Bad:

```txt id="1znsqg"
Upload
 ↓
Gemini
 ↓
Database
```

Good:

```txt id="gt7u0r"
Upload
 ↓
Database
 ↓
Response to User
 ↓
Gemini Classification
```

The user should see their garment immediately.

---

# Classification Endpoint

Create:

```txt id="7uk79v"
POST /api/garments/[garmentId]/classify
```

Purpose:

Manually re-run classification.

Useful when:

* metadata is incorrect
* user wants fresh analysis
* future prompt updates occur

---

## Requirements

* Clerk authentication required
* garment ownership validation required
* unauthorized → `401`
* non-owner → `403`
* not found → `404`

---

## Response

Success:

```ts id="e9n6jt"
{
  success: true,
  data: garment
}
```

Failure:

```ts id="mql7xv"
{
  success: false,
  error: string
}
```

---

# UI Processing States

Update garment display components.

When:

```txt id="e93sh4"
isProcessed = false
```

Show:

### Processing State

Examples:

```txt id="5m3npo"
Analyzing Garment...
```

or

```txt id="5w7j5v"
Classifying Clothing...
```

Requirements:

* subtle loading indicator
* non-intrusive
* premium styling
* matches editorial design

Avoid:

* giant spinners
* blocking overlays

---

# Completed State

When:

```txt id="y14hw2"
isProcessed = true
```

Display metadata.

Example:

```txt id="m4zc8m"
Brown Flannel Shirt

Casual
Winter
Cotton
```

Use:

* tags
* chips
* subtle metadata styling

---

# Error Handling

If classification fails:

Requirements:

```txt id="nyn6jo"
isProcessed = false
```

must remain unchanged.

Allow:

* retry
* manual reclassification

Never delete garments.

Never fail uploads because AI failed.

---

# Validation

Validate Gemini response before saving.

Requirements:

* reject malformed JSON
* normalize casing
* trim whitespace
* enforce known enums where applicable

Fallback:

```txt id="m9mlzd"
Unknown
```

instead of invalid values.

---

# Future Compatibility

Design this service so it can later support:

### Embeddings

```txt id="2cq4sf"
FashionCLIP
```

### Similarity Search

```txt id="3kx9g9"
pgvector
```

### Outfit Matching

```txt id="4jhr53"
garment compatibility
```

Do not implement these yet.

---

# Constraints

Do **not**:

* call Gemini from client components
* expose API keys
* block uploads
* create recommendation logic
* generate outfits
* create embeddings
* store raw AI responses

Store only normalized metadata.

---

# Check When Done

* Gemini SDK installed
* API key configured
* garment schema updated
* classification service exists
* metadata extraction works
* Gemini returns structured output
* metadata saved correctly
* uploads remain non-blocking
* processing state visible
* reclassification endpoint works
* ownership validation works
* no TypeScript errors
* no lint errors
* `npm run build` passes
