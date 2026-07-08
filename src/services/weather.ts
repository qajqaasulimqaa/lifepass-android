// Lightweight current-weather fetch for Reykjavík via Open-Meteo.
// Open-Meteo is free, no API key required — great fit for an MVP. If we
// ever need forecasts, alerts, or pinpoint precision we can swap to a
// paid provider behind the same `fetchWeather` signature.

const REYKJAVIK = { lat: 64.1466, lon: -21.9426 };

export type WeatherIconName =
  | 'sunny'
  | 'partly-sunny'
  | 'cloudy'
  | 'rainy'
  | 'snow'
  | 'thunderstorm';

export type WeatherSnapshot = {
  /** Temperature in °C, rounded to nearest integer. */
  temperature: number;
  /** Short uppercase label like "SUNNY", "CLOUDY", "RAINY". */
  condition: string;
  /** Ionicons name we render next to the kicker. */
  icon: WeatherIconName;
};

// WMO weather codes — what Open-Meteo returns in `current.weather_code`.
// Reference: https://open-meteo.com/en/docs (WMO weather interpretation codes).
function describeCode(code: number): { condition: string; icon: WeatherIconName } {
  if (code === 0) return { condition: 'SUNNY', icon: 'sunny' };
  if (code <= 3) return { condition: 'CLOUDY', icon: 'partly-sunny' };
  if (code === 45 || code === 48) return { condition: 'FOGGY', icon: 'cloudy' };
  if (code >= 51 && code <= 67) return { condition: 'RAINY', icon: 'rainy' };
  if (code >= 71 && code <= 86) return { condition: 'SNOWING', icon: 'snow' };
  if (code >= 95) return { condition: 'STORMY', icon: 'thunderstorm' };
  return { condition: 'CLOUDY', icon: 'cloudy' };
}

export async function fetchWeather(): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${REYKJAVIK.lat}&longitude=${REYKJAVIK.lon}` +
    `&current=temperature_2m,weather_code&temperature_unit=celsius`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API ${res.status}`);
  const data = await res.json();

  const code: number = data?.current?.weather_code ?? 0;
  const tempC: number = data?.current?.temperature_2m ?? 0;
  const { condition, icon } = describeCode(code);

  return {
    temperature: Math.round(tempC),
    condition,
    icon,
  };
}

/**
 * Activity-aware tagline based on the current weather — e.g. "OUTDOOR POOL
 * WEATHER" on a sunny cool day, "LAGOON WEATHER" on a rainy day.  Lets us
 * make the hero feel responsive to today's conditions.
 */
export function weatherRecommendation(weather: WeatherSnapshot): string {
  const { temperature, icon } = weather;

  if (icon === 'thunderstorm') return 'STAY IN · SAUNA DAY';
  if (icon === 'snow') return 'HOT SPRING WEATHER';
  if (icon === 'rainy') return 'LAGOON WEATHER';

  if (icon === 'sunny') {
    if (temperature >= 15) return 'PERFECT FOR OUTDOORS';
    if (temperature >= 5)  return 'OUTDOOR POOL WEATHER';
    return 'HOT SPRING WEATHER';
  }

  if (icon === 'partly-sunny') {
    if (temperature >= 10) return 'OUTDOOR POOL WEATHER';
    if (temperature >= 5)  return 'SPA & HOT SPRING DAY';
    return 'HOT SPRING WEATHER';
  }

  // cloudy / foggy — the most common Reykjavík conditions
  if (temperature >= 10) return 'INDOOR POOL WEATHER';
  if (temperature >= 5)  return 'SPA & SAUNA WEATHER';
  if (temperature < 0)   return 'HOT SPRING WEATHER';
  return 'INDOOR & SAUNA DAY';
}
