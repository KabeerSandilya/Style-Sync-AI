import { z } from "zod";
import { NextResponse } from "next/server";
import { MOOD_TAGS, OCCASIONS } from "@style-sync/backend/types";

export function zodError(error: z.ZodError) {
  return NextResponse.json(
    { success: false, error: error.issues[0].message },
    { status: 400 }
  );
}

const OccasionSchema = z.string().trim().min(1).max(50).nullable().optional();

const CuidSchema = z.string().cuid();
const CuidArraySchema = z.array(CuidSchema).min(1, "Select at least one garment.");

const GARMENT_CATEGORIES = [
  "Topwear", "Bottomwear", "Outerwear", "Footwear", "Accessories",
  "Formalwear", "Sportswear", "Ethnicwear", "Uncategorized",
] as const;

// PATCH /api/garments/[id]
export const UpdateGarmentSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  category:   z.enum(GARMENT_CATEGORIES).optional(),
  isFavorite: z.boolean().optional(),
  notes:      z.string().max(500).nullable().optional(),
  tags:       z.array(z.string()).optional(),
}).strict();

// POST /api/outfits
export const CreateOutfitSchema = z.object({
  name:       z.string().max(100).optional(),
  notes:      z.string().max(500).nullable().optional(),
  isFavorite: z.boolean().optional(),
  occasion:   OccasionSchema,
  garmentIds: CuidArraySchema,
});

// PATCH /api/outfits/[id]
export const UpdateOutfitSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  notes:      z.string().max(500).nullable().optional(),
  isFavorite: z.boolean().optional(),
  occasion:   OccasionSchema,
  garmentIds: CuidArraySchema.optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: "No fields to update." }
);

// POST /api/outfits/generate
export const GenerateOutfitsSchema = z.object({
  occasion: OccasionSchema,
}).optional().default({});

// GET /api/recommendations — query params
export const RecommendationsQuerySchema = z.object({
  lat:      z.coerce.number().min(-90).max(90).optional(),
  lon:      z.coerce.number().min(-180).max(180).optional(),
  city:     z.string().max(100).optional(),
  occasion: OccasionSchema,
});

// POST /api/recommendations/query
export const QueryRecommendationSchema = z.object({
  query: z.string().min(3).max(200),
  lat:   z.number().min(-90).max(90).optional(),
  lon:   z.number().min(-180).max(180).optional(),
  city:  z.string().max(100).optional(),
});

// POST /api/planner
export const CreatePlanSchema = z.object({
  outfitId:    CuidSchema,
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "plannedDate must be YYYY-MM-DD"),
  occasion:    OccasionSchema,
  note:        z.string().max(300).nullable().optional(),
});

// POST /api/preferences  &  PATCH /api/preferences
export const UpdatePreferencesSchema = z.object({
  favoriteColors:    z.array(z.string().min(1).max(50)).max(10).optional(),
  favoriteStyles:    z.array(z.string().min(1).max(50)).max(10).optional(),
  favoriteOccasions: z.array(z.string().min(1).max(50)).max(6).optional(),
  avoidedColors:     z.array(z.string().min(1).max(50)).max(10).optional(),
  avoidedMaterials:  z.array(z.string().min(1).max(50)).max(10).optional(),
  preferredSeasons:  z.array(z.string().min(1).max(50)).max(4).optional(),
  threshold:         z.number().optional(),
}).strict();

// PATCH /api/planner/[id]
export const UpdatePlanSchema = z.object({
  outfitId: CuidSchema.optional(),
  occasion: OccasionSchema,
  note:     z.string().max(300).nullable().optional(),
});

// PATCH /api/lookbook/[id]
export const UpdateLookBookEntrySchema = z.object({
  outfitId:    CuidSchema.optional().nullable(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD").optional(),
  rating:      z.number().int().min(1).max(5).optional(),
  mood:        z.array(z.enum(MOOD_TAGS)).max(MOOD_TAGS.length).optional(),
  notes:       z.string().max(500).nullable().optional(),
  isShareable: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

// GET /api/lookbook — query params
export const LookBookQuerySchema = z.object({
  cursor:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  month:    z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM").optional(),
  mood:     z.enum(MOOD_TAGS).optional(),
  rating:   z.coerce.number().int().min(1).max(5).optional(),
  occasion: OccasionSchema,
});

// POST /api/onboarding/complete
export const OnboardingSchema = z.object({
  favoriteStyles:    z.array(z.string().min(1)).min(1).max(10),
  favoriteColors:    z.array(z.string().min(1)).min(1).max(10),
  avoidedColors:     z.array(z.string()).max(10).optional(),
  avoidedMaterials:  z.array(z.string()).max(10).optional(),
  preferredSeasons:  z.array(z.string()).max(4).optional(),
  favoriteOccasions: z.array(z.string()).max(6).optional(),
});

// POST /api/community/profile
export const UpsertCommunityProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  avatarUrl:   z.string().url(),
  isPrivate:   z.boolean(),
});

// POST /api/community
export const CreateCommunityPostSchema = z.object({
  sourceLookBookEntryId: CuidSchema,
  caption:               z.string().max(300).optional(),
  occasion:              z.enum(OCCASIONS).optional(),
});

// GET /api/community — query params
export const CommunityFeedQuerySchema = z.object({
  cursor:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(30).default(12),
  occasion: z.enum(OCCASIONS).optional(),
  sort:     z.enum(["newest", "trending"]).default("newest"),
  tab:      z.enum(["feed", "saved"]).default("feed"),
});
