"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { ChevronsUp, ChevronsDown, FlipHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLAT_LAY_CANVAS_SIZE, itemHeight, type FlatLayItem } from "@/lib/export-flat-lay";

const MIN_WIDTH = 60;

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
  const dragState = React.useRef<{ startX: number; startY: number; itemX: number; itemY: number } | null>(null);
  const resizeState = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, itemX: item.x, itemY: item.y };
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const { startX, startY, itemX, itemY } = dragState.current;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    const height = itemHeight(item);
    const nextX = Math.min(Math.max(0, itemX + dx), FLAT_LAY_CANVAS_SIZE - item.width);
    const nextY = Math.min(Math.max(0, itemY + dy), FLAT_LAY_CANVAS_SIZE - height);
    onChange({ x: nextX, y: nextY });
  };

  const handleDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragState.current = null;
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeState.current = { startX: e.clientX, startWidth: item.width };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeState.current) return;
    e.stopPropagation();
    const { startX, startWidth } = resizeState.current;
    const dx = (e.clientX - startX) / scale;
    const maxWidth = FLAT_LAY_CANVAS_SIZE - item.x;
    const nextWidth = Math.min(Math.max(MIN_WIDTH, startWidth + dx), maxWidth);
    onChange({ width: nextWidth });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resizeState.current = null;
  };

  const height = itemHeight(item);

  return (
    <div
      className="absolute touch-none select-none"
      style={{
        left: item.x * scale,
        top: item.y * scale,
        width: item.width * scale,
        height: height * scale,
        zIndex: item.zIndex,
      }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onPointerCancel={handleDragPointerUp}
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

      {isSelected && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary border border-card cursor-nwse-resize touch-none"
          title="Resize"
        />
      )}
    </div>
  );
}
