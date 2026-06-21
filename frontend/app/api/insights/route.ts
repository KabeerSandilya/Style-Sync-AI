import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMostWornGarments, getLeastWornGarments, getNeverWornGarments, getMostWornOutfits, prisma } from "@style-sync/backend";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Retrieve aggregated wardrobe insights in parallel
    const [
      mostWornGarments,
      leastWornGarments,
      neverWornGarments,
      mostWornOutfits,
    ] = await Promise.all([
      getMostWornGarments(userId),
      getLeastWornGarments(userId),
      getNeverWornGarments(userId),
      getMostWornOutfits(userId),
    ]);

    // Fetch recently worn outfits mapping them to Outfit objects
    const recentWears = await prisma.outfitWear.findMany({
      where: { userId },
      orderBy: { wornAt: "desc" },
      take: 10,
      include: {
        outfit: {
          include: {
            garments: {
              include: {
                garment: true
              }
            },
            wears: {
              orderBy: { wornAt: "desc" },
              take: 1
            }
          }
        }
      }
    });

    const recentlyWornOutfits: any[] = [];
    const seenOutfitIds = new Set<string>();

    for (const wear of recentWears) {
      if (wear.outfit && !seenOutfitIds.has(wear.outfitId)) {
        seenOutfitIds.add(wear.outfitId);
        
        const outfit = wear.outfit;
        recentlyWornOutfits.push({
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
            }
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        mostWornGarments,
        leastWornGarments,
        neverWornGarments,
        mostWornOutfits,
        recentlyWornOutfits,
      }
    });
  } catch (error) {
    console.error("API error during insights fetch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve wardrobe insights." },
      { status: 500 }
    );
  }
}
