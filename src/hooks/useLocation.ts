import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

/**
 * The device's current location, or null until (and unless) a fix is granted.
 * Requests foreground permission once; on denial or error it stays null so
 * callers fall back to a default origin (e.g. Reykjavík centre).
 */
export function useLocation(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch {
        // No fix available — leave null; callers use a fallback origin.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return coords;
}
