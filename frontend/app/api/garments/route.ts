import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse search parameters for future/current filtering compatibility
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");

    // 3. Build query conditions
    const where: Prisma.GarmentWhereInput = {
      userId,
    };

    if (category && category !== "all") {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    // 4. Retrieve garments ordered by newest first, including outfit wears to compute lastWornAt
    const garments = await prisma.garment.findMany({
      where,
      include: {
        outfitItems: {
          select: {
            outfit: {
              select: {
                wears: {
                  orderBy: { wornAt: "desc" },
                  take: 1,
                  select: { wornAt: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const garmentsWithLastWorn = garments.map((garment) => {
      let lastWornAt: Date | null = null;
      for (const item of garment.outfitItems) {
        const wear = item.outfit.wears[0];
        if (wear) {
          if (!lastWornAt || wear.wornAt > lastWornAt) {
            lastWornAt = wear.wornAt;
          }
        }
      }
      
      const { outfitItems, ...rest } = garment;
      return {
        ...rest,
        lastWornAt: lastWornAt ? lastWornAt.toISOString() : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: garmentsWithLastWorn,
    });
  } catch (error) {
    console.error("API error during garments fetch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve wardrobe items." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { imageUrl, notes } = body;

    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return NextResponse.json(
        { success: false, error: "Notes must be a string" },
        { status: 400 }
      );
    }

    // 3. Create the garment
    const garment = await prisma.garment.create({
      data: {
        userId,
        imageUrl,
        name: "New Garment",
        category: "Uncategorized",
        notes: notes || null,
        tags: [],
        isProcessed: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: garment,
    });
  } catch (error) {
    console.error("API error during garment creation:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create garment." },
      { status: 500 }
    );
  }
}

