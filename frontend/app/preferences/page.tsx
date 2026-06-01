"use client";

import * as React from "react";
import { Sparkles, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Garment, Outfit } from "@/types";

interface PreferencesProfile {
  favoriteColors: string[];
  favoriteStyles: string[];
  favoriteCategories: string[];
  favoriteSeasons: string[];
  favoriteTypes: string[];
}

export default function PreferencesPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Sidebar Drawer state
  const [garments, setGarments] = React.useState<Garment[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [fetchingOutfits, setFetchingOutfits] = React.useState(true);

  // Preferences learned profile state
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<PreferencesProfile | null>(null);

  const fetchSidebarData = async () => {
    try {
      const [garmentsRes, outfitsRes] = await Promise.all([
        fetch("/api/garments"),
        fetch("/api/outfits"),
      ]);
      const garmentsData = await garmentsRes.json();
      const outfitsData = await outfitsRes.json();

      if (garmentsData.success) setGarments(garmentsData.data);
      if (outfitsData.success) setOutfits(outfitsData.data);
    } catch (e) {
      console.error("Failed to fetch sidebar data:", e);
    } finally {
      setFetchingGarments(false);
      setFetchingOutfits(false);
    }
  };

  const [threshold, setThreshold] = React.useState(5);
  const [savingThreshold, setSavingThreshold] = React.useState(false);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/preferences");
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setThreshold(data.data.threshold ?? 5);
      }
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = async (newVal: number) => {
    setSavingThreshold(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: newVal }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setThreshold(data.data.threshold ?? newVal);
      }
    } catch (e) {
      console.error("Failed to save threshold:", e);
    } finally {
      setSavingThreshold(false);
    }
  };

  React.useEffect(() => {
    fetchSidebarData();
    fetchPreferences();
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

  // Check if there are any learned preferences to display
  const hasInsufficientData = React.useMemo(() => {
    if (!profile) return true;
    return (
      profile.favoriteColors.length === 0 &&
      profile.favoriteStyles.length === 0 &&
      profile.favoriteCategories.length === 0 &&
      profile.favoriteSeasons.length === 0 &&
      profile.favoriteTypes.length === 0
    );
  }, [profile]);

  // Color mapper helper to render editorial visual colored dots
  const getColorDotStyle = (colorName: string) => {
    const c = colorName.toLowerCase();
    
    // Palette mapper
    const map: Record<string, string> = {
      black: "bg-black border border-border/40",
      white: "bg-white border border-border/60",
      grey: "bg-gray-400 border border-border/20",
      gray: "bg-gray-400 border border-border/20",
      brown: "bg-[#8B5A2B]",
      beige: "bg-[#F5F5DC] border border-border/30",
      cream: "bg-[#FFFDD0] border border-border/30",
      sand: "bg-[#E6C280] border border-border/30",
      blue: "bg-blue-600",
      navy: "bg-blue-900",
      green: "bg-green-600",
      sage: "bg-[#9CAF88]",
      olive: "bg-[#556B2F]",
      red: "bg-red-600",
      burgundy: "bg-[#800020]",
      pink: "bg-pink-400",
      orange: "bg-orange-500",
      yellow: "bg-yellow-400",
    };

    // Return mapped class or a hash-based color if not found
    for (const key of Object.keys(map)) {
      if (c.includes(key)) return map[key];
    }

    return "bg-primary/40";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      {/* Editor Navbar Chrome */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Style Preferences"
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-8 py-12 flex flex-col gap-12 select-none">
        
        {/* Editorial Hero Header */}
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
              Learned <span className="italic font-light text-primary">preferences</span>.
            </h1>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Your signature style profile derived automatically from wardrobe interactions, logs, and feedback history.
            </p>
          </div>
        </section>

        {/* Preference Calibration / Threshold Slider Card */}
        <section className="border border-border/30 bg-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-none shadow-xs">
          <div className="flex flex-col gap-1.5 max-w-md">
            <h3 className="font-serif text-lg font-medium tracking-tight">
              Engagement Threshold
            </h3>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Adjust the minimum engagement score required for an attribute to be classified as a &quot;favorite&quot;. 
              Higher thresholds reveal your absolute staples, while lower values capture broader taste signals.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-64">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider font-sans">
              <span>Threshold: {threshold}</span>
              {savingThreshold && (
                <span className="text-[10px] text-primary normal-case animate-pulse">Saving...</span>
              )}
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              onMouseUp={() => handleThresholdChange(threshold)}
              onTouchEnd={() => handleThresholdChange(threshold)}
              className="w-full h-1.5 bg-accent/30 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-sans">
              <span>1 (Broad)</span>
              <span>15 (Standard)</span>
              <span>30 (Strict)</span>
            </div>
          </div>
        </section>

        {/* Preferences Presentation Content */}
        <div className="w-full flex-1">
          {loading ? (
            /* Editorial Skeleton Pulse Loader */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
              {[1, 2, 3, 4].map((key) => (
                <div key={key} className="border border-border/20 bg-card/40 p-6 h-48 flex flex-col gap-4">
                  <div className="h-5 bg-accent/30 w-1/3 rounded-none" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((subKey) => (
                      <div key={subKey} className="h-7 w-20 bg-accent/20 rounded-none" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hasInsufficientData ? (
            /* Spec-designated Empty State */
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 border border-dashed border-border/60 bg-card/20 rounded-none gap-5 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-accent/30 flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
                  Wear more outfits to help StyleSync understand your style.
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  Preferences are learned automatically from your wardrobe activity.
                </p>
              </div>
            </div>
          ) : (
            /* Learned Preferences Lists */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* 1. Favorite Colors */}
              {profile && profile.favoriteColors.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4 rounded-none shadow-xs">
                  <h3 className="font-serif text-lg font-medium tracking-tight border-b border-border/10 pb-2">
                    Favorite Colors
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.favoriteColors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 bg-background border border-border/40 text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5 shadow-2xs"
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${getColorDotStyle(color)} shrink-0`} />
                        <span>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Favorite Styles */}
              {profile && profile.favoriteStyles.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4 rounded-none shadow-xs">
                  <h3 className="font-serif text-lg font-medium tracking-tight border-b border-border/10 pb-2">
                    Favorite Styles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteStyles.map((style) => (
                      <div
                        key={style}
                        className="bg-accent/25 border border-border/40 text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5"
                      >
                        {style}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Favorite Categories */}
              {profile && profile.favoriteCategories.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4 rounded-none shadow-xs">
                  <h3 className="font-serif text-lg font-medium tracking-tight border-b border-border/10 pb-2">
                    Favorite Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteCategories.map((cat) => (
                      <div
                        key={cat}
                        className="bg-primary/10 border border-primary/20 text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5 text-primary"
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Favorite Clothing Types */}
              {profile && profile.favoriteTypes.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4 rounded-none shadow-xs">
                  <h3 className="font-serif text-lg font-medium tracking-tight border-b border-border/10 pb-2">
                    Favorite Clothing Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteTypes.map((type) => (
                      <div
                        key={type}
                        className="bg-card border border-border/40 text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5 text-muted-foreground shadow-3xs"
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
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
