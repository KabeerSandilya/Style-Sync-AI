"use client";

import * as React from "react";
import { RefreshCw, Dna } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import { useGarments } from "@/lib/hooks/use-garments";
import { Garment, Outfit } from "@/types";
import { cn } from "@/lib/utils";

interface ColorStory {
  colors: string[];
  narrative: string;
}

interface StyleDNARecord {
  id: string;
  userId: string;
  archetype: string;
  colorStory: ColorStory;
  signaturePieces: string[];
  styleKeywords: string[];
  styleNarrative: string;
  wardrobeStrengths: string[];
  blindSpots: string[];
  generatedAt: string;
}

function getHoursUntilRegen(generatedAt: string): number {
  const genTime = new Date(generatedAt).getTime();
  const now = Date.now();
  const diffMs = 24 * 60 * 60 * 1000 - (now - genTime);
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
}

function daysAgoLabel(generatedAt: string): string {
  const ms = Date.now() - new Date(generatedAt).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse bg-accent/40", className)} style={style} />;
}

function FullCardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-5 w-3/4 max-w-md" />
      </div>
      <div className="flex gap-3">
        {[40, 40, 40, 40, 40].map((_, i) => <Skeleton key={i} className="w-10 h-10" />)}
      </div>
      <div className="flex gap-2 flex-wrap">
        {[80, 96, 72, 88, 104, 80].map((w, i) => (
          <Skeleton key={i} style={{ width: w }} className="h-6" />
        ))}
      </div>
      <div className="flex gap-3">
        {[120, 120, 120].map((_, i) => <Skeleton key={i} className="w-[120px] h-[120px]" />)}
      </div>
    </div>
  );
}

interface SignaturePieceThumbProps {
  garmentId: string;
  garments: Garment[];
}

function SignaturePieceThumb({ garmentId, garments }: SignaturePieceThumbProps) {
  const garment = garments.find(g => g.id === garmentId);
  const url = garment?.processedImageUrl ?? garment?.imageUrl ?? null;

  if (!url) {
    return (
      <div className="w-[120px] h-[120px] bg-accent/30 flex items-center justify-center shrink-0">
        <span className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">
          {garment?.name ?? "Piece"}
        </span>
      </div>
    );
  }

  return (
    <div className="w-[120px] h-[120px] overflow-hidden shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={garment?.name ?? "Signature piece"}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function DNACard({ dna, garments, onRegenerate, isRegenerating }: {
  dna: StyleDNARecord;
  garments: Garment[];
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const hoursLeft = getHoursUntilRegen(dna.generatedAt);
  const canRegen = hoursLeft === 0;

  return (
    <div
      className="relative w-full"
      style={{ animation: "fadeUp 0.5s ease both" }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-stagger:nth-child(1) { animation-delay: 0ms; }
        .section-stagger:nth-child(2) { animation-delay: 80ms; }
        .section-stagger:nth-child(3) { animation-delay: 160ms; }
        .section-stagger:nth-child(4) { animation-delay: 240ms; }
        .section-stagger:nth-child(5) { animation-delay: 320ms; }
        .section-stagger:nth-child(6) { animation-delay: 400ms; }
        .section-stagger:nth-child(7) { animation-delay: 480ms; }
      `}</style>

      <div className="space-y-12">
        {/* Archetype + Narrative */}
        <div
          className="section-stagger"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Your Style Archetype
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-[0.08em] uppercase text-foreground leading-none mb-6">
            {dna.archetype}
          </h1>
          <p className="font-serif italic text-lg md:text-xl text-foreground/80 leading-[1.6] max-w-2xl">
            {dna.styleNarrative}
          </p>
        </div>

        <div className="h-px bg-border/20" />

        {/* Color Story */}
        <div
          className="section-stagger"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Color Story
          </p>
          <div className="flex gap-3 flex-wrap mb-3">
            {dna.colorStory.colors.map((color) => (
              <div key={color} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-10 h-10 border border-border/30"
                  style={{ backgroundColor: color.toLowerCase().replace(/\s+/g, '') }}
                  title={color}
                />
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {color}
                </span>
              </div>
            ))}
          </div>
          <p className="font-sans text-sm text-muted-foreground max-w-lg">
            {dna.colorStory.narrative}
          </p>
        </div>

        <div className="h-px bg-border/20" />

        {/* Style Keywords */}
        <div
          className="section-stagger"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Style Keywords
          </p>
          <div className="flex gap-2 flex-wrap">
            {dna.styleKeywords.map((kw) => (
              <span
                key={kw}
                className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] border border-border/50 px-3 py-1.5 text-foreground/80"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="h-px bg-border/20" />

        {/* Signature Pieces */}
        {dna.signaturePieces.length > 0 && (
          <>
            <div
              className="section-stagger"
              style={{ animation: "fadeUp 0.5s ease both" }}
            >
              <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Signature Pieces
              </p>
              <div className="flex gap-3 flex-wrap">
                {dna.signaturePieces.map((id) => (
                  <SignaturePieceThumb key={id} garmentId={id} garments={garments} />
                ))}
              </div>
            </div>
            <div className="h-px bg-border/20" />
          </>
        )}

        {/* Wardrobe Strengths + Blind Spots */}
        <div
          className="section-stagger grid grid-cols-1 md:grid-cols-2 gap-10"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Wardrobe Strengths
            </p>
            <ul className="space-y-2">
              {dna.wardrobeStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="font-sans text-xs text-primary mt-0.5">—</span>
                  <span className="font-sans text-sm text-foreground/80">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              What&apos;s Missing
            </p>
            <ul className="space-y-2">
              {dna.blindSpots.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="font-sans text-xs text-muted-foreground mt-0.5">—</span>
                  <span className="font-sans text-sm text-foreground/70">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Regenerate footer */}
        <div
          className="section-stagger flex items-center justify-end gap-4 pt-4 border-t border-border/20"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <span className="font-sans text-[11px] text-muted-foreground">
            Last generated {daysAgoLabel(dna.generatedAt)}
            {!canRegen && ` · regenerate in ${hoursLeft}h`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={!canRegen || isRegenerating}
            className="rounded-none border border-border/50 font-sans text-[10px] uppercase tracking-[0.12em] gap-1.5 h-7 px-3 disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3 h-3", isRegenerating && "animate-spin")} />
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ classifiedCount, onGenerate, isGenerating }: {
  classifiedCount: number;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const gatemet = classifiedCount >= 10;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="border border-dashed border-border/50 max-w-sm w-full p-10 flex flex-col items-center gap-6 text-center">
        <div className="w-10 h-10 bg-accent/30 flex items-center justify-center text-primary">
          <Dna className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl font-medium tracking-tight">Your Style DNA</h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            {gatemet
              ? "Your wardrobe is ready. Generate your editorial style identity."
              : "Classify at least 10 garments to unlock your editorial style identity."}
          </p>
        </div>

        {!gatemet && (
          <div className="w-full space-y-2">
            <div className="w-full bg-accent/30 h-1">
              <div
                className="h-1 bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, (classifiedCount / 10) * 100)}%` }}
              />
            </div>
            <p className="font-sans text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
              {classifiedCount} / 10 garments classified
            </p>
          </div>
        )}

        <Button
          onClick={onGenerate}
          disabled={!gatemet || isGenerating}
          title={!gatemet ? `Classify ${10 - classifiedCount} more garments to unlock` : undefined}
          className="rounded-none font-sans text-[10px] uppercase tracking-[0.15em] h-9 px-6 w-full disabled:opacity-40"
        >
          {isGenerating ? "Generating…" : "Generate Style DNA"}
        </Button>
      </div>
    </div>
  );
}

