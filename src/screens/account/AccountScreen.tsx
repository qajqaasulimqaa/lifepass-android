import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { mockProfile, mockSubscription } from '../../data/mockAccount';
import Kicker from '../../components/Kicker';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const profile = mockProfile;
  const subscription = mockSubscription;
  const initial = profile.fullName.charAt(0).toUpperCase();
  const daysLeft = Math.round(
    (subscription.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          setSignOutLoading(true);
          setTimeout(() => setAuthenticated(false), 200);
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setAuthenticated(false) },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={[colors.blue, colors.blueMid, colors.skyBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(168,216,240,0.5)', 'transparent']}
            start={{ x: 0.7, y: 0.15 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.headerTopBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          </View>

          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Subscription card */}
          <View style={subStyles.card}>
            <View style={subStyles.headerRow}>
              <View style={{ flex: 1 }}>
                <Kicker text="Active subscription" color={colors.paper3} />
                <Text style={subStyles.planName}>{subscription.planDisplayName}</Text>
                <Text style={subStyles.expiry}>
                  Expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={subStyles.credits}>
                <Text style={subStyles.creditsValue}>{subscription.totalCredits}</Text>
                <Text style={subStyles.creditsLabel}>credits left</Text>
              </View>
            </View>

            {subscription.hasLuxuryAccess && subscription.luxuryVisitCap !== null && (
              <View style={subStyles.luxuryRow}>
                <Ionicons name="sparkles" size={11} color={colors.skyBlue} />
                <Text style={subStyles.luxuryText}>
                  Luxury visits · {subscription.luxuryVisitsUsed}/{subscription.luxuryVisitCap}{' '}
                  this month
                </Text>
              </View>
            )}
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            <MenuRow icon="card-outline" title="Purchase history" />
            <MenuRow icon="globe-outline" title="Language" value="English" />
            <MenuRow icon="notifications-outline" title="Notifications" />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={18} color={colors.paper} />
              <Text style={styles.actionText}>{signOutLoading ? 'Signing out…' : 'Sign out'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={handleDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              <Text style={[styles.actionText, { color: colors.destructive }]}>
                Delete account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.legal}>
            <TouchableOpacity>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
}) {
  return (
    <TouchableOpacity style={menuStyles.row} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={colors.paper} style={menuStyles.icon} />
      <Text style={menuStyles.title}>{title}</Text>
      {value && <Text style={menuStyles.value}>{value}</Text>}
      <Ionicons name="chevron-forward" size={14} color={colors.paper3} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },

  header: {
    height: 320,
    alignItems: 'center',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerTopBar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: { marginTop: 'auto' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#456231',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  content: { paddingHorizontal: 20, paddingTop: 24, gap: 24 },

  menu: {
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
    overflow: 'hidden',
  },

  actions: {
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionText: { fontSize: 15, fontWeight: '500', color: colors.paper },
  divider: { height: 0.5, backgroundColor: colors.line, marginHorizontal: 16 },

  legal: { alignItems: 'center', gap: 10, paddingTop: 8 },
  legalLink: { fontSize: 13, color: colors.paper3 },
});

const subStyles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  planName: { fontSize: 17, fontWeight: '700', color: colors.paper, marginTop: 6 },
  expiry: { fontSize: 12, color: colors.paper3, marginTop: 2 },
  credits: { alignItems: 'flex-end' },
  creditsValue: { fontSize: 26, fontWeight: '700', color: colors.blue },
  creditsLabel: { fontSize: 11, color: colors.paper3 },
  luxuryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.line,
  },
  luxuryText: { fontSize: 12, color: colors.skyBlue, fontWeight: '500' },
});

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  icon: { width: 24 },
  title: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.paper, marginLeft: 8 },
  value: { fontSize: 13, color: colors.paper3, marginRight: 8 },
});
