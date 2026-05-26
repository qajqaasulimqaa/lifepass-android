import { useEffect, useState } from 'react';
import { fetchWeather, type WeatherSnapshot } from '../services/weather';

type WeatherState = {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetches current Reykjavík weather once on mount.  Doesn't auto-refresh —
 * the hero doesn't need second-by-second data and we'd rather not hammer
 * Open-Meteo. If a longer session calls for it, we can add a periodic
 * refetch later.
 */
export function useWeather(): WeatherState {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => { if (!cancelled) setWeather(w); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Weather unavailable'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { weather, loading, error };
}
