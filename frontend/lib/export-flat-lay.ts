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

export interface RenderFlatLayOptions {
  ratio: FlatLayRatio;
  background: FlatLayBackground;
  showWatermark: boolean;
}

export interface ExportFlatLayOptions extends RenderFlatLayOptions {
  fileName: string;
}

export function itemHeight(item: Pick<FlatLayItem, "width" | "aspectRatio">): number {
  return item.width * item.aspectRatio;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_GRID_SIZE = 3;

export function rectsOverlap(a: Rect, b: Rect, margin = 6): boolean {
  return (
    a.x < b.x + b.width - margin &&
    a.x + a.width > b.x + margin &&
    a.y < b.y + b.height - margin &&
    a.y + a.height > b.y + margin
  );
}

export function sizeForCell(aspectRatio: number, cell: number): { width: number; height: number } {
  let width = cell * 0.72;
  let height = width * aspectRatio;
  const maxHeight = cell * 0.85;
  if (height > maxHeight) {
    height = maxHeight;
    width = height / aspectRatio;
  }
  return { width, height };
}

// Places a new item in the first unoccupied grid cell within `region`, falling
// back to a cascading offset once every cell is taken. Defaults to the flat
// lay canvas's full 3x3 grid; callers can pass a smaller region/gridSize to
// search a sub-area instead.
export function findUnoccupiedPosition(
  existing: Rect[],
  aspectRatio: number,
  region: Rect = { x: 0, y: 0, width: FLAT_LAY_CANVAS_SIZE, height: FLAT_LAY_CANVAS_SIZE },
  gridSize: number = DEFAULT_GRID_SIZE
): { x: number; y: number; width: number } {
  const cellW = region.width / gridSize;
  const cellH = region.height / gridSize;
  const cell = Math.min(cellW, cellH);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const { width, height } = sizeForCell(aspectRatio, cell);
      const x = region.x + col * cellW + (cellW - width) / 2;
      const y = region.y + row * cellH + (cellH - height) / 2;
      const candidate = { x, y, width, height };
      if (!existing.some((item) => rectsOverlap(candidate, item))) {
        return { x, y, width };
      }
    }
  }
  // Every grid cell is occupied — cascade from the region's top-left as a fallback.
  const { width, height } = sizeForCell(aspectRatio, cell * 0.8);
  const offset = (existing.length % 6) * (cell * 0.2);
  return {
    x: Math.min(region.x + region.width - width, region.x + offset),
    y: Math.min(region.y + region.height - height, region.y + offset),
    width,
  };
}

// Rasterizes the composition to a PNG Blob without triggering a download —
// shared by exportFlatLay() (download) and the Save to Look Book flow (upload).
export async function renderFlatLay(
  items: FlatLayItem[],
  images: Map<string, HTMLImageElement>,
  caption: CaptionLayer | null,
  options: RenderFlatLayOptions
): Promise<Blob> {
  const { ratio, background, showWatermark } = options;
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

  return blob;
}

export async function exportFlatLay(
  items: FlatLayItem[],
  images: Map<string, HTMLImageElement>,
  caption: CaptionLayer | null,
  options: ExportFlatLayOptions
): Promise<void> {
  const blob = await renderFlatLay(items, images, caption, options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${options.fileName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-flat-lay.png`;
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
