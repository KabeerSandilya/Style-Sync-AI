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

export type Occasion =
  | 'Work'
  | 'Casual'
  | 'Smart Casual'
  | 'Formal'
  | 'Active'
  | 'Date Night'

export const OCCASIONS: Occasion[] = [
  'Work',
  'Casual',
  'Smart Casual',
  'Formal',
  'Active',
  'Date Night',
]

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  notes?: string | null;
  occasion: Occasion | null;
  isFavorite: boolean;
  isAiGenerated: boolean;
  shareToken?: string | null;
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

export interface OutfitPlan {
  id: string;
  userId: string;
  outfitId: string;
  plannedDate: string;
  occasion: string | null;
  note: string | null;
  createdAt: string;
  outfit: Outfit;
}

export const MOOD_TAGS = [
  "Confident",
  "Comfortable",
  "Underdressed",
  "Overdressed",
  "Effortless",
  "Bold",
  "Casual",
] as const;
export type MoodTag = (typeof MOOD_TAGS)[number];

export interface LookBookEntry {
  id: string;
  userId: string;
  outfitId: string | null;
  photoUrl: string;
  date: string;
  rating: number;
  mood: string[];
  notes?: string | null;
  isShareable: boolean;
  createdAt: string;
  outfit?: Outfit | null;
}

export interface CommunityProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  sourceLookBookEntryId: string | null;
  photoUrl: string;
  caption: string | null;
  occasion: string | null;
  createdAt: string;
  profile: Pick<CommunityProfile, "displayName" | "avatarUrl">;
  likeCount: number;
  saveCount: number;
  isLikedByViewer: boolean;
  isSavedByViewer: boolean;
  isOwnPost: boolean;
}

// Service-level view types that are consumed by the frontend. Re-exported here
// (the runtime-free `@style-sync/backend/types` entry point) so Client
// Components can import them without pulling in any server runtime.
export type { ScoredOutfit } from "../services/recommendation/types";
export type { WeatherContext } from "../services/weather/types";


