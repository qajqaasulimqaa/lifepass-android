import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import CheckInScreen from '../screens/checkin/CheckInScreen';
import FavouritesStack from './FavouritesStack';
import BookingsStack from './BookingsStack';
import CustomTabBar from './CustomTabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="Favourites" component={FavouritesStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
    </Tab.Navigator>
  );
}
