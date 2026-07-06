/**
 * @style-sync/backend — server-side barrel.
 *
 * Aggregates the data layer, infra helpers, and domain services consumed by the
 * Next.js API route handlers in `frontend/app/api`. Server-only: never import
 * this from a Client Component (it pulls in Prisma, pg, and AI SDKs). For shared
 * domain types in client code, import `@style-sync/backend/types` instead.
 */

// ─── Data layer & infrastructure ─────────────────────────────────────────────
export { prisma } from "./lib/prisma";
export { cloudinary } from "./lib/cloudinary";
export { isRateLimited } from "./lib/rate-limit";
export type { RateLimitOptions } from "./lib/rate-limit";
export { withRetry } from "./lib/retry";

// ─── Garment classification ──────────────────────────────────────────────────
export { classifyGarment } from "./services/garment-classification/classify-garment";

// ─── Background removal ──────────────────────────────────────────────────────
export { removeBackground } from "./services/background-removal/remove-background";

// ─── Weather ─────────────────────────────────────────────────────────────────
export { fetchWeather } from "./services/weather";
export type { WeatherContext } from "./services/weather/types";

// ─── Recommendation engine ───────────────────────────────────────────────────
export { rankOutfits } from "./services/recommendation/rank-outfits";
export { interpretStyleQuery } from "./services/recommendation/interpret-query";
export type { QueryInterpretation, QueryClimate } from "./services/recommendation/interpret-query";
export { queryClimateToWeatherContext, queryClimateToSeasonOverride } from "./services/recommendation/query-climate";
export {
  getRecentWearsMap,
  getFeedbackHistoryMap,
  getRecentSuggestionsMap,
} from "./services/recommendation-history";

// ─── Preference learning ─────────────────────────────────────────────────────
export { updatePreferenceProfile } from "./services/preferences/update-profile";

// ─── Wardrobe insights ───────────────────────────────────────────────────────
export { getMostWornGarments } from "./services/insights/get-most-worn-garments";
export { getLeastWornGarments } from "./services/insights/get-least-worn-garments";
export { getNeverWornGarments } from "./services/insights/get-never-worn-garments";
export { getMostWornOutfits } from "./services/insights/get-most-worn-outfits";

// ─── AI outfit generation ────────────────────────────────────────────────────
export { generateOutfits } from "./services/outfit-generation/generate-outfits";
export type {
  GarmentInput,
  GeneratedOutfit,
  GenerationResult,
} from "./services/outfit-generation/types";

// ─── Style DNA ───────────────────────────────────────────────────────────────
export { buildWardrobeSummary } from "./services/style-dna/summarize";
export type { WardrobeSummary } from "./services/style-dna/summarize";
export { generateStyleDNA } from "./services/style-dna/generate";
export type { StyleDNAResult } from "./services/style-dna/generate";
export { getCachedStyleDNA, setCachedStyleDNA, invalidateStyleDNACache } from "./lib/cache/style-dna";

// ─── Capsule Wardrobe Auditor ────────────────────────────────────────────────
export { scoreGarments } from "./services/capsule/score-garments";
export type { GarmentScore } from "./services/capsule/score-garments";
export { tierGarments } from "./services/capsule/tier-garments";
export type { CapsuleTiers } from "./services/capsule/tier-garments";
export { analyzeWardrobeGaps } from "./services/capsule/analyze-gaps";
export type { WardrobeComposition, GapAnalysisResult } from "./services/capsule/analyze-gaps";
export { getPurgeSuggestions } from "./services/capsule/purge-suggestions";
export type { PurgeSuggestion } from "./services/capsule/purge-suggestions";
export {
  getCachedCapsuleAudit,
  setCachedCapsuleAudit,
  invalidateCapsuleAuditCache,
} from "./lib/cache/capsule-audit";

// ─── Shared domain types (re-exported for server convenience) ────────────────
export { OCCASIONS, MOOD_TAGS } from "./types";
export type {
  Occasion,
  Garment,
  Outfit,
  OutfitGarment,
  OutfitWear,
  MoodTag,
  LookBookEntry,
  CommunityProfile,
  CommunityPost,
} from "./types";
