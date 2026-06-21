import { describe, it, expect } from "vitest";
import { buildProfile } from "@/services/preferences/build-profile";
import type { PreferenceScoreData } from "@/services/preferences/types";

function emptyScores(): PreferenceScoreData {
  return { colors: {}, styles: {}, categories: {}, seasons: {}, types: {} };
}

describe("buildProfile — empty history produces neutral profile", () => {
  it("returns empty arrays for all fields when no events have occurred", () => {
    const profile = buildProfile(emptyScores());
    expect(profile.favoriteColors).toHaveLength(0);
    expect(profile.favoriteStyles).toHaveLength(0);
    expect(profile.favoriteCategories).toHaveLength(0);
    expect(profile.favoriteSeasons).toHaveLength(0);
    expect(profile.favoriteTypes).toHaveLength(0);
  });
});

describe("buildProfile — wear events increase style score", () => {
  it("includes a style in favorites when score meets the threshold (simulating wear events)", () => {
    // WEIGHTS.WEAR = 10 per event; one wear pushes Casual to score 10
    const scores = { ...emptyScores(), styles: { Casual: 10 } };
    const profile = buildProfile(scores, 5);
    expect(profile.favoriteStyles).toContain("Casual");
  });

  it("ranks styles by score descending", () => {
    const scores = {
      ...emptyScores(),
      styles: { Casual: 10, Formal: 30, Active: 20 },
    };
    const profile = buildProfile(scores, 5);
    expect(profile.favoriteStyles[0]).toBe("Formal");
    expect(profile.favoriteStyles[1]).toBe("Active");
    expect(profile.favoriteStyles[2]).toBe("Casual");
  });
});

describe("buildProfile — dislike events decrease style score", () => {
  it("excludes a style when its score falls below the threshold (simulating dislike events)", () => {
    // WEIGHTS.DISLIKE = -5 per event
    const scores = { ...emptyScores(), styles: { Casual: -5 } };
    const profile = buildProfile(scores, 5); // threshold = 5
    expect(profile.favoriteStyles).not.toContain("Casual");
  });

  it("excludes a style with score exactly 0 (net neutral)", () => {
    const scores = { ...emptyScores(), colors: { Black: 0 } };
    const profile = buildProfile(scores, 5);
    expect(profile.favoriteColors).not.toContain("Black");
  });
});

describe("buildProfile — scores are bounded (no unbounded accumulation)", () => {
  it("returns at most 5 styles even when many cross the threshold", () => {
    const styles: Record<string, number> = {};
    for (let i = 0; i < 10; i++) styles[`Style${i}`] = 10 + i;
    const scores = { ...emptyScores(), styles };
    const profile = buildProfile(scores, 5);
    expect(profile.favoriteStyles.length).toBeLessThanOrEqual(5);
  });

  it("returns at most 5 colors", () => {
    const colors: Record<string, number> = {};
    for (let i = 0; i < 8; i++) colors[`Color${i}`] = 10 + i;
    const scores = { ...emptyScores(), colors };
    const profile = buildProfile(scores, 5);
    expect(profile.favoriteColors.length).toBeLessThanOrEqual(5);
  });

  it("uses a higher threshold to reduce what counts as a preference", () => {
    const scores = { ...emptyScores(), styles: { Casual: 8, Formal: 15 } };
    const profile = buildProfile(scores, 10); // threshold = 10
    expect(profile.favoriteStyles).not.toContain("Casual"); // 8 < 10
    expect(profile.favoriteStyles).toContain("Formal"); // 15 >= 10
  });
});
