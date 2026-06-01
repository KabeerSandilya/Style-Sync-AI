export interface Garment {
  id: string;
  userId: string;
  imageUrl: string;
  name: string;
  category: string;
  notes?: string | null;
  tags: string[];
  dominantColor?: string | null;
  season?: string | null;
  occasion?: string | null;
  clothingType?: string | null;
  subcategory?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  style?: string | null;
  material?: string | null;
  confidence?: number | null;
  isFavorite: boolean;
  isProcessed: boolean;
  processedImageUrl?: string | null;
  bgRemovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastWornAt?: string | null;
}

export interface OutfitGarment {
  id: string;
  outfitId: string;
  garmentId: string;
  createdAt: string;
  garment: Garment;
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  notes?: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  garments: OutfitGarment[];
  wears?: OutfitWear[];
}

export interface OutfitWear {
  id: string;
  userId: string;
  outfitId: string;
  wornAt: string;
}

