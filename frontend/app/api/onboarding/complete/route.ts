import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";

const VALID_COLORS = [
  "Black", "White", "Navy", "Beige", "Brown", "Grey",
  "Olive", "Burgundy", "Cream", "Sage", "Blue", "Green", "Red",
];

const VALID_STYLES = [
  "Casual", "Formal", "Streetwear", "Minimal", "Athleisure", "Business Casual", "Bohemian",
];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const { favoriteColors = [], favoriteStyles = [] } = body;

    if (!Array.isArray(favoriteColors) || !Array.isArray(favoriteStyles)) {
      return NextResponse.json({ success: false, error: "favoriteColors and favoriteStyles must be arrays" }, { status: 400 });
    }

    const sanitizedColors = favoriteColors.filter((c: unknown) => typeof c === "string" && VALID_COLORS.includes(c));
    const sanitizedStyles = favoriteStyles.filter((s: unknown) => typeof s === "string" && VALID_STYLES.includes(s));

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
