import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from './redis'

export interface RateLimitOptions {
  /** Max requests allowed per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
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
        limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs} ms`),
        prefix: 'stylesync:rl',
      })
    )
  }
  return limiters.get(key)!
}

// In-memory fallback store (used when Redis is unavailable)
interface RateLimitEntry { count: number; windowStart: number }
const store = new Map<string, RateLimitEntry>()

/**
 * Returns true if the request should be blocked (limit exceeded).
 * Key is typically `userId:endpoint`.
 */
export async function isRateLimited(key: string, options: RateLimitOptions): Promise<boolean> {
  const limiter = getLimiter(options)

  if (limiter) {
    try {
      const { success } = await limiter.limit(key)
      return !success
    } catch (err) {
      console.warn('[rate-limit] Redis limiter failed, falling back to in-memory:', (err as Error)?.message)
    }
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
