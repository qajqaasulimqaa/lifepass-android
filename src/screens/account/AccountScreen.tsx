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
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { useAuth } from '../../supabase/hooks/useAuth';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import {
  totalCredits,
  hasLuxuryAccess,
  planDisplayName,
} from '../../supabase/types/subscription';
import Kicker from '../../components/Kicker';

// Plan quotas — mirrors Plan.swift static catalogue
const PLAN_QUOTAS: Record<string, number> = {
  'plan-s':   14,
  'plan-m':   25,
  'plan-l':   36,
  'plan-xl':  65,
  'starter':   7,
  'explorer': 17,
  'wellness': 30,
  'ultimate': 46,
};

// ─── Credit ring (SVG arc, matches iOS ZStack trim approach) ──────────────────

function CreditRing({
  credits,
  quota,
  size = 90,
  stroke = 4,
}: {
  credits: number;
  quota: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.min(Math.max(credits / Math.max(quota, 1), 0), 1);
  const offset = circumference * (1 - fraction);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* SVG ring — rotated so arc starts at top (−90°) */}
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track */}
        <SvgCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(230,242,255,0.1)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress arc */}
        <SvgCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={colors.skyBlue}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Inner label */}
      <Text style={ringStyles.number}>{credits}</Text>
      <Text style={ringStyles.of}>of {quota}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.paper,
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  of: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.paper3,
    textTransform: 'uppercase',
  },
});

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

  const credits = subscription ? totalCredits(subscription) : 0;
  const planName = subscription ? planDisplayName(subscription) : null;
  const luxuryAccess = subscription ? hasLuxuryAccess(subscription) : false;

  const planId = (subscription as any)?.plan ?? '';
  const planQuota = PLAN_QUOTAS[planId] ?? Math.max(credits, 1);

  const daysLeft = subscription?.expires_at
    ? Math.max(
        0,
        Math.round(
          (new Date(subscription.expires_at).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : null;

  const renewalLabel = subscription?.expires_at
    ? `Renews ${new Date(subscription.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
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
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => signOut() },
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
              <Text style={memberCard.email} numberOfLines={1}>{email}</Text>
            </View>
          </View>

          {/* Credit ring + text row */}
          <View style={memberCard.creditRow}>
            {subLoading ? (
              <View style={{ height: 90, justifyContent: 'center' }}>
                <Ionicons name="reload-outline" size={20} color={colors.paper3} />
              </View>
            ) : (
              <>
                <CreditRing credits={credits} quota={planQuota} />

                <View style={memberCard.creditText}>
                  {planName && (
                    <Kicker text={`Plan · ${planName}`} color={colors.paper2} />
                  )}
                  <Text style={memberCard.creditsLine}>
                    <Text style={memberCard.creditsBold}>{credits} credits left</Text>
                    <Text style={memberCard.creditsItalic}>, this month</Text>
                  </Text>
                  {renewalLabel && (
                    <Text style={memberCard.renewal}>{renewalLabel}</Text>
                  )}
                  {luxuryAccess && subscription?.luxury_visit_cap != null && (
                    <View style={memberCard.luxuryChip}>
                      <Ionicons name="sparkles" size={10} color={colors.skyBlue} />
                      <Text style={memberCard.luxuryChipText}>
                        {subscription.luxury_visits_used ?? 0}/
                        {subscription.luxury_visit_cap} luxury this month
                      </Text>
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
            <RowDivider />
            <Row title="Credit history" subtitle={`${credits} cr available`} onPress={() => {}} />
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
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line2,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameBlock: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.paper,
  },
  email: {
    fontSize: 12,
    color: colors.paper3,
    marginTop: 2,
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
  creditsLine: {
    fontSize: 18,
    lineHeight: 24,
  },
  creditsBold: {
    fontWeight: '600',
    color: colors.paper,
  },
  creditsItalic: {
    fontStyle: 'italic',
    color: colors.paper2,
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
