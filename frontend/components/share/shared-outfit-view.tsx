"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";

interface SharedGarment {
  imageUrl: string;
  processedImageUrl?: string | null;
  category: string;
  name: string;
}

interface SharedOutfit {
  name: string;
  notes?: string | null;
  occasion?: string | null;
  createdAt: string;
  garments: Array<{ garment: SharedGarment }>;
}

interface SharedOutfitViewProps {
  outfit: SharedOutfit;
}

export function SharedOutfitView({ outfit }: SharedOutfitViewProps) {
  const garments = outfit.garments.map((g) => g.garment);
  const monthYear = new Date(outfit.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#2a2318] font-sans">
      {/* Minimal nav */}
      <header className="border-b border-[#e0d6c8] px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-serif text-xl font-medium tracking-tight">StyleSync AI</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-14 flex flex-col gap-12">
        {/* Outfit identity */}
        <section className="flex flex-col gap-2">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                {outfit.name}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#7a7060] mt-2">
                Curated by a StyleSync wardrobe
              </p>
            </div>
            {outfit.occasion && (
              <span className="self-start px-3 py-1.5 border border-[#c8bfb0] text-[10px] font-bold uppercase tracking-widest text-[#5a5040]">
                {outfit.occasion}
              </span>
            )}
          </div>
        </section>

        {/* Garment grid */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {garments.map((garment, i) => (
              <div
                key={i}
                className="border border-[#e0d6c8] bg-[#f2ebe0] aspect-[4/5] flex items-center justify-center p-4 overflow-hidden"
              >
                <img
                  src={garment.processedImageUrl ?? garment.imageUrl}
                  alt={garment.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        {outfit.notes && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#7a7060]">
              Styling Notes
            </h2>
            <p className="text-sm text-[#4a4030] leading-relaxed font-sans italic max-w-2xl">
              &ldquo;{outfit.notes}&rdquo;
            </p>
          </section>
        )}

        {/* Meta */}
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9a8f80] border-t border-[#e0d6c8] pt-6">
          {garments.length} {garments.length === 1 ? "piece" : "pieces"}&nbsp;&nbsp;·&nbsp;&nbsp;{monthYear}
        </div>
      </main>

      {/* Discovery CTA footer */}
      <footer className="border-t border-[#e0d6c8] py-10 text-center">
        <p className="text-xs text-[#9a8f80] font-sans">
          Build your wardrobe →{" "}
          <a
            href="/"
            className="text-[#5a5040] font-semibold underline underline-offset-2 hover:text-[#2a2318] transition-colors"
          >
            stylesync.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
