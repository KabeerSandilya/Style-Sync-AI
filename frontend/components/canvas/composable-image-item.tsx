"use client";

import * as React from "react";

export interface ComposableImageItemProps {
  x: number;
  y: number;
  width: number;
  aspectRatio: number; // naturalHeight / naturalWidth — height is derived, never re-measured mid-drag
  zIndex: number;
  selected: boolean;
  scale: number; // rendered px per canvas-space px
  canvasWidth: number;
  canvasHeight: number;
  minWidth?: number;
  onChange: (patch: Partial<{ x: number; y: number; width: number }>) => void;
  onSelect: () => void;
  children?: React.ReactNode; // rendered <img>/toolbar content; this wrapper owns only position/size/selection + pointer handlers
}

export function composableItemHeight(width: number, aspectRatio: number): number {
  return width * aspectRatio;
}

export function ComposableImageItem({
  x,
  y,
  width,
  aspectRatio,
  zIndex,
  selected,
  scale,
  canvasWidth,
  canvasHeight,
  minWidth = 60,
  onChange,
  onSelect,
  children,
}: ComposableImageItemProps) {
  const dragState = React.useRef<{ startX: number; startY: number; itemX: number; itemY: number } | null>(null);
  const resizeState = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, itemX: x, itemY: y };
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const { startX, startY, itemX, itemY } = dragState.current;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    const height = composableItemHeight(width, aspectRatio);
    const nextX = Math.min(Math.max(0, itemX + dx), canvasWidth - width);
    const nextY = Math.min(Math.max(0, itemY + dy), canvasHeight - height);
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
    resizeState.current = { startX: e.clientX, startWidth: width };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeState.current) return;
    e.stopPropagation();
    const { startX, startWidth } = resizeState.current;
    const dx = (e.clientX - startX) / scale;
    const maxWidth = canvasWidth - x;
    const nextWidth = Math.min(Math.max(minWidth, startWidth + dx), maxWidth);
    onChange({ width: nextWidth });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resizeState.current = null;
  };

  const height = composableItemHeight(width, aspectRatio);

  return (
    <div
      className="absolute touch-none select-none"
      style={{ left: x * scale, top: y * scale, width: width * scale, height: height * scale, zIndex }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onPointerCancel={handleDragPointerUp}
    >
      {children}

      {selected && (
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
