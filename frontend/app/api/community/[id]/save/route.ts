import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.communityPost.findFirst({ where: { id, isHidden: false } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }

    const existing = await prisma.inspirationSave.findUnique({
      where: { userId_postId: { userId, postId: id } },
    });

    if (existing) {
      await prisma.inspirationSave.delete({ where: { id: existing.id } });
    } else {
      await prisma.inspirationSave.create({ data: { userId, postId: id } });
    }

    const saveCount = await prisma.inspirationSave.count({ where: { postId: id } });

    return NextResponse.json({ success: true, data: { isSaved: !existing, saveCount } });
  } catch (error) {
    console.error("API error during community post save toggle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle save." },
      { status: 500 }
    );
  }
}
