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

    // 2. Fetch the wear record to verify existence and ownership
    const wearRecord = await prisma.outfitWear.findUnique({
      where: { id },
    });

    if (!wearRecord) {
      return NextResponse.json(
        { success: false, error: "Wear record not found." },
        { status: 404 }
      );
    }

    if (wearRecord.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
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
    console.error("API error during wear record deletion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove journal entry." },
      { status: 500 }
    );
  }
}
