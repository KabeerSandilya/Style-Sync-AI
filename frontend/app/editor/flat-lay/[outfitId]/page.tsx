"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Download, Loader2, X, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FlatLayItemView } from "@/components/flat-lay/flat-lay-item";
import {
  exportFlatLay,
  loadFlatLayImage,
  itemHeight,
  FLAT_LAY_CANVAS_SIZE,
  DEFAULT_FLAT_LAY_BACKGROUND,
  type FlatLayItem,
  type CaptionLayer,
  type FlatLayBackground,
  type FlatLayRatio,
} from "@/lib/export-flat-lay";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { useGarments } from "@/lib/hooks/use-garments";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Garment } from "@/types";

const GRID_SIZE = 3;
const CELL = FLAT_LAY_CANVAS_SIZE / GRID_SIZE;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: Rect, margin = 6): boolean {
  return (
    a.x < b.x + b.width - margin &&
    a.x + a.width > b.x + margin &&
    a.y < b.y + b.height - margin &&
    a.y + a.height > b.y + margin
  );
}

function sizeForCell(aspectRatio: number, cell: number): { width: number; height: number } {
  let width = cell * 0.72;
  let height = width * aspectRatio;
  const maxHeight = cell * 0.85;
  if (height > maxHeight) {
    height = maxHeight;
    width = height / aspectRatio;
  }
  return { width, height };
}

function findUnoccupiedPosition(
  existing: Rect[],
  aspectRatio: number
): { x: number; y: number; width: number } {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const { width, height } = sizeForCell(aspectRatio, CELL);
      const x = col * CELL + (CELL - width) / 2;
      const y = row * CELL + (CELL - height) / 2;
      const candidate = { x, y, width, height };
      if (!existing.some((item) => rectsOverlap(candidate, item))) {
        return { x, y, width };
      }
    }
  }
  // Every grid cell is occupied — cascade from the top-left as a fallback.
  const { width, height } = sizeForCell(aspectRatio, CELL * 0.8);
  const offset = (existing.length % 6) * 24;
  return {
    x: Math.min(FLAT_LAY_CANVAS_SIZE - width, 60 + offset),
    y: Math.min(FLAT_LAY_CANVAS_SIZE - height, 60 + offset),
    width,
  };
}

function FlatLaySkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background items-center justify-center gap-6 px-6">
      <div className="w-full max-w-2xl aspect-square border border-dashed border-border/50 bg-card/25 animate-pulse" />
      <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
        Loading flat lay…
      </p>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-background items-center justify-center px-6 text-center">
      <div className="border border-dashed border-border/60 p-16 max-w-md bg-card/25 flex flex-col items-center gap-4">
        <div className="bg-accent/40 text-primary p-4">
          <LayoutGrid className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
          Combination not found
        </h2>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
          This outfit doesn&apos;t exist or may have been removed.
        </p>
        <Button onClick={onBack} size="sm" className="rounded-none text-xs mt-2">
          Back to Saved Outfits
        </Button>
      </div>
    </div>
  );
}

