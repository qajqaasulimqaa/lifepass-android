import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import AccountScreen from '../screens/account/AccountScreen';
import TopUpScreen from '../screens/account/TopUpScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
    </Stack.Navigator>
  );
}
