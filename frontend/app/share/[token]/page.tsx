import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@style-sync/backend";
import { SharedOutfitView } from "@/components/share/shared-outfit-view";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  const outfit = await prisma.outfit.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      occasion: true,
      garments: {
        take: 1,
        select: {
          garment: { select: { processedImageUrl: true, imageUrl: true } },
        },
      },
    },
  });

  if (!outfit) return { title: "Outfit — StyleSync AI" };

  const firstImage =
    outfit.garments[0]?.garment.processedImageUrl ??
    outfit.garments[0]?.garment.imageUrl;

  const pieceText = `${outfit.garments.length} piece look`;
  const desc = outfit.occasion ? `${outfit.occasion} · ${pieceText}` : pieceText;

  return {
    title: `${outfit.name} — StyleSync AI`,
    description: desc,
    openGraph: {
      title: outfit.name,
      description: desc,
      ...(firstImage ? { images: [{ url: firstImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: outfit.name,
      description: desc,
      ...(firstImage ? { images: [firstImage] } : {}),
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const outfit = await prisma.outfit.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      notes: true,
      occasion: true,
      createdAt: true,
      garments: {
        select: {
          garment: {
            select: {
              imageUrl: true,
              processedImageUrl: true,
              category: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!outfit) notFound();

  return (
    <SharedOutfitView
      outfit={{
        ...outfit,
        createdAt: outfit.createdAt.toISOString(),
      }}
    />
  );
}
