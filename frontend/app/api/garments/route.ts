import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // 4. Retrieve garments ordered by newest first
    const garments = await prisma.garment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: garments,
    });
  } catch (error) {
    console.error("API error during garments fetch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve wardrobe items." },
      { status: 500 }
    );
  }
}
