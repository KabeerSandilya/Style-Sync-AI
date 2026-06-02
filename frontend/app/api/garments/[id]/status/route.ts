import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const garment = await prisma.garment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        processedImageUrl: true,
        bgRemovedAt: true,
        isProcessed: true,
        primaryColor: true,
        subcategory: true,
        style: true,
        material: true,
        season: true,
        category: true,
      },
    });

    if (!garment) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    if (garment.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: garment.id,
        processedImageUrl: garment.processedImageUrl,
        bgRemovedAt: garment.bgRemovedAt,
        isProcessed: garment.isProcessed,
        primaryColor: garment.primaryColor,
        subcategory: garment.subcategory,
        style: garment.style,
        material: garment.material,
        season: garment.season,
        category: garment.category,
      },
    });
  } catch (error) {
    console.error("Error fetching garment status:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch status." }, { status: 500 });
  }
}
