"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { OutfitPlan } from "@/types";

interface PlannerDayCardProps {
  plan: OutfitPlan;
  onRemove: (planId: string) => void;
  onChangeOutfit: (planId: string, date: string) => void;
}

export function PlannerDayCard({ plan, onRemove, onChangeOutfit }: PlannerDayCardProps) {
  const garments = plan.outfit.garments.map((g) => g.garment).slice(0, 3);

  const renderThumbnail = () => {
    if (garments.length === 0) {
      return <div className="w-full h-full bg-accent/20" />;
    }

    if (garments.length === 1) {
      return (
        <div className="w-full h-full bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-2">
          <img
            src={getDisplayImageUrl(garments[0])}
            alt={garments[0].name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full relative bg-[#fcf9f5] dark:bg-[#151513] overflow-hidden">
        {garments.slice(0, 3).map((g, i) => {
          const positions = [
            "absolute left-[5%] top-[8%] w-[42%] h-[80%] -rotate-6 opacity-80",
            "absolute right-[5%] top-[8%] w-[42%] h-[80%] rotate-6 opacity-80",
            "absolute left-[29%] top-[4%] w-[42%] h-[80%] z-10",
          ];
          return (
            <div key={g.id} className={cn("flex items-center justify-center", positions[i])}>
              <img
                src={getDisplayImageUrl(g)}
                alt={g.name}
                className="max-h-full max-w-full object-contain drop-shadow-sm"
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col border border-border/50 bg-card/80 group">
      {/* Collage */}
      <div className="aspect-square w-full overflow-hidden border-b border-border/20 relative">
        {renderThumbnail()}
        {/* Hover actions */}
        <div className="absolute top-1.5 right-1.5 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onChangeOutfit(plan.id, plan.plannedDate); }}
            className="w-6 h-6 flex items-center justify-center bg-card/90 border border-border/50 hover:bg-accent/40 transition-colors"
            aria-label="Change outfit"
          >
            <RefreshCw className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(plan.id); }}
            className="w-6 h-6 flex items-center justify-center bg-card/90 border border-border/50 hover:bg-destructive/20 transition-colors"
            aria-label="Remove plan"
          >
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2 flex flex-col gap-1 min-w-0">
        <p className="font-serif text-sm font-medium text-foreground truncate leading-snug">
          {plan.outfit.name}
        </p>
        {plan.occasion && (
          <span className="self-start px-1.5 py-px bg-muted/40 border border-border/40 text-[9px] uppercase tracking-widest font-medium text-muted-foreground font-sans">
            {plan.occasion}
          </span>
        )}
      </div>
    </div>
  );
}
