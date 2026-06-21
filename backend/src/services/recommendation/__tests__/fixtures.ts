import type { Garment, Outfit, Occasion } from "@/types";
import type { WeatherContext } from "@/services/weather/types";

export const mockWeatherClear: WeatherContext = {
  temperature: 22,
  humidity: 50,
  condition: "Clear",
  rainProbability: 5,
  city: "London",
};

export const mockWeatherRainy: WeatherContext = {
  temperature: 14,
  humidity: 80,
  condition: "Rain",
  rainProbability: 90,
  city: "London",
};

export const mockWeatherHot: WeatherContext = {
  temperature: 35,
  humidity: 40,
  condition: "Sunny",
  rainProbability: 0,
  city: "Dubai",
};

export const mockWeatherCold: WeatherContext = {
  temperature: 5,
  humidity: 70,
  condition: "Overcast",
  rainProbability: 10,
  city: "Oslo",
};

export function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: "g1",
    userId: "u1",
    imageUrl: "https://example.com/garment.jpg",
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

export function makeOutfit(
  garments: Garment[],
  occasion: Occasion | null = null,
  overrides: Partial<Outfit> = {},
): Outfit {
  return {
    id: "o1",
    userId: "u1",
    name: "Test Outfit",
    notes: null,
    occasion,
    isFavorite: false,
    isAiGenerated: false,
    createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
    updatedAt: new Date().toISOString(),
    garments: garments.map((g, i) => ({
      id: `og${i}`,
      outfitId: "o1",
      garmentId: g.id,
      createdAt: new Date().toISOString(),
      garment: g,
    })),
    ...overrides,
  };
}
