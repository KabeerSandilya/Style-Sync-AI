import { z } from "zod";
import { NextResponse } from "next/server";

export function zodError(error: z.ZodError) {
  return NextResponse.json(
    { success: false, error: error.issues[0].message },
    { status: 400 }
  );
}

const OccasionSchema = z.enum([
  "Work", "Casual", "Smart Casual", "Formal", "Active", "Date Night",
]).nullable().optional();

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

// POST /api/onboarding/complete
export const OnboardingSchema = z.object({
  favoriteStyles:    z.array(z.string().min(1)).min(1).max(10),
  favoriteColors:    z.array(z.string().min(1)).min(1).max(10),
  avoidedColors:     z.array(z.string()).max(10).optional(),
  avoidedMaterials:  z.array(z.string()).max(10).optional(),
  preferredSeasons:  z.array(z.string()).max(4).optional(),
  favoriteOccasions: z.array(z.string()).max(6).optional(),
});
