import { auth } from "@clerk/nextjs/server";
import { after, NextResponse } from "next/server";
import { cloudinary, prisma, classifyGarment, removeBackground, withRetry } from "@style-sync/backend";

export async function POST(req: Request) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    // Client may have already removed the background in the browser
    const processedImageFile = formData.get("processedImageFile") as File | null;
    const notes = formData.get("notes") as string | null;
    const name = formData.get("name") as string | null;
    const category = formData.get("category") as string | null;
    const tagsString = formData.get("tags") as string | null;
    const isFavoriteString = formData.get("isFavorite") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    // 3. Validation - File Type
    const validMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PNG, JPG, and WEBP are allowed." },
        { status: 400 }
      );
    }

    // 4. Validation - File Size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size allowed is 10MB." },
        { status: 400 }
      );
    }

    // 5. Cloudinary Upload with Base64 Database Fallback
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const hasCloudinaryCreds =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    let imageUrl = "";

    if (hasCloudinaryCreds) {
      const uploadToCloudinary = (): Promise<{ secure_url: string }> => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `stylesync/wardrobe/${userId}`,
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string });
            }
          );
          uploadStream.end(buffer);
        });
      };

      try {
        const uploadResult = await uploadToCloudinary();
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return NextResponse.json(
          { success: false, error: "Upload failed. Please try again." },
          { status: 500 }
        );
      }
    } else {
      console.warn("Cloudinary credentials missing. Falling back to local Base64 storage in database.");
      imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    const VALID_CATEGORIES = [
      "Topwear",
      "Bottomwear",
      "Outerwear",
      "Footwear",
      "Accessories",
      "Formalwear",
      "Sportswear",
      "Ethnicwear",
      "Uncategorized",
    ];

    const garmentName = name && name.trim() !== "" ? name.trim().substring(0, 100) : "New Garment";
    const garmentCategory = category && VALID_CATEGORIES.includes(category) ? category : "Uncategorized";
    const garmentTags = tagsString
      ? tagsString.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
      : [];
    const isFavorite = isFavoriteString === "true";

    // 6. If the client already removed the background, upload the processed PNG now
    let processedImageUrl: string | null = null;

    if (processedImageFile && hasCloudinaryCreds) {
      try {
        const processedBytes = await processedImageFile.arrayBuffer();
        const processedBuffer = Buffer.from(processedBytes);

        const uploadProcessedToCloudinary = (): Promise<{ secure_url: string }> =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: `stylesync/wardrobe/${userId}/processed`, resource_type: "image", format: "png" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as { secure_url: string });
              }
            );
            stream.end(processedBuffer);
          });

        const result = await uploadProcessedToCloudinary();
        processedImageUrl = result.secure_url;
      } catch (err) {
        // Non-fatal — server-side BG removal will run as fallback
        console.warn("Failed to upload client-processed image:", err);
      }
    }

    // 7. Database Persistence
    const garment = await prisma.garment.create({
      data: {
        userId,
        imageUrl,
        name: garmentName,
        category: garmentCategory,
        notes: notes || null,
        tags: garmentTags,
        isFavorite,
        isProcessed: false,
        ...(processedImageUrl
          ? { processedImageUrl, bgRemovedAt: new Date() }
          : {}),
      },
    });

    // 8. Background classification — runs after response is sent.
    // after() keeps the job alive on Vercel instead of killing it with the function.
    if (process.env.GEMINI_API_KEY) {
      after(async () => {
        try {
          const metadata = await withRetry(
            () => classifyGarment(imageUrl),
            `classify garment ${garment.id}`
          );
          await prisma.garment.update({
            where: { id: garment.id },
            data: {
              category: metadata.category,
              subcategory: metadata.subcategory,
              primaryColor: metadata.primaryColor,
              secondaryColor: metadata.secondaryColor,
              season: metadata.season,
              style: metadata.style,
              material: metadata.material,
              confidence: metadata.confidence,
              isProcessed: true,
            },
          });
          console.log(`Auto-classification completed for garment ${garment.id}`);
        } catch (error) {
          console.error(`Auto-classification permanently failed for garment ${garment.id}:`, error);
        }
      });
    }

    // 9. Server-side background removal — only if client didn't already do it.
    if (hasCloudinaryCreds && !processedImageUrl) {
      after(async () => {
        try {
          const processedBuffer = await withRetry(
            () => removeBackground(imageUrl),
            `remove background for garment ${garment.id}`
          );
          if (!processedBuffer) return;

          const uploadProcessed = (): Promise<{ secure_url: string }> =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: `stylesync/wardrobe/${userId}/processed`,
                  resource_type: "image",
                  format: "png",
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result as { secure_url: string });
                }
              );
              stream.end(processedBuffer);
            });

          const uploadResult = await withRetry(
            uploadProcessed,
            `upload processed image for garment ${garment.id}`
          );
          await prisma.garment.update({
            where: { id: garment.id },
            data: {
              processedImageUrl: uploadResult.secure_url,
              bgRemovedAt: new Date(),
            },
          });
          console.log(`Background removal completed for garment ${garment.id}`);
        } catch (error) {
          console.error(`Background removal permanently failed for garment ${garment.id}:`, error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: garment,
    });
  } catch (error) {
    console.error("API error during upload:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
