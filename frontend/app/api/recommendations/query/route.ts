import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  prisma,
  rankOutfits,
  getRecentWearsMap,
  getFeedbackHistoryMap,
  getRecentSuggestionsMap,
  interpretStyleQuery,
  queryClimateToWeatherContext,
  queryClimateToSeasonOverride,
  generateOutfits,
  withRetry,
  isRateLimited,
} from "@style-sync/backend";
import type { GarmentInput } from "@style-sync/backend";
import { QueryRecommendationSchema, zodError } from "@/lib/schemas";

const ASK_STYLIST_RATE_LIMIT = { limit: 5, windowMs: 60_000 };
const MIN_CLASSIFIED_GARMENTS = 3;
const GOOD_MATCH_THRESHOLD = 60;

export async function POST(req: Request) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = undefined;
    }
    const parsed = QueryRecommendationSchema.safeParse(rawBody);
    if (!parsed.success) return zodError(parsed.error);
    const { query } = parsed.data;

    // 3. Rate limit
    if (await isRateLimited(`${userId}:ask-stylist`, ASK_STYLIST_RATE_LIMIT)) {
      return NextResponse.json(
        { success: false, error: "Please wait before asking again." },
        { status: 429 }
      );
    }

    // 4. Check Gemini is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured." },
        { status: 503 }
      );
    }

    // 5. Interpret the free-text query — this drives everything downstream.
    // Ask the Stylist scores against the climate the user *described* (if any),
    // never today's real weather, so "an outfit for a cold place" isn't overridden
    // by whatever it actually happens to be outside right now.
    const interpretation = await withRetry(() => interpretStyleQuery(query), "interpret style query");
    const { occasion, keywords, climate } = interpretation;
    const weather = queryClimateToWeatherContext(climate);
    const seasonOverride = queryClimateToSeasonOverride(climate);

    // 6. Rank existing saved outfits
    const outfits = await prisma.outfit.findMany({
      where: { userId },
      include: { garments: { include: { garment: true } } },
      orderBy: { createdAt: "desc" },
    });

    if (outfits.length > 0) {
      const userPreference = await prisma.userPreference.findUnique({ where: { userId } });
      const [wearsMap, feedbackMap, suggestionsMap] = await Promise.all([
        getRecentWearsMap(userId),
        getFeedbackHistoryMap(userId),
        getRecentSuggestionsMap(userId),
      ]);

      const ranked = rankOutfits(
        outfits as any,
        weather,
        userPreference || undefined,
        wearsMap,
        feedbackMap,
        occasion,
        keywords,
        suggestionsMap,
        seasonOverride,
      );

      const top = ranked[0];
      if (top && top.score >= GOOD_MATCH_THRESHOLD) {
        const lastWorn = wearsMap[top.outfitId] || null;
        let wornToday = false;
        if (lastWorn) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          wornToday = new Date(lastWorn) >= startOfToday;
        }
        await prisma.recommendation.create({
          data: {
            userId,
            outfitId: top.outfitId,
            explanation: top.explanation,
            weatherContext: weather as any,
          },
        });
        return NextResponse.json({
          success: true,
          mode: "existing",
          interpretation,
          recommendation: {
            outfitId: top.outfitId,
            score: top.score,
            explanation: top.explanation,
            outfit: top.outfit,
            feedbackType: feedbackMap[top.outfitId] || null,
            lastWorn,
            wornToday,
          },
          weather,
        });
      }
    }

    // 7. Fallback — assemble a brand-new outfit for this query
    const allGarments = await prisma.garment.findMany({
      where: { userId, isProcessed: true },
      select: {
        id: true,
        name: true,
        category: true,
        subcategory: true,
        primaryColor: true,
        style: true,
        season: true,
        material: true,
      },
    });

    if (allGarments.length < MIN_CLASSIFIED_GARMENTS) {
      return NextResponse.json(
        {
          success: false,
          error: "not_enough_garments",
          classifiedCount: allGarments.length,
        },
        { status: 400 }
      );
    }

    const existingOutfits = await prisma.outfit.findMany({
      where: { userId },
      select: { garments: { select: { garmentId: true } } },
    });
    const existingFingerprints = new Set(
      existingOutfits.map((o) => o.garments.map((g) => g.garmentId).sort().join(","))
    );

    const garmentMap = new Map(allGarments.map((g) => [g.id, g]));
    const garmentInputs: GarmentInput[] = allGarments;
    const result = await withRetry(
      () => generateOutfits(garmentInputs, occasion, keywords),
      "generate outfit for query"
    );

    const candidate = result.outfits.find((generated) => {
      const fingerprint = [...generated.garmentIds].sort().join(",");
      if (existingFingerprints.has(fingerprint)) return false;

      let bottomCount = 0;
      let footwearCount = 0;
      for (const id of generated.garmentIds) {
        const g = garmentMap.get(id);
        if (!g) return false;
        const cat = g.category.toLowerCase();
        if (cat.includes("bottom")) bottomCount++;
        if (cat.includes("foot")) footwearCount++;
      }
      return bottomCount <= 1 && footwearCount <= 1;
    });

    if (!candidate) {
      return NextResponse.json(
        {
          success: false,
          error: "AI could not assemble a fit from your current wardrobe. Try classifying more garments and try again.",
        },
        { status: 422 }
      );
    }

    const saved = await prisma.outfit.create({
      data: {
        userId,
        name: candidate.name,
        notes: candidate.reason,
        isAiGenerated: true,
        occasion: candidate.occasion ?? null,
        garments: {
          create: candidate.garmentIds.map((garmentId) => ({ garmentId })),
        },
      },
      include: {
        garments: { include: { garment: true } },
        wears: { orderBy: { wornAt: "desc" }, take: 1 },
      },
    });

    await prisma.recommendation.create({
      data: {
        userId,
        outfitId: saved.id,
        explanation: candidate.reason,
        weatherContext: weather as any,
      },
    });

    return NextResponse.json({
      success: true,
      mode: "generated",
      interpretation,
      recommendation: {
        outfitId: saved.id,
        score: null,
        explanation: candidate.reason,
        outfit: saved,
        feedbackType: null,
        lastWorn: null,
        wornToday: false,
      },
      weather,
    });
  } catch (error) {
    console.error("[POST /api/recommendations/query] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get a styling recommendation. Please try again." },
      { status: 500 }
    );
  }
}
