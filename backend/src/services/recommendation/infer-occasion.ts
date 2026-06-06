import { Occasion } from "../../types";

type InferableGarment = { style?: string | null; subcategory?: string | null };

export function inferOccasion(garments: InferableGarment[]): Occasion | null {
  if (garments.length === 0) return null;

  // 1. Any garment style includes "Formal" or "Black Tie"
  if (garments.some((g) => g.style && /(formal|black tie)/i.test(g.style))) {
    return "Formal";
  }

  // 2. Any garment style includes "Active" or "Athletic"
  if (garments.some((g) => g.style && /(active|athletic)/i.test(g.style))) {
    return "Active";
  }

  // 3. Any garment subcategory includes "Suit", "Blazer", or "Dress" (no Active signal above)
  if (garments.some((g) => g.subcategory && /(suit|blazer|dress)/i.test(g.subcategory))) {
    return "Formal";
  }

  // 4. Majority of garments have style "Smart Casual"
  const smartCasualCount = garments.filter((g) => g.style && /smart casual/i.test(g.style)).length;
  if (smartCasualCount > garments.length / 2) {
    return "Smart Casual";
  }

  // 5. Majority of garments have style "Casual"
  const casualCount = garments.filter((g) => g.style && /^casual$/i.test(g.style)).length;
  if (casualCount > garments.length / 2) {
    return "Casual";
  }

  return null;
}
