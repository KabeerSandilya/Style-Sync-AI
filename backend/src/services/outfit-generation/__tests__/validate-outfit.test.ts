import { describe, it, expect } from "vitest";
import { validateGeneratedOutfit } from "@/services/outfit-generation/generate-outfits";

const IDS = new Set(["g1", "g2", "g3", "g4", "g5", "g6"]);

const CATEGORIES = new Map([
  ["g1", "Topwear"],
  ["g2", "Bottomwear"],
  ["g3", "Footwear"],
  ["g4", "Topwear"],
  ["g5", "Bottomwear"],
  ["g6", "Footwear"],
]);

function validOutfit(overrides: Record<string, unknown> = {}) {
  return {
    name: "Summer Look",
    garmentIds: ["g1", "g2"],
    reason: "A solid casual combination.",
    ...overrides,
  };
}

describe("validateGeneratedOutfit — shape checks", () => {
  it("accepts a valid outfit with 2 garments", () => {
    expect(validateGeneratedOutfit(validOutfit(), IDS, CATEGORIES)).toBe(true);
  });

  it("accepts a valid outfit with 5 garments", () => {
    expect(
      validateGeneratedOutfit(
        validOutfit({ garmentIds: ["g1", "g2", "g3", "g4", "g1"] }),
        IDS,
        CATEGORIES,
      ),
    ).toBe(true);
  });

  it("rejects null input", () => {
    expect(validateGeneratedOutfit(null, IDS, CATEGORIES)).toBe(false);
  });

  it("rejects outfit with missing name", () => {
    expect(validateGeneratedOutfit({ garmentIds: ["g1", "g2"], reason: "ok" }, IDS, CATEGORIES)).toBe(false);
  });

  it("rejects outfit with empty name", () => {
    expect(validateGeneratedOutfit(validOutfit({ name: "  " }), IDS, CATEGORIES)).toBe(false);
  });

  it("rejects outfit with missing reason", () => {
    expect(validateGeneratedOutfit({ name: "Look", garmentIds: ["g1", "g2"] }, IDS, CATEGORIES)).toBe(false);
  });

  it("rejects outfit with 0 garments", () => {
    expect(validateGeneratedOutfit(validOutfit({ garmentIds: [] }), IDS, CATEGORIES)).toBe(false);
  });

  it("rejects outfit with 1 garment", () => {
    expect(validateGeneratedOutfit(validOutfit({ garmentIds: ["g1"] }), IDS, CATEGORIES)).toBe(false);
  });

  it("rejects outfit with more than 5 garments", () => {
    expect(
      validateGeneratedOutfit(
        validOutfit({ garmentIds: ["g1", "g2", "g3", "g4", "g1", "g4"] }),
        IDS,
        CATEGORIES,
      ),
    ).toBe(false);
  });

  it("rejects outfit with a hallucinated garmentId not in inputIds", () => {
    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "FAKE_ID"] }), IDS, CATEGORIES),
    ).toBe(false);
  });
});

describe("validateGeneratedOutfit — category exclusivity", () => {
  it("rejects outfit with 2 bottomwear garments", () => {
    // g2 and g5 are both Bottomwear
    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "g2", "g5"] }), IDS, CATEGORIES),
    ).toBe(false);
  });

  it("rejects outfit with 2 footwear garments", () => {
    // g3 and g6 are both Footwear
    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "g3", "g6"] }), IDS, CATEGORIES),
    ).toBe(false);
  });

  it("accepts outfit with exactly 1 bottomwear and 1 footwear", () => {
    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "g2", "g3"] }), IDS, CATEGORIES),
    ).toBe(true);
  });
});

describe("validateGeneratedOutfit — fingerprint deduplication", () => {
  it("rejects outfit that duplicates an existing saved outfit by fingerprint", () => {
    const fingerprint = ["g1", "g2"].sort().join("|");
    const existing = new Set([fingerprint]);

    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "g2"] }), IDS, CATEGORIES, existing),
    ).toBe(false);
  });

  it("accepts an outfit when fingerprint is not in the existing set", () => {
    const existing = new Set(["g3|g4"]);

    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "g2"] }), IDS, CATEGORIES, existing),
    ).toBe(true);
  });

  it("is order-independent (g2|g1 matches existing g1|g2 fingerprint)", () => {
    const existing = new Set(["g1|g2"]); // already sorted
    // Outfit has IDs in different order — should still match fingerprint
    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g2", "g1"] }), IDS, CATEGORIES, existing),
    ).toBe(false);
  });

  it("accepts outfit when no existingFingerprints are provided", () => {
    expect(
      validateGeneratedOutfit(validOutfit({ garmentIds: ["g1", "g2"] }), IDS, CATEGORIES),
    ).toBe(true);
  });

  it("all invalid outfits result in an empty validated list", () => {
    const rawOutfits = [
      { name: "", garmentIds: ["g1", "g2"], reason: "bad name" },
      { name: "Look", garmentIds: [], reason: "no garments" },
      { name: "Look2", garmentIds: ["g1", "FAKE"], reason: "hallucinated id" },
    ];

    const valid = rawOutfits.filter((o) =>
      validateGeneratedOutfit(o, IDS, CATEGORIES),
    );

    expect(valid).toHaveLength(0);
  });
});
