import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SuggestionChip } from '../../data/mockCoach';

type Props = {
  chips: SuggestionChip[];
  onSelect: (chip: SuggestionChip) => void;
};

/**
 * 2×2 grid of frosted-glass suggestion chips shown in the Coach empty state.
 * Same four chips as iOS; the caller decides whether a chip sends a prompt
 * or shows the category strip (chip.showsCategoryStrip).
 */
export default function SuggestionChips({ chips, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip.id}
          style={styles.chip}
          activeOpacity={0.7}
          onPress={() => onSelect(chip)}
        >
          <Text style={styles.label} numberOfLines={1}>
            {chip.text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  chip: {
    width: 155,
    height: 35,
    paddingHorizontal: 9,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
