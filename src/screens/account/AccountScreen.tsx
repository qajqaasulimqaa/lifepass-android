import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { useAuth } from '../../supabase/hooks/useAuth';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import { planDisplayName } from '../../supabase/types/subscription';
import Kicker from '../../components/Kicker';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Member';
  const email = user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  const planName = subscription ? planDisplayName(subscription) : null;

  // Current period end drives the "Renews/Ends on" line. When the plan is set
  // to cancel at period end it winds down rather than renews.
  const periodEndLabel = subscription
    ? `${subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${new Date(
        subscription.currentPeriodEndsAt,
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : null;

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try { await signOut(); } catch {
            setSigningOut(false);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  }

  function handleDelete() {
    // Matches iOS: deletion is completed in the web account area. (Apple
    // 5.1.1(v) requires the button to reach a working delete flow — the old
    // handler just signed out, deleting nothing.) Send the user to log in on
    // the website, where they can delete their account and all data.
    Alert.alert(
      'Delete account',
      "To delete your account, log in on our website. You'll be taken there now.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => Linking.openURL('https://www.lifepass.is/auth'),
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={15} color={colors.paper} />
        </TouchableOpacity>
        <Kicker text="Account" color={colors.paper2} />
        <View style={{ width: 36, height: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Member card ── */}
        <View style={memberCard.glowShell}>
          <LinearGradient
            colors={['rgba(0,136,255,0.85)', 'rgba(168,216,240,0.55)', 'rgba(58,161,255,0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={memberCard.gradientBorder}
          >
        <View style={memberCard.wrap}>

          {/* Avatar + name row */}
          <View style={memberCard.topRow}>
            <View style={memberCard.avatar}>
              <Text style={memberCard.avatarInitial}>{initial}</Text>
            </View>
            <View style={memberCard.nameBlock}>
              <Text style={memberCard.name}>{displayName}</Text>
              <View style={memberCard.emailRow}>
                <Ionicons name="mail-outline" size={11} color={colors.paper3} />
                <Text style={memberCard.email} numberOfLines={1}>{email}</Text>
              </View>
            </View>
            <View style={memberCard.memberBadge}>
              <Text style={memberCard.memberBadgeText}>Member</Text>
            </View>
          </View>

          {/* Plan summary row — v1 has no credit balance (ring removed) */}
          <View style={memberCard.creditRow}>
            {subLoading ? (
              <View style={{ height: 90, justifyContent: 'center' }}>
                <Ionicons name="reload-outline" size={20} color={colors.paper3} />
              </View>
            ) : (
              <>
                <View style={memberCard.creditText}>
                  <Kicker
                    text={planName ? `Plan · ${planName}` : 'No active plan'}
                    color={colors.paper2}
                  />
                  {periodEndLabel && (
                    <Text style={memberCard.renewal}>{periodEndLabel}</Text>
                  )}
                  {subscription?.status === 'past_due' && (
                    <View style={memberCard.luxuryChip}>
                      <Ionicons name="alert-circle" size={10} color={colors.skyBlue} />
                      <Text style={memberCard.luxuryChipText}>Payment due — access paused</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
          </LinearGradient>
        </View>

        {/* ── Membership section ── */}
        <View style={styles.section}>
          <View style={{ paddingHorizontal: 4 }}><Kicker text="Membership" color={colors.paper3} /></View>
          <View style={styles.card}>
            <Row
              title="Change plan"
              subtitle={planName ?? 'No active subscription'}
              onPress={() => navigation.navigate('TopUp')}
            />
            <RowDivider />
            <Row title="Purchase history" onPress={() => {}} />
          </View>
        </View>

        {/* ── Account section ── */}
        <View style={styles.section}>
          <View style={{ paddingHorizontal: 4 }}><Kicker text="Account" color={colors.paper3} /></View>
          <View style={styles.card}>
            <Row
              title="Language"
              subtitle="English"
              onPress={() => {}}
            />
            <RowDivider />
            <Row
              title="Notifications"
              onPress={() => Linking.openSettings()}
            />
            <RowDivider />
            <Row
              title="Help"
              subtitle="support@lifepass.is"
              onPress={() => Linking.openURL('mailto:support@lifepass.is')}
            />
            <RowDivider />
            <Row
              title={signingOut ? 'Signing out…' : 'Sign out'}
              dim
              onPress={handleSignOut}
            />
            <RowDivider />
            <Row
              title="Delete account"
              subtitle="Permanently remove all your data"
              destructive
              onPress={handleDelete}
            />
          </View>
        </View>

        {/* ── Legal footer ── */}
        <View style={styles.legalFooter}>
          <View style={styles.legalRow}>
            <TouchableOpacity>
              <Text style={styles.legalLink}>Terms</Text>
            </TouchableOpacity>
            <View style={styles.legalDot} />
            <TouchableOpacity>
              <Text style={styles.legalLink}>Privacy</Text>
            </TouchableOpacity>
            <View style={styles.legalDot} />
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:support@lifepass.is')}
            >
              <Text style={styles.legalLink}>Contact</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.legalSub}>Sporta ehf · Reykjavík, Iceland</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Row primitives ───────────────────────────────────────────────────────────

function RowDivider() {
  return <View style={rowStyles.divider} />;
}

function Row({
  title,
  subtitle,
  destructive = false,
  dim = false,
  onPress,
}: {
  title: string;
  subtitle?: string;
  destructive?: boolean;
  dim?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={rowStyles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            rowStyles.title,
            destructive && { color: colors.destructive },
            dim && { color: colors.paper3 },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={rowStyles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {!dim && (
        <Ionicons name="chevron-forward" size={13} color={colors.paper3} />
      )}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.line,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.paper,
  },
  subtitle: {
    fontSize: 11,
    color: colors.paper3,
    marginTop: 2,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const memberCard = StyleSheet.create({
  glowShell: {
    borderRadius: 18,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  gradientBorder: {
    borderRadius: 18,
    padding: 1.5,
  },
  wrap: {
    backgroundColor: colors.ink2,
    borderRadius: 17,
    padding: 20,
    gap: 20,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(168,216,240,0.3)',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  nameBlock: { flex: 1, gap: 4 },
  name: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.paper,
    letterSpacing: -0.4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  email: {
    fontSize: 12,
    color: colors.paper3,
  },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(168,216,240,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(168,216,240,0.3)',
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.skyBlue,
    letterSpacing: 0.5,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  creditText: {
    flex: 1,
    gap: 5,
  },
  renewal: {
    fontSize: 11,
    color: colors.paper3,
  },
  luxuryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  luxuryChipText: {
    fontSize: 11,
    color: colors.skyBlue,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 22,
  },

  section: { gap: 10 },
  card: {
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
    overflow: 'hidden',
  },

  legalFooter: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.paper4,
  },
  legalLink: {
    fontSize: 12,
    color: colors.paper3,
  },
  legalSub: {
    fontSize: 11,
    color: colors.paper4,
  },
});
