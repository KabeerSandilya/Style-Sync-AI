"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Sparkles, ChevronLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { HistoryItem } from "@/components/history/history-item";
import { HistoryDetailDialog } from "@/components/history/history-detail-dialog";
import { Garment, Outfit, OutfitWear } from "@/types";

interface WearHistoryItem extends OutfitWear {
  outfit: Outfit;
}

interface GroupedHistory {
  title: string;
  items: WearHistoryItem[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [fetchingHistory, setFetchingHistory] = React.useState(true);
  const [historyItems, setHistoryItems] = React.useState<WearHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<WearHistoryItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your entire wear history? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch("/api/wear-history", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setHistoryItems([]);
        triggerToast("Wear history cleared successfully.");
      } else {
        triggerToast(data.error || "Failed to clear history.");
      }
    } catch (err) {
      console.error("Error clearing history:", err);
      triggerToast("Failed to clear history.");
    }
  };

  // Sidebar states
  const [garments, setGarments] = React.useState<Garment[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [fetchingOutfits, setFetchingOutfits] = React.useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/wear-history");
      const data = await res.json();
      if (data.success) {
        setHistoryItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching wear history:", error);
    } finally {
      setFetchingHistory(false);
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
      console.error("Error fetching garments:", error);
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
      console.error("Error fetching outfits:", error);
    } finally {
      setFetchingOutfits(false);
    }
  };

  React.useEffect(() => {
    fetchHistory();
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

  // Grouping function
  const groupedHistory = React.useMemo(() => {
    const today: WearHistoryItem[] = [];
    const yesterday: WearHistoryItem[] = [];
    const thisWeek: WearHistoryItem[] = [];
    const lastWeek: WearHistoryItem[] = [];
    const earlier: WearHistoryItem[] = [];

    const now = new Date();
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    historyItems.forEach((item) => {
      const date = new Date(item.wornAt);
      const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = dNow.getTime() - dDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        today.push(item);
      } else if (diffDays === 1) {
        yesterday.push(item);
      } else if (diffDays > 1 && diffDays <= 7) {
        thisWeek.push(item);
      } else if (diffDays > 7 && diffDays <= 14) {
        lastWeek.push(item);
      } else {
        earlier.push(item);
      }
    });

    const groups: GroupedHistory[] = [];
    if (today.length > 0) groups.push({ title: "Today", items: today });
    if (yesterday.length > 0) groups.push({ title: "Yesterday", items: yesterday });
    if (thisWeek.length > 0) groups.push({ title: "This Week", items: thisWeek });
    if (lastWeek.length > 0) groups.push({ title: "Last Week", items: lastWeek });
    if (earlier.length > 0) groups.push({ title: "Earlier", items: earlier });

    return groups;
  }, [historyItems]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      {/* Editor Navbar Chrome */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Style Timeline"
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
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-10">
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
              Your style <span className="italic font-light text-primary">journal</span>.
            </h1>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              A chronological retrospective of the silhouettes and combinations you have worn.
            </p>
          </div>
          {historyItems.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="rounded-none border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive text-xs font-semibold uppercase tracking-wider py-4 px-5 shrink-0"
            >
              Clear All History
            </Button>
          )}
        </section>

        {/* History timeline list */}
        <section className="w-full flex-1">
          {fetchingHistory ? (
            /* Editorial Skeleton Loader */
            <div className="flex flex-col gap-8 animate-pulse">
              {[1, 2].map((groupKey) => (
                <div key={groupKey} className="flex flex-col gap-4">
                  <div className="h-5 w-24 bg-accent/30 rounded-none mb-1" />
                  <div className="flex flex-col gap-3">
                    {[1, 2].map((itemKey) => (
                      <div key={itemKey} className="flex gap-4 items-center border border-border/20 p-3 bg-card/40">
                        <div className="w-12 h-14 bg-accent/30" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-4 bg-accent/30 w-1/3" />
                          <div className="h-3 bg-accent/30 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : historyItems.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border/60 bg-card/20 rounded-none gap-5">
              <div className="w-12 h-12 bg-accent/30 flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-serif text-lg font-medium text-foreground tracking-tight select-none">
                  Your wear history will appear here.
                </h3>
                <p className="font-sans text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  Mark outfits as worn to build your personal style timeline.
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
            /* Timeline List grouped chronologically */
            <div className="flex flex-col gap-8">
              {groupedHistory.map((group) => (
                <div key={group.title} className="flex flex-col gap-4">
                  <h3 className="font-serif text-lg italic text-muted-foreground select-none border-b border-border/10 pb-1">
                    {group.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <HistoryItem
                        key={item.id}
                        id={item.id}
                        wornAt={item.wornAt}
                        outfit={item.outfit}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* History Detail Dialog */}
      <HistoryDetailDialog
        wearId={selectedItem?.id || null}
        outfit={selectedItem?.outfit || null}
        wornAt={selectedItem?.wornAt || null}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onDeleteSuccess={(msg) => {
          fetchHistory();
          triggerToast(msg);
        }}
      />

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
    </div>
  );
}