export default function StyleDNAPage() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [dna, setDna] = React.useState<StyleDNARecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const { data: garments = [] } = useGarments();
  const classifiedCount = garments.filter((g: Garment) => g.isProcessed).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    fetch('/api/style-dna')
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) return null;
        return r.json() as Promise<StyleDNARecord>;
      })
      .then((data) => {
        setDna(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const r = await fetch('/api/style-dna', { method: 'POST' });
      if (r.status === 429) {
        const data = await r.json() as { error: string };
        const hoursLeft = dna ? getHoursUntilRegen(dna.generatedAt) : 24;
        showToast(`You can regenerate in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`);
        return;
      }
      if (r.status === 422) {
        showToast("Classify more garments to regenerate.");
        return;
      }
      if (!r.ok) {
        showToast("Something went wrong. Please try again.");
        return;
      }
      const data = await r.json() as StyleDNARecord;
      setDna(data);
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Placeholder sidebar handlers
  const handleGarmentClick = (_g: Garment) => {};
  const handleOutfitClick = (_o: Outfit) => {};
  const handleAddClothing = () => {};

  return (
    <div className="min-h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="StyleSync AI"
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onGarmentClick={handleGarmentClick}
        onOutfitClick={handleOutfitClick}
        onAddClothing={handleAddClothing}
      />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Page header */}
        <div className="mb-12">
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Intelligence
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground">
            Style DNA
          </h1>
        </div>

        {loading ? (
          <FullCardSkeleton />
        ) : dna ? (
          isGenerating ? (
            <FullCardSkeleton />
          ) : (
            <DNACard
              dna={dna}
              garments={garments}
              onRegenerate={handleGenerate}
              isRegenerating={isGenerating}
            />
          )
        ) : (
          <EmptyState
            classifiedCount={classifiedCount}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background font-sans text-xs px-5 py-3 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
