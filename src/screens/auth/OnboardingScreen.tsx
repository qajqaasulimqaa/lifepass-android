import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import type { AuthStackScreenProps } from '../../navigation/types';

export default function OnboardingScreen({ navigation }: AuthStackScreenProps<'Onboarding'>) {
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);

  function handleGetStarted() {
    setHasSeenOnboarding(true);
    navigation.navigate('SignUp');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LifePass</Text>
      <Text style={styles.tagline}>Your city. Unlimited access.</Text>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get started</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>I already have an account</Text>
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
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
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
