"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { ChevronsUp, ChevronsDown, FlipHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposableImageItem } from "@/components/canvas/composable-image-item";
import { FLAT_LAY_CANVAS_SIZE, type FlatLayItem } from "@/lib/export-flat-lay";

interface FlatLayItemViewProps {
  item: FlatLayItem;
  scale: number;
  isSelected: boolean;
  canBringForward: boolean;
  canSendBack: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Pick<FlatLayItem, "x" | "y" | "width">>) => void;
  onBringForward: () => void;
  onSendBack: () => void;
  onFlip: () => void;
}

export function FlatLayItemView({
  item,
  scale,
  isSelected,
  canBringForward,
  canSendBack,
  onSelect,
  onChange,
  onBringForward,
  onSendBack,
  onFlip,
}: FlatLayItemViewProps) {
  return (
    <ComposableImageItem
      x={item.x}
      y={item.y}
      width={item.width}
      aspectRatio={item.aspectRatio}
      zIndex={item.zIndex}
      selected={isSelected}
      scale={scale}
      canvasWidth={FLAT_LAY_CANVAS_SIZE}
      canvasHeight={FLAT_LAY_CANVAS_SIZE}
      onChange={onChange}
      onSelect={onSelect}
    >
      {isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-9 left-0 flex items-center gap-1 bg-card border border-border/60 shadow-md px-1 py-1 z-50"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendBack();
            }}
            disabled={!canSendBack}
            title="Send backward"
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBringForward();
            }}
            disabled={!canBringForward}
            title="Bring forward"
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlip();
            }}
            title="Flip horizontally"
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 cursor-pointer"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "w-full h-full cursor-grab active:cursor-grabbing",
          isSelected && "outline-2 outline-primary outline-offset-2"
        )}
      >
        <img
          src={item.imageUrl}
          alt=""
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
          style={{ transform: item.flippedX ? "scaleX(-1)" : undefined }}
        />
      </div>
    </ComposableImageItem>
  );
}
