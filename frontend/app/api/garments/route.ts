import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

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

    try {
      fs.appendFileSync(
        path.join(process.cwd(), "api_debug.log"),
        `${new Date().toISOString()} - GET /api/garments - fetched ${garments.length} garments for userId: ${userId}\n`
      );
    } catch (e) {}

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
    try {
      fs.appendFileSync(
        path.join(process.cwd(), "api_debug.log"),
        `${new Date().toISOString()} - GET /api/garments ERROR: ${error instanceof Error ? error.stack || error.message : String(error)}\n`
      );
    } catch (e) {}
    return NextResponse.json(
      { success: false, error: "Failed to retrieve wardrobe items." },
      { status: 500 }
    );
  }
}
