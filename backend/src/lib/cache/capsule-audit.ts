import { getRedis } from '../redis'

const TTL_SECONDS = 6 * 60 * 60 // 6 hours
const PREFIX = 'stylesync:capsule-audit'

export async function getCachedCapsuleAudit(userId: string): Promise<unknown | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    return await redis.get(`${PREFIX}:${userId}`)
  } catch {
    return null
  }
}

export async function setCachedCapsuleAudit(userId: string, data: unknown): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(`${PREFIX}:${userId}`, data, { ex: TTL_SECONDS })
  } catch {
    // cache is best-effort
  }
}

export async function invalidateCapsuleAuditCache(userId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(`${PREFIX}:${userId}`)
  } catch {
    // cache is best-effort
  }
}
