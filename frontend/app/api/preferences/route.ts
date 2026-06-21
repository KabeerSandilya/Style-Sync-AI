import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { UpdatePreferencesSchema, zodError } from "@/lib/schemas";


/**
 * GET /api/preferences
 * Returns the authenticated user's learned preference profile.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const defaultData = {
      favoriteColors: [],
      favoriteStyles: [],
      favoriteCategories: [],
      favoriteSeasons: [],
      favoriteTypes: [],
    };

    return NextResponse.json({
      success: true,
      data: preference
        ? {
            favoriteColors: preference.favoriteColors || [],
            favoriteStyles: preference.favoriteStyles || [],
            favoriteCategories: preference.favoriteCategories || [],
            favoriteSeasons: preference.favoriteSeasons || [],
            favoriteTypes: preference.favoriteTypes || [],
            threshold: preference.threshold ?? 5,
          }
        : {
            ...defaultData,
            threshold: 5,
          },
    });
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/preferences
 * Manually overrides the user's favorite colors and/or styles.
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let raw;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = UpdatePreferencesSchema.safeParse(raw);
    if (!result.success) return zodError(result.error);
    const { favoriteColors, favoriteStyles } = result.data;

    const updateData: Record<string, unknown> = {};
    if (favoriteColors !== undefined) updateData.favoriteColors = favoriteColors;
    if (favoriteStyles !== undefined) updateData.favoriteStyles = favoriteStyles;

    const updated = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        favoriteColors: updateData.favoriteColors as string[] ?? [],
        favoriteStyles: updateData.favoriteStyles as string[] ?? [],
        favoriteCategories: [],
        favoriteSeasons: [],
        favoriteTypes: [],
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        favoriteColors: updated.favoriteColors || [],
        favoriteStyles: updated.favoriteStyles || [],
        favoriteCategories: updated.favoriteCategories || [],
        favoriteSeasons: updated.favoriteSeasons || [],
        favoriteTypes: updated.favoriteTypes || [],
        threshold: updated.threshold,
      },
    });
  } catch (error) {
    console.error("Failed to manually update preferences:", error);
    return NextResponse.json({ success: false, error: "Failed to update preferences." }, { status: 500 });
  }
}

/**
 * POST /api/preferences
 * Updates the user's custom preference threshold and recalculates the profile.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = UpdatePreferencesSchema.safeParse(await req.json());
    if (!result.success) return zodError(result.error);
    const { threshold } = result.data;

    if (threshold === undefined) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid numeric threshold." },
        { status: 400 }
      );
    }

    const { updatePreferenceProfile } = await import("@style-sync/backend");
    const updated = await updatePreferenceProfile(userId, threshold);

    return NextResponse.json({
      success: true,
      data: {
        favoriteColors: updated.favoriteColors || [],
        favoriteStyles: updated.favoriteStyles || [],
        favoriteCategories: updated.favoriteCategories || [],
        favoriteSeasons: updated.favoriteSeasons || [],
        favoriteTypes: updated.favoriteTypes || [],
        threshold: updated.threshold,
      },
    });
  } catch (error) {
    console.error("Failed to update preference threshold:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences." },
      { status: 500 }
    );
  }
}
