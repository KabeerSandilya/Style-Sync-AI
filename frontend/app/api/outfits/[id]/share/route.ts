import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { randomUUID } from "crypto";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: outfitId } = await params;

    const outfit = await prisma.outfit.findFirst({
      where: { id: outfitId, userId },
      select: { id: true, shareToken: true },
    });

    if (!outfit) {
      return NextResponse.json({ success: false, error: "Outfit not found." }, { status: 404 });
    }

    const token = outfit.shareToken ?? randomUUID();

    if (!outfit.shareToken) {
      await prisma.outfit.update({
        where: { id: outfitId },
        data: { shareToken: token },
      });
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/share/${token}`;
    return NextResponse.json({ success: true, data: { url, token } });
  } catch (error) {
    console.error("Share POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate share link." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: outfitId } = await params;

    const outfit = await prisma.outfit.findFirst({
      where: { id: outfitId, userId },
      select: { id: true },
    });

    if (!outfit) {
      return NextResponse.json({ success: false, error: "Outfit not found." }, { status: 404 });
    }

    await prisma.outfit.update({
      where: { id: outfitId },
      data: { shareToken: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to revoke share link." }, { status: 500 });
  }
}
