import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma, fetchWeather, rankOutfits, getRecentWearsMap, getFeedbackHistoryMap } from "@style-sync/backend";

export async function GET(req: Request) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request query parameters (default to "Paris" if not specified)
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Paris";
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");
    const lat = latStr ? parseFloat(latStr) : undefined;
    const lon = lonStr ? parseFloat(lonStr) : undefined;

    // 3. Fetch normalized weather data
    const weather = await fetchWeather(city, lat, lon);

    // 4. Retrieve user's saved outfits along with their associated garments
    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
      },
      include: {
        garments: {
          include: {
            garment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4a. Cold-start detection: determine why recommendations would be empty
    if (outfits.length === 0) {
      const garmentCount = await prisma.garment.count({ where: { userId } });
      const coldStartReason = garmentCount === 0 ? "no_garments" : "no_outfits";
      return NextResponse.json({ success: true, data: [], weather, coldStartReason });
    }

    // 5. Retrieve user's preferences if they exist
    const userPreference = await prisma.userPreference.findUnique({
      where: {
        userId,
      },
    });

    // 5.5. Retrieve wear and feedback history
    const [wearsMap, feedbackMap] = await Promise.all([
      getRecentWearsMap(userId),
      getFeedbackHistoryMap(userId),
    ]);

    // 6. Rank outfits based on scoring rules
    const rankedRecommendations = rankOutfits(
      outfits as any, // Cast to handle JSON dates/Prisma client types matching the Outfit interface
      weather,
      userPreference || undefined,
      wearsMap,
      feedbackMap
    );

    // Return the response containing the ranked outfit configurations and weather context
    return NextResponse.json({
      success: true,
      data: rankedRecommendations.map((item) => {
        const lastWorn = wearsMap[item.outfitId] || null;
        let wornToday = false;
        if (lastWorn) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          wornToday = new Date(lastWorn) >= startOfToday;
        }
        return {
          outfitId: item.outfitId,
          score: item.score,
          explanation: item.explanation,
          outfit: item.outfit, // Embedded outfit object for high-performance frontend rendering
          feedbackType: feedbackMap[item.outfitId] || null,
          lastWorn,
          wornToday,
        };
      }),
      weather, // Exposing weather metadata to display in the contextual widget
    });
  } catch (error) {
    console.error("API error during recommendations generation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate outfit recommendations." },
      { status: 500 }
    );
  }
}
