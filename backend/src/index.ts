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
export {
  getRecentWearsMap,
  getFeedbackHistoryMap,
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

// ─── Shared domain types (re-exported for server convenience) ────────────────
export { OCCASIONS } from "./types";
export type { Occasion, Garment, Outfit, OutfitGarment, OutfitWear } from "./types";
