import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { requestNotificationPermission } from './src/services/notifications';
import { completeAuthFromUrl } from './src/supabase/services/auth';

export default function App() {
  // Ask for notification permission once on first launch.
  // The handler (setNotificationHandler) is registered when the module loads.
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Complete email-confirmation / magic-link sign-in when the app is opened
  // via its lifepass:// deep link (mirrors iOS AuthService's .onOpenURL).
  useEffect(() => {
    const handle = (url: string | null) => {
      if (url) {
        completeAuthFromUrl(url).catch((e) => console.warn('[Auth] deep link failed:', e));
      }
    };
    Linking.getInitialURL().then(handle); // app was launched by the link
    const sub = Linking.addEventListener('url', ({ url }) => handle(url)); // already open
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
