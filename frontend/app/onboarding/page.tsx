"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

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
        console.error("Onboarding save failed:", data.error);
        router.push("/editor");
      }
    } catch {
      router.push("/editor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-12">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={cn(
                "w-2 h-2 transition-all duration-300",
                s === step
                  ? "w-6 bg-primary"
                  : s < step
                  ? "bg-primary/60"
                  : "bg-border"
              )}
            />
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="bg-accent/40 text-primary p-5 rounded-none">
              <Sparkles className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary font-sans">
                Welcome to StyleSync
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                Your digital stylist <br />
                <span className="italic font-light text-primary">starts here.</span>
              </h1>
              <p className="text-sm text-muted-foreground font-sans max-w-sm mx-auto leading-relaxed mt-2">
                In just two quick steps, StyleSync will learn your style so
                recommendations feel personal from day one.
              </p>
            </div>
            <Button
              onClick={() => setStep(2)}
              className="rounded-none px-8 py-6 text-xs font-semibold tracking-widest uppercase shadow-md mt-4 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <button
              onClick={() => router.push("/editor")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans underline underline-offset-4 cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2: Color preferences */}
        {step === 2 && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary font-sans">
                Step 1 of 2
              </p>
              <h2 className="font-serif text-3xl font-medium tracking-tight">
                Your colour palette
              </h2>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Select the colours you are most drawn to. Choose as many as you like.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {COLORS.map(({ label, hex }) => {
                const selected = selectedColors.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleColor(label)}
                    className={cn(
                      "group flex flex-col items-center gap-2 cursor-pointer transition-all duration-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 border-2 transition-all duration-200 relative",
                        selected
                          ? "border-primary scale-110 shadow-md"
                          : "border-border/40 hover:border-primary/50 hover:scale-105"
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check
                            className="w-3.5 h-3.5"
                            style={{
                              color: ["White", "Cream", "Beige"].includes(label) ? "#1a1a1a" : "#ffffff",
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-sans font-semibold uppercase tracking-wider transition-colors",
                        selected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/20">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans cursor-pointer"
              >
                Back
              </button>
              <Button
                onClick={() => setStep(3)}
                className="rounded-none px-6 py-5 text-xs font-semibold tracking-widest uppercase shadow-sm group"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Style preferences */}
        {step === 3 && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary font-sans">
                Step 2 of 2
              </p>
              <h2 className="font-serif text-3xl font-medium tracking-tight">
                Your aesthetic
              </h2>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                How would you describe your style? Select everything that resonates.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {STYLES.map((style) => {
                const selected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={cn(
                      "px-5 py-3 text-xs font-semibold uppercase tracking-wider font-sans border transition-all duration-200 cursor-pointer",
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border/50 hover:border-primary/60 hover:text-foreground"
                    )}
                  >
                    {style}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/20">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans cursor-pointer"
              >
                Back
              </button>
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="rounded-none px-6 py-5 text-xs font-semibold tracking-widest uppercase shadow-sm group"
              >
                {saving ? "Saving..." : "Enter Wardrobe"}
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
