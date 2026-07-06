import { getRedis } from '../redis'

const TTL_SECONDS = 24 * 60 * 60 // 24 hours
const PREFIX = 'stylesync:style-dna'

export async function getCachedStyleDNA(userId: string): Promise<unknown | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    return await redis.get(`${PREFIX}:${userId}`)
  } catch {
    return null
  }
}

export async function setCachedStyleDNA(userId: string, data: unknown): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(`${PREFIX}:${userId}`, data, { ex: TTL_SECONDS })
  } catch {
    // cache is best-effort
  }
}

export async function invalidateStyleDNACache(userId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(`${PREFIX}:${userId}`)
  } catch {
    // cache is best-effort
  }
}
