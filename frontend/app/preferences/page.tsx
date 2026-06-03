"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Sparkles, ChevronLeft, Check, Pencil, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { cn } from "@/lib/utils";
import { Garment, Outfit } from "@/types";

const MANUAL_COLORS: { label: string; hex: string }[] = [
  { label: "Black",    hex: "#1a1a1a" },
  { label: "White",    hex: "#f5f5f5" },
  { label: "Navy",     hex: "#1b2a4a" },
  { label: "Beige",    hex: "#d4b896" },
  { label: "Brown",    hex: "#7c5a3e" },
  { label: "Grey",     hex: "#8a8a8a" },
  { label: "Olive",    hex: "#6b7045" },
  { label: "Burgundy", hex: "#6d1a2e" },
  { label: "Cream",    hex: "#fffefb" },
  { label: "Sage",     hex: "#708272" },
  { label: "Blue",     hex: "#3b6ea5" },
  { label: "Green",    hex: "#3a7d44" },
  { label: "Red",      hex: "#c0392b" },
];

const MANUAL_STYLES = [
  "Casual", "Formal", "Streetwear", "Minimal", "Athleisure", "Business Casual", "Bohemian",
];

interface PreferencesProfile {
  favoriteColors: string[];
  favoriteStyles: string[];
  favoriteCategories: string[];
  favoriteSeasons: string[];
  favoriteTypes: string[];
}

function PreferenceChip({ children, variant = "default" }: { children: React.ReactNode; variant?: "color" | "style" | "category" | "default" }) {
  const cls = {
    color: "bg-background border border-border/40 text-foreground",
    style: "bg-accent/30 border border-border/30 text-foreground",
    category: "bg-primary/10 border border-primary/20 text-primary",
    default: "bg-muted/50 border border-border/30 text-muted-foreground",
  }[variant];
  return (
    <div className={`inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 ${cls}`}>
      {children}
    </div>
  );
}

