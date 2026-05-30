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

    // 2. Retrieve outfits ordered by newest first, including linked garments
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

    // 3. Verify garment ownership (all selected garments must exist and belong to this user)
    const ownedGarmentsCount = await prisma.garment.count({
      where: {
        id: { in: garmentIds },
        userId,
      },
    });

    if (ownedGarmentsCount !== garmentIds.length) {
      return NextResponse.json(
        { success: false, error: "Invalid garment selection or ownership." },
        { status: 403 }
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
