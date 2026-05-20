import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  size?: number;
};

export default function Wordmark({ size = 22 }: Props) {
  return (
    <Text style={styles.text}>
      <Text style={[{ fontSize: size }, styles.italic]}>Life</Text>
      <Text style={[{ fontSize: size }, styles.bold]}>Pass</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { letterSpacing: -0.4 },
  italic: { color: colors.paper, fontStyle: 'italic' },
  bold: { color: colors.paper, fontWeight: '700' },
});
