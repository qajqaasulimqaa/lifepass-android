import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import CreditPill from './CreditPill';
import Kicker from './Kicker';
import { useSubscription } from '../supabase/hooks/useSubscription';

type Props = {
  title: string;
  subtitle?: string;
};

export default function BrandedTopBar({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { credits } = useSubscription();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.wordmarkContainer}>
          <Text>
            <Text style={styles.wordmarkLife}>Life</Text>
            <Text style={styles.wordmarkPass}>Pass</Text>
          </Text>
        </View>

        <View style={styles.center}>
          <Kicker text={title} color={colors.paper2} />
          {subtitle ? <Kicker text={subtitle} color={colors.paper3} /> : null}
        </View>

        <View style={styles.right}>
          <TouchableOpacity onPress={() => navigation.navigate('Account')} activeOpacity={0.7}>
            <CreditPill credits={credits} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  wordmarkContainer: { width: 80, alignItems: 'flex-start' },
  wordmarkLife: { fontSize: 19, color: colors.paper, fontStyle: 'italic' },
  wordmarkPass: { fontSize: 19, color: colors.paper, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 2 },
  right: { width: 80, alignItems: 'flex-end' },
});
