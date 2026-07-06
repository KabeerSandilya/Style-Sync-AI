import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cloudinary, prisma } from "@style-sync/backend";
import { UpdateLookBookEntrySchema, zodError } from "@/lib/schemas";

function extractCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const entry = await prisma.lookBookEntry.findFirst({
      where: { id, userId },
      include: {
        outfit: { include: { garments: { include: { garment: true } } } },
      },
    });

    if (!entry) {
      return NextResponse.json({ success: false, error: "Journal entry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error("API error during lookbook entry GET:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load journal entry." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = UpdateLookBookEntrySchema.safeParse(await req.json());
    if (!result.success) return zodError(result.error);
    const { outfitId, date, rating, mood, notes, isShareable } = result.data;

    const entry = await prisma.lookBookEntry.findFirst({ where: { id, userId } });
    if (!entry) {
      return NextResponse.json({ success: false, error: "Journal entry not found." }, { status: 404 });
    }

    if (outfitId) {
      const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId } });
      if (!outfit) {
        return NextResponse.json({ success: false, error: "Outfit not found." }, { status: 404 });
      }
    }

    const dataToUpdate: {
      outfitId?: string | null;
      date?: Date;
      rating?: number;
      mood?: string[];
      notes?: string | null;
      isShareable?: boolean;
    } = {};

    if (outfitId !== undefined) dataToUpdate.outfitId = outfitId;
    if (date !== undefined) dataToUpdate.date = new Date(date);
    if (rating !== undefined) dataToUpdate.rating = rating;
    if (mood !== undefined) dataToUpdate.mood = mood;
    if (notes !== undefined) dataToUpdate.notes = notes ? notes.trim() : null;
    if (isShareable !== undefined) dataToUpdate.isShareable = isShareable;

    const updatedEntry = await prisma.lookBookEntry.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updatedEntry });
  } catch (error) {
    console.error("API error during lookbook entry PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update journal entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const entry = await prisma.lookBookEntry.findFirst({ where: { id, userId } });
    if (!entry) {
      return NextResponse.json({ success: false, error: "Journal entry not found." }, { status: 404 });
    }

    if (entry.photoUrl.startsWith("https://res.cloudinary.com/")) {
      const publicId = extractCloudinaryPublicId(entry.photoUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (err) {
          console.warn(`Failed to delete Cloudinary asset for lookbook entry ${id}:`, err);
        }
      }
    }

    await prisma.lookBookEntry.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Journal entry deleted successfully." });
  } catch (error) {
    console.error("API error during lookbook entry DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete journal entry." },
      { status: 500 }
    );
  }
}
