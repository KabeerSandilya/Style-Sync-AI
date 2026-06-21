"use client";

import * as React from "react";
import { Sparkles, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Outfit } from "@/types";

interface HistoryDetailDialogProps {
  wearId: string | null;
  outfit: Outfit | null;
  wornAt: string | null;
  open: boolean;
  onClose: () => void;
  onDeleteSuccess?: (message: string) => void;
}

export function HistoryDetailDialog({
  wearId,
  outfit,
  wornAt,
  open,
  onClose,
  onDeleteSuccess,
}: HistoryDetailDialogProps) {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!wearId || deleting) return;
    if (!confirm("Remove this entry from your style journal?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/wear-history/${wearId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onDeleteSuccess?.("Journal entry removed successfully.");
        onClose();
      } else {
        alert(data.error || "Failed to remove entry.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove entry.");
    } finally {
      setDeleting(false);
    }
  };
  if (!outfit) return null;

  const garmentsList = outfit.garments.map((g) => g.garment).filter(Boolean);
  const garmentCount = garmentsList.length;

  const getFormattedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render layering collage similar to TodaysRecommendations or OutfitCard
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
        <div className="w-full h-full p-6 flex items-center justify-center bg-[#fcf9f5] dark:bg-[#151513]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getDisplayImageUrl(garmentsList[0])}
            alt={garmentsList[0].name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    if (garmentCount === 2) {
      return (
        <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-6">
          <div className="absolute left-[15%] w-[45%] h-[80%] flex items-center justify-center transform -rotate-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getDisplayImageUrl(garmentsList[0])}
              alt={garmentsList[0].name}
              className="max-h-full max-w-full object-contain filter drop-shadow-md"
            />
          </div>
          <div className="absolute right-[15%] w-[45%] h-[80%] flex items-center justify-center transform rotate-6 z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getDisplayImageUrl(garmentsList[1])}
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
      <div className="w-full h-full relative overflow-hidden bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-6">
        <div className="absolute left-[10%] w-[40%] h-[70%] flex items-center justify-center transform -rotate-12 translate-y-4 opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getDisplayImageUrl(displayGarments[0])}
            alt={displayGarments[0].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div className="absolute right-[10%] w-[40%] h-[70%] flex items-center justify-center transform rotate-12 translate-y-4 opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getDisplayImageUrl(displayGarments[1])}
            alt={displayGarments[1].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div className="absolute w-[50%] h-[80%] flex items-center justify-center transform -translate-y-2 z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent
        showCloseButton={true}
        className={cn(
          "bg-card border border-border/40 rounded-2xl p-6 md:p-8 max-w-[calc(100%-2rem)] sm:max-w-[760px] md:max-w-[850px] max-h-[90vh] overflow-y-auto shadow-xl outline-none ring-0 [&_[data-slot=dialog-close]]:rounded-none [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        )}
      >
        <div className="flex flex-col gap-1.5">
          <DialogHeader className="gap-1 text-left pb-4 border-b border-border/20">
            <DialogTitle className="font-serif text-2xl font-semibold text-foreground tracking-tight select-none">
              Journal Entry
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-4 items-start">
            {/* Left Side: Outfit Preview Collage */}
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] border border-border/30 rounded-2xl overflow-hidden flex items-center justify-center relative select-none">
                {renderCollage()}
              </div>

              {wornAt && (
                <div className="bg-background/40 border border-border/50 p-4 rounded-xl flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-none">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Worn Date</span>
                    <span className="text-xs font-semibold text-foreground mt-0.5">
                      {getFormattedDate(wornAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Outfit Details & Garments List */}
            <div className="flex flex-col gap-5 h-full justify-between">
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] md:max-h-[380px] pr-2 scrollbar-thin">
                {/* Outfit Name */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                    Outfit Name
                  </span>
                  <h3 className="font-serif text-2xl font-medium text-foreground leading-snug">
                    {outfit.name}
                  </h3>
                </div>

                {/* Notes if available */}
                {outfit.notes && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                      Styling Notes
                    </span>
                    <p className="text-sm font-sans italic text-muted-foreground bg-muted/20 p-3 border border-border/20 rounded-md">
                      {outfit.notes}
                    </p>
                  </div>
                )}

                {/* Garments count */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none border-b border-border/10 pb-1">
                    Garments In This Look ({garmentCount})
                  </span>
                  <div className="flex flex-col gap-3">
                    {garmentsList.map((garment) => (
                      <div
                        key={garment.id}
                        className="flex gap-3 items-center border border-border/20 p-3 bg-background/40 rounded-sm"
                      >
                        <div className="w-12 aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] border border-border/30 rounded-none flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getDisplayImageUrl(garment)}
                            alt={garment.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {garment.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80">
                            {garment.category}
                          </span>
                          {garment.dominantColor && (
                            <span className="text-[9px] text-muted-foreground">
                              Color: {garment.dominantColor}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="pt-5 border-t border-border/20 mt-4 select-none">
                <div className="flex gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 rounded-none py-5 border-border/60 hover:bg-accent/40 text-foreground text-xs font-semibold uppercase tracking-wider"
                    disabled={deleting}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-none py-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold uppercase tracking-wider"
                  >
                    {deleting ? "Removing..." : "Remove Entry"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
