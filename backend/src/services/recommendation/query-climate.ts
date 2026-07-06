import { WeatherContext } from "../weather/types";
import { QueryClimate } from "./interpret-query";

/**
 * Ask the Stylist scores outfits against the climate the user *described*,
 * never against today's actual weather — a query for "a cold place" must not
 * be overridden by whatever it happens to be outside right now. When the
 * query implies no climate at all, this returns a neutral context that
 * contributes no weather bonus/penalty in scoreOutfit.
 */
export function queryClimateToWeatherContext(climate: QueryClimate | null): WeatherContext {
  switch (climate) {
    case "cold":
      return { temperature: 8, humidity: 55, condition: "Cold", rainProbability: 10, city: "" };
    case "hot":
      return { temperature: 36, humidity: 40, condition: "Hot", rainProbability: 5, city: "" };
    case "rainy":
      return { temperature: 22, humidity: 80, condition: "Rain", rainProbability: 85, city: "" };
    case "mild":
    default:
      return { temperature: 22, humidity: 50, condition: "Mild", rainProbability: 0, city: "" };
  }
}

/**
 * The Season Fit bucket in scoreOutfit() normally checks garments against
 * today's real calendar season. That would fight a query like "a cold place"
 * asked in the middle of summer, docking a wool sweater purely for not
 * matching the actual date. When the query implies cold/hot, override the
 * season used for scoring to match it; rainy/mild/unset queries don't imply
 * a season, so the real calendar season still applies.
 */
export function queryClimateToSeasonOverride(climate: QueryClimate | null): string | null {
  switch (climate) {
    case "cold":
      return "winter";
    case "hot":
      return "summer";
    default:
      return null;
  }
}
