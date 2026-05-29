/**
 * ProfileCreditCard
 *
 * Compact member card shown on the Bookings screen (above Bookings / Saved tabs).
 * Features a gradient glowing border, SVG credit ring, and a TOP UP pill.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { useAuth } from '../supabase/hooks/useAuth';
import { useSubscription } from '../supabase/hooks/useSubscription';
import {
  totalCredits,
  planDisplayName,
  hasLuxuryAccess,
} from '../supabase/types/subscription';
import Kicker from './Kicker';

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

// ─── Credit ring ──────────────────────────────────────────────────────────────

function CreditRing({
  credits,
  quota,
  size = 66,
  stroke = 3.5,
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
        {/* Arc */}
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
      <Text style={ring.number}>{credits}</Text>
      <Text style={ring.label}>cr</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  number: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.paper,
    letterSpacing: -0.5,
    lineHeight: 21,
  },
  label: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.paper3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function ProfileCreditCard() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Member';
  const email = user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  const credits = subscription ? totalCredits(subscription) : 0;
  const planName = subscription ? planDisplayName(subscription) : null;
  const planId = (subscription as any)?.plan ?? '';
  const quota = PLAN_QUOTAS[planId] ?? Math.max(credits, 1);
  const luxury = subscription ? hasLuxuryAccess(subscription) : false;

  return (
    // Outer shell: provides the glow shadow
    <View style={s.glowShell}>
      {/* Gradient border — 1.5px inset */}
      <LinearGradient
        colors={['rgba(0,136,255,0.85)', 'rgba(168,216,240,0.55)', 'rgba(58,161,255,0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBorder}
      >
        {/* Inner card */}
        <TouchableOpacity
          style={s.card}
          onPress={() => navigation.navigate('Account')}
          activeOpacity={0.9}
        >
          {/* Left: avatar + info */}
          <View style={s.left}>
            <View style={s.avatar}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
            <View style={s.nameBlock}>
              <Text style={s.name} numberOfLines={1}>{displayName}</Text>
              <Text style={s.email} numberOfLines={1}>{email}</Text>
              {planName && (
                <View style={s.planRow}>
                  {luxury && (
                    <Ionicons name="sparkles" size={9} color={colors.skyBlue} />
                  )}
                  <Kicker text={planName} color={colors.paper3} />
                </View>
              )}
            </View>
          </View>

          {/* Right: ring + credits + top up */}
          <View style={s.right}>
            <CreditRing credits={credits} quota={quota} />
            <Text style={s.creditsLabel}>
              <Text style={s.creditsBold}>{credits}</Text>
              {' left'}
            </Text>
            <TouchableOpacity
              style={s.topUpBtn}
              onPress={() => navigation.navigate('TopUp')}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="flash" size={10} color={colors.skyBlue} />
              <Text style={s.topUpText}>TOP UP</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Shadow lives here so overflow: visible can work
  glowShell: {
    marginHorizontal: 20,
    borderRadius: 18,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },

  // 1.5px gradient ring acting as the border
  gradientBorder: {
    borderRadius: 18,
    padding: 1.5,
  },

  // Actual content surface
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ink2,
    borderRadius: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  /* Left column */
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.25)',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  nameBlock: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '600', color: colors.paper },
  email: { fontSize: 11, color: colors.paper3 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },

  /* Right column */
  right: {
    alignItems: 'center',
    gap: 5,
  },
  creditsLabel: { fontSize: 10, color: colors.paper3 },
  creditsBold: { fontWeight: '700', color: colors.paper },

  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(168,216,240,0.1)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topUpText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.skyBlue,
    letterSpacing: 0.8,
  },
});
