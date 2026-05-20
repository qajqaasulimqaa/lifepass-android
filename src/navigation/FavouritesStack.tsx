import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FavouritesScreen from '../screens/favourites/FavouritesScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import type { FavouritesStackParamList } from './types';

const Stack = createNativeStackNavigator<FavouritesStackParamList>();

export default function FavouritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavouritesMain" component={FavouritesScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
    </Stack.Navigator>
  );
}
