import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import Kicker from './Kicker';
import Wordmark from './Wordmark';

type Props = {
  title: string;
  subtitle?: string;
  /**
   * Trailing button: a person icon everywhere (one-tap path into Account),
   * or a settings gear on the Library/profile screen — mirrors the iOS
   * BrandedTopBar. (v1 removed the credit balance, so the old credit pill
   * is gone.)
   */
  trailing?: 'person' | 'settings';
};

export default function BrandedTopBar({ title, subtitle, trailing = 'person' }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.wordmarkContainer}>
          <Wordmark height={18} />
        </View>

        <View style={styles.center}>
          <Kicker text={title} color={colors.paper2} />
          {subtitle ? <Kicker text={subtitle} color={colors.paper3} /> : null}
        </View>

        <View style={styles.right}>
          <TouchableOpacity
            style={styles.trailingBtn}
            onPress={() => navigation.navigate('Account')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={trailing === 'settings' ? 'settings-outline' : 'person-circle-outline'}
              size={trailing === 'settings' ? 18 : 22}
              color={colors.paper2}
            />
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
  wordmarkContainer: { width: 80, alignItems: 'flex-start', paddingTop: 3 },
  center: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 2 },
  right: { width: 80, alignItems: 'flex-end' },
  trailingBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink2,
    borderWidth: 0.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
