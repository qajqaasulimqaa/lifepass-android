import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { RecentCheckIn } from '../types/profile';
import { fetchRecentCheckIn } from '../services/profile';

/**
 * The member's recent check-in (staff proof), or null. Re-reads `GET /profile`
 * every time the screen regains focus — a member who checked in and tabbed back
 * to Home must see the banner, and the server drops the field once its window
 * lapses, so a stale value should clear on the next focus. Mirrors iOS Home's
 * `.task { await appState.loadProfile() }`.
 */
export function useRecentCheckIn(): RecentCheckIn | null {
  const [checkIn, setCheckIn] = useState<RecentCheckIn | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchRecentCheckIn().then((c) => {
        if (active) setCheckIn(c);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return checkIn;
}
