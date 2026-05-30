"use client";

import * as React from "react";
import { Sparkles, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GarmentCard, Garment } from "./garment-card";

interface WardrobeGridProps {
  garments: Garment[];
  loading: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => Promise<void> | void;
  onUploadClick?: () => void;
  onGarmentClick?: (garment: Garment) => void;
}

export function WardrobeGrid({
  garments,
  loading,
  onFavoriteToggle,
  onUploadClick,
  onGarmentClick,
}: WardrobeGridProps) {
  // Render loading skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 w-full">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="bg-card border border-border/30 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="aspect-[4/5] bg-muted/30 w-full" />
            {/* Text details placeholders */}
            <div className="p-5 flex flex-col flex-1 gap-3">
              <div className="flex flex-col gap-2">
                {/* Title */}
                <div className="h-5 bg-muted/40 w-3/4 rounded-sm" />
                {/* Notes (2 lines) */}
                <div className="h-3 bg-muted/30 w-full rounded-sm" />
                <div className="h-3 bg-muted/30 w-5/6 rounded-sm" />
              </div>
              {/* Tags */}
              <div className="flex gap-1.5 mt-auto pt-2 border-t border-border/10">
                <div className="h-4 bg-muted/30 w-12 rounded-sm" />
                <div className="h-4 bg-muted/30 w-16 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render empty state
  if (garments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-border/60 rounded-2xl bg-card/20 text-center max-w-xl mx-auto w-full">
        <div className="bg-accent/40 text-primary p-4 rounded-full mb-4">
          <Shirt className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
          Your digital wardrobe starts here
        </h2>
        <p className="font-sans text-sm text-muted-foreground mt-3 mb-6 max-w-sm leading-relaxed">
          Upload images of your favorite garments. Our AI system will automatically remove backgrounds and tag them to construct your virtual workspace.
        </p>
        <Button
          onClick={onUploadClick}
          className="rounded-none px-6 py-6 text-sm font-medium tracking-wide shadow-md group animate-none"
        >
          Upload First Garment
          <Sparkles className="w-4 h-4 ml-2 transition-transform group-hover:scale-110" />
        </Button>
      </div>
    );
  }

  // Render wardrobe grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 w-full">
      {garments.map((garment) => (
        <GarmentCard
          key={garment.id}
          garment={garment}
          onFavoriteToggle={onFavoriteToggle}
          onCardClick={onGarmentClick}
        />
      ))}
    </div>
  );
}
