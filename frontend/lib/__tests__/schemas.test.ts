import { describe, it, expect, vi } from "vitest";

// next/server is not available in Node test environments without Next.js runtime
vi.mock("next/server", () => ({
  NextResponse: { json: () => ({}) },
}));

import {
  CreateOutfitSchema,
  UpdateOutfitSchema,
  RecommendationsQuerySchema,
  OnboardingSchema,
} from "../schemas";

// A valid CUID for testing
const VALID_CUID = "cjld2cjxh0000qzrmn831i7rn";

describe("CreateOutfitSchema", () => {
  it("rejects empty garmentIds array", () => {
    const result = CreateOutfitSchema.safeParse({ garmentIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid occasion string", () => {
    const result = CreateOutfitSchema.safeParse({
      garmentIds: [VALID_CUID],
      occasion: "InvalidOccasion",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid occasion values", () => {
    const occasions = ["Work", "Casual", "Smart Casual", "Formal", "Active", "Date Night"];
    for (const occasion of occasions) {
      const result = CreateOutfitSchema.safeParse({ garmentIds: [VALID_CUID], occasion });
      expect(result.success, `Expected ${occasion} to be valid`).toBe(true);
    }
  });

  it("accepts null occasion", () => {
    const result = CreateOutfitSchema.safeParse({ garmentIds: [VALID_CUID], occasion: null });
    expect(result.success).toBe(true);
  });

  it("accepts omitted occasion (undefined)", () => {
    const result = CreateOutfitSchema.safeParse({ garmentIds: [VALID_CUID] });
    expect(result.success).toBe(true);
  });
});

describe("UpdateOutfitSchema", () => {
  it("rejects an empty object (no fields to update)", () => {
    const result = UpdateOutfitSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a partial update with just a name", () => {
    const result = UpdateOutfitSchema.safeParse({ name: "Evening Look" });
    expect(result.success).toBe(true);
  });

  it("accepts a partial update with occasion only", () => {
    const result = UpdateOutfitSchema.safeParse({ occasion: "Formal" });
    expect(result.success).toBe(true);
  });

  it("rejects name that exceeds 100 characters", () => {
    const result = UpdateOutfitSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("RecommendationsQuerySchema", () => {
  it("coerces lat/lon strings to numbers", () => {
    const result = RecommendationsQuerySchema.safeParse({ lat: "51.5", lon: "-0.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBe(51.5);
      expect(result.data.lon).toBe(-0.1);
    }
  });

  it("rejects lat outside the valid range -90..90", () => {
    const result = RecommendationsQuerySchema.safeParse({ lat: "91", lon: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects lat below -90", () => {
    const result = RecommendationsQuerySchema.safeParse({ lat: "-91", lon: "0" });
    expect(result.success).toBe(false);
  });

  it("accepts valid lat/lon at boundaries", () => {
    expect(RecommendationsQuerySchema.safeParse({ lat: "90", lon: "180" }).success).toBe(true);
    expect(RecommendationsQuerySchema.safeParse({ lat: "-90", lon: "-180" }).success).toBe(true);
  });

  it("accepts an empty object (all params optional)", () => {
    const result = RecommendationsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("OnboardingSchema", () => {
  it("rejects an empty favoriteStyles array", () => {
    const result = OnboardingSchema.safeParse({
      favoriteStyles: [],
      favoriteColors: ["Black"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 favorite colors", () => {
    const result = OnboardingSchema.safeParse({
      favoriteStyles: ["Casual"],
      favoriteColors: Array.from({ length: 11 }, (_, i) => `Color${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid onboarding payload", () => {
    const result = OnboardingSchema.safeParse({
      favoriteStyles: ["Casual"],
      favoriteColors: ["Black"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty favoriteColors array", () => {
    const result = OnboardingSchema.safeParse({
      favoriteStyles: ["Casual"],
      favoriteColors: [],
    });
    expect(result.success).toBe(false);
  });
});
