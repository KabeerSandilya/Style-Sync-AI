"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Outfit } from "@/types";

interface OutfitCardProps {
  outfit: Outfit;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  onOutfitClick?: (outfit: Outfit) => void;
}

export function OutfitCard({
  outfit,
  onFavoriteToggle,
  onOutfitClick,
}: OutfitCardProps) {
  const garmentsList = outfit.garments.map((g) => g.garment);
  const garmentCount = garmentsList.length;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(outfit.id, !outfit.isFavorite);
  };

  // Render the layered flat-lay collage of garment images
  const renderCollage = () => {
    if (garmentCount === 0) {
      return (
        <div className="w-full h-full bg-accent/20 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Sparkles className="w-6 h-6 stroke-[1.5]" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Empty Combination</span>
        </div>
      );
    }

    if (garmentCount === 1) {
      return (
        <div className="w-full h-full p-4 flex items-center justify-center bg-[#fcf9f5] dark:bg-[#151513]">
          <img
            src={garmentsList[0].imageUrl}
            alt={garmentsList[0].name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      );
    }

    if (garmentCount === 2) {
      return (
        <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-4">
          <div className="absolute left-[15%] w-[45%] h-[80%] flex items-center justify-center transform -rotate-6 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-[1.02]">
            <img
              src={garmentsList[0].imageUrl}
              alt={garmentsList[0].name}
              className="max-h-full max-w-full object-contain filter drop-shadow-md"
            />
          </div>
          <div className="absolute right-[15%] w-[45%] h-[80%] flex items-center justify-center transform rotate-6 z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-[1.04]">
            <img
              src={garmentsList[1].imageUrl}
              alt={garmentsList[1].name}
              className="max-h-full max-w-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>
      );
    }

    // 3 or more garments
    const displayGarments = garmentsList.slice(0, 3);
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-4">
        {/* First Garment - Bottom Layer Left */}
        <div className="absolute left-[10%] w-[40%] h-[70%] flex items-center justify-center transform -rotate-12 translate-y-4 opacity-80 transition-transform duration-300 group-hover:-rotate-18 group-hover:translate-x-[-4px]">
          <img
            src={displayGarments[0].imageUrl}
            alt={displayGarments[0].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        {/* Second Garment - Bottom Layer Right */}
        <div className="absolute right-[10%] w-[40%] h-[70%] flex items-center justify-center transform rotate-12 translate-y-4 opacity-80 transition-transform duration-300 group-hover:rotate-18 group-hover:translate-x-[4px]">
          <img
            src={displayGarments[1].imageUrl}
            alt={displayGarments[1].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        {/* Third Garment - Top Layer Centered */}
        <div className="absolute w-[50%] h-[80%] flex items-center justify-center transform -translate-y-2 z-10 transition-all duration-300 group-hover:scale-[1.05] group-hover:-translate-y-4">
          <img
            src={displayGarments[2].imageUrl}
            alt={displayGarments[2].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-xl"
          />
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onOutfitClick?.(outfit)}
      className="group relative flex flex-col bg-card border border-border/40 hover:border-border/80 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md select-none rounded-none"
    >
      {/* Visual Collage Area */}
      <div className="aspect-[4/5] w-full border-b border-border/20 overflow-hidden relative">
        {renderCollage()}

        {/* Favorite Heart Toggle Overlay */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-none border border-border/60 bg-card/90 backdrop-blur-xs flex items-center justify-center hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
          aria-label={outfit.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-transform group-hover/btn:scale-110",
              outfit.isFavorite ? "fill-primary text-primary" : "text-foreground/80"
            )}
          />
        </button>

        {/* Garment count badge overlay */}
        <div className="absolute bottom-4 left-4 z-20 px-2 py-1 bg-card/90 backdrop-blur-xs border border-border/40 text-[9px] font-sans uppercase font-bold tracking-wider text-muted-foreground">
          {garmentCount} {garmentCount === 1 ? "piece" : "pieces"}
        </div>
      </div>

      {/* Outfit Title & Info */}
      <div className="flex flex-col p-5 gap-1.5 bg-card/60 backdrop-blur-xs">
        <h3 className="font-serif text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors truncate">
          {outfit.name}
        </h3>
        {outfit.notes ? (
          <p className="text-xs text-muted-foreground line-clamp-1 font-sans italic">
            {outfit.notes}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 font-sans tracking-wide">
            Manual Curation
          </p>
        )}
      </div>
    </div>
  );
}
