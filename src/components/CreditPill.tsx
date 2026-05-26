import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  credits: number;
  compact?: boolean;
};

export default function CreditPill({ credits, compact = false }: Props) {
  return (
    <View style={[styles.pill, compact && styles.pillCompact]}>
      <Text style={[styles.number, compact && styles.numberCompact]}>{credits}</Text>
      <Text style={styles.label}>CR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    // Frosted glass look — dark translucent body, faint light border.
    backgroundColor: 'rgba(20, 33, 57, 0.55)',
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  pillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  number: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.skyBlue,
    letterSpacing: -0.3,
  },
  numberCompact: {
    fontSize: 13,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.skyBlue,
    letterSpacing: 1.3,
    opacity: 0.85,
  },
});
