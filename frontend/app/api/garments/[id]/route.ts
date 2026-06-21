import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { UpdateGarmentSchema, zodError } from "@/lib/schemas";

export async function PATCH(
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

    // 2. Validate request body
    const result = UpdateGarmentSchema.safeParse(await req.json());
    if (!result.success) return zodError(result.error);
    const { name, category, isFavorite, notes, tags } = result.data;

    // 3. Verify ownership
    const garment = await prisma.garment.findFirst({
      where: { id, userId },
    });

    if (!garment) {
      return NextResponse.json(
        { success: false, error: "Garment not found." },
        { status: 404 }
      );
    }

    // 4. Build update payload
    const dataToUpdate: {
      name?: string;
      category?: string;
      notes?: string | null;
      tags?: string[];
      isFavorite?: boolean;
    } = {};

    if (name !== undefined) dataToUpdate.name = name.trim() || "Untitled Garment";
    if (category !== undefined) dataToUpdate.category = category;
    if (notes !== undefined) dataToUpdate.notes = notes ? notes.trim() : null;
    if (tags !== undefined) dataToUpdate.tags = tags.map((t) => t.trim()).filter(Boolean);
    if (isFavorite !== undefined) dataToUpdate.isFavorite = isFavorite;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update." },
        { status: 400 }
      );
    }

    // 5. Update the garment
    const updatedGarment = await prisma.garment.update({
      where: { id },
      data: dataToUpdate,
    });

    if (isFavorite !== undefined) {
      const { updatePreferenceProfile } = await import("@style-sync/backend");
      await updatePreferenceProfile(userId);
    }

    return NextResponse.json({
      success: true,
      data: updatedGarment,
    });
  } catch (error) {
    console.error("API error during garment PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update garment." },
      { status: 500 }
    );
  }
}

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

    // 2. Verify ownership
    const garment = await prisma.garment.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!garment) {
      return NextResponse.json(
        { success: false, error: "Garment not found." },
        { status: 404 }
      );
    }

    // 3. Delete the garment
    await prisma.garment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Garment deleted successfully.",
    });
  } catch (error) {
    console.error("API error during garment DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete garment." },
      { status: 500 }
    );
  }
}
