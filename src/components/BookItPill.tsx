import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** Stretch to fill the parent's width (used on the Nearby card). */
  fullWidth?: boolean;
};

// Visual "Book it" CTA on the Home venue cards. The whole card is already the
// tap target (opens the venue detail), so this is a non-interactive pill — it
// avoids nested-tap conflicts, matching the iOS BookItPill.
export default function BookItPill({ fullWidth = false }: Props) {
  return (
    <View style={[styles.pill, fullWidth ? styles.fullWidth : styles.hugging]}>
      <Text style={styles.text}>Book it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.blue, // = iOS lpRust (#0088FF)
    borderRadius: 999,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  hugging: { paddingHorizontal: 14 },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
