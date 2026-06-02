# Backend APIs — Wardrobe & Outfit Management

The database schema is ready.

Build the **backend API routes only** for **StyleSync AI**.

This implementation is **backend-only**.

Do **not** wire any frontend UI yet.

Do **not** add loading states, dialogs, hooks, or client-side fetching.

The goal is to establish the secure wardrobe CRUD foundation for the application.

Authentication source:

**Clerk**

Database:

**Prisma + PostgreSQL**

Use:

`lib/prisma.ts`

for all database access.

Follow:

* `architecture.md`
* `code-standards.md`

---

# Routes

Create REST endpoints for:

---

## Garments

### `GET /api/garments`

Purpose:

List authenticated user's wardrobe.

Requirements:

* return garments owned by current user only
* newest garments first
* unauthenticated requests return `401`

Order:

```txt id="1udc9l"
createdAt DESC
```

Response:

```ts id="8fx7xh"
{
  success: true,
  data: garments
}
```

---

### `POST /api/garments`

Purpose:

Create garment record after successful upload.

Requirements:

Use authenticated Clerk user ID as:

```txt id="yv77h9"
userId
```

Allow:

```ts id="68nclg"
{
  imageUrl: string
  notes?: string
}
```

Default values:

```txt id="wnv2qa"
name = "New Garment"
category = "Uncategorized"
tags = []
isProcessed = false
```

Requirements:

* validate auth
* validate required fields
* return created garment
* unauthenticated requests return `401`

Use Prisma’s existing ID strategy.

Do not create sequential IDs.

---

### `PATCH /api/garments/[garmentId]`

Purpose:

Update garment metadata.

Allowed updates:

* name
* category
* notes
* tags
* isFavorite

Requirements:

* only garment owner can update
* validate authenticated user
* unauthorized → `401`
* non-owner → `403`
* garment not found → `404`

---

### `DELETE /api/garments/[garmentId]`

Purpose:

Delete garment from wardrobe.

Requirements:

* only owner can delete
* unauthorized → `401`
* non-owner → `403`
* garment not found → `404`

Future compatibility:

Deletion should not break outfit relationships.

Use existing Prisma relation handling.

---

## Outfits

### `GET /api/outfits`

Purpose:

List saved outfits.

Requirements:

* return authenticated user outfits only
* newest first
* include garment references
* unauthenticated → `401`

Order:

```txt id="rqx4u4"
createdAt DESC
```

---

### `POST /api/outfits`

Purpose:

Create saved outfit.

Input:

```ts id="sh3qnp"
{
  name?: string
  garmentIds: string[]
  notes?: string
}
```

Requirements:

* validate authenticated user
* verify ownership of all garments
* reject garments owned by other users
* default name:

```txt id="0cg7p5"
Untitled Outfit
```

Create outfit + join records.

---

### `PATCH /api/outfits/[outfitId]`

Purpose:

Rename or edit outfit.

Allowed updates:

* name
* notes
* garmentIds
* isFavorite

Requirements:

* only owner can modify
* unauthorized → `401`
* non-owner → `403`
* invalid garments → `400`

---

### `DELETE /api/outfits/[outfitId]`

Purpose:

Delete outfit.

Requirements:

* owner only
* unauthorized → `401`
* non-owner → `403`
* delete join records automatically

---

# Security Rules

Use authenticated Clerk user ID for ownership.

Never trust client-provided ownership values.

Always derive ownership from:

```txt id="g1y9uh"
auth().userId
```

Never accept:

```ts id="2n7af9"
userId
```

from request body.

---

# Authorization Rules

### `401 Unauthorized`

Return when:

* no authenticated Clerk session exists

Example:

```ts id="c8x5ew"
{
  success: false,
  error: "Unauthorized"
}
```

---

### `403 Forbidden`

Return when:

* authenticated user is not owner

Example:

```ts id="tlwltc"
{
  success: false,
  error: "Forbidden"
}
```

---

### `404 Not Found`

Return when:

* garment/outfit does not exist

Example:

```ts id="4mz5x5"
{
  success: false,
  error: "Not found"
}
```

---

## Validation Rules

Validate request body before database operations.

Never trust client input.

Requirements:

* validate string lengths
* validate arrays
* reject malformed IDs
* reject empty garment arrays for outfits
* reject invalid update payloads

Never expose raw Prisma exceptions.

Bad:

```txt id="ckw7t0"
PrismaClientKnownRequestError
```

Good:

```txt id="r1vf6y"
Unable to update outfit.
```

---

## API Response Shape

All APIs must follow project conventions.

Success:

```ts id="q9a6ha"
{
  success: true,
  data: result
}
```

Failure:

```ts id="7pdgji"
{
  success: false,
  error: string
}
```

Response shapes must remain consistent.

---

## Constraints

Do **not**:

* wire frontend UI
* create hooks
* add client-side fetching
* create optimistic UI
* expose raw Prisma errors
* accept ownership from client
* bypass Clerk authentication

Backend routes only.

---

## Check When Done

* routes exist for garments CRUD
* routes exist for outfits CRUD
* ownership checks enforced
* `401` handled correctly
* `403` handled correctly
* `404` handled correctly
* authenticated wardrobe retrieval works
* authenticated outfit retrieval works
* garment ownership validation works
* no raw Prisma errors exposed
* no TypeScript errors
* no lint errors
* `npm run build` passes