export default function PreferencesPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const [garments, setGarments] = React.useState<Garment[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [fetchingOutfits, setFetchingOutfits] = React.useState(true);

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<PreferencesProfile | null>(null);
  const [threshold, setThreshold] = React.useState(5);
  const [savingThreshold, setSavingThreshold] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editColors, setEditColors] = React.useState<string[]>([]);
  const [editStyles, setEditStyles] = React.useState<string[]>([]);
  const [savingManual, setSavingManual] = React.useState(false);

  const fetchSidebarData = async () => {
    try {
      const [gr, or] = await Promise.all([fetch("/api/garments"), fetch("/api/outfits")]);
      const gd = await gr.json();
      const od = await or.json();
      if (gd.success) setGarments(gd.data);
      if (od.success) setOutfits(od.data);
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingGarments(false);
      setFetchingOutfits(false);
    }
  };

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/preferences");
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setThreshold(data.data.threshold ?? 5);
        setEditColors(data.data.favoriteColors ?? []);
        setEditStyles(data.data.favoriteStyles ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    setSavingManual(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteColors: editColors, favoriteStyles: editStyles }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setEditColors(data.data.favoriteColors ?? []);
        setEditStyles(data.data.favoriteStyles ?? []);
        setEditOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingManual(false);
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
      console.error(e);
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

  const getColorHex = (name: string): string | null => {
    return MANUAL_COLORS.find((c) => c.label.toLowerCase() === name.toLowerCase())?.hex ?? null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Style Preferences"
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

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-8 py-12 flex flex-col gap-10">

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
                <SlidersHorizontal className="w-4.5 h-4.5" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                Learned <span className="italic font-light text-primary">preferences</span>.
              </h1>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[52ch]">
              Your signature style profile derived automatically from wardrobe interactions, logs, and feedback history.
            </p>
          </div>
        </section>

        {/* ── Engagement threshold card ─────────────────────── */}
        <section className="border border-border/30 bg-card p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-enter-2">
          <div className="flex flex-col gap-1.5 max-w-sm">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-6 bg-primary shrink-0" />
              <h3 className="font-serif text-xl font-medium tracking-tight">Engagement Threshold</h3>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Minimum engagement score for an attribute to count as a &ldquo;favourite&rdquo;. Higher reveals absolute staples; lower captures broader taste signals.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-72">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">{threshold}</span>
                <span className="font-sans text-[10px] text-muted-foreground">
                  {threshold <= 5 ? "(Broad)" : threshold <= 15 ? "(Standard)" : "(Strict)"}
                </span>
              </div>
              {savingThreshold && (
                <span className="font-sans text-[10px] text-primary animate-pulse uppercase tracking-wider">Saving…</span>
              )}
            </div>
            <div className="relative">
              <div className="h-1 bg-accent/40 w-full" />
              <div
                className="absolute top-0 left-0 h-1 bg-primary transition-all duration-200"
                style={{ width: `${((threshold - 1) / 29) * 100}%` }}
              />
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                onMouseUp={() => handleThresholdChange(threshold)}
                onTouchEnd={() => handleThresholdChange(threshold)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-1"
                aria-label="Engagement threshold"
              />
            </div>
            <div className="flex justify-between font-sans text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              <span>1 · Broad</span>
              <span>15 · Standard</span>
              <span>30 · Strict</span>
            </div>
          </div>
        </section>

        {/* ── Manual preference edit card ───────────────────── */}
        <section className="border border-border/30 bg-card animate-enter-3">
          <div className="flex items-center justify-between p-6 md:p-7">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#ebdcd0] shrink-0" />
                <h3 className="font-serif text-xl font-medium tracking-tight">Edit Style Preferences</h3>
              </div>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed ml-3.5 mt-0.5">
                Manually set your preferred colours and aesthetics. These seed recommendations immediately.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen((v) => !v)}
              className="rounded-none border-border/40 text-[10px] font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {editOpen ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
              {editOpen ? "Cancel" : "Edit"}
            </Button>
          </div>

          {editOpen && (
            <div className="flex flex-col gap-7 px-6 md:px-7 pb-7 pt-1 border-t border-border/20">
              {/* Colour picker */}
              <div className="flex flex-col gap-4 pt-5">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Favourite Colours</span>
                <div className="flex flex-wrap gap-3.5">
                  {MANUAL_COLORS.map(({ label, hex }) => {
                    const sel = editColors.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => setEditColors((p) => p.includes(label) ? p.filter((c) => c !== label) : [...p, label])}
                        className="flex flex-col items-center gap-1.5 cursor-pointer"
                        aria-pressed={sel}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 border-2 relative transition-all duration-150",
                            sel ? "border-primary scale-110 shadow-md shadow-black/10" : "border-transparent hover:border-primary/40 hover:scale-105"
                          )}
                          style={{ backgroundColor: hex }}
                        >
                          {sel && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check
                                className="w-2.5 h-2.5"
                                style={{ color: ["White", "Cream", "Beige"].includes(label) ? "#1a1a1a" : "#ffffff" }}
                              />
                            </div>
                          )}
                        </div>
                        <span className={cn("text-[8px] font-sans font-bold uppercase tracking-wider", sel ? "text-primary" : "text-muted-foreground")}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style picker */}
              <div className="flex flex-col gap-4">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Preferred Aesthetics</span>
                <div className="flex flex-wrap gap-2">
                  {MANUAL_STYLES.map((style) => {
                    const sel = editStyles.includes(style);
                    return (
                      <button
                        key={style}
                        onClick={() => setEditStyles((p) => p.includes(style) ? p.filter((s) => s !== style) : [...p, style])}
                        aria-pressed={sel}
                        className={cn(
                          "px-4 py-2.5 font-sans text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer",
                          sel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border/40 hover:border-primary/60 hover:text-foreground"
                        )}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/10">
                <Button
                  onClick={handleManualSave}
                  disabled={savingManual}
                  size="sm"
                  className="rounded-none px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  {savingManual ? "Saving…" : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── Learned preferences display ───────────────────── */}
        <div className="w-full flex-1 animate-enter-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="border border-border/20 bg-card/40 p-6 h-44 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-accent/40" />
                    <div className="h-5 bg-accent/30 w-1/3" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[1, 2, 3].map((sk) => (
                      <div key={sk} className="h-7 w-20 bg-accent/20" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hasInsufficientData ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 gap-6 max-w-md mx-auto">
              <div className="relative">
                <div className="w-20 h-20 border border-dashed border-border/50 flex items-center justify-center text-primary">
                  <SlidersHorizontal className="w-8 h-8 stroke-[1]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent/40 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-2 max-w-[32ch]">
                <h3 className="font-serif text-2xl font-medium tracking-tight">
                  Preferences <span className="italic font-light text-primary">emerge</span> through wear.
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  StyleSync learns your style automatically from your wardrobe activity and outfit history.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Favourite Colors */}
              {profile && profile.favoriteColors.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                    <div className="w-1.5 h-6 bg-primary shrink-0" />
                    <h3 className="font-serif text-lg font-medium tracking-tight">Favourite Colors</h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {profile.favoriteColors.map((color) => {
                      const hex = getColorHex(color);
                      return (
                        <div key={color} className="flex items-center gap-2 bg-background border border-border/40 px-3 py-1.5">
                          {hex && (
                            <div
                              className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider">{color}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Favourite Styles */}
              {profile && profile.favoriteStyles.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                    <div className="w-1.5 h-6 bg-[#e3e8e4] shrink-0" />
                    <h3 className="font-serif text-lg font-medium tracking-tight">Favourite Styles</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteStyles.map((style) => (
                      <PreferenceChip key={style} variant="style">{style}</PreferenceChip>
                    ))}
                  </div>
                </div>
              )}

              {/* Favourite Categories */}
              {profile && profile.favoriteCategories.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                    <div className="w-1.5 h-6 bg-primary/40 shrink-0" />
                    <h3 className="font-serif text-lg font-medium tracking-tight">Favourite Categories</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteCategories.map((cat) => (
                      <PreferenceChip key={cat} variant="category">{cat}</PreferenceChip>
                    ))}
                  </div>
                </div>
              )}

              {/* Favourite Types */}
              {profile && profile.favoriteTypes.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                    <div className="w-1.5 h-6 bg-muted shrink-0" />
                    <h3 className="font-serif text-lg font-medium tracking-tight">Favourite Types</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteTypes.map((type) => (
                      <PreferenceChip key={type} variant="default">{type}</PreferenceChip>
                    ))}
                  </div>
                </div>
              )}

              {/* Favourite Seasons */}
              {profile && profile.favoriteSeasons.length > 0 && (
                <div className="border border-border/30 bg-card p-6 flex flex-col gap-4 md:col-span-2">
                  <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                    <div className="w-1.5 h-6 bg-accent shrink-0" />
                    <h3 className="font-serif text-lg font-medium tracking-tight">Favourite Seasons</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {profile.favoriteSeasons.map((season) => (
                      <div
                        key={season}
                        className="border border-border/30 bg-background p-3 text-center font-sans text-[10px] font-bold uppercase tracking-wider text-foreground/70"
                      >
                        {season}
                      </div>
                    ))}
                  </div>
                </div>
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
