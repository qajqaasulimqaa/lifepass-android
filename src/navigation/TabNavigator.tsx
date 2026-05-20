import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import CheckInScreen from '../screens/checkin/CheckInScreen';
import FavouritesScreen from '../screens/favourites/FavouritesScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import { colors } from '../theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.ink3,
          borderTopColor: colors.line,
        },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.paper3,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🗺</Text> }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ tabBarLabel: 'Check In', tabBarIcon: ({ color }) => <Text style={{ color }}>📷</Text> }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>❤️</Text> }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>📅</Text> }}
      />
    </Tab.Navigator>
  );
}
