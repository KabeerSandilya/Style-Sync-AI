"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { X } from "lucide-react";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Outfit } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const OCCASIONS = ['Work', 'Casual', 'Smart Casual', 'Formal', 'Active', 'Date Night'] as const;

interface OutfitPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (outfit: Outfit) => void;
}

export function OutfitPickerSheet({ open, onClose, onSelect }: OutfitPickerSheetProps) {
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/outfits")
      .then((r) => r.json())
      .then((d) => setOutfits(d.data ?? []))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = filter
    ? outfits.filter((o) => o.occasion === filter)
    : outfits;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full rounded-none border-border/60 p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div>
            <h2 className="font-serif text-xl font-medium text-foreground">Pick an Outfit</h2>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Select an outfit to plan for this day
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-border/40 hover:bg-accent/40 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Occasion filter pills */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border/20 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "shrink-0 px-3 py-1 border text-[9px] uppercase tracking-widest font-medium font-sans transition-colors",
              !filter
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            )}
          >
            All
          </button>
          {OCCASIONS.map((occ) => (
            <button
              key={occ}
              onClick={() => setFilter(filter === occ ? null : occ)}
              className={cn(
                "shrink-0 px-3 py-1 border text-[9px] uppercase tracking-widest font-medium font-sans transition-colors",
                filter === occ
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
              )}
            >
              {occ}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-accent/20 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground font-sans">No outfits found.</p>
              <p className="text-xs text-muted-foreground/60 font-sans">
                Create an outfit in the Wardrobe Studio first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((outfit) => {
                const garments = outfit.garments.map((g) => g.garment).slice(0, 1);
                return (
                  <button
                    key={outfit.id}
                    onClick={() => { onSelect(outfit); onClose(); }}
                    className="group flex flex-col border border-border/40 hover:border-primary/60 transition-all bg-card/60 hover:bg-accent/20 text-left"
                  >
                    <div className="aspect-square w-full bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-2 overflow-hidden border-b border-border/20">
                      {garments[0] ? (
                        <img
                          src={getDisplayImageUrl(garments[0])}
                          alt={garments[0].name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-accent/20" />
                      )}
                    </div>
                    <div className="px-2 py-1.5 min-w-0">
                      <p className="font-serif text-xs text-foreground truncate">{outfit.name}</p>
                      {outfit.occasion && (
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-sans mt-0.5 truncate">
                          {outfit.occasion}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
