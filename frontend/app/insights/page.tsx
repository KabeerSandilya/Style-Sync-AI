"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Sparkles, ChevronLeft, ArrowRight, TrendingUp, HelpCircle, EyeOff, Award, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Garment, Outfit } from "@/types";

interface GarmentWithStats extends Garment { wearCount: number }
interface OutfitWithStats extends Outfit { wearCount: number }

interface InsightsData {
  mostWornGarments: GarmentWithStats[];
  leastWornGarments: GarmentWithStats[];
  neverWornGarments: Garment[];
  mostWornOutfits: OutfitWithStats[];
  recentlyWornOutfits: Outfit[];
}

function SectionHeader({
  icon,
  title,
  subtitle,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tag?: string;
}) {
  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-border/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent/40 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <h2 className="font-serif text-2xl font-medium tracking-tight">{title}</h2>
        </div>
        {tag && (
          <span className="font-sans text-[9px] font-bold uppercase tracking-wider bg-accent/30 text-primary px-2.5 py-1">
            {tag}
          </span>
        )}
      </div>
      <p className="font-sans text-xs text-muted-foreground ml-9.5">{subtitle}</p>
    </div>
  );
}

function GarmentCard({
  garment,
  badge,
  badgeVariant = "default",
  onClick,
}: {
  garment: GarmentWithStats | Garment;
  badge: string;
  badgeVariant?: "default" | "muted" | "alert";
  onClick: () => void;
}) {
  const badgeClasses = {
    default: "text-primary font-serif italic",
    muted: "text-muted-foreground/70 font-sans uppercase tracking-wider font-bold",
    alert: "text-primary/60 font-sans uppercase tracking-wider font-semibold",
  }[badgeVariant];

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border/30 hover:border-border/70 hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="aspect-[4/5] bg-[#fcf9f5] flex items-center justify-center p-4 border-b border-border/10 overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={(garment as Garment).imageUrl}
          alt={(garment as Garment).name}
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        {"category" in garment && (garment as Garment).category && (
          <span className="absolute bottom-2.5 left-2.5 bg-background/85 backdrop-blur-sm text-[8px] uppercase tracking-wider font-bold text-primary/80 px-2 py-0.5 border border-border/30 select-none">
            {(garment as Garment).category}
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-1.5">
        <h3 className="font-serif text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
          {(garment as Garment).name}
        </h3>
        <p className={`text-[10px] mt-auto pt-2 border-t border-border/10 ${badgeClasses}`}>
          {badge}
        </p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const [garments, setGarments] = React.useState<Garment[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [fetchingOutfits, setFetchingOutfits] = React.useState(true);
  const [fetchingInsights, setFetchingInsights] = React.useState(true);
  const [insights, setInsights] = React.useState<InsightsData | null>(null);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      if (data.success) setInsights(data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setFetchingInsights(false);
    }
  };

  const fetchGarments = async () => {
    try {
      const res = await fetch("/api/garments");
      const data = await res.json();
      if (data.success) setGarments(data.data);
    } catch (error) {
      console.error("Error fetching garments:", error);
    } finally {
      setFetchingGarments(false);
    }
  };

  const fetchOutfits = async () => {
    try {
      const res = await fetch("/api/outfits");
      const data = await res.json();
      if (data.success) setOutfits(data.data);
    } catch (error) {
      console.error("Error fetching outfits:", error);
    } finally {
      setFetchingOutfits(false);
    }
  };

  React.useEffect(() => {
    fetchInsights();
    fetchGarments();
    fetchOutfits();
  }, []);

  const handleGarmentClick = (g: Garment) => {
    setIsSidebarOpen(false);
    router.push(`/editor/wardrobe?selectedGarmentId=${g.id}`);
  };

  const handleOutfitClick = (o: Outfit) => {
    setIsSidebarOpen(false);
    router.push(`/editor/wardrobe?selectedOutfitId=${o.id}&view=outfits`);
  };

  const handleAddClothing = () => {
    setIsSidebarOpen(false);
    router.push(`/editor/wardrobe?addClothing=true`);
  };

  const hasInsufficientHistory = React.useMemo(() => {
    if (!insights) return true;
    return insights.mostWornOutfits.length === 0;
  }, [insights]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Wardrobe Insights"
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddClothing={handleAddClothing}
        garments={garments}
        loading={fetchingGarments}
        onGarmentClick={handleGarmentClick}
        outfits={outfits}
        loadingOutfits={fetchingOutfits}
        onOutfitClick={handleOutfitClick}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-12 flex flex-col gap-16">

        {/* ── Page header ─────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-border/30 animate-enter-1">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/editor")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest font-sans transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/40 flex items-center justify-center text-primary shrink-0">
                <BarChart2 className="w-4.5 h-4.5" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                Wardrobe <span className="italic font-light text-primary">analytics</span>.
              </h1>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[52ch]">
              Reflective insights built from your styling patterns, wear frequency, and outfit history.
            </p>
          </div>
        </section>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="w-full flex-1">
          {fetchingInsights ? (
            <div className="flex flex-col gap-16 animate-pulse">
              {[1, 2].map((sk) => (
                <div key={sk} className="flex flex-col gap-8">
                  <div className="flex items-center gap-3 pb-4 border-b border-border/20">
                    <div className="w-7 h-7 bg-accent/30" />
                    <div className="h-6 w-40 bg-accent/30" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    {[1, 2, 3, 4, 5].map((ck) => (
                      <div key={ck} className="border border-border/20 bg-card/40 flex flex-col">
                        <div className="aspect-[4/5] bg-accent/20" />
                        <div className="p-3.5 flex flex-col gap-2">
                          <div className="h-3.5 bg-accent/30 w-3/4" />
                          <div className="h-3 bg-accent/20 w-1/2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hasInsufficientHistory ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 gap-6 max-w-lg mx-auto">
              <div className="relative">
                <div className="w-20 h-20 border border-dashed border-border/50 flex items-center justify-center text-primary">
                  <BarChart2 className="w-8 h-8 stroke-[1]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent/40 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-2 max-w-[32ch]">
                <h3 className="font-serif text-2xl font-medium tracking-tight">
                  Insights <span className="italic font-light text-primary">unlock</span> with wear.
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  Mark outfits as worn to start building your personalised wardrobe analytics.
                </p>
              </div>
              <Button
                onClick={() => router.push("/editor")}
                className="rounded-none px-6 py-5 text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-2 cursor-pointer"
              >
                Explore Recommendations
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-20">

              {/* 1. Most Worn Garments */}
              {insights && insights.mostWornGarments.length > 0 && (
                <section className="flex flex-col gap-6 animate-enter-2">
                  <SectionHeader
                    icon={<Award className="w-3.5 h-3.5" />}
                    title="Most Worn"
                    subtitle="Your wardrobe staples — pieces you reach for time and again."
                    tag="Staples"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                    {insights.mostWornGarments.map((g) => (
                      <GarmentCard
                        key={g.id}
                        garment={g}
                        badge={`Worn ${g.wearCount} ${g.wearCount === 1 ? "time" : "times"}`}
                        badgeVariant="default"
                        onClick={() => handleGarmentClick(g)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Most Worn Outfits */}
              {insights && insights.mostWornOutfits.length > 0 && (
                <section className="flex flex-col gap-6 animate-enter-3">
                  <SectionHeader
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    title="Most Worn Outfits"
                    subtitle="The complete looks you rely on most."
                    tag="Go-tos"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
                    {insights.mostWornOutfits.map((outfit) => {
                      const garmentsList = outfit.garments.map((g) => g.garment);
                      const gc = garmentsList.length;
                      return (
                        <div
                          key={outfit.id}
                          onClick={() => handleOutfitClick(outfit)}
                          className="group bg-card border border-border/30 hover:border-border/70 hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
                        >
                          <div className="aspect-[4/5] w-full border-b border-border/20 overflow-hidden relative bg-[#fcf9f5]">
                            {gc === 0 ? (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Sparkles className="w-6 h-6 stroke-[1.5]" />
                              </div>
                            ) : gc === 1 ? (
                              <div className="w-full h-full p-5 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={garmentsList[0].imageUrl} alt={garmentsList[0].name} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]" />
                              </div>
                            ) : gc === 2 ? (
                              <div className="w-full h-full relative p-4">
                                <div className="absolute left-[12%] w-[46%] h-[80%] top-[10%] flex items-center justify-center transform -rotate-6 transition-transform duration-300 group-hover:-rotate-10 group-hover:scale-[1.02]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={garmentsList[0].imageUrl} alt={garmentsList[0].name} className="max-h-full max-w-full object-contain drop-shadow-md" />
                                </div>
                                <div className="absolute right-[12%] w-[46%] h-[80%] top-[10%] flex items-center justify-center transform rotate-6 z-10 transition-transform duration-300 group-hover:rotate-10 group-hover:scale-[1.04]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={garmentsList[1].imageUrl} alt={garmentsList[1].name} className="max-h-full max-w-full object-contain drop-shadow-md" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full relative p-4">
                                <div className="absolute left-[8%] w-[42%] h-[70%] top-[15%] flex items-center justify-center transform -rotate-12 opacity-75 transition-transform duration-300 group-hover:-rotate-16">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={garmentsList[0].imageUrl} alt={garmentsList[0].name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                                </div>
                                <div className="absolute right-[8%] w-[42%] h-[70%] top-[15%] flex items-center justify-center transform rotate-12 opacity-75 transition-transform duration-300 group-hover:rotate-16">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={garmentsList[1].imageUrl} alt={garmentsList[1].name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                                </div>
                                <div className="absolute w-[52%] h-[82%] top-[9%] left-[24%] flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-[1.05] group-hover:-translate-y-1">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={garmentsList[2].imageUrl} alt={garmentsList[2].name} className="max-h-full max-w-full object-contain drop-shadow-xl" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col gap-1.5">
                            <h3 className="font-serif text-base font-medium text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                              {outfit.name}
                            </h3>
                            <p className="text-[10px] text-primary font-serif italic mt-auto pt-2 border-t border-border/10">
                              Worn {outfit.wearCount} {outfit.wearCount === 1 ? "time" : "times"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. Least Worn Garments */}
              {insights && insights.leastWornGarments.length > 0 && (
                <section className="flex flex-col gap-6 animate-enter-4">
                  <SectionHeader
                    icon={<HelpCircle className="w-3.5 h-3.5" />}
                    title="Least Worn"
                    subtitle="Items that may deserve more attention in your rotation."
                    tag="Underused"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                    {insights.leastWornGarments.map((g) => (
                      <GarmentCard
                        key={g.id}
                        garment={g}
                        badge={`Worn ${g.wearCount} ${g.wearCount === 1 ? "time" : "times"}`}
                        badgeVariant="muted"
                        onClick={() => handleGarmentClick(g)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Never Worn */}
              {insights && insights.neverWornGarments.length > 0 && (
                <section className="flex flex-col gap-6 animate-enter-5">
                  <SectionHeader
                    icon={<EyeOff className="w-3.5 h-3.5" />}
                    title="Never Worn"
                    subtitle="Pieces waiting for their first outing."
                    tag={`${insights.neverWornGarments.length} items`}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                    {insights.neverWornGarments.map((g) => (
                      <GarmentCard
                        key={g.id}
                        garment={g}
                        badge="Never worn"
                        badgeVariant="alert"
                        onClick={() => handleGarmentClick(g)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/30 py-10 px-6 bg-card/10 text-center font-sans text-[11px] text-muted-foreground/60 mt-20 tracking-wide">
        © 2026 StyleSync AI. Crafted with an editorial fashion perspective.
      </footer>
    </div>
  );
}
