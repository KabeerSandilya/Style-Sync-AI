import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Retrieve outfits ordered by newest first, including linked garments and most recent wear
    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
      },
      include: {
        garments: {
          include: {
            garment: true,
          },
        },
        wears: {
          orderBy: {
            wornAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: outfits,
    });
  } catch (error) {
    console.error("API error during outfits fetch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve saved outfits." },
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

    const body = await req.json();
    const { name, notes, garmentIds } = body;

    // 2. Validate input
    if (!garmentIds || !Array.isArray(garmentIds) || garmentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one garment." },
        { status: 400 }
      );
    }

    // 3. Verify garment ownership and retrieve details for category checks
    const ownedGarments = await prisma.garment.findMany({
      where: {
        id: { in: garmentIds },
        userId,
      },
    });

    if (ownedGarments.length !== garmentIds.length) {
      return NextResponse.json(
        { success: false, error: "Invalid garment selection or ownership." },
        { status: 403 }
      );
    }

    // Enforce wardrobe rules: max 1 footwear, max 1 lower body garment
    const footwearCount = ownedGarments.filter((g) => {
      const cat = g.category.toLowerCase();
      return cat.includes("foot") || cat === "footwear";
    }).length;

    if (footwearCount > 1) {
      return NextResponse.json(
        { success: false, error: "An outfit can only include at most one footwear garment." },
        { status: 400 }
      );
    }

    const lowerCount = ownedGarments.filter((g) => {
      const cat = g.category.toLowerCase();
      return cat.includes("bottom") || cat === "lower" || cat === "bottomwear" || cat === "bottoms";
    }).length;

    if (lowerCount > 1) {
      return NextResponse.json(
        { success: false, error: "An outfit can only include at most one lower body garment (bottomwear)." },
        { status: 400 }
      );
    }

    const outfitName = name && name.trim() !== "" ? name.trim().substring(0, 100) : "Untitled Outfit";
    const outfitNotes = notes && typeof notes === "string" ? notes.trim().substring(0, 500) : null;

    // 4. Create outfit and join records
    const outfit = await prisma.outfit.create({
      data: {
        userId,
        name: outfitName,
        notes: outfitNotes,
        garments: {
          create: garmentIds.map((garmentId) => ({
            garmentId,
          })),
        },
      },
      include: {
        garments: {
          include: {
            garment: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: outfit,
    });
  } catch (error) {
    console.error("API error during outfit creation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create outfit." },
      { status: 500 }
    );
  }
}
