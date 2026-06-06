export interface GarmentInput {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  primaryColor: string | null;
  style: string | null;
  season: string | null;
  material: string | null;
}

export interface GeneratedOutfit {
  name: string;
  garmentIds: string[];
  reason: string;
  occasion?: string | null;
}

export interface GenerationResult {
  outfits: GeneratedOutfit[];
}
