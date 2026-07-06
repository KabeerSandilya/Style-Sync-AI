"use client";

import * as React from "react";
import { Sparkles, ChevronLeft, ChevronDown, ArrowRight, TrendingUp, HelpCircle, EyeOff, Award, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useGarments } from "@/lib/hooks/use-garments";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { useInsights } from "@/lib/hooks/use-insights";
import { useCapsuleAudit } from "@/lib/hooks/use-capsule-audit";
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

interface GarmentScore {
  garmentId: string;
  outfitCount: number;
  wearCount: number;
  likeCount: number;
  dislikeCount: number;
  neverWornPenalty: boolean;
  cvs: number;
}

interface CapsuleTiers {
  workhorses: GarmentScore[];
  sleepingBeauties: GarmentScore[];
  orphans: GarmentScore[];
  unprocessedCount: number;
}

interface GapAnalysisResult {
  gaps: Array<{ category: string; reason: string }>;
  capsuleScore: number;
}

interface PurgeSuggestion {
  garmentId: string;
  name: string;
  reason: string;
}

interface CapsuleAuditData {
  tiers: CapsuleTiers;
  gapAnalysis: GapAnalysisResult | null;
  purgeSuggestions: PurgeSuggestion[];
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

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-3 border border-border/30 bg-card p-5">
      <div className="w-7 h-7 bg-accent/40 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-serif text-3xl font-medium tracking-tight">{value}</span>
        <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

function CapsuleAuditTab({
  data,
  isLoading,
  garmentById,
  onGarmentClick,
}: {
  data: CapsuleAuditData | null;
  isLoading: boolean;
  garmentById: Map<string, Garment>;
  onGarmentClick: (g: Garment) => void;
}) {
  const [purgeOpen, setPurgeOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col gap-16 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((sk) => (
            <div key={sk} className="border border-border/20 bg-card/40 h-24" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((ck) => (
            <div key={ck} className="border border-border/20 bg-card/40 aspect-[4/5]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-24 px-6 gap-4">
        <p className="font-serif text-xl text-muted-foreground">
          Capsule audit isn&apos;t available yet.
        </p>
      </div>
    );
  }

  const { tiers, gapAnalysis, purgeSuggestions } = data;

  const scoredGarments = (scores: GarmentScore[]) =>
    scores
      .map((s) => ({ score: s, garment: garmentById.get(s.garmentId) }))
      .filter((x): x is { score: GarmentScore; garment: Garment } => !!x.garment);

  return (
    <div className="w-full flex-1 flex flex-col gap-16">
      {/* Tier Summary */}
      <section className="flex flex-col gap-6 animate-enter-2">
        <SectionHeader
          icon={<BarChart2 className="w-3.5 h-3.5" />}
          title="Capsule Overview"
          subtitle="How hard every piece in your wardrobe is actually working."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatTile icon={<Award className="w-3.5 h-3.5" />} label="Workhorses" value={tiers.workhorses.length} />
          <StatTile icon={<EyeOff className="w-3.5 h-3.5" />} label="Sleeping Beauties" value={tiers.sleepingBeauties.length} />
          <StatTile icon={<HelpCircle className="w-3.5 h-3.5" />} label="Orphans" value={tiers.orphans.length} />
          <StatTile icon={<BarChart2 className="w-3.5 h-3.5" />} label="Unprocessed" value={tiers.unprocessedCount} />
        </div>
      </section>

      {/* Workhorses */}
      {scoredGarments(tiers.workhorses).length > 0 && (
        <section className="flex flex-col gap-6 animate-enter-3">
          <SectionHeader
            icon={<Award className="w-3.5 h-3.5" />}
            title="Workhorses"
            subtitle="Your highest combinatorial-value pieces, worn again and again."
            tag="Top 20%"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {scoredGarments(tiers.workhorses).map(({ score, garment }) => (
              <GarmentCard
                key={garment.id}
                garment={garment}
                badge={`CVS ${score.cvs}`}
                badgeVariant="default"
                onClick={() => onGarmentClick(garment)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sleeping Beauties */}
      {scoredGarments(tiers.sleepingBeauties).length > 0 && (
        <section className="flex flex-col gap-6 animate-enter-4">
          <SectionHeader
            icon={<EyeOff className="w-3.5 h-3.5" />}
            title="Sleeping Beauties"
            subtitle="Styled into an outfit, but never actually worn."
            tag="Never worn"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {scoredGarments(tiers.sleepingBeauties).map(({ garment }) => (
              <GarmentCard
                key={garment.id}
                garment={garment}
                badge="Never worn"
                badgeVariant="alert"
                onClick={() => onGarmentClick(garment)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Orphans */}
      {scoredGarments(tiers.orphans).length > 0 && (
        <section className="flex flex-col gap-6 animate-enter-5">
          <SectionHeader
            icon={<HelpCircle className="w-3.5 h-3.5" />}
            title="Orphans"
            subtitle="Not part of any saved outfit yet."
            tag={`${tiers.orphans.length} items`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {scoredGarments(tiers.orphans).map(({ garment }) => (
              <GarmentCard
                key={garment.id}
                garment={garment}
                badge="Not in any outfit"
                badgeVariant="muted"
                onClick={() => onGarmentClick(garment)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Gap Recommendations */}
      {gapAnalysis && (
        <section className="flex flex-col gap-6">
          <SectionHeader
            icon={<Sparkles className="w-3.5 h-3.5" />}
            title="Gap Recommendations"
            subtitle="Where this wardrobe is underrepresented, and why."
          />
          <div className="border border-border/30 bg-card p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <div className="shrink-0 flex flex-col items-start gap-1">
              <span className="font-serif text-5xl font-medium tracking-tight text-primary">
                {gapAnalysis.capsuleScore}
                <span className="text-xl text-muted-foreground"> / 100</span>
              </span>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Capsule Score
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-5 md:border-l md:border-border/20 md:pl-8">
              {gapAnalysis.gaps.map((gap) => (
                <div key={gap.category} className="flex flex-col gap-1">
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
                    {gap.category}
                  </h4>
                  <p className="font-serif italic text-sm text-muted-foreground leading-relaxed">
                    {gap.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Purge Suggestions */}
      {purgeSuggestions.length > 0 && (
        <section className="flex flex-col gap-4">
          <button
            onClick={() => setPurgeOpen((o) => !o)}
            className="flex items-center justify-between gap-3 pb-4 border-b border-border/20 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-accent/40 flex items-center justify-center text-primary shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col items-start">
                <h2 className="font-serif text-2xl font-medium tracking-tight">Purge Suggestions</h2>
                <p className="font-sans text-xs text-muted-foreground">
                  Pieces that might be ready for a new home.
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${purgeOpen ? "rotate-180" : ""}`}
            />
          </button>
          {purgeOpen && (
            <div className="flex flex-col divide-y divide-border/20 border border-border/20">
              {purgeSuggestions.map((p) => {
                const garment = garmentById.get(p.garmentId);
                return (
                  <div key={p.garmentId} className="flex items-center gap-4 p-4">
                    <div className="w-14 h-14 bg-[#fcf9f5] border border-border/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {garment && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={garment.imageUrl} alt={p.name} className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-serif text-sm font-medium">{p.name}</h4>
                      <p className="font-sans text-xs text-muted-foreground">{p.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"analytics" | "capsule">("analytics");

  const { data: garments = [], isLoading: fetchingGarments } = useGarments();
  const { data: outfits = [], isLoading: fetchingOutfits } = useOutfits();
  const { data: insightsRaw, isLoading: fetchingInsights } = useInsights();
  const insights = (insightsRaw as InsightsData | undefined) ?? null;
  const { data: capsuleRaw, isLoading: fetchingCapsule } = useCapsuleAudit();
  const capsule = (capsuleRaw as CapsuleAuditData | undefined) ?? null;
  const garmentById = React.useMemo(
    () => new Map(garments.map((g: Garment) => [g.id, g])),
    [garments],
  );

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
              Built from your styling patterns, wear frequency, and outfit history.
            </p>
          </div>
        </section>

        {/* ── Tab switcher ────────────────────────────────────── */}
        <div className="flex items-center gap-1 -mt-10 animate-enter-1">
          {(
            [
              { key: "analytics", label: "Wear Analytics" },
              { key: "capsule", label: "Capsule Audit" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest font-sans transition-colors cursor-pointer border-b-2 ${
                activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        {activeTab === "analytics" && (
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
                    subtitle="Pieces you reach for again and again."
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
        )}

        {activeTab === "capsule" && (
          <CapsuleAuditTab
            data={capsule}
            isLoading={fetchingCapsule}
            garmentById={garmentById}
            onGarmentClick={handleGarmentClick}
          />
        )}
      </main>

      <footer className="border-t border-border/30 py-10 px-6 bg-card/10 text-center font-sans text-[11px] text-muted-foreground/60 mt-20 tracking-wide">
        © 2026 StyleSync AI.
      </footer>
    </div>
  );
}
