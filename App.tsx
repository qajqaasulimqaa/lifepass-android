import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { requestNotificationPermission } from './src/services/notifications';

export default function App() {
  // Ask for notification permission once on first launch.
  // The handler (setNotificationHandler) is registered when the module loads.
  useEffect(() => {
    requestNotificationPermission();
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
