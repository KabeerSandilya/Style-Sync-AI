# Redis-backed Cache & Rate Limiting (F7)

We are implementing **Redis-backed Cache & Rate Limiting** for **StyleSync AI**.

This feature replaces in-memory `Map`-based caches and rate-limit counters with
Upstash Redis, making them correct across serverless function instances. It is
the first Sprint 1 infrastructure task and unblocks all Phase 3 features that
depend on reliable rate limiting (F1 Style DNA) and cached computations (F2 Capsule Audit).

Follow:

* `architecture.md`
* `code-standards.md`

---

# Problem Being Solved

Two module-level `Map` objects currently act as shared state:

1. `backend/src/lib/rate-limit.ts` — a fixed-window counter keyed by
   `userId:endpoint`. Resets silently when a new serverless instance cold-starts.
2. `backend/src/services/weather/index.ts` — a 15-minute TTL cache keyed by
   city or lat/lon. Every new instance fetches fresh, burning the OpenWeather
   quota unnecessarily.

Both break under concurrent serverless instances because each instance has its
own memory. A user hitting two instances in the same window can exceed the rate
limit undetected, or trigger redundant weather API calls.

Redis replaces both with a single, shared, durable store.

---

# Scope

Build:

### Redis client singleton (`lib/redis.ts`)
### Sliding-window rate limiter backed by Upstash Redis
### Weather cache backed by Redis with 15-min TTL
### Style DNA generation cache backed by Redis with 24-hour TTL (F1 prep)
### Capsule Audit result cache backed by Redis with 6-hour TTL (F2 prep)

Do **not** build:

* A custom Redis abstraction layer — use `@upstash/redis` and `@upstash/ratelimit` directly
* BullMQ or any queue integration (that is F6)
* Per-route middleware — callers invoke `isRateLimited()` exactly as today
* Dashboard or metrics UI for cache hits/misses
* Cache invalidation webhooks

---

# New Dependencies

```txt
@upstash/redis
@upstash/ratelimit
```

Install in `backend/`:

```bash
npm install @upstash/redis @upstash/ratelimit
```

---

# New Environment Variables

```txt
UPSTASH_REDIS_REST_URL     # e.g. https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN   # Upstash REST token
```

Add both to `.env.example` and `.env.local`. The app must start without them
(fall back to in-memory behavior) — do not crash on missing vars.

---

# Redis Client Singleton

Create `backend/src/lib/redis.ts`:

```ts
import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}
```

`getRedis()` returns `null` when env vars are absent. Every caller must handle
the `null` case by falling back to the existing in-memory behavior — no hard
crashes in local dev without Redis configured.

---

# Rate Limiter

## Current Implementation

`backend/src/lib/rate-limit.ts` — fixed-window counter using a module-level
`Map<string, { count: number; windowStart: number }>`. Callers invoke:

```ts
isRateLimited(key: string, options: RateLimitOptions): boolean
```

## New Implementation

Replace the `Map` store with Upstash sliding-window rate limiting. Keep the
same `isRateLimited` export so no call sites change.

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from './redis'

export interface RateLimitOptions {
  limit: number
  windowMs: number
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(options: RateLimitOptions): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  const key = `${options.limit}:${options.windowMs}`
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs}ms`),
        prefix: 'stylesync:rl',
      })
    )
  }
  return limiters.get(key)!
}

// Fallback in-memory store (used when Redis is unavailable)
interface RateLimitEntry { count: number; windowStart: number }
const store = new Map<string, RateLimitEntry>()

export async function isRateLimited(key: string, options: RateLimitOptions): Promise<boolean> {
  const limiter = getLimiter(options)

  if (limiter) {
    const { success } = await limiter.limit(key)
    return !success
  }

  // In-memory fallback
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now - entry.windowStart >= options.windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= options.limit) return true
  entry.count += 1
  return false
}
```

`isRateLimited` becomes `async`. Update all callers with `await`.

### Call sites to update

```txt
frontend/app/api/outfits/generate/route.ts
frontend/app/api/garments/[id]/classify/route.ts
frontend/app/api/garments/[id]/remove-background/route.ts
frontend/app/api/upload/route.ts
```

In each file, change:

```ts
if (isRateLimited(...)) { ... }
```

to:

```ts
if (await isRateLimited(...)) { ... }
```

---

# Weather Cache

## Current Implementation

`backend/src/services/weather/index.ts` — module-level:

```ts
const weatherCache = new Map<string, CacheEntry>()
```

Cache key: `city:${city.toLowerCase()}` or `coords:${lat},${lon}`.

## New Implementation

Replace the `Map` with Redis `SET`/`GET` with a 15-minute TTL. Preserve the
existing `fetchWeather` signature — no call sites change.

```ts
import { getRedis } from '../../lib/redis'

const CACHE_TTL_SECONDS = 15 * 60
const REDIS_KEY_PREFIX = 'stylesync:weather'

// In-memory fallback (used when Redis unavailable)
const localCache = new Map<string, CacheEntry>()
```

