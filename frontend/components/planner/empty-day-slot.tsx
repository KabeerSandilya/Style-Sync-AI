"use client";

import * as React from "react";
import { Plus, Sparkles } from "lucide-react";

interface EmptyDaySlotProps {
  isPast: boolean;
  isSuggesting: boolean;
  onPickOutfit: () => void;
  onSuggest: () => void;
}

export function EmptyDaySlot({ isPast, isSuggesting, onPickOutfit, onSuggest }: EmptyDaySlotProps) {
  if (isPast) {
    return (
      <div className="aspect-square w-full border border-dashed border-border/30 flex items-center justify-center">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-sans font-medium select-none">
          No outfit
        </span>
      </div>
    );
  }

  if (isSuggesting) {
    return (
      <div className="aspect-square w-full border border-dashed border-primary/40 flex flex-col items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-primary/60 animate-pulse" />
        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-sans font-medium select-none">
          Finding a look…
        </span>
      </div>
    );
  }

  return (
    <div className="aspect-square w-full border border-dashed border-border/40 hover:border-border/70 transition-colors flex flex-col items-center justify-center gap-1.5 group/slot">
      <button
        onClick={onPickOutfit}
        className="flex items-center gap-1 px-2.5 py-1.5 border border-border/40 bg-card/60 hover:bg-accent/30 hover:border-border/80 transition-all text-[9px] uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground font-sans"
      >
        <Plus className="w-2.5 h-2.5" />
        Pick outfit
      </button>
      <button
        onClick={onSuggest}
        className="flex items-center gap-1 px-2.5 py-1.5 border border-border/40 bg-card/60 hover:bg-primary/10 hover:border-primary/30 transition-all text-[9px] uppercase tracking-widest font-medium text-muted-foreground hover:text-primary font-sans"
      >
        <Sparkles className="w-2.5 h-2.5" />
        Suggest
      </button>
    </div>
  );
}
