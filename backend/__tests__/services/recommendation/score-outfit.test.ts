import { describe, it, expect, vi } from "vitest";

// Mock @prisma/client before importing the module under test
vi.mock("@prisma/client", () => ({
  FeedbackType: { LIKE: "LIKE", DISLIKE: "DISLIKE" },
}));

import { scoreOutfit } from "@/services/recommendation/score-outfit";
import type { Garment, Outfit } from "@/types";
import type { WeatherContext } from "@/services/weather/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: "g1",
    userId: "u1",
    imageUrl: "http://img",
    name: "Test Garment",
    category: "Topwear",
    notes: null,
    tags: [],
    dominantColor: null,
    season: "All Season",
    occasion: null,
    clothingType: null,
    subcategory: null,
    primaryColor: null,
    secondaryColor: null,
    style: null,
    material: null,
    confidence: null,
    isFavorite: false,
    isProcessed: true,
    processedImageUrl: null,
    bgRemovedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastWornAt: null,
    ...overrides,
  };
}

function makeOutfit(garments: Garment[], occasion: string | null = null): Outfit {
  return {
    id: "o1",
    userId: "u1",
    name: "Test Outfit",
    notes: null,
    occasion,
    isFavorite: false,
    isAiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    garments: garments.map((g, i) => ({
      id: `og${i}`,
      outfitId: "o1",
      garmentId: g.id,
      createdAt: new Date().toISOString(),
      garment: g,
    })),
  };
}

const mildWeather: WeatherContext = {
  temperature: 22,
  humidity: 50,
  condition: "Clear",
  rainProbability: 5,
  city: "Paris",
};

const hotWeather: WeatherContext = {
  temperature: 35,
  humidity: 40,
  condition: "Sunny",
  rainProbability: 0,
  city: "Dubai",
};

const coldWeather: WeatherContext = {
  temperature: 5,
  humidity: 70,
  condition: "Overcast",
  rainProbability: 10,
  city: "Oslo",
};

