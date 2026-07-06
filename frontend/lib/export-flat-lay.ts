export interface FlatLayItem {
  id: string; // garmentId, unique per canvas item (a garment can be added once)
  garmentId: string;
  imageUrl: string;
  x: number; // canvas-space, top-left, px
  y: number;
  width: number; // height derived from aspectRatio
  zIndex: number;
  flippedX: boolean;
  aspectRatio: number; // naturalHeight / naturalWidth, cached at add-time
}

export interface CaptionLayer {
  text: string;
  x: number;
  y: number;
}

export type FlatLayBackground = string; // any hex color, chosen via a color picker
export type FlatLayRatio = "1:1" | "4:5";

export const FLAT_LAY_CANVAS_SIZE = 1200;
export const DEFAULT_FLAT_LAY_BACKGROUND: FlatLayBackground = "#fffefb"; // cream

const EXPORT_DIMENSIONS: Record<FlatLayRatio, { width: number; height: number }> = {
  "1:1": { width: 1200, height: 1200 },
  "4:5": { width: 1080, height: 1350 },
};

export interface ExportFlatLayOptions {
  ratio: FlatLayRatio;
  background: FlatLayBackground;
  showWatermark: boolean;
  fileName: string;
}

export function itemHeight(item: Pick<FlatLayItem, "width" | "aspectRatio">): number {
  return item.width * item.aspectRatio;
}

export async function exportFlatLay(
  items: FlatLayItem[],
  images: Map<string, HTMLImageElement>,
  caption: CaptionLayer | null,
  options: ExportFlatLayOptions
): Promise<void> {
  const { ratio, background, showWatermark, fileName } = options;
  const { width: outWidth, height: outHeight } = EXPORT_DIMENSIONS[ratio];

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, outWidth, outHeight);

  // The internal composition is always authored at 1200x1200. For 4:5, the
  // width matches (scaled) and the taller canvas letterboxes the content
  // top/bottom rather than cropping it.
  const scale = outWidth / FLAT_LAY_CANVAS_SIZE;
  const offsetX = 0;
  const offsetY = (outHeight - FLAT_LAY_CANVAS_SIZE * scale) / 2;

  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);

  for (const item of sorted) {
    const img = images.get(item.id);
    if (!img) continue;

    const drawW = item.width * scale;
    const drawH = itemHeight(item) * scale;
    const drawX = offsetX + item.x * scale;
    const drawY = offsetY + item.y * scale;

    ctx.save();
    if (item.flippedX) {
      ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  }

  if (caption && caption.text.trim().length > 0) {
    const fontFamily =
      getComputedStyle(document.documentElement).getPropertyValue("--font-serif").trim() ||
      "serif";
    const fontSize = Math.round(40 * scale);
    const font = `italic 500 ${fontSize}px ${fontFamily}`;

    try {
      await document.fonts.load(font);
    } catch {
      // Fall through and draw with whatever font resolves (system serif fallback).
    }

    ctx.save();
    ctx.font = font;
    ctx.fillStyle = "#2a2318";
    ctx.textBaseline = "top";
    ctx.fillText(caption.text, offsetX + caption.x * scale, offsetY + caption.y * scale);
    ctx.restore();
  }

  if (showWatermark) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#1c1917";
    ctx.font = `700 ${Math.round(16 * scale)}px sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("StyleSync AI", outWidth - 24, outHeight - 20);
    ctx.restore();
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Failed to export flat lay");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${fileName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-flat-lay.png`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function loadFlatLayImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
