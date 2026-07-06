"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { Star, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LookBookEntry } from "@/types";

interface LookBookCardProps {
  entry: LookBookEntry;
  onClick?: (entry: LookBookEntry) => void;
}

export function LookBookCard({ entry, onClick }: LookBookCardProps) {
  const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      onClick={() => onClick?.(entry)}
      className="group relative flex flex-col bg-card border border-border/40 hover:border-border/80 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md select-none rounded-none"
    >
      <div className="aspect-4/5 w-full border-b border-border/20 overflow-hidden relative bg-[#fcf9f5] dark:bg-[#151513]">
        {entry.photoUrl ? (
          <img
            src={entry.photoUrl}
            alt={entry.outfit?.name ?? "Look Book entry"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
          </div>
        )}

        <div className="absolute top-4 left-4 z-20 flex items-center gap-0.5 bg-card/90 backdrop-blur-xs border border-border/40 px-2 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-2.5 h-2.5",
                i < entry.rating ? "fill-primary text-primary" : "text-muted-foreground/40"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col p-5 gap-1.5 bg-card/60 backdrop-blur-xs">
        <h3 className="font-serif text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors truncate">
          {entry.outfit?.name ?? "Unlinked look"}
        </h3>
        <p className="text-[10px] text-muted-foreground/80 font-sans uppercase tracking-wider font-semibold">
          {formattedDate}
        </p>
        {entry.mood.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {entry.mood.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-muted/40 text-muted-foreground border border-border/50 text-[9px] uppercase tracking-widest font-medium font-sans"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
