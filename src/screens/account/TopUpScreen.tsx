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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import Kicker from '../../components/Kicker';
import PrimaryButton from '../../components/PrimaryButton';

// ─── Plan data (mirrors iOS Plan.swift) ───────────────────────────────────────

type Plan = {
  id: string;
  name: string;          // Full display name
  shortName: string;     // 'S' / 'M' / 'L' / 'XL'  or  marketing name for visitors
  subtitle: string;
  priceISK: number;
  totalCredits: number;
  dailyLimit: number;
  hasLuxury: boolean;
  luxuryVisitCap: number | null; // null = uncapped (visitors)
  isPopular: boolean;
  isLuxury: boolean;
  commitmentMonths: number;
  isSubscription: boolean;
};

const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'plan-s',
    name: 'Plan S',
    shortName: 'S',
    subtitle: 'Regular routine',
    priceISK: 14_900,
    totalCredits: 14,
    dailyLimit: 1,
    hasLuxury: false,
    luxuryVisitCap: null,
    isPopular: false,
    isLuxury: false,
    commitmentMonths: 3,
    isSubscription: true,
  },
  {
    id: 'plan-m',
    name: 'Plan M',
    shortName: 'M',
    subtitle: 'Active lifestyles, basic venues',
    priceISK: 25_500,
    totalCredits: 25,
    dailyLimit: 1,
    hasLuxury: false,
    luxuryVisitCap: null,
    isPopular: false,
    isLuxury: false,
    commitmentMonths: 3,
    isSubscription: true,
  },
  {
    id: 'plan-l',
    name: 'Plan L',
    shortName: 'L',
    subtitle: 'Luxury access',
    priceISK: 36_900,
    totalCredits: 36,
    dailyLimit: 1/2,
    hasLuxury: true,
    luxuryVisitCap: 6,
    isPopular: true,
    isLuxury: true,
    commitmentMonths: 3,
    isSubscription: true,
  },
  {
    id: 'plan-xl',
    name: 'Plan XL',
    shortName: 'XL',
    subtitle: 'Maximum access to all facilities',
    priceISK: 65_900,
    totalCredits: 65,
    dailyLimit: 3,
    hasLuxury: true,
    luxuryVisitCap: 15,
    isPopular: false,
    isLuxury: true,
    commitmentMonths: 3,
    isSubscription: true,
  },
];

const VISITOR_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'LayOver',
    shortName: 'LayOver',
    subtitle: 'Weekend wellness escape',
    priceISK: 10_900,
    totalCredits: 7,
    dailyLimit: 1,
    hasLuxury: true,
    luxuryVisitCap: null,
    isPopular: false,
    isLuxury: false,
    commitmentMonths: 0,
    isSubscription: false,
  },
  {
    id: 'explorer',
    name: 'Week Warrior',
    shortName: 'Week Warrior',
    subtitle: 'Weekly wellness adventure',
    priceISK: 20_500,
    totalCredits: 17,
    dailyLimit: 1,
    hasLuxury: true,
    luxuryVisitCap: null,
    isPopular: true,
    isLuxury: false,
    commitmentMonths: 0,
    isSubscription: false,
  },
  {
    id: 'wellness',
    name: 'Extended Stay',
    shortName: 'Extended Stay',
    subtitle: 'Extended wellness journey',
    priceISK: 37_500,
    totalCredits: 30,
    dailyLimit: 2,
    hasLuxury: true,
    luxuryVisitCap: null,
    isPopular: false,
    isLuxury: true,
    commitmentMonths: 0,
    isSubscription: false,
  },
  {
    id: 'ultimate',
    name: 'Becoming a Local',
    shortName: 'Becoming a Local',
    subtitle: 'Unlimited wellness experience',
    priceISK: 55_500,
    totalCredits: 46,
    dailyLimit: 3,
    hasLuxury: true,
    luxuryVisitCap: null,
    isPopular: false,
    isLuxury: true,
    commitmentMonths: 0,
    isSubscription: false,
  },
];

