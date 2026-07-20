"use client";

import * as React from "react";
import { Sparkles, ChevronRight, ArrowUpRight, CalendarDays, BarChart2, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { TodaysRecommendations } from "@/components/recommendation/todays-recommendations";
import { useGarments } from "@/lib/hooks/use-garments";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { Garment, Outfit } from "@/types";

export default function Home() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const { data: garments = [], isLoading: fetchingGarments } = useGarments();
  const { data: outfits = [], isLoading: fetchingOutfits } = useOutfits();

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
        title="StyleSync AI"
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

      <main className="flex-1 w-full">
        {/* ── Editorial hero banner ─────────────────────────────── */}
        <section className="relative w-full bg-[#121210] overflow-hidden">
          {/* Decorative grid overlay */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {[0.25, 0.5, 0.75].map((p) => (
              <div key={p} className="absolute top-0 bottom-0 w-px bg-white/[0.035]" style={{ left: `${p * 100}%` }} />
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />
          </div>

          {/* Corner accents */}
          <div className="absolute top-6 left-6 w-4 h-4 border-t border-l border-white/20" aria-hidden />
          <div className="absolute bottom-6 right-6 w-4 h-4 border-b border-r border-white/20" aria-hidden />
          <span className="absolute top-7 right-8 font-sans text-[9px] uppercase tracking-[0.22em] text-white/25 select-none" aria-hidden>
            SS.AI
          </span>

          <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-20 flex flex-col gap-5 relative z-10">
            <div className="flex items-center gap-2.5 text-[#9fb2a1] animate-enter-1">
              <Sparkles className="w-4 h-4" />
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] font-semibold">
                Seasonal Influx
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] text-white/95 animate-enter-2">
              An editorial approach<br />
              to your{" "}
              <span className="italic font-light text-[#9fb2a1]">daily silhouette.</span>
            </h1>

            <p className="font-sans text-sm text-white/50 max-w-[46ch] leading-relaxed animate-enter-3">
              StyleSync AI checks your wardrobe against live weather conditions and curates looks to match.
            </p>

            <div className="flex items-center gap-4 pt-2 animate-enter-4">
              <button
                onClick={() => router.push("/editor/wardrobe")}
                className="flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] bg-[#fffefb] text-[#121210] px-6 py-3.5 hover:bg-[#9fb2a1] transition-colors duration-300 group cursor-pointer"
              >
                Wardrobe Studio
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
              </button>
              <button
                onClick={() => router.push("/editor/wardrobe?view=outfits")}
                className="flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-wider text-white/60 hover:text-white/90 transition-colors duration-200 cursor-pointer"
              >
                My Outfits
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── In this issue ─────────────────────────────────────── */}
        <section className="w-full border-b border-border/30">
          <div className="max-w-3xl mx-auto px-6 md:px-8 py-12 flex flex-col gap-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-serif text-2xl font-medium tracking-tight">
                In this <span className="italic font-light text-primary">issue</span>.
              </h2>
              <p className="font-sans text-xs text-muted-foreground">
                Deeper threads on how you dress — journal, analytics, and preferences.
              </p>
            </div>

            <div className="border-t border-border/40">
              {[
                { label: "History", href: "/history", desc: "Every outfit you've worn, in order.", icon: CalendarDays },
                { label: "Insights", href: "/insights", desc: "What gets worn, what doesn't, and why.", icon: BarChart2 },
                { label: "Preferences", href: "/preferences", desc: "The colors, styles, and cuts you gravitate to.", icon: SlidersHorizontal },
              ].map(({ label, href, desc, icon: Icon }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="group flex w-full items-center gap-5 border-b border-border/40 px-2 -mx-2 py-5 text-left transition-colors duration-200 hover:bg-accent/15 cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-accent/40 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
                      {label}
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5 truncate">
                      {desc}
                    </p>
                  </div>
                  <div className="mx-4 hidden h-px flex-1 border-b border-dotted border-border/70 md:block" aria-hidden />
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Daily recommendations ─────────────────────────────── */}
        <div className="max-w-3xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-8 animate-enter-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-serif text-2xl font-medium tracking-tight">
                Today&apos;s looks.
              </h2>
              <p className="font-sans text-xs text-muted-foreground">
                Curated from your wardrobe for current conditions.
              </p>
            </div>
            <button
              onClick={() => router.push("/editor/wardrobe?view=outfits")}
              className="font-sans text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
            >
              All outfits
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <TodaysRecommendations
            onCreateOutfitClick={() => router.push("/editor/wardrobe?view=outfits")}
          />
        </div>
      </main>

      <footer className="border-t border-border/30 py-10 px-6 bg-card/10 text-center font-sans text-[11px] text-muted-foreground/60 mt-auto tracking-wide">
        © 2026 StyleSync AI.
      </footer>
    </div>
  );
}
