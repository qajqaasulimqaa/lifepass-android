import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/explore/ExploreScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import type { ExploreStackParamList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
    </Stack.Navigator>
  );
}
