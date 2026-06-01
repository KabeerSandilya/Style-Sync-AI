import { prisma } from "@/lib/prisma";
import { OutfitWithStats } from "./types";

export async function getMostWornOutfits(userId: string, limit: number = 10): Promise<OutfitWithStats[]> {
  const outfits = await prisma.outfit.findMany({
    where: {
      userId,
      wears: {
        some: {}
      }
    },
    include: {
      wears: {
        orderBy: {
          wornAt: "desc"
        }
      },
      garments: {
        include: {
          garment: true
        }
      }
    }
  });

  const outfitsWithStats = outfits.map((outfit) => {
    const wearCount = outfit.wears.length;
    return {
      ...outfit,
      createdAt: outfit.createdAt.toISOString(),
      updatedAt: outfit.updatedAt.toISOString(),
      wears: outfit.wears.map(w => ({
        ...w,
        wornAt: w.wornAt.toISOString()
      })),
      garments: outfit.garments.map(g => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
        garment: {
          ...g.garment,
          createdAt: g.garment.createdAt.toISOString(),
          updatedAt: g.garment.updatedAt.toISOString(),
          bgRemovedAt: g.garment.bgRemovedAt?.toISOString() ?? null,
        }
      })),
      wearCount,
    };
  });

  // Sort by wearCount descending, then by last worn date descending
  outfitsWithStats.sort((a, b) => {
    if (b.wearCount !== a.wearCount) {
      return b.wearCount - a.wearCount;
    }
    const dateA = a.wears[0] ? new Date(a.wears[0].wornAt).getTime() : 0;
    const dateB = b.wears[0] ? new Date(b.wears[0].wornAt).getTime() : 0;
    return dateB - dateA;
  });

  return outfitsWithStats.slice(0, limit);
}
