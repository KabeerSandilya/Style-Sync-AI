# AI Workflow Rules

## Approach

Build this project incrementally using a **spec-driven and domain-driven workflow**.

Context files (`architecture.md`, `code-standards.md`, `progress-tracker.md`, feature specs) define:

- What to build
- How to build it
- System boundaries
- Current progress
- Technical invariants

Always implement against documented specs. Never invent product behavior or architecture assumptions outside the defined context.

Development should prioritize **shipping a stable MVP first**, followed by progressive enhancement:

### Phase 1 — MVP

- User authentication
- Clothing upload
- Background removal
- Digital wardrobe
- AI outfit recommendations
- Weather-aware styling
- Outfit builder

### Phase 2 — Intelligence Layer

- User style learning
- Recommendation personalization
- Outfit history
- Occasion-aware suggestions
- Smart wardrobe insights

### Phase 3 — Avatar & Virtual Try-On

- Body scan onboarding
- Avatar generation
- 3D wardrobe rendering
- Virtual outfit previews

---

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over speculative implementation.
- Do not combine unrelated system boundaries into a single implementation step.
- Prioritize end-to-end vertical slices over incomplete horizontal systems.
- Build for production quality, but optimize scope for MVP delivery.

### Preferred Feature Order

1. Authentication
2. Wardrobe upload pipeline
3. Clothing metadata extraction
4. Wardrobe management UI
5. Weather integration
6. Recommendation engine
7. Outfit builder
8. AI stylist explanation layer
9. Avatar onboarding
10. Virtual try-on system

---

## When to Split Work

Split implementation if it combines:

- UI changes and background AI processing
- Upload flows and recommendation logic
- Multiple unrelated API routes
- Frontend and infrastructure concerns in one step
- Avatar rendering and recommendation systems
- Behavior not explicitly defined in context files

If a feature cannot be verified end-to-end quickly, split the scope.

### Good Example

**Feature Unit: Clothing Upload**

Scope:

- Upload image
- Save to Cloudinary
- Run background removal
- Extract metadata
- Save item to wardrobe

### Bad Example

Combining:

- Clothing upload
- Outfit recommendation engine
- Avatar rendering
- Weather system

In one implementation cycle.

---

## Handling Missing Requirements

- Never invent product behavior not defined in context files.
- If a requirement is ambiguous, resolve it inside the relevant context file before implementation.
- Missing requirements must be added as open questions in `progress-tracker.md`.
- Recommendation logic must remain deterministic before LLM enhancement.
- AI behavior should always be explainable.

Examples of required clarification:

- What defines “matching clothes”?
- How much outfit randomness is allowed?
- What recommendation priority exists between weather and aesthetics?
- Should recommendations optimize for repetition avoidance?

---

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — Generated shadcn/ui components
- `packages/shared/types/*` — Shared system contracts
- `packages/config/*` — Shared linting and TypeScript configs
- Prisma migration history
- Third-party library internals
- Generated avatar assets

Never directly edit generated files.

---

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

### `architecture.md`

When:

- System boundaries change
- Storage architecture changes
- New services are introduced
- Queueing or AI infrastructure changes

### `code-standards.md`

When:

- Development conventions evolve
- New tooling is introduced
- AI engineering constraints are added

### `progress-tracker.md`

When:

- A feature unit starts
- A feature unit completes
- Open questions appear
- Scope changes occur

### Feature Specs

When:

- Product requirements evolve
- Recommendation logic changes
- Avatar behavior changes
- User flows are updated

---

## Before Moving to the Next Unit

1. The current feature works end-to-end inside its defined scope.
2. No invariant in `architecture.md` has been violated.
3. `progress-tracker.md` reflects implementation status.
4. Types are fully safe (`strict` mode passes).
5. API contracts remain stable.
6. Background jobs are retry-safe.
7. `npm run build` passes.
8. `npm run lint` passes.
9. No hardcoded mock logic remains in production paths.
10. AI recommendations are explainable and testable.
