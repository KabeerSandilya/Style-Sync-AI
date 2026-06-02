import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma, classifyGarment, withRetry, isRateLimited } from "@style-sync/backend";

const CLASSIFY_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // 2. Rate limit check
    if (isRateLimited(`${userId}:classify`, CLASSIFY_RATE_LIMIT)) {
      return NextResponse.json(
        { success: false, error: "Too many classification requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // 3. Verify existence and ownership
    const garment = await prisma.garment.findUnique({
      where: { id },
    });

    if (!garment) {
      return NextResponse.json(
        { success: false, error: "Garment not found." },
        { status: 404 }
      );
    }

    if (garment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this garment." },
        { status: 403 }
      );
    }

    // 4. Call classification service
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI Classification service is not configured (missing API key)." },
        { status: 500 }
      );
    }

    const metadata = await withRetry(
      () => classifyGarment(garment.imageUrl),
      `classify garment ${id}`
    );

    // 5. Save metadata to database
    const updatedGarment = await prisma.garment.update({
      where: { id },
      data: {
        category: metadata.category,
        subcategory: metadata.subcategory,
        primaryColor: metadata.primaryColor,
        secondaryColor: metadata.secondaryColor,
        season: metadata.season,
        style: metadata.style,
        material: metadata.material,
        confidence: metadata.confidence,
        isProcessed: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedGarment,
    });
  } catch (error) {
    console.error("API error during manual garment classification:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to classify garment." },
      { status: 500 }
    );
  }
}
