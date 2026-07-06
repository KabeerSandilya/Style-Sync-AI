"use client";

/* eslint-disable @next/next/no-img-element */

import { HelpCircle } from "lucide-react";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import type { Garment } from "@/types";

interface OutfitCollageProps {
  garments: Garment[];
  isMini?: boolean;
}

export function OutfitCollage({ garments: garmentsList, isMini = false }: OutfitCollageProps) {
  const count = garmentsList.length;

  if (count === 0) {
    return (
      <div className="w-full h-full bg-accent/20 flex items-center justify-center text-muted-foreground">
        <HelpCircle className="w-4 h-4" />
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="w-full h-full p-2 flex items-center justify-center bg-[#fcf9f5] dark:bg-[#151513]">
        <img
          src={getDisplayImageUrl(garmentsList[0])}
          alt={garmentsList[0].name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-2">
        <div className="absolute left-[10%] w-[50%] h-[80%] flex items-center justify-center transform -rotate-6">
          <img
            src={getDisplayImageUrl(garmentsList[0])}
            alt={garmentsList[0].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div className="absolute right-[10%] w-[50%] h-[80%] flex items-center justify-center transform rotate-6 z-10">
          <img
            src={getDisplayImageUrl(garmentsList[1])}
            alt={garmentsList[1].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
      </div>
    );
  }

  // 3 or more garments
  const displayGarments = garmentsList.slice(0, 3);
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-2">
      <div className={cn(
        "absolute left-[5%] w-[45%] h-[70%] flex items-center justify-center transform -rotate-12",
        isMini ? "translate-y-2 opacity-60" : "translate-y-3 opacity-70"
      )}>
        <img
          src={getDisplayImageUrl(displayGarments[0])}
          alt={displayGarments[0].name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className={cn(
        "absolute right-[5%] w-[45%] h-[70%] flex items-center justify-center transform rotate-12",
        isMini ? "translate-y-2 opacity-60" : "translate-y-3 opacity-70"
      )}>
        <img
          src={getDisplayImageUrl(displayGarments[1])}
          alt={displayGarments[1].name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className={cn(
        "absolute w-[55%] h-[80%] flex items-center justify-center z-10",
        isMini ? "-translate-y-1" : "-translate-y-2"
      )}>
        <img
          src={getDisplayImageUrl(displayGarments[2])}
          alt={displayGarments[2].name}
          className="max-h-full max-w-full object-contain filter drop-shadow-md"
        />
      </div>
    </div>
  );
}
