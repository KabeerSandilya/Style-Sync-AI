import { WeatherContext } from "./types";
import { getRedis } from "../../lib/redis";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_TTL_SECONDS = 15 * 60;
const REDIS_KEY_PREFIX = 'stylesync:weather';

interface CacheEntry {
  data: WeatherContext;
  cachedAt: number;
}

// In-memory fallback (used when Redis unavailable)
const localCache = new Map<string, CacheEntry>();

function getCacheKey(city: string, lat?: number, lon?: number): string {
  if (lat !== undefined && lon !== undefined) {
    return `coords:${lat.toFixed(2)},${lon.toFixed(2)}`;
  }
  return `city:${city.toLowerCase()}`;
}

export async function fetchWeather(city = "Paris", lat?: number, lon?: number): Promise<WeatherContext> {
  const cacheKey = getCacheKey(city, lat, lon);

  // Read from cache
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get<WeatherContext>(`${REDIS_KEY_PREFIX}:${cacheKey}`);
    if (cached) return cached;
  } else {
    const entry = localCache.get(cacheKey);
    if (entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) return entry.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Fallback seasonal mock weather data generator
  const getMockWeather = (cityName: string): WeatherContext => {
    const month = new Date().getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
    let temperature = 20;
    let humidity = 55;
    let condition = "Partly Cloudy";
    let rainProbability = 10;

    if (month === 11 || month === 0 || month === 1) {
      // Winter (Dec, Jan, Feb)
      temperature = 6;
      humidity = 65;
      condition = "Overcast";
      rainProbability = 30;
    } else if (month === 2 || month === 3 || month === 4) {
      // Spring (Mar, Apr, May)
      temperature = 19;
      humidity = 50;
      condition = "Clear";
      rainProbability = 15;
    } else if (month === 5 || month === 6 || month === 7) {
      // Summer (Jun, Jul, Aug)
      temperature = 33;
      humidity = 40;
      condition = "Sunny";
      rainProbability = 5;
    } else {
      // Autumn/Fall (Sep, Oct, Nov)
      temperature = 13;
      humidity = 80;
      condition = "Rain";
      rainProbability = 75;
    }

    return {
      temperature,
      humidity,
      condition,
      rainProbability,
      city: cityName,
    };
  };

  const hasCoords = lat !== undefined && lon !== undefined;
  const mockCityName = hasCoords ? "Local Area" : city;

  const cache = async (data: WeatherContext): Promise<WeatherContext> => {
    const r = getRedis();
    if (r) {
      await r.set(`${REDIS_KEY_PREFIX}:${cacheKey}`, data, { ex: CACHE_TTL_SECONDS });
    } else {
      localCache.set(cacheKey, { data, cachedAt: Date.now() });
    }
    return data;
  };

  if (!apiKey || apiKey.trim() === "") {
    console.log("No OPENWEATHER_API_KEY set. Returning fallback mock weather context.");
    return await cache(getMockWeather(mockCityName));
  }

  try {
    // Attempt fetching 5-day / 3-hour forecast to extract POP (probability of precipitation)
    const url = hasCoords
      ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API returned status: ${response.status}`);
    }

    const data = await response.json();
    if (data.list && data.list.length > 0) {
      const current = data.list[0];
      const main = current.main;
      const weatherObj = current.weather[0];

      return await cache({
        temperature: Math.round(main.temp),
        humidity: Math.round(main.humidity),
        condition: weatherObj.main || "Clear",
        rainProbability: Math.round((current.pop || 0) * 100),
        city: data.city?.name || (hasCoords ? "Local Area" : city),
      });
    }
  } catch (err) {
    console.warn("Forecast fetch failed or not supported. Falling back to current weather API.", err);

    // Try current weather fallback
    try {
      const fallbackUrl = hasCoords
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

      const response = await fetch(fallbackUrl);
      if (response.ok) {
        const data = await response.json();
        const main = data.main;
        const weatherObj = data.weather[0];
        const cond = weatherObj.main || "Clear";

        // Estimate rain probability since /weather doesn't have pop
        let rainProbability = 0;
        if (cond.toLowerCase().includes("rain")) {
          rainProbability = 90;
        } else if (cond.toLowerCase().includes("drizzle")) {
          rainProbability = 60;
        } else if (cond.toLowerCase().includes("cloud")) {
          rainProbability = 20;
        }

        return await cache({
          temperature: Math.round(main.temp),
          humidity: Math.round(main.humidity),
          condition: cond,
          rainProbability,
          city: data.name || (hasCoords ? "Local Area" : city),
        });
      }
    } catch (fallbackErr) {
      console.error("All OpenWeather API calls failed. Returning mock data.", fallbackErr);
    }
  }

  return await cache(getMockWeather(mockCityName));
}
