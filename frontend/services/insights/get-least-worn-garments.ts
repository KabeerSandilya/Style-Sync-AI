import { prisma } from "@/lib/prisma";
import { GarmentWithStats } from "./types";

export async function getLeastWornGarments(userId: string, limit: number = 10): Promise<GarmentWithStats[]> {
  // Fetch garments for the user that have been worn at least once
  const garments = await prisma.garment.findMany({
    where: {
      userId,
      outfitItems: {
        some: {
          outfit: {
            wears: {
              some: {}
            }
          }
        }
      }
    },
    include: {
      outfitItems: {
        select: {
          outfit: {
            select: {
              wears: {
                select: {
                  wornAt: true
                }
              }
            }
          }
        }
      }
    }
  });

  const garmentsWithStats = garments.map((garment) => {
    let wearCount = 0;
    let lastWornAt: Date | null = null;

    for (const item of garment.outfitItems) {
      const wears = item.outfit.wears;
      wearCount += wears.length;
      for (const wear of wears) {
        if (!lastWornAt || wear.wornAt > lastWornAt) {
          lastWornAt = wear.wornAt;
        }
      }
    }

    const { outfitItems, ...rest } = garment;
    return {
      ...rest,
      createdAt: garment.createdAt.toISOString(),
      updatedAt: garment.updatedAt.toISOString(),
      bgRemovedAt: garment.bgRemovedAt?.toISOString() ?? null,
      wearCount,
      lastWornAt: lastWornAt ? lastWornAt.toISOString() : null,
    };
  });

  // Sort by wearCount ascending, then by lastWornAt descending (more recently worn but still rarely worn)
  garmentsWithStats.sort((a, b) => {
    if (a.wearCount !== b.wearCount) {
      return a.wearCount - b.wearCount;
    }
    const timeA = a.lastWornAt ? new Date(a.lastWornAt).getTime() : 0;
    const timeB = b.lastWornAt ? new Date(b.lastWornAt).getTime() : 0;
    return timeB - timeA;
  });

  return garmentsWithStats.slice(0, limit);
}