function formatISK(value: number): string {
  return value.toLocaleString('en-US').replace(/,/g, ',');
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TopUpScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<0 | 1>(0); // 0 = Monthly, 1 = One-off
  const [selectedId, setSelectedId] = useState<string>('plan-l');

  const plans = tab === 0 ? SUBSCRIPTION_PLANS : VISITOR_PLANS;
  const selectedPlan = plans.find((p) => p.id === selectedId) ?? plans[0];

  // When switching tabs, default to the most popular plan in that category
  function switchTab(next: 0 | 1) {
    setTab(next);
    const nextPlans = next === 0 ? SUBSCRIPTION_PLANS : VISITOR_PLANS;
    const popular = nextPlans.find((p) => p.isPopular) ?? nextPlans[0];
    setSelectedId(popular.id);
  }

  function handleContinue() {
    Alert.alert(
      `Continue with ${selectedPlan.name}`,
      `${formatISK(selectedPlan.priceISK)} ISK${selectedPlan.isSubscription ? '/month' : ' one-time'}\n\nCheckout will open in your browser.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () =>
            Alert.alert(
              'Coming soon',
              'Online checkout will be available in the next update.',
            ),
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.paper} />
        </TouchableOpacity>
        <Kicker text="Plans" color={colors.paper3} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <View style={styles.headline}>
          <View style={styles.headlineTitleBlock}>
            <Text style={styles.headlineBig}>Pay per visit</Text>
            <Text style={styles.headlineSmall}>or per month.</Text>
          </View>
          <Text style={styles.headlineSub}>
            You choose how you want to top up your credits. Monthly plans are great for locals and long-term visitors. Weekly plans are perfect for short stays.
          </Text>
        </View>

        {/* Segment toggle */}
        <View style={styles.segmentWrap}>
          <SegmentButton label="Monthly" active={tab === 0} onPress={() => switchTab(0)} />
          <SegmentButton label="Weekly" active={tab === 1} onPress={() => switchTab(1)} />
        </View>

        {/* Plan cards */}
        <View style={styles.planList}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedId === plan.id}
              onPress={() => setSelectedId(plan.id)}
            />
          ))}
        </View>

        {/* Fine print dots */}
        <View style={styles.finePrintRow}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.blue }]} />
            <Text style={styles.finePrintText}>Classic → Basic venues</Text>
          </View>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.skyBlue }]} />
            <Text style={styles.finePrintText}>Luxury → All venues</Text>
          </View>
        </View>

        <Text style={styles.commitment}>
          {selectedPlan.isSubscription
            ? '3-month commitment · Credits renew monthly · Cancel anytime after'
            : 'Credits expire 30 days after purchase · No rollovers · Luxury included'}
        </Text>
      </ScrollView>

      {/* CTA — floating pill at bottom-right, above tab bar */}
      <View style={[styles.cta, { bottom: tabBarHeight + 36 }]}>
        <PrimaryButton
          block={false}
          title={`Continue with ${selectedPlan.shortName} →`}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

// ─── Segment button ───────────────────────────────────────────────────────────

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[segStyles.btn, active && segStyles.btnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[segStyles.label, active && segStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const segStyles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  btnActive: { backgroundColor: colors.paper },
  label: { fontSize: 13, fontWeight: '600', color: colors.paper3 },
  labelActive: { color: colors.ink },
});

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}) {
  const priceTrail = plan.isSubscription ? '/mo' : 'one-time';
  const showBadge = plan.isPopular || plan.isLuxury;
  const badgeText = plan.isPopular ? 'MOST POPULAR' : 'LUXURY';
  const badgeBg = plan.isPopular ? colors.blue : colors.skyBlue;
  const badgeTextColor = plan.isPopular ? '#FFFFFF' : colors.ink;

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        plan.isPopular && cardStyles.cardPopular,
        selected && cardStyles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Badge */}
      {showBadge && (
        <View style={[cardStyles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[cardStyles.badgeText, { color: badgeTextColor }]}>{badgeText}</Text>
        </View>
      )}

      {/* Top row: letter + subtitle + price */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.nameBlock}>
          <Text style={cardStyles.letter}>{plan.shortName}</Text>
          <Text style={cardStyles.subtitle} numberOfLines={1}>
            {plan.subtitle}
          </Text>
        </View>
        <View style={cardStyles.priceBlock}>
          <Text style={cardStyles.price}>{formatISK(plan.priceISK)}</Text>
          <Text style={cardStyles.priceTrail}>ISK {priceTrail}</Text>
        </View>
      </View>

      {/* Bottom row: credits · daily limit · luxury */}
      <View style={cardStyles.bottomRow}>
        <Text style={cardStyles.credits}>{plan.totalCredits}</Text>
        <Text style={cardStyles.creditsLabel}> credits</Text>
        <Text style={cardStyles.sep}> · </Text>
        <Text style={cardStyles.detail}>{plan.dailyLimit} facilit{plan.dailyLimit === 1 ? 'y' : 'ies'} a day</Text>
        {plan.hasLuxury && (
          <>
            <Text style={cardStyles.sep}> · </Text>
            <Ionicons name="sparkles" size={11} color={colors.skyBlue} />
            <Text style={cardStyles.luxury}> Luxury venues</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12,
    overflow: 'visible',
  },
  cardPopular: {
    backgroundColor: 'rgba(0,136,255,0.07)',
    borderColor: 'rgba(0,136,255,0.28)',
  },
  cardSelected: {
    borderColor: colors.blue,
    borderWidth: 1.5,
  },
  badge: {
    position: 'absolute',
    top: -9,
    left: 18,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  nameBlock: { flex: 1, gap: 2 },
  letter: {
    fontSize: 34,
    fontWeight: '300',
    color: colors.paper,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: { fontSize: 13, color: colors.paper3 },
  priceBlock: { alignItems: 'flex-end', gap: 1 },
  price: { fontSize: 15, fontWeight: '600', color: colors.paper },
  priceTrail: { fontSize: 11, color: colors.paper3 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  credits: { fontSize: 13, fontWeight: '700', color: colors.blue },
  creditsLabel: { fontSize: 12, color: colors.paper3 },
  sep: { fontSize: 12, color: colors.paper3 },
  detail: { fontSize: 12, color: colors.paper3 },
  luxury: { fontSize: 12, color: colors.skyBlue, fontWeight: '500' },
});

// ─── Main styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 24 },

  headline: { gap: 12, paddingTop: 4 },
  headlineTitleBlock: { gap: 2 },
  headlineBig: {
    fontSize: 46,
    fontWeight: '300',
    color: colors.paper,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  headlineSmall: {
    fontSize: 28,
    fontWeight: '300',
    fontStyle: 'italic',
    color: colors.blueMid,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  headlineSub: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.paper2,
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  segmentWrap: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.ink3,
    borderRadius: 12,
    padding: 4,
    borderWidth: 0.5,
    borderColor: colors.line,
  },

  planList: { gap: 10 },

  finePrintRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  finePrintText: { fontSize: 11, color: colors.paper3 },

  commitment: {
    fontSize: 11,
    color: colors.paper4,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },

  cta: { position: 'absolute', right: 20 },
});