export default function FlatLayBuilderPage() {
  const params = useParams<{ outfitId: string }>();
  const router = useRouter();
  const backHref = "/editor/wardrobe?view=outfits";

  const { data: outfits = [], isLoading: loadingOutfits } = useOutfits();
  const { data: garments = [], isLoading: loadingGarments } = useGarments();
  const outfit = outfits.find((o) => o.id === params.outfitId);

  const [items, setItems] = React.useState<FlatLayItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState<CaptionLayer>({ text: "", x: 360, y: 1080 });
  const [background, setBackground] = React.useState<FlatLayBackground>(DEFAULT_FLAT_LAY_BACKGROUND);
  const [ratio, setRatio] = React.useState<FlatLayRatio>("1:1");
  const [showWatermark, setShowWatermark] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const imagesRef = React.useRef<Map<string, HTMLImageElement>>(new Map());
  const seededOutfitIdRef = React.useRef<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [displayWidth, setDisplayWidth] = React.useState(0);

  const triggerToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setDisplayWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = displayWidth > 0 ? displayWidth / FLAT_LAY_CANVAS_SIZE : 1;

  // Seed one item per garment in a non-overlapping grid on first successful resolution.
  // seededOutfitIdRef is only set once the load actually finishes, so a run that gets
  // cancelled (e.g. React Strict Mode's dev-only double-invoke) doesn't permanently
  // block the real run from seeding the canvas.
  React.useEffect(() => {
    if (loadingOutfits || !outfit) return;
    if (seededOutfitIdRef.current === outfit.id) return;

    let cancelled = false;
    (async () => {
      const built: FlatLayItem[] = [];
      for (let index = 0; index < outfit.garments.length; index++) {
        const garment = outfit.garments[index].garment;
        const imageUrl = getDisplayImageUrl(garment);
        try {
          const img = await loadFlatLayImage(imageUrl);
          if (cancelled) return;
          imagesRef.current.set(garment.id, img);
          const aspectRatio = img.naturalHeight / img.naturalWidth;
          const existingRects = built.map((i) => ({ x: i.x, y: i.y, width: i.width, height: itemHeight(i) }));
          const { x, y, width } = findUnoccupiedPosition(existingRects, aspectRatio);
          built.push({
            id: garment.id,
            garmentId: garment.id,
            imageUrl,
            x,
            y,
            width,
            zIndex: index,
            flippedX: false,
            aspectRatio,
          });
        } catch {
          // Skip garments whose image fails to load rather than blocking the whole canvas.
        }
      }
      if (cancelled) return;
      setItems(built);
      seededOutfitIdRef.current = outfit.id;
    })();

    return () => {
      cancelled = true;
    };
  }, [loadingOutfits, outfit]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setItems((prev) => {
      const maxZ = prev.reduce((max, i) => Math.max(max, i.zIndex), 0);
      return prev.map((i) => (i.id === id ? { ...i, zIndex: maxZ + 1 } : i));
    });
  };

  const handleItemChange = (id: string, patch: Partial<Pick<FlatLayItem, "x" | "y" | "width">>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const handleBringForward = (id: string) => {
    setItems((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx === -1 || idx === sorted.length - 1) return prev;
      const a = sorted[idx];
      const b = sorted[idx + 1];
      return prev.map((i) => {
        if (i.id === a.id) return { ...i, zIndex: b.zIndex };
        if (i.id === b.id) return { ...i, zIndex: a.zIndex };
        return i;
      });
    });
  };

  const handleSendBack = (id: string) => {
    setItems((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const a = sorted[idx];
      const b = sorted[idx - 1];
      return prev.map((i) => {
        if (i.id === a.id) return { ...i, zIndex: b.zIndex };
        if (i.id === b.id) return { ...i, zIndex: a.zIndex };
        return i;
      });
    });
  };

  const handleFlip = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, flippedX: !i.flippedX } : i)));
  };

  const handleAddGarment = async (garment: Garment) => {
    if (items.some((i) => i.garmentId === garment.id)) return;
    const imageUrl = getDisplayImageUrl(garment);
    try {
      const img = await loadFlatLayImage(imageUrl);
      imagesRef.current.set(garment.id, img);
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      setItems((prev) => {
        const existingRects = prev.map((i) => ({ x: i.x, y: i.y, width: i.width, height: itemHeight(i) }));
        const { x, y, width } = findUnoccupiedPosition(existingRects, aspectRatio);
        const zIndex = prev.reduce((max, i) => Math.max(max, i.zIndex), -1) + 1;
        return [
          ...prev,
          { id: garment.id, garmentId: garment.id, imageUrl, x, y, width, zIndex, flippedX: false, aspectRatio },
        ];
      });
    } catch {
      triggerToast("Failed to load image for that garment.");
    }
  };

  // Caption dragging — position-only, no resize.
  const captionDragState = React.useRef<{ startX: number; startY: number; capX: number; capY: number } | null>(null);

  const handleCaptionPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setSelectedId(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    captionDragState.current = { startX: e.clientX, startY: e.clientY, capX: caption.x, capY: caption.y };
  };

  const handleCaptionPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!captionDragState.current) return;
    const { startX, startY, capX, capY } = captionDragState.current;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    setCaption((prev) => ({
      ...prev,
      x: Math.min(Math.max(0, capX + dx), FLAT_LAY_CANVAS_SIZE - 40),
      y: Math.min(Math.max(0, capY + dy), FLAT_LAY_CANVAS_SIZE - 40),
    }));
  };

  const handleCaptionPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    captionDragState.current = null;
  };

  const handleExport = async () => {
    if (!outfit) return;
    setIsExporting(true);
    try {
      await exportFlatLay(items, imagesRef.current, caption.text.trim() ? caption : null, {
        ratio,
        background,
        showWatermark,
        fileName: outfit.name,
      });
    } catch {
      triggerToast("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loadingOutfits) {
    return <FlatLaySkeleton />;
  }

  if (!outfit) {
    return <NotFoundState onBack={() => router.push(backHref)} />;
  }

  const sortedByZ = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const availableGarments = garments.filter((g) => !items.some((i) => i.garmentId === g.id));

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-xs px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push(backHref)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-semibold uppercase tracking-wider font-sans cursor-pointer transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h1 className="font-serif text-lg font-medium text-foreground truncate leading-tight">
            Flat Lay: {outfit.name}
          </h1>
        </div>

        <div className="flex-1 min-w-50 max-w-md">
          <input
            type="text"
            value={caption.text}
            onChange={(e) => setCaption((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Add a caption…"
            maxLength={80}
            className="w-full bg-background/60 border border-border/60 px-3 py-1.5 text-sm font-serif italic outline-none focus-visible:border-primary/60 transition-colors placeholder:font-sans placeholder:not-italic placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Background color picker */}
          <div className="relative w-7 h-7 border border-border/60 overflow-hidden">
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              title="Canvas background color"
              aria-label="Canvas background color"
              className="absolute -top-1 -left-1 w-9 h-9 cursor-pointer border-none bg-transparent p-0"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWardrobeOpen(true)}
            className="rounded-none border-border/60 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add from Wardrobe
          </Button>

          {/* Export ratio toggle */}
          <div className="flex border border-border/60 text-[10px] font-sans font-bold uppercase tracking-wider">
            {(["1:1", "4:5"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={cn(
                  "px-2.5 h-7 border-r last:border-r-0 border-border/60 transition-colors cursor-pointer",
                  ratio === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowWatermark((v) => !v)}
            className={cn(
              "px-2.5 h-7 border text-[10px] font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer",
              showWatermark
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            Watermark {showWatermark ? "On" : "Off"}
          </button>

          <Button onClick={handleExport} disabled={isExporting} size="sm" className="rounded-none text-xs gap-1.5">
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <main
        className="flex-1 overflow-auto flex items-center justify-center p-6 md:p-10"
        onPointerDown={() => setSelectedId(null)}
      >
        <div
          ref={containerRef}
          className="relative shadow-xl border border-border/30 shrink-0"
          style={{
            width: "min(85vw, 640px)",
            aspectRatio: "1 / 1",
            backgroundColor: background,
          }}
        >
          {sortedByZ.map((item) => (
            <FlatLayItemView
              key={item.id}
              item={item}
              scale={scale}
              isSelected={selectedId === item.id}
              canBringForward={sortedByZ[sortedByZ.length - 1]?.id !== item.id}
              canSendBack={sortedByZ[0]?.id !== item.id}
              onSelect={() => handleSelect(item.id)}
              onChange={(patch) => handleItemChange(item.id, patch)}
              onBringForward={() => handleBringForward(item.id)}
              onSendBack={() => handleSendBack(item.id)}
              onFlip={() => handleFlip(item.id)}
            />
          ))}

          {caption.text.trim().length > 0 && (
            <div
              onPointerDown={handleCaptionPointerDown}
              onPointerMove={handleCaptionPointerMove}
              onPointerUp={handleCaptionPointerUp}
              onPointerCancel={handleCaptionPointerUp}
              className="absolute cursor-grab active:cursor-grabbing touch-none select-none font-serif italic whitespace-nowrap"
              style={{
                left: caption.x * scale,
                top: caption.y * scale,
                fontSize: 32 * scale,
                color: "#2a2318",
                zIndex: 9999,
              }}
            >
              {caption.text}
            </div>
          )}

          {outfit.garments.length > 0 && items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/60 font-sans text-xs uppercase tracking-widest">
              Loading garments…
            </div>
          )}
        </div>
      </main>

      {/* Add from Wardrobe */}
      <Dialog open={isWardrobeOpen} onOpenChange={setIsWardrobeOpen}>
        <DialogContent className="max-w-2xl w-full rounded-none border-border/60 p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <div>
              <h2 className="font-serif text-xl font-medium text-foreground">Add from Wardrobe</h2>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Pull in any other piece from your collection.
              </p>
            </div>
            <button
              onClick={() => setIsWardrobeOpen(false)}
              className="w-7 h-7 flex items-center justify-center border border-border/40 hover:bg-accent/40 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loadingGarments ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-accent/20 animate-pulse" />
                ))}
              </div>
            ) : availableGarments.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-muted-foreground font-sans">Every piece is already on the canvas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {availableGarments.map((garment) => (
                  <button
                    key={garment.id}
                    onClick={() => handleAddGarment(garment)}
                    className="group flex flex-col border border-border/40 hover:border-primary/60 transition-all bg-card/60 hover:bg-accent/20 text-left cursor-pointer"
                  >
                    <div className="aspect-square w-full bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-2 overflow-hidden border-b border-border/20">
                      <img
                        src={getDisplayImageUrl(garment)}
                        alt={garment.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="px-2 py-1.5 min-w-0">
                      <p className="font-serif text-xs text-foreground truncate">{garment.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground border border-border/20 px-6 py-4 shadow-xl select-none font-sans font-medium text-xs flex items-center gap-2 transition-all">
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-4 hover:opacity-80 transition-opacity p-0.5"
            aria-label="Dismiss toast"
          >
            <span className="font-sans font-bold">✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
