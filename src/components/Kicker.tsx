import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  text: string;
  color?: string;
};

export default function Kicker({ text, color = colors.paper3 }: Props) {
  return (
    <Text style={[styles.kicker, { color }]}>{text.toUpperCase()}</Text>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
  },
});
