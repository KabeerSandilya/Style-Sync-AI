import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma, isRateLimited } from "@style-sync/backend";
import { CreateCommunityPostSchema, CommunityFeedQuerySchema, zodError } from "@/lib/schemas";
import type { CommunityPost } from "@style-sync/backend/types";
import { Prisma } from "@prisma/client";

const COMMUNITY_PUBLISH_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const TRENDING_CANDIDATE_POOL = 200;
const TRENDING_RESULT_SIZE = 20;
const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const postWithRelations = Prisma.validator<Prisma.CommunityPostDefaultArgs>()({
  include: {
    profile: { select: { displayName: true, avatarUrl: true } },
    _count: { select: { likes: true, saves: true } },
    likes: { select: { userId: true } },
    saves: { select: { userId: true } },
  },
});
type PostWithRelations = Prisma.CommunityPostGetPayload<typeof postWithRelations>;

function serializePost(post: PostWithRelations, viewerId: string): CommunityPost {
  return {
    id: post.id,
    sourceLookBookEntryId: post.sourceLookBookEntryId,
    photoUrl: post.photoUrl,
    caption: post.caption,
    occasion: post.occasion,
    createdAt: post.createdAt.toISOString(),
    profile: post.profile,
    likeCount: post._count.likes,
    saveCount: post._count.saves,
    isLikedByViewer: post.likes.some((l) => l.userId === viewerId),
    isSavedByViewer: post.saves.some((s) => s.userId === viewerId),
    isOwnPost: post.userId === viewerId,
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.communityProfile.findUnique({ where: { userId } });
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Set up your Community Profile before publishing." },
        { status: 422 }
      );
    }

    if (await isRateLimited(`${userId}:community-publish`, COMMUNITY_PUBLISH_RATE_LIMIT)) {
      return NextResponse.json(
        { success: false, error: "Too many publish requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const result = CreateCommunityPostSchema.safeParse(await req.json());
    if (!result.success) return zodError(result.error);
    const { sourceLookBookEntryId, caption, occasion } = result.data;

    const entry = await prisma.lookBookEntry.findFirst({
      where: { id: sourceLookBookEntryId, userId },
      include: { outfit: { select: { occasion: true } } },
    });
    if (!entry) {
      return NextResponse.json({ success: false, error: "Journal entry not found." }, { status: 404 });
    }
    if (!entry.isShareable) {
      return NextResponse.json(
        { success: false, error: "This entry isn't marked shareable." },
        { status: 422 }
      );
    }

    const resolvedOccasion = occasion ?? entry.outfit?.occasion ?? null;

    const post = await prisma.communityPost.upsert({
      where: { sourceLookBookEntryId },
      update: {
        caption: caption ?? null,
        occasion: resolvedOccasion,
      },
      create: {
        userId,
        sourceLookBookEntryId,
        photoUrl: entry.photoUrl,
        caption: caption ?? null,
        occasion: resolvedOccasion,
      },
      ...postWithRelations,
    });

    return NextResponse.json({ success: true, data: serializePost(post, userId) }, { status: 201 });
  } catch (error) {
    console.error("API error during community publish:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish to Community." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Narrow single-purpose lookup used by /lookbook/[id] to check "already published" —
    // not the paginated feed query.
    const sourceLookBookEntryId = searchParams.get("sourceLookBookEntryId");
    if (sourceLookBookEntryId) {
      const post = await prisma.communityPost.findUnique({
        where: { sourceLookBookEntryId },
        ...postWithRelations,
      });
      if (!post || post.userId !== userId) {
        return NextResponse.json({ success: true, data: null });
      }
      return NextResponse.json({ success: true, data: serializePost(post, userId) });
    }

    const result = CommunityFeedQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!result.success) return zodError(result.error);
    const { cursor, limit, occasion, sort, tab } = result.data;

    if (tab === "saved") {
      const saves = await prisma.inspirationSave.findMany({
        where: { userId, ...(occasion ? { post: { occasion } } : {}) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: { post: postWithRelations },
      });

      const hasMore = saves.length > limit;
      const page = hasMore ? saves.slice(0, limit) : saves;
      const nextCursor = hasMore ? page[page.length - 1].id : null;
      const data = page.map((s) => serializePost(s.post, userId));

      return NextResponse.json({ success: true, data, nextCursor });
    }

    if (sort === "trending") {
      const sevenDaysAgo = new Date(Date.now() - TRENDING_WINDOW_MS);
      const candidates = await prisma.communityPost.findMany({
        where: {
          isHidden: false,
          profile: { isPrivate: false },
          ...(occasion ? { occasion } : {}),
        },
        orderBy: [{ createdAt: "desc" }],
        take: TRENDING_CANDIDATE_POOL,
        include: {
          profile: { select: { displayName: true, avatarUrl: true } },
          _count: {
            select: {
              likes: { where: { createdAt: { gte: sevenDaysAgo } } },
              saves: true,
            },
          },
          likes: { select: { userId: true } },
          saves: { select: { userId: true } },
        },
      });

      const trending = candidates
        .sort((a, b) => b._count.likes - a._count.likes)
        .slice(0, TRENDING_RESULT_SIZE);

      return NextResponse.json({
        success: true,
        data: trending.map((p) => serializePost(p, userId)),
        nextCursor: null,
      });
    }

    // tab: "feed", sort: "newest"
    const posts = await prisma.communityPost.findMany({
      where: {
        isHidden: false,
        profile: { isPrivate: false },
        ...(occasion ? { occasion } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      ...postWithRelations,
    });

    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: page.map((p) => serializePost(p, userId)),
      nextCursor,
    });
  } catch (error) {
    console.error("API error during community feed GET:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load Community feed." },
      { status: 500 }
    );
  }
}
