import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// App-level navigation handle so the deep-link listener in App.tsx can route
// an incoming venue-QR App Link (`https://lifepass.is/scan?v=<uuid>`) into the
// Check-in tab from outside any screen (mirrors iOS parking
// `pendingScanVenueId` and routing via MainTabView).
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Route into the Check-in tab and auto-run the walk-in for `venueId`.
 * Returns false when the navigator isn't mounted yet (e.g. a cold-start deep
 * link before NavigationContainer is ready, or the user is signed out) so the
 * caller can park the id and flush it on `onReady`.
 */
export function routeToCheckIn(venueId: string): boolean {
  if (!navigationRef.isReady()) return false;
  // Nested target: Main (root) → CheckIn (tab) → CheckInMain (screen). The
  // param tree is awkward to type through the ref, so cast the call signature
  // at the boundary.
  const navigate = navigationRef.navigate as (name: string, params?: object) => void;
  navigate('Main', {
    screen: 'CheckIn',
    params: { screen: 'CheckInMain', params: { autoCheckInVenueId: venueId } },
  });
  return true;
}
