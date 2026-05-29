import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/explore/ExploreScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import AccountScreen from '../screens/account/AccountScreen';
import TopUpScreen from '../screens/account/TopUpScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import type { ExploreStackParamList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
    </Stack.Navigator>
  );
}
