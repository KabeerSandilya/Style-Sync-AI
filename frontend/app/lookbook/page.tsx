"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookImage, Loader2 } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { LookBookCard } from "@/components/lookbook/lookbook-card";
import { useLookBookEntries, type LookBookFilters } from "@/lib/hooks/use-lookbook";
import { useGarments } from "@/lib/hooks/use-garments";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { MOOD_TAGS } from "@style-sync/backend/types";
import { Garment, Outfit, LookBookEntry } from "@/types";
import { cn } from "@/lib/utils";

const OCCASIONS = ["Work", "Casual", "Smart Casual", "Formal", "Active", "Date Night"];
const RATINGS = [1, 2, 3, 4, 5];

function PillRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: T[];
  selected: T | undefined;
  onSelect: (value: T | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(isSelected ? undefined : opt)}
              className={cn(
                "shrink-0 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest transition-colors cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LookBookPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [month, setMonth] = React.useState<string | undefined>(undefined);
  const [mood, setMood] = React.useState<string | undefined>(undefined);
  const [rating, setRating] = React.useState<number | undefined>(undefined);
  const [occasion, setOccasion] = React.useState<string | undefined>(undefined);

  const filters: LookBookFilters = { month, mood, rating, occasion };
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLookBookEntries(filters);

  const { data: garments = [], isLoading: fetchingGarments } = useGarments();
  const { data: outfits = [], isLoading: fetchingOutfits } = useOutfits();

  const entries: LookBookEntry[] = data?.pages.flatMap((p) => p.data) ?? [];

  const sentinelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entriesObserved) => {
        if (entriesObserved[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Look Book"
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-10">
        <section className="flex flex-col gap-3 pb-8 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/40 flex items-center justify-center text-primary shrink-0">
              <BookImage className="w-4.5 h-4.5" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
              Look <span className="italic font-light text-primary">book</span>.
            </h1>
          </div>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[52ch]">
            Real photos, moods, and ratings from the times you actually wore each look.
          </p>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row gap-6 md:items-end flex-wrap">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-muted-foreground/70">
                Month
              </span>
              <input
                type="month"
                value={month ?? ""}
                onChange={(e) => setMonth(e.target.value || undefined)}
                className="bg-background/40 text-foreground border border-border/80 px-3 py-1.5 text-xs outline-none focus-visible:border-primary/60 transition-all"
              />
            </div>
            <PillRow label="Mood" options={[...MOOD_TAGS]} selected={mood} onSelect={setMood} />
            <PillRow
              label="Rating"
              options={RATINGS.map(String)}
              selected={rating ? String(rating) : undefined}
              onSelect={(v) => setRating(v ? Number(v) : undefined)}
            />
            <PillRow label="Occasion" options={OCCASIONS} selected={occasion} onSelect={setOccasion} />
          </div>
        </section>

        <section className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col border border-border/20 bg-card/60 animate-pulse">
                  <div className="aspect-4/5 bg-accent/20 w-full" />
                  <div className="flex flex-col p-5 gap-3">
                    <div className="h-4 bg-accent/20 w-2/3" />
                    <div className="h-3 bg-accent/20 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border/60 p-16 text-center bg-card/25 select-none min-h-100">
              <div className="bg-accent/40 text-primary p-4 mb-6">
                <BookImage className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground tracking-tight">
                Your journal awaits.
              </h2>
              <p className="font-sans text-xs text-muted-foreground max-w-sm mx-auto mt-3 leading-relaxed">
                Add a photo the next time you wear a look, from the History view, to start your visual style journal.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in">
                {entries.map((entry) => (
                  <LookBookCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => router.push(`/lookbook/${entry.id}`)}
                  />
                ))}
              </div>
              <div ref={sentinelRef} className="flex justify-center py-8">
                {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-border/30 py-10 px-6 bg-card/10 text-center font-sans text-[11px] text-muted-foreground/60 tracking-wide">
        © 2026 StyleSync AI.
      </footer>
    </div>
  );
}
