import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { removeBackground } from "@/services/background-removal/remove-background";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const garment = await prisma.garment.findUnique({ where: { id } });

    if (!garment) {
      return NextResponse.json(
        { success: false, error: "Garment not found." },
        { status: 404 }
      );
    }

    if (garment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this garment." },
        { status: 403 }
      );
    }

    const processedBuffer = await removeBackground(garment.imageUrl);
    if (!processedBuffer) {
      return NextResponse.json(
        { success: false, error: "Background removal failed. Please try again." },
        { status: 500 }
      );
    }

    const hasCloudinaryCreds =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinaryCreds) {
      return NextResponse.json(
        { success: false, error: "Image storage is not configured." },
        { status: 503 }
      );
    }

    const uploadProcessed = (): Promise<{ secure_url: string }> => {
      return new Promise((resolve, reject) => {
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
    };

    const uploadResult = await uploadProcessed();

    const updatedGarment = await prisma.garment.update({
      where: { id },
      data: {
        processedImageUrl: uploadResult.secure_url,
        bgRemovedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updatedGarment });
  } catch (error) {
    console.error("API error during manual background removal:", error);
    return NextResponse.json(
      { success: false, error: "Background removal failed. Please try again." },
      { status: 500 }
    );
  }
}
