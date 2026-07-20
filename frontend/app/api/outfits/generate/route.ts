import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma, generateOutfits, withRetry, isRateLimited } from "@style-sync/backend";
import type { GarmentInput } from "@style-sync/backend";
import { GenerateOutfitsSchema, zodError } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const GENERATE_RATE_LIMIT = { limit: 1, windowMs: 60_000 };
const MIN_CLASSIFIED_GARMENTS = 3;

export async function POST(req: Request) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1b. Parse optional body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = undefined;
    }
    const genResult = GenerateOutfitsSchema.safeParse(rawBody);
    if (!genResult.success) return zodError(genResult.error);
    const occasion = genResult.data?.occasion ?? null;

    // 2. Rate limit — 1 generation per minute per user
    if (await isRateLimited(`${userId}:generate-outfits`, GENERATE_RATE_LIMIT)) {
      return NextResponse.json(
        { success: false, error: "Please wait before generating again." },
        { status: 429 }
      );
    }

    // 3. Check Gemini is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured." },
        { status: 503 }
      );
    }

    // 4. Fetch classified garments
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

    // 5. Fetch existing outfits for duplicate detection
    const existingOutfits = await prisma.outfit.findMany({
      where: { userId },
      select: {
        garments: { select: { garmentId: true } },
      },
    });

    // Build a set of sorted garment-ID fingerprints for O(1) duplicate lookup
    const existingFingerprints = new Set(
      existingOutfits.map((o) =>
        o.garments
          .map((g) => g.garmentId)
          .sort()
          .join(",")
      )
    );

    // 6. Call Gemini generation service with retry
    const garmentInputs: GarmentInput[] = allGarments;
    const result = await withRetry(
      () => generateOutfits(garmentInputs, occasion),
      "generate outfits"
    );

    if (result.outfits.length === 0) {
      // Gemini responded but every outfit failed ID validation — most likely the
      // wardrobe has too few classified garments with consistent metadata.
      return NextResponse.json(
        {
          success: false,
          error: "AI could not assemble valid combinations from your current wardrobe. Try classifying more garments and try again.",
        },
        { status: 422 }
      );
    }

    // 7. Filter duplicates and wardrobe rule violations
    const garmentMap = new Map(allGarments.map((g) => [g.id, g]));
    const toSave = result.outfits.filter((generated) => {
      const fingerprint = [...generated.garmentIds].sort().join(",");
      if (existingFingerprints.has(fingerprint)) return false;

      // Enforce max 1 bottomwear and max 1 footwear
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

    if (toSave.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "All generated looks already exist in your wardrobe.",
      });
    }

    // 8. Persist each valid outfit
    const saved = await Promise.all(
      toSave.map((generated) =>
        prisma.outfit.create({
          data: {
            userId,
            name: generated.name,
            notes: generated.reason,
            isAiGenerated: true,
            occasion: generated.occasion ?? null,
            garments: {
              create: generated.garmentIds.map((garmentId) => ({ garmentId })),
            },
          },
          include: {
            garments: { include: { garment: true } },
            wears: { orderBy: { wornAt: "desc" }, take: 1 },
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("[POST /api/outfits/generate] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate outfits. Please try again." },
      { status: 500 }
    );
  }
}
