"use client";

import * as React from "react";
import { Sparkles, ChevronLeft, ArrowRight, CalendarDays, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { HistoryItem } from "@/components/history/history-item";
import { HistoryDetailDialog } from "@/components/history/history-detail-dialog";
import { useGarments } from "@/lib/hooks/use-garments";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { useWearHistory } from "@/lib/hooks/use-wear-history";
import { QK } from "@/lib/query-keys";
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
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<WearHistoryItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastVisible, setToastVisible] = React.useState(false);

  const { data: historyRaw, isLoading: fetchingHistory } = useWearHistory();
  const historyItems: WearHistoryItem[] = historyRaw ?? [];
  const { data: garments = [], isLoading: fetchingGarments } = useGarments();
  const { data: outfits = [], isLoading: fetchingOutfits } = useOutfits();

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3800);
    setTimeout(() => setToastMessage(null), 4200);
  };

  const handleClearAll = async () => {
    if (!confirm("Clear your entire wear history? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/wear-history", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QK.wearHistory() });
        triggerToast("Wear history cleared.");
      } else {
        triggerToast(data.error || "Failed to clear history.");
      }
    } catch {
      triggerToast("Failed to clear history.");
    }
  };

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
      const diffDays = Math.round((dNow.getTime() - dDate.getTime()) / 86400000);

      if (diffDays === 0) today.push(item);
      else if (diffDays === 1) yesterday.push(item);
      else if (diffDays <= 7) thisWeek.push(item);
      else if (diffDays <= 14) lastWeek.push(item);
      else earlier.push(item);
    });

    const groups: GroupedHistory[] = [];
    if (today.length) groups.push({ title: "Today", items: today });
    if (yesterday.length) groups.push({ title: "Yesterday", items: yesterday });
    if (thisWeek.length) groups.push({ title: "This Week", items: thisWeek });
    if (lastWeek.length) groups.push({ title: "Last Week", items: lastWeek });
    if (earlier.length) groups.push({ title: "Earlier", items: earlier });
    return groups;
  }, [historyItems]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Style Timeline"
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-10">

        {/* ── Page header ──────────────────────────────────────── */}
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
                <CalendarDays className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                  Style <span className="italic font-light text-primary">journal</span>.
                </h1>
              </div>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[48ch]">
              A chronological retrospective of the silhouettes and combinations you have worn.
            </p>
          </div>
          {historyItems.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="rounded-none border-destructive/30 hover:border-destructive hover:bg-destructive/5 text-destructive/80 hover:text-destructive text-[10px] font-bold uppercase tracking-wider py-4 px-5 shrink-0 gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </Button>
          )}
        </section>

        {/* ── Content ───────────────────────────────────────────── */}
        <section className="w-full flex-1 animate-enter-2">
          {fetchingHistory ? (
            <div className="flex flex-col gap-10 animate-pulse">
              {[1, 2].map((gk) => (
                <div key={gk} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-accent/30" />
                    <div className="h-4 w-20 bg-accent/30" />
                    <div className="h-px flex-1 bg-accent/30" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {[1, 2].map((ik) => (
                      <div key={ik} className="flex gap-4 items-center border border-border/20 p-3 bg-card/40 h-20">
                        <div className="w-12 h-14 bg-accent/30 shrink-0" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-4 bg-accent/30 w-2/5" />
                          <div className="h-3 bg-accent/20 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : historyItems.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 gap-6">
              {/* Decorative */}
              <div className="relative">
                <div className="w-20 h-20 border border-dashed border-border/50 flex items-center justify-center text-primary">
                  <CalendarDays className="w-8 h-8 stroke-[1]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent/40 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-2 max-w-[30ch]">
                <h3 className="font-serif text-2xl font-medium tracking-tight">
                  Your history <span className="italic font-light text-primary">awaits.</span>
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  Mark outfits as worn from the dashboard to build your personal style timeline.
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
            /* ── Timeline groups ── */
            <div className="flex flex-col gap-10">
              {groupedHistory.map((group, gi) => (
                <div key={group.title} className="flex flex-col gap-4 animate-enter" style={{ animationDelay: `${gi * 0.07}s` }}>
                  {/* Group label with horizontal rules */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/30" />
                    <div className="flex items-center gap-2 px-3 py-1 border border-border/30 bg-card/50">
                      <span className="font-serif text-xs italic text-muted-foreground select-none">
                        {group.title}
                      </span>
                      <span className="font-sans text-[9px] font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>
                  <div className="flex flex-col gap-2.5">
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

              {/* Total count */}
              <div className="flex justify-center pt-4 border-t border-border/20">
                <p className="font-sans text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  {historyItems.length} {historyItems.length === 1 ? "entry" : "entries"} in your style journal
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      <HistoryDetailDialog
        wearId={selectedItem?.id || null}
        outfit={selectedItem?.outfit || null}
        wornAt={selectedItem?.wornAt || null}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onDeleteSuccess={(msg) => {
          queryClient.invalidateQueries({ queryKey: QK.wearHistory() });
          triggerToast(msg);
        }}
      />

      <footer className="border-t border-border/30 py-10 px-6 bg-card/10 text-center font-sans text-[11px] text-muted-foreground/60 tracking-wide">
        © 2026 StyleSync AI. Crafted with an editorial fashion perspective.
      </footer>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#1c1917] text-[#fffefb] px-5 py-4 shadow-2xl flex items-center gap-3 font-sans text-[11px] font-medium"
          style={{
            opacity: toastVisible ? 1 : 0,
            transform: toastVisible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#9fb2a1] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => { setToastVisible(false); setTimeout(() => setToastMessage(null), 300); }}
            className="ml-3 hover:opacity-70 transition-opacity cursor-pointer shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
