import { prisma } from "@/lib/prisma";
import { Garment } from "@/types";

export async function getNeverWornGarments(userId: string, limit: number = 10): Promise<Garment[]> {
  // A garment is never worn if none of the outfits containing it have any wears (or it's not in any outfits)
  const garments = await prisma.garment.findMany({
    where: {
      userId,
      outfitItems: {
        none: {
          outfit: {
            wears: {
              some: {}
            }
          }
        }
      }
    },
    take: limit,
    orderBy: {
      createdAt: "desc"
    }
  });

  return garments.map(g => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    bgRemovedAt: g.bgRemovedAt?.toISOString() ?? null,
    lastWornAt: null
  }));
}
