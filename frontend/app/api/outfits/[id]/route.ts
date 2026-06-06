import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma, isRateLimited, OCCASIONS } from "@style-sync/backend";

const FAVORITE_RATE_LIMIT = { limit: 20, windowMs: 60_000 };

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

    const { id: outfitId } = await params;
    const body = await req.json();

    // 2. Verify outfit existence and ownership
    const existingOutfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId,
      },
    });

    if (!existingOutfit) {
      return NextResponse.json(
        { success: false, error: "Outfit not found." },
        { status: 404 }
      );
    }

    const dataToUpdate: {
      name?: string;
      notes?: string | null;
      isFavorite?: boolean;
      occasion?: string | null;
    } = {};

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      dataToUpdate.name = trimmedName === "" ? "Untitled Outfit" : trimmedName.substring(0, 100);
    }

    if (body.notes !== undefined) {
      dataToUpdate.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : null;
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

    if (body.occasion !== undefined) {
      if (body.occasion !== null && !OCCASIONS.includes(body.occasion)) {
        return NextResponse.json(
          { success: false, error: "Invalid occasion value." },
          { status: 400 }
        );
      }
      dataToUpdate.occasion = body.occasion;
    }

    // 3. Verify and handle garment updates if garmentIds is provided
    if (body.garmentIds !== undefined) {
      if (!Array.isArray(body.garmentIds) || body.garmentIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Please select at least one garment." },
          { status: 400 }
        );
      }

      // Verify that all new garments belong to this user
      const ownedGarments = await prisma.garment.findMany({
        where: {
          id: { in: body.garmentIds },
          userId,
        },
      });

      if (ownedGarments.length !== body.garmentIds.length) {
        return NextResponse.json(
          { success: false, error: "Invalid garment selection or ownership." },
          { status: 403 }
        );
      }

      // Enforce wardrobe rules: max 1 footwear, max 1 lower body garment
      const footwearCount = ownedGarments.filter((g) => {
        const cat = g.category.toLowerCase();
        return cat.includes("foot") || cat === "footwear";
      }).length;

      if (footwearCount > 1) {
        return NextResponse.json(
          { success: false, error: "An outfit can only include at most one footwear garment." },
          { status: 400 }
        );
      }

      const lowerCount = ownedGarments.filter((g) => {
        const cat = g.category.toLowerCase();
        return cat.includes("bottom") || cat === "lower" || cat === "bottomwear" || cat === "bottoms";
      }).length;

      if (lowerCount > 1) {
        return NextResponse.json(
          { success: false, error: "An outfit can only include at most one lower body garment (bottomwear)." },
          { status: 400 }
        );
      }

      // Update name, notes, favorite, and replace all garment mappings inside a transaction
      await prisma.$transaction([
        prisma.outfitGarment.deleteMany({
          where: { outfitId },
        }),
        prisma.outfit.update({
          where: { id: outfitId },
          data: {
            ...dataToUpdate,
            garments: {
              create: body.garmentIds.map((garmentId: string) => ({
                garmentId,
              })),
            },
          },
        }),
      ]);
    } else if (Object.keys(dataToUpdate).length > 0) {
      // Just update basic fields
      await prisma.outfit.update({
        where: { id: outfitId },
        data: dataToUpdate,
      });
    } else {
      // Nothing to do — reject empty payloads
      return NextResponse.json(
        { success: false, error: "No fields to update." },
        { status: 400 }
      );
    }

    // 4. Retrieve and return the updated outfit including updated garments (scoped by userId)
    const updatedOutfit = await prisma.outfit.findFirst({
      where: { id: outfitId, userId },
      include: {
        garments: {
          include: {
            garment: true,
          },
        },
      },
    });

    if (body.isFavorite !== undefined) {
      if (isRateLimited(`${userId}:outfit-favorite`, FAVORITE_RATE_LIMIT)) {
        return NextResponse.json({ success: true, data: updatedOutfit });
      }
      const { updatePreferenceProfile } = await import("@style-sync/backend");
      await updatePreferenceProfile(userId);
    }

    return NextResponse.json({
      success: true,
      data: updatedOutfit,
    });
  } catch (error) {
    console.error("API error during outfit PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update outfit." },
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

    const { id: outfitId } = await params;

    // 2. Verify ownership
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId,
      },
    });

    if (!outfit) {
      return NextResponse.json(
        { success: false, error: "Outfit not found." },
        { status: 404 }
      );
    }

    // 3. Delete the outfit (OutfitGarment links delete automatically via Cascade)
    await prisma.outfit.delete({
      where: {
        id: outfitId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Outfit deleted successfully.",
    });
  } catch (error) {
    console.error("API error during outfit DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete outfit." },
      { status: 500 }
    );
  }
}
