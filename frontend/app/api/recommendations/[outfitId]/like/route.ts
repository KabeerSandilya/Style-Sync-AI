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

    // 3. Upsert feedback or update existing dislike to LIKE
    const existingFeedback = await prisma.recommendationFeedback.findFirst({
      where: { userId, outfitId },
    });

    if (existingFeedback) {
      if (existingFeedback.feedbackType === "LIKE") {
        // Prevent duplicate likes
        return NextResponse.json({ success: true });
      } else {
        // Transition from DISLIKE to LIKE
        await prisma.recommendationFeedback.update({
          where: { id: existingFeedback.id },
          data: { feedbackType: "LIKE" },
        });
      }
    } else {
      // Create new LIKE feedback
      await prisma.recommendationFeedback.create({
        data: {
          userId,
          outfitId,
          feedbackType: "LIKE",
        },
      });
    }

    // Update preferences profile
    await updatePreferenceProfile(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error during like recording:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record like feedback." },
      { status: 500 }
    );
  }
}
