"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import {
  Sun,
  CloudRain,
  Cloud,
  CloudSnow,
  Sparkles,
  Plus,
  RotateCw,
  Shuffle,
  Check,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/lib/hooks/use-recommendations";
import { useWearOutfit } from "@/lib/hooks/use-wear-outfit";
import { useLikeDislike } from "@/lib/hooks/use-like-dislike";
import { OutfitCollage } from "@/components/recommendation/outfit-collage";
import { AskStylistDialog } from "@/components/recommendation/ask-stylist-dialog";
import type { ScoredOutfit, WeatherContext, Occasion } from "@/types";

const OCCASIONS: Occasion[] = ['Work', 'Casual', 'Smart Casual', 'Formal', 'Active', 'Date Night'];
const OCCASION_STORAGE_KEY = 'stylesync_occasion';

interface TodaysRecommendationsProps {
  onCreateOutfitClick?: () => void;
  onOutfitClick?: (outfit: any) => void;
}

function GenerateLooksButton({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/outfits/generate", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error === "not_enough_garments") {
          setMessage(`Classify at least 3 garments first (you have ${data.classifiedCount ?? 0}).`);
        } else if (res.status === 429) {
          setMessage("Please wait a moment before generating again.");
        } else if (res.status === 503) {
          setMessage("AI service is not configured.");
        } else {
          setMessage(data.error ?? "Generation failed. Try again.");
        }
        setState("error");
        return;
      }

      if (data.data?.length === 0) {
        setMessage(data.message ?? "All possible looks already exist in your wardrobe.");
        setState("done");
        return;
      }

      setState("done");
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      onSuccess();
    } catch {
      setMessage("Network error. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleGenerate}
        disabled={state === "loading"}
        size="sm"
        className="rounded-none font-sans font-semibold text-xs tracking-wider uppercase px-4 shadow-sm"
      >
        {state === "loading" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Assembling looks…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Generate Looks
          </>
        )}
      </Button>
      {message && (
        <p className={cn(
          "text-[10px] font-sans text-center max-w-52 leading-relaxed",
          state === "error" ? "text-destructive/80" : "text-muted-foreground"
        )}>
          {message}
        </p>
      )}
    </div>
  );
}

