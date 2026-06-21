export interface WeatherContext {
  temperature: number; // in Celsius
  humidity: number; // percentage (0-100)
  condition: string; // e.g., "Sunny", "Rain", "Cloudy", "Snow"
  rainProbability: number; // percentage (0-100)
  city: string;
}
