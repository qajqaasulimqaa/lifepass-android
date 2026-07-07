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

// ─── Plan data (mirrors iOS Plan.swift — v1 product catalogue) ────────────────
//
// Keyed by the real v1 product slug (what POST /payments/checkout-sessions
// accepts). The hosted checkout page owns the price, so the app never
// displays an ISK figure. Credits and luxury were removed in v1; plans are
// tier allowances + premium surcharge, passes are prepaid visit packs.

type Plan = {
  id: string;           // v1 product slug (the checkout productSlug)
  name: string;
  subtitle: string;
  features: string[];   // qualitative — no fabricated credits/prices
  isPopular: boolean;
  isSubscription: boolean;
};

const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'plan-base',
    name: 'Base',
    subtitle: 'Get started',
    features: [
      'Monthly gym, studio & pool visits',
      'In-bundle venues included',
      'Premium venues pay-as-you-go',
      'Cancel after 3 months',
    ],
    isPopular: false,
    isSubscription: true,
  },
  {
    id: 'plan-plus',
    name: 'Plus',
    subtitle: 'The regular',
    features: [
      'More monthly visits than Base',
      'Member discount at premium venues',
      'In-bundle venues included',
      'Cancel after 3 months',
    ],
    isPopular: true,
    isSubscription: true,
  },
  {
    id: 'plan-max',
    name: 'Max',
    subtitle: 'Maximum access',
    features: [
      'The most monthly visits',
      'Best member discount at premium venues',
      'In-bundle venues included',
      'Cancel after 3 months',
    ],
    isPopular: false,
    isSubscription: true,
  },
];

const VISITOR_PASSES: Plan[] = [
  {
    id: 'pass-explorer',
    name: 'Explorer',
    subtitle: 'A taste of LifePass',
    features: ['3 visits', 'Valid 30 days', 'Use across in-bundle venues'],
    isPopular: false,
    isSubscription: false,
  },
  {
    id: 'pass-adventurer',
    name: 'Adventurer',
    subtitle: 'A proper stay',
    features: ['6 visits', 'Valid 60 days', 'Use across in-bundle venues'],
    isPopular: true,
    isSubscription: false,
  },
  {
    id: 'pass-local',
    name: 'Local',
    subtitle: 'Make it a habit',
    features: ['12 visits', 'Valid 90 days', 'Use across in-bundle venues'],
    isPopular: false,
    isSubscription: false,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TopUpScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<0 | 1>(0); // 0 = Monthly plans, 1 = Visitor passes
  const [selectedId, setSelectedId] = useState<string>('plan-plus');

  const plans = tab === 0 ? SUBSCRIPTION_PLANS : VISITOR_PASSES;
  const selectedPlan = plans.find((p) => p.id === selectedId) ?? plans[0];

  // When switching tabs, default to the most popular plan in that category
  function switchTab(next: 0 | 1) {
    setTab(next);
    const nextPlans = next === 0 ? SUBSCRIPTION_PLANS : VISITOR_PASSES;
    const popular = nextPlans.find((p) => p.isPopular) ?? nextPlans[0];
    setSelectedId(popular.id);
  }

  function handleContinue() {
    Alert.alert(
      `Continue with ${selectedPlan.name}`,
      'The price is shown securely at checkout.\n\nCheckout will open in your browser.',
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
            <Text style={styles.headlineBig}>Pay per visit,</Text>
            <Text style={styles.headlineSmall}>or per month.</Text>
          </View>
          <Text style={styles.headlineSub}>
            Pick a monthly plan or a prepaid visitor pass. The price is shown securely at checkout.
          </Text>
        </View>

        {/* Segment toggle */}
        <View style={styles.segmentWrap}>
          <SegmentButton label="Monthly plans" active={tab === 0} onPress={() => switchTab(0)} />
          <SegmentButton label="Visitor passes" active={tab === 1} onPress={() => switchTab(1)} />
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
            <Text style={styles.finePrintText}>In-bundle venues included</Text>
          </View>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.skyBlue }]} />
            <Text style={styles.finePrintText}>Premium venues pay-as-you-go</Text>
          </View>
        </View>

        <Text style={styles.commitment}>
          {selectedPlan.isSubscription
            ? 'Monthly subscription · 3-month minimum · Cancel anytime after · Price shown at checkout'
            : 'Prepaid visit pack · Price shown at checkout'}
        </Text>
      </ScrollView>

      {/* CTA — floating pill at bottom-right, above tab bar */}
      <View style={[styles.cta, { bottom: tabBarHeight + 36 }]}>
        <PrimaryButton
          block={false}
          title={`Continue with ${selectedPlan.name} →`}
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
      {plan.isPopular && (
        <View style={cardStyles.badge}>
          <Text style={cardStyles.badgeText}>MOST POPULAR</Text>
        </View>
      )}

      {/* Top row: name + subtitle */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.nameBlock}>
          <Text style={cardStyles.letter}>{plan.name}</Text>
          <Text style={cardStyles.subtitle} numberOfLines={1}>
            {plan.subtitle}
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={cardStyles.features}>
        {plan.features.map((feature) => (
          <View key={feature} style={cardStyles.featureRow}>
            <Ionicons name="checkmark" size={12} color={colors.blueMid} />
            <Text style={cardStyles.featureText}>{feature}</Text>
          </View>
        ))}
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
    backgroundColor: colors.blue,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#FFFFFF',
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
  features: { gap: 6 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: { fontSize: 12.5, color: colors.paper2, lineHeight: 18 },
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
