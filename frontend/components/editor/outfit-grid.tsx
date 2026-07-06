"use client";

import * as React from "react";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutfitCard } from "./outfit-card";
import { Outfit } from "@/types";

interface OutfitGridProps {
  outfits: Outfit[];
  loading?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  onOutfitClick?: (outfit: Outfit) => void;
  onCreateOutfitClick?: () => void;
  onExport?: (outfit: Outfit) => void;
  onShare?: (outfit: Outfit) => void;
  onRevoke?: (outfit: Outfit) => void;
  onFlatLay?: (outfit: Outfit) => void;
}

export function OutfitGrid({
  outfits = [],
  loading = false,
  onFavoriteToggle,
  onOutfitClick,
  onCreateOutfitClick,
  onExport,
  onShare,
  onRevoke,
  onFlatLay,
}: OutfitGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="flex flex-col border border-border/20 bg-card/60 animate-pulse rounded-none"
          >
            <div className="aspect-4/5 bg-accent/20 w-full" />
            <div className="flex flex-col p-5 gap-3">
              <div className="h-4 bg-accent/20 w-2/3" />
              <div className="h-3 bg-accent/20 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border/60 p-16 text-center bg-card/25 select-none rounded-none min-h-100">
        <div className="bg-accent/40 text-primary p-4 rounded-none mb-6">
          <Sparkles className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground tracking-tight">
          No Curated Combinations
        </h2>
        <p className="font-sans text-xs text-muted-foreground max-w-sm mx-auto mt-3 leading-relaxed">
          Create your first outfit from pieces you already own.
        </p>
        <Button
          onClick={onCreateOutfitClick}
          className="mt-8 px-6 py-6 text-xs font-semibold uppercase tracking-wider rounded-none shadow-md group"
        >
          Create Outfit
          <Plus className="w-4 h-4 ml-2 transition-transform group-hover:rotate-90 duration-300" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in">
      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          onFavoriteToggle={onFavoriteToggle}
          onOutfitClick={onOutfitClick}
          onExport={onExport}
          onShare={onShare}
          onRevoke={onRevoke}
          onFlatLay={onFlatLay}
        />
      ))}
    </div>
  );
}