export function TodaysRecommendations({
  onCreateOutfitClick,
  onOutfitClick,
}: TodaysRecommendationsProps) {
  // Location state — starts with Paris fallback, updates when geolocation resolves
  const [location, setLocation] = React.useState<{ lat?: number; lon?: number; city?: string }>({ city: "Paris" });

  // Occasion picker state
  const [selectedOccasion, setSelectedOccasionState] = React.useState<string | null>(null);

  const setSelectedOccasion = React.useCallback((occ: string | null) => {
    setSelectedOccasionState(occ);
  }, []);

  // Restore occasion from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(OCCASION_STORAGE_KEY);
    if (stored && (OCCASIONS as string[]).includes(stored)) {
      setSelectedOccasionState(stored);
    }
  }, []);

  // Try geolocation on mount — updates location which auto-refetches the query
  React.useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation({ city: "Paris" }),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600_000 }
      );
    }
  }, []);

  const { data: queryData, isLoading: loading, isError, refetch } = useRecommendations({
    ...location,
    occasion: selectedOccasion,
  });

  const recommendations: ScoredOutfit[] = queryData?.data ?? [];
  const weather: WeatherContext | null = queryData?.weather ?? null;
  const coldStartReason = queryData?.coldStartReason ?? null;
  const error = isError ? "Failed to fetch styling recommendations." : (!queryData?.success ? queryData?.error : null);

  // Track currently featured recommended outfit
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Reset active index when recommendations change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [recommendations.length]);

  const wearMutation = useWearOutfit();
  const likeDislikeMutation = useLikeDislike();

  const handleWear = (e: React.MouseEvent, outfitId: string) => {
    e.stopPropagation();
    wearMutation.mutate(outfitId);
  };

  const handleLike = (e: React.MouseEvent, outfitId: string) => {
    e.stopPropagation();
    likeDislikeMutation.mutate({ outfitId, action: "like" });
  };

  const handleDislike = (e: React.MouseEvent, outfitId: string) => {
    e.stopPropagation();
    likeDislikeMutation.mutate({ outfitId, action: "dislike" });
  };

  const anyActionPending = wearMutation.isPending || likeDislikeMutation.isPending;

  // Weather Icon Matcher
  const getWeatherIcon = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) {
      return <CloudRain className="w-5 h-5 text-primary" />;
    } else if (c.includes("snow")) {
      return <CloudSnow className="w-5 h-5 text-primary" />;
    } else if (c.includes("cloud") || c.includes("overcast")) {
      return <Cloud className="w-5 h-5 text-primary" />;
    }
    return <Sun className="w-5 h-5 text-primary" />;
  };

  // Format Date for widget
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Render Skeletons for Loading State
  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Primary Recommendation Skeleton */}
        <div className="border border-border/40 bg-card p-5 flex flex-col gap-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-muted" />
            <div className="h-6 w-12 bg-muted" />
          </div>
          <div className="aspect-16/10 w-full bg-muted/40" />
          <div className="h-5 w-40 bg-muted mt-1" />
          <div className="h-10 bg-muted/55 w-full" />
        </div>

        {/* Weather Card Skeleton */}
        <Card className="rounded-none border-border bg-card shadow-sm animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-muted" />
              <div className="h-3 w-28 bg-muted" />
            </div>
            <div className="h-7 w-36 bg-muted mt-3" />
            <div className="h-4 w-44 bg-muted mt-1" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="h-20 bg-muted/50 rounded-none w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error && recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-40 text-sm text-muted-foreground font-sans">
        {error}
      </div>
    );
  }

  // Render Cold-Start / Empty State
  if (!loading && recommendations.length === 0) {
    const isNoGarments = coldStartReason === "no_garments";

    return (
      <div className="flex flex-col gap-6 w-full">
        <Card className="rounded-none border-border bg-card shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-75 gap-4">
          <div className="w-12 h-12 bg-accent/20 flex items-center justify-center text-primary rounded-none">
            <Sparkles className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="font-serif text-lg font-medium">
              {isNoGarments ? "Your wardrobe is empty" : "No outfits yet"}
            </h4>
            <p className="text-xs text-muted-foreground max-w-50 mx-auto leading-relaxed">
              {isNoGarments
                ? "Upload your clothes first, then build outfits to start receiving weather-aware recommendations."
                : "You have garments but no saved outfits. Let AI build your first looks, or create one manually."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Button
              onClick={onCreateOutfitClick}
              size="sm"
              variant="outline"
              className="rounded-none font-sans font-semibold text-xs tracking-wider uppercase px-4 border-border/60"
            >
              {isNoGarments ? "Go to Wardrobe Studio" : "Build Manually"}
              <Plus className="w-3.5 h-3.5 ml-1.5" />
            </Button>

            {/* Generate Looks — only shown when user has garments but no outfits */}
            {!isNoGarments && (
              <GenerateLooksButton onSuccess={() => refetch()} />
            )}
          </div>
        </Card>

        {/* Weather context still shown even during cold-start */}
        {weather && (
          <Card className="rounded-none border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-primary">
                  {getWeatherIcon(weather.condition)}
                  <span className="text-xs font-semibold uppercase tracking-wider font-sans">Contextual Signal</span>
                </div>
                <span className="text-xs text-muted-foreground font-sans">{getFormattedDate()}</span>
              </div>
              <CardTitle className="font-serif text-2xl mt-3 font-medium">
                {weather.city}
              </CardTitle>
              <CardDescription className="font-sans text-xs">
                {weather.condition} · {weather.temperature}°C · Humidity {weather.humidity}%
              </CardDescription>
            </CardHeader>
            {weather.rainProbability > 20 && (
              <CardContent className="py-1">
                <div className="bg-background/60 rounded-none p-3 border border-border/30 text-xs text-muted-foreground leading-relaxed flex items-center gap-2">
                  <span className="font-semibold text-foreground">Rain chance:</span>
                  <span>{weather.rainProbability}%</span>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    );
  }

  // Active highlighted recommendation based on state
  const primary = recommendations[activeIndex] || recommendations[0];

  // Alternatives are other options (excluding the currently featured one)
  const alternatives = recommendations
    .map((scored, idx) => ({ scored, idx }))
    .filter((item) => item.idx !== activeIndex)
    .slice(0, 3);

  const handleOccasionSelect = (occ: string | null) => {
    if (occ) {
      localStorage.setItem(OCCASION_STORAGE_KEY, occ);
    } else {
      localStorage.removeItem(OCCASION_STORAGE_KEY);
    }
    setSelectedOccasion(occ);
  };

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* Ask the Stylist entry point */}
      <div className="flex justify-center">
        <AskStylistDialog location={location} />
      </div>

      {/* Occasion Picker */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {(['All', ...OCCASIONS] as (string | null)[]).map((occ) => {
          const value = occ === 'All' ? null : occ;
          const isSelected = selectedOccasion === value;
          return (
            <button
              key={occ ?? 'all'}
              onClick={() => handleOccasionSelect(value)}
              className={cn(
                "shrink-0 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest transition-colors cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary"
              )}
            >
              {occ}
            </button>
          );
        })}
      </div>

      {/* Primary recommendation section: FEATURED OUTFIT */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline border-b border-border/20 pb-1.5">
          <span className="font-serif italic text-sm text-foreground/80">Today&apos;s Silhouette</span>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-primary">
            Match {primary.score}%
          </span>
        </div>

        <Card
          onClick={onOutfitClick ? () => onOutfitClick(primary.outfit) : undefined}
          className={cn(
            "group relative rounded-none border-border bg-card overflow-hidden",
            onOutfitClick ? "transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md hover:border-border/80" : ""
          )}
        >
          {/* Reduced height horizontal design */}
          <div className="flex flex-col sm:flex-row w-full">
            {/* Collage Section (left) */}
            <div className="w-full sm:w-[42%] aspect-video sm:aspect-auto sm:min-h-50 border-b sm:border-b-0 sm:border-r border-border/20 overflow-hidden relative bg-[#fcf9f5] dark:bg-[#151513] shrink-0">
              <OutfitCollage garments={primary.outfit.garments.map((g) => g.garment).filter(Boolean)} />

              {/* Piece Count */}
              <div className="absolute bottom-3 left-3 z-20 px-2 py-0.5 bg-card/90 backdrop-blur-xs border border-border/40 text-[9px] font-sans uppercase font-bold tracking-wider text-muted-foreground">
                {primary.outfit.garments.length} {primary.outfit.garments.length === 1 ? "piece" : "pieces"}
              </div>
            </div>

            {/* Content Details Section (right) */}
            <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-serif text-lg font-medium truncate group-hover:text-primary transition-colors">
                  {primary.outfit.name}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-normal line-clamp-3 italic">
                  {primary.explanation}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div
                className="flex items-center gap-3 mt-4 pt-3 border-t border-border/10"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  onClick={(e) => handleWear(e, primary.outfit.id)}
                  disabled={anyActionPending || primary.wornToday}
                  className="rounded-none h-8 px-4 text-xs font-sans font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {wearMutation.isPending && wearMutation.variables === primary.outfit.id
                    ? "Wearing..."
                    : primary.wornToday
                    ? "Worn Today"
                    : "Wear This"}
                </Button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleLike(e, primary.outfit.id)}
                    disabled={anyActionPending}
                    className={cn(
                      "rounded-none h-8 w-8 p-0 border-border/30 flex items-center justify-center cursor-pointer transition-colors",
                      primary.feedbackType === "LIKE"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "text-muted-foreground hover:text-primary hover:bg-accent/10"
                    )}
                    title="Like recommendation"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDislike(e, primary.outfit.id)}
                    disabled={anyActionPending}
                    className={cn(
                      "rounded-none h-8 w-8 p-0 border-border/30 flex items-center justify-center cursor-pointer transition-colors",
                      primary.feedbackType === "DISLIKE"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    )}
                    title="Dislike recommendation"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Spotlight Pagination / Swap Action */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/10 justify-between items-center">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground">
                  Look {activeIndex + 1} of {recommendations.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) => (prev + 1) % recommendations.length);
                  }}
                  className="rounded-none h-7 px-2.5 text-[9px] font-sans font-bold uppercase tracking-wider text-primary border border-primary/20 hover:bg-primary/5 flex items-center gap-1 cursor-pointer"
                >
                  <Shuffle className="w-3 h-3" />
                  Swap Suggestion
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Alternative Options Section */}
      {alternatives.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-2">
          <span className="font-serif italic text-xs text-muted-foreground">Alternative Looks</span>

          <div className="flex flex-col gap-2">
            {alternatives.map(({ scored, idx }) => (
              <div
                key={scored.outfitId}
                onClick={() => setActiveIndex(idx)}
                className="group flex items-center bg-card border border-border/40 hover:border-border/80 transition-all duration-200 cursor-pointer p-3 gap-3"
                title="Swap to spotlight this look"
              >
                {/* Mini Collage Container */}
                <div className="w-12 h-14 bg-muted/20 shrink-0 border border-border/20 overflow-hidden relative">
                  <OutfitCollage garments={scored.outfit.garments.map((g) => g.garment).filter(Boolean)} isMini />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-serif text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                      {scored.outfit.name}
                    </h4>
                    <span className="text-[10px] font-sans font-bold text-primary tracking-wider shrink-0">
                      {scored.score}%
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                    {scored.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Header Context Card */}
      {weather && (
        <Card className="rounded-none border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 text-primary">
                {getWeatherIcon(weather.condition)}
                <span className="text-xs font-semibold uppercase tracking-wider font-sans">Contextual Signal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refetch();
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
                  title="Refresh Weather Forecast"
                >
                  <RotateCw className="w-3.5 h-3.5 hover:rotate-95 transition-transform" />
                </button>
                <span className="text-xs text-muted-foreground font-sans">{getFormattedDate()}</span>
              </div>
            </div>
            <CardTitle className="font-serif text-2xl mt-3 font-medium">
              {weather.city}
            </CardTitle>
            <CardDescription className="font-sans text-xs">
              {weather.condition} · {weather.temperature}°C · Humidity {weather.humidity}%
            </CardDescription>
          </CardHeader>
          <CardContent className="font-sans flex flex-col gap-4 py-2">
            <div className="bg-background/60 rounded-none p-4 border border-border/30 flex items-start gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-none mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Stylist Suggestion</span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {primary.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
