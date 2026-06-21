import * as React from "react";
import { Outfit } from "@/types";

interface OutfitExportCardProps {
  outfit: Outfit;
}

export const OutfitExportCard = React.forwardRef<HTMLDivElement, OutfitExportCardProps>(
  ({ outfit }, ref) => {
    const garments = outfit.garments.map((g) => g.garment);
    const shown = garments.slice(0, 6);
    const extra = garments.length > 6 ? garments.length - 6 : 0;

    const monthYear = new Date(outfit.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const metaParts = [
      outfit.occasion?.toUpperCase(),
      `${garments.length} ${garments.length === 1 ? "piece" : "pieces"}`,
      monthYear,
    ].filter(Boolean);

    return (
      <div
        ref={ref}
        style={{
          width: 1200,
          height: 675,
          background: "#faf6f0",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 40px",
            borderBottom: "1px solid #e8e0d4",
          }}
        >
          <span style={{ fontFamily: "serif", fontSize: 22, fontWeight: 500, color: "#2a2318", letterSpacing: "0.02em" }}>
            StyleSync AI
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9a8f80", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            SS.AI · 001
          </span>
        </div>

        {/* Garment grid */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 40px 12px",
            gap: 16,
          }}
        >
          {shown.map((garment, i) => {
            const isLast = i === shown.length - 1 && extra > 0;
            const src = garment.processedImageUrl ?? garment.imageUrl;
            return (
              <div
                key={garment.id}
                style={{
                  position: "relative",
                  width: 160,
                  height: 200,
                  background: "#f2ebe0",
                  border: "1px solid #e0d6c8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={garment.name}
                  crossOrigin="anonymous"
                  style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }}
                />
                {isLast && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(42,35,24,0.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#faf6f0",
                      fontWeight: 700,
                      fontSize: 20,
                      letterSpacing: "0.04em",
                    }}
                  >
                    +{extra} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer text block */}
        <div
          style={{
            padding: "16px 40px 28px",
            borderTop: "1px solid #e8e0d4",
          }}
        >
          <div style={{ fontFamily: "serif", fontSize: 26, fontWeight: 500, color: "#2a2318", marginBottom: 6 }}>
            {outfit.name}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7a7060", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: outfit.notes ? 8 : 0 }}>
            {metaParts.join("  ·  ")}
          </div>
          {outfit.notes && (
            <div style={{ fontSize: 13, color: "#5a5040", fontStyle: "italic", marginTop: 6, maxWidth: 740, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              &ldquo;{outfit.notes}&rdquo;
            </div>
          )}
        </div>

        {/* Watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 22,
            right: 36,
            fontSize: 12,
            fontWeight: 700,
            color: "#2a2318",
            opacity: 0.3,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          StyleSync AI
        </div>
      </div>
    );
  }
);

OutfitExportCard.displayName = "OutfitExportCard";
