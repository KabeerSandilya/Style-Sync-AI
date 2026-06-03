import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";

export async function DELETE(
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

    // 2. Verify existence and ownership in a single scoped query
    const wearRecord = await prisma.outfitWear.findFirst({
      where: { id, userId },
    });

    if (!wearRecord) {
      return NextResponse.json(
        { success: false, error: "Wear record not found." },
        { status: 404 }
      );
    }

    // 3. Delete the wear record
    await prisma.outfitWear.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Journal entry removed successfully.",
    });
  } catch (error) {
    // P2025: record already deleted by a concurrent request
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, error: "Wear record not found." },
        { status: 404 }
      );
    }
    console.error("API error during wear record deletion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove journal entry." },
      { status: 500 }
    );
  }
}
