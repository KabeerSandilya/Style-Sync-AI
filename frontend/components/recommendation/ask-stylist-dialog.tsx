"use client";

import * as React from "react";
import { Sparkles, Loader2, Check, ThumbsUp, ThumbsDown, ArrowUpRight } from "lucide-react";
import { EditorialDialog } from "@/components/editor/editorial-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAskStylist } from "@/lib/hooks/use-ask-stylist";
import { useWearOutfit } from "@/lib/hooks/use-wear-outfit";
import { useLikeDislike } from "@/lib/hooks/use-like-dislike";
import { OutfitCollage } from "@/components/recommendation/outfit-collage";
import type { Outfit } from "@/types";

interface AskStylistLocation {
  lat?: number;
  lon?: number;
  city?: string;
}

interface AskStylistRecommendation {
  outfitId: string;
  score: number | null;
  explanation: string;
  outfit: Outfit;
  feedbackType: "LIKE" | "DISLIKE" | null;
  wornToday: boolean;
}

interface AskStylistResponse {
  success: boolean;
  mode?: "existing" | "generated";
  interpretation?: { occasion: string | null; keywords: string[] };
  recommendation?: AskStylistRecommendation;
  error?: string;
  classifiedCount?: number;
}

const EXAMPLE_PROMPTS = [
  "dinner date tonight",
  "casual Sunday brunch",
  "first day at a new job",
  "a rainy commute",
];

export function AskStylistDialog({ location }: { location: AskStylistLocation }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<AskStylistResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [promptIndex, setPromptIndex] = React.useState(0);

  const askStylist = useAskStylist();
  const wearMutation = useWearOutfit();
  const likeDislikeMutation = useLikeDislike();

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setPromptIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length),
      2800
    );
    return () => clearInterval(id);
  }, []);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setQuery("");
      setResult(null);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (query.trim().length < 3) return;
    setErrorMessage(null);
    setResult(null);
    try {
      const data: AskStylistResponse = await askStylist.mutateAsync({ query: query.trim(), ...location });
      if (!data.success) {
        if (data.error === "not_enough_garments") {
          setErrorMessage(`Classify at least 3 garments first (you have ${data.classifiedCount ?? 0}).`);
        } else {
          setErrorMessage(data.error ?? "Couldn't find a fit. Try again.");
        }
        return;
      }
      setResult(data);
    } catch {
      setErrorMessage("Network error. Please try again.");
    }
  };

  const recommendation = result?.recommendation;
  const anyActionPending = wearMutation.isPending || likeDislikeMutation.isPending;

  return (
    <EditorialDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button
          className="group h-auto rounded-none px-5 py-3 flex items-center gap-3 cursor-pointer shadow-[0_2px_16px_rgba(112,130,114,0.35)] hover:shadow-[0_4px_20px_rgba(112,130,114,0.45)] transition-shadow"
        >
          <Sparkles className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
          <span className="flex flex-col items-start leading-tight min-w-0">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
              Ask the Stylist
            </span>
            <span
              key={promptIndex}
              className="font-serif italic text-[13px] text-primary-foreground/85 animate-fade-in truncate max-w-48"
            >
              &ldquo;{EXAMPLE_PROMPTS[promptIndex]}?&rdquo;
            </span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      }
      title="Ask the Stylist"
      description="Describe your plans and the AI will pick or assemble a fit for it."
    >
      <div className="flex flex-col gap-3">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I'm going for a run… / dinner date tonight… / casual Sunday brunch…"
          className="rounded-none border-border/60 text-sm font-sans min-h-20"
          maxLength={200}
          disabled={askStylist.isPending}
        />
        <Button
          onClick={handleSubmit}
          disabled={askStylist.isPending || query.trim().length < 3}
          size="sm"
          className="rounded-none font-sans font-semibold text-xs tracking-wider uppercase self-end px-4"
        >
          {askStylist.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Styling…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Find My Fit
            </>
          )}
        </Button>
      </div>

      {errorMessage && (
        <p className="text-xs text-destructive/80 font-sans text-center mt-3">{errorMessage}</p>
      )}

      {recommendation && result && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/20">
          {result.interpretation && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {result.interpretation.occasion && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[9px] font-sans font-bold uppercase tracking-wider">
                  {result.interpretation.occasion}
                </span>
              )}
              {result.interpretation.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 bg-muted/40 text-muted-foreground border border-border/40 text-[9px] font-sans uppercase tracking-wider"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-24 h-28 shrink-0 border border-border/20 overflow-hidden relative bg-[#fcf9f5] dark:bg-[#151513]">
              <OutfitCollage garments={recommendation.outfit.garments.map((g) => g.garment).filter(Boolean)} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h4 className="font-serif text-base font-medium text-foreground truncate">
                {recommendation.outfit.name}
              </h4>
              <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-3">
                {recommendation.explanation}
              </p>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary mt-1">
                {result.mode === "generated" ? "Freshly assembled for you" : `Match ${recommendation.score}%`}
              </span>
            </div>
          </div>

          {result.mode === "existing" ? (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => wearMutation.mutate(recommendation.outfitId)}
                disabled={anyActionPending || recommendation.wornToday}
                className="rounded-none h-8 px-4 text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {recommendation.wornToday ? "Worn Today" : "Wear This"}
              </Button>
              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => likeDislikeMutation.mutate({ outfitId: recommendation.outfitId, action: "like" })}
                  disabled={anyActionPending}
                  className={cn(
                    "rounded-none h-8 w-8 p-0 border-border/30 flex items-center justify-center",
                    recommendation.feedbackType === "LIKE" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground"
                  )}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => likeDislikeMutation.mutate({ outfitId: recommendation.outfitId, action: "dislike" })}
                  disabled={anyActionPending}
                  className={cn(
                    "rounded-none h-8 w-8 p-0 border-border/30 flex items-center justify-center",
                    recommendation.feedbackType === "DISLIKE" ? "bg-destructive/10 text-destructive border-destructive/20" : "text-muted-foreground"
                  )}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider pt-1">
              Saved to your wardrobe. Find it in Saved Outfits.
            </p>
          )}
        </div>
      )}
    </EditorialDialog>
  );
}
