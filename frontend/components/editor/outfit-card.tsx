"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { Heart, Sparkles, Download, Share2, Link2Off } from "lucide-react";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Outfit } from "@/types";

interface OutfitCardProps {
  outfit: Outfit;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  onOutfitClick?: (outfit: Outfit) => void;
  onExport?: (outfit: Outfit) => void;
  onShare?: (outfit: Outfit) => void;
  onRevoke?: (outfit: Outfit) => void;
}

function formatLastWorn(wears?: { id: string; wornAt: string }[]) {
  if (!wears || wears.length === 0) {
    return "Never worn";
  }

  const lastWornDate = new Date(wears[0].wornAt);
  const now = new Date();

  const dDate = new Date(lastWornDate.getFullYear(), lastWornDate.getMonth(), lastWornDate.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dNow.getTime() - dDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Last worn Today";
  if (diffDays === 1) return "Last worn Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `Last worn ${diffDays} days ago`;

  return `Last worn ${lastWornDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function OutfitCard({
  outfit,
  onFavoriteToggle,
  onOutfitClick,
  onExport,
  onShare,
  onRevoke,
}: OutfitCardProps) {
  const garmentsList = outfit.garments.map((g) => g.garment);
  const garmentCount = garmentsList.length;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(outfit.id, !outfit.isFavorite);
  };

  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport?.(outfit);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(outfit);
  };

  const handleRevokeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRevoke?.(outfit);
  };

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
            src={getDisplayImageUrl(garmentsList[0])}
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
              src={getDisplayImageUrl(garmentsList[0])}
              alt={garmentsList[0].name}
              className="max-h-full max-w-full object-contain filter drop-shadow-md"
            />
          </div>
          <div className="absolute right-[15%] w-[45%] h-[80%] flex items-center justify-center transform rotate-6 z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-[1.04]">
            <img
              src={getDisplayImageUrl(garmentsList[1])}
              alt={garmentsList[1].name}
              className="max-h-full max-w-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>
      );
    }

    const displayGarments = garmentsList.slice(0, 3);
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-4">
        <div className="absolute left-[10%] w-[40%] h-[70%] flex items-center justify-center transform -rotate-12 translate-y-4 opacity-80 transition-transform duration-300 group-hover:-rotate-18 group-hover:-translate-x-1">
          <img
            src={getDisplayImageUrl(displayGarments[0])}
            alt={displayGarments[0].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div className="absolute right-[10%] w-[40%] h-[70%] flex items-center justify-center transform rotate-12 translate-y-4 opacity-80 transition-transform duration-300 group-hover:rotate-18 group-hover:translate-x-1">
          <img
            src={getDisplayImageUrl(displayGarments[1])}
            alt={displayGarments[1].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div className="absolute w-[50%] h-[80%] flex items-center justify-center transform -translate-y-2 z-10 transition-all duration-300 group-hover:scale-[1.05] group-hover:-translate-y-4">
          <img
            src={getDisplayImageUrl(displayGarments[2])}
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
      <div className="aspect-4/5 w-full border-b border-border/20 overflow-hidden relative">
        {renderCollage()}

        {/* Favorite Heart Toggle */}
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

        {/* Export + Share actions — visible on hover */}
        {(onExport || onShare || onRevoke) && (
          <div className="absolute top-4 right-14 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onExport && (
              <button
                onClick={handleExportClick}
                className="w-8 h-8 rounded-none border border-border/60 bg-card/90 backdrop-blur-xs flex items-center justify-center hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
                aria-label="Export as image"
                title="Export as PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            {onShare && (
              <button
                onClick={handleShareClick}
                className={cn(
                  "w-8 h-8 rounded-none border bg-card/90 backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer shadow-sm",
                  outfit.shareToken
                    ? "border-primary/60 text-primary hover:bg-primary/10"
                    : "border-border/60 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
                aria-label="Share outfit"
                title={outfit.shareToken ? "Copy share link" : "Share outfit"}
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onRevoke && outfit.shareToken && (
              <button
                onClick={handleRevokeClick}
                className="w-8 h-8 rounded-none border border-destructive/40 bg-card/90 backdrop-blur-xs flex items-center justify-center hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-all cursor-pointer shadow-sm"
                aria-label="Revoke share link"
                title="Revoke share link"
              >
                <Link2Off className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Garment count badge */}
        <div className="absolute bottom-4 left-4 z-20 px-2 py-1 bg-card/90 backdrop-blur-xs border border-border/40 text-[9px] font-sans uppercase font-bold tracking-wider text-muted-foreground">
          {garmentCount} {garmentCount === 1 ? "piece" : "pieces"}
        </div>

        {/* AI Generated badge */}
        {outfit.isAiGenerated && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span className="text-[8px] font-sans font-bold uppercase tracking-wider">AI</span>
          </div>
        )}

        {/* Shared indicator badge */}
        {outfit.shareToken && (
          <div className="absolute bottom-4 right-4 z-20 px-2 py-1 bg-primary/10 border border-primary/30 text-[9px] font-sans uppercase font-bold tracking-wider text-primary">
            Shared
          </div>
        )}
      </div>

      {/* Outfit Title & Info */}
      <div className="flex flex-col p-5 gap-1.5 bg-card/60 backdrop-blur-xs">
        <h3 className="font-serif text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors truncate">
          {outfit.name}
        </h3>
        {outfit.notes ? (
          <p className="text-xs text-muted-foreground line-clamp-1 font-sans italic mb-1">
            {outfit.notes}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 font-sans tracking-wide mb-1">
            {outfit.isAiGenerated ? "AI Generated" : "Manual Curation"}
          </p>
        )}
        <div className="text-[10px] text-muted-foreground/80 font-sans uppercase tracking-wider font-semibold mt-0.5 border-t border-border/10 pt-1.5">
          {formatLastWorn(outfit.wears)}
        </div>
        {outfit.occasion && (
          <div className="self-start px-2 py-0.5 bg-muted/40 text-muted-foreground border border-border/50 text-[10px] uppercase tracking-widest font-medium font-sans">
            {outfit.occasion}
          </div>
        )}
      </div>
    </div>
  );
}
