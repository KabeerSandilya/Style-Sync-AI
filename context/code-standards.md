# Code Standards

## General

* Keep modules small, single-purpose, and domain-driven (wardrobe, avatar, AI, weather, auth).
* Fix root causes instead of layering workarounds or temporary patches.
* Do not mix unrelated concerns inside components, services, routes, or background jobs.
* Prefer composition over deeply nested abstractions.
* Business logic must live in services — never directly inside controllers or UI components.
* Heavy AI/image processing must never block request-response cycles.
* Optimize for maintainability and product scalability over premature optimization.

---

## TypeScript

* Strict mode is mandatory across the entire project.
* Avoid `any` entirely — prefer explicit interfaces, Zod schemas, DTOs, or narrow generics.
* Validate all unknown external input at system boundaries before use.
* Shared types must live inside `packages/shared`.
* Use discriminated unions for recommendation states and async job states.
* Prefer immutable patterns (`readonly`, pure functions) where possible.
* Prisma types are the source of truth for database models.

---

## Next.js (Frontend)

* Default to Server Components.
* Add `"use client"` only for browser interactivity, animations, drag-and-drop, or avatar rendering.
* Keep pages thin — business logic belongs in backend services.
* Route handlers must have a single responsibility.
* Avoid fetching directly from third-party APIs in UI components.
* Use Suspense boundaries for async wardrobe loading and recommendation rendering.
* React Three Fiber logic must be isolated to dedicated avatar/3D components.

---

## NestJS (Backend)

* Use feature/domain-based modules:

  * `wardrobe`
  * `recommendation`
  * `weather`
  * `avatar`
  * `auth`
* Controllers only handle request parsing and response formatting.
* Services contain business logic.
* Long-running operations must run through queues (BullMQ).
* DTO validation is mandatory using Zod or class-validator.
* Background jobs must be idempotent and retry-safe.

---

## Styling

* Use Tailwind CSS utility-first styling.
* Use shadcn/ui as the base component system.
* No hardcoded spacing, border radius, or color values.
* Design tokens must be centralized.
* Maintain consistent spacing scale throughout wardrobe cards, upload flows, and outfit builders.
* Framer Motion should be used only when interaction meaningfully improves UX.

---

## API Routes

* Validate request payloads before any business logic runs.
* Enforce authentication and ownership before all mutations.
* Recommendations must only access clothing owned by the authenticated user.
* Return consistent response structures:

```ts
{
  success: boolean,
  data?: T,
  error?: string
}
```

* Never expose raw database errors to clients.
* All external APIs (weather, AI models, avatar providers) must be wrapped behind service abstractions.

---

## AI and Recommendation System

* Recommendation logic must follow a hybrid architecture:

  1. Rule-based filtering
  2. Embedding similarity
  3. LLM explanation layer
* LLMs must never directly make deterministic wardrobe decisions.
* Weather context must always include:

  * temperature
  * humidity
  * rain probability
  * time of day
  * AQI (if available)
* Every uploaded clothing item must complete metadata extraction before becoming recommendation-eligible.
* Recommendation responses should always be explainable.

---

## Data and Storage

* Metadata belongs in PostgreSQL.
* Embeddings belong in `pgvector`.
* Large media assets belong in Cloudinary.
* Never store large image blobs directly in PostgreSQL.
* AI-generated temporary artifacts must expire automatically.
* Cache weather and recommendation results when possible.

---

## File Organization

* `apps/web/` — User-facing wardrobe application.
* `apps/admin/` — Internal dashboard and analytics.
* `apps/api/` — Main backend APIs.
* `services/ai-engine/` — Clothing recognition, tagging, recommendations.
* `services/weather-engine/` — Weather and contextual personalization.
* `services/avatar-engine/` — Body scan, avatar generation, virtual try-on prep.
* `packages/ui/` — Shared UI system.
* `packages/shared/` — Shared types, validation, utilities.
* `packages/config/` — Shared ESLint, TypeScript, Prettier configs.