const rainyWeather: WeatherContext = {
  temperature: 16,
  humidity: 90,
  condition: "Rain",
  rainProbability: 80,
  city: "London",
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("scoreOutfit", () => {
  it("returns 0 for an outfit with no garments", () => {
    const outfit = makeOutfit([]);
    expect(scoreOutfit(outfit, mildWeather)).toBe(0);
  });

  it("returns a number between 0 and 100 for a normal outfit", () => {
    const outfit = makeOutfit([makeGarment()]);
    const score = scoreOutfit(outfit, mildWeather);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("boosts score for lightweight tops in hot weather", () => {
    const lightTop = makeGarment({
      name: "Linen T-Shirt",
      category: "Topwear",
      subcategory: "Linen Tee",
      season: "Summer",
    });
    const heavyTop = makeGarment({
      name: "Wool Sweater",
      category: "Topwear",
      subcategory: "Heavy Sweater",
      season: "Winter",
    });

    const lightScore = scoreOutfit(makeOutfit([lightTop]), hotWeather);
    const heavyScore = scoreOutfit(makeOutfit([heavyTop]), hotWeather);

    expect(lightScore).toBeGreaterThan(heavyScore);
  });

  it("penalises heavy outerwear in hot weather", () => {
    const coat = makeGarment({
      name: "Winter Coat",
      subcategory: "Heavy Coat",
      notes: "wool coat",
      season: "Winter",
    });
    const tShirt = makeGarment({
      name: "T-Shirt",
      subcategory: "Tee",
      tags: ["tshirt"],
      season: "Summer",
    });

    const coatScore = scoreOutfit(makeOutfit([coat]), hotWeather);
    const tShirtScore = scoreOutfit(makeOutfit([tShirt]), hotWeather);

    expect(tShirtScore).toBeGreaterThan(coatScore);
  });

  it("boosts layered outfit (topwear + outerwear) in cold weather", () => {
    // Use "All Season" so season score doesn't confound the weather scoring comparison
    const top = makeGarment({
      id: "g1",
      name: "Shirt",
      category: "Topwear",
      season: "All Season",
    });
    const jacket = makeGarment({
      id: "g2",
      name: "Down Jacket",
      category: "Outerwear",
      subcategory: "Jacket",
      season: "All Season",
    });
    const justTop = makeGarment({
      id: "g3",
      name: "Shirt",
      category: "Topwear",
      season: "All Season",
    });

    const layeredScore = scoreOutfit(makeOutfit([top, jacket]), coldWeather);
    const singleScore = scoreOutfit(makeOutfit([justTop]), coldWeather);

    expect(layeredScore).toBeGreaterThan(singleScore);
  });

  it("penalises shorts in cold weather", () => {
    // Use "All Season" so season score doesn't confound the weather scoring comparison
    const shorts = makeGarment({
      name: "Shorts",
      category: "Bottomwear",
      subcategory: "Shorts",
      tags: ["shorts"],
      season: "All Season",
    });
    const trousers = makeGarment({
      name: "Wool Trousers",
      category: "Bottomwear",
      subcategory: "Trousers",
      season: "All Season",
    });

    const shortsScore = scoreOutfit(makeOutfit([shorts]), coldWeather);
    const trousersScore = scoreOutfit(makeOutfit([trousers]), coldWeather);

    expect(trousersScore).toBeGreaterThan(shortsScore);
  });

  it("penalises open-toe footwear in rainy weather", () => {
    const sandals = makeGarment({
      name: "Sandals",
      category: "Footwear",
      subcategory: "Sandal",
      tags: ["sandal"],
    });
    const boots = makeGarment({
      name: "Ankle Boots",
      category: "Footwear",
      subcategory: "Boots",
    });

    const sandalScore = scoreOutfit(makeOutfit([sandals]), rainyWeather);
    const bootScore = scoreOutfit(makeOutfit([boots]), rainyWeather);

    expect(bootScore).toBeGreaterThan(sandalScore);
  });

  it("gives a LIKE feedback bonus of +10", () => {
    const garment = makeGarment({ season: "All Season" });
    const outfit = makeOutfit([garment]);

    const baseScore = scoreOutfit(outfit, mildWeather);
    const likedScore = scoreOutfit(
      outfit,
      mildWeather,
      undefined,
      null,
      "LIKE" as any,
    );

    expect(likedScore).toBe(Math.min(100, baseScore + 10));
  });

  it("gives a DISLIKE feedback penalty of -30", () => {
    const garment = makeGarment({ season: "All Season" });
    const outfit = makeOutfit([garment]);

    const baseScore = scoreOutfit(outfit, mildWeather);
    const dislikedScore = scoreOutfit(
      outfit,
      mildWeather,
      undefined,
      null,
      "DISLIKE" as any,
    );

    expect(dislikedScore).toBe(Math.max(0, baseScore - 30));
  });

  it("applies a -50 recent wear penalty when worn today", () => {
    const garment = makeGarment({ season: "All Season" });
    const outfit = makeOutfit([garment]);
    const wornNow = new Date();

    const baseScore = scoreOutfit(outfit, mildWeather);
    const wornTodayScore = scoreOutfit(outfit, mildWeather, undefined, wornNow);

    expect(wornTodayScore).toBe(Math.max(0, baseScore - 50));
  });

  it("applies a -25 recent wear penalty when worn yesterday", () => {
    const garment = makeGarment({ season: "All Season" });
    const outfit = makeOutfit([garment]);
    const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000);

    const baseScore = scoreOutfit(outfit, mildWeather);
    const wornYesterdayScore = scoreOutfit(
      outfit,
      mildWeather,
      undefined,
      yesterday,
    );

    expect(wornYesterdayScore).toBe(Math.max(0, baseScore - 25));
  });

  it("applies no wear penalty when last worn more than a week ago", () => {
    const garment = makeGarment({ season: "All Season" });
    const outfit = makeOutfit([garment]);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const baseScore = scoreOutfit(outfit, mildWeather);
    const wornOldScore = scoreOutfit(
      outfit,
      mildWeather,
      undefined,
      twoWeeksAgo,
    );

    expect(wornOldScore).toBe(baseScore);
  });

  it("adds preference match bonus for matching colour", () => {
    const garment = makeGarment({ primaryColor: "Navy", season: "All Season" });
    const outfit = makeOutfit([garment]);

    const noPrefs = scoreOutfit(outfit, mildWeather);
    const withPrefs = scoreOutfit(outfit, mildWeather, {
      favoriteColors: ["Navy"],
    });

    expect(withPrefs).toBeGreaterThan(noPrefs);
  });

  it("adds preference match bonus for matching style", () => {
    const garment = makeGarment({ style: "Casual", season: "All Season" });
    const outfit = makeOutfit([garment]);

    const noPrefs = scoreOutfit(outfit, mildWeather);
    const withPrefs = scoreOutfit(outfit, mildWeather, {
      favoriteStyles: ["Casual"],
    });

    expect(withPrefs).toBeGreaterThan(noPrefs);
  });

  it("caps preference match bonus at 25 points even with many matching garments", () => {
    // Use many garments with matching colors only (style preference omitted to keep
    // the base styleScore unchanged), so the difference is purely preferenceMatchBonus.
    const garments = Array.from({ length: 15 }, (_, i) =>
      makeGarment({
        id: `g${i}`,
        primaryColor: "Black",
        season: "All Season",
        style: null,
      }),
    );
    const outfit = makeOutfit(garments);

    const baseScore = scoreOutfit(outfit, mildWeather);
    const withColorPrefs = scoreOutfit(outfit, mildWeather, {
      favoriteColors: ["Black"],
    });

    // Delta should be capped at 25 (the preferenceMatchBonus ceiling)
    expect(withColorPrefs - baseScore).toBeLessThanOrEqual(25);
    expect(withColorPrefs - baseScore).toBeGreaterThan(0);
  });

  it("applies missing metadata penalty per garment field", () => {
    const fullMetadata = makeGarment({
      category: "Topwear",
      clothingType: "T-Shirt",
      season: "Summer",
      style: "Casual",
      primaryColor: "White",
    });

    const noMetadata = makeGarment({
      category: "",
      clothingType: null,
      season: null,
      style: null,
      primaryColor: null,
      dominantColor: null,
    });

    const fullScore = scoreOutfit(makeOutfit([fullMetadata]), mildWeather);
    const noMetaScore = scoreOutfit(makeOutfit([noMetadata]), mildWeather);

    expect(fullScore).toBeGreaterThan(noMetaScore);
  });

  it("always returns a score between 0 and 100 regardless of extreme penalties", () => {
    const garment = makeGarment({ season: "Summer" });
    const outfit = makeOutfit([garment]);
    const wornToday = new Date();

    const score = scoreOutfit(
      outfit,
      hotWeather,
      undefined,
      wornToday,
      "DISLIKE" as any,
    );

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
