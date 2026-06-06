import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { getWeekRange, toDateString } from "@style-sync/backend/planner";

const VALID_OCCASIONS = ['Work', 'Casual', 'Smart Casual', 'Formal', 'Active', 'Date Night'];

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get("week") ?? new Date().toISOString().slice(0, 10);
    const { start, end } = getWeekRange(weekParam);

    const plans = await prisma.outfitPlan.findMany({
      where: {
        userId,
        plannedDate: { gte: start, lte: end },
      },
      include: {
        outfit: {
          include: {
            garments: { include: { garment: true } },
          },
        },
      },
      orderBy: { plannedDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      plans,
      weekStart: toDateString(start),
      weekEnd: toDateString(end),
    });
  } catch (error) {
    console.error("GET /api/planner error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch planner." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { outfitId, plannedDate, occasion, note } = body;

    if (!outfitId || typeof outfitId !== "string") {
      return NextResponse.json({ success: false, error: "outfitId is required." }, { status: 400 });
    }
    if (!plannedDate || !/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
      return NextResponse.json({ success: false, error: "plannedDate must be YYYY-MM-DD." }, { status: 400 });
    }
    if (occasion != null && !VALID_OCCASIONS.includes(occasion)) {
      return NextResponse.json({ success: false, error: "Invalid occasion value." }, { status: 400 });
    }

    const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId } });
    if (!outfit) {
      return NextResponse.json({ success: false, error: "Outfit not found." }, { status: 403 });
    }

    const dateValue = new Date(plannedDate + "T00:00:00.000Z");

    const plan = await prisma.outfitPlan.upsert({
      where: { userId_plannedDate: { userId, plannedDate: dateValue } },
      update: {
        outfitId,
        occasion: occasion ?? null,
        note: note ?? null,
      },
      create: {
        userId,
        outfitId,
        plannedDate: dateValue,
        occasion: occasion ?? null,
        note: note ?? null,
      },
      include: {
        outfit: {
          include: {
            garments: { include: { garment: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("POST /api/planner error:", error);
    return NextResponse.json({ success: false, error: "Failed to save plan." }, { status: 500 });
  }
}
