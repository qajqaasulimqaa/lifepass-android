import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import type { AuthStackScreenProps } from '../../navigation/types';

export default function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <TouchableOpacity style={styles.button} onPress={() => setAuthenticated(true)}>
        <Text style={styles.buttonText}>Log in (stub)</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>No account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: colors.skyBlue,
    fontSize: 14,
  },
});
