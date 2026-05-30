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
  HelpCircle,
  RotateCw,
  Shuffle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScoredOutfit } from "@/services/recommendation/types";
import { WeatherContext } from "@/services/weather/types";

interface TodaysRecommendationsProps {
  onCreateOutfitClick?: () => void;
  onOutfitClick?: (outfit: any) => void;
  refreshTrigger?: number; // To trigger refetch from parent
}

export function TodaysRecommendations({
  onCreateOutfitClick,
  onOutfitClick,
  refreshTrigger = 0,
}: TodaysRecommendationsProps) {
  const [loading, setLoading] = React.useState(true);
  const [recommendations, setRecommendations] = React.useState<ScoredOutfit[]>([]);
  const [weather, setWeather] = React.useState<WeatherContext | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  // Track currently featured recommended outfit
  const [activeIndex, setActiveIndex] = React.useState(0);

  const fetchRecommendations = React.useCallback(async (lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/recommendations?city=Paris";
      if (lat !== undefined && lon !== undefined) {
        url = `/api/recommendations?lat=${lat}&lon=${lon}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data);
        setWeather(data.weather);
        setActiveIndex(0); // Reset featured spotlight index on fresh fetch
      } else {
        setError(data.error || "Failed to load recommendations.");
      }
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setError("Failed to fetch styling recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerRefresh = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchRecommendations(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation permission denied or failed. Defaulting to Paris.", err);
          fetchRecommendations();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    } else {
      fetchRecommendations();
    }
  };

  React.useEffect(() => {
    triggerRefresh();
  }, [refreshTrigger, fetchRecommendations]);

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

  // Collage Renderer
  const renderCollage = (scoredOutfit: ScoredOutfit, isMini = false) => {
    const garmentsList = scoredOutfit.outfit.garments.map((g) => g.garment).filter(Boolean);
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
            src={garmentsList[0].imageUrl}
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
              src={garmentsList[0].imageUrl}
              alt={garmentsList[0].name}
              className="max-h-full max-w-full object-contain filter drop-shadow-sm"
            />
          </div>
          <div className="absolute right-[10%] w-[50%] h-[80%] flex items-center justify-center transform rotate-6 z-10">
            <img
              src={garmentsList[1].imageUrl}
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
            src={displayGarments[0].imageUrl}
            alt={displayGarments[0].name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className={cn(
          "absolute right-[5%] w-[45%] h-[70%] flex items-center justify-center transform rotate-12",
          isMini ? "translate-y-2 opacity-60" : "translate-y-3 opacity-70"
        )}>
          <img
            src={displayGarments[1].imageUrl}
            alt={displayGarments[1].name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className={cn(
          "absolute w-[55%] h-[80%] flex items-center justify-center z-10",
          isMini ? "-translate-y-1" : "-translate-y-2"
        )}>
          <img
            src={displayGarments[2].imageUrl}
            alt={displayGarments[2].name}
            className="max-h-full max-w-full object-contain filter drop-shadow-md"
          />
        </div>
      </div>
    );
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
          <div className="aspect-[16/10] w-full bg-muted/40" />
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

  // Render Empty State
  if (!loading && recommendations.length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Empty recommendations card */}
        <Card className="rounded-none border-border bg-card shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-12 h-12 bg-accent/20 flex items-center justify-center text-primary rounded-none">
            <Sparkles className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="font-serif text-lg font-medium">No Recommendations</h4>
            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
              Create outfits to receive weather-aware outfit recommendations.
            </p>
          </div>
          <Button
            onClick={onCreateOutfitClick}
            size="sm"
            className="rounded-none font-sans font-semibold text-xs tracking-wider uppercase mt-2 px-4 shadow-sm"
          >
            Create Outfit
            <Plus className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Card>

        {/* Weather Card Context Widget */}
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

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* Primary recommendation section: FEATURED OUTFIT */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline border-b border-border/20 pb-1.5">
          <span className="font-serif italic text-sm text-foreground/80">Today&apos;s Silhouette</span>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-primary">
            Match {primary.score}%
          </span>
        </div>

        <Card 
          onClick={() => onOutfitClick?.(primary.outfit)}
          className="group relative rounded-none border-border bg-card hover:border-border/80 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md overflow-hidden"
        >
          {/* Reduced height horizontal design */}
          <div className="flex flex-col sm:flex-row w-full">
            {/* Collage Section (left) */}
            <div className="w-full sm:w-[42%] aspect-video sm:aspect-auto sm:min-h-[200px] border-b sm:border-b-0 sm:border-r border-border/20 overflow-hidden relative bg-[#fcf9f5] dark:bg-[#151513] shrink-0">
              {renderCollage(primary)}
              
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
                onClick={() => setActiveIndex(idx)} // Clicking swaps it into primary slot!
                className="group flex items-center bg-card border border-border/40 hover:border-border/80 transition-all duration-200 cursor-pointer p-2 gap-3"
                title="Swap to spotlight this look"
              >
                {/* Mini Collage Container */}
                <div className="w-12 h-14 bg-muted/20 shrink-0 border border-border/20 overflow-hidden relative">
                  {renderCollage(scored, true)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-serif text-xs font-medium truncate text-foreground group-hover:text-primary transition-colors">
                      {scored.outfit.name}
                    </h4>
                    <span className="text-[9px] font-sans font-bold text-primary tracking-wider shrink-0">
                      {scored.score}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate italic">
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
                    triggerRefresh();
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
