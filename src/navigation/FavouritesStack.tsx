import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FavouritesScreen from '../screens/favourites/FavouritesScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import AccountScreen from '../screens/account/AccountScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import type { FavouritesStackParamList } from './types';

const Stack = createNativeStackNavigator<FavouritesStackParamList>();

export default function FavouritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavouritesMain" component={FavouritesScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
    </Stack.Navigator>
  );
}
