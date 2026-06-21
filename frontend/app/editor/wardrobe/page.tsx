"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Upload,
  Heart,
  Plus,
  Menu,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { UploadGarmentDialog } from "@/components/editor/upload-garment-dialog";
import { WardrobeGrid } from "@/components/editor/wardrobe-grid";
import { GarmentDetailsDialog } from "@/components/editor/garment-details-dialog";
import { OutfitGrid } from "@/components/editor/outfit-grid";
import { OutfitBuilderDialog } from "@/components/editor/outfit-builder-dialog";
import { OutfitExportCard } from "@/components/editor/outfit-export-card";
import { exportOutfitAsPng } from "@/lib/export-outfit";
import { cn } from "@/lib/utils";
import { QK } from "@/lib/query-keys";
import { useGarments } from "@/lib/hooks/use-garments";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { useToggleGarmentFavorite } from "@/lib/hooks/use-toggle-garment-favorite";
import { useToggleOutfitFavorite } from "@/lib/hooks/use-toggle-outfit-favorite";
import { useGenerateOutfits } from "@/lib/hooks/use-generate-outfits";
import { useShareOutfit, useRevokeShare } from "@/lib/hooks/use-share-outfit";
import { Garment, Outfit } from "@/types";

function WardrobeStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedGarment, setSelectedGarment] = React.useState<Garment | null>(null);

  // Outfit States
  const [isOutfitBuilderOpen, setIsOutfitBuilderOpen] = React.useState(false);
  const [selectedOutfit, setSelectedOutfit] = React.useState<Outfit | null>(null);

  // View Switching State
  const [activeView, setActiveView] = React.useState<"wardrobe" | "outfits">("wardrobe");

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Export ref for off-screen card capture
  const exportCardRef = React.useRef<HTMLDivElement>(null);
  const [exportingOutfit, setExportingOutfit] = React.useState<Outfit | null>(null);

  // Filtering states
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // TanStack Query
  const { data: garments = [], isLoading: fetchingGarments } = useGarments();
  const { data: outfits = [], isLoading: fetchingOutfits } = useOutfits();
  const toggleGarmentFav = useToggleGarmentFavorite();
  const toggleOutfitFav = useToggleOutfitFavorite();
  const generateOutfitsMutation = useGenerateOutfits();
  const shareOutfitMutation = useShareOutfit();
  const revokeShareMutation = useRevokeShare();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const mainCategories = [
    "All",
    "Tops",
    "Bottoms",
    "Outerwear",
    "Footwear",
    "Accessories",
  ];

  const extraCategories = [
    "Formalwear",
    "Sportswear",
    "Ethnicwear",
    "Uncategorized",
  ];

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleExportOutfit = async (outfit: Outfit) => {
    setExportingOutfit(outfit);
    await new Promise((r) => setTimeout(r, 100));
    if (!exportCardRef.current) {
      setExportingOutfit(null);
      return;
    }
    try {
      await exportOutfitAsPng(outfit, exportCardRef.current);
    } catch {
      triggerToast("Export failed. Please try again.");
    } finally {
      setExportingOutfit(null);
    }
  };

  const handleShareOutfit = (outfit: Outfit) => {
    shareOutfitMutation.mutate(outfit.id, {
      onSuccess: async (data) => {
        if (!data.success) {
          triggerToast("Failed to generate share link.");
          return;
        }
        await navigator.clipboard.writeText(data.data.url);
        triggerToast("Share link copied to clipboard.");
      },
      onError: () => triggerToast("Failed to generate share link."),
    });
  };

  const handleRevokeShare = (outfit: Outfit) => {
    revokeShareMutation.mutate(outfit.id, {
      onSuccess: (data) => {
        if (!data.success) {
          triggerToast("Failed to revoke share link.");
          return;
        }
        triggerToast("Share link revoked.");
      },
      onError: () => triggerToast("Failed to revoke share link."),
    });
  };

  const handleGenerateLooks = async () => {
    if (generateOutfitsMutation.isPending) return;
    try {
      const data = await generateOutfitsMutation.mutateAsync(undefined);
      if (data.success) {
        const label =
          data.data?.length === 0
            ? data.message ?? "All looks already exist in your wardrobe."
            : `${data.data.length} new look${data.data.length === 1 ? "" : "s"} generated.`;
        triggerToast(label);
      } else if (data.error === "not_enough_garments") {
        triggerToast(`Classify at least 3 garments first (you have ${data.classifiedCount ?? 0}).`);
      } else {
        triggerToast(data.error ?? "Generation failed. Please try again.");
      }
    } catch {
      triggerToast("Network error. Please try again.");
    }
  };

  // Deep-linking parameter handling — runs once after initial data load completes
  const deepLinkHandled = React.useRef(false);
  React.useEffect(() => {
    if (deepLinkHandled.current) return;
    if (fetchingGarments || fetchingOutfits) return;

    deepLinkHandled.current = true;

    const selectedGarmentId = searchParams.get("selectedGarmentId");
    const selectedOutfitId = searchParams.get("selectedOutfitId");
    const addClothing = searchParams.get("addClothing") === "true";
    const view = searchParams.get("view");

    if (view === "outfits") {
      setActiveView("outfits");
    }

    if (addClothing) {
      setIsUploadOpen(true);
    }

    if (selectedGarmentId && garments.length > 0) {
      const g = garments.find((item) => item.id === selectedGarmentId);
      if (g) setSelectedGarment(g);
    }

    if (selectedOutfitId && outfits.length > 0) {
      const o = outfits.find((item) => item.id === selectedOutfitId);
      if (o) {
        setSelectedOutfit(o);
        setIsOutfitBuilderOpen(true);
      }
    }
  }, [searchParams, garments, outfits, fetchingGarments, fetchingOutfits]);

  const handleAddClothing = () => {
    setIsSidebarOpen(false);
    setIsUploadOpen(true);
  };

  const handleFavoriteToggle = (id: string, isFavorite: boolean) => {
    toggleGarmentFav.mutate({ id, isFavorite }, {
      onError: () => triggerToast("Failed to update favorite status."),
    });
  };

  const handleOutfitFavoriteToggle = (id: string, isFavorite: boolean) => {
    toggleOutfitFav.mutate({ id, isFavorite }, {
      onError: () => triggerToast("Failed to update favorite status."),
    });
  };

  // Memoized filtered garments list
  const filteredGarments = React.useMemo(() => {
    return garments.filter((garment) => {
      let matchesCategory = false;
      if (selectedCategory === "All") {
        matchesCategory = true;
      } else if (selectedCategory.toLowerCase() === "tops") {
        matchesCategory =
          garment.category.toLowerCase() === "topwear" ||
          garment.category.toLowerCase() === "tops";
      } else if (selectedCategory.toLowerCase() === "bottoms") {
        matchesCategory =
          garment.category.toLowerCase() === "bottomwear" ||
          garment.category.toLowerCase() === "bottoms";
      } else {
        matchesCategory =
          garment.category.toLowerCase() === selectedCategory.toLowerCase();
      }
      const matchesFavorite = !showFavorites || garment.isFavorite;
      return matchesCategory && matchesFavorite;
    });
  }, [garments, selectedCategory, showFavorites]);

  // Memoized filtered outfits list
  const filteredOutfits = React.useMemo(() => {
    return outfits.filter((outfit) => {
      return !showFavorites || outfit.isFavorite;
    });
  }, [outfits, showFavorites]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      {/* Editor Navbar Chrome */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Wardrobe Studio"
      />

      {/* Wardrobe Drawer Sidebar Overlay */}
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddClothing={handleAddClothing}
        garments={garments}
        loading={fetchingGarments}
        onGarmentClick={(g) => {
          setIsSidebarOpen(false);
          setSelectedGarment(g);
        }}
        outfits={outfits}
        loadingOutfits={fetchingOutfits}
        onOutfitClick={(o) => {
          setIsSidebarOpen(false);
          setSelectedOutfit(o);
          setIsOutfitBuilderOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-12 flex flex-col gap-12">
        {/* Editorial Hero Block */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/30">
          <div className="flex flex-col gap-2 max-w-xl">
            <button
              onClick={() => router.push("/editor")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-semibold uppercase tracking-wider font-sans mb-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
              Manage your <span className="italic font-light text-primary">wardrobe collection</span>.
            </h1>
          </div>

          {activeView === "wardrobe" ? (
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="rounded-none px-6 py-6 text-sm font-medium tracking-wide shadow-md group animate-none"
            >
              Upload Garment
              <Upload className="w-4 h-4 ml-2 transition-transform group-hover:-translate-y-0.5" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                setSelectedOutfit(null);
                setIsOutfitBuilderOpen(true);
              }}
              className="rounded-none px-6 py-6 text-sm font-medium tracking-wide shadow-md group animate-none"
            >
              Create Outfit
              <Plus className="w-4 h-4 ml-2 transition-transform group-hover:rotate-90 duration-300" />
            </Button>
          )}

          {/* Premium Garment Upload Dialog */}
          <UploadGarmentDialog
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onSuccess={(msg) => {
              triggerToast(msg || "Garment uploaded successfully.");
              queryClient.invalidateQueries({ queryKey: QK.garments() });
            }}
          />

          {/* Premium Garment Details & Edit Dialog */}
          <GarmentDetailsDialog
            garment={selectedGarment}
            open={!!selectedGarment}
            onClose={() => setSelectedGarment(null)}
            onSuccess={(msg) => {
              triggerToast(msg || "Garment updated successfully.");
              queryClient.invalidateQueries({ queryKey: QK.garments() });
            }}
          />

          {/* Premium Outfit Builder Dialog */}
          <OutfitBuilderDialog
            open={isOutfitBuilderOpen}
            onOpenChange={(val) => {
              setIsOutfitBuilderOpen(val);
              if (!val) setSelectedOutfit(null);
            }}
            garments={garments}
            outfit={selectedOutfit}
            onSuccess={(msg) => {
              triggerToast(msg || "Outfit saved successfully.");
              queryClient.invalidateQueries({ queryKey: QK.outfits() });
            }}
          />
        </section>

        {/* Full-width Wardrobe / Outfit Workspace */}
        <div className="flex flex-col gap-8 w-full">
          {/* View Switcher Tabs */}
          <div className="flex border-b border-border/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground gap-6">
            <button
              onClick={() => setActiveView("wardrobe")}
              className={cn(
                "pb-3 transition-all hover:text-foreground cursor-pointer relative",
                activeView === "wardrobe" ? "text-foreground font-bold" : ""
              )}
            >
              My Wardrobe
              {activeView === "wardrobe" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveView("outfits")}
              className={cn(
                "pb-3 transition-all hover:text-foreground cursor-pointer relative",
                activeView === "outfits" ? "text-foreground font-bold" : ""
              )}
            >
              Saved Outfits
              {activeView === "outfits" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {activeView === "wardrobe" ? (
            <>
              {/* Lightweight Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/20">
                {/* Category Filter List */}
                <div className="relative flex flex-row items-center gap-x-6 font-sans text-xs uppercase tracking-wider font-semibold text-muted-foreground" ref={dropdownRef}>
                  {mainCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`pb-2 transition-all hover:text-foreground cursor-pointer relative ${
                        selectedCategory === cat ? "text-foreground font-bold" : ""
                      }`}
                    >
                      {cat}
                      {selectedCategory === cat && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                      )}
                    </button>
                  ))}

                  {/* Hamburger menu for extra categories */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={cn(
                        "pb-2 flex items-center gap-1 transition-all hover:text-foreground cursor-pointer relative",
                        extraCategories.includes(selectedCategory) ? "text-foreground font-bold" : ""
                      )}
                      aria-label="More categories"
                      aria-expanded={isDropdownOpen}
                    >
                      <Menu className="w-4 h-4" />
                      {extraCategories.includes(selectedCategory) && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                      )}
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border/40 shadow-xl z-50 py-1.5 focus:outline-none rounded-none animate-in fade-in slide-in-from-top-1 duration-200">
                        {extraCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-muted/80 hover:text-foreground cursor-pointer flex items-center justify-between",
                              selectedCategory === cat ? "text-foreground font-bold bg-muted/40" : "text-muted-foreground"
                            )}
                          >
                            <span>{cat}</span>
                            {selectedCategory === cat && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Favorites Toggle */}
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className={`flex items-center gap-2 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider border transition-all rounded-sm cursor-pointer shrink-0 ${
                    showFavorites
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/80 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${showFavorites ? "fill-primary text-primary" : ""}`} />
                  <span>Favorites</span>
                </button>
              </div>

              {/* Wardrobe Primary Grid Display */}
              <div className="min-h-100">
                <WardrobeGrid
                  garments={filteredGarments}
                  loading={fetchingGarments}
                  onFavoriteToggle={handleFavoriteToggle}
                  onUploadClick={() => setIsUploadOpen(true)}
                  onGarmentClick={(g) => setSelectedGarment(g)}
                />
              </div>
            </>
          ) : (
            <>
              {/* Lightweight Filter Bar for Outfits */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/20">
                <div className="font-serif text-lg text-foreground italic select-none">
                  Your Curated Looks
                </div>

                <div className="flex items-center gap-3">
                  {/* Generate Looks */}
                  <button
                    onClick={handleGenerateLooks}
                    disabled={generateOutfitsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-all rounded-sm cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateOutfitsMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{generateOutfitsMutation.isPending ? "Generating…" : "Generate Looks"}</span>
                  </button>

                  {/* Favorites Toggle for Outfits */}
                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`flex items-center gap-2 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider border transition-all rounded-sm cursor-pointer shrink-0 ${
                      showFavorites
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${showFavorites ? "fill-primary text-primary" : ""}`} />
                    <span>Favorites</span>
                  </button>
                </div>
              </div>

              {/* Saved Outfits Grid Display */}
              <div className="min-h-100">
                <OutfitGrid
                  outfits={filteredOutfits}
                  loading={fetchingOutfits}
                  onFavoriteToggle={handleOutfitFavoriteToggle}
                  onOutfitClick={(o) => {
                    setSelectedOutfit(o);
                    setIsOutfitBuilderOpen(true);
                  }}
                  onCreateOutfitClick={() => {
                    setSelectedOutfit(null);
                    setIsOutfitBuilderOpen(true);
                  }}
                  onExport={handleExportOutfit}
                  onShare={handleShareOutfit}
                  onRevoke={handleRevokeShare}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6 bg-card/10 text-center font-sans text-xs text-muted-foreground">
        <p>© 2026 StyleSync AI. Crafted with an editorial fashion perspective.</p>
      </footer>

      {/* Premium Minimal Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground border border-border/20 px-6 py-4 shadow-xl select-none animate-slide-in font-sans font-medium text-xs flex items-center gap-2 transition-all">
          <Sparkles className="w-4 h-4 text-primary-foreground/90" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-4 hover:opacity-80 transition-opacity p-0.5"
            aria-label="Dismiss toast"
          >
            <span className="font-sans font-bold">✕</span>
          </button>
        </div>
      )}

      {/* Off-screen export card portal — captured by html-to-image */}
      {exportingOutfit &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: -9999,
              left: -9999,
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <OutfitExportCard ref={exportCardRef} outfit={exportingOutfit} />
          </div>,
          document.body
        )}
    </div>
  );
}

export default function WardrobeStudioPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center font-serif text-lg animate-pulse text-muted-foreground">
        Loading Studio...
      </div>
    }>
      <WardrobeStudioContent />
    </React.Suspense>
  );
}
