import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import Wordmark from '../../components/Wordmark';
import AuthField from '../../components/AuthField';
import PrimaryButton from '../../components/PrimaryButton';
import type { AuthStackScreenProps } from '../../navigation/types';

export default function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const insets = useSafeAreaInsets();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthenticated(true);
    }, 400);
  }

  return (
    <View style={styles.container}>
      {/* Radial glow behind wordmark */}
      <LinearGradient
        colors={['rgba(0,136,255,0.25)', 'transparent']}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Wordmark size={36} />
            <Text style={styles.tagline}>The everyday wellness pass.</Text>
          </View>

          <View style={styles.fields}>
            <AuthField
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError(null);
              }}
              secure
              autoComplete="current-password"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.cta}>
            <PrimaryButton
              title={loading ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
              loading={loading}
            />
          </View>

          <View style={styles.links}>
            <TouchableOpacity>
              <Text style={styles.forgot}>Forgot your password?</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupHint}>No account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 24, gap: 0 },
  brand: { alignItems: 'center', gap: 10, marginBottom: 48 },
  tagline: { fontSize: 16, fontStyle: 'italic', color: colors.paper2 },
  fields: { gap: 12 },
  error: {
    fontSize: 13,
    color: colors.destructive,
    textAlign: 'center',
    marginTop: 10,
  },
  cta: { marginTop: 22 },
  links: { marginTop: 20, alignItems: 'center', gap: 16 },
  forgot: { fontSize: 13, color: colors.paper2 },
  signupRow: { flexDirection: 'row', alignItems: 'center' },
  signupHint: { fontSize: 13, color: colors.paper3 },
  signupLink: { fontSize: 13, color: colors.blueMid, fontWeight: '600' },
});
