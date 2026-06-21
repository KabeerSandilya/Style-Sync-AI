import { prisma } from "../../lib/prisma";

/**
 * Retrieves the recent wear history records for the user.
 */
export async function getRecentWears(userId: string, limit?: number) {
  return prisma.outfitWear.findMany({
    where: { userId },
    orderBy: { wornAt: "desc" },
    take: limit,
    include: {
      outfit: {
        include: {
          garments: {
            include: {
              garment: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Counts total wears for the user, or wears for a specific outfit.
 */
export async function countWears(userId: string, outfitId?: string) {
  if (outfitId) {
    return prisma.outfitWear.count({
      where: { userId, outfitId },
    });
  }
  return prisma.outfitWear.count({
    where: { userId },
  });
}

/**
 * Finds the last worn date for a specific outfit.
 */
export async function findLastWornDate(outfitId: string) {
  const lastWear = await prisma.outfitWear.findFirst({
    where: { outfitId },
    orderBy: { wornAt: "desc" },
    select: { wornAt: true },
  });
  return lastWear ? lastWear.wornAt : null;
}
