"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { EditorialDialog } from "@/components/editor/editorial-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { OCCASIONS } from "@style-sync/backend/types";
import { useCommunityProfile, usePublishToCommunity } from "@/lib/hooks/use-community";
import { CommunityProfileSetup } from "@/components/community/community-profile-setup";
import type { LookBookEntry } from "@/types";

interface PublishToCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LookBookEntry;
  existingCaption?: string | null;
  existingOccasion?: string | null;
  onSuccess?: (message: string) => void;
}

export function PublishToCommunityDialog({
  open,
  onOpenChange,
  entry,
  existingCaption,
  existingOccasion,
  onSuccess,
}: PublishToCommunityDialogProps) {
  const { data: profile, isLoading: loadingProfile } = useCommunityProfile();
  const publish = usePublishToCommunity();

  const [caption, setCaption] = React.useState(existingCaption ?? "");
  const [occasion, setOccasion] = React.useState<string | undefined>(
    existingOccasion ?? entry.outfit?.occasion ?? undefined
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCaption(existingCaption ?? "");
      setOccasion(existingOccasion ?? entry.outfit?.occasion ?? undefined);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loading = publish.isPending;
  const needsProfileSetup = !loadingProfile && !profile;

  const handlePublish = async () => {
    setError(null);
    try {
      const result = await publish.mutateAsync({
        sourceLookBookEntryId: entry.id,
        caption: caption.trim() || undefined,
        occasion,
      });
      if (!result.success) throw new Error(result.error || "Failed to publish.");
      onSuccess?.("Published to Community.");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish.");
    }
  };

  return (
    <EditorialDialog
      open={open}
      onOpenChange={(val) => !loading && onOpenChange(val)}
      title={needsProfileSetup ? "Set Up Community Profile" : "Publish to Community"}
      description={
        needsProfileSetup
          ? "One-time setup before you can publish looks."
          : "Share this look with the StyleSync community."
      }
      footerActions={
        needsProfileSetup ? undefined : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="rounded-none px-5 border-border/60 hover:bg-accent/40 text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handlePublish}
              className="rounded-none px-6 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Publish
                </>
              )}
            </Button>
          </>
        )
      }
    >
      {loadingProfile ? (
        <div className="h-32 animate-pulse bg-accent/10" />
      ) : needsProfileSetup ? (
        <CommunityProfileSetup />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="w-full aspect-4/5 max-w-40 mx-auto bg-[#fcf9f5] dark:bg-[#151513] border border-border/30 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.photoUrl} alt="Look preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="publish-caption"
              className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
            >
              Caption
            </label>
            <Textarea
              id="publish-caption"
              placeholder="Say something about this look..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 300))}
              disabled={loading}
              maxLength={300}
              className="resize-none h-20 rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/60 transition-all font-sans text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
              Occasion
            </span>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((opt) => {
                const selected = occasion === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOccasion(selected ? undefined : opt)}
                    disabled={loading}
                    className={cn(
                      "px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border transition-all cursor-pointer select-none",
                      selected
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 animate-fade-in">
              {error}
            </div>
          )}
        </div>
      )}
    </EditorialDialog>
  );
}
