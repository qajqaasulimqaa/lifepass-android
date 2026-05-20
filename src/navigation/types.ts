import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
};

type SharedTabRoutes = {
  VenueDetail: { venueId: string };
  Account: undefined;
  BookingFlow: { venueId: string; activityId: string };
};

export type HomeStackParamList = SharedTabRoutes & {
  HomeMain: undefined;
};

export type ExploreStackParamList = SharedTabRoutes & {
  ExploreMain: undefined;
};

export type FavouritesStackParamList = SharedTabRoutes & {
  FavouritesMain: undefined;
};

export type BookingsStackParamList = SharedTabRoutes & {
  BookingsMain: undefined;
};

export type CheckInStackParamList = {
  CheckInMain: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  CheckIn: undefined;
  Favourites: undefined;
  Bookings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    TabScreenProps<keyof TabParamList>
  >;

export type ExploreStackScreenProps<T extends keyof ExploreStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ExploreStackParamList, T>,
    TabScreenProps<keyof TabParamList>
  >;
