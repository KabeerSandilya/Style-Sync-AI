import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { UpsertCommunityProfileSchema, zodError } from "@/lib/schemas";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.communityProfile.findUnique({ where: { userId } });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("API error during community profile GET:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load community profile." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = UpsertCommunityProfileSchema.safeParse(await req.json());
    if (!result.success) return zodError(result.error);
    const { displayName, avatarUrl, isPrivate } = result.data;

    const profile = await prisma.communityProfile.upsert({
      where: { userId },
      update: { displayName, avatarUrl, isPrivate },
      create: { userId, displayName, avatarUrl, isPrivate },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("API error during community profile POST:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save community profile." },
      { status: 500 }
    );
  }
}
