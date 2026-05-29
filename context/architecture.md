# Architecture Context

## Stack

| Layer                 | Technology                               | Role                                                                    |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Framework             | Next.js + TypeScript                     | Frontend application, SSR, API integration, scalable React architecture |
| UI                    | Tailwind CSS + shadcn/ui + Framer Motion | Premium UI system, responsive styling, animations                       |
| Authentication        | Clerk                                    | Google/Apple/Email login, session management                            |
| Backend               | NestJS (Node.js)                         | Scalable backend architecture and API layer                             |
| ORM                   | Prisma                                   | Database modeling and type-safe queries                                 |
| Database              | PostgreSQL + pgvector                    | Structured wardrobe data + vector similarity search                     |
| Storage               | Cloudinary                               | Clothing image storage, optimization, CDN                               |
| AI Vision             | OpenAI Vision / FashionCLIP              | Clothing recognition, metadata extraction, tagging                      |
| Recommendation Engine | Custom Rule Engine + Embeddings          | Personalized outfit recommendation system                               |
| Weather               | OpenWeather API                          | Weather-aware outfit recommendations                                    |
| 3D Avatar             | Ready Player Me / Avaturn                | User body scan and avatar generation                                    |
| 3D Rendering          | React Three Fiber + Three.js             | Avatar rendering and virtual wardrobe visualization                     |
| Queue System          | BullMQ + Redis                           | Background processing for image tagging and AI jobs                     |
| Monorepo              | Turborepo + pnpm                         | Scalable multi-service architecture                                     |

---

## System Boundaries

- `apps/web` — Main user-facing wardrobe platform (upload clothes, build outfits, AI stylist)
- `apps/admin` — Admin dashboard for moderation, analytics, AI monitoring
- `apps/api` — Central backend APIs for wardrobe, recommendations, onboarding, avatar system
- `services/ai-engine` — Clothing recognition, metadata tagging, embeddings, outfit recommendations
- `services/weather-engine` — Weather fetching and environmental personalization
- `services/avatar-engine` — Avatar generation, body scan processing, virtual try-on preparation
- `packages/ui` — Shared design system and reusable UI components
- `packages/shared` — Shared types, validation schemas, utilities

---

## Storage Model

- **PostgreSQL Database**:
  Stores users, wardrobes, clothing metadata, outfit combinations, preferences, weather history, recommendation logs, avatar metadata, ownership relationships.

- **pgvector (inside PostgreSQL)**:
  Stores clothing embeddings for outfit compatibility and similarity search.

- **Cloudinary Storage**:
  Stores uploaded clothing images, segmented garments, optimized media assets, thumbnails.

- **Redis Cache**:
  Stores temporary AI jobs, caching, recommendation queues, rate-limiting.

---

## Auth and Access Model

- Every user signs in via Clerk using Google, Apple, or Email authentication.
- Every wardrobe belongs to a single user.
- Clothing items are owned privately by default.
- Outfit recommendations are generated only from clothes owned by the user.
- Only the owner can edit wardrobe assets and generated outfits.
- AI services access wardrobe data through scoped APIs only.

---

## Invariants

1. Request handlers must never run long AI/image processing jobs directly — all heavy tasks go through background queues.
2. Every uploaded clothing item must pass through background removal and metadata tagging before entering the wardrobe.
3. Outfit recommendations must only use clothing pieces owned by the authenticated user.
4. Weather-aware recommendations must always consider temperature, humidity, rain probability, and time of day.
5. Avatar rendering must be decoupled from wardrobe logic to prevent UI performance degradation.
6. AI recommendations should be explainable and deterministic at the rule-engine level before LLM enhancement.
