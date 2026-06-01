import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "Topwear",
  "Bottomwear",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Formalwear",
  "Sportswear",
  "Ethnicwear",
  "Uncategorized",
];

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
    const body = await req.json();

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

    // 3. Validate fields
    const dataToUpdate: {
      name?: string;
      category?: string;
      notes?: string | null;
      tags?: string[];
      isFavorite?: boolean;
    } = {};

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      dataToUpdate.name = trimmedName === "" ? "Untitled Garment" : trimmedName.substring(0, 100);
    }

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
          { status: 400 }
        );
      }
      dataToUpdate.category = body.category;
    }

    if (body.notes !== undefined) {
      dataToUpdate.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : null;
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json(
          { success: false, error: "Tags must be an array of strings." },
          { status: 400 }
        );
      }
      dataToUpdate.tags = body.tags
        .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
        .filter((t: string) => t.length > 0);
    }

    if (body.isFavorite !== undefined) {
      if (typeof body.isFavorite !== "boolean") {
        return NextResponse.json(
          { success: false, error: "isFavorite must be a boolean." },
          { status: 400 }
        );
      }
      dataToUpdate.isFavorite = body.isFavorite;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update." },
        { status: 400 }
      );
    }

    // 4. Update the garment
    const updatedGarment = await prisma.garment.update({
      where: {
        id,
      },
      data: dataToUpdate,
    });

    if (body.isFavorite !== undefined) {
      const { updatePreferenceProfile } = await import("@/services/preferences/update-profile");
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
