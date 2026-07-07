import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { priceLabel, isPremium } from '../types/venue';
import type { Venue } from '../types/venue';

type Props = {
  venue: Pick<
    Venue,
    'inBundle' | 'surchargePrice' | 'resolvedSurchargePrice' | 'topupPrice' | 'daypassPrice' | 'primaryCategory'
  >;
  compact?: boolean;
};

// Venue price tag — "Included" / "from ISK X" / "Limited visits", same
// rules as the iOS venue cards (VenuePricePill): moss-tinted for in-bundle
// so "Included" reads as a green marker, sky-blue for premium. Replaces
// CreditPill on venue UI now that the credit wallet is gone backend-side.
export default function PricePill({ venue, compact = false }: Props) {
  const premium = isPremium(venue);
  const tint = premium ? colors.skyBlue : colors.moss;
  return (
    <View
      style={[
        styles.pill,
        compact && styles.pillCompact,
        { backgroundColor: `${tint}1A`, borderColor: `${tint}33` }, // tint @10% / @20%
      ]}
    >
      <Text
        style={[styles.label, compact && styles.labelCompact, { color: tint }]}
        numberOfLines={1}
      >
        {priceLabel(venue)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 11,
  },
});
