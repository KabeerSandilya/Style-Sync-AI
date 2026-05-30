"use client";

import * as React from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Garment } from "@/types";
export type { Garment };

interface GarmentCardProps {
  garment: Garment;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => Promise<void> | void;
  onCardClick?: (garment: Garment) => void;
}

export function GarmentCard({ garment, onFavoriteToggle, onCardClick }: GarmentCardProps) {
  const [isFavoriting, setIsFavoriting] = React.useState(false);

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
      onClick={() => onCardClick?.(garment)}
      className={cn(
        "group bg-card border border-border/30 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col h-full relative",
        onCardClick && "cursor-pointer"
      )}
    >
      {/* Garment Image Area */}
      <div className="aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] relative flex items-center justify-center p-6 border-b border-border/10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={garment.imageUrl}
          alt={garment.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />

        {/* Favorite Icon Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={isFavoriting}
          className={cn(
            "absolute top-4 right-4 bg-background/80 hover:bg-background border border-border/40 p-2 rounded-full hover:scale-105 transition-all shadow-xs cursor-pointer z-10 flex items-center justify-center size-9",
            garment.isFavorite && "bg-background/90"
          )}
          aria-label={garment.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavoriting ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Heart
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                garment.isFavorite 
                  ? "fill-primary text-primary" 
                  : "text-muted-foreground group-hover/btn:text-foreground"
              )}
            />
          )}
        </button>

        {/* Category Label Overlay */}
        <span className="absolute bottom-4 left-4 bg-background/85 backdrop-blur-xs text-[10px] uppercase tracking-wider font-semibold text-primary px-2.5 py-1 border border-border/30 rounded-sm select-none">
          {garment.category}
        </span>


      </div>

      {/* Garment Details Area */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {garment.name}
          </h3>
          {garment.notes ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {garment.notes}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/40 italic select-none">
              No descriptions added.
            </p>
          )}
        </div>

        {/* Metadata & Tags Block */}
        {(garment.isProcessed || (garment.tags && garment.tags.length > 0)) && (
          <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-border/10">
            {/* AI Metadata Tags */}
            {garment.isProcessed && (
              <div className="flex flex-wrap gap-1">
                {garment.subcategory && garment.subcategory !== "Unknown" && (
                  <span className="bg-primary/5 text-primary px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold rounded-xs border border-primary/15">
                    {garment.subcategory}
                  </span>
                )}
                {garment.style && garment.style !== "Unknown" && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold rounded-xs border border-border/20">
                    {garment.style}
                  </span>
                )}
                {garment.material && garment.material !== "Unknown" && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold rounded-xs border border-border/20">
                    {garment.material}
                  </span>
                )}
                {garment.season && garment.season !== "Unknown" && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold rounded-xs border border-border/20">
                    {garment.season}
                  </span>
                )}
              </div>
            )}

            {/* Custom User Tags */}
            {garment.tags && garment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {garment.tags.map((tag) => (
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
      </div>
    </div>
  );
}
