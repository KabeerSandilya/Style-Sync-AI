import { describe, it, expect, vi } from "vitest";

vi.mock("@prisma/client", () => ({
  FeedbackType: { LIKE: "LIKE", DISLIKE: "DISLIKE" },
}));

import { rankOutfits } from "@/services/recommendation/rank-outfits";
import { makeGarment, makeOutfit, mockWeatherClear } from "./fixtures";

describe("rankOutfits — ordering", () => {
  it("returns an empty array when given no outfits", () => {
    expect(rankOutfits([], mockWeatherClear)).toHaveLength(0);
  });

  it("returns the same number of results as input outfits", () => {
    const outfits = [
      makeOutfit([makeGarment({ id: "g1" })], null, { id: "o1" }),
      makeOutfit([makeGarment({ id: "g2" })], null, { id: "o2" }),
    ];
    expect(rankOutfits(outfits, mockWeatherClear)).toHaveLength(2);
  });

  it("places the higher-scoring outfit first", () => {
    const allSeason = makeGarment({ id: "g1", season: "All Season" });
    const wrongSeason = makeGarment({ id: "g2", season: "Winter" }); // penalised if current is summer

    const goodOutfit = makeOutfit([allSeason], null, { id: "good" });
    const badOutfit = makeOutfit([wrongSeason], null, {
      id: "bad",
      createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    });

    const wearsMap = { bad: new Date() }; // worn today → -50 penalty
    const ranked = rankOutfits([badOutfit, goodOutfit], mockWeatherClear, undefined, wearsMap);

    expect(ranked[0].outfitId).toBe("good");
  });

  it("breaks score ties using createdAt descending (newer outfit first)", () => {
    const older = makeOutfit(
      [makeGarment({ id: "g1", season: "All Season" })],
      null,
      {
        id: "older",
        createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
      },
    );
    const newer = makeOutfit(
      [makeGarment({ id: "g2", season: "All Season" })],
      null,
      {
        id: "newer",
        createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
      },
    );

    // Both outfits use the same garment shape so they score identically
    const ranked = rankOutfits([older, newer], mockWeatherClear);
    expect(ranked[0].outfitId).toBe("newer");
    expect(ranked[1].outfitId).toBe("older");
  });

  it("attaches a non-empty explanation string to each result", () => {
    const outfit = makeOutfit([makeGarment()], null, { id: "o1" });
    const [result] = rankOutfits([outfit], mockWeatherClear);
    expect(typeof result.explanation).toBe("string");
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("threads requestedOccasion through to the scorer", () => {
    const garment = makeGarment({ id: "g1", season: "All Season" });
    const formalOutfit = makeOutfit([garment], "Formal", { id: "formal" });
    const casualOutfit = makeOutfit([garment], "Casual", { id: "casual" });

    const ranked = rankOutfits(
      [casualOutfit, formalOutfit],
      mockWeatherClear,
      undefined,
      undefined,
      undefined,
      "Formal",
    );

    // Formal outfit should rank above Casual when Formal is requested
    expect(ranked[0].outfitId).toBe("formal");
  });
});
