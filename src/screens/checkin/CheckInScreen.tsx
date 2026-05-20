import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export default function CheckInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>CheckIn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
});
