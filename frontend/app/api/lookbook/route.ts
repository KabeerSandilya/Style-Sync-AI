import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cloudinary, prisma, isRateLimited, MOOD_TAGS } from "@style-sync/backend";
import { LookBookQuerySchema, zodError } from "@/lib/schemas";

const LOOKBOOK_UPLOAD_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: Request) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit
    if (await isRateLimited(`${userId}:lookbook-upload`, LOOKBOOK_UPLOAD_RATE_LIMIT)) {
      return NextResponse.json(
        { success: false, error: "Too many uploads. Please wait a moment." },
        { status: 429 }
      );
    }

    // 3. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const outfitId = (formData.get("outfitId") as string | null) || null;
    const date = formData.get("date") as string | null;
    const ratingRaw = formData.get("rating") as string | null;
    const mood = formData.getAll("mood").map((m) => String(m));
    const notes = formData.get("notes") as string | null;
    const isShareable = (formData.get("isShareable") as string | null) === "true";

    if (!file) {
      return NextResponse.json({ success: false, error: "No photo uploaded." }, { status: 400 });
    }

    // 4. Validate file type/size
    const validMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PNG, JPG, and WEBP are allowed." },
        { status: 400 }
      );
    }
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size allowed is 10MB." },
        { status: 400 }
      );
    }

    // 5. Validate metadata fields
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: "date must be in YYYY-MM-DD format." },
        { status: 400 }
      );
    }
    const rating = Number(ratingRaw);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "rating must be an integer between 1 and 5." },
        { status: 400 }
      );
    }
    const invalidMood = mood.find((m) => !MOOD_TAGS.includes(m as (typeof MOOD_TAGS)[number]));
    if (invalidMood) {
      return NextResponse.json(
        { success: false, error: `Invalid mood tag: ${invalidMood}` },
        { status: 400 }
      );
    }
    if (notes && notes.length > 500) {
      return NextResponse.json(
        { success: false, error: "notes must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    // 6. Verify outfit ownership if linked
    if (outfitId) {
      const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId } });
      if (!outfit) {
        return NextResponse.json({ success: false, error: "Outfit not found." }, { status: 404 });
      }
    }

    // 7. Upload photo to Cloudinary (Base64 database fallback when unconfigured)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hasCloudinaryCreds =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    let photoUrl = "";
    if (hasCloudinaryCreds) {
      const uploadToCloudinary = (): Promise<{ secure_url: string }> =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `stylesync/lookbook/${userId}`, resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string });
            }
          );
          uploadStream.end(buffer);
        });

      try {
        const result = await uploadToCloudinary();
        photoUrl = result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return NextResponse.json(
          { success: false, error: "Upload failed. Please try again." },
          { status: 500 }
        );
      }
    } else {
      photoUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    // 8. Create the entry
    const entry = await prisma.lookBookEntry.create({
      data: {
        userId,
        outfitId,
        photoUrl,
        date: new Date(date),
        rating,
        mood,
        notes: notes && notes.trim() ? notes.trim() : null,
        isShareable,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error("API error during lookbook upload:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create journal entry." },
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
    const result = LookBookQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!result.success) return zodError(result.error);
    const { cursor, limit, month, mood, rating, occasion } = result.data;

    let dateRange: { gte: Date; lt: Date } | undefined;
    if (month) {
      const monthStart = new Date(`${month}-01T00:00:00.000Z`);
      const monthEnd = new Date(monthStart);
      monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
      dateRange = { gte: monthStart, lt: monthEnd };
    }

    const entries = await prisma.lookBookEntry.findMany({
      where: {
        userId,
        ...(mood ? { mood: { has: mood } } : {}),
        ...(rating ? { rating } : {}),
        ...(occasion ? { outfit: { occasion } } : {}),
        ...(dateRange ? { date: dateRange } : {}),
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { outfit: { select: { id: true, name: true, occasion: true } } },
    });

    const hasMore = entries.length > limit;
    const data = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ success: true, data, nextCursor });
  } catch (error) {
    console.error("API error during lookbook GET:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load journal entries." },
      { status: 500 }
    );
  }
}
