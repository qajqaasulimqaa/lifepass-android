import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import WaveIcon from '../components/WaveIcon';
import ProfileIcon from '../components/ProfileIcon';

type TabConfig = {
  routeName: 'Home' | 'Explore' | 'CheckIn' | 'Coach' | 'Bookings';
  label: string;
  /** Standard Ionicons name. If omitted, renderIcon must be provided. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Custom icon renderer — receives (color, size, isActive) */
  renderIcon?: (color: string, size: number, isActive: boolean) => React.ReactNode;
};

const LEFT_TABS: TabConfig[] = [
  { routeName: 'Home',    label: 'Home',    icon: 'home-outline' },
  { routeName: 'Explore', label: 'Explore', icon: 'search-outline' },
];

const RIGHT_TABS: TabConfig[] = [
  {
    routeName: 'Coach',
    label: 'Coach',
    renderIcon: (color, size, isActive) => (
      <WaveIcon size={size} color={color} strokeWidth={isActive ? 2.2 : 1.5} />
    ),
  },
  {
    routeName: 'Bookings',
    label: 'Profile',
    renderIcon: (color, size, isActive) => (
      <ProfileIcon size={size} color={color} strokeWidth={isActive ? 2.2 : 1.5} />
    ),
  },
];

const BAR_HEIGHT = 76;

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index].name;

  function navigateTo(routeName: string) {
    navigation.navigate(routeName);
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(15,23,42,0.0)',
          'rgba(15,23,42,0.60)',
          'rgba(15,23,42,0.92)',
          colors.ink,
          colors.ink,
        ]}
        locations={[0, 0.22, 0.45, 0.65, 1.0]}
        style={[styles.gradient, { height: BAR_HEIGHT + insets.bottom + 24 }]}
      />

      {/* Hairline */}
      <View style={[styles.hairline, { bottom: insets.bottom + BAR_HEIGHT - 20 }]} />

      <View style={[styles.row, { height: BAR_HEIGHT }]}>
        {LEFT_TABS.map((tab) => (
          <TabButton
            key={tab.routeName}
            tab={tab}
            isActive={activeRoute === tab.routeName}
            onPress={() => navigateTo(tab.routeName)}
          />
        ))}

        <CenterScanButton
          isActive={activeRoute === 'CheckIn'}
          onPress={() => navigateTo('CheckIn')}
        />

        {RIGHT_TABS.map((tab) => (
          <TabButton
            key={tab.routeName}
            tab={tab}
            isActive={activeRoute === tab.routeName}
            onPress={() => navigateTo(tab.routeName)}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const color = isActive ? colors.paper : colors.paper3;

  function renderIcon() {
    if (tab.renderIcon) {
      return tab.renderIcon(color, 22, isActive);
    }
    const iconName: keyof typeof Ionicons.glyphMap = isActive
      ? (String(tab.icon).replace('-outline', '') as keyof typeof Ionicons.glyphMap)
      : (tab.icon as keyof typeof Ionicons.glyphMap);
    return <Ionicons name={iconName} size={24} color={color} />;
  }

  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress} activeOpacity={0.7}>
      {renderIcon()}
      <Text style={[styles.label, { color, opacity: isActive ? 1 : 0.7 }]}>
        {tab.label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

function CenterScanButton({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
  return (
    <View style={styles.centerContainer}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.centerTouchable}>
        <LinearGradient
          colors={[colors.blueMid, colors.blue]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerCircle}
        >
          <Ionicons name="qr-code-outline" size={26} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '100%',
  },
  label: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTouchable: {
    marginTop: -44,
    ...Platform.select({
      ios: {
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  centerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.ink,
  },
});
