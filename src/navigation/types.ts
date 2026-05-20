import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
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
