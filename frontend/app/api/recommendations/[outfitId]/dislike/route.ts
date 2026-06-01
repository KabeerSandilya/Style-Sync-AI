import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePreferenceProfile } from "@/services/preferences/update-profile";

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

    // 3. Upsert feedback or update existing like to DISLIKE
    const existingFeedback = await prisma.recommendationFeedback.findFirst({
      where: { userId, outfitId },
    });

    if (existingFeedback) {
      if (existingFeedback.feedbackType === "DISLIKE") {
        // Prevent duplicate dislikes
        return NextResponse.json({ success: true });
      } else {
        // Transition from LIKE to DISLIKE
        await prisma.recommendationFeedback.update({
          where: { id: existingFeedback.id },
          data: { feedbackType: "DISLIKE" },
        });
      }
    } else {
      // Create new DISLIKE feedback
      await prisma.recommendationFeedback.create({
        data: {
          userId,
          outfitId,
          feedbackType: "DISLIKE",
        },
      });
    }

    // Update preferences profile
    await updatePreferenceProfile(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error during dislike recording:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record dislike feedback." },
      { status: 500 }
    );
  }
}