Inside `fetchWeather`, replace the two `weatherCache.get` / `weatherCache.set`
calls:

**Read from cache:**
```ts
const redis = getRedis()
if (redis) {
  const cached = await redis.get<WeatherContext>(`${REDIS_KEY_PREFIX}:${cacheKey}`)
  if (cached) return cached
} else {
  const entry = localCache.get(cacheKey)
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) return entry.data
}
```

**Write to cache (the inner `cache()` helper):**
```ts
const cache = async (data: WeatherContext): Promise<WeatherContext> => {
  const redis = getRedis()
  if (redis) {
    await redis.set(`${REDIS_KEY_PREFIX}:${cacheKey}`, data, { ex: CACHE_TTL_SECONDS })
  } else {
    localCache.set(cacheKey, { data, cachedAt: Date.now() })
  }
  return data
}
```

Make `fetchWeather` `async` (it already is). All internal `cache()` calls
become `await cache(...)`.

---

# Style DNA Cache (F1 preparation)

Create `backend/src/lib/cache/style-dna.ts`:

```ts
import { getRedis } from '../redis'

const TTL_SECONDS = 24 * 60 * 60 // 24 hours
const PREFIX = 'stylesync:style-dna'

export async function getCachedStyleDNA(userId: string): Promise<unknown | null> {
  const redis = getRedis()
  if (!redis) return null
  return redis.get(`${PREFIX}:${userId}`)
}

export async function setCachedStyleDNA(userId: string, data: unknown): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(`${PREFIX}:${userId}`, data, { ex: TTL_SECONDS })
}

export async function invalidateStyleDNACache(userId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.del(`${PREFIX}:${userId}`)
}
```

F1 will call these helpers — do not wire them up to any route yet.

---

# Capsule Audit Cache (F2 preparation)

Create `backend/src/lib/cache/capsule-audit.ts`:

```ts
import { getRedis } from '../redis'

const TTL_SECONDS = 6 * 60 * 60 // 6 hours
const PREFIX = 'stylesync:capsule-audit'

export async function getCachedCapsuleAudit(userId: string): Promise<unknown | null> {
  const redis = getRedis()
  if (!redis) return null
  return redis.get(`${PREFIX}:${userId}`)
}

export async function setCachedCapsuleAudit(userId: string, data: unknown): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(`${PREFIX}:${userId}`, data, { ex: TTL_SECONDS })
}

export async function invalidateCapsuleAuditCache(userId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.del(`${PREFIX}:${userId}`)
}
```

F2 will call these helpers — do not wire them up to any route yet.

---

# Redis Key Namespace

All keys use the `stylesync:` prefix to avoid collisions in a shared Redis
instance:

| Prefix | TTL | Used by |
|--------|-----|---------|
| `stylesync:rl:*` | Rolling window | Rate limiter |
| `stylesync:weather:*` | 15 min | Weather cache |
| `stylesync:style-dna:*` | 24 h | F1 Style DNA |
| `stylesync:capsule-audit:*` | 6 h | F2 Capsule Audit |

---

# Database Changes

None.

---

# Files to Create

```txt
backend/src/lib/redis.ts
backend/src/lib/cache/style-dna.ts
backend/src/lib/cache/capsule-audit.ts
```

---

# Files to Modify

```txt
backend/src/lib/rate-limit.ts
  — replace Map store with Upstash sliding-window
  — keep isRateLimited() signature; make it async

backend/src/services/weather/index.ts
  — replace weatherCache Map with Redis GET/SET
  — in-memory Map stays as fallback when Redis is unavailable

frontend/app/api/outfits/generate/route.ts
frontend/app/api/garments/[id]/classify/route.ts
frontend/app/api/garments/[id]/remove-background/route.ts
frontend/app/api/upload/route.ts
  — add await to each isRateLimited() call

.env.example
  — add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN entries
```

---

# Constraints

Do **not**:

* Crash the app when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are
  missing — fall back to in-memory silently
* Change the external signature of `fetchWeather()` — only internals change
* Change the external signature of `isRateLimited()` beyond adding `async`
* Add Redis calls anywhere outside the files listed above
* Use `ioredis` or any non-Upstash Redis client

---

# Check When Done

* `@upstash/redis` and `@upstash/ratelimit` are in `backend/package.json`
* `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` documented in `.env.example`
* `backend/src/lib/redis.ts` exists; `getRedis()` returns `null` when env vars absent
* `isRateLimited()` is `async`; all four call sites updated with `await`
* `isRateLimited()` falls back to in-memory `Map` when `getRedis()` returns `null`
* Weather cache reads from Redis first; writes to Redis with 15-min TTL
* Weather cache falls back to in-memory `Map` when Redis unavailable
* `backend/src/lib/cache/style-dna.ts` and `capsule-audit.ts` created (not yet wired to routes)
* All Redis keys use the `stylesync:` namespace prefix
* `npm run build` passes
* `npm test` passes
* No TypeScript errors
* No lint errors
* App starts and works correctly without Redis env vars set (local dev)
