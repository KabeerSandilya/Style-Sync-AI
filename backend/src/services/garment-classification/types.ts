export interface GarmentMetadata {
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColor: string;
  season: string;
  style: string;
  material: string;
  confidence: number;
}

export const VALID_CATEGORIES = [
  "Topwear",
  "Bottomwear",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Formalwear",
  "Sportswear",
  "Ethnicwear",
] as const;

export const VALID_SEASONS = [
  "Summer",
  "Winter",
  "Spring",
  "Autumn",
  "All Season",
] as const;
