"use client";

import * as React from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn, getDisplayImageUrl } from "@/lib/utils";

import { Garment } from "@/types";
export type { Garment };

function formatLastWorn(lastWornAt?: string | null) {
  if (!lastWornAt) {
    return "Never worn";
  }

  const lastWornDate = new Date(lastWornAt);
  const now = new Date();

  // Strip time parts to compare dates only
  const dDate = new Date(lastWornDate.getFullYear(), lastWornDate.getMonth(), lastWornDate.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dNow.getTime() - dDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Last worn Today";
  } else if (diffDays === 1) {
    return "Last worn Yesterday";
  } else if (diffDays > 1 && diffDays <= 7) {
    return `Last worn ${diffDays} days ago`;
  } else {
    const formatted = lastWornDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `Last worn ${formatted}`;
  }
}

interface GarmentCardProps {
  garment: Garment;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => Promise<void> | void;
  onCardClick?: (garment: Garment) => void;
}

const POLL_INTERVAL_MS = 6000;
const POLL_TIMEOUT_MS = 90_000;

export function GarmentCard({ garment, onFavoriteToggle, onCardClick }: GarmentCardProps) {
  const [isFavoriting, setIsFavoriting] = React.useState(false);
  const [liveGarment, setLiveGarment] = React.useState(garment);

  // Sync with parent prop changes (e.g. after wardrobe refresh)
  React.useEffect(() => {
    setLiveGarment(garment);
  }, [garment]);

  // Poll for processing completion when bg removal is pending
  React.useEffect(() => {
    const isPending = !liveGarment.processedImageUrl && !liveGarment.bgRemovedAt;
    if (!isPending) return;

    const startedAt = Date.now();

    const poll = async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        return;
      }
      try {
        const res = await fetch(`/api/garments/${liveGarment.id}/status`);
        const data = await res.json();
        if (data.success && data.data) {
          const updated = data.data;
          if (updated.processedImageUrl || updated.bgRemovedAt || updated.isProcessed) {
            setLiveGarment((prev) => ({ ...prev, ...updated }));
            clearInterval(timer);
          }
        }
      } catch {
        // silent — don't interrupt UX
      }
    };

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveGarment.id, liveGarment.processedImageUrl, liveGarment.bgRemovedAt]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onFavoriteToggle || isFavoriting) return;

    setIsFavoriting(true);
    try {
      await onFavoriteToggle(garment.id, !garment.isFavorite);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <div
      onClick={() => onCardClick?.(liveGarment)}
      className={cn(
        "group bg-card border border-border/30 rounded-none overflow-hidden shadow-xs hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col h-full relative",
        onCardClick && "cursor-pointer"
      )}
    >
      {/* Garment Image Area */}
      <div className="aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] relative flex items-center justify-center p-6 border-b border-border/10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getDisplayImageUrl(liveGarment)}
          alt={liveGarment.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />

        {/* Processing indicator — auto-clears via polling when bg removal finishes */}
        {!liveGarment.processedImageUrl && !liveGarment.bgRemovedAt && (
          <span className="absolute bottom-4 right-4 flex items-center gap-1 bg-background/80 backdrop-blur-xs border border-border/30 px-2 py-0.5 rounded-sm select-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Processing</span>
          </span>
        )}

        {/* Favorite Icon Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={isFavoriting}
          className={cn(
            "absolute top-4 right-4 bg-background/80 hover:bg-background border border-border/40 p-2 rounded-none hover:scale-105 transition-all shadow-xs cursor-pointer z-10 flex items-center justify-center size-9",
            liveGarment.isFavorite && "bg-background/90"
          )}
          aria-label={liveGarment.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavoriting ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Heart
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                liveGarment.isFavorite
                  ? "fill-primary text-primary"
                  : "text-muted-foreground group-hover/btn:text-foreground"
              )}
            />
          )}
        </button>

        {/* Category Label Overlay */}
        <span className="absolute bottom-4 left-4 bg-background/85 backdrop-blur-xs text-[10px] uppercase tracking-wider font-semibold text-primary px-2.5 py-1 border border-border/30 rounded-sm select-none">
          {liveGarment.category}
        </span>
      </div>

      {/* Garment Details Area */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {liveGarment.name}
          </h3>
          {liveGarment.notes ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {liveGarment.notes}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/40 italic select-none">
              No descriptions added.
            </p>
          )}
        </div>

        {/* Metadata & Tags Block */}
        {(liveGarment.isProcessed || (liveGarment.tags && liveGarment.tags.length > 0)) && (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/10">
            {/* AI Metadata Tags */}
            {liveGarment.isProcessed && (
              <div className="flex flex-wrap gap-1">
                {liveGarment.subcategory && liveGarment.subcategory !== "Unknown" && (
                  <span className="bg-primary/5 text-primary px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold rounded-xs border border-primary/15">
                    {liveGarment.subcategory}
                  </span>
                )}
                {liveGarment.style && liveGarment.style !== "Unknown" && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold rounded-xs border border-border/20">
                    {liveGarment.style}
                  </span>
                )}
                {liveGarment.material && liveGarment.material !== "Unknown" && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold rounded-xs border border-border/20">
                    {liveGarment.material}
                  </span>
                )}
                {liveGarment.season && liveGarment.season !== "Unknown" && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold rounded-xs border border-border/20">
                    {liveGarment.season}
                  </span>
                )}
              </div>
            )}

            {/* Custom User Tags */}
            {liveGarment.tags && liveGarment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {liveGarment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-accent/40 text-accent-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-medium rounded-xs border border-accent/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Last Worn Metadata */}
        <div className="text-[10px] text-muted-foreground/80 font-sans uppercase tracking-wider font-semibold mt-auto pt-2.5 border-t border-border/10">
          {formatLastWorn(liveGarment.lastWornAt)}
        </div>
      </div>
    </div>
  );
}
