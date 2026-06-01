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

    // 2. Retrieve wear history ordered by newest first, including outfits and their garments
    const wearHistory = await prisma.outfitWear.findMany({
      where: {
        userId,
      },
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
      orderBy: {
        wornAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: wearHistory,
    });
  } catch (error) {
    console.error("API error during wear history fetch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve wear history." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.outfitWear.deleteMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "All wear history cleared successfully.",
    });
  } catch (error) {
    console.error("API error during wear history clear:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear wear history." },
      { status: 500 }
    );
  }
}
