import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

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
    const notes = formData.get("notes") as string | null;

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

    // 5. Cloudinary Upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadToCloudinary = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `stylesync/wardrobe/${userId}`,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
    };

    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary();
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      return NextResponse.json(
        { success: false, error: "Upload failed. Please try again." },
        { status: 500 }
      );
    }

    const imageUrl = uploadResult.secure_url;

    // 6. Database Persistence
    const garment = await prisma.garment.create({
      data: {
        userId,
        imageUrl,
        name: "New Garment",
        category: "Uncategorized",
        notes: notes || null,
        tags: [],
        isProcessed: false,
      },
    });

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
