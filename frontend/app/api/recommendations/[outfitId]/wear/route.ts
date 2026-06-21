import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma, updatePreferenceProfile } from "@style-sync/backend";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ outfitId: string }> }
) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { outfitId } = await params;

    // 2. Verify outfit ownership and existence
    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId },
    });

    if (!outfit) {
      return NextResponse.json(
        { success: false, error: "Outfit not found" },
        { status: 404 }
      );
    }

    if (outfit.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3. Prevent duplicate wear recordings on the same day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const existingWearToday = await prisma.outfitWear.findFirst({
      where: {
        userId,
        outfitId,
        wornAt: {
          gte: startOfToday,
        },
      },
    });

    if (existingWearToday) {
      return NextResponse.json(
        { success: false, error: "This outfit has already been worn today." },
        { status: 400 }
      );
    }

    // 4. Record the wear history
    await prisma.outfitWear.create({
      data: {
        userId,
        outfitId,
      },
    });

    // 5. Update user preference profile
    await updatePreferenceProfile(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error during wear recording:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record wear history." },
      { status: 500 }
    );
  }
}
