interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Max requests allowed per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Returns true if the request should be blocked (limit exceeded).
 * Key is typically `userId:endpoint`.
 */
export function isRateLimited(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= options.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= options.limit) {
    return true;
  }

  entry.count += 1;
  return false;
}
