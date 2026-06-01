"use client";

import * as React from "react";
import { Outfit } from "@/types";

export interface HistoryItemProps {
  id: string;
  wornAt: string;
  outfit: Outfit;
  onClick?: () => void;
}

export function formatWornDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  
  // Strip time parts to compare dates only
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dNow.getTime() - dDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays === 2) {
    return "2 days ago";
  } else if (diffDays > 2 && diffDays <= 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export function HistoryItem({
  wornAt,
  outfit,
  onClick,
}: HistoryItemProps) {
  const garmentsList = outfit.garments.map((g) => g.garment).filter(Boolean);
  const garmentCount = garmentsList.length;

  const renderMiniCollage = () => {
    if (garmentCount === 0) {
      return (
        <div className="w-12 h-14 bg-muted/20 border border-border/20 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-muted-foreground">Empty</span>
        </div>
      );
    }

    if (garmentCount === 1) {
      return (
        <div className="w-12 h-14 bg-[#fcf9f5] dark:bg-[#151513] border border-border/20 flex items-center justify-center p-1 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={garmentsList[0].imageUrl}
            alt={garmentsList[0].name}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // Stacked small thumbnail
    return (
      <div className="w-12 h-14 bg-[#fcf9f5] dark:bg-[#151513] border border-border/20 relative overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={garmentsList[0].imageUrl}
          alt={garmentsList[0].name}
          className="w-full h-full object-contain p-1"
        />
        {garmentCount > 1 && (
          <div className="absolute bottom-0.5 right-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 select-none font-sans">
            +{garmentCount - 1}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group flex items-center bg-card border border-border/40 hover:border-border/80 transition-all duration-200 cursor-pointer p-3 gap-4"
    >
      {renderMiniCollage()}
      
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h4 className="font-serif text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {outfit.name}
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wide font-sans">
          <span>{formatWornDate(wornAt)}</span>
          <span>·</span>
          <span>{garmentCount} {garmentCount === 1 ? "piece" : "pieces"}</span>
        </div>
      </div>
    </div>
  );
}
