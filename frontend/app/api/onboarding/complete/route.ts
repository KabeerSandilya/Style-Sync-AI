import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { OnboardingSchema, zodError } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = OnboardingSchema.safeParse(await req.json());
    if (!result.success) return zodError(result.error);
    const { favoriteColors, favoriteStyles } = result.data;

    const sanitizedColors = favoriteColors;
    const sanitizedStyles = favoriteStyles;

    const preference = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        favoriteColors: sanitizedColors,
        favoriteStyles: sanitizedStyles,
        favoriteCategories: [],
        favoriteSeasons: [],
        favoriteTypes: [],
      },
      update: {
        favoriteColors: sanitizedColors,
        favoriteStyles: sanitizedStyles,
      },
    });

    return NextResponse.json({ success: true, data: preference });
  } catch (error) {
    console.error("API error during onboarding completion:", error);
    return NextResponse.json({ success: false, error: "Failed to save preferences." }, { status: 500 });
  }
}
