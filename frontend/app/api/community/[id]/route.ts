import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";

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
    const post = await prisma.communityPost.findFirst({ where: { id, userId } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }

    await prisma.communityPost.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    console.error("API error during community post DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete post." },
      { status: 500 }
    );
  }
}
