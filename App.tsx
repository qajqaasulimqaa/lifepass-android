import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef, routeToCheckIn } from './src/navigation/navigationRef';
import { requestNotificationPermission } from './src/services/notifications';
import { completeAuthFromUrl } from './src/supabase/services/auth';
import { venueIdFromScan } from './src/checkin/walkInQrParser';

export default function App() {
  // A venue-QR App Link that arrives before the navigator is mounted (cold
  // start) is parked here and flushed from NavigationContainer's onReady.
  const pendingScanVenueId = useRef<string | null>(null);

  // Ask for notification permission once on first launch.
  // The handler (setNotificationHandler) is registered when the module loads.
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Handle incoming deep links: the auth callback (token exchange, no nav) and
  // the venue-QR App Link `https://lifepass.is/scan?v=<uuid>` (route into
  // Check-in). Mirrors iOS handleIncomingURL / routeScanURL.
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      // Auth callback first — it's a token exchange, not a navigation.
      if (url.includes('auth/callback')) {
        completeAuthFromUrl(url).catch((e) => console.warn('[Auth] deep link failed:', e));
        return;
      }
      // Venue check-in scan link.
      const venueId = venueIdFromScan(url);
      if (venueId && !routeToCheckIn(venueId)) {
        pendingScanVenueId.current = venueId; // navigator not ready yet
      }
    };
    Linking.getInitialURL().then(handle); // app was launched by the link
    const sub = Linking.addEventListener('url', ({ url }) => handle(url)); // already open
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          const parked = pendingScanVenueId.current;
          if (parked) {
            pendingScanVenueId.current = null;
            routeToCheckIn(parked);
          }
        }}
      >
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
