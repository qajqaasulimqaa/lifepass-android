/**
 * ProfileCreditCard
 *
 * Compact member card shown on the Bookings (Library) screen, above the
 * Bookings / Saved tabs. Gradient glowing border, avatar, name/email, and a
 * trailing plan badge — always visible and tappable ("VIEW PLANS" when
 * there's no active plan, the plan name when there is) so there's a quick
 * way into Plans. Mirrors the iOS LibraryView member card; v1 removed the
 * credit balance, so the old ring + TOP UP pill are gone.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { useAuth } from '../supabase/hooks/useAuth';
import { useSubscription } from '../supabase/hooks/useSubscription';
import { planDisplayName } from '../supabase/types/subscription';

export default function ProfileCreditCard() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Member';
  const email = user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();
  const planName = subscription ? planDisplayName(subscription) : null;

  return (
    // Outer shell: provides the glow shadow
    <View style={s.glowShell}>
      {/* Gradient border — 1.5px inset */}
      <LinearGradient
        colors={['rgba(63,121,186,0.85)', 'rgba(168,216,240,0.55)', 'rgba(98,149,206,0.3)']}
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
            </View>
          </View>

          {/* Right: plan badge → Plans */}
          <TouchableOpacity
            style={s.planBadge}
            onPress={() => navigation.navigate('TopUp')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.planBadgeText} numberOfLines={1}>
              {(planName ?? 'View plans').toUpperCase()}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.25)',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  nameBlock: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '600', color: colors.paper },
  email: { fontSize: 11, color: colors.paper3 },

  /* Plan badge (trailing) */
  planBadge: {
    maxWidth: 130,
    backgroundColor: 'rgba(168,216,240,0.1)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.skyBlue,
    letterSpacing: 0.8,
  },
});
