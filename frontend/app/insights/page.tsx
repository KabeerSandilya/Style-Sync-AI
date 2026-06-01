"use client";

import * as React from "react";
import { Sparkles, ChevronLeft, ArrowRight, TrendingUp, HelpCircle, EyeOff, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Garment, Outfit } from "@/types";

interface GarmentWithStats extends Garment {
  wearCount: number;
}

interface OutfitWithStats extends Outfit {
  wearCount: number;
}

interface InsightsData {
  mostWornGarments: GarmentWithStats[];
  leastWornGarments: GarmentWithStats[];
  neverWornGarments: Garment[];
  mostWornOutfits: OutfitWithStats[];
  recentlyWornOutfits: Outfit[];
}

export default function InsightsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // Sidebar data fetching
  const [garments, setGarments] = React.useState<Garment[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [fetchingOutfits, setFetchingOutfits] = React.useState(true);

  // Insights data fetching
  const [fetchingInsights, setFetchingInsights] = React.useState(true);
  const [insights, setInsights] = React.useState<InsightsData | null>(null);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error("Error fetching wardrobe insights:", error);
    } finally {
      setFetchingInsights(false);
    }
  };

  const fetchGarments = async () => {
    try {
      const res = await fetch("/api/garments");
      const data = await res.json();
      if (data.success) {
        setGarments(data.data);
      }
    } catch (error) {
      console.error("Error fetching garments for sidebar:", error);
    } finally {
      setFetchingGarments(false);
    }
  };

  const fetchOutfits = async () => {
    try {
      const res = await fetch("/api/outfits");
      const data = await res.json();
      if (data.success) {
        setOutfits(data.data);
      }
    } catch (error) {
      console.error("Error fetching outfits for sidebar:", error);
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

  // Helper to check if wear history is insufficient
  const hasInsufficientHistory = React.useMemo(() => {
    if (!insights) return true;
    // If the user has never worn any outfits, mostWornOutfits will be empty.
    return insights.mostWornOutfits.length === 0;
  }, [insights]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      {/* Editor Navbar Chrome */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Wardrobe Insights"
      />

      {/* Wardrobe Drawer Sidebar Overlay */}
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

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-12 flex flex-col gap-16">
        {/* Editorial Hero Block */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/30">
          <div className="flex flex-col gap-2 max-w-xl">
            <button
              onClick={() => router.push("/editor")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-semibold uppercase tracking-wider font-sans mb-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
              Wardrobe <span className="italic font-light text-primary">analytics</span>.
              </h1>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Reflective insights built from your styling patterns and wear history.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <div className="w-full flex-1">
          {fetchingInsights ? (
            /* Editorial Pulse Skeleton Loader */
            <div className="flex flex-col gap-12 animate-pulse">
              {[1, 2].map((sectionKey) => (
                <div key={sectionKey} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-6 w-48 bg-accent/30 rounded-none" />
                    <div className="h-4 w-72 bg-accent/20 rounded-none" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((cardKey) => (
                      <div key={cardKey} className="border border-border/20 bg-card/40 flex flex-col h-72">
                        <div className="flex-1 bg-accent/20" />
                        <div className="p-4 flex flex-col gap-2">
                          <div className="h-4 bg-accent/30 w-3/4" />
                          <div className="h-3 bg-accent/20 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hasInsufficientHistory ? (
            /* Premium Empty State */
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 border border-dashed border-border/60 bg-card/20 rounded-none gap-6 max-w-xl mx-auto">
              <div className="w-12 h-12 bg-accent/30 flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-xl font-medium text-foreground tracking-tight select-none">
                  Wear more outfits to unlock wardrobe insights.
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  Insights become more useful as your style history grows.
                </p>
              </div>
              <Button
                onClick={() => router.push("/editor")}
                className="rounded-none px-6 py-5 text-xs font-semibold uppercase tracking-wider shadow-md mt-2 flex items-center gap-1.5"
              >
                <span>Explore Recommendations</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            /* Insights Content Sections */
            <div className="flex flex-col gap-20">
              {/* 1. Most Worn Garments */}
              {insights && insights.mostWornGarments.length > 0 && (
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5 border-b border-border/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <h2 className="font-serif text-2xl font-medium tracking-tight">Most Worn</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">
                      Your wardrobe staples.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {insights.mostWornGarments.map((garment) => (
                      <div
                        key={garment.id}
                        onClick={() => handleGarmentClick(garment)}
                        className="group bg-card border border-border/30 hover:border-border/80 transition-all duration-300 flex flex-col h-full cursor-pointer rounded-none shadow-xs hover:shadow-md"
                      >
                        <div className="aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-4 border-b border-border/10 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={garment.imageUrl}
                            alt={garment.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-103"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-1 gap-1">
                          <h3 className="font-serif text-md font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                            {garment.name}
                          </h3>
                          <p className="text-[10px] text-primary font-serif font-semibold italic mt-auto pt-2 border-t border-border/10">
                            Worn {garment.wearCount} {garment.wearCount === 1 ? "time" : "times"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Most Worn Outfits */}
              {insights && insights.mostWornOutfits.length > 0 && (
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5 border-b border-border/10 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h2 className="font-serif text-2xl font-medium tracking-tight">Most Worn Outfits</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">
                      Looks you rely on most.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {insights.mostWornOutfits.map((outfit) => {
                      const garmentsList = outfit.garments.map((g) => g.garment);
                      const garmentCount = garmentsList.length;

                      return (
                        <div
                          key={outfit.id}
                          onClick={() => handleOutfitClick(outfit)}
                          className="group bg-card border border-border/30 hover:border-border/80 transition-all duration-300 flex flex-col h-full cursor-pointer rounded-none shadow-xs hover:shadow-md"
                        >
                          <div className="aspect-[4/5] w-full border-b border-border/20 overflow-hidden relative bg-[#fcf9f5] dark:bg-[#151513]">
                            {/* Flatlay Collage Preview */}
                            {garmentCount === 0 ? (
                              <div className="w-full h-full bg-accent/20 flex items-center justify-center text-muted-foreground">
                                <Sparkles className="w-6 h-6 stroke-[1.5]" />
                              </div>
                            ) : garmentCount === 1 ? (
                              <div className="w-full h-full p-4 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={garmentsList[0].imageUrl}
                                  alt={garmentsList[0].name}
                                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                              </div>
                            ) : garmentCount === 2 ? (
                              <div className="w-full h-full relative flex items-center justify-center p-4">
                                <div className="absolute left-[15%] w-[45%] h-[80%] flex items-center justify-center transform -rotate-6 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-[1.02]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={garmentsList[0].imageUrl}
                                    alt={garmentsList[0].name}
                                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                                  />
                                </div>
                                <div className="absolute right-[15%] w-[45%] h-[80%] flex items-center justify-center transform rotate-6 z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-[1.04]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={garmentsList[1].imageUrl}
                                    alt={garmentsList[1].name}
                                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full relative flex items-center justify-center p-4">
                                <div className="absolute left-[10%] w-[40%] h-[70%] flex items-center justify-center transform -rotate-12 translate-y-4 opacity-80 transition-transform duration-300 group-hover:-rotate-18 group-hover:translate-x-[-4px]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={garmentsList[0].imageUrl}
                                    alt={garmentsList[0].name}
                                    className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                                  />
                                </div>
                                <div className="absolute right-[10%] w-[40%] h-[70%] flex items-center justify-center transform rotate-12 translate-y-4 opacity-80 transition-transform duration-300 group-hover:rotate-18 group-hover:translate-x-[4px]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={garmentsList[1].imageUrl}
                                    alt={garmentsList[1].name}
                                    className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                                  />
                                </div>
                                <div className="absolute w-[50%] h-[80%] flex items-center justify-center transform -translate-y-2 z-10 transition-all duration-300 group-hover:scale-[1.05] group-hover:-translate-y-4">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={garmentsList[2].imageUrl}
                                    alt={garmentsList[2].name}
                                    className="max-h-full max-w-full object-contain filter drop-shadow-xl"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex flex-col flex-1 gap-1.5 bg-card/60 backdrop-blur-xs">
                            <h3 className="font-serif text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                              {outfit.name}
                            </h3>
                            <p className="text-[10px] text-primary font-serif font-semibold italic mt-auto pt-2 border-t border-border/10">
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
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5 border-b border-border/10 pb-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      <h2 className="font-serif text-2xl font-medium tracking-tight">Least Worn</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">
                      Items that may deserve more attention.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {insights.leastWornGarments.map((garment) => (
                      <div
                        key={garment.id}
                        onClick={() => handleGarmentClick(garment)}
                        className="group bg-card border border-border/30 hover:border-border/80 transition-all duration-300 flex flex-col h-full cursor-pointer rounded-none shadow-xs hover:shadow-md"
                      >
                        <div className="aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-4 border-b border-border/10 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={garment.imageUrl}
                            alt={garment.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-103"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-1 gap-1">
                          <h3 className="font-serif text-md font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                            {garment.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground/80 font-sans uppercase tracking-wider font-bold mt-auto pt-2 border-t border-border/10">
                            Worn {garment.wearCount} {garment.wearCount === 1 ? "time" : "times"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Never Worn Garments */}
              {insights && insights.neverWornGarments.length > 0 && (
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5 border-b border-border/10 pb-3">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-primary" />
                      <h2 className="font-serif text-2xl font-medium tracking-tight">Never Worn</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">
                      Pieces waiting for their first outing.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {insights.neverWornGarments.map((garment) => (
                      <div
                        key={garment.id}
                        onClick={() => handleGarmentClick(garment)}
                        className="group bg-card border border-border/30 hover:border-border/80 transition-all duration-300 flex flex-col h-full cursor-pointer rounded-none shadow-xs hover:shadow-md"
                      >
                        <div className="aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] flex items-center justify-center p-4 border-b border-border/10 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={garment.imageUrl}
                            alt={garment.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-103"
                            loading="lazy"
                          />
                          <span className="absolute bottom-3 left-3 bg-background/85 backdrop-blur-xs text-[9px] uppercase tracking-wider font-semibold text-primary px-2 py-0.5 border border-border/30 rounded-xs select-none">
                            {garment.category}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col flex-1 gap-1">
                          <h3 className="font-serif text-md font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                            {garment.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground/60 font-sans uppercase tracking-wider font-semibold mt-auto pt-2 border-t border-border/10">
                            Never worn
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6 bg-card/10 text-center font-sans text-xs text-muted-foreground mt-20">
        <p>© 2026 StyleSync AI. Crafted with an editorial fashion perspective.</p>
      </footer>
    </div>
  );
}
