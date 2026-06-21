import { describe, it, expect } from "vitest";
import { inferOccasion } from "@/services/recommendation/infer-occasion";

describe("inferOccasion", () => {
  it("returns Formal when any garment style is Formal", () => {
    expect(inferOccasion([{ style: "Formal" }, { style: "Casual" }])).toBe("Formal");
  });

  it("returns Active when any garment style is Active", () => {
    expect(inferOccasion([{ style: "Active" }, { style: null }])).toBe("Active");
  });

  it("returns Formal for garments with Blazer subcategory (no formal style tag)", () => {
    expect(inferOccasion([{ subcategory: "Blazer", style: null }])).toBe("Formal");
  });

  it("returns Smart Casual when majority of garments have that style", () => {
    expect(
      inferOccasion([
        { style: "Smart Casual" },
        { style: "Smart Casual" },
        { style: "Casual" },
      ]),
    ).toBe("Smart Casual");
  });

  it("returns Casual when majority of garments have Casual style", () => {
    expect(
      inferOccasion([
        { style: "Casual" },
        { style: "Casual" },
        { style: null },
      ]),
    ).toBe("Casual");
  });

  it("returns null for mixed garments with no clear signal", () => {
    expect(
      inferOccasion([
        { style: "Casual", subcategory: "Jeans" },
        { style: "Smart Casual", subcategory: "Chinos" },
      ]),
    ).toBeNull();
  });

  it("returns null for an empty garment list", () => {
    expect(inferOccasion([])).toBeNull();
  });
});
