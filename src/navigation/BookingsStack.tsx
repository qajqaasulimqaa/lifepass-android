import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import type { BookingsStackParamList } from './types';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export default function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsMain" component={BookingsScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
    </Stack.Navigator>
  );
}
