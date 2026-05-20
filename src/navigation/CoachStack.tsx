import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CoachScreen from '../screens/coach/CoachScreen';
import AccountScreen from '../screens/account/AccountScreen';
import type { CoachStackParamList } from './types';

const Stack = createNativeStackNavigator<CoachStackParamList>();

export default function CoachStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachMain" component={CoachScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
}
