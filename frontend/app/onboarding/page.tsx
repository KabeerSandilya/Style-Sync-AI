"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS: { label: string; hex: string }[] = [
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

const STYLES = [
  "Casual",
  "Formal",
  "Streetwear",
  "Minimal",
  "Athleisure",
  "Business Casual",
  "Bohemian",
];

type Step = 1 | 2 | 3;

const STEP_META = [
  { num: 1, label: "Welcome" },
  { num: 2, label: "Colours" },
  { num: 3, label: "Aesthetic" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleColor = (label: string) => {
    setSelectedColors((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteColors: selectedColors,
          favoriteStyles: selectedStyles,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/editor");
      } else {
        setSaveError(data.error || "Failed to save preferences. Please try again.");
        setSaving(false);
      }
    } catch {
      setSaveError("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* ── Left branding panel ─────────────────────────────── */}
      <aside className="hidden md:flex md:w-[42%] lg:w-[38%] bg-[#121210] flex-col justify-between px-12 py-14 relative overflow-hidden shrink-0">
        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {/* Vertical lines */}
          {[0.33, 0.66].map((pct) => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
              style={{ left: `${pct * 100}%` }}
            />
          ))}
          {/* Horizontal lines */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 h-px bg-white/[0.04]"
              style={{ top: `${pct * 100}%` }}
            />
          ))}
          {/* Corner marks */}
          <div className="absolute top-12 left-10 w-5 h-5 border-t border-l border-white/20" />
          <div className="absolute bottom-12 right-10 w-5 h-5 border-b border-r border-white/20" />
        </div>

        {/* Wordmark */}
        <div className="relative z-10">
          <span className="font-serif text-sm font-semibold tracking-[0.32em] uppercase text-white/80 select-none">
            StyleSync AI
          </span>
        </div>

        {/* Centre quote block */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="w-8 h-px bg-[#708272]" />
          <blockquote className="font-serif text-3xl lg:text-4xl font-light leading-[1.15] text-white/90 italic">
            &ldquo;Dress with<br />
            <span className="text-[#9fb2a1] not-italic font-medium">intention.</span>&rdquo;
          </blockquote>
          <p className="font-sans text-[0.72rem] text-white/40 uppercase tracking-widest leading-relaxed max-w-[24ch]">
            The average wardrobe holds 77 items. Most people wear 20% of them.
          </p>
        </div>

        {/* Step progress visualiser */}
        <div className="relative z-10 flex flex-col gap-4">
          {STEP_META.map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-5 h-5 border flex items-center justify-center transition-all duration-500 shrink-0",
                  step > s.num
                    ? "bg-[#708272] border-[#708272]"
                    : step === s.num
                    ? "border-white/60 bg-transparent"
                    : "border-white/20 bg-transparent"
                )}
              >
                {step > s.num ? (
                  <Check className="w-2.5 h-2.5 text-white" />
                ) : (
                  <span className="font-sans text-[9px] font-bold text-white/60">{s.num}</span>
                )}
              </div>
              <span
                className={cn(
                  "font-sans text-[10px] uppercase tracking-widest transition-colors duration-300",
                  step === s.num ? "text-white/90 font-semibold" : "text-white/30"
                )}
              >
                {s.label}
              </span>
              {step === s.num && (
                <div className="flex-1 h-px bg-gradient-to-r from-[#708272]/60 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right content panel ──────────────────────────────── */}
      <main className="flex-1 bg-[#faf6f0] flex flex-col min-h-screen md:min-h-0 overflow-y-auto">
        {/* Mobile wordmark */}
        <div className="md:hidden px-8 pt-8 pb-0">
          <span className="font-serif text-sm font-semibold tracking-[0.32em] uppercase text-foreground/70 select-none">
            StyleSync AI
          </span>
        </div>

        {/* Mobile step dots */}
        <div className="md:hidden flex items-center gap-2 px-8 pt-6">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={cn(
                "h-0.5 transition-all duration-400 rounded-full",
                s === step ? "w-8 bg-[#708272]" : s < step ? "w-4 bg-[#708272]/50" : "w-4 bg-[#ebdcd0]"
              )}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center px-8 md:px-12 lg:px-16 py-12">
          <div
            key={step}
            className={cn(
              "w-full max-w-md",
              mounted ? "animate-enter" : ""
            )}
          >

            {/* Step 1 — Welcome */}
            {step === 1 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 bg-[#e3e8e4] flex items-center justify-center text-[#708272]">
                    <Sparkles className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#708272]">
                      Welcome to StyleSync
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-[1.08]">
                      Your digital stylist<br />
                      <span className="italic font-light text-[#708272]">starts here.</span>
                    </h1>
                    <p className="font-sans text-sm text-[#78716c] leading-relaxed mt-1 max-w-[38ch]">
                      Two quick steps and StyleSync knows your palette and aesthetic, so recommendations feel personal from the start.
                    </p>
                  </div>
                </div>

                {/* Feature bullets */}
                <div className="flex flex-col gap-3 border-l-2 border-[#e3e8e4] pl-5">
                  {[
                    "AI-analysed wardrobe inventory",
                    "Real-time weather outfit matching",
                    "Personal style profile & insights",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-[#708272] shrink-0" />
                      <span className="font-sans text-xs text-[#5e5854]">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center justify-center gap-2.5 w-full bg-[#1c1917] text-[#fffefb] font-sans text-[11px] font-bold uppercase tracking-[0.18em] px-8 py-5 hover:bg-[#708272] transition-colors duration-300 group cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                  <button
                    onClick={() => router.push("/editor")}
                    className="text-[10px] text-[#a8a29e] hover:text-[#1c1917] transition-colors font-sans uppercase tracking-widest text-center py-2 cursor-pointer"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Colour palette */}
            {step === 2 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#708272]">
                    Step 1 of 2
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight leading-[1.1]">
                    Your colour palette.
                  </h2>
                  <p className="font-sans text-xs text-[#78716c] leading-relaxed mt-0.5">
                    Select the colours you are most drawn to. Choose as many as you like.
                  </p>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 gap-x-4 gap-y-5">
                  {COLORS.map(({ label, hex }) => {
                    const selected = selectedColors.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleColor(label)}
                        className="group flex flex-col items-center gap-2 cursor-pointer"
                        aria-pressed={selected}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 border-2 relative transition-all duration-200",
                            selected
                              ? "border-[#708272] scale-110 shadow-md shadow-black/10"
                              : "border-transparent hover:border-[#708272]/40 hover:scale-105"
                          )}
                          style={{ backgroundColor: hex }}
                        >
                          {selected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check
                                className="w-3 h-3"
                                style={{
                                  color: ["White", "Cream", "Beige"].includes(label) ? "#1a1a1a" : "#ffffff",
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[8px] font-sans font-semibold uppercase tracking-wider transition-colors leading-none",
                            selected ? "text-[#708272]" : "text-[#a8a29e]"
                          )}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedColors.map((c) => (
                      <span key={c} className="font-sans text-[9px] font-bold uppercase tracking-wider bg-[#e3e8e4] text-[#2d332d] px-2.5 py-1">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#ebdcd0]">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-[10px] text-[#a8a29e] hover:text-[#1c1917] uppercase tracking-widest font-sans transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2.5 bg-[#1c1917] text-[#fffefb] font-sans text-[11px] font-bold uppercase tracking-[0.18em] px-7 py-4 hover:bg-[#708272] transition-colors duration-300 group cursor-pointer"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Aesthetic */}
            {step === 3 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#708272]">
                    Step 2 of 2
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight leading-[1.1]">
                    Your aesthetic.
                  </h2>
                  <p className="font-sans text-xs text-[#78716c] leading-relaxed mt-0.5">
                    How would you describe your style? Select everything that resonates.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {STYLES.map((style) => {
                    const selected = selectedStyles.includes(style);
                    return (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        aria-pressed={selected}
                        className={cn(
                          "px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer",
                          selected
                            ? "bg-[#1c1917] text-[#fffefb] border-[#1c1917]"
                            : "bg-transparent text-[#78716c] border-[#ebdcd0] hover:border-[#708272]/60 hover:text-[#1c1917]"
                        )}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>

                {/* Summary of choices */}
                {(selectedColors.length > 0 || selectedStyles.length > 0) && (
                  <div className="bg-[#fffefb] border border-[#ebdcd0] p-4 flex flex-col gap-2.5">
                    <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#a8a29e] font-semibold">
                      Your selections
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedColors.slice(0, 5).map((c) => (
                        <span key={c} className="font-sans text-[9px] font-bold uppercase tracking-wider bg-[#e3e8e4] text-[#2d332d] px-2 py-0.5">
                          {c}
                        </span>
                      ))}
                      {selectedColors.length > 5 && (
                        <span className="font-sans text-[9px] text-[#a8a29e]">+{selectedColors.length - 5} more</span>
                      )}
                      {selectedStyles.map((s) => (
                        <span key={s} className="font-sans text-[9px] font-bold uppercase tracking-wider bg-[#708272]/15 text-[#708272] px-2 py-0.5">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {saveError && (
                  <p className="font-sans text-[10px] text-red-500 text-center -mb-2">
                    {saveError}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-[#ebdcd0]">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 text-[10px] text-[#a8a29e] hover:text-[#1c1917] uppercase tracking-widest font-sans transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    className={cn(
                      "flex items-center gap-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] px-7 py-4 transition-colors duration-300 group cursor-pointer",
                      saving
                        ? "bg-[#708272]/50 text-white cursor-not-allowed"
                        : "bg-[#708272] text-[#fffefb] hover:bg-[#1c1917]"
                    )}
                  >
                    {saving ? "Saving…" : "Enter Wardrobe"}
                    {!saving && (
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
